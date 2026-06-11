from sqlalchemy.orm import Session

from app.models import AuditLog


def log_audit(
    db: Session,
    *,
    action: str,
    user_id: str | None = None,
    project_id: str | None = None,
    metadata: dict | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        action=action,
        user_id=user_id,
        project_id=project_id,
        metadata_json=metadata or {},
        ip_address=ip_address,
    )
    db.add(entry)
    db.flush()
    return entry

