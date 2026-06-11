from datetime import datetime
from typing import Any

from app.models import (
    AgentRun,
    AgentStep,
    Approval,
    Architecture,
    AuditLog,
    BuildReport,
    GeneratedFile,
    GitHubRepository,
    PRD,
    Project,
    Requirement,
    Task,
    User,
)


def iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def user_to_dict(user: User) -> dict[str, Any]:
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


def project_to_dict(project: Project) -> dict[str, Any]:
    return {
        "id": project.id,
        "name": project.name,
        "slug": project.slug,
        "idea": project.idea,
        "target_users": project.target_users,
        "preferred_stack": project.preferred_stack,
        "complexity": project.complexity,
        "status": project.status,
        "created_at": iso(project.created_at),
        "updated_at": iso(project.updated_at),
    }


def requirement_to_dict(requirement: Requirement) -> dict[str, Any]:
    return {
        "id": requirement.id,
        "project_id": requirement.project_id,
        "raw_input": requirement.raw_input,
        "structured_json": requirement.structured_json,
        "created_at": iso(requirement.created_at),
    }


def prd_to_dict(prd: PRD | None) -> dict[str, Any] | None:
    if not prd:
        return None
    return {
        "id": prd.id,
        "project_id": prd.project_id,
        "content_markdown": prd.content_markdown,
        "content_json": prd.content_json,
        "version": prd.version,
        "created_at": iso(prd.created_at),
    }


def architecture_to_dict(architecture: Architecture | None) -> dict[str, Any] | None:
    if not architecture:
        return None
    return {
        "id": architecture.id,
        "project_id": architecture.project_id,
        "content_markdown": architecture.content_markdown,
        "frontend_plan": architecture.frontend_plan,
        "backend_plan": architecture.backend_plan,
        "database_plan": architecture.database_plan,
        "ai_plan": architecture.ai_plan,
        "devops_plan": architecture.devops_plan,
        "security_plan": architecture.security_plan,
        "created_at": iso(architecture.created_at),
    }


def task_to_dict(task: Task) -> dict[str, Any]:
    return {
        "id": task.id,
        "project_id": task.project_id,
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "priority": task.priority,
        "complexity": task.complexity,
        "status": task.status,
        "dependencies_json": task.dependencies_json,
        "acceptance_criteria_json": task.acceptance_criteria_json,
        "created_at": iso(task.created_at),
        "updated_at": iso(task.updated_at),
    }


def file_to_dict(file: GeneratedFile) -> dict[str, Any]:
    return {
        "id": file.id,
        "project_id": file.project_id,
        "path": file.path,
        "language": file.language,
        "content": file.content,
        "purpose": file.purpose,
        "status": file.status,
        "created_at": iso(file.created_at),
        "updated_at": iso(file.updated_at),
    }


def agent_step_to_dict(step: AgentStep) -> dict[str, Any]:
    return {
        "id": step.id,
        "agent_run_id": step.agent_run_id,
        "step_name": step.step_name,
        "input_json": step.input_json,
        "output_json": step.output_json,
        "tool_used": step.tool_used,
        "status": step.status,
        "created_at": iso(step.created_at),
    }


def agent_run_to_dict(run: AgentRun, include_steps: bool = False) -> dict[str, Any]:
    data = {
        "id": run.id,
        "project_id": run.project_id,
        "agent_name": run.agent_name,
        "input_json": run.input_json,
        "output_json": run.output_json,
        "status": run.status,
        "started_at": iso(run.started_at),
        "completed_at": iso(run.completed_at),
        "error_message": run.error_message,
    }
    if include_steps:
        data["steps"] = [agent_step_to_dict(step) for step in run.steps]
    return data


def approval_to_dict(approval: Approval) -> dict[str, Any]:
    return {
        "id": approval.id,
        "project_id": approval.project_id,
        "action_type": approval.action_type,
        "action_summary": approval.action_summary,
        "risk_level": approval.risk_level,
        "payload_json": approval.payload_json,
        "status": approval.status,
        "requested_by": approval.requested_by,
        "approved_by": approval.approved_by,
        "created_at": iso(approval.created_at),
        "decided_at": iso(approval.decided_at),
    }


def github_repo_to_dict(repo: GitHubRepository | None) -> dict[str, Any] | None:
    if not repo:
        return None
    return {
        "id": repo.id,
        "project_id": repo.project_id,
        "repo_name": repo.repo_name,
        "repo_url": repo.repo_url,
        "branch_name": repo.branch_name,
        "pr_url": repo.pr_url,
        "status": repo.status,
        "created_at": iso(repo.created_at),
    }


def build_report_to_dict(report: BuildReport) -> dict[str, Any]:
    return {
        "id": report.id,
        "project_id": report.project_id,
        "status": report.status,
        "summary": report.summary,
        "logs": report.logs,
        "test_results_json": report.test_results_json,
        "security_findings_json": report.security_findings_json,
        "created_at": iso(report.created_at),
    }


def audit_log_to_dict(log: AuditLog) -> dict[str, Any]:
    return {
        "id": log.id,
        "user_id": log.user_id,
        "project_id": log.project_id,
        "action": log.action,
        "metadata_json": log.metadata_json,
        "ip_address": log.ip_address,
        "created_at": iso(log.created_at),
    }

