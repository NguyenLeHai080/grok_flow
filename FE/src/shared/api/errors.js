const messagesByCode = {
  upstream_unavailable:
    'D\u1ecbch v\u1ee5 Grok upstream t\u1ea1m th\u1eddi kh\u00f4ng kh\u1ea3 d\u1ee5ng. H\u00e3y ki\u1ec3m tra phi\u00ean t\u00e0i kho\u1ea3n, Account Settings v\u00e0 Cloudflare Clearance.',
  provider_unavailable:
    'Nh\u00e0 cung c\u1ea5p upstream t\u1ea1m th\u1eddi kh\u00f4ng kh\u1ea3 d\u1ee5ng.',
  model_not_found:
    'Model kh\u00f4ng t\u1ed3n t\u1ea1i ho\u1eb7c ch\u01b0a \u0111\u01b0\u1ee3c b\u1eadt.',
  'invalid-argument': 'Tham s\u1ed1 g\u1eedi l\u00ean kh\u00f4ng h\u1ee3p l\u1ec7.',
  service_unavailable: 'D\u1ecbch v\u1ee5 t\u1ea1m th\u1eddi kh\u00f4ng kh\u1ea3 d\u1ee5ng.',
  grok2api_not_ready:
    'Grok2API ch\u01b0a s\u1eb5n s\u00e0ng cho model n\u00e0y. H\u00e3y ki\u1ec3m tra account, cooldown, egress node v\u00e0 Cloudflare Clearance.',
}

const containsCJK = (value) => /[\u3400-\u9fff]/u.test(value)

function parsePayload(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function readError(value) {
  const payload = parsePayload(value)
  if (!payload) return typeof value === 'string' ? { message: value } : {}
  if (payload.response?.data) return readError(payload.response.data)
  if (payload.detail) return readError(payload.detail)
  if (payload.error) return readError(payload.error)
  return { code: payload.code, message: payload.message }
}

export function formatApiError(
  value,
  fallback = 'Y\u00eau c\u1ea7u kh\u00f4ng th\u00e0nh c\u00f4ng.',
) {
  const { code, message } = readError(value)
  if (code && messagesByCode[code]) return messagesByCode[code]
  if (typeof message === 'string' && message.trim() && !containsCJK(message)) return message
  return fallback
}
