import crypto from 'crypto'

/**
 * Minimal admin auth: scrypt password hashing + HMAC-signed bearer tokens.
 * The frontend admin dashboard stores the token in localStorage and sends it
 * as `Authorization: Bearer <token>`; every /api/admin/* route verifies it.
 */

const SECRET = process.env.ADMIN_SECRET || 'trendcart-dev-secret'
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex')
  const a = Buffer.from(candidate, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function createToken(userId: number): string {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS })
  const encoded = Buffer.from(payload).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

export function verifyToken(token: string): number | null {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null
  const expected = sign(encoded)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return payload.uid as number
  } catch {
    return null
  }
}

/** Extracts and verifies the bearer token from a Request. */
export function getAdminUserId(req: Request): number | null {
  const auth = req.headers.get('authorization') || ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  return verifyToken(match[1].trim())
}
