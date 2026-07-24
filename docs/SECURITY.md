# Security Hardening Guide

- Mật khẩu tối thiểu 12 ký tự và hash Argon2id. Hash bcrypt cũ được xác thực rồi tự nâng cấp sang Argon2id ở lần đăng nhập tiếp theo.
- Access token ngắn hạn chỉ giữ trong `sessionStorage`; refresh token được rotate trong cookie `HttpOnly`, `SameSite=Strict` và phải bật `Secure` ở production.
- JWT bắt buộc đúng signature, expiry, not-before, issuer, audience, type và unique token ID.
- Middleware kiểm tra Host header, giới hạn request body, rate limit chung và rate limit đăng nhập riêng; production có thể ép HTTPS/HSTS.
- Proxy URL chặn credentials và, ở production, chặn loopback/private/link-local/reserved IP để giảm SSRF vào metadata service hoặc mạng nội bộ.
- Provider request không follow redirects và response bị giới hạn kích thước để giảm memory exhaustion.
- Mọi thay đổi quan trọng ghi `audit_logs`; không ghi raw password, bearer token hoặc API key.
- Chặn self-delete của admin. Nên bổ sung chính sách không cho hạ quyền admin cuối cùng.
- Rate limiter hiện in-memory chỉ phù hợp một process. Production phải dùng Redis-backed limiter ở application hoặc API gateway và bổ sung lockout theo cả account lẫn IP.
- Không thể cam kết chống mọi xâm nhập/DDoS chỉ bằng application code; cần network controls, monitoring, backups và incident response.

## Biến môi trường production bắt buộc

```env
ENVIRONMENT=production
SECRET_KEY=<ít nhất 32 ký tự ngẫu nhiên từ secret manager>
CORS_ORIGINS=https://console.example.com
ALLOWED_HOSTS=api.example.com
COOKIE_SECURE=true
FORCE_HTTPS=true
ALLOW_PRIVATE_PROXY_HOSTS=false
MAX_REQUEST_BYTES=1048576
MAX_PROVIDER_RESPONSE_BYTES=5242880
```

Ứng dụng sẽ từ chối khởi động nếu production dùng secret yếu, wildcard CORS/host, cookie không secure, không ép HTTPS hoặc vẫn cho phép proxy mạng nội bộ.

## Hạ tầng vẫn phải có

- Reverse proxy/API gateway giới hạn connection, body, timeout và request rate trước khi request tới Python.
- PostgreSQL user tối thiểu quyền, encrypted backups, secret rotation và network segmentation.
- CLIProxyAPI chạy bằng service/container riêng, không để control plane trực tiếp khởi chạy shell command.
- Centralized logs/SIEM, cảnh báo brute-force, spike 401/403/429/500 và quy trình incident response.
- Dependency scanning, SAST/DAST và penetration test trước khi public Internet.
