'use client'

import { trackClick } from './api'
import { useAppRouter } from './app-router'
import { DiscountChip, DealChip, RatingStars, TrendBadge } from './atoms'
import { formatCount, formatPrice } from '@/lib/constants'
import type { ProductDTO } from '@/lib/types'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Check Price / Check Latest Price on Amazon — the primary affiliate CTA.
 * Tracks the outbound click (site KPI) and opens the tagged Amazon URL.
 */
export function CheckPriceButton({
  product,
  source,
  size = 'md',
  className,
}: {
  product: Pick<ProductDTO, 'id' | 'affiliateUrl' | 'name'>
  source: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeCls =
    size === 'lg'
      ? 'h-12 px-8 text-base'
      : size === 'sm'
        ? 'h-8 px-3 text-xs'
        : 'h-10 px-5 text-sm'
  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      onClick={(e) => {
        trackClick(product.id, source)
        // let the browser open the new tab; no preventDefault needed
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-red-500 font-bold text-white shadow-md shadow-orange-600/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-600/30 active:translate-y-0',
        sizeCls,
        className,
      )}
    >
      Check Price
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">on Amazon — opens in a new tab</span>
    </a>
  )
}

/**
 * The TrendCart product card (PRD §21).
 * Whole card navigates to the product page; the Check Price button
 * goes straight to Amazon with tracking.
 */
export function ProductCard({
  product,
  rank,
  source = 'trending-card',
}: {
  product: ProductDTO
  rank?: number
  source?: string
}) {
  const { navigate } = useAppRouter()

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate({ view: 'product', slug: product.slug })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate({ view: 'product', slug: product.slug })
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100 dark:hover:border-orange-900 dark:hover:shadow-orange-950/30"
    >
      {/* Image + badges */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex max-w-[85%] flex-wrap gap-1">
          {rank !== undefined && rank < 3 && (
            <span className="inline-flex items-center rounded-full bg-zinc-900/85 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur">
              🔥 Trending #{rank + 1}
            </span>
          )}
          <TrendBadge badge={product.badge} />
        </div>
        {product.discount > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-extrabold text-white shadow">
            {product.discount}% OFF
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span aria-hidden>{product.category.icon}</span>
          {product.category.name}
        </div>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug tracking-tight group-hover:text-orange-700 dark:group-hover:text-orange-400">
          {product.name}
        </h3>

        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
          <DiscountChip discount={product.discount} />
        </div>

        {product.isDeal && product.dealLabel && (
          <div>
            <DealChip label={product.dealLabel} />
          </div>
        )}

        {product.trendingReason && (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-orange-700 dark:text-orange-400">Why it&apos;s trending: </span>
            {product.trendingReason}
          </p>
        )}

        <div className="mt-auto pt-2">
          <CheckPriceButton product={product} source={source} className="w-full" />
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({
  products,
  ranked,
  source,
}: {
  products: ProductDTO[]
  ranked?: boolean
  source?: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          rank={ranked ? i : undefined}
          source={source ?? (ranked ? 'trending-card' : 'grid')}
        />
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProductGridEmpty({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
      <span className="text-4xl" aria-hidden>
        🔍
      </span>
      <p className="mt-3 font-bold">{message}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Compact horizontal list row — used on trending/best-seller ranked lists. */
export function ProductListRow({ product, rank }: { product: ProductDTO; rank: number }) {
  const { navigate } = useAppRouter()
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate({ view: 'product', slug: product.slug })}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate({ view: 'product', slug: product.slug })
      }}
      className="group flex cursor-pointer items-center gap-4 rounded-2xl border bg-card p-3 transition-all hover:border-orange-200 hover:shadow-md sm:p-4"
    >
      <span className="w-8 shrink-0 text-center text-lg font-extrabold text-muted-foreground/70 sm:w-10 sm:text-xl">
        {rank}
      </span>
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <TrendBadge badge={product.badge} />
          {product.viralLabel && (
            <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300">
              🚀 {product.viralLabel}
            </span>
          )}
        </div>
        <h3 className="mt-1 line-clamp-1 text-sm font-bold tracking-tight sm:text-base">
          {product.name}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
          <span className="text-xs text-muted-foreground">
            {formatCount(product.reviewCount)} reviews
          </span>
        </div>
        {product.trendingReason && (
          <p className="mt-1 hidden line-clamp-1 text-xs text-muted-foreground sm:block">
            {product.trendingReason}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="text-right">
          <div className="text-lg font-extrabold tracking-tight">{formatPrice(product.price)}</div>
          {product.discount > 0 && (
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs text-muted-foreground line-through">
                {product.oldPrice ? formatPrice(product.oldPrice) : ''}
              </span>
              <DiscountChip discount={product.discount} />
            </div>
          )}
        </div>
        <CheckPriceButton product={product} source="trending-list" size="sm" />
      </div>
    </article>
  )
}
