import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import current_user, require_roles
from app.modules.common.services import write_audit
from app.modules.proxies.models import ProxyConfig
from app.modules.proxies.schemas import ProxyInput, ProxyOut
from app.modules.proxies.service import check_health, proxy_api_key, validate_config, validate_proxy_url
from app.modules.users.models import Role, User

router = APIRouter(prefix="/proxies", tags=["ProxyAPI"])


@router.get("", response_model=list[ProxyOut])
def index(database: Session = Depends(get_db), _: User = Depends(current_user)):
    return database.scalars(select(ProxyConfig).order_by(ProxyConfig.created_at.desc())).all()


@router.post("", response_model=ProxyOut, status_code=201)
def create(payload: ProxyInput, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    validate_config(payload.config_json); validate_proxy_url(payload.base_url, payload.provider); item = ProxyConfig(**payload.model_dump()); database.add(item)
    write_audit(database, user.id, "create", "proxy"); database.commit(); database.refresh(item); return item


@router.put("/{item_id}", response_model=ProxyOut)
def update_proxy(item_id: int, payload: ProxyInput, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    validate_config(payload.config_json); validate_proxy_url(payload.base_url, payload.provider); item = database.get(ProxyConfig, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy proxy")
    for field, value in payload.model_dump().items(): setattr(item, field, value)
    write_audit(database, user.id, "update", f"proxy:{item_id}"); database.commit(); database.refresh(item); return item


@router.delete("/{item_id}", status_code=204)
def delete_proxy(item_id: int, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin))):
    item = database.get(ProxyConfig, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy proxy")
    database.delete(item); write_audit(database, user.id, "delete", f"proxy:{item_id}"); database.commit()


@router.post("/{item_id}/health")
async def health(item_id: int, database: Session = Depends(get_db), _: User = Depends(current_user)):
    item = database.get(ProxyConfig, item_id)
    if not item: raise HTTPException(404, "Không tìm thấy proxy")
    return await check_health(item.base_url, item.provider, proxy_api_key(item))

@router.get("/{item_id}/models")
async def models(item_id: int, database: Session = Depends(get_db), _: User = Depends(current_user)):
    item = database.get(ProxyConfig, item_id)
    if not item or not item.is_active: raise HTTPException(404, "Proxy does not exist or is inactive")
    validate_proxy_url(item.base_url, item.provider)
    api_key = proxy_api_key(item)
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.get(f"{item.base_url.rstrip('/')}/v1/models", headers=headers)
        if response.status_code >= 400: raise HTTPException(response.status_code, response.text[:1000])
        return response.json().get("data", [])
    except httpx.HTTPError as error:
        raise HTTPException(502, f"Proxy unavailable: {error}") from error
