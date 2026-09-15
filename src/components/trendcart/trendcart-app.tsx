'use client'

import { AppRouterProvider, useAppRouter } from './app-router'
import { Header } from './header'
import { Footer } from './footer'
import { HomeView } from './views/home-view'
import {
  BestSellersView,
  CategoriesView,
  CategoryView,
  DealsView,
  HiddenGemsView,
  TrendingView,
  ViralView,
} from './views/listing-views'
import { ProductView } from './views/product-view'
import { SearchView } from './views/search-view'
import { ArticleView, ReviewsView } from './views/reviews-view'
import { AdminView } from './views/admin-view'
import { useEffect } from 'react'

/** Page titles per view — keeps the browser tab meaningful in the SPA. */
const VIEW_TITLES: Record<string, string> = {
  home: 'TrendCart — Discover What\u2019s Trending. Find What\u2019s Worth Buying.',
  trending: '🔥 Trending Now — TrendCart',
  'best-sellers': '🏆 Best Sellers (TrendCart Popularity Ranking) — TrendCart',
  deals: '💰 Today\u2019s Best Deals — TrendCart',
  'hidden-gems': '💎 Hidden Gems — TrendCart',
  viral: '🚀 Going Viral — TrendCart',
  categories: '🗂️ All Categories — TrendCart',
  search: '🔍 Search — TrendCart',
  reviews: '📝 Reviews & Guides — TrendCart',
  admin: 'Admin Dashboard — TrendCart',
}

function CurrentView() {
  const { route } = useAppRouter()

  useEffect(() => {
    // Product and article views set their own document titles
    if (route.view !== 'product' && route.view !== 'article') {
      document.title = VIEW_TITLES[route.view] ?? VIEW_TITLES.home
    }
  }, [route.view, route.slug])

  switch (route.view) {
    case 'home':
      return <HomeView />
    case 'trending':
      return <TrendingView />
    case 'best-sellers':
      return <BestSellersView tab={route.tab} />
    case 'deals':
      return <DealsView />
    case 'hidden-gems':
      return <HiddenGemsView />
    case 'viral':
      return <ViralView />
    case 'categories':
      return <CategoriesView />
    case 'category':
      return <CategoryView slug={route.slug ?? ''} />
    case 'product':
      return <ProductView slug={route.slug ?? ''} />
    case 'search':
      return <SearchView initialQuery={route.q} />
    case 'reviews':
      return <ReviewsView />
    case 'article':
      return <ArticleView slug={route.slug ?? ''} />
    case 'admin':
      return <AdminView />
    default:
      return <HomeView />
  }
}

export function TrendCartApp() {
  return (
    <AppRouterProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <CurrentView />
        </main>
        <Footer />
      </div>
    </AppRouterProvider>
  )
}
