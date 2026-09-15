// Client-safe constants and formatting helpers

export const SITE_NAME = 'TrendCart'
export const SITE_TAGLINE = 'Discover What\u2019s Trending. Find What\u2019s Worth Buying.'
export const CATEGORY_PLACEHOLDER = '\u{1F5FA}'

export const AFFILIATE_DISCLOSURE =
  'Affiliate Disclosure: TrendCart may earn a commission when you purchase through links on this site, at no additional cost to you. As an Amazon Associate, TrendCart earns from qualifying purchases.'

export const PRICE_ACCURACY_NOTE =
  'Product prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on Amazon at the time of purchase will apply.'

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`
}

export function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}K`
  }
  return String(n)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const BADGE_META: Record<
  string,
  { label: string; emoji: string; className: string }
> = {
  exploding: {
    label: 'Exploding',
    emoji: '\u{1F525}',
    className: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
  },
  rising: {
    label: 'Rising Fast',
    emoji: '\u{1F680}',
    className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  },
  trending: {
    label: 'Trending',
    emoji: '\u{1F4C8}',
    className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
  },
  popular: {
    label: 'Popular',
    emoji: '\u2B50',
    className: 'bg-zinc-800 text-white',
  },
  'hidden-gem': {
    label: 'Hidden Gem',
    emoji: '\u{1F48E}',
    className: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
  },
}

export const DEAL_LABEL_META: Record<string, { emoji: string; className: string }> = {
  'Huge Discount': { emoji: '\u{1F525}', className: 'bg-red-500 text-white' },
  'Great Deal': { emoji: '\u{1F4B0}', className: 'bg-emerald-600 text-white' },
  'Limited Deal': { emoji: '\u26A1', className: 'bg-amber-500 text-zinc-900' },
  'Price Drop': { emoji: '\u{1F4C9}', className: 'bg-teal-600 text-white' },
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Very Hot'
  if (score >= 70) return 'Hot'
  if (score >= 55) return 'Heating Up'
  if (score >= 40) return 'Solid'
  return 'Warming'
}
