import httpx
from datetime import datetime, timezone
from fastapi import HTTPException

from app.core.config import settings


class Grok2APIClient:
    def __init__(self):
        self.base_url = settings.grok2api_base_url.rstrip("/")

    async def _request(self, method, path, *, admin=False, **kwargs):
        headers = dict(kwargs.pop("headers", {}))
        if admin:
            headers["Authorization"] = f"Bearer {await self._admin_token()}"
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.request(method, f"{self.base_url}{path}", headers=headers, **kwargs)
        except httpx.RequestError as error:
            raise HTTPException(503, f"Cannot connect to Grok2API: {error}") from error
        if response.status_code >= 400:
            raise HTTPException(response.status_code, self._error_detail(response))
        if response.status_code == 204:
            return None
        try:
            payload = response.json()
        except ValueError:
            return {"message": response.text}
        return payload.get("data", payload) if isinstance(payload, dict) else payload

    async def _admin_token(self):
        if not settings.grok2api_admin_password:
            raise HTTPException(503, "GROK2API_ADMIN_PASSWORD is not configured")
        payload = await self._request(
            "POST",
            "/api/admin/v1/auth/login",
            json={"username": settings.grok2api_admin_username, "password": settings.grok2api_admin_password},
        )
        token = payload.get("tokens", {}).get("accessToken") if isinstance(payload, dict) else None
        if not token:
            raise HTTPException(502, "Grok2API did not return an admin access token")
        return token

    @staticmethod
    def _error_detail(response):
        try:
            payload = response.json()
            if isinstance(payload, dict):
                error = payload.get("error")
                if isinstance(error, dict):
                    return error.get("message") or error.get("code") or response.text[:1000]
                return payload.get("message") or payload.get("detail") or response.text[:1000]
        except ValueError:
            pass
        return response.text[:1000] or "Grok2API request failed"

    async def status(self):
        health = await self._request("GET", "/healthz")
        try:
            readiness = await self._request("GET", "/readyz")
            ready = True
        except HTTPException as error:
            readiness = {"detail": error.detail}
            ready = False
        return {
            "running": True,
            "ready": ready,
            "base_url": self.base_url,
            "health": health,
            "readiness": readiness,
            "api_key_configured": bool(settings.grok2api_api_key),
            "admin_configured": bool(settings.grok2api_admin_password),
        }

    async def models(self):
        return await self._request("GET", "/api/admin/v1/models?page=1&pageSize=500", admin=True)

    async def accounts(self):
        return await self._request("GET", "/api/admin/v1/accounts?page=1&pageSize=500", admin=True)

    async def sync_models(self):
        return await self._request("POST", "/api/admin/v1/models/sync", admin=True, json={})

    async def refresh_accounts(self):
        return await self._request("POST", "/api/admin/v1/accounts/refresh-tokens", admin=True, json={})

    async def readiness(self, model: str | None = None):
        accounts = await self._request("GET", "/api/admin/v1/accounts?page=1&pageSize=500", admin=True)
        summary = await self._request("GET", "/api/admin/v1/accounts/summary", admin=True)
        egress = await self._request("GET", "/api/admin/v1/egress-nodes", admin=True)
        models = await self._request("GET", "/api/admin/v1/models?page=1&pageSize=500", admin=True)

        account_items = accounts.get("items", []) if isinstance(accounts, dict) else accounts
        model_items = models.get("items", []) if isinstance(models, dict) else models
        egress_items = egress.get("items", []) if isinstance(egress, dict) else egress
        route = next((item for item in model_items if item.get("publicId") == model or item.get("id") == model), None)
        provider = (route or {}).get("provider") or ("grok_web" if model and "imagine" in model else None)
        provider_summary = summary.get("providers", {}).get(provider, {}) if provider else {}
        available_accounts = int(provider_summary.get("available", 0))

        now = datetime.now(timezone.utc)
        compatible_egress = [item for item in egress_items if item.get("scope") == provider and item.get("enabled")]
        healthy_egress = []
        for item in compatible_egress:
            cooldown = item.get("cooldownUntil")
            cooldown_active = False
            if cooldown:
                try:
                    cooldown_active = datetime.fromisoformat(cooldown.replace("Z", "+00:00")) > now
                except ValueError:
                    cooldown_active = True
            if item.get("probeStatus") == "healthy" and not cooldown_active:
                healthy_egress.append(item)

        issues = []
        warnings = []
        if not route and model:
            issues.append({"code": "model_unavailable", "message": "The requested model is not available"})
        if provider and available_accounts < 1:
            issues.append({"code": "account_unavailable", "message": f"No available {provider} account"})
        if provider in {"grok_web", "grok_console"} and not healthy_egress:
            issues.append({"code": "egress_unavailable", "message": f"No healthy {provider} egress node"})
        if provider == "grok_web":
            incomplete = [
                item for item in account_items
                if item.get("provider") == "grok_web"
                and (not item.get("termsAcceptedAt") or not item.get("birthDateSetAt"))
            ]
            if incomplete:
                warnings.append({"code": "account_setup_incomplete", "message": "Some Grok Web accounts have incomplete Terms or Birth Date setup"})

        return {
            "ready": not issues,
            "model": model,
            "provider": provider,
            "available_accounts": available_accounts,
            "healthy_egress_nodes": len(healthy_egress),
            "issues": issues,
            "warnings": warnings,
        }

    async def proxy_admin(self, method, path, body=None, query=None):
        clean_path = "/api/admin/v1/" + path.lstrip("/")
        blocked = ("/auth/", "/system/update", "/settings/security")
        if any(value in clean_path for value in blocked):
            raise HTTPException(403, "This admin operation is not available through the Groks proxy")
        kwargs = {"params": query or {}}
        if body is not None:
            kwargs["json"] = body
        return await self._request(method, clean_path, admin=True, **kwargs)


client = Grok2APIClient()
