# Groks Backend

FastAPI service cho authentication, RBAC, Jobs, CLIProxyAPI, API Keys, logs, audit và quản lý tài khoản. Database mặc định của dự án là PostgreSQL qua driver Psycopg 3.

## Khởi chạy

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Cấu hình PostgreSQL trong `BE/.env` bằng URL dạng `postgresql+psycopg://user:password@host:5432/database`. File `.env` đã được git-ignore và không được commit.

API base mặc định: `http://localhost:8000/api/v1`. Có thể đổi cổng Uvicorn khi cổng mặc định đang được ứng dụng khác sử dụng.

## Endpoint groups

- `/auth`: login, refresh rotation, logout, profile, đổi mật khẩu, revoke toàn bộ sessions.
- `/dashboard/stats`: thống kê tổng hợp cho dashboard.
- `/jobs`: CRUD, retry và chạy prompt qua endpoint CLIProxyAPI đã cấu hình.
- `/proxies`: CRUD và health-check `/v1/models`.
- `/api-keys`: tạo key `uxpm_live`, đổi tên, revoke và xoá.
- `/logs`: đọc và resolve exception logs.
- `/audit-logs`: lịch sử hành động chỉ dành cho admin.
- `/users`: CRUD tài khoản và RBAC.

## Cấu trúc vertical modules

```text
app/
├── core/                  # config, database, JWT/password
├── modules/
│   ├── auth/              # model, schema, service, router
│   ├── users/             # model, schema, service, router
│   ├── jobs/              # model, schema, service, router
│   ├── proxies/           # model, schema, service, router
│   ├── api_keys/          # model, schema, service, router
│   ├── logs/              # model, schema, router
│   ├── dashboard/         # schema, router
│   └── common/            # audit model/service dùng chung
├── dependencies.py        # auth/RBAC dependencies
└── main.py                # application composition root
```

Mỗi business module sở hữu model, schema, service và router của chính nó. Không đặt nghiệp vụ mới vào file tổng hợp dùng chung.

## Chạy test

```powershell
$env:PYTHONPATH=(Get-Location)
pytest tests -q
```

## Lưu ý production

SQLite và tài khoản seed chỉ dành cho local. Production cần PostgreSQL, Alembic migrations, Redis rate limit, reverse proxy HTTPS, secrets manager và worker queue cho job dài. Raw API key chỉ trả về đúng một lần; database lưu fingerprint SHA-256.
