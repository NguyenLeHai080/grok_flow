import ipaddress
import json
import socket
from urllib.parse import urlparse
import httpx
from fastapi import HTTPException
from app.core.config import settings

def proxy_api_key(proxy):
    try:
        config = json.loads(proxy.config_json or "{}")
    except json.JSONDecodeError:
        config = {}
    configured_key = config.get("api_key") or config.get("token")
    if configured_key:
        return configured_key
    if proxy.provider.lower() == "grok2api":
        return settings.grok2api_api_key
    return settings.cliproxyapi_api_key


def validate_config(config_json):
    try: config = json.loads(config_json)
    except json.JSONDecodeError as error: raise HTTPException(422, "config_json phải là JSON hợp lệ") from error
    sensitive_names = {"cookie", "cookies", "sso", "sso-rw", "cf_clearance", "authorization", "refresh_token", "access_token"}
    def contains_sensitive(value):
        if isinstance(value, dict):
            return any(str(key).lower() in sensitive_names or contains_sensitive(item) for key, item in value.items())
        if isinstance(value, list):
            return any(contains_sensitive(item) for item in value)
        return False
    if contains_sensitive(config):
        raise HTTPException(422, "config_json khong duoc chua cookie, token hoac thong tin dang nhap")


def validate_proxy_url(base_url):
    parsed = urlparse(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
        raise HTTPException(422, "Proxy URL phải là HTTP(S) và không chứa credentials")
    if parsed.port and not 1 <= parsed.port <= 65535:
        raise HTTPException(422, "Proxy port không hợp lệ")
    if settings.allow_private_proxy_hosts:
        return
    if parsed.hostname.lower() in {"localhost", "localhost.localdomain"} or parsed.hostname.lower().endswith(".local"):
        raise HTTPException(422, "Không cho phép proxy trỏ vào mạng nội bộ")
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM)}
    except socket.gaierror as error:
        raise HTTPException(422, "Không phân giải được proxy hostname") from error
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
            raise HTTPException(422, "Không cho phép proxy trỏ vào mạng nội bộ")


async def check_health(base_url, provider="cliproxyapi", api_key=""):
    validate_proxy_url(base_url)
    if provider.lower() == "grok2api":
        endpoint = "/readyz"
        headers = {}
    else:
        endpoint = "/v1/models"
        access_token = api_key or settings.cliproxyapi_token or settings.cliproxyapi_api_key
        headers = {"Authorization": f"Bearer {access_token}"} if access_token else {}
    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=False) as client:
            async with client.stream("GET", f"{base_url.rstrip('/')}{endpoint}", headers=headers) as response:
                return {"healthy": response.is_success, "status_code": response.status_code}
    except httpx.HTTPError as error:
        return {"healthy": False, "error": str(error)}
