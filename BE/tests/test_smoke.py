from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client):
    response = client.post("/api/v1/auth/login", json={"email": "admin@groks.dev", "password": "ChangeMe123!"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_health_and_authenticated_crud():
    with TestClient(app) as client:
        health = client.get("/api/v1/health", headers={"X-Request-ID": "smoke-request"})
        assert health.status_code == 200
        assert health.headers["X-Request-ID"] == "smoke-request"
        headers = auth_headers(client)
        created = client.post("/api/v1/jobs", headers=headers, json={"provider": "openai", "type": "chat", "prompt": "smoke test"})
        assert created.status_code == 201
        job_id = created.json()["id"]
        assert client.post(f"/api/v1/jobs/{job_id}/retry", headers=headers).status_code == 201
        assert client.get("/api/v1/jobs", headers=headers).status_code == 200
        stats = client.get("/api/v1/dashboard/stats", headers=headers)
        assert stats.status_code == 200
        assert stats.json()["jobs_total"] >= 2
        created_key = client.post("/api/v1/api-keys", headers=headers, json={"name": "smoke-key"})
        assert created_key.status_code == 201
        assert created_key.json()["key"].startswith("uxpm_live_")
        key_id = created_key.json()["id"]
        assert client.post(f"/api/v1/api-keys/{key_id}/revoke", headers=headers).status_code == 200
        assert client.delete(f"/api/v1/api-keys/{key_id}", headers=headers).status_code == 204
        assert client.get("/api/v1/audit-logs", headers=headers).status_code == 200
        assert client.delete(f"/api/v1/jobs/{job_id}", headers=headers).status_code == 204
