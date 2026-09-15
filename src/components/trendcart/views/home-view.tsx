'use client'

import { useAppRouter } from '../app-router'
import { useArticles, useCategories, useProducts } from '../api'
import { ProductGrid, ProductGridSkeleton } from '../product-card'
import { SectionHeading, ScoreRing, ViewAllLink } from '../atoms'
import { formatDate } from '@/lib/constants'
import { ArrowRight, Flame, LineChart, Star, Tag, TrendingUp } from 'lucide-react'

function Hero() {
  const { navigate } = useAppRouter()
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-500 to-rose-500 text-white">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-amber-300/20 blur-2xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            Updated daily
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl sm:leading-[1.1]">
            Discover What&apos;s Trending Before Everyone Else
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/90 sm:text-lg">
            Find trending products, best sellers, great deals, and highly rated picks in one
            place — scored by real signals, not hype.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate({ view: 'trending' })}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-extrabold text-orange-700 shadow-lg shadow-orange-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              🔥 Explore Trending
            </button>
            <button
              onClick={() => navigate({ view: 'deals' })}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-white/60 bg-white/10 px-7 text-sm font-extrabold backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              💰 Today&apos;s Deals
            </button>
          </div>
          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-3">
            {[
              { value: '32+', label: 'Products tracked' },
              { value: '8', label: 'Categories' },
              { value: '4.6★', label: 'Avg. rating shown' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-extrabold tracking-tight">{stat.value}</dd>
                <dd className="text-xs font-medium uppercase tracking-wider text-white/70">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function CategoriesStrip() {
  const { navigate } = useAppRouter()
  const { data, loading } = useCategories()
  if (loading || !data?.categories.length) return null
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {data.categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => navigate({ view: 'category', slug: cat.slug })}
          className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-md dark:hover:border-orange-900"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl transition-transform group-hover:scale-110 dark:bg-orange-950/40" aria-hidden>
            {cat.icon}
          </span>
          <span className="text-xs font-bold leading-tight">{cat.name}</span>
          <span className="text-[10px] text-muted-foreground">{cat.productCount} products</span>
        </button>
      ))}
    </div>
  )
}

function ScoreExplainer() {
  return (
    <section className="rounded-3xl border bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4 lg:w-64 lg:shrink-0">
          <ScoreRing score={94} size={72} />
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">The TrendCart Score</h2>
            <p className="text-xs text-muted-foreground">Our own 0–100 ranking, built from public signals.</p>
          </div>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: Star, label: 'Rating strength', hint: 'Sustained averages' },
            { icon: LineChart, label: 'Review growth', hint: 'Velocity, not volume' },
            { icon: TrendingUp, label: 'Popularity', hint: 'Long-term interest' },
            { icon: Tag, label: 'Deal strength', hint: 'Real price drops' },
            { icon: Flame, label: 'Recent interest', hint: 'What readers click' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-muted/60 p-3">
              <item.icon className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden />
              <p className="mt-2 text-xs font-bold">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-5 border-t pt-4 text-[11px] leading-relaxed text-muted-foreground">
        TrendCart does not have access to Amazon&apos;s private sales data. Our scores and
        rankings — including Best Sellers lists — are our own popularity rankings computed from
        publicly visible signals, and all editorial opinions are our own.
      </p>
    </section>
  )
}

export function HomeView() {
  const { navigate } = useAppRouter()

  const trending = useProducts({ section: 'trending', sort: 'trending', limit: 8 })
  const bestSellers = useProducts({ section: 'best-sellers', limit: 4 })
  const deals = useProducts({ section: 'deals', sort: 'discount', limit: 4 })
  const gems = useProducts({ section: 'hidden-gems', sort: 'rating', limit: 4 })
  const viral = useProducts({ section: 'viral', limit: 4 })
  const articles = useArticles()

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <Hero />

      {/* 🔥 Trending Now */}
      <section aria-labelledby="trending-heading">
        <SectionHeading
          emoji="🔥"
          title="Trending Now"
          subtitle="Ranked by the TrendCart Score — updated as signals change"
          action={<ViewAllLink onClick={() => navigate({ view: 'trending' })} />}
        />
        <span id="trending-heading" className="sr-only">
          Trending now
        </span>
        {trending.loading ? (
          <ProductGridSkeleton />
        ) : trending.data ? (
          <ProductGrid products={trending.data.products} ranked source="trending-card" />
        ) : (
          <p className="text-sm text-muted-foreground">Trending products are unavailable right now.</p>
        )}
      </section>

      {/* Categories */}
      <section aria-label="Shop by category">
        <SectionHeading
          emoji="🗂️"
          title="Shop by Category"
          subtitle="Every category, curated — not the whole internet"
          action={<ViewAllLink onClick={() => navigate({ view: 'categories' })} />}
        />
        <CategoriesStrip />
      </section>

      {/* 🏆 Best Sellers */}
      <section aria-label="Best sellers">
        <SectionHeading
          emoji="🏆"
          title="Popular Picks"
          subtitle="TrendCart Popularity Ranking — our readers' most-loved products"
          action={<ViewAllLink onClick={() => navigate({ view: 'best-sellers' })} />}
        />
        {bestSellers.loading ? (
          <ProductGridSkeleton />
        ) : bestSellers.data ? (
          <ProductGrid products={bestSellers.data.products} source="bestseller-card" />
        ) : null}
      </section>

      {/* 💰 Deals */}
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-6 dark:border-red-950/50 dark:from-red-950/20 dark:to-orange-950/20 sm:p-8">
        <SectionHeading
          emoji="💰"
          title="Today's Best Deals"
          subtitle="Verified price drops only — we never invent discounts"
          action={<ViewAllLink onClick={() => navigate({ view: 'deals' })} />}
        />
        {deals.loading ? (
          <ProductGridSkeleton />
        ) : deals.data ? (
          <ProductGrid products={deals.data.products} source="deal-card" />
        ) : null}
        <p className="mt-4 text-[11px] text-muted-foreground">
          Prices reflect the lowest we&apos;ve recently tracked and can change at any time — the
          price on Amazon at the time of purchase always applies.
        </p>
      </section>

      {/* 💎 Hidden Gems + 🚀 Viral */}
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
        <section aria-label="Hidden gems">
          <SectionHeading
            emoji="💎"
            title="Hidden Gems"
            subtitle="Under-hyped products with standout ratings"
            action={<ViewAllLink onClick={() => navigate({ view: 'hidden-gems' })} />}
          />
          {gems.loading ? (
            <ProductGridSkeleton count={4} />
          ) : gems.data ? (
            <ProductGrid products={gems.data.products} source="gem-card" />
          ) : null}
        </section>
        <section aria-label="Going viral">
          <SectionHeading
            emoji="🚀"
            title="Going Viral"
            subtitle="Products picking up real momentum"
            action={<ViewAllLink onClick={() => navigate({ view: 'viral' })} />}
          />
          {viral.loading ? (
            <ProductGridSkeleton count={4} />
          ) : viral.data ? (
            <ProductGrid products={viral.data.products} source="viral-card" />
          ) : null}
        </section>
      </div>

      {/* 📝 Latest reviews */}
      <section aria-label="Latest reviews and guides">
        <SectionHeading
          emoji="📝"
          title="Reviews & Guides"
          subtitle="Original editorial — honest picks, real buying advice"
          action={<ViewAllLink onClick={() => navigate({ view: 'reviews' })} label="All reviews" />}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {(articles.data?.articles ?? []).map((a) => (
            <button
              key={a.id}
              onClick={() => navigate({ view: 'article', slug: a.slug })}
              className="group overflow-hidden rounded-2xl border bg-card text-left transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[2/1] overflow-hidden bg-muted">
                <img
                  src={a.coverImage}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  {formatDate(a.createdAt)}
                </p>
                <h3 className="mt-1 line-clamp-2 font-bold leading-snug tracking-tight group-hover:text-orange-700 dark:group-hover:text-orange-400">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-700 dark:text-orange-400">
                  Read the review
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Transparency: how scoring works */}
      <ScoreExplainer />
    </div>
  )
}
