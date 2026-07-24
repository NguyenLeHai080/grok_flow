# Grok2API trên cùng một domain

Production và local Docker đều dùng một entrypoint duy nhất:

- `/`: Groks frontend.
- `/api/v1`: Groks backend.
- `/grok2api-runtime`: Grok2API console và runtime.

Luồng quản trị:

`Browser -> Groks FE -> /api/v1/grok2api/admin/* -> Groks BE -> Grok2API`

Thông tin đăng nhập quản trị Grok2API không được gửi xuống frontend.

## Khởi động

```powershell
docker compose --profile warp --profile flaresolverr up -d --build
```

Reverse proxy nằm trong `FE/deploy/nginx.conf`. Khi triển khai, chỉ public cổng frontend hoặc load balancer phía trước nó; không public trực tiếp backend và Grok2API.

Nếu media cần URL công khai, cấu hình public media base URL thành `https://your-domain/grok2api-runtime`.
