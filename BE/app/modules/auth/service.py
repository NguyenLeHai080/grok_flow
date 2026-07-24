from datetime import UTC, datetime, timedelta
from fastapi import HTTPException
from sqlalchemy import select
from app.core.config import settings
from app.core.security import create_token, fingerprint, hash_password, password_needs_rehash, verify_password
from app.modules.auth.models import RefreshSession
from app.modules.users.models import User


def authenticate(database, email, password):
    user = database.scalar(select(User).where(User.email == email.lower()))
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        raise HTTPException(401, "Email hoặc mật khẩu không đúng")
    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
        database.commit()
    return user


def issue_tokens(database, user):
    access, _, _ = create_token(user.id, "access", timedelta(minutes=settings.access_token_minutes))
    refresh, token_id, expires = create_token(user.id, "refresh", timedelta(days=settings.refresh_token_days))
    database.add(RefreshSession(user_id=user.id, token_id=token_id, token_hash=fingerprint(refresh), expires_at=expires))
    database.commit()
    return access, refresh


def validate_refresh(database, token_id, token):
    session = database.scalar(select(RefreshSession).where(RefreshSession.token_id == token_id))
    expires = session.expires_at.replace(tzinfo=UTC) if session and session.expires_at.tzinfo is None else session.expires_at if session else None
    if not session or session.revoked_at or expires <= datetime.now(UTC) or session.token_hash != fingerprint(token):
        raise HTTPException(401, "Refresh token không hợp lệ")
    return session
