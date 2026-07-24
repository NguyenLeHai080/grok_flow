from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.modules.users.models import Role


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=12, max_length=128)
    role: Role = Role.viewer


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=120)
    password: str | None = Field(None, min_length=12, max_length=128)
    role: Role | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    role: Role
    is_active: bool
    created_at: datetime

