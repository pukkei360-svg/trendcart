'use client'

import { useEffect } from 'react'
import { useAppRouter } from '../app-router'
import { useProduct } from '../api'
import { CheckPriceButton, ProductGrid, ProductGridSkeleton } from '../product-card'
import { RatingStars, ScoreRing, TrendBadge, DealChip } from '../atoms'
import {
  AFFILIATE_DISCLOSURE,
  PRICE_ACCURACY_NOTE,
  formatCount,
  formatPrice,
  scoreLabel,
} from '@/lib/constants'
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Lightbulb,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

/** Injects Product JSON-LD structured data for the current product view. */
function ProductJsonLd(props: {
  name: string
  image: string
  description: string
  rating: number
  reviewCount: number
  price: number
}) {
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: props.name,
    image: props.image,
    description: props.description,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: props.price.toFixed(2),
      availability: 'https://schema.org/InStock',
    },
    ...(props.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: props.rating.toFixed(1),
            reviewCount: props.reviewCount,
          },
        }
      : {}),
  })
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}

function Breadcrumb({ categoryName, categorySlug, productName }: { categoryName: string; categorySlug: string; productName: string }) {
  const { navigate } = useAppRouter()
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <button className="hover:text-orange-700 hover:underline dark:hover:text-orange-400" onClick={() => navigate({ view: 'home' })}>
        Home
      </button>
      <ChevronRight className="h-3 w-3" aria-hidden />
      <button className="hover:text-orange-700 hover:underline dark:hover:text-orange-400" onClick={() => navigate({ view: 'categories' })}>
        Categories
      </button>
      <ChevronRight className="h-3 w-3" aria-hidden />
      <button className="hover:text-orange-700 hover:underline dark:hover:text-orange-400" onClick={() => navigate({ view: 'category', slug: categorySlug })}>
        {categoryName}
      </button>
      <ChevronRight className="h-3 w-3" aria-hidden />
      <span className="font-semibold text-foreground">{productName}</span>
    </nav>
  )
}

export function ProductView({ slug }: { slug: string }) {
  const { navigate } = useAppRouter()
  const { data, loading, error } = useProduct(slug)

  useEffect(() => {
    if (data?.product) {
      document.title = `${data.product.name} — Review, Price & Trending Score | TrendCart`
    }
    return () => {
      document.title = 'TrendCart — Discover What\u2019s Trending. Find What\u2019s Worth Buying.'
    }
  }, [data])

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
        <ProductGridSkeleton count={4} />
      </div>
    )
  }

  if (error || !data?.product) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-5xl" aria-hidden>🧐</span>
        <h1 className="text-2xl font-extrabold">Product not found</h1>
        <p className="text-sm text-muted-foreground">It may have been removed or is no longer available.</p>
        <button
          onClick={() => navigate({ view: 'trending' })}
          className="rounded-full bg-gradient-to-r from-orange-600 to-red-500 px-6 py-2.5 text-sm font-bold text-white shadow"
        >
          🔥 Browse Trending
        </button>
      </div>
    )
  }

  const p = data.product

  return (
    <article className="flex flex-col gap-10">
      {typeof window !== 'undefined' && (
        <ProductJsonLd
          name={p.name}
          image={p.image}
          description={p.shortDescription}
          rating={p.rating}
          reviewCount={p.reviewCount}
          price={p.price}
        />
      )}

      <Breadcrumb categoryName={p.category.name} categorySlug={p.category.slug} productName={p.name} />

      {/* Hero: image + purchase panel */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border bg-muted">
          <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <TrendBadge badge={p.badge} size="md" />
            {p.viralLabel && (
              <span className="rounded-full bg-fuchsia-600 px-3 py-1 text-xs font-bold text-white shadow">
                🚀 {p.viralLabel}
              </span>
            )}
          </div>
          {p.discount > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-sm font-extrabold text-white shadow">
              -{p.discount}%
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span aria-hidden>{p.category.icon}</span>
            <button className="hover:text-orange-700 hover:underline dark:hover:text-orange-400" onClick={() => navigate({ view: 'category', slug: p.category.slug })}>
              {p.category.name}
            </button>
          </div>

          <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{p.name}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <RatingStars rating={p.rating} reviewCount={p.reviewCount} size="lg" />
            <span className="text-xs text-muted-foreground">
              {formatCount(p.reviewCount)} public reviews
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl font-extrabold tracking-tight">{formatPrice(p.price)}</span>
            {p.oldPrice && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(p.oldPrice)}
              </span>
            )}
            {p.discount > 0 && (
              <span className="rounded-lg bg-red-50 px-2 py-1 text-sm font-extrabold text-red-600 dark:bg-red-950/60 dark:text-red-400">
                {p.discount}% OFF
              </span>
            )}
            {p.isDeal && p.dealLabel && <DealChip label={p.dealLabel} />}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{p.shortDescription}</p>

          {/* Score panel */}
          <div className="flex items-center gap-4 rounded-2xl border bg-card p-4">
            <ScoreRing score={p.trendingScore} size={56} />
            <div>
              <p className="text-sm font-extrabold">
                TrendCart Score: {p.trendingScore}/100 — {scoreLabel(p.trendingScore)}{' '}
                {p.trendingScore >= 85 ? '🔥' : ''}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {p.trendingReason}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50/60 p-5 dark:border-orange-900 dark:bg-orange-950/20">
            <CheckPriceButton product={p} source="product-page" size="lg" className="w-full sm:w-auto" />
            <p className="mt-3 text-[11px] leading-relaxed text-orange-800 dark:text-orange-300">
              Price and availability can change at any time — the price shown on Amazon at the
              moment of purchase applies. This is an affiliate link.
            </p>
          </div>
        </div>
      </div>

      {/* Why We Like It */}
      <section aria-labelledby="why-heading">
        <h2 id="why-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Why We Like It
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{p.description}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {p.whyWeLikeIt.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-2xl border bg-card p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <span className="text-sm font-medium leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pros / Cons */}
      <section aria-labelledby="proscons-heading" className="grid gap-4 md:grid-cols-2">
        <h2 id="proscons-heading" className="sr-only">
          Pros and cons
        </h2>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
          <h3 className="font-extrabold text-emerald-700 dark:text-emerald-400">✅ Pros</h3>
          <ul className="mt-3 space-y-2">
            {p.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900 dark:bg-red-950/20">
          <h3 className="font-extrabold text-red-700 dark:text-red-400">❌ Cons</h3>
          <ul className="mt-3 space-y-2">
            {p.cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                {con}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Verdict */}
      <section aria-labelledby="verdict-heading">
        <h2 id="verdict-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Our Verdict
        </h2>
        <blockquote className="mt-3 rounded-3xl border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 p-5 text-sm font-medium leading-relaxed sm:text-base dark:from-orange-950/30 dark:to-amber-950/20">
          {p.verdict}
        </blockquote>
      </section>

      {/* Who is it for / who should skip */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <h3 className="font-extrabold">Who Is It For?</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.whoItsFor}</p>
        </div>
        <div className="rounded-3xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-red-500" aria-hidden />
            <h3 className="font-extrabold">Who Should Skip It?</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.whoShouldSkip}</p>
        </div>
      </section>

      {/* Alternatives */}
      {p.alternatives.length > 0 && (
        <section aria-labelledby="alternatives-heading">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden />
            <h2 id="alternatives-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Compare With Similar Products
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Other strong picks in {p.category.name} — same category, different strengths.
          </p>
          <div className="mt-4">
            <ProductGrid products={p.alternatives} source="alternative-card" />
          </div>
        </section>
      )}

      {/* Compliance footer */}
      <section className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        <p className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {AFFILIATE_DISCLOSURE}
        </p>
        <p className="border-t border-amber-200/60 pt-3 dark:border-amber-900/60">{PRICE_ACCURACY_NOTE}</p>
        <p className="border-t border-amber-200/60 pt-3 dark:border-amber-900/60">
          Ratings and review counts shown are publicly visible figures at the time of listing.
          TrendCart has not been paid for this placement and does not claim to have personally
          tested every product — our editorial team evaluates publicly available information,
          category knowledge and aggregated buyer feedback.
        </p>
      </section>
    </article>
  )
}
