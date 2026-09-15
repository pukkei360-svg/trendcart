import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken, verifyPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** POST /api/admin/login — { username, password } -> { token } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const user = await db.adminUser.findUnique({ where: { username } })
    // Constant-ish response time whether or not the user exists
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await new Promise((r) => setTimeout(r, 300))
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({ token: createToken(user.id), username: user.username })
  } catch (err) {
    console.error('POST /api/admin/login failed', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
