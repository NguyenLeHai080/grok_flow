# Kiến trúc và quy tắc bảo trì

## Cấu trúc chính

```text
Groks/
├── BE/                 FastAPI control plane
├── FE/                 React administration UI
├── grok2api-main/      Mã nguồn Grok2API được nhúng
├── docs/               Tài liệu kiến trúc và bảo mật
├── docker-compose.yml  Runtime trên một domain
└── README.md           Hướng dẫn vận hành
```

## Backend

Backend dùng vertical slice tại `BE/app/modules/<domain>`.

- `router.py`: HTTP, dependency và RBAC; không chứa xử lý provider dài.
- `schemas.py`: request/response contracts.
- `models.py`: SQLAlchemy entities.
- `service.py`: facade công khai của module.
- Service chuyên biệt như `chat_service.py`, `image_service.py`, `video_service.py`: nghiệp vụ theo use case.
- `app/main.py`: composition root, middleware và đăng ký router.

Không tạo file trống để giữ chỗ. Chỉ thêm file khi module thực sự có trách nhiệm tương ứng.

## Frontend

- `src/app`: layout, navigation và router.
- `src/modules/<domain>`: page, component và style riêng của domain.
- `src/shared`: API client, hook và component dùng lại.
- Page chỉ giữ state/orchestration; bảng, form và modal phải tách thành component.
- Style global chỉ chứa foundation/layout dùng chung. Style domain đặt cạnh module.

## Grok2API

`grok2api-main` là source dependency nội bộ, không phải thư mục rác. Docker build trực tiếp từ source này. Không sao chép thêm một bản Grok2API vào `FE`, `BE` hoặc `services`.

Browser không nhận admin password Grok2API. Các thao tác quản trị đi qua backend proxy:

`FE -> /api/v1/grok2api/admin/* -> BE -> grok2api`

## Dữ liệu và artifact

- Database Groks duy nhất: `BE/groks.db` trong local Docker hiện tại.
- Dữ liệu Grok2API nằm trong Docker volume được chỉ định bởi `GROK2API_VOLUME`.
- Không commit `node_modules`, `.venv`, `dist`, cache, bytecode, `.env`, database hoặc snapshot tạm.
- `dist`, cache và bytecode có thể xóa bất kỳ lúc nào vì build/test sẽ tạo lại.

## Thêm module mới

1. Tạo vertical slice backend và test quyền truy cập.
2. Đăng ký router tại `BE/app/main.py`.
3. Tạo frontend module với page mỏng và component nhỏ.
4. Thêm route và navigation.
5. Chạy test, lint, format và production build.

## Hướng mở rộng production

- Thay SQLite bằng PostgreSQL và thêm Alembic migrations.
- Chuyển job dài sang worker queue.
- Dùng Redis cho rate limit và coordination khi chạy nhiều replica.
- Đưa secrets vào secret manager và chỉ public reverse proxy.
