from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.security import ensure_tool_allowed
from app.models import AgentRun, AgentStep


def record_agent_run(
    db: Session,
    *,
    project_id: str,
    agent_name: str,
    input_json: dict[str, Any],
    output_json: dict[str, Any],
    steps: list[dict[str, Any]] | None = None,
    status: str = "completed",
    error_message: str | None = None,
) -> AgentRun:
    run = AgentRun(
        project_id=project_id,
        agent_name=agent_name,
        input_json=input_json,
        output_json=output_json,
        status=status,
        completed_at=datetime.now(timezone.utc) if status in {"completed", "failed"} else None,
        error_message=error_message,
    )
    db.add(run)
    db.flush()
    for step in steps or []:
        tool_used = step.get("tool_used", "generate_text")
        ensure_tool_allowed(tool_used)
        db.add(
            AgentStep(
                agent_run_id=run.id,
                step_name=step.get("step_name", "agent_step"),
                input_json=step.get("input_json", {}),
                output_json=step.get("output_json", {}),
                tool_used=tool_used,
                status=step.get("status", "completed"),
            )
        )
    db.flush()
    return run

