import time
from collections import defaultdict, deque
from uuid import uuid4

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.responses import BuildOSError, error_response, success_response
from app.db.base import Base
from app.db.session import engine

configure_logging()
logger = structlog.get_logger()

app = FastAPI(title="BuildOS API", version="0.1.0", description="Idea to app, automatically.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_rate_buckets: dict[str, deque[float]] = defaultdict(deque)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid4()))
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = _rate_buckets[client_ip]
    while bucket and now - bucket[0] > 60:
        bucket.popleft()
    if len(bucket) >= 180:
        return error_response("RATE_LIMITED", "Too many requests. Please slow down.", 429)
    bucket.append(now)
    structlog.contextvars.bind_contextvars(request_id=request_id, path=request.url.path)
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.exception_handler(BuildOSError)
async def buildos_error_handler(_: Request, exc: BuildOSError):
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "BUILDOS_ERROR", "message": str(exc.detail)}
    return error_response(detail.get("code", "BUILDOS_ERROR"), detail.get("message", "BuildOS error"), exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": exc.errors(),
            },
        },
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    logger.exception("unhandled_error", path=request.url.path, error=str(exc))
    return error_response("INTERNAL_SERVER_ERROR", "Unexpected server error.", 500)


@app.on_event("startup")
def on_startup() -> None:
    production_issues = settings.validate_production()
    if production_issues:
        raise RuntimeError("BuildOS production configuration is invalid: " + "; ".join(production_issues))
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    logger.info("buildos_api_started", env=settings.app_env)


@app.get("/")
def root():
    return success_response({"name": "BuildOS API", "docs": "/docs"}, "BuildOS API is running")


@app.get("/health")
def health():
    return success_response({"status": "ok", "environment": settings.app_env}, "API healthy")


@app.get("/metrics")
def metrics():
    return {
        "buildos_requests_window_clients": len(_rate_buckets),
        "buildos_app_env": settings.app_env,
        "buildos_rate_limit_per_minute": 180,
    }


app.include_router(router)
