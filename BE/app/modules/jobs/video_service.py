import json
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.modules.jobs.image_service import (
    delete_xai_input_file,
    enhance_image_prompt,
    input_image_metadata,
    upload_xai_input_image,
    validate_input_image,
)
from app.modules.jobs.media_utils import normalize_media_urls, public_media_url
from app.modules.jobs.models import JobStatus
from app.modules.proxies.service import proxy_api_key

async def execute_media_job(job, payload, proxy):
    job.status = JobStatus.running
    job.error = None
    provider = proxy.provider.lower()
    use_grok2api = provider == "grok2api"
    use_direct_xai = not use_grok2api and payload.mode in ("t2i", "i2i", "i2v")
    if payload.mode == "i2i" and "edit" not in payload.model.lower():
        raise ValueError(
            "The selected proxy does not expose an image-edit model. Choose a model containing 'edit' or use T2I."
        )
    if use_direct_xai and not settings.xai_api_key:
        raise ValueError(
            f"{payload.mode.upper()} requires XAI_API_KEY because Grok OAuth returned media unrelated to the request."
        )
    oauth_token = settings.xai_api_key if payload.mode == "i2v" else None
    selected_proxy_key = proxy_api_key(proxy)
    if use_grok2api and not selected_proxy_key:
        raise ValueError("Grok2API client key is missing. Set GROK2API_API_KEY after creating a Client Key in Grok2API.")
    access_token = settings.xai_api_key if use_direct_xai else selected_proxy_key
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    prompt_headers = {
        "Authorization": f"Bearer {selected_proxy_key}",
        "Content-Type": "application/json",
    }
    effective_prompt = job.prompt
    enhancement_error = None
    enhancement_applied = payload.enhance_prompt
    if enhancement_applied:
        effective_prompt, enhancement_error = await enhance_image_prompt(
            job.prompt, prompt_headers, payload.mode, proxy.base_url
        )
    request_payload = {"model": payload.model, "prompt": effective_prompt}
    use_build_video = use_grok2api and payload.model == "grok-imagine-video-1.5"
    effective_duration = 6 if use_build_video else payload.duration
    if payload.mode == "i2v" and not use_grok2api:
        request_payload["model"] = "grok-imagine-video"
    input_file_id = None
    endpoint = "/v1/images/generations"
    if payload.mode in ("t2i", "i2i"):
        request_payload["model"] = payload.model.removeprefix("xai/")
    image_metadata = None
    if payload.mode in ("i2i", "i2v"):
        input_image = public_media_url(payload.input_image, proxy.base_url) if use_grok2api else payload.input_image
        input_image = validate_input_image(input_image)
        image_metadata = input_image_metadata(input_image)
        if payload.mode == "i2v" and input_image.startswith("data:") and not use_grok2api:
            input_file_id = await upload_xai_input_image(input_image, oauth_token)
            request_payload["image"] = {"file_id": input_file_id}
            image_metadata["xai_file_id"] = input_file_id
        elif payload.mode == "i2v" and input_image.startswith("data:"):
            raise ValueError("Grok2API I2V requires an HTTPS image URL from a completed image Job")
        elif payload.mode == "i2v":
            request_payload["image"] = {"url": input_image}
        else:
            request_payload["image"] = {"url": input_image}
    if payload.mode in ("t2i", "i2i"):
        endpoint = "/v1/images/edits" if payload.mode == "i2i" else endpoint
        count = 1 if use_grok2api and payload.mode == "i2i" else payload.count
        resolution = "1k" if use_grok2api and payload.mode == "i2i" else payload.resolution
        request_payload.update({
            "n": count,
            "response_format": "url",
            "aspect_ratio": payload.aspect_ratio,
            "resolution": resolution,
        })
    else:
        endpoint = "/v1/videos/generations"
        if not use_build_video:
            request_payload.update({
                "duration": effective_duration,
                "aspect_ratio": payload.aspect_ratio if payload.aspect_ratio in ("16:9", "9:16") else "16:9",
                "resolution": "720p",
            })
    try:
        media_base_url = "https://api.x.ai" if use_direct_xai else proxy.base_url.rstrip("/")
        async with httpx.AsyncClient(timeout=300, follow_redirects=False) as client:
            response = await client.post(
                f"{media_base_url}{endpoint}",
                headers=headers,
                json=request_payload,
            )
            response.raise_for_status()
        result = normalize_media_urls(response.json(), proxy.base_url)
        result["groks"] = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "request": {
                "mode": payload.mode,
                "model": request_payload["model"],
                "prompt": job.prompt,
                "effective_prompt": effective_prompt,
                "aspect_ratio": request_payload.get("aspect_ratio"),
                "resolution": request_payload.get("resolution"),
                "duration": effective_duration if payload.mode in ("t2v", "i2v") else None,
                "enhancement_error": enhancement_error,
                "enhance_prompt_requested": payload.enhance_prompt,
                "enhancement_forced": False,
                "enhancement_applied": enhancement_applied,
                "has_input_image": bool(payload.input_image),
                "input_image_source": image_metadata.get("source") if image_metadata else None,
                "input_image": image_metadata,
                "input_binding": "image.file_id" if input_file_id else ("image.url" if payload.mode == "i2v" else None),
                "transport": "xai_api_key" if use_direct_xai else provider,
                "proxy_id": proxy.id,
                "proxy_base_url": proxy.base_url,
                "proxy": {"id": proxy.id, "name": proxy.name, "base_url": proxy.base_url},
            },
        }
        job.result = json.dumps(result, ensure_ascii=False)
        if payload.mode in ("t2v", "i2v"):
            job.status = JobStatus.running
        else:
            job.status = JobStatus.success
        return True, ""
    except (httpx.HTTPError, ValueError) as error:
        if input_file_id:
            await delete_xai_input_file(input_file_id, oauth_token)
        job.error = error.response.text[:4000] if isinstance(error, httpx.HTTPStatusError) else str(error)
        job.status = JobStatus.failed
        return False, job.error

async def refresh_video_job(job, proxy=None):
    if not job.result:
        return False, "Job has no video request"
    try:
        current = json.loads(job.result)
        video_id = current.get("id") or current.get("request_id")
        if not video_id:
            raise ValueError("Video request ID is missing")
        request_metadata = current.get("groks", {}).get("request", {})
        transport = request_metadata.get("transport")
        use_direct_xai = transport == "xai_api_key"
        if use_direct_xai:
            access_token = settings.xai_api_key
            media_base_url = "https://api.x.ai"
        elif proxy is not None:
            access_token = proxy_api_key(proxy)
            media_base_url = proxy.base_url.rstrip("/")
        else:
            access_token = settings.cliproxyapi_api_key
            media_base_url = f"http://127.0.0.1:{settings.cliproxyapi_port}"
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=120, follow_redirects=False) as client:
            response = await client.get(
                f"{media_base_url}/v1/videos/{video_id}",
                headers=headers,
            )
            response.raise_for_status()
        refreshed = response.json()
        refreshed.setdefault("request_id", video_id)
        refreshed["groks"] = current.get("groks", {})
        job.result = json.dumps(refreshed, ensure_ascii=False)
        status = str(refreshed.get("status", "")).lower()
        if status in ("completed", "done", "succeeded", "success"):
            job.status = JobStatus.success
        elif status == "failed":
            job.status = JobStatus.failed
            job.error = json.dumps(refreshed.get("error", "Video generation failed"), ensure_ascii=False)
        else:
            job.status = JobStatus.running
        input_file_id = (request_metadata.get("input_image") or {}).get("xai_file_id")
        if job.status in (JobStatus.success, JobStatus.failed) and input_file_id:
            await delete_xai_input_file(input_file_id, access_token)
        return True, status
    except (json.JSONDecodeError, httpx.HTTPError, ValueError) as error:
        job.error = error.response.text[:4000] if isinstance(error, httpx.HTTPStatusError) else str(error)
        job.status = JobStatus.failed
        return False, job.error
