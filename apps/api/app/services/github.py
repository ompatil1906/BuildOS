import hashlib

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.responses import BuildOSError
from app.models import Approval, GitHubConnection, GitHubRepository, Project, User
from app.schemas.generated import GitHubActionRequest, GitHubConnectRequest
from app.services.audit import log_audit
from app.services.serializers import github_repo_to_dict


def _safe_token_placeholder(token: str) -> str:
    if not token:
        return "not-provided"
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def connect_github(db: Session, *, user: User, payload: GitHubConnectRequest) -> dict:
    connection = GitHubConnection(
        user_id=user.id,
        github_username=payload.github_username,
        access_token_encrypted=_safe_token_placeholder(payload.access_token),
    )
    db.add(connection)
    log_audit(db, action="github.connected", user_id=user.id, metadata={"username": payload.github_username})
    db.commit()
    db.refresh(connection)
    return {
        "id": connection.id,
        "github_username": connection.github_username,
        "connected": True,
        "token_storage": "hashed-placeholder",
    }


def _require_approved_action(db: Session, approval_id: str | None, action_type: str, project_id: str) -> Approval:
    if not approval_id:
        raise BuildOSError("APPROVAL_REQUIRED", f"{action_type} requires an approved approval_id.", 403)
    approval = db.get(Approval, approval_id)
    if not approval or approval.project_id != project_id:
        raise BuildOSError("APPROVAL_NOT_FOUND", "Approval request was not found for this project.", 404)
    if approval.action_type != action_type:
        raise BuildOSError("APPROVAL_ACTION_MISMATCH", "Approval action type does not match the requested action.", 409)
    if approval.status != "approved":
        raise BuildOSError("APPROVAL_REQUIRED", "This action has not been approved.", 403)
    return approval


def create_repo(db: Session, *, project: Project, user: User, payload: GitHubActionRequest) -> dict:
    _require_approved_action(db, payload.approval_id, "github.create_repo", project.id)
    repo_name = payload.repo_name or project.slug
    repo_url = f"https://github.com/demo-user/{repo_name}"
    repo = GitHubRepository(
        project_id=project.id,
        repo_name=repo_name,
        repo_url=repo_url,
        branch_name=payload.branch_name,
        status="simulated_repo_created" if payload.demo_mode else "real_mode_requires_provider_hook",
    )
    db.add(repo)
    log_audit(
        db,
        action="github.repo_created",
        user_id=user.id,
        project_id=project.id,
        metadata={"repo_name": repo_name, "demo_mode": payload.demo_mode},
    )
    db.commit()
    db.refresh(repo)
    return github_repo_to_dict(repo) or {}


def create_pr(db: Session, *, project: Project, user: User, payload: GitHubActionRequest) -> dict:
    _require_approved_action(db, payload.approval_id, "github.create_pr", project.id)
    repo = db.scalar(
        select(GitHubRepository).where(GitHubRepository.project_id == project.id).order_by(GitHubRepository.created_at.desc())
    )
    if not repo:
        repo = GitHubRepository(
            project_id=project.id,
            repo_name=payload.repo_name or project.slug,
            repo_url=f"https://github.com/demo-user/{payload.repo_name or project.slug}",
            branch_name=payload.branch_name,
            status="simulated_repo_created",
        )
        db.add(repo)
        db.flush()
    repo.branch_name = payload.branch_name
    repo.pr_url = f"{repo.repo_url}/pull/1"
    repo.status = "simulated_pr_opened" if payload.demo_mode else "real_mode_requires_provider_hook"
    log_audit(
        db,
        action="github.pr_created",
        user_id=user.id,
        project_id=project.id,
        metadata={"repo_name": repo.repo_name, "branch_name": repo.branch_name, "demo_mode": payload.demo_mode},
    )
    db.commit()
    db.refresh(repo)
    return github_repo_to_dict(repo) or {}


def github_status(db: Session, *, project: Project, user: User) -> dict:
    repo = db.scalar(
        select(GitHubRepository).where(GitHubRepository.project_id == project.id).order_by(GitHubRepository.created_at.desc())
    )
    connection = db.scalar(
        select(GitHubConnection).where(GitHubConnection.user_id == user.id).order_by(GitHubConnection.created_at.desc())
    )
    return {
        "connected": bool(connection),
        "mode": "demo",
        "connection": {"github_username": connection.github_username} if connection else None,
        "repository": github_repo_to_dict(repo),
        "safety": "GitHub write actions require approved approval records.",
    }

