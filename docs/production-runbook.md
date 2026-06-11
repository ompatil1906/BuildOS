# Production Runbook

Use this flow for a fresh BuildOS workspace.

1. Start the API and web app.
2. Create a user account from `/signup`.
3. Create a project from `/projects/new`.
4. Generate the PRD, architecture, tasks, and code.
5. Review agent runs, generated files, and security findings.
6. Connect GitHub with a fine-grained token on the project GitHub page.
7. Request approval for repository creation or pull request creation.
8. Approve the request with an authenticated user.
9. Create the repository or pull request.
10. Run the build readiness check.
11. Review audit logs before external release activity.

Required GitHub token scopes depend on your target repository policy. For fine-grained tokens, grant repository contents read/write, pull request read/write, and metadata read access for the intended repository or organization.
