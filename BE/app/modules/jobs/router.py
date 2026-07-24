import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import current_user, require_roles
from app.modules.common.services import write_audit
from app.modules.grok2api.service import client as grok2api_client
from app.modules.jobs.models import Job
from app.modules.jobs.schemas import ImageJobRunInput, JobInput, JobOut, JobRunInput, JobUpdate, MediaJobRunInput
from app.modules.jobs.service import execute_image_job, execute_job, execute_media_job, refresh_video_job
from app.modules.proxies.models import ProxyConfig
from app.modules.users.models import Role, User

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=list[JobOut])
def index(database: Session = Depends(get_db), _: User = Depends(current_user)):
    return database.scalars(select(Job).order_by(Job.created_at.desc())).all()


@router.post("", response_model=JobOut, status_code=201)
def create(payload: JobInput, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    job = Job(**payload.model_dump(), created_by=user.id); database.add(job)
    write_audit(database, user.id, "create", "job"); database.commit(); database.refresh(job); return job


@router.put("/{item_id}", response_model=JobOut)
def update_job(item_id: int, payload: JobUpdate, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    job = database.get(Job, item_id)
    if not job: raise HTTPException(404, "Không tìm thấy job")
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(job, field, value)
    write_audit(database, user.id, "update", f"job:{item_id}"); database.commit(); database.refresh(job); return job


@router.delete("/{item_id}", status_code=204)
def delete_job(item_id: int, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin))):
    job = database.get(Job, item_id)
    if not job: raise HTTPException(404, "Không tìm thấy job")
    database.execute(update(Job).where(Job.retry_of_id == item_id).values(retry_of_id=None))
    database.delete(job); write_audit(database, user.id, "delete", f"job:{item_id}"); database.commit()


@router.post("/{item_id}/retry", response_model=JobOut, status_code=201)
def retry(item_id: int, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    source = database.get(Job, item_id)
    if not source: raise HTTPException(404, "Không tìm thấy job")
    job = Job(provider=source.provider, type=source.type, prompt=source.prompt, retry_of_id=source.id, created_by=user.id)
    database.add(job); write_audit(database, user.id, "retry", f"job:{item_id}"); database.commit(); database.refresh(job); return job


@router.post("/{item_id}/run", response_model=JobOut)
async def run(item_id: int, payload: JobRunInput, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    job, proxy = database.get(Job, item_id), database.get(ProxyConfig, payload.proxy_id)
    if not job: raise HTTPException(404, "Không tìm thấy job")
    if not proxy or not proxy.is_active: raise HTTPException(400, "Proxy không tồn tại hoặc đã tắt")
    success, detail = await execute_job(job, proxy, payload.model)
    write_audit(database, user.id, "run-success" if success else "run-failed", f"job:{item_id}", detail or f"proxy:{proxy.id}")
    database.commit(); database.refresh(job); return job


@router.post("/{item_id}/run-image", response_model=JobOut)
async def run_image(item_id: int, payload: ImageJobRunInput, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    job = database.get(Job, item_id)
    if not job: raise HTTPException(404, "Không tìm thấy job")
    if job.type.lower() != "image": raise HTTPException(400, "Job phải có type=image")
    success, detail = await execute_image_job(job, payload.model, payload.count, payload.response_format, payload.enhance_prompt)
    write_audit(database, user.id, "image-success" if success else "image-failed", f"job:{item_id}", detail or payload.model)
    database.commit(); database.refresh(job); return job

@router.post("/{item_id}/run-media", response_model=JobOut)
async def run_media(item_id: int, payload: MediaJobRunInput, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    job = database.get(Job, item_id)
    if not job: raise HTTPException(404, "Job not found")
    proxy = database.get(ProxyConfig, payload.proxy_id)
    if not proxy or not proxy.is_active: raise HTTPException(400, "Proxy does not exist or is inactive")
    if proxy.provider.lower() == "grok2api":
        readiness = await grok2api_client.readiness(payload.model)
        if not readiness["ready"]:
            raise HTTPException(503, {
                "code": "grok2api_not_ready",
                "message": "Grok2API is not ready for this model",
                "readiness": readiness,
            })
    try:
        success, detail = await execute_media_job(job, payload, proxy)
    except ValueError as error:
        raise HTTPException(400, str(error)) from error
    write_audit(database, user.id, "media-success" if success else "media-failed", f"job:{item_id}", detail or f"proxy:{proxy.id};model:{payload.model}")
    database.commit(); database.refresh(job); return job

@router.post("/{item_id}/refresh-media", response_model=JobOut)
async def refresh_media(item_id: int, database: Session = Depends(get_db), user: User = Depends(require_roles(Role.admin, Role.operator))):
    job = database.get(Job, item_id)
    if not job: raise HTTPException(404, "Job not found")
    proxy = None
    if job.result:
        try:
            proxy_id = json.loads(job.result).get("groks", {}).get("request", {}).get("proxy_id")
            if proxy_id:
                proxy = database.get(ProxyConfig, int(proxy_id))
        except (json.JSONDecodeError, TypeError, ValueError):
            proxy = None
    success, detail = await refresh_video_job(job, proxy)
    write_audit(database, user.id, "media-refresh", f"job:{item_id}", detail)
    database.commit(); database.refresh(job); return job
