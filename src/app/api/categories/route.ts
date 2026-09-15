import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CategoryDTO } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** GET /api/categories — all categories with active product counts. */
export async function GET() {
  try {
    const rows = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { status: 'active' } } } },
      },
    })
    const categories: CategoryDTO[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      description: row.description,
      productCount: row._count.products,
    }))
    return NextResponse.json({ categories })
  } catch (err) {
    console.error('GET /api/categories failed', err)
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}
