from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.responses import BuildOSError
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.services.audit import log_audit
from app.services.serializers import user_to_dict


def signup_user(db: Session, *, name: str, email: str, password: str) -> dict:
    existing = db.scalar(select(User).where(User.email == email.lower()))
    if existing:
        raise BuildOSError("EMAIL_ALREADY_REGISTERED", "A user with this email already exists.", 409)
    user = User(name=name, email=email.lower(), hashed_password=hash_password(password))
    db.add(user)
    db.flush()
    log_audit(db, action="user.signup", user_id=user.id)
    db.commit()
    token = create_access_token(user.id, {"email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user_to_dict(user)}


def authenticate_user(db: Session, *, email: str, password: str) -> dict:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if not user or not verify_password(password, user.hashed_password):
        raise BuildOSError("INVALID_CREDENTIALS", "Invalid email or password.", 401)
    log_audit(db, action="user.login", user_id=user.id)
    db.commit()
    token = create_access_token(user.id, {"email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user_to_dict(user)}

