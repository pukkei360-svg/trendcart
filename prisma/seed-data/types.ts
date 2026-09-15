// Shared types for TrendCart seed data

export interface SeedProduct {
  name: string
  slug: string
  categorySlug: string
  imageKey: string // key in scripts/images/<key>.json
  imageIndex: number
  shortDescription: string
  description: string
  price: number
  oldPrice: number | null
  rating: number
  reviewCount: number
  trendingScore: number
  popularityScore: number
  badge: 'exploding' | 'rising' | 'trending' | 'popular' | 'hidden-gem'
  viralLabel: string | null
  trendingReason: string
  whyWeLikeIt: string[]
  pros: string[]
  cons: string[]
  verdict: string
  whoItsFor: string
  whoShouldSkip: string
  isDeal: boolean
  dealLabel: string | null
  isFeatured: boolean
}

export interface SeedCategory {
  name: string
  slug: string
  icon: string
  description: string
}

export type SeedArticleSection =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'products'; title?: string; slugs: string[] }

export interface SeedArticle {
  title: string
  slug: string
  excerpt: string
  coverImageKey: string
  coverImageIndex: number
  sections: SeedArticleSection[]
}
