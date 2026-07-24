from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.modules.users.models import Role, User

bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), database: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(401, "Cần đăng nhập")
    try:
        user = database.get(User, int(decode_token(credentials.credentials, "access")["sub"]))
    except (ValueError, TypeError):
        user = None
    if not user or not user.is_active:
        raise HTTPException(401, "Phiên đăng nhập không hợp lệ")
    return user


def require_roles(*roles):
    def check(user: User = Depends(current_user)):
        if user.role not in roles:
            raise HTTPException(403, "Không đủ quyền")
        return user
    return check
