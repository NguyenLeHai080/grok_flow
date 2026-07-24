import json
import logging
import time
from uuid import uuid4
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.modules.api_keys.router import router as api_keys_router
from app.modules.auth.router import router as auth_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.jobs.router import router as jobs_router
from app.modules.logs.models import ErrorLog
from app.modules.logs.router import router as logs_router
from app.modules.proxies.router import router as proxies_router
from app.modules.grok2api.router import router as grok2api_router
from app.modules.users.models import Role, User
from app.modules.users.router import router as users_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.validate_security()
    if settings.environment.lower() != "production":
        Base.metadata.create_all(engine)
        with SessionLocal() as database:
            if not database.scalar(select(User).limit(1)):
                database.add(User(email="admin@groks.dev", full_name="System Admin", password_hash=hash_password("ChangeMe123!"), role=Role.admin)); database.commit()
    yield


production = settings.environment.lower() == "production"
app = FastAPI(title="Groks API", version="1.1.0", lifespan=lifespan, docs_url=None if production else "/docs", redoc_url=None if production else "/redoc", openapi_url=None if production else "/openapi.json")
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
if settings.force_https: app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type"])

traffic = defaultdict(deque)
login_traffic = defaultdict(deque)


def exceeded(bucket, key, now, window, limit):
    recent = bucket[key]
    while recent and recent[0] < now - window: recent.popleft()
    if len(recent) >= limit: return True
    recent.append(now)
    return False


@app.middleware("http")
async def secure(request: Request, call_next):
    now = time.monotonic()
    request_id = request.headers.get("x-request-id") or str(uuid4())
    address = request.client.host if request.client else "unknown"
    content_length = request.headers.get("content-length")
    try:
        if content_length and int(content_length) > settings.max_request_bytes:
            return JSONResponse({"detail": "Request body quá lớn"}, 413)
    except ValueError:
        return JSONResponse({"detail": "Content-Length không hợp lệ"}, 400)
    if exceeded(traffic, address, now, 60, 180):
        return JSONResponse({"detail": "Quá nhiều yêu cầu"}, 429, headers={"Retry-After": "60"})
    if request.url.path.endswith("/auth/login") and exceeded(login_traffic, address, now, 300, 10):
        return JSONResponse({"detail": "Tạm khoá đăng nhập trong 5 phút"}, 429, headers={"Retry-After": "300"})
    try:
        response = await call_next(request)
    except Exception as error:
        with SessionLocal() as database:
            database.add(ErrorLog(source=request.url.path[:120], message=type(error).__name__, details=str(error)[:4000])); database.commit()
        logging.exception(json.dumps({"event": "request_failed", "request_id": request_id, "path": request.url.path}))
        return JSONResponse({"detail": "Internal server error", "request_id": request_id}, 500, headers={"X-Request-ID": request_id})
    headers = {"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "Permissions-Policy": "camera=(), microphone=(), geolocation=()", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'", "Cache-Control": "no-store"}
    if settings.force_https: headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers.update(headers)
    response.headers["X-Request-ID"] = request_id
    logging.info(json.dumps({"event": "request_completed", "request_id": request_id, "method": request.method, "path": request.url.path, "status": response.status_code}))
    return response


@app.get("/api/v1/health", tags=["System"])
def health(): return {"status": "ok", "service": "Groks API"}


for route in (auth_router, dashboard_router, jobs_router, proxies_router, grok2api_router, api_keys_router, logs_router, users_router):
    app.include_router(route, prefix="/api/v1")
