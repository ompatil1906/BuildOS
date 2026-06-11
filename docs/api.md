# BuildOS API

All normal responses use:

```json
{ "success": true, "data": {}, "message": "Operation completed successfully" }
```

Errors use:

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable error message" } }
```

## Main Routes

- Auth: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`
- Projects: `POST /projects`, `GET /projects`, `GET /projects/{id}`, `PATCH /projects/{id}`, `DELETE /projects/{id}`
- Requirements: `POST /projects/{id}/requirements`, `GET /projects/{id}/requirements`, `PATCH /requirements/{id}`
- Generation: `POST /projects/{id}/generate-prd`, `POST /projects/{id}/generate-architecture`, `POST /projects/{id}/generate-tasks`, `POST /projects/{id}/generate-code`
- Files: `GET /projects/{id}/files`, `GET /projects/{id}/files/{file_id}`, `PATCH /files/{file_id}`
- Agent runs: `GET /projects/{id}/agent-runs`, `GET /agent-runs/{id}`, `GET /agent-runs/{id}/steps`
- Approvals: `POST /projects/{id}/approvals`, `POST /approvals/{id}/approve`, `POST /approvals/{id}/reject`
- GitHub: `POST /projects/{id}/github/connect`, `POST /projects/{id}/github/create-repo`, `POST /projects/{id}/github/create-pr`, `GET /projects/{id}/github/status`
- Builds: `POST /projects/{id}/builds/simulate`, `GET /projects/{id}/builds`, `GET /builds/{id}`
- Audit: `GET /audit-logs`, `GET /projects/{id}/audit-logs`

