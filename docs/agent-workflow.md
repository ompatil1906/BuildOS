# Agent Workflow

BuildOS currently uses deterministic MVP agents with the same database traces a provider-backed LangGraph implementation would produce.

1. Intake Agent extracts product summary, target users, constraints, feature list, and prompt-risk signals.
2. PRD Agent writes markdown and structured JSON.
3. Architecture Agent retrieves RAG context and writes technical architecture.
4. Task Planner Agent creates categorized work items.
5. Frontend, Backend, Database, DevOps, and Test Agents generate starter files.
6. Security Agent scans generated output for risky patterns.
7. Reviewer Agent returns readiness score, incomplete areas, and next steps.

Every run is stored in `agent_runs`; every step is stored in `agent_steps`.

