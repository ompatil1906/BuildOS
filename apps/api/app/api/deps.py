from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.responses import BuildOSError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise BuildOSError("AUTH_REQUIRED", "Authentication is required.", 401)
    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise BuildOSError("INVALID_TOKEN", "Invalid or expired access token.", 401)
    user = db.scalar(select(User).where(User.id == payload["sub"]))
    if not user:
        raise BuildOSError("USER_NOT_FOUND", "Authenticated user was not found.", 401)
    return user

