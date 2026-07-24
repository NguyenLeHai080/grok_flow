from arq import create_pool
from arq.connections import RedisSettings
from fastapi import HTTPException

from app.core.config import settings


async def enqueue(function: str, *args):
    try:
        redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
        job = await redis.enqueue_job(function, *args)
        await redis.close()
    except Exception as error:
        raise HTTPException(503, "Job queue is unavailable") from error
    if job is None:
        raise HTTPException(503, "Job queue rejected the request")
    return job.job_id
