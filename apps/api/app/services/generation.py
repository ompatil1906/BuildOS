from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.agents.workflow import record_agent_run
from app.core.security import assess_prompt_risk
from app.models import Architecture, BuildReport, GeneratedFile, PRD, Project, Requirement, Task, User
from app.services.audit import log_audit
from app.services.rag import index_project_text, retrieve_context
from app.services.serializers import (
    architecture_to_dict,
    build_report_to_dict,
    file_to_dict,
    prd_to_dict,
    task_to_dict,
)


def _features(db: Session, project: Project) -> list[str]:
    requirement = db.scalar(
        select(Requirement).where(Requirement.project_id == project.id).order_by(Requirement.created_at.desc())
    )
    features = []
    if requirement:
        features = requirement.structured_json.get("required_features") or []
    if features:
        return features
    default_features = ["Login", "Dashboard", "CRUD workflow", "Analytics", "Deployment pipeline"]
    if "ai" in project.idea.lower():
        default_features.insert(3, "AI assistance")
    return default_features


def _stack(project: Project) -> list[str]:
    return [item.strip() for item in project.preferred_stack.split(",") if item.strip()]


def _project_summary(project: Project, features: list[str]) -> dict:
    return {
        "name": project.name,
        "idea": project.idea,
        "target_users": project.target_users or "Product teams and technical founders",
        "preferred_stack": _stack(project),
        "complexity": project.complexity,
        "features": features,
    }


def generate_prd(db: Session, *, project: Project, user: User) -> dict:
    features = _features(db, project)
    summary = _project_summary(project, features)
    risk = assess_prompt_risk(project.idea + " " + " ".join(features))

    intake_output = {
        "product_summary": f"{project.name} helps {summary['target_users']} turn a core workflow into a polished SaaS.",
        "target_users": summary["target_users"],
        "core_problem": "Users need a faster path from operational pain to usable software.",
        "feature_list": features,
        "constraints": ["MVP should be production-review ready", "Require approval before GitHub writes", "Keep secrets server-side"],
        "missing_information": ["Billing provider", "Exact design system tokens", "Production hosting account"],
        "recommended_build_type": project.complexity,
        "prompt_risk": risk,
    }
    record_agent_run(
        db,
        project_id=project.id,
        agent_name="Intake Agent",
        input_json=summary,
        output_json=intake_output,
        steps=[
            {
                "step_name": "classify_prompt_and_extract_scope",
                "input_json": {"idea": project.idea, "features": features},
                "output_json": intake_output,
                "tool_used": "generate_text",
            }
        ],
    )

    feature_lines = "\n".join(f"- {feature}: production-grade MVP behavior with clear acceptance criteria." for feature in features)
    story_lines = "\n".join(
        [
            "- As a new user, I can sign up and reach a guided dashboard.",
            "- As an operator, I can create, update, and review core records without leaving the app.",
            "- As an admin, I can view quality, usage, and readiness signals before release.",
            "- As an engineer, I can inspect generated code and CI/CD output before approving GitHub actions.",
        ]
    )
    markdown = f"""# {project.name} Product Requirements Document

## Product Summary
{project.name} is a {project.complexity} MVP for {summary['target_users']}. It turns the idea "{project.idea}" into a focused software product with a modern full-stack implementation.

## Problem Statement
Teams lose time translating product intent into requirements, architecture, tasks, code, and deployment plans. {project.name} should compress that path while keeping human approval around risky actions.

## Target Users
{summary['target_users']}

## User Personas
- Founder-operator who needs a credible MVP quickly.
- Product engineer who wants generated scaffolding with clear ownership boundaries.
- Admin reviewer who checks risk, build status, and deployment readiness.

## Core Features
{feature_lines}

## User Stories
{story_lines}

## MVP Scope
- Authentication and role-aware dashboard.
- Primary CRUD workflow with typed API contracts.
- AI-assisted prioritization or recommendation flow where relevant.
- Admin/reporting screens for build, security, and usage signals.
- Docker Compose and GitHub Actions setup.

## Out of Scope
- Production payment processing.
- Real external deployment triggers without explicit approval.
- Arbitrary generated code execution inside the production API.

## Success Metrics
- Time from idea to generated PR under 10 minutes with provider configuration.
- At least 80% of generated tasks have acceptance criteria.
- Build readiness score above 75 before handoff.

## Risks
- Prompt injection attempts can try to bypass approvals.
- Generated code can miss edge cases without human review.
- Third-party provider keys must be configured outside the frontend.

## Assumptions
- The initial stack remains {project.preferred_stack}.
- A human reviewer approves GitHub and deployment actions.
- GitHub writes require provider configuration and an approval record.
"""
    content_json = {
        "overview": markdown.split("\n\n")[0],
        "problem": "Slow translation from idea to usable, reviewable software.",
        "users": summary["target_users"],
        "features": features,
        "mvp_scope": ["auth", "dashboard", "core CRUD", "AI assist", "DevOps pipeline"],
        "success_metrics": ["time_to_pr", "task_acceptance_coverage", "readiness_score"],
        "risks": ["prompt_injection", "incomplete_generated_code", "secret_handling"],
        "assumptions": ["human approval", "configured provider keys", "preferred stack"],
    }
    latest = db.scalar(select(PRD).where(PRD.project_id == project.id).order_by(PRD.version.desc()))
    prd = PRD(
        project_id=project.id,
        content_markdown=markdown,
        content_json=content_json,
        version=(latest.version + 1) if latest else 1,
    )
    db.add(prd)
    project.status = "prd_generated"
    db.flush()
    index_project_text(db, project_id=project.id, source_type="prd", source_id=prd.id, text=markdown)
    record_agent_run(
        db,
        project_id=project.id,
        agent_name="PRD Agent",
        input_json=intake_output,
        output_json=content_json,
        steps=[
            {
                "step_name": "compose_prd",
                "input_json": {"summary": summary, "risk": risk},
                "output_json": {"sections": list(content_json.keys()), "version": prd.version},
                "tool_used": "generate_text",
            },
            {
                "step_name": "save_prd_to_database",
                "input_json": {"project_id": project.id},
                "output_json": {"prd_id": prd.id},
                "tool_used": "save_to_database",
            },
        ],
    )
    log_audit(db, action="prd.generated", user_id=user.id, project_id=project.id, metadata={"version": prd.version})
    db.commit()
    db.refresh(prd)
    return prd_to_dict(prd) or {}


def generate_architecture(db: Session, *, project: Project, user: User) -> dict:
    features = _features(db, project)
    context = retrieve_context(db, project_id=project.id, query="architecture requirements security devops")
    api_routes = [
        "POST /auth/signup",
        "POST /auth/login",
        "GET /auth/me",
        "POST /projects",
        "GET /projects/{id}",
        "POST /projects/{id}/generate-prd",
        "POST /projects/{id}/generate-code",
        "POST /projects/{id}/approvals",
        "POST /projects/{id}/builds/simulate",
    ]
    db_tables = ["users", "projects", "requirements", "prds", "architectures", "tasks", "generated_files", "agent_runs", "approvals", "build_reports", "document_chunks", "audit_logs"]
    markdown = f"""# {project.name} Technical Architecture

## System Flow
User prompt -> Intake Agent -> PRD Agent -> Architecture Agent -> Task Planner -> Parallel Code Agents -> Security Agent -> Reviewer Agent -> Human Approval -> GitHub PR -> Build Report.

## Frontend Architecture
- Next.js App Router with typed route segments for public pages and authenticated workspace pages.
- Tailwind CSS and shadcn-style primitives for cards, tabs, dialogs, command search, data tables, and status badges.
- TanStack Query for server state and a small client store for session and UI preferences.
- Monaco-powered code preview with a file tree and safe copy/download affordances.

## Backend Architecture
- FastAPI app with modular routers for auth, projects, requirements, generation, approvals, GitHub, builds, and audit logs.
- Pydantic request validation and a consistent success/error envelope.
- SQLAlchemy models, Alembic migrations, Postgres/pgvector persistence, and Redis-backed worker hooks.

## Database Schema
Primary tables: {", ".join(db_tables)}.

## API Routes
{chr(10).join(f"- {route}" for route in api_routes)}

## AI Workflow
Agents are traceable through `agent_runs` and `agent_steps`. The MVP uses local deterministic generators and can be upgraded to LangGraph nodes backed by Gemini, OpenAI-compatible APIs, or Ollama.

## DevOps Pipeline
Docker Compose runs web, api, worker, Postgres with pgvector, and Redis. GitHub Actions lint/build/test jobs validate frontend, backend, and Docker configuration.

## Security Model
JWT auth, prompt injection checks, external tool allowlist, explicit approvals for GitHub/deployment actions, audit logs, and frontend-safe environment handling.

## Deployment Plan
Start with Docker Compose for local review, then promote API/web images to a container platform. Keep database migrations gated and run external writes only after approval.

## RAG Context Used
{chr(10).join(f"- {item['source_type']}:{item['source_id']} score={item['score']}" for item in context) or "- No prior chunks available."}
"""
    frontend_plan = {"framework": "Next.js App Router", "state": "TanStack Query + lightweight store", "pages": ["landing", "dashboard", "projects", "project artifacts", "settings"]}
    backend_plan = {"framework": "FastAPI", "modules": ["auth", "projects", "agents", "approvals", "github", "builds", "audit"]}
    database_plan = {"engine": "PostgreSQL", "extensions": ["pgvector"], "tables": db_tables}
    ai_plan = {"orchestrator": "LangGraph-ready custom graph", "agents": ["Intake", "PRD", "Architecture", "Task Planner", "Frontend", "Backend", "Database", "DevOps", "Test", "Security", "Reviewer"]}
    devops_plan = {"services": ["web", "api", "postgres", "redis", "worker"], "ci_jobs": ["frontend-lint", "frontend-build", "backend-test", "docker-build-check"]}
    security_plan = {"approval_required": ["github_write", "deployment_trigger", "api_key_update", "generated_code_execution"], "tool_allowlist": ["generate_text", "generate_file", "save_to_database", "create_github_pr", "simulate_build", "retrieve_context"]}
    architecture = Architecture(
        project_id=project.id,
        content_markdown=markdown,
        frontend_plan=frontend_plan,
        backend_plan=backend_plan,
        database_plan=database_plan,
        ai_plan=ai_plan,
        devops_plan=devops_plan,
        security_plan=security_plan,
    )
    db.add(architecture)
    project.status = "architecture_generated"
    db.flush()
    index_project_text(db, project_id=project.id, source_type="architecture", source_id=architecture.id, text=markdown)
    record_agent_run(
        db,
        project_id=project.id,
        agent_name="Architecture Agent",
        input_json={"project": _project_summary(project, features), "rag_context": context},
        output_json={
            "frontend_plan": frontend_plan,
            "backend_plan": backend_plan,
            "database_plan": database_plan,
            "ai_plan": ai_plan,
            "devops_plan": devops_plan,
            "security_plan": security_plan,
        },
        steps=[
            {
                "step_name": "retrieve_project_context",
                "input_json": {"query": "architecture requirements security devops"},
                "output_json": {"chunks": context},
                "tool_used": "retrieve_context",
            },
            {
                "step_name": "save_architecture",
                "input_json": {"project_id": project.id},
                "output_json": {"architecture_id": architecture.id},
                "tool_used": "save_to_database",
            },
        ],
    )
    log_audit(db, action="architecture.generated", user_id=user.id, project_id=project.id)
    db.commit()
    db.refresh(architecture)
    return architecture_to_dict(architecture) or {}


def _task_specs(project: Project) -> list[dict]:
    categories = {
        "Frontend": ["Build authenticated dashboard layout", "Create project wizard", "Implement code viewer and file tree"],
        "Backend": ["Implement project CRUD APIs", "Add generation endpoints", "Add consistent API envelopes"],
        "Database": ["Create SQLAlchemy models and Alembic migration", "Index generated artifacts for retrieval"],
        "AI": ["Trace agent runs and steps", "Add RAG retrieval to architecture and review agents"],
        "DevOps": ["Create Docker Compose stack", "Generate GitHub Actions workflow"],
        "Testing": ["Add backend API smoke tests", "Add frontend component test coverage"],
        "Security": ["Add prompt injection guard", "Require approval before GitHub writes"],
        "Documentation": ["Write README and production runbook", "Document security and deployment model"],
    }
    priority_by_category = {"Security": "high", "Backend": "high", "AI": "high", "DevOps": "high"}
    specs = []
    for category, titles in categories.items():
        for title in titles:
            specs.append(
                {
                    "title": title,
                    "description": f"{title} for {project.name} with clear production upgrade notes.",
                    "category": category,
                    "priority": priority_by_category.get(category, "medium"),
                    "complexity": project.complexity,
                    "dependencies": [] if category in {"Frontend", "Backend"} else ["Project foundation"],
                    "acceptance": [
                        "Implementation is typed and validated.",
                        "Risky operations are gated by approval where relevant.",
                        "Local workflow remains runnable.",
                    ],
                }
            )
    return specs


def generate_tasks(db: Session, *, project: Project, user: User) -> list[dict]:
    specs = _task_specs(project)
    tasks: list[Task] = []
    for spec in specs:
        task = Task(
            project_id=project.id,
            title=spec["title"],
            description=spec["description"],
            category=spec["category"],
            priority=spec["priority"],
            complexity=spec["complexity"],
            dependencies_json=spec["dependencies"],
            acceptance_criteria_json=spec["acceptance"],
        )
        db.add(task)
        tasks.append(task)
    project.status = "tasks_generated"
    db.flush()
    record_agent_run(
        db,
        project_id=project.id,
        agent_name="Task Planner Agent",
        input_json={"architecture_status": project.status, "complexity": project.complexity},
        output_json={"task_count": len(tasks), "categories": sorted({task.category for task in tasks})},
        steps=[
            {
                "step_name": "break_architecture_into_tasks",
                "input_json": {"project_id": project.id},
                "output_json": {"task_count": len(tasks)},
                "tool_used": "generate_text",
            },
            {
                "step_name": "save_tasks",
                "input_json": {"project_id": project.id},
                "output_json": {"task_ids": [task.id for task in tasks]},
                "tool_used": "save_to_database",
            },
        ],
    )
    log_audit(db, action="tasks.generated", user_id=user.id, project_id=project.id, metadata={"count": len(tasks)})
    db.commit()
    return [task_to_dict(task) for task in tasks]


def _generated_file_specs(project: Project) -> list[dict[str, str]]:
    app_name = project.name
    slug = project.slug
    return [
        {
            "path": "README.md",
            "language": "markdown",
            "purpose": "Generated application handoff README.",
            "content": f"""# {app_name}

Generated by BuildOS from: {project.idea}

## Stack
- Next.js frontend
- FastAPI backend
- PostgreSQL database
- Docker Compose local deployment

## Run
1. Copy `.env.example` to `.env`.
2. Run `docker compose up --build`.
3. Open the web app and review generated build reports.

## Safety
External writes require explicit human approval. No production secrets are stored in generated code.
""",
        },
        {
            "path": ".env.example",
            "language": "dotenv",
            "purpose": "Safe environment variable template.",
            "content": """DATABASE_URL=
REDIS_URL=
JWT_SECRET=
AI_PROVIDER=local
OPENAI_API_KEY=
GEMINI_API_KEY=
GITHUB_TOKEN=
NEXT_PUBLIC_API_URL=http://localhost:8000
""",
        },
        {
            "path": "apps/web/package.json",
            "language": "json",
            "purpose": "Frontend package manifest.",
            "content": """{
  "name": "generated-buildos-app",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.3",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "zod": "^3.24.1"
  }
}
""",
        },
        {
            "path": "apps/web/app/page.tsx",
            "language": "tsx",
            "purpose": "Generated landing/login entry page.",
            "content": f"""export default function Page() {{
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-24">
        <p className="text-sm uppercase tracking-wide text-cyan-300">{app_name}</p>
        <h1 className="text-5xl font-semibold">A focused SaaS starter generated by BuildOS.</h1>
        <p className="max-w-2xl text-slate-300">{project.idea}</p>
        <a href="/dashboard" className="w-fit rounded-md bg-white px-4 py-2 text-slate-950">Open dashboard</a>
      </section>
    </main>
  );
}}
""",
        },
        {
            "path": "apps/web/app/dashboard/page.tsx",
            "language": "tsx",
            "purpose": "Generated dashboard page.",
            "content": """const stats = [
  { label: "Open records", value: "128" },
  { label: "AI priority alerts", value: "18" },
  { label: "Build status", value: "Ready" }
];

export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <section key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
""",
        },
        {
            "path": "apps/web/lib/api.ts",
            "language": "typescript",
            "purpose": "Generated API client.",
            "content": """const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.error?.message ?? "API request failed");
  }
  return payload.data as T;
}
""",
        },
        {
            "path": "apps/api/app/main.py",
            "language": "python",
            "purpose": "Generated FastAPI app entry.",
            "content": '''from fastapi import FastAPI

app = FastAPI(title="Generated BuildOS App")


@app.get("/health")
def health():
    return {"success": True, "data": {"status": "ok"}, "message": "API healthy"}
''',
        },
        {
            "path": "apps/api/app/routes.py",
            "language": "python",
            "purpose": "Generated CRUD routes starter.",
            "content": '''from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/items", tags=["items"])


class Item(BaseModel):
    id: str
    title: str
    status: str = "open"


ITEMS: list[Item] = []


@router.get("")
def list_items():
    return {"success": True, "data": ITEMS, "message": "Items loaded"}


@router.post("")
def create_item(item: Item):
    ITEMS.append(item)
    return {"success": True, "data": item, "message": "Item created"}
''',
        },
        {
            "path": "apps/api/tests/test_health.py",
            "language": "python",
            "purpose": "Backend smoke test.",
            "content": '''from fastapi.testclient import TestClient

from app.main import app


def test_health():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["success"] is True
''',
        },
        {
            "path": "docker-compose.yml",
            "language": "yaml",
            "purpose": "Generated local deployment stack.",
            "content": f"""services:
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
  api:
    build: ./apps/api
    ports:
      - "8000:8000"
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: {slug.replace('-', '_')}
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app_dev_password
  redis:
    image: redis:7-alpine
""",
        },
        {
            "path": ".github/workflows/ci.yml",
            "language": "yaml",
            "purpose": "Generated CI/CD workflow.",
            "content": """name: Generated App CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r apps/api/requirements.txt
      - run: pytest apps/api/tests

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: apps/web
      - run: npm run build
        working-directory: apps/web
""",
        },
    ]


def generate_code(db: Session, *, project: Project, user: User) -> list[dict]:
    specs = _generated_file_specs(project)
    saved_files: list[GeneratedFile] = []
    grouped_agents = {
        "Frontend Agent": [spec for spec in specs if spec["path"].startswith("apps/web")],
        "Backend Agent": [spec for spec in specs if spec["path"].startswith("apps/api")],
        "Database Agent": [spec for spec in specs if spec["path"] == "docker-compose.yml"],
        "DevOps Agent": [spec for spec in specs if spec["path"].startswith(".github") or spec["path"] in {".env.example", "docker-compose.yml"}],
        "Test Agent": [spec for spec in specs if "test" in spec["path"]],
    }
    for spec in specs:
        existing = db.scalar(
            select(GeneratedFile).where(GeneratedFile.project_id == project.id, GeneratedFile.path == spec["path"])
        )
        if existing:
            existing.content = spec["content"]
            existing.language = spec["language"]
            existing.purpose = spec["purpose"]
            file = existing
        else:
            file = GeneratedFile(project_id=project.id, **spec)
            db.add(file)
        saved_files.append(file)
    project.status = "code_generated"
    db.flush()

    for agent_name, files in grouped_agents.items():
        if not files:
            continue
        record_agent_run(
            db,
            project_id=project.id,
            agent_name=agent_name,
            input_json={"project": project.name, "file_count": len(files)},
            output_json={"files": [item["path"] for item in files]},
            steps=[
                {
                    "step_name": "generate_files",
                    "input_json": {"paths": [item["path"] for item in files]},
                    "output_json": {"generated": len(files)},
                    "tool_used": "generate_file",
                },
                {
                    "step_name": "save_generated_files",
                    "input_json": {"project_id": project.id},
                    "output_json": {"paths": [item["path"] for item in files]},
                    "tool_used": "save_to_database",
                },
            ],
        )

    findings = security_findings_for_files(saved_files)
    record_agent_run(
        db,
        project_id=project.id,
        agent_name="Security Agent",
        input_json={"file_count": len(saved_files)},
        output_json={"findings": findings},
        steps=[
            {
                "step_name": "scan_generated_files",
                "input_json": {"paths": [file.path for file in saved_files]},
                "output_json": {"findings": findings},
                "tool_used": "generate_text",
            }
        ],
    )
    record_agent_run(
        db,
        project_id=project.id,
        agent_name="Reviewer Agent",
        input_json={"file_count": len(saved_files), "security_findings": findings},
        output_json={
            "generated": len(saved_files),
            "incomplete": ["Real provider integration", "Production OAuth setup", "Live deployment runner"],
            "readiness_score": 82,
        },
        steps=[
            {
                "step_name": "review_outputs",
                "input_json": {"project_id": project.id},
                "output_json": {"readiness_score": 82},
                "tool_used": "generate_text",
            }
        ],
    )
    for file in saved_files:
        index_project_text(db, project_id=project.id, source_type="generated_file", source_id=file.id, text=file.content)
    log_audit(db, action="code.generated", user_id=user.id, project_id=project.id, metadata={"files": len(saved_files)})
    db.commit()
    return [file_to_dict(file) for file in saved_files]


def security_findings_for_files(files: list[GeneratedFile]) -> list[dict]:
    findings = []
    for file in files:
        lowered = file.content.lower()
        if "secret=" in lowered or "api_key=" in lowered:
            findings.append({"severity": "high", "path": file.path, "message": "Potential hardcoded secret pattern."})
        if "github_token" in lowered and file.path != ".env.example":
            findings.append({"severity": "medium", "path": file.path, "message": "GitHub token should stay server-side."})
    findings.append(
        {
            "severity": "warning",
            "path": "generated-app",
            "message": "Generated tests and should be expanded before production release.",
        }
    )
    return findings


def simulate_build(db: Session, *, project: Project, user: User) -> dict:
    files_count = db.scalar(select(func.count(GeneratedFile.id)).where(GeneratedFile.project_id == project.id)) or 0
    stages = [
        {"name": "Install dependencies", "status": "passed", "duration": "18s"},
        {"name": "Run lint", "status": "warning", "duration": "7s", "note": "Readiness check generated lint plan; connect sandbox runner for execution."},
        {"name": "Run tests", "status": "warning", "duration": "5s", "note": "Placeholder tests generated."},
        {"name": "Build frontend", "status": "passed", "duration": "22s"},
        {"name": "Build backend", "status": "passed", "duration": "12s"},
        {"name": "Docker build", "status": "passed", "duration": "31s"},
        {"name": "Security scan", "status": "warning", "duration": "6s"},
    ]
    logs = "\n".join(f"[{stage['status'].upper()}] {stage['name']} ({stage['duration']}) {stage.get('note', '')}".strip() for stage in stages)
    findings = [
        {"severity": "warning", "message": "Payment provider and production secrets are intentionally not configured."},
        {"severity": "info", "message": "GitHub write actions require approval before execution."},
    ]
    report = BuildReport(
        project_id=project.id,
        status="warning",
        summary="Frontend and backend files generated successfully. Docker Compose and GitHub Actions are ready for review. BuildOS did not execute untrusted generated code in the API process.",
        logs=logs,
        test_results_json={"stages": stages, "readiness_score": 82, "generated_files": files_count},
        security_findings_json=findings,
    )
    db.add(report)
    project.status = "build_simulated"
    db.flush()
    record_agent_run(
        db,
        project_id=project.id,
        agent_name="Build Simulator",
        input_json={"project_id": project.id},
        output_json={"status": report.status, "readiness_score": 82},
        steps=[
            {
                "step_name": "simulate_pipeline",
                "input_json": {"stages": [stage["name"] for stage in stages]},
                "output_json": {"stages": stages},
                "tool_used": "simulate_build",
            }
        ],
    )
    index_project_text(db, project_id=project.id, source_type="build_report", source_id=report.id, text=report.summary + "\n" + logs)
    log_audit(db, action="build.simulated", user_id=user.id, project_id=project.id, metadata={"status": report.status})
    db.commit()
    db.refresh(report)
    return build_report_to_dict(report)
