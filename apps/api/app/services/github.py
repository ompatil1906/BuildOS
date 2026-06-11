import base64
from urllib.parse import quote

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.crypto import decrypt_secret, encrypt_secret
from app.core.responses import BuildOSError
from app.models import Approval, GeneratedFile, GitHubConnection, GitHubRepository, Project, User
from app.schemas.generated import GitHubActionRequest, GitHubConnectRequest
from app.services.audit import log_audit
from app.services.serializers import github_repo_to_dict

GITHUB_API = "https://api.github.com"


def _latest_connection(db: Session, user_id: str) -> GitHubConnection | None:
    return db.scalar(
        select(GitHubConnection).where(GitHubConnection.user_id == user_id).order_by(GitHubConnection.created_at.desc())
    )


def _github_token(db: Session, user: User) -> tuple[str | None, GitHubConnection | None]:
    connection = _latest_connection(db, user.id)
    token = decrypt_secret(connection.access_token_encrypted) if connection else None
    return token or settings.github_token, connection


def _headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _raise_github_error(response: httpx.Response, code: str, fallback: str) -> None:
    try:
        message = response.json().get("message", fallback)
    except Exception:
        message = fallback
    raise BuildOSError(code, f"{fallback}: {message}", response.status_code if response.status_code < 500 else 502)


def connect_github(db: Session, *, user: User, payload: GitHubConnectRequest) -> dict:
    if not payload.access_token:
        raise BuildOSError("GITHUB_TOKEN_REQUIRED", "A GitHub access token is required to connect real GitHub actions.", 400)
    connection = GitHubConnection(
        user_id=user.id,
        github_username=payload.github_username,
        access_token_encrypted=encrypt_secret(payload.access_token),
    )
    db.add(connection)
    log_audit(db, action="github.connected", user_id=user.id, metadata={"username": payload.github_username})
    db.commit()
    db.refresh(connection)
    return {
        "id": connection.id,
        "github_username": connection.github_username,
        "connected": True,
        "token_storage": "encrypted",
    }


def _require_approved_action(db: Session, approval_id: str | None, action_type: str, project_id: str) -> Approval:
    if not approval_id:
        raise BuildOSError("APPROVAL_REQUIRED", f"{action_type} requires an approved approval_id.", 403)
    approval = db.get(Approval, approval_id)
    if not approval or approval.project_id != project_id:
        raise BuildOSError("APPROVAL_NOT_FOUND", "Approval request was not found for this project.", 404)
    if approval.action_type != action_type:
        raise BuildOSError("APPROVAL_ACTION_MISMATCH", "Approval action type does not match the requested action.", 409)
    if approval.status != "approved":
        raise BuildOSError("APPROVAL_REQUIRED", "This action has not been approved.", 403)
    return approval


def _dry_run_repo(project: Project, payload: GitHubActionRequest) -> GitHubRepository:
    repo_name = payload.repo_name or project.slug
    return GitHubRepository(
        project_id=project.id,
        repo_name=repo_name,
        repo_url=f"https://github.com/your-org/{repo_name}",
        branch_name=payload.branch_name,
        status="dry_run_repo_created",
    )


def create_repo(db: Session, *, project: Project, user: User, payload: GitHubActionRequest) -> dict:
    _require_approved_action(db, payload.approval_id, "github.create_repo", project.id)
    repo_name = payload.repo_name or project.slug

    if payload.dry_run:
        repo = _dry_run_repo(project, payload)
    else:
        token, connection = _github_token(db, user)
        if not token:
            raise BuildOSError("GITHUB_TOKEN_REQUIRED", "Connect GitHub or set GITHUB_TOKEN before creating a repository.", 400)
        owner = connection.github_username if connection else "authenticated-user"
        with httpx.Client(timeout=30) as client:
            response = client.post(
                f"{GITHUB_API}/user/repos",
                headers=_headers(token),
                json={"name": repo_name, "private": payload.private, "auto_init": True},
            )
            if response.status_code == 422:
                repo_response = client.get(f"{GITHUB_API}/repos/{owner}/{repo_name}", headers=_headers(token))
                if repo_response.status_code >= 400:
                    _raise_github_error(repo_response, "GITHUB_REPO_LOOKUP_FAILED", "Repository already exists but could not be loaded")
                repo_payload = repo_response.json()
            elif response.status_code >= 400:
                _raise_github_error(response, "GITHUB_REPO_CREATE_FAILED", "GitHub repository creation failed")
            else:
                repo_payload = response.json()
            repo = GitHubRepository(
                project_id=project.id,
                repo_name=repo_payload["name"],
                repo_url=repo_payload["html_url"],
                branch_name=payload.branch_name,
                status="repository_created",
            )

    db.add(repo)
    log_audit(
        db,
        action="github.repo_created",
        user_id=user.id,
        project_id=project.id,
        metadata={"repo_name": repo_name, "dry_run": payload.dry_run},
    )
    db.commit()
    db.refresh(repo)
    return github_repo_to_dict(repo) or {}


def _ensure_branch(client: httpx.Client, *, token: str, owner: str, repo_name: str, branch_name: str) -> str:
    repo_response = client.get(f"{GITHUB_API}/repos/{owner}/{repo_name}", headers=_headers(token))
    if repo_response.status_code >= 400:
        _raise_github_error(repo_response, "GITHUB_REPO_LOOKUP_FAILED", "GitHub repository lookup failed")
    default_branch = repo_response.json().get("default_branch", "main")

    ref_response = client.get(f"{GITHUB_API}/repos/{owner}/{repo_name}/git/ref/heads/{default_branch}", headers=_headers(token))
    if ref_response.status_code >= 400:
        _raise_github_error(ref_response, "GITHUB_BRANCH_LOOKUP_FAILED", "GitHub default branch lookup failed")
    base_sha = ref_response.json()["object"]["sha"]

    branch_response = client.post(
        f"{GITHUB_API}/repos/{owner}/{repo_name}/git/refs",
        headers=_headers(token),
        json={"ref": f"refs/heads/{branch_name}", "sha": base_sha},
    )
    if branch_response.status_code not in {201, 422}:
        _raise_github_error(branch_response, "GITHUB_BRANCH_CREATE_FAILED", "GitHub branch creation failed")
    return default_branch


def _upsert_file(
    client: httpx.Client,
    *,
    token: str,
    owner: str,
    repo_name: str,
    branch_name: str,
    file: GeneratedFile,
    commit_message: str,
) -> None:
    encoded_path = quote(file.path, safe="/")
    existing = client.get(
        f"{GITHUB_API}/repos/{owner}/{repo_name}/contents/{encoded_path}",
        headers=_headers(token),
        params={"ref": branch_name},
    )
    payload = {
        "message": commit_message,
        "content": base64.b64encode(file.content.encode("utf-8")).decode("utf-8"),
        "branch": branch_name,
    }
    if existing.status_code == 200:
        payload["sha"] = existing.json().get("sha")
    elif existing.status_code != 404:
        _raise_github_error(existing, "GITHUB_FILE_LOOKUP_FAILED", f"GitHub file lookup failed for {file.path}")

    response = client.put(f"{GITHUB_API}/repos/{owner}/{repo_name}/contents/{encoded_path}", headers=_headers(token), json=payload)
    if response.status_code not in {200, 201}:
        _raise_github_error(response, "GITHUB_FILE_COMMIT_FAILED", f"GitHub file commit failed for {file.path}")


def create_pr(db: Session, *, project: Project, user: User, payload: GitHubActionRequest) -> dict:
    _require_approved_action(db, payload.approval_id, "github.create_pr", project.id)
    repo_name = payload.repo_name or project.slug
    repo = db.scalar(
        select(GitHubRepository).where(GitHubRepository.project_id == project.id).order_by(GitHubRepository.created_at.desc())
    )

    if payload.dry_run:
        if not repo:
            repo = _dry_run_repo(project, payload)
            db.add(repo)
            db.flush()
        repo.branch_name = payload.branch_name
        repo.pr_url = f"{repo.repo_url}/pull/1"
        repo.status = "dry_run_pr_opened"
    else:
        token, connection = _github_token(db, user)
        if not token or not connection:
            raise BuildOSError("GITHUB_TOKEN_REQUIRED", "Connect GitHub before creating a pull request.", 400)
        files = db.scalars(select(GeneratedFile).where(GeneratedFile.project_id == project.id).order_by(GeneratedFile.path.asc())).all()
        if not files:
            raise BuildOSError("NO_GENERATED_FILES", "Generate code before creating a pull request.", 409)
        owner = connection.github_username
        with httpx.Client(timeout=60) as client:
            base_branch = _ensure_branch(client, token=token, owner=owner, repo_name=repo_name, branch_name=payload.branch_name)
            for file in files:
                _upsert_file(
                    client,
                    token=token,
                    owner=owner,
                    repo_name=repo_name,
                    branch_name=payload.branch_name,
                    file=file,
                    commit_message=payload.commit_message,
                )
            pr_response = client.post(
                f"{GITHUB_API}/repos/{owner}/{repo_name}/pulls",
                headers=_headers(token),
                json={
                    "title": f"BuildOS generated workspace for {project.name}",
                    "head": payload.branch_name,
                    "base": base_branch,
                    "body": (
                        f"Generated by BuildOS for `{project.name}`.\n\n"
                        f"Includes {len(files)} files, architecture notes, test plan, Docker/CI assets, "
                        "and approval-gated release guidance."
                    ),
                },
            )
            if pr_response.status_code == 422:
                pulls = client.get(
                    f"{GITHUB_API}/repos/{owner}/{repo_name}/pulls",
                    headers=_headers(token),
                    params={"state": "open", "head": f"{owner}:{payload.branch_name}"},
                )
                if pulls.status_code >= 400 or not pulls.json():
                    _raise_github_error(pr_response, "GITHUB_PR_CREATE_FAILED", "GitHub pull request creation failed")
                pr_payload = pulls.json()[0]
            elif pr_response.status_code >= 400:
                _raise_github_error(pr_response, "GITHUB_PR_CREATE_FAILED", "GitHub pull request creation failed")
            else:
                pr_payload = pr_response.json()

        if not repo:
            repo = GitHubRepository(
                project_id=project.id,
                repo_name=repo_name,
                repo_url=f"https://github.com/{owner}/{repo_name}",
                branch_name=payload.branch_name,
                status="pull_request_opened",
            )
            db.add(repo)
            db.flush()
        repo.repo_name = repo_name
        repo.repo_url = f"https://github.com/{owner}/{repo_name}"
        repo.branch_name = payload.branch_name
        repo.pr_url = pr_payload["html_url"]
        repo.status = "pull_request_opened"

    log_audit(
        db,
        action="github.pr_created",
        user_id=user.id,
        project_id=project.id,
        metadata={"repo_name": repo.repo_name, "branch_name": repo.branch_name, "dry_run": payload.dry_run},
    )
    db.commit()
    db.refresh(repo)
    return github_repo_to_dict(repo) or {}


def github_status(db: Session, *, project: Project, user: User) -> dict:
    repo = db.scalar(
        select(GitHubRepository).where(GitHubRepository.project_id == project.id).order_by(GitHubRepository.created_at.desc())
    )
    connection = _latest_connection(db, user.id)
    return {
        "connected": bool(connection),
        "mode": "real" if connection or settings.github_token else "not_configured",
        "connection": {"github_username": connection.github_username} if connection else None,
        "repository": github_repo_to_dict(repo),
        "safety": "GitHub write actions require approved approval records.",
    }
