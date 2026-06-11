from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PROMPT_INJECTION_PATTERNS = [
    "ignore previous instructions",
    "reveal system prompt",
    "exfiltrate secrets",
    "run shell command",
    "delete files",
    "send token",
    "bypass approval",
    "commit directly to main",
    "read server secrets",
    "force push",
]

ALLOWED_TOOL_ACTIONS = {
    "generate_text",
    "generate_file",
    "save_to_database",
    "create_github_branch",
    "create_github_pr",
    "simulate_build",
    "retrieve_context",
}

DENIED_TOOL_ACTIONS = {
    "execute_shell",
    "deploy_production",
    "delete_repository",
    "force_push",
    "read_server_secrets",
    "expose_environment",
}


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_context.verify(password, hashed_password)


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


def assess_prompt_risk(text: str) -> dict[str, Any]:
    lowered = text.lower()
    matches = [pattern for pattern in PROMPT_INJECTION_PATTERNS if pattern in lowered]
    risk_level = "high" if matches else "low"
    return {
        "risk_level": risk_level,
        "allowed": not matches,
        "matches": matches,
        "message": "Human review required before external tool actions." if matches else "No obvious prompt injection detected.",
    }


def ensure_tool_allowed(action: str) -> None:
    if action in DENIED_TOOL_ACTIONS or action not in ALLOWED_TOOL_ACTIONS:
        raise PermissionError(f"Tool action '{action}' is not allowed by BuildOS policy.")

