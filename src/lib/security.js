// ─── File Upload Validation ───────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/gif':  [0x47, 0x49, 0x46, 0x38],
  'image/webp': null, // checked separately (RIFF....WEBP)
}

const ALLOWED_VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm'])
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm'])

async function readMagicBytes(file, count = 12) {
  const buf = await file.slice(0, count).arrayBuffer()
  return new Uint8Array(buf)
}

export async function validateImageFile(file, maxBytes) {
  if (file.size > maxBytes) {
    throw new Error(`Dosya boyutu çok büyük (maks. ${Math.round(maxBytes / 1024 / 1024)}MB)`)
  }

  const bytes = await readMagicBytes(file, 12)

  // JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true
  // GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true
  // WebP: RIFF????WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true

  throw new Error('Geçersiz dosya türü. Yalnızca JPEG, PNG, GIF ve WebP desteklenir.')
}

export async function validateVideoFile(file, maxBytes) {
  if (file.size > maxBytes) {
    throw new Error(`Video boyutu çok büyük (maks. ${Math.round(maxBytes / 1024 / 1024)}MB)`)
  }

  const ext = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    throw new Error('Geçersiz video formatı. Yalnızca MP4, MOV ve WebM desteklenir.')
  }

  // Browser-reported MIME is sufficient combined with extension check
  if (file.type && !ALLOWED_VIDEO_MIME.has(file.type)) {
    throw new Error('Geçersiz video türü. Yalnızca MP4, MOV ve WebM desteklenir.')
  }

  return true
}

export function safeFileExtension(file, allowed) {
  const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!allowed.has(ext)) throw new Error('İzin verilmeyen dosya uzantısı.')
  return ext
}

// ─── URL Sanitization ─────────────────────────────────────────────────────────

const SAFE_URL_SCHEMES = new Set(['http:', 'https:'])

export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (!SAFE_URL_SCHEMES.has(parsed.protocol)) return ''
    return parsed.href
  } catch {
    return ''
  }
}

// ─── Input Sanitization ───────────────────────────────────────────────────────

export function sanitizeText(value, maxLength = 500) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

// ─── Password Strength ────────────────────────────────────────────────────────

export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { ok: false, message: 'Şifre en az 8 karakter olmalıdır.' }
  }
  if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
    return { ok: false, message: 'Şifre en az bir büyük harf veya rakam içermelidir.' }
  }
  return { ok: true, message: '' }
}

// ─── Rate Limiter (in-memory, per session) ───────────────────────────────────

const _attempts = new Map()

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60_000) {
  const now = Date.now()
  const record = _attempts.get(key) || { count: 0, resetAt: now + windowMs }

  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  record.count++
  _attempts.set(key, record)

  if (record.count > maxAttempts) {
    const waitSec = Math.ceil((record.resetAt - now) / 1000)
    throw new Error(`Çok fazla deneme. Lütfen ${waitSec} saniye bekleyin.`)
  }
}
