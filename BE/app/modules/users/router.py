from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_roles
from app.modules.common.services import write_audit
from app.modules.users.models import Role, User
from app.modules.users.schemas import UserCreate, UserOut, UserUpdate
from app.modules.users.service import apply_user_update, create_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserOut])
def index(database: Session = Depends(get_db), _: User = Depends(require_roles(Role.admin))):
    return database.scalars(select(User).order_by(User.created_at.desc())).all()


@router.post("", response_model=UserOut, status_code=201)
def create(payload: UserCreate, database: Session = Depends(get_db), actor: User = Depends(require_roles(Role.admin))):
    item = create_user(database, payload); database.add(item)
    write_audit(database, actor.id, "create", "user"); database.commit(); database.refresh(item)
    return item


@router.put("/{item_id}", response_model=UserOut)
def update_user(item_id: int, payload: UserUpdate, database: Session = Depends(get_db), actor: User = Depends(require_roles(Role.admin))):
    item = database.get(User, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy tài khoản")
    apply_user_update(item, payload); write_audit(database, actor.id, "update", f"user:{item_id}")
    database.commit(); database.refresh(item); return item


@router.delete("/{item_id}", status_code=204)
def delete_user(item_id: int, database: Session = Depends(get_db), actor: User = Depends(require_roles(Role.admin))):
    if item_id == actor.id: raise HTTPException(400, "Không thể tự xoá tài khoản")
    item = database.get(User, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy tài khoản")
    database.delete(item); write_audit(database, actor.id, "delete", f"user:{item_id}"); database.commit()
