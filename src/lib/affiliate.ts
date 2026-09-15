import { db } from '@/lib/db'

/**
 * Appends the Amazon Associates tracking tag (from site settings) to an
 * Amazon URL. Returns the original URL when no tag is configured or the
 * URL cannot be parsed.
 */
export async function getAffiliateTag(): Promise<string | null> {
  const setting = await db.setting.findUnique({ where: { key: 'amazon_affiliate_tag' } })
  return setting?.value?.trim() || null
}

export function buildAffiliateUrl(amazonUrl: string, tag: string | null): string {
  if (!tag) return amazonUrl
  try {
    const url = new URL(amazonUrl)
    url.searchParams.set('tag', tag)
    return url.toString()
  } catch {
    return amazonUrl
  }
}
