import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAffiliateTag } from '@/lib/affiliate'
import { toProductDTO } from '@/lib/serializers'
import type { ArticleSection } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/articles/[slug]
 * Full article with parsed sections; `products` sections are hydrated with
 * product cards so the article can embed live affiliate listings.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const article = await db.article.findUnique({ where: { slug } })
    if (!article || !article.published) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    let sections: ArticleSection[] = []
    try {
      const parsed = JSON.parse(article.contentJson)
      if (Array.isArray(parsed)) sections = parsed as ArticleSection[]
    } catch {
      sections = []
    }

    // Collect product slugs referenced by product sections
    const slugs = sections
      .filter((s) => s.type === 'products')
      .flatMap((s) => (s as { slugs: string[] }).slugs || [])

    const rows = slugs.length
      ? await db.product.findMany({
          where: { slug: { in: slugs }, status: 'active' },
          include: { category: true },
        })
      : []
    const tag = await getAffiliateTag()

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        createdAt: article.createdAt.toISOString(),
        sections,
        embeddedProducts: Object.fromEntries(
          rows.map((row) => [row.slug, toProductDTO(row, tag)]),
        ),
      },
    })
  } catch (err) {
    console.error('GET /api/articles/[slug] failed', err)
    return NextResponse.json({ error: 'Failed to load article' }, { status: 500 })
  }
}
