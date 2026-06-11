import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.responses import BuildOSError
from app.core.security import assess_prompt_risk
from app.models import Project, Requirement, User
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.audit import log_audit
from app.services.serializers import project_to_dict


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "project"


def create_project(db: Session, *, user: User, payload: ProjectCreate) -> dict:
    risk = assess_prompt_risk(payload.idea + " " + " ".join(payload.required_features))
    project = Project(
        user_id=user.id,
        name=payload.name,
        slug=slugify(payload.name),
        idea=payload.idea,
        target_users=payload.target_users,
        preferred_stack=payload.preferred_stack,
        complexity=payload.complexity,
        status="needs_review" if risk["risk_level"] == "high" else "created",
    )
    db.add(project)
    db.flush()
    requirement = Requirement(
        project_id=project.id,
        raw_input=payload.idea,
        structured_json={
            "target_users": payload.target_users,
            "required_features": payload.required_features,
            "deployment_preference": payload.deployment_preference,
            "ai_features_required": payload.ai_features_required,
            "prompt_risk": risk,
        },
    )
    db.add(requirement)
    log_audit(
        db,
        action="project.created",
        user_id=user.id,
        project_id=project.id,
        metadata={"risk": risk, "complexity": payload.complexity},
    )
    db.commit()
    db.refresh(project)
    return project_to_dict(project)


def list_projects(db: Session, *, user: User) -> list[dict]:
    projects = db.scalars(select(Project).where(Project.user_id == user.id).order_by(Project.created_at.desc())).all()
    return [project_to_dict(project) for project in projects]


def get_project_or_404(db: Session, *, project_id: str, user: User | None = None) -> Project:
    query = select(Project).where(Project.id == project_id)
    if user is not None:
        query = query.where(Project.user_id == user.id)
    project = db.scalar(query)
    if not project:
        raise BuildOSError("PROJECT_NOT_FOUND", "Project was not found.", 404)
    return project


def update_project(db: Session, *, project: Project, payload: ProjectUpdate, user: User) -> dict:
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(project, field, value)
    if payload.name:
        project.slug = slugify(payload.name)
    log_audit(db, action="project.updated", user_id=user.id, project_id=project.id, metadata=payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(project)
    return project_to_dict(project)


def delete_project(db: Session, *, project: Project, user: User) -> None:
    project.status = "archived"
    log_audit(db, action="project.archived", user_id=user.id, project_id=project.id)
    db.commit()

