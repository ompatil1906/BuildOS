from typing import Any

from pydantic import BaseModel, Field


class RequirementCreate(BaseModel):
    raw_input: str = Field(min_length=10)
    structured_json: dict[str, Any] = Field(default_factory=dict)


class PRDResponse(BaseModel):
    id: str
    project_id: str
    content_markdown: str
    content_json: dict[str, Any]
    version: int
    created_at: str


class ArchitectureResponse(BaseModel):
    id: str
    project_id: str
    content_markdown: str
    frontend_plan: dict[str, Any]
    backend_plan: dict[str, Any]
    database_plan: dict[str, Any]
    ai_plan: dict[str, Any]
    devops_plan: dict[str, Any]
    security_plan: dict[str, Any]
    created_at: str


class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    category: str
    priority: str
    complexity: str
    status: str
    dependencies_json: list[Any]
    acceptance_criteria_json: list[Any]


class GeneratedFileResponse(BaseModel):
    id: str
    project_id: str
    path: str
    language: str
    content: str
    purpose: str
    status: str


class ApprovalCreate(BaseModel):
    action_type: str = Field(min_length=3, max_length=120)
    action_summary: str = Field(min_length=5)
    risk_level: str = Field(default="medium", pattern="^(low|medium|high)$")
    payload_json: dict[str, Any] = Field(default_factory=dict)


class GitHubConnectRequest(BaseModel):
    github_username: str = Field(min_length=1, max_length=160)
    access_token: str = Field(default="", description="Stored encrypted in production; placeholder-safe in MVP.")


class GitHubActionRequest(BaseModel):
    repo_name: str | None = None
    branch_name: str = "buildos/generated-mvp"
    demo_mode: bool = False
    approval_id: str | None = None
    private: bool = True
    commit_message: str = "BuildOS generated application workspace"


class BuildReportResponse(BaseModel):
    id: str
    project_id: str
    status: str
    summary: str
    logs: str
    test_results_json: dict[str, Any]
    security_findings_json: list[Any]
    created_at: str


class FileUpdate(BaseModel):
    content: str | None = None
    status: str | None = None
    purpose: str | None = None


class TaskUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
