from typing import Any

from fastapi import HTTPException
from fastapi.responses import JSONResponse


def success_response(data: Any = None, message: str = "Operation completed successfully") -> dict[str, Any]:
    return {"success": True, "data": data if data is not None else {}, "message": message}


def error_response(code: str, message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": {"code": code, "message": message}},
    )


class BuildOSError(HTTPException):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(status_code=status_code, detail={"code": code, "message": message})

