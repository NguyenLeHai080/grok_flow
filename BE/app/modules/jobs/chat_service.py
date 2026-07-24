import json

import httpx

from app.core.config import settings
from app.modules.jobs.models import JobStatus
from app.modules.proxies.service import proxy_api_key, validate_proxy_url

async def execute_job(job, proxy, model):
    validate_proxy_url(proxy.base_url, proxy.provider)
    job.status = JobStatus.running
    job.error = None
    headers = {"Content-Type": "application/json"}
    api_key = proxy_api_key(proxy)
    if api_key: headers["Authorization"] = f"Bearer {api_key}"
    try:
        async with httpx.AsyncClient(timeout=120, follow_redirects=False) as client:
            async with client.stream("POST", f"{proxy.base_url.rstrip('/')}/v1/chat/completions", headers=headers, json={"model": model, "messages": [{"role": "user", "content": job.prompt}]}) as response:
                response.raise_for_status()
                chunks, size = [], 0
                async for chunk in response.aiter_bytes():
                    size += len(chunk)
                    if size > settings.max_provider_response_bytes:
                        raise ValueError("Provider response vượt giới hạn cho phép")
                    chunks.append(chunk)
        job.result = json.dumps(json.loads(b"".join(chunks)), ensure_ascii=False)
        job.status = JobStatus.success
        return True, ""
    except (httpx.HTTPError, ValueError) as error:
        job.error = str(error)
        job.status = JobStatus.failed
        return False, str(error)

