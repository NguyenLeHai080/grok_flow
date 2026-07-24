from pydantic import BaseModel, EmailStr, Field
from app.modules.users.schemas import UserOut


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshInput(BaseModel):
    refresh_token: str | None = None


class ChangePasswordInput(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class TokenPair(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
