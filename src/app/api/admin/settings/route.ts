import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/settings — all site settings (auth). */
export async function GET(req: NextRequest) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await db.setting.findMany({ orderBy: { key: 'asc' } })
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key] = row.value
    return NextResponse.json({ settings })
  } catch (err) {
    console.error('GET /api/admin/settings failed', err)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

/** PUT /api/admin/settings — upsert whitelisted keys (auth). */
export async function PUT(req: NextRequest) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const allowed = [
      'site_name',
      'tagline',
      'amazon_affiliate_tag',
      'affiliate_disclosure',
    ] as const
    const updates = Object.entries(body as Record<string, unknown>)
      .filter(([key]) => (allowed as readonly string[]).includes(key))
      .map(([key, value]) => ({ key, value: String(value ?? '').trim() }))

    for (const { key, value } of updates) {
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }
    const rows = await db.setting.findMany({ orderBy: { key: 'asc' } })
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key] = row.value
    return NextResponse.json({ settings })
  } catch (err) {
    console.error('PUT /api/admin/settings failed', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
