from fastapi import HTTPException
from sqlalchemy import select
from app.core.security import hash_password
from app.modules.users.models import User


def create_user(database, payload):
    if database.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(409, "Email đã tồn tại")
    return User(email=payload.email.lower(), full_name=payload.full_name, password_hash=hash_password(payload.password), role=payload.role)


def apply_user_update(user, payload):
    values = payload.model_dump(exclude_unset=True)
    if password := values.pop("password", None): user.password_hash = hash_password(password)
    for field, value in values.items(): setattr(user, field, value)

