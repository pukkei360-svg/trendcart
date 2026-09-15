'use client'

import { useEffect, useState } from 'react'
import type { ArticleFullDTO, ArticleListItemDTO, CategoryDTO, ProductDTO, ProductFullDTO } from '@/lib/types'

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...((init?.headers as Record<string, string>) ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json() as Promise<T>
}

/** Generic data-fetching hook with loading + error state. */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(!!url)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setData(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchJson<T>(url)
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Something went wrong')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [url])

  return { data, loading, error }
}

export interface ProductQuery {
  section?: string
  category?: string
  q?: string
  minRating?: number
  minPrice?: number
  maxPrice?: number
  minDiscount?: number
  sort?: string
  limit?: number
  offset?: number
}

export function productsUrl(query: ProductQuery): string {
  const params = new URLSearchParams()
  if (query.section) params.set('section', query.section)
  if (query.category) params.set('category', query.category)
  if (query.q) params.set('q', query.q)
  if (query.minRating) params.set('minRating', String(query.minRating))
  if (query.minPrice) params.set('minPrice', String(query.minPrice))
  if (query.maxPrice) params.set('maxPrice', String(query.maxPrice))
  if (query.minDiscount) params.set('minDiscount', String(query.minDiscount))
  if (query.sort) params.set('sort', query.sort)
  if (query.limit) params.set('limit', String(query.limit))
  if (query.offset) params.set('offset', String(query.offset))
  return `/api/products?${params.toString()}`
}

interface ProductsResponse {
  products: ProductDTO[]
  total: number
  hasMore: boolean
}

export function useProducts(query: ProductQuery) {
  return useApi<ProductsResponse>(productsUrl(query))
}

export function useProduct(slug: string | undefined) {
  return useApi<{ product: ProductFullDTO }>(slug ? `/api/products/${slug}` : null)
}

export function useCategories() {
  return useApi<{ categories: CategoryDTO[] }>('/api/categories')
}

export function useArticles() {
  return useApi<{ articles: ArticleListItemDTO[] }>('/api/articles')
}

export function useArticle(slug: string | undefined) {
  return useApi<{ article: ArticleFullDTO }>(slug ? `/api/articles/${slug}` : null)
}

/** Fire-and-forget outbound click tracking (primary site KPI). */
export function trackClick(productId: number, source: string) {
  try {
    fetch('/api/track/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, source }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // tracking must never break the UX
  }
}
