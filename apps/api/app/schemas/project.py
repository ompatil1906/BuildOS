from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    idea: str = Field(min_length=10)
    target_users: str = Field(default="")
    preferred_stack: str = Field(default="Next.js, FastAPI, PostgreSQL")
    required_features: list[str] = Field(default_factory=list)
    deployment_preference: str = Field(default="Docker Compose")
    ai_features_required: list[str] = Field(default_factory=list)
    complexity: str = Field(default="standard", pattern="^(simple|standard|advanced)$")


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    idea: str | None = Field(default=None, min_length=10)
    target_users: str | None = None
    preferred_stack: str | None = None
    complexity: str | None = Field(default=None, pattern="^(simple|standard|advanced)$")
    status: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    idea: str
    target_users: str
    preferred_stack: str
    complexity: str
    status: str
    created_at: str
    updated_at: str | None

