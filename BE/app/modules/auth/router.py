from datetime import UTC, datetime
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import update
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token, hash_password, verify_password
from app.dependencies import current_user
from app.modules.auth.models import RefreshSession
from app.modules.auth.schemas import ChangePasswordInput, LoginInput, RefreshInput, TokenPair
from app.modules.auth.service import authenticate, issue_tokens, validate_refresh
from app.modules.common.services import write_audit
from app.modules.users.models import User
from app.modules.users.schemas import UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])


def set_refresh_cookie(response, token):
    response.set_cookie("groks_refresh", token, max_age=settings.refresh_token_days * 86400, httponly=True, secure=settings.cookie_secure, samesite="strict", path="/api/v1/auth")


@router.post("/login", response_model=TokenPair)
def login(payload: LoginInput, response: Response, database: Session = Depends(get_db)):
    user = authenticate(database, payload.email, payload.password)
    access, refresh = issue_tokens(database, user)
    set_refresh_cookie(response, refresh)
    write_audit(database, user.id, "login", "auth"); database.commit()
    return TokenPair(access_token=access, user=user)


@router.post("/refresh", response_model=TokenPair)
def refresh(response: Response, payload: RefreshInput | None = None, groks_refresh: str | None = Cookie(None), database: Session = Depends(get_db)):
    raw_refresh = (payload.refresh_token if payload else None) or groks_refresh
    if not raw_refresh: raise HTTPException(401, "Thiếu refresh token")
    try: decoded = decode_token(raw_refresh, "refresh")
    except ValueError as error: raise HTTPException(401, str(error)) from error
    session = validate_refresh(database, decoded["jti"], raw_refresh)
    session.revoked_at = datetime.now(UTC)
    user = database.get(User, int(decoded["sub"]))
    if not user or not user.is_active: raise HTTPException(401, "Tài khoản không hoạt động")
    access, refresh_token = issue_tokens(database, user)
    set_refresh_cookie(response, refresh_token)
    return TokenPair(access_token=access, user=user)


@router.post("/logout", status_code=204)
def logout(response: Response, payload: RefreshInput | None = None, groks_refresh: str | None = Cookie(None), database: Session = Depends(get_db)):
    raw_refresh = (payload.refresh_token if payload else None) or groks_refresh
    try:
        decoded = decode_token(raw_refresh, "refresh")
        validate_refresh(database, decoded["jti"], raw_refresh).revoked_at = datetime.now(UTC)
        database.commit()
    except (ValueError, HTTPException, TypeError):
        pass
    response.delete_cookie("groks_refresh", path="/api/v1/auth", secure=settings.cookie_secure, samesite="strict")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.post("/change-password", status_code=204)
def change_password(payload: ChangePasswordInput, database: Session = Depends(get_db), user: User = Depends(current_user)):
    if not verify_password(payload.current_password, user.password_hash): raise HTTPException(400, "Mật khẩu hiện tại không đúng")
    if payload.current_password == payload.new_password: raise HTTPException(400, "Mật khẩu mới phải khác mật khẩu hiện tại")
    user.password_hash = hash_password(payload.new_password)
    database.execute(update(RefreshSession).where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None)).values(revoked_at=datetime.now(UTC)))
    write_audit(database, user.id, "change-password", "auth"); database.commit()


@router.post("/revoke-sessions", status_code=204)
def revoke_sessions(database: Session = Depends(get_db), user: User = Depends(current_user)):
    database.execute(update(RefreshSession).where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None)).values(revoked_at=datetime.now(UTC)))
    write_audit(database, user.id, "revoke-sessions", "auth"); database.commit()
