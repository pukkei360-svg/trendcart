import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/articles — published editorial articles (list, no content body). */
export async function GET() {
  try {
    const rows = await db.article.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ articles: rows })
  } catch (err) {
    console.error('GET /api/articles failed', err)
    return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 })
  }
}
