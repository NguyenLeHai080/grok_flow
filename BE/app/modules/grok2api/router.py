from fastapi import APIRouter, Depends, HTTPException, Request

from app.dependencies import require_roles
from app.modules.grok2api.service import client
from app.modules.users.models import Role, User

router = APIRouter(prefix="/grok2api", tags=["Grok2API"])


async def forward_admin(path, request, user):
    if request.method != "GET" and user.role != Role.admin:
        raise HTTPException(403, "Only administrators can change Grok2API data")
    body = None
    if request.method in {"POST", "PATCH", "PUT"}:
        raw_body = await request.body()
        body = await request.json() if raw_body else None
    return await client.proxy_admin(request.method, path, body, dict(request.query_params))


@router.get("/admin/{path:path}")
async def get_admin(path: str, request: Request, user: User = Depends(require_roles(Role.admin, Role.operator))):
    return await forward_admin(path, request, user)


@router.post("/admin/{path:path}")
async def post_admin(path: str, request: Request, user: User = Depends(require_roles(Role.admin, Role.operator))):
    return await forward_admin(path, request, user)


@router.patch("/admin/{path:path}")
async def patch_admin(path: str, request: Request, user: User = Depends(require_roles(Role.admin, Role.operator))):
    return await forward_admin(path, request, user)


@router.put("/admin/{path:path}")
async def put_admin(path: str, request: Request, user: User = Depends(require_roles(Role.admin, Role.operator))):
    return await forward_admin(path, request, user)


@router.delete("/admin/{path:path}")
async def delete_admin(path: str, request: Request, user: User = Depends(require_roles(Role.admin, Role.operator))):
    return await forward_admin(path, request, user)


@router.get("/status")
async def status(_: User = Depends(require_roles(Role.admin, Role.operator, Role.viewer))):
    return await client.status()


@router.get("/models")
async def models(_: User = Depends(require_roles(Role.admin, Role.operator, Role.viewer))):
    return await client.models()


@router.get("/accounts")
async def accounts(_: User = Depends(require_roles(Role.admin, Role.operator))):
    return await client.accounts()

@router.get("/readiness")
async def readiness(model: str | None = None, _: User = Depends(require_roles(Role.admin, Role.operator, Role.viewer))):
    return await client.readiness(model)


@router.post("/sync-models")
async def sync_models(_: User = Depends(require_roles(Role.admin, Role.operator))):
    return await client.sync_models()


@router.post("/refresh-accounts")
async def refresh_accounts(_: User = Depends(require_roles(Role.admin))):
    return await client.refresh_accounts()
