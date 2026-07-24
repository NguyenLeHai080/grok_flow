import asyncio

from app.modules.grok2api.service import Grok2APIClient


def run_readiness(responses, model="grok-imagine-image-quality"):
    client = Grok2APIClient()

    async def fake_request(method, path, **kwargs):
        for key, value in responses.items():
            if key in path:
                return value
        raise AssertionError(f"Unexpected path: {path}")

    client._request = fake_request
    return asyncio.run(client.readiness(model))


def test_readiness_reports_account_and_egress_failures():
    result = run_readiness({
        "accounts?page": {"items": [{"provider": "grok_web", "termsAcceptedAt": None, "birthDateSetAt": None}]},
        "accounts/summary": {"providers": {"grok_web": {"available": 0}}},
        "egress-nodes": {"items": [{"scope": "grok_web", "enabled": True, "probeStatus": "unhealthy"}]},
        "models?page": {"items": [{"publicId": "grok-imagine-image-quality", "provider": "grok_web"}]},
    })

    assert result["ready"] is False
    assert {issue["code"] for issue in result["issues"]} == {"account_unavailable", "egress_unavailable"}
    assert result["warnings"][0]["code"] == "account_setup_incomplete"


def test_readiness_accepts_available_account_and_healthy_egress():
    result = run_readiness({
        "accounts?page": {"items": [{"provider": "grok_web", "termsAcceptedAt": "now", "birthDateSetAt": "now"}]},
        "accounts/summary": {"providers": {"grok_web": {"available": 1}}},
        "egress-nodes": {"items": [{"scope": "grok_web", "enabled": True, "probeStatus": "healthy", "cooldownUntil": None}]},
        "models?page": {"items": [{"publicId": "grok-imagine-image-quality", "provider": "grok_web"}]},
    })

    assert result["ready"] is True
    assert result["available_accounts"] == 1
    assert result["healthy_egress_nodes"] == 1
    assert result["issues"] == []
