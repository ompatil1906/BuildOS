from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.responses import BuildOSError, success_response
from app.db.session import get_db
from app.models import AgentRun, Approval, Architecture, AuditLog, BuildReport, GeneratedFile, PRD, Project, Requirement, Task, User
from app.schemas.auth import LoginRequest, SignupRequest
from app.schemas.generated import ApprovalCreate, FileUpdate, GitHubActionRequest, GitHubConnectRequest, RequirementCreate, TaskUpdate
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.approvals import create_approval, decide_approval, get_approval_or_404, list_approvals
from app.services.audit import log_audit
from app.services.auth import authenticate_user, signup_user
from app.services.generation import generate_architecture, generate_code, generate_prd, generate_tasks, simulate_build
from app.services.github import connect_github, create_pr, create_repo, github_status
from app.services.projects import create_project, delete_project, get_project_or_404, list_projects, update_project
from app.services.rag import index_project_text, retrieve_context
from app.services.serializers import (
    agent_run_to_dict,
    agent_step_to_dict,
    architecture_to_dict,
    audit_log_to_dict,
    build_report_to_dict,
    file_to_dict,
    prd_to_dict,
    project_to_dict,
    requirement_to_dict,
    task_to_dict,
)

router = APIRouter()


@router.post("/auth/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    return success_response(signup_user(db, name=payload.name, email=payload.email, password=payload.password), "Signup completed")


@router.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return success_response(authenticate_user(db, email=payload.email, password=payload.password), "Login completed")


@router.get("/auth/me")
def me(user: User = Depends(get_current_user)):
    from app.services.serializers import user_to_dict

    return success_response(user_to_dict(user), "Current user loaded")


@router.post("/projects")
def create_project_endpoint(payload: ProjectCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return success_response(create_project(db, user=user, payload=payload), "Project created")


@router.get("/projects")
def list_projects_endpoint(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return success_response(list_projects(db, user=user), "Projects loaded")


@router.get("/projects/{project_id}")
def get_project_endpoint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(project_to_dict(project), "Project loaded")


@router.patch("/projects/{project_id}")
def update_project_endpoint(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(update_project(db, project=project, payload=payload, user=user), "Project updated")


@router.delete("/projects/{project_id}")
def delete_project_endpoint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    delete_project(db, project=project, user=user)
    return success_response({"id": project_id, "status": "archived"}, "Project archived")


@router.post("/projects/{project_id}/requirements")
def create_requirement(project_id: str, payload: RequirementCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    requirement = Requirement(project_id=project.id, raw_input=payload.raw_input, structured_json=payload.structured_json)
    db.add(requirement)
    db.flush()
    index_project_text(db, project_id=project.id, source_type="requirement", source_id=requirement.id, text=requirement.raw_input)
    log_audit(db, action="requirement.created", user_id=user.id, project_id=project.id, metadata={"requirement_id": requirement.id})
    db.commit()
    db.refresh(requirement)
    return success_response(requirement_to_dict(requirement), "Requirement created")


@router.get("/projects/{project_id}/requirements")
def list_requirements(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    requirements = db.scalars(select(Requirement).where(Requirement.project_id == project.id).order_by(Requirement.created_at.desc())).all()
    return success_response([requirement_to_dict(item) for item in requirements], "Requirements loaded")


@router.patch("/requirements/{requirement_id}")
def patch_requirement(requirement_id: str, payload: RequirementCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    requirement = db.get(Requirement, requirement_id)
    if not requirement:
        raise BuildOSError("REQUIREMENT_NOT_FOUND", "Requirement was not found.", 404)
    get_project_or_404(db, project_id=requirement.project_id, user=user)
    requirement.raw_input = payload.raw_input
    requirement.structured_json = payload.structured_json
    log_audit(db, action="requirement.updated", user_id=user.id, project_id=requirement.project_id, metadata={"requirement_id": requirement.id})
    db.commit()
    db.refresh(requirement)
    return success_response(requirement_to_dict(requirement), "Requirement updated")


@router.post("/projects/{project_id}/generate-prd")
def generate_prd_endpoint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(generate_prd(db, project=project, user=user), "PRD generated")


@router.get("/projects/{project_id}/prd")
def get_prd(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    prd = db.scalar(select(PRD).where(PRD.project_id == project.id).order_by(PRD.created_at.desc()))
    return success_response(prd_to_dict(prd), "PRD loaded")


@router.post("/projects/{project_id}/generate-architecture")
def generate_architecture_endpoint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(generate_architecture(db, project=project, user=user), "Architecture generated")


@router.get("/projects/{project_id}/architecture")
def get_architecture(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    architecture = db.scalar(select(Architecture).where(Architecture.project_id == project.id).order_by(Architecture.created_at.desc()))
    return success_response(architecture_to_dict(architecture), "Architecture loaded")


@router.post("/projects/{project_id}/generate-tasks")
def generate_tasks_endpoint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(generate_tasks(db, project=project, user=user), "Tasks generated")


@router.get("/projects/{project_id}/tasks")
def list_tasks(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    tasks = db.scalars(select(Task).where(Task.project_id == project.id).order_by(Task.category.asc(), Task.created_at.asc())).all()
    return success_response([task_to_dict(task) for task in tasks], "Tasks loaded")


@router.patch("/tasks/{task_id}")
def patch_task(task_id: str, payload: TaskUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.get(Task, task_id)
    if not task:
        raise BuildOSError("TASK_NOT_FOUND", "Task was not found.", 404)
    get_project_or_404(db, project_id=task.project_id, user=user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(task, field, value)
    log_audit(db, action="task.updated", user_id=user.id, project_id=task.project_id, metadata={"task_id": task.id})
    db.commit()
    db.refresh(task)
    return success_response(task_to_dict(task), "Task updated")


@router.post("/projects/{project_id}/generate-code")
def generate_code_endpoint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(generate_code(db, project=project, user=user), "Code generated")


@router.get("/projects/{project_id}/files")
def list_files(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    files = db.scalars(select(GeneratedFile).where(GeneratedFile.project_id == project.id).order_by(GeneratedFile.path.asc())).all()
    return success_response([file_to_dict(file) for file in files], "Generated files loaded")


@router.get("/projects/{project_id}/files/{file_id}")
def get_file(project_id: str, file_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    file = db.get(GeneratedFile, file_id)
    if not file or file.project_id != project.id:
        raise BuildOSError("FILE_NOT_FOUND", "Generated file was not found.", 404)
    return success_response(file_to_dict(file), "Generated file loaded")


@router.patch("/files/{file_id}")
def patch_file(file_id: str, payload: FileUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    file = db.get(GeneratedFile, file_id)
    if not file:
        raise BuildOSError("FILE_NOT_FOUND", "Generated file was not found.", 404)
    get_project_or_404(db, project_id=file.project_id, user=user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(file, field, value)
    log_audit(db, action="file.updated", user_id=user.id, project_id=file.project_id, metadata={"file_id": file.id})
    db.commit()
    db.refresh(file)
    return success_response(file_to_dict(file), "Generated file updated")


@router.get("/projects/{project_id}/agent-runs")
def list_agent_runs(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    runs = db.scalars(select(AgentRun).where(AgentRun.project_id == project.id).order_by(AgentRun.started_at.desc())).all()
    return success_response([agent_run_to_dict(run) for run in runs], "Agent runs loaded")


@router.get("/agent-runs/{agent_run_id}")
def get_agent_run(agent_run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = db.get(AgentRun, agent_run_id)
    if not run:
        raise BuildOSError("AGENT_RUN_NOT_FOUND", "Agent run was not found.", 404)
    get_project_or_404(db, project_id=run.project_id, user=user)
    return success_response(agent_run_to_dict(run, include_steps=True), "Agent run loaded")


@router.get("/agent-runs/{agent_run_id}/steps")
def get_agent_steps(agent_run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = db.get(AgentRun, agent_run_id)
    if not run:
        raise BuildOSError("AGENT_RUN_NOT_FOUND", "Agent run was not found.", 404)
    get_project_or_404(db, project_id=run.project_id, user=user)
    return success_response([agent_step_to_dict(step) for step in run.steps], "Agent steps loaded")


@router.post("/projects/{project_id}/approvals")
def request_approval(project_id: str, payload: ApprovalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(create_approval(db, project=project, user=user, payload=payload), "Approval requested")


@router.get("/projects/{project_id}/approvals")
def get_approvals(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(list_approvals(db, project=project), "Approvals loaded")


@router.post("/approvals/{approval_id}/approve")
def approve(approval_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    approval = get_approval_or_404(db, approval_id=approval_id)
    get_project_or_404(db, project_id=approval.project_id, user=user)
    return success_response(decide_approval(db, approval=approval, user=user, approved=True), "Approval accepted")


@router.post("/approvals/{approval_id}/reject")
def reject(approval_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    approval = get_approval_or_404(db, approval_id=approval_id)
    get_project_or_404(db, project_id=approval.project_id, user=user)
    return success_response(decide_approval(db, approval=approval, user=user, approved=False), "Approval rejected")


@router.post("/projects/{project_id}/github/connect")
def github_connect(project_id: str, payload: GitHubConnectRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_project_or_404(db, project_id=project_id, user=user)
    return success_response(connect_github(db, user=user, payload=payload), "GitHub connected")


@router.post("/projects/{project_id}/github/create-repo")
def github_create_repo(project_id: str, payload: GitHubActionRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(create_repo(db, project=project, user=user, payload=payload), "Repository action completed")


@router.post("/projects/{project_id}/github/create-pr")
def github_create_pr(project_id: str, payload: GitHubActionRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(create_pr(db, project=project, user=user, payload=payload), "Pull request action completed")


@router.get("/projects/{project_id}/github/status")
def github_status_endpoint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(github_status(db, project=project, user=user), "GitHub status loaded")


@router.post("/projects/{project_id}/builds/simulate")
def simulate_build_endpoint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    return success_response(simulate_build(db, project=project, user=user), "Build simulation completed")


@router.get("/projects/{project_id}/builds")
def list_builds(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    reports = db.scalars(select(BuildReport).where(BuildReport.project_id == project.id).order_by(BuildReport.created_at.desc())).all()
    return success_response([build_report_to_dict(report) for report in reports], "Build reports loaded")


@router.get("/builds/{build_id}")
def get_build(build_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    report = db.get(BuildReport, build_id)
    if not report:
        raise BuildOSError("BUILD_NOT_FOUND", "Build report was not found.", 404)
    get_project_or_404(db, project_id=report.project_id, user=user)
    return success_response(build_report_to_dict(report), "Build report loaded")


@router.get("/audit-logs")
def list_audit_logs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    logs = db.scalars(select(AuditLog).where(AuditLog.user_id == user.id).order_by(AuditLog.created_at.desc()).limit(100)).all()
    return success_response([audit_log_to_dict(log) for log in logs], "Audit logs loaded")


@router.get("/projects/{project_id}/audit-logs")
def list_project_audit_logs(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    logs = db.scalars(select(AuditLog).where(AuditLog.project_id == project.id).order_by(AuditLog.created_at.desc()).limit(100)).all()
    return success_response([audit_log_to_dict(log) for log in logs], "Project audit logs loaded")


@router.get("/projects/{project_id}/rag/query")
def rag_query(project_id: str, q: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id=project_id, user=user)
    chunks = retrieve_context(db, project_id=project.id, query=q)
    answer = {
        "answer": "BuildOS selected the current plan based on matching requirements, architecture notes, generated files, and build logs.",
        "citations": chunks,
    }
    return success_response(answer, "RAG answer loaded")

