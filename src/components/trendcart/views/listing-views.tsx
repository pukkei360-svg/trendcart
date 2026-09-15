'use client'

import { useState } from 'react'
import { useAppRouter } from '../app-router'
import { useCategories, useProducts } from '../api'
import { ProductGrid, ProductGridEmpty, ProductGridSkeleton, ProductListRow } from '../product-card'
import { SectionHeading, TrendBadge } from '../atoms'
import { CATEGORY_PLACEHOLDER } from '@/lib/constants'
import type { SortKey } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Info } from 'lucide-react'

/* ---------- Shared list scaffold ---------- */

function ListScaffold({
  emoji,
  title,
  subtitle,
  note,
  children,
}: {
  emoji: string
  title: string
  subtitle: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span className="mr-2" aria-hidden>
            {emoji}
          </span>
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {note && (
        <p className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs leading-relaxed text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {note}
        </p>
      )}
      {children}
    </div>
  )
}

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey
  onChange: (v: SortKey) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground">Sort by</span>
      <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
        <SelectTrigger className="h-9 w-44 rounded-full text-xs font-semibold" aria-label="Sort products">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="trending">🔥 TrendCart Score</SelectItem>
          <SelectItem value="popularity">🏆 Popularity</SelectItem>
          <SelectItem value="rating">⭐ Rating</SelectItem>
          <SelectItem value="reviews">💬 Most reviewed</SelectItem>
          <SelectItem value="price-asc">💸 Price: low to high</SelectItem>
          <SelectItem value="price-desc">💰 Price: high to low</SelectItem>
          <SelectItem value="discount">📉 Biggest discount</SelectItem>
          <SelectItem value="newest">🆕 Newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

/* ---------- 🔥 Trending ---------- */

export function TrendingView() {
  const { data, loading, error } = useProducts({ section: 'trending', limit: 24 })
  const rows = data?.products ?? []

  return (
    <ListScaffold
      emoji="🔥"
      title="Trending Now"
      subtitle="Products ranked by the TrendCart Score — a 0–100 rating computed from public signals: rating strength, review growth, deal strength and recent reader interest."
      note="Trending reflects measured interest on our site and public review activity. It is not a claim about Amazon's private sales data — TrendCart's rankings are our own."
    >
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : error ? (
        <ProductGridEmpty message="Couldn't load trending products" hint="Please try again in a moment." />
      ) : rows.length === 0 ? (
        <ProductGridEmpty message="Nothing is trending yet" hint="Check back soon — signals update daily." />
      ) : (
        <div className="flex flex-col gap-8">
          {/* Top 3 spotlight cards */}
          <ProductGrid products={rows.slice(0, 4)} ranked source="trending-card" />
          {/* Rest as ranked rows */}
          <div className="flex flex-col gap-3">
            {rows.slice(4).map((p, i) => (
              <ProductListRow key={p.id} product={p} rank={i + 5} />
            ))}
          </div>
        </div>
      )}
    </ListScaffold>
  )
}

/* ---------- 🏆 Best Sellers ---------- */

const BS_TABS = [
  { key: 'today', label: 'Today', sort: 'trending', hint: 'What readers are clicking in the last 24 hours' },
  { key: 'week', label: 'This Week', sort: 'popularity', hint: 'The week\u2019s most consistent performers' },
  { key: 'month', label: 'This Month', sort: 'reviews', hint: 'Long-term favorites with the largest review bases' },
] as const

export function BestSellersView({ tab: initialTab }: { tab?: string }) {
  const { navigate } = useAppRouter()
  const active = BS_TABS.find((t) => t.key === initialTab) ?? BS_TABS[0]
  const { data, loading } = useProducts({ section: 'best-sellers', sort: active.sort, limit: 24 })

  return (
    <ListScaffold
      emoji="🏆"
      title="Best Sellers"
      subtitle="TrendCart Popularity Ranking — the products our readers buy and love most. Our own ranking, not Amazon's internal best-seller list."
      note="Ranking language matters: because we don't have access to Amazon's sales data, these lists are labeled as TrendCart's own popularity ranking, computed from public signals."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Best sellers time range"
          className="inline-flex rounded-full border bg-muted p-1"
        >
          {BS_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active.key === t.key}
              onClick={() => navigate({ view: 'best-sellers', tab: t.key })}
              className={
                active.key === t.key
                  ? 'rounded-full bg-gradient-to-r from-orange-600 to-red-500 px-4 py-1.5 text-xs font-extrabold text-white shadow'
                  : 'rounded-full px-4 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground'
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{active.hint}</p>
      </div>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : (data?.products ?? []).length === 0 ? (
        <ProductGridEmpty message="No ranked products yet" />
      ) : (
        <ol className="flex flex-col gap-3">
          {(data?.products ?? []).map((p, i) => (
            <li key={p.id}>
              <ProductListRow product={p} rank={i + 1} />
            </li>
          ))}
        </ol>
      )}
    </ListScaffold>
  )
}

/* ---------- 💰 Deals ---------- */

export function DealsView() {
  const { data, loading } = useProducts({ section: 'deals', sort: 'discount', limit: 48 })
  const rows = data?.products ?? []

  return (
    <ListScaffold
      emoji="💰"
      title="Today's Best Deals"
      subtitle="Every discount here is a real, tracked price drop — never an invented 'original' price. Labels show what kind of deal it is."
    >
      <div className="flex flex-wrap gap-2" aria-label="Deal labels legend">
        <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">🔥 Huge Discount</span>
        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">💰 Great Deal</span>
        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-zinc-900">⚡ Limited Deal</span>
        <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">📉 Price Drop</span>
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : rows.length === 0 ? (
        <ProductGridEmpty message="No active deals right now" hint="Deals appear when tracked prices genuinely drop." />
      ) : (
        <ProductGrid products={rows} source="deal-card" />
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Price and availability information shown here is based on what we track publicly and may
        be out of date by the time you read it. The price displayed on Amazon at the moment of
        purchase is the one that applies. TrendCart earns a commission on qualifying purchases
        at no extra cost to you.
      </p>
    </ListScaffold>
  )
}

/* ---------- 💎 Hidden Gems ---------- */

export function HiddenGemsView() {
  const { data, loading } = useProducts({ section: 'hidden-gems', sort: 'rating', limit: 24 })
  const rows = data?.products ?? []

  return (
    <ListScaffold
      emoji="💎"
      title="Hidden Gems"
      subtitle="The internet's best-kept secrets: products that aren't famous but earn spectacular ratings from the people who actually bought them."
      note="How a product earns this badge: high sustained ratings, strong value for money, and far less attention than their quality deserves — our favorite kind of find."
    >
      {loading ? (
        <ProductGridSkeleton />
      ) : rows.length === 0 ? (
        <ProductGridEmpty message="No hidden gems right now" />
      ) : (
        <ProductGrid products={rows} source="gem-card" />
      )}
    </ListScaffold>
  )
}

/* ---------- 🚀 Viral ---------- */

const VIRAL_LABELS = [
  { label: 'Viral', emoji: '🔥', hint: 'Spiking hard in shares and searches' },
  { label: 'Rising', emoji: '📈', hint: 'Steady multi-week climb' },
  { label: "Everyone's Watching", emoji: '👀', hint: 'Our most-viewed listings' },
  { label: 'Fast Growing', emoji: '🚀', hint: 'Accelerating reader interest' },
]

export function ViralView() {
  const { data, loading } = useProducts({ section: 'viral', limit: 24 })
  const rows = data?.products ?? []

  return (
    <ListScaffold
      emoji="🚀"
      title="Going Viral"
      subtitle="Products picking up real momentum — the ones people keep sending to each other."
      note="We only label momentum we can measure: reader traffic, search interest and public review activity. If the data cools down, the label comes off."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {VIRAL_LABELS.map((v) => (
          <div key={v.label} className="rounded-2xl border bg-card p-3 text-center">
            <span className="text-xl" aria-hidden>
              {v.emoji}
            </span>
            <p className="mt-1 text-xs font-bold">{v.label}</p>
            <p className="text-[10px] text-muted-foreground">{v.hint}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : rows.length === 0 ? (
        <ProductGridEmpty message="Nothing viral at the moment" hint="Viral momentum comes and goes — check back soon." />
      ) : (
        <ProductGrid products={rows} source="viral-card" />
      )}
    </ListScaffold>
  )
}

/* ---------- 🗂️ Categories ---------- */

export function CategoriesView() {
  const { navigate } = useAppRouter()
  const { data, loading } = useCategories()

  return (
    <ListScaffold
      emoji="🗂️"
      title="All Categories"
      subtitle="Curated departments instead of an endless catalog — every category is hand-built around what's actually worth buying."
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.categories ?? []).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate({ view: 'category', slug: cat.slug })}
              className="group flex items-start gap-4 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg dark:hover:border-orange-900"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 text-3xl dark:from-orange-950/60 dark:to-amber-950/40" aria-hidden>
                {cat.icon}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight">{cat.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {cat.productCount} products
                  </span>
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                  {cat.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </ListScaffold>
  )
}

/* ---------- Category detail ---------- */

export function CategoryView({ slug }: { slug: string }) {
  const { navigate } = useAppRouter()
  const { data: catData } = useCategories()
  const [sort, setSort] = useState<SortKey>('trending')
  const { data, loading } = useProducts({ category: slug, sort, limit: 48 })
  const category = catData?.categories.find((c) => c.slug === slug)
  const rows = data?.products ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button className="hover:text-orange-700 hover:underline dark:hover:text-orange-400" onClick={() => navigate({ view: 'home' })}>
          Home
        </button>
        <span aria-hidden>›</span>
        <button className="hover:text-orange-700 hover:underline dark:hover:text-orange-400" onClick={() => navigate({ view: 'categories' })}>
          Categories
        </button>
        <span aria-hidden>›</span>
        <span className="font-semibold text-foreground">{category?.name ?? slug}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 text-3xl dark:from-orange-950/60 dark:to-amber-950/40" aria-hidden>
              {category?.icon ?? CATEGORY_PLACEHOLDER}
            </span>
            {category?.name ?? slug}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {category?.description ?? 'Curated picks in this category.'}
          </p>
        </div>
        <SortSelect value={sort} onChange={setSort} />
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : rows.length === 0 ? (
        <ProductGridEmpty
          message="No products in this category yet"
          hint="We only list products worth your attention — this category is being curated."
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {rows.length} product{rows.length === 1 ? '' : 's'} • ranked by TrendCart Score
          </p>
          <ProductGrid products={rows} source="category-grid" />
        </>
      )}
    </div>
  )
}

/* ---------- Small helper badge re-export for tree-shaking clarity ---------- */
export { TrendBadge }
