'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useAppRouter } from '../app-router'
import { useCategories, useProducts } from '../api'
import { ProductGrid, ProductGridEmpty, ProductGridSkeleton } from '../product-card'
import { SortSelect } from './listing-views'
import type { SortKey } from '@/lib/types'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const ANY = '__any__'

export function SearchView({ initialQuery }: { initialQuery?: string }) {
  const { navigate, route } = useAppRouter()
  const [term, setTerm] = useState(initialQuery ?? '')

  // Keep local input in sync when arriving with ?q= (e.g. from header search)
  useEffect(() => {
    if (route.view === 'search') setTerm(route.q ?? '')
  }, [route.q, route.view])

  const [category, setCategory] = useState<string>(ANY)
  const [minRating, setMinRating] = useState<string>(ANY)
  const [priceBand, setPriceBand] = useState<string>(ANY)
  const [minDiscount, setMinDiscount] = useState<string>(ANY)
  const [sort, setSort] = useState<SortKey>('trending')

  const { data: catData } = useCategories()

  const activeQuery = initialQuery?.trim() || null
  const { data, loading } = useProducts({
    q: activeQuery ?? undefined,
    category: category !== ANY ? category : undefined,
    minRating: minRating !== ANY ? parseFloat(minRating) : undefined,
    minPrice: priceBand === '25-100' ? 25 : priceBand === '100+' ? 100 : undefined,
    maxPrice: priceBand === 'under25' ? 25 : priceBand === '25-100' ? 100 : undefined,
    minDiscount: minDiscount !== ANY ? parseInt(minDiscount, 10) : undefined,
    sort,
    limit: 48,
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = term.trim()
    if (!q) return
    navigate({ view: 'search', q })
  }

  const hasFilters =
    category !== ANY ||
    minRating !== ANY ||
    priceBand !== ANY ||
    minDiscount !== ANY

  const rows = data?.products ?? []
  const total = data?.total ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">🔍 Search Products</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search the TrendCart catalog — products, categories and curated picks.
        </p>
      </div>

      {/* Search bar */}
      <form role="search" onSubmit={submit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Try “earbuds”, “air fryer”, “gift”…"
          aria-label="Search products"
          className="h-14 w-full rounded-2xl border-2 border-orange-200 pl-12 pr-28 text-base font-medium focus-visible:ring-orange-500 dark:border-orange-900"
        />
        <Button
          type="submit"
          className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-gradient-to-r from-orange-600 to-red-500 px-6 font-bold"
        >
          Search
        </Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-40 rounded-full text-xs font-semibold" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All categories</SelectItem>
            {(catData?.categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger className="h-9 w-36 rounded-full text-xs font-semibold" aria-label="Filter by rating">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any rating</SelectItem>
            <SelectItem value="4">⭐ 4.0+ stars</SelectItem>
            <SelectItem value="4.5">⭐ 4.5+ stars</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceBand} onValueChange={setPriceBand}>
          <SelectTrigger className="h-9 w-40 rounded-full text-xs font-semibold" aria-label="Filter by price">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any price</SelectItem>
            <SelectItem value="under25">Under $25</SelectItem>
            <SelectItem value="25-100">$25 – $100</SelectItem>
            <SelectItem value="100+">$100+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={minDiscount} onValueChange={setMinDiscount}>
          <SelectTrigger className="h-9 w-36 rounded-full text-xs font-semibold" aria-label="Filter by discount">
            <SelectValue placeholder="Discount" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any discount</SelectItem>
            <SelectItem value="10">10%+ off</SelectItem>
            <SelectItem value="25">25%+ off</SelectItem>
            <SelectItem value="35">35%+ off</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-full text-xs font-semibold text-red-600 hover:text-red-700"
            onClick={() => {
              setCategory(ANY)
              setMinRating(ANY)
              setPriceBand(ANY)
              setMinDiscount(ANY)
            }}
          >
            <X className="mr-1 h-3 w-3" aria-hidden />
            Clear filters
          </Button>
        )}

        <div className={cn('ml-auto', !activeQuery && 'opacity-50')}>
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Results */}
      {!activeQuery ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-16 text-center">
          <span className="text-5xl" aria-hidden>
            🔍
          </span>
          <p className="font-bold">Search the catalog</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Type anything above — product names, categories (“kitchen”), or vibes (“gift”).
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {['earbuds', 'air fryer', 'yoga', 'gaming', 'vitamin c'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setTerm(s)
                  navigate({ view: 'search', q: s })
                }}
                className="rounded-full border bg-muted px-3 py-1 text-xs font-semibold transition-colors hover:border-orange-300 hover:text-orange-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <ProductGridSkeleton />
      ) : rows.length === 0 ? (
        <ProductGridEmpty
          message={`No results for “${activeQuery}”`}
          hint="Try a broader term, or clear the filters above."
        />
      ) : (
        <>
          <p className="text-xs font-semibold text-muted-foreground">
            {total} result{total === 1 ? '' : 's'} for “{activeQuery}”
          </p>
          <ProductGrid products={rows} source="search-result" />
        </>
      )}
    </div>
  )
}
