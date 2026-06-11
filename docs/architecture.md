# BuildOS Architecture

BuildOS is a monorepo with a Next.js frontend, FastAPI backend, Postgres/pgvector database, Redis queue dependency, worker placeholder, Docker Compose stack, and CI workflow.

## Runtime Components

- `apps/web`: Next.js App Router product UI.
- `apps/api`: FastAPI API, agents, services, models, schemas, and tests.
- `postgres`: System of record plus vector storage.
- `redis`: Queue/cache dependency for background generation.
- `worker`: Placeholder-safe worker process for future async jobs.

## Data Flow

Idea input is stored as a requirement, converted into PRD and architecture documents, decomposed into tasks, expanded into generated files, reviewed by security/reviewer agents, then gated by approval before GitHub demo actions.

## Persistence

Core tables cover users, projects, requirements, PRDs, architectures, tasks, generated files, agent runs, agent steps, approvals, GitHub connections, GitHub repositories, build reports, document chunks, audit logs, and usage costs.

