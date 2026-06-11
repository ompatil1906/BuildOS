from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.responses import BuildOSError
from app.models import Approval, Project, User
from app.schemas.generated import ApprovalCreate
from app.services.audit import log_audit
from app.services.serializers import approval_to_dict


def create_approval(db: Session, *, project: Project, user: User, payload: ApprovalCreate) -> dict:
    approval = Approval(
        project_id=project.id,
        action_type=payload.action_type,
        action_summary=payload.action_summary,
        risk_level=payload.risk_level,
        payload_json=payload.payload_json,
        requested_by=user.id,
    )
    db.add(approval)
    db.flush()
    log_audit(
        db,
        action="approval.requested",
        user_id=user.id,
        project_id=project.id,
        metadata={"approval_id": approval.id, "action_type": approval.action_type, "risk_level": approval.risk_level},
    )
    db.commit()
    db.refresh(approval)
    return approval_to_dict(approval)


def list_approvals(db: Session, *, project: Project) -> list[dict]:
    approvals = db.scalars(
        select(Approval).where(Approval.project_id == project.id).order_by(Approval.created_at.desc())
    ).all()
    return [approval_to_dict(approval) for approval in approvals]


def get_approval_or_404(db: Session, *, approval_id: str) -> Approval:
    approval = db.get(Approval, approval_id)
    if not approval:
        raise BuildOSError("APPROVAL_NOT_FOUND", "Approval request was not found.", 404)
    return approval


def decide_approval(db: Session, *, approval: Approval, user: User, approved: bool) -> dict:
    if approval.status != "pending":
        raise BuildOSError("APPROVAL_ALREADY_DECIDED", "This approval has already been decided.", 409)
    approval.status = "approved" if approved else "rejected"
    approval.approved_by = user.id if approved else None
    approval.decided_at = datetime.now(timezone.utc)
    log_audit(
        db,
        action="approval.approved" if approved else "approval.rejected",
        user_id=user.id,
        project_id=approval.project_id,
        metadata={"approval_id": approval.id, "action_type": approval.action_type},
    )
    db.commit()
    db.refresh(approval)
    return approval_to_dict(approval)

