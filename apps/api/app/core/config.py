from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BuildOS"
    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "sqlite:///./buildos.sqlite3"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "replace-this-development-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    ai_provider: str = "local"
    auto_create_tables: bool = True
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None
    github_token: str | None = None
    encryption_key: str = "replace-with-32-byte-dev-key"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_production(self) -> list[str]:
        issues: list[str] = []
        if self.app_env == "production":
            if self.jwt_secret in {"replace-this-development-secret", "change-me", ""} or len(self.jwt_secret) < 32:
                issues.append("JWT_SECRET must be at least 32 characters and not use the development default.")
            if self.encryption_key in {"replace-with-32-byte-dev-key", "change-me", ""} or len(self.encryption_key) < 32:
                issues.append("ENCRYPTION_KEY must be at least 32 characters and not use the development default.")
            if self.database_url.startswith("sqlite"):
                issues.append("Production must use PostgreSQL, not sqlite.")
            if "*" in self.allowed_origins:
                issues.append("CORS_ORIGINS cannot include '*' in production.")
        return issues


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
