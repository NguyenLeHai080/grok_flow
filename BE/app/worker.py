from arq.connections import RedisSettings

from app.core.config import settings
from app.core.database import SessionLocal
from app.modules.common.services import write_audit
from app.modules.jobs.models import Job
from app.modules.jobs.models import JobStatus
from app.modules.jobs.schemas import MediaJobRunInput
from app.modules.jobs.service import execute_image_job, execute_job, execute_media_job
from app.modules.proxies.models import ProxyConfig


async def run_chat_job(_, job_id: int, proxy_id: int, model: str, actor_id: int):
    with SessionLocal() as database:
        job, proxy = database.get(Job, job_id), database.get(ProxyConfig, proxy_id)
        if not job or not proxy or not proxy.is_active:
            return
        try:
            success, detail = await execute_job(job, proxy, model)
        except Exception as error:
            job.status, job.error = JobStatus.failed, str(error)[:4000]
            success, detail = False, job.error
        write_audit(database, actor_id, "run-success" if success else "run-failed", f"job:{job_id}", detail)
        database.commit()


async def run_image_job(_, job_id: int, payload: dict, actor_id: int):
    with SessionLocal() as database:
        job = database.get(Job, job_id)
        if not job:
            return
        try:
            success, detail = await execute_image_job(job, **payload)
        except Exception as error:
            job.status, job.error = JobStatus.failed, str(error)[:4000]
            success, detail = False, job.error
        write_audit(database, actor_id, "image-success" if success else "image-failed", f"job:{job_id}", detail)
        database.commit()


async def run_media_job(_, job_id: int, payload_data: dict, actor_id: int):
    payload = MediaJobRunInput.model_validate(payload_data)
    with SessionLocal() as database:
        job, proxy = database.get(Job, job_id), database.get(ProxyConfig, payload.proxy_id)
        if not job or not proxy or not proxy.is_active:
            return
        try:
            success, detail = await execute_media_job(job, payload, proxy)
        except Exception as error:
            job.status, job.error = JobStatus.failed, str(error)[:4000]
            success, detail = False, job.error
        write_audit(database, actor_id, "media-success" if success else "media-failed", f"job:{job_id}", detail)
        database.commit()


class WorkerSettings:
    functions = [run_chat_job, run_image_job, run_media_job]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 4
    job_timeout = 900
