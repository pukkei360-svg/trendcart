import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** GET /api/admin/categories — list with counts (auth). */
export async function GET(req: NextRequest) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    return NextResponse.json({
      categories: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        icon: row.icon,
        description: row.description,
        productCount: row._count.products,
      })),
    })
  } catch (err) {
    console.error('GET /api/admin/categories failed', err)
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}

/** POST /api/admin/categories — create (auth). */
export async function POST(req: NextRequest) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const name = String(body.name || '').trim()
    const icon = String(body.icon || '\u{1F5FA}').trim() || '\u{1F5FA}'
    const description = String(body.description || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    const slug = slugify(String(body.slug || '').trim() || name)
    if (!slug) {
      return NextResponse.json({ error: 'Could not derive a valid slug' }, { status: 400 })
    }
    const duplicate = await db.category.findUnique({ where: { slug } })
    if (duplicate) {
      return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 400 })
    }
    const max = await db.category.aggregate({ _max: { sortOrder: true } })
    const created = await db.category.create({
      data: { name, slug, icon, description, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    })
    return NextResponse.json({ category: created }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/categories failed', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
