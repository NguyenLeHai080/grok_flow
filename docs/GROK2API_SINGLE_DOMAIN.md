# Grok2API tr?n c?ng m?t domain

Production v? local Docker ??u d?ng m?t entrypoint duy nh?t:

- `/`: Groks frontend.
- `/api/v1`: Groks backend.
- `/grok2api-runtime`: Grok2API console v? runtime.

Lu?ng qu?n tr?:

`Browser -> Groks FE -> /api/v1/grok2api/admin/* -> Groks BE -> Grok2API`

Th?ng tin ??ng nh?p qu?n tr? Grok2API kh?ng ???c g?i xu?ng frontend.

## Kh?i ??ng

```powershell
docker compose --profile warp --profile flaresolverr up -d --build
```

Reverse proxy n?m trong `FE/deploy/nginx.conf`. Khi tri?n khai, ch? public c?ng frontend ho?c load balancer ph?a tr??c n?; kh?ng public tr?c ti?p backend v? Grok2API.

N?u media c?n URL c?ng khai, c?u h?nh public media base URL th?nh `https://your-domain/grok2api-runtime`.
