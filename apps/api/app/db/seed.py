from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Architecture, BuildReport, GeneratedFile, Organization, PRD, Project, Requirement, Task, User
from app.services.audit import log_audit
from app.services.generation import generate_architecture, generate_code, generate_prd, generate_tasks, simulate_build


DEMO_EMAIL = "demo@buildos.dev"
DEMO_PASSWORD = "buildos-demo"


def seed_demo_data(db: Session) -> None:
    user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
    if not user:
        user = User(name="BuildOS Demo", email=DEMO_EMAIL, hashed_password=hash_password(DEMO_PASSWORD), role="founder")
        db.add(user)
        db.flush()
        org = Organization(name="BuildOS Demo Org", owner_id=user.id)
        db.add(org)
        db.flush()
        log_audit(db, action="demo.user_seeded", user_id=user.id)
        db.commit()

    project = db.scalar(select(Project).where(Project.slug == "supportflow-ai", Project.user_id == user.id))
    if not project:
        project = Project(
            user_id=user.id,
            name="SupportFlow AI",
            slug="supportflow-ai",
            idea="AI-powered customer support ticket SaaS for ecommerce brands.",
            target_users="Small ecommerce support teams, store owners, and operations managers",
            preferred_stack="Next.js, FastAPI, PostgreSQL",
            complexity="standard",
            status="created",
        )
        db.add(project)
        db.flush()
        requirement = Requirement(
            project_id=project.id,
            raw_input="Build an AI customer support ticket SaaS with login, dashboard, ticket management, AI priority detection, analytics, and deployment pipeline.",
            structured_json={
                "required_features": [
                    "Login",
                    "Ticket dashboard",
                    "Ticket CRUD",
                    "AI priority detection",
                    "Admin panel",
                    "Analytics",
                    "GitHub Actions CI/CD",
                    "Docker deployment",
                ],
                "deployment_preference": "Docker Compose with GitHub Actions",
                "ai_features_required": ["AI priority detection", "ticket summarization"],
            },
        )
        db.add(requirement)
        log_audit(db, action="demo.project_seeded", user_id=user.id, project_id=project.id)
        db.commit()
        db.refresh(project)

    if db.scalar(select(func.count(PRD.id)).where(PRD.project_id == project.id)) == 0:
        generate_prd(db, project=project, user=user)
    if db.scalar(select(func.count(Architecture.id)).where(Architecture.project_id == project.id)) == 0:
        generate_architecture(db, project=project, user=user)
    if db.scalar(select(func.count(Task.id)).where(Task.project_id == project.id)) == 0:
        generate_tasks(db, project=project, user=user)
    if db.scalar(select(func.count(GeneratedFile.id)).where(GeneratedFile.project_id == project.id)) == 0:
        generate_code(db, project=project, user=user)
    if db.scalar(select(func.count(BuildReport.id)).where(BuildReport.project_id == project.id)) == 0:
        simulate_build(db, project=project, user=user)

