'use client'

import { useAppRouter } from '../app-router'
import { useArticle, useArticles } from '../api'
import { ProductGrid } from '../product-card'
import { AFFILIATE_DISCLOSURE, formatDate } from '@/lib/constants'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ArrowRight, CalendarDays, Lightbulb, ShieldAlert } from 'lucide-react'

export function ReviewsView() {
  const { navigate } = useAppRouter()
  const { data, loading } = useArticles()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">📝 Reviews &amp; Guides</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Original TrendCart editorial — honest product picks, buying advice and FAQs. We research
          public data, category expertise and aggregated buyer feedback; where we haven&apos;t
          personally tested a product, we say so.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(data?.articles ?? []).map((a) => (
            <button
              key={a.id}
              onClick={() => navigate({ view: 'article', slug: a.slug })}
              className="group flex flex-col overflow-hidden rounded-3xl border bg-card text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[2/1] overflow-hidden bg-muted">
                <img
                  src={a.coverImage}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  <CalendarDays className="h-3 w-3" aria-hidden />
                  {formatDate(a.createdAt)}
                </p>
                <h2 className="mt-2 line-clamp-2 text-lg font-extrabold leading-snug tracking-tight group-hover:text-orange-700 dark:group-hover:text-orange-400">
                  {a.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {a.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-orange-700 dark:text-orange-400">
                  Read the full review
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ArticleView({ slug }: { slug: string }) {
  const { navigate } = useAppRouter()
  const { data, loading, error } = useArticle(slug)

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="aspect-[2/1] w-full rounded-3xl" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (error || !data?.article) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-5xl" aria-hidden>📰</span>
        <h1 className="text-2xl font-extrabold">Article not found</h1>
        <button
          onClick={() => navigate({ view: 'reviews' })}
          className="rounded-full bg-gradient-to-r from-orange-600 to-red-500 px-6 py-2.5 text-sm font-bold text-white shadow"
        >
          Back to Reviews
        </button>
      </div>
    )
  }

  const a = data.article

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8">
      <button
        onClick={() => navigate({ view: 'reviews' })}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-orange-700 dark:hover:text-orange-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All Reviews &amp; Guides
      </button>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
          TrendCart Review • {formatDate(a.createdAt)}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {a.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{a.excerpt}</p>
      </header>

      <div className="overflow-hidden rounded-3xl border bg-muted">
        <img src={a.coverImage} alt="" className="aspect-[2/1] w-full object-cover" />
      </div>

      <div className="flex flex-col gap-6">
        {a.sections.map((section, i) => {
          if (section.type === 'heading') {
            return (
              <h2 key={i} className="text-xl font-extrabold tracking-tight sm:text-2xl">
                {section.text}
              </h2>
            )
          }
          if (section.type === 'paragraph') {
            return (
              <p key={i} className="text-sm leading-7 text-foreground/90 sm:text-base">
                {section.text}
              </p>
            )
          }
          if (section.type === 'tip') {
            return (
              <aside
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {section.text}
              </aside>
            )
            }
          if (section.type === 'products') {
            const products = (section.slugs || [])
              .map((s) => a.embeddedProducts[s])
              .filter(Boolean)
            if (!products.length) return null
            return (
              <section key={i} className="flex flex-col gap-4">
                {section.title && (
                  <h3 className="text-base font-extrabold tracking-tight">{section.title}</h3>
                )}
                <ProductGrid products={products} source="article-card" />
              </section>
            )
          }
          return null
        })}
      </div>

      <footer className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {AFFILIATE_DISCLOSURE} Prices and availability are accurate as of the date/time indicated
        and are subject to change.
      </footer>
    </article>
  )
}
