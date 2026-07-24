# Groks Control Center

[![CI](https://github.com/NguyenLeHai080/grok_flow/actions/workflows/ci.yml/badge.svg)](https://github.com/NguyenLeHai080/grok_flow/actions/workflows/ci.yml)

> Delivery branches: `dev` for integration, `staging` for QA/UAT, and `prod` for production. Contributions use short-lived `feat/*`, `fix/*`, or `hotfix/*` branches and pull requests.

Groks is a single-domain AI operations platform composed of:

- `FE`: React 19, Vite, CoreUI administration interface.
- `BE`: FastAPI API, authentication, RBAC, jobs, proxies, audit logs, and Grok2API integration.
- `grok2api-main`: embedded Grok Web/Build/Console gateway and administration console.
- `docker-compose.yml`: unified local and production-oriented runtime.

## Quick start with Docker

1. Create the root environment file:

```powershell
Copy-Item .env.example .env
```

2. Set at least these values in `.env`:

```dotenv
SECRET_KEY=replace-with-a-random-string-of-at-least-32-characters
GROK2API_ADMIN_PASSWORD=the-password-from-grok2api-main-config
GROK2API_API_KEY=g2a_your_api_key
GROK2API_VOLUME=grok2api_grok2api-data
```

3. Ensure `grok2api-main/config.yaml` contains valid Grok2API secrets and the same administrator password.

`GROK2API_VOLUME` points to the existing standalone Grok2API data volume, so accounts, quotas, and runtime settings are preserved during migration into the unified stack.

The backend container reuses `BE/groks.db` and loads `BE/.env`, preserving current users and Grok2API administration credentials. Root `.env` values can override deployment-specific Compose settings.

4. Start the full stack:

```powershell
docker compose up -d --build
```

5. Open `http://127.0.0.1:8080`.

The browser uses one origin only:

- `/`: Groks frontend.
- `/api/v1`: Groks backend.
- `/grok2api-runtime`: embedded Grok2API console and runtime.

Optional Cloudflare/egress services:

```powershell
docker compose --profile warp --profile flaresolverr up -d
```

Inside Grok2API, use `socks5://warp:1080` for WARP and `http://flaresolverr:8191` for FlareSolverr.

## Development

### Backend

```powershell
cd BE
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

### Frontend

```powershell
cd FE
npm install
Copy-Item .env.example .env
npm run dev -- --port 5174
```

### Grok2API

```powershell
cd grok2api-main
docker compose --profile warp --profile flaresolverr up -d --build
```

For local development, configure the backend with `GROK2API_BASE_URL=http://127.0.0.1:8002` and expose Grok2API on port `8002` in its standalone compose file.

## Database migrations

Development SQLite t? t?o schema ?? kh?i ??ng nhanh. Production kh?ng ch?y `create_all`; Alembic l? ngu?n qu?n l? schema duy nh?t.

```powershell
cd BE

# Xem revision hi?n t?i
.venv\Scripts\alembic.exe current

# ?p d?ng migration
.venv\Scripts\alembic.exe upgrade head

# Sau khi thay ??i models
.venv\Scripts\alembic.exe revision --autogenerate -m "describe change"
.venv\Scripts\alembic.exe check
```

Database SQLite hi?n t?i ?? ???c stamp t?i initial revision. Kh?ng ch?y `stamp` cho database m?i; d?ng `upgrade head`.

## Production with PostgreSQL

?i?n c?c bi?n `PUBLIC_ORIGIN`, `PUBLIC_HOST`, `POSTGRES_DB`, `POSTGRES_USER` v? `POSTGRES_PASSWORD`, sau ?? ch?y:

```powershell
docker compose -f docker-compose.yml -f docker-compose.production.yml --profile warp --profile flaresolverr up -d --build
```

Production override kh?i ??ng PostgreSQL, ch?y `alembic upgrade head`, r?i m?i ch?y FastAPI.

## Background jobs

- Development d?ng `JOB_EXECUTION_MODE=inline` ?? ch?y ??n gi?n, kh?ng c?n Redis.
- Production d?ng `JOB_EXECUTION_MODE=queue`. API ch? x?p h?ng; service `worker` th?c thi chat, image v? media qua ARQ.
- Redis URL ???c c?u h?nh b?ng `REDIS_URL`. Production Compose b?t Redis persistence v? health check.
- M?i request tr? header `X-Request-ID`; backend ghi structured log cho request ho?n t?t v? request l?i.

Theo d?i worker:

```powershell
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f worker redis
```

## Validation

```powershell
cd BE
.venv\Scripts\python.exe -m pytest

cd ..\FE
npm run lint
npm run format:check
npm run build

cd ..
docker compose config --quiet
```

## Architecture rules

- Keep HTTP routes thin; place provider and business logic in module services.
- Keep each frontend domain in `FE/src/modules`; reusable code belongs in `FE/src/shared`.
- Access Grok2API administration through the Groks backend proxy instead of exposing credentials to the browser.
- Check `/api/v1/grok2api/readiness` before submitting Grok media jobs.
- Add database migrations before changing persisted schemas in production.
- Move SQLite to PostgreSQL and in-memory coordination to Redis before horizontal scaling.
- Never commit `.env`, Grok2API credentials, API keys, Cloudflare cookies, or generated databases.

## Engineering workflow

- Read `CONTRIBUTING.md` before creating a branch or pull request.
- Follow the complete branch and promotion policy in `docs/GITFLOW.md`.
- Run delivery using the roles, events, and quality gates in `docs/SCRUM.md`.
- Configure environments and rollback procedures from `docs/DEPLOYMENT.md`.
- Format commits as `type(optional-scope): description #issue-id`.

## Production checklist

- Set `ENVIRONMENT=production`, a strong `SECRET_KEY`, HTTPS, secure cookies, exact hosts, and exact CORS origins.
- Put the stack behind TLS and expose only the frontend/reverse-proxy port.
- Use PostgreSQL, backups, migrations, centralized logs, rate limiting, and monitoring.
- Rotate the seeded development administrator immediately; production should provision administrators explicitly.
- Verify Grok account authentication, quota, Terms/Birth Date state, egress health, and Cloudflare Clearance before enabling jobs.
