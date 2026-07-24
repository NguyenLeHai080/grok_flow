import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.core.config import settings
from app.main import app
from app.modules.jobs import chat_service
from app.modules.proxies.service import validate_proxy_url


def test_login_uses_httponly_cookie_and_security_headers():
    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", json={"email": "admin@groks.dev", "password": "ChangeMe123!"})
        assert response.status_code == 200
        assert "refresh_token" not in response.json()
        cookie = response.headers["set-cookie"]
        assert "groks_refresh=" in cookie
        assert "HttpOnly" in cookie
        assert "SameSite=strict" in cookie
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["cache-control"] == "no-store"


def test_request_size_limit():
    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", headers={"content-length": str(settings.max_request_bytes + 1)}, content=b"{}")
        assert response.status_code == 413


def test_private_proxy_destinations_can_be_blocked():
    original = settings.allow_private_proxy_hosts
    settings.allow_private_proxy_hosts = False
    try:
        with pytest.raises(HTTPException):
            validate_proxy_url("http://127.0.0.1:8317")
        with pytest.raises(HTTPException):
            validate_proxy_url("http://169.254.169.254/latest/meta-data")
        validate_proxy_url("http://grok2api:8000", "grok2api")
        with pytest.raises(HTTPException):
            validate_proxy_url("http://backend:8000", "grok2api")
    finally:
        settings.allow_private_proxy_hosts = original


def test_proxy_url_rejects_embedded_credentials():
    with pytest.raises(HTTPException):
        validate_proxy_url("https://user:password@example.com")

def test_chat_job_validates_managed_proxy_provider(monkeypatch):
    def validate(base_url, provider):
        assert base_url == "http://grok2api:8000"
        assert provider == "grok2api"
        raise RuntimeError("validation observed")

    monkeypatch.setattr(chat_service, "validate_proxy_url", validate)
    job = SimpleNamespace(status=None, error=None)
    proxy = SimpleNamespace(base_url="http://grok2api:8000", provider="grok2api")

    with pytest.raises(RuntimeError, match="validation observed"):
        asyncio.run(chat_service.execute_job(job, proxy, "grok-4.5"))
