# Deployment

## Local

```bash
cp .env.example .env
docker compose up --build
```

## Production Upgrade Path

- Use managed Postgres with pgvector enabled.
- Use managed Redis.
- Build and push separate API and web images.
- Run Alembic migrations before app rollout.
- Configure AI provider keys server-side only.
- Use real GitHub OAuth and write APIs only behind approval checks.
- Add an isolated sandbox runner before executing generated code.

