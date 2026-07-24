from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import current_user, require_roles
from app.modules.api_keys.models import ApiKey
from app.modules.api_keys.schemas import KeyCreated, KeyInput, KeyOut
from app.modules.api_keys.service import build_api_key
from app.modules.common.services import write_audit
from app.modules.users.models import Role, User

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.get("", response_model=list[KeyOut])
def index(database: Session = Depends(get_db), _: User = Depends(current_user)):
    return database.scalars(select(ApiKey).order_by(ApiKey.created_at.desc())).all()


@router.post("", response_model=KeyCreated, status_code=201)
def create(payload: KeyInput, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    item, raw = build_api_key(payload.name, user.id); database.add(item)
    write_audit(database, user.id, "create", "api-key"); database.commit(); database.refresh(item)
    return KeyCreated(key=raw, **KeyOut.model_validate(item).model_dump())


@router.put("/{item_id}", response_model=KeyOut)
def rename(item_id: int, payload: KeyInput, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    item = database.get(ApiKey, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy API key")
    item.name = payload.name; write_audit(database, user.id, "rename", f"api-key:{item_id}"); database.commit(); database.refresh(item); return item


@router.post("/{item_id}/revoke", response_model=KeyOut)
def revoke(item_id: int, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin))):
    item = database.get(ApiKey, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy API key")
    item.revoked_at = datetime.now(UTC); write_audit(database, user.id, "revoke", f"api-key:{item_id}"); database.commit(); database.refresh(item); return item


@router.delete("/{item_id}", status_code=204)
def delete_key(item_id: int, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin))):
    item = database.get(ApiKey, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy API key")
    database.delete(item); write_audit(database, user.id, "delete", f"api-key:{item_id}"); database.commit()

