// Shared client/server types for TrendCart

export interface CategoryDTO {
  id: number
  name: string
  slug: string
  icon: string
  description: string
  productCount: number
}

export interface ProductDTO {
  id: number
  name: string
  slug: string
  shortDescription: string
  description: string
  category: { id: number; name: string; slug: string; icon: string }
  image: string
  amazonUrl: string
  affiliateUrl: string
  price: number
  oldPrice: number | null
  discount: number
  rating: number
  reviewCount: number
  trendingScore: number
  popularityScore: number
  trendingReason: string
  badge: Badge
  viralLabel: string | null
  isDeal: boolean
  dealLabel: DealLabel | null
  isFeatured: boolean
  status: 'active' | 'draft'
  views: number
  clicks: number
}

export type Badge = 'exploding' | 'rising' | 'trending' | 'popular' | 'hidden-gem'
export type DealLabel = 'Huge Discount' | 'Great Deal' | 'Limited Deal' | 'Price Drop'

// Full product page payload (editorial sections included)
export interface ProductFullDTO extends ProductDTO {
  whyWeLikeIt: string[]
  pros: string[]
  cons: string[]
  verdict: string
  whoItsFor: string
  whoShouldSkip: string
  alternatives: ProductDTO[]
}

export interface ArticleListItemDTO {
  id: number
  title: string
  slug: string
  excerpt: string
  coverImage: string
  createdAt: string
}

export type ArticleSection =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'products'; title?: string; slugs: string[] }

export interface ArticleFullDTO extends ArticleListItemDTO {
  sections: ArticleSection[]
  embeddedProducts: Record<string, ProductDTO>
}

export type SortKey =
  | 'trending'
  | 'popularity'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'discount'
  | 'reviews'
  | 'newest'

export type SectionKey =
  | 'trending'
  | 'best-sellers'
  | 'deals'
  | 'hidden-gems'
  | 'viral'
  | 'featured'
  | 'all'

export interface AdminStats {
  totalProducts: number
  activeProducts: number
  draftProducts: number
  totalCategories: number
  activeDeals: number
  totalClicks: number
  totalViews: number
  ctr: number // outbound click-through rate vs views
  topProducts: { id: number; name: string; slug: string; clicks: number; views: number; image: string }[]
  recentClicks: { id: number; productName: string; source: string; createdAt: string }[]
}
