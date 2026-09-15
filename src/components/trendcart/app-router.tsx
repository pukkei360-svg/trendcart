'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type View =
  | 'home'
  | 'trending'
  | 'best-sellers'
  | 'deals'
  | 'hidden-gems'
  | 'viral'
  | 'categories'
  | 'category'
  | 'product'
  | 'search'
  | 'reviews'
  | 'article'
  | 'admin'

export interface AppRoute {
  view: View
  slug?: string
  tab?: string
  q?: string
}

const VALID_VIEWS: View[] = [
  'home', 'trending', 'best-sellers', 'deals', 'hidden-gems', 'viral',
  'categories', 'category', 'product', 'search', 'reviews', 'article', 'admin',
]

export function routeToQuery(route: AppRoute): string {
  const params = new URLSearchParams()
  params.set('view', route.view)
  if (route.slug) params.set('slug', route.slug)
  if (route.tab) params.set('tab', route.tab)
  if (route.q) params.set('q', route.q)
  return params.toString()
}

function queryToRoute(sp: URLSearchParams): AppRoute {
  const raw = sp.get('view') as View | null
  return {
    view: raw && VALID_VIEWS.includes(raw) ? raw : 'home',
    slug: sp.get('slug') || undefined,
    tab: sp.get('tab') || undefined,
    q: sp.get('q') || undefined,
  }
}

interface AppRouterContextValue {
  route: AppRoute
  navigate: (route: AppRoute, opts?: { replace?: boolean }) => void
}

const AppRouterContext = createContext<AppRouterContextValue | null>(null)

export function AppRouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window === 'undefined') return { view: 'home' }
    return queryToRoute(new URLSearchParams(window.location.search))
  })

  useEffect(() => {
    const onPop = () => {
      setRoute(queryToRoute(new URLSearchParams(window.location.search)))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: AppRoute, opts?: { replace?: boolean }) => {
    const query = routeToQuery(next)
    const url = `${window.location.pathname}?${query}`
    if (opts?.replace) {
      window.history.replaceState(null, '', url)
    } else {
      window.history.pushState(null, '', url)
    }
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  const value = useMemo(() => ({ route, navigate }), [route, navigate])

  return <AppRouterContext.Provider value={value}>{children}</AppRouterContext.Provider>
}

export function useAppRouter(): AppRouterContextValue {
  const ctx = useContext(AppRouterContext)
  if (!ctx) throw new Error('useAppRouter must be used within AppRouterProvider')
  return ctx
}
