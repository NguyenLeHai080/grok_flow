from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_roles
from app.modules.logs.models import ErrorLog
from app.modules.logs.schemas import LogOut
from app.modules.users.models import Role, User

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("", response_model=list[LogOut])
def index(database: Session = Depends(get_db), _: User = Depends(require_roles(Role.admin, Role.operator))):
    return database.scalars(select(ErrorLog).order_by(ErrorLog.created_at.desc()).limit(500)).all()


@router.post("/{item_id}/resolve", response_model=LogOut)
def resolve(item_id: int, database: Session = Depends(get_db), _: User = Depends(require_roles(Role.admin, Role.operator))):
    item = database.get(ErrorLog, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy log")
    item.resolved = True; database.commit(); database.refresh(item); return item

