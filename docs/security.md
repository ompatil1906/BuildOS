# Security

BuildOS is designed to avoid unsafe AI-agent behavior in the MVP.

## Prompt Injection Guard

The API flags phrases such as:

- Ignore previous instructions
- Reveal system prompt
- Exfiltrate secrets
- Run shell command
- Delete files
- Send token
- Bypass approval
- Commit directly to main

High-risk prompts mark the project for review.

## Tool Policy

Allowed:

- `generate_text`
- `generate_file`
- `save_to_database`
- `create_github_branch`
- `create_github_pr`
- `simulate_build`
- `retrieve_context`

Denied:

- Arbitrary shell execution
- Direct production deployment
- Repository deletion
- Force push
- Reading server secrets
- Exposing environment variables

