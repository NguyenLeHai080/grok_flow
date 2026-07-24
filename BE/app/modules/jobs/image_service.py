import base64
import binascii
import hashlib
from uuid import uuid4

import httpx

from app.core.config import settings
from app.modules.jobs.models import JobStatus
from app.modules.jobs.media_utils import normalize_media_urls
from app.modules.proxies.service import proxy_api_key, validate_proxy_url

async def enhance_image_prompt(prompt, headers, mode="t2i", proxy_base_url=None):
    mode_instructions = {
        "t2i": "Describe the requested image composition, subject, setting, style, and lighting.",
        "i2i": "Preserve the input image subject and composition while applying only the requested visual transformation.",
        "t2v": "Describe a coherent video scene with subject motion, environment motion, and camera movement.",
        "i2v": "Preserve the input image identity, face, clothing, objects, background, and composition. Add only the requested natural motion and camera movement.",
    }
    instruction = (
        "Rewrite the user request as a precise English prompt for a generative media model. "
        "Correct spelling and grammar. Resolve obvious shorthand without changing intent. "
        "Produce one detailed prompt of 30 to 70 words. Do not explain your answer. "
        f"{mode_instructions.get(mode, mode_instructions['t2i'])}\n\n"
        f"User request: {prompt}"
    )
    try:
        async with httpx.AsyncClient(timeout=120, follow_redirects=False) as client:
            response = await client.post(
                f"{(proxy_base_url or f'http://127.0.0.1:{settings.cliproxyapi_port}').rstrip('/')}/v1/chat/completions",
                headers=headers,
                json={
                    "model": "grok-4.5",
                    "messages": [{"role": "user", "content": instruction}],
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        if content:
            return content, None
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
        return prompt, str(error)
    return prompt, "Grok returned an empty enhanced prompt"

async def execute_image_job(job, model, count, response_format, enhance_prompt=True):
    job.status = JobStatus.running
    job.error = None
    variation_id = uuid4().hex
    headers = {"Authorization": f"Bearer {settings.cliproxyapi_api_key}", "Content-Type": "application/json"}
    effective_prompt = job.prompt
    enhancement_error = None
    if enhance_prompt:
        effective_prompt, enhancement_error = await enhance_image_prompt(job.prompt, headers, "t2i")
    try:
        async with httpx.AsyncClient(timeout=240, follow_redirects=False) as client:
            response = await client.post(f"http://127.0.0.1:{settings.cliproxyapi_port}/v1/images/generations", headers=headers, json={"model": model, "prompt": effective_prompt, "n": count, "response_format": response_format})
            response.raise_for_status()
        payload = response.json()
        payload["groks"] = {
            "variation_id": variation_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "request": {
                "model": model,
                "prompt": job.prompt,
                "effective_prompt": effective_prompt,
                "count": count,
                "response_format": response_format,
                "enhance_prompt": enhance_prompt,
                "enhancement_error": enhancement_error,
            },
        }
        job.result = json.dumps(payload, ensure_ascii=False)
        job.status = JobStatus.success
        return True, ""
    except (httpx.HTTPError, ValueError) as error:
        job.error = str(error)
        if isinstance(error, httpx.HTTPStatusError):
            job.error = error.response.text[:4000]
        job.status = JobStatus.failed
        return False, job.error

def validate_input_image(data_url):
    if not data_url:
        raise ValueError("An input image is required for this mode")
    if data_url.startswith("https://"):
        parsed = urlparse(data_url)
        if parsed.hostname != "imgen.x.ai" or not parsed.path.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            raise ValueError("Only HTTPS images from imgen.x.ai can be reused from Job history")
        return data_url
    prefix, separator, encoded = data_url.partition(",")
    if not separator or prefix not in ("data:image/jpeg;base64", "data:image/png;base64", "data:image/webp;base64"):
        raise ValueError("Input image must be a JPEG, PNG, or WebP data URL")
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ValueError("Input image is not valid base64") from error
    if not raw or len(raw) > 10 * 1024 * 1024:
        raise ValueError("Input image must be between 1 byte and 10 MB")
    return data_url

def input_image_metadata(input_image):
    if input_image.startswith("https://"):
        return {
            "source": "job_history",
            "url": input_image,
            "sha256": hashlib.sha256(input_image.encode("utf-8")).hexdigest(),
        }
    prefix, _, encoded = input_image.partition(",")
    raw = base64.b64decode(encoded, validate=True)
    return {
        "source": "upload",
        "mime_type": prefix.removeprefix("data:").removesuffix(";base64"),
        "size_bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
    }

async def upload_xai_input_image(input_image, access_token):
    prefix, _, encoded = input_image.partition(",")
    mime_type = prefix.removeprefix("data:").removesuffix(";base64")
    extension = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[mime_type]
    raw = base64.b64decode(encoded, validate=True)
    async with httpx.AsyncClient(timeout=120, follow_redirects=False) as client:
        response = await client.post(
            "https://api.x.ai/v1/files",
            headers={"Authorization": f"Bearer {access_token}"},
            data={"purpose": "assistants"},
            files={"file": (f"i2v-input.{extension}", raw, mime_type)},
        )
        response.raise_for_status()
    file_id = response.json().get("id")
    if not file_id:
        raise ValueError("xAI Files API did not return a file ID")
    return file_id

async def delete_xai_input_file(file_id, access_token):
    if not file_id:
        return
    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=False) as client:
            await client.delete(
                f"https://api.x.ai/v1/files/{file_id}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
    except httpx.HTTPError:
        return

