from urllib.parse import urlparse

from app.core.config import settings

def public_media_url(value, proxy_base_url):
    if not isinstance(value, str):
        return value
    proxy_origin = urlparse(proxy_base_url)
    parsed = urlparse(value)
    internal_hosts = {"127.0.0.1", "localhost", proxy_origin.hostname}
    if parsed.hostname not in internal_hosts or not (parsed.path.startswith("/v1/media/") or parsed.path.startswith("/v1/videos/")):
        return value
    public_origin = settings.public_origin.rstrip("/")
    if parsed.path.startswith("/v1/videos/"):
        return f"{public_origin}/api/v1/media{parsed.path.removeprefix('/v1')}"
    return f"{public_origin}/grok2api-runtime{parsed.path}" + (f"?{parsed.query}" if parsed.query else "")

def normalize_media_urls(result, proxy_base_url):

    def normalize(value):
        if isinstance(value, dict):
            return {key: normalize(item) for key, item in value.items()}
        if isinstance(value, list):
            return [normalize(item) for item in value]
        if isinstance(value, str):
            return public_media_url(value, proxy_base_url)
        return value

    return normalize(result)
