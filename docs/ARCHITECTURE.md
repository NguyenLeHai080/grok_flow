# Ki?n tr?c v? quy t?c b?o tr?

## C?u tr?c ch?nh

```text
Groks/
??? BE/                 FastAPI control plane
??? FE/                 React administration UI
??? grok2api-main/      Grok2API source ???c nh?ng
??? docs/               T?i li?u ki?n tr?c v? b?o m?t
??? docker-compose.yml  Runtime m?t domain
??? README.md           H??ng d?n v?n h?nh
```

## Backend

Backend d?ng vertical slice t?i `BE/app/modules/<domain>`.

- `router.py`: HTTP, dependency v? RBAC; kh?ng ch?a x? l? provider d?i.
- `schemas.py`: request/response contracts.
- `models.py`: SQLAlchemy entities.
- `service.py`: facade c?ng khai c?a module.
- Service chuy?n bi?t nh? `chat_service.py`, `image_service.py`, `video_service.py`: nghi?p v? theo use case.
- `app/main.py`: composition root, middleware v? ??ng k? router.

Kh?ng t?o file tr?ng ?? gi? ch?. Ch? th?m file khi module th?c s? c? tr?ch nhi?m t??ng ?ng.

## Frontend

- `src/app`: layout, navigation v? router.
- `src/modules/<domain>`: page, component v? style ri?ng c?a domain.
- `src/shared`: API client, hook v? component d?ng l?i.
- Page ch? gi? state/orchestration; b?ng, form v? modal ph?i t?ch th?nh component.
- Style global ch? ch?a foundation/layout d?ng chung. Style domain ??t c?nh module.

## Grok2API

`grok2api-main` l? source dependency n?i b?, kh?ng ph?i th? m?c r?c. Docker build tr?c ti?p t? source n?y. Kh?ng sao ch?p th?m m?t b?n Grok2API v?o `FE`, `BE` ho?c `services`.

Browser kh?ng nh?n admin password Grok2API. C?c thao t?c qu?n tr? ?i qua backend proxy:

`FE -> /api/v1/grok2api/admin/* -> BE -> grok2api`

## D? li?u v? artifact

- Database Groks duy nh?t: `BE/groks.db` trong local Docker hi?n t?i.
- D? li?u Grok2API n?m trong Docker volume ???c ch? ??nh b?i `GROK2API_VOLUME`.
- Kh?ng commit `node_modules`, `.venv`, `dist`, cache, bytecode, `.env`, database ho?c snapshot t?m.
- `dist`, cache v? bytecode c? th? x?a b?t k? l?c n?o v? build/test s? t?o l?i.

## Th?m module m?i

1. T?o vertical slice backend v? test quy?n truy c?p.
2. ??ng k? router t?i `BE/app/main.py`.
3. T?o frontend module v?i page m?ng v? component nh?.
4. Th?m route v? navigation.
5. Ch?y test, lint, format v? production build.

## H??ng m? r?ng production

- Thay SQLite b?ng PostgreSQL v? th?m Alembic migrations.
- Chuy?n job d?i sang worker queue.
- D?ng Redis cho rate limit v? coordination khi ch?y nhi?u replica.
- ??a secrets v?o secret manager v? ch? public reverse proxy.
