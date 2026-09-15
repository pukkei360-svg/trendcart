'use client'

import { useState, type FormEvent } from 'react'
import { Menu, Search, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAppRouter, type View } from './app-router'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/lib/constants'

const NAV_ITEMS: Array<{ view: View; label: string; emoji: string }> = [
  { view: 'trending', label: 'Trending', emoji: '🔥' },
  { view: 'best-sellers', label: 'Best Sellers', emoji: '🏆' },
  { view: 'deals', label: 'Deals', emoji: '💰' },
  { view: 'hidden-gems', label: 'Hidden Gems', emoji: '💎' },
  { view: 'viral', label: 'Going Viral', emoji: '🚀' },
  { view: 'reviews', label: 'Reviews', emoji: '📝' },
  { view: 'categories', label: 'Categories', emoji: '🗂️' },
]

function SearchForm({
  className,
  autoFocus,
  onSubmitted,
  initialValue = '',
}: {
  className?: string
  autoFocus?: boolean
  onSubmitted?: () => void
  initialValue?: string
}) {
  const { navigate, route } = useAppRouter()
  const [q, setQ] = useState(initialValue || (route.view === 'search' ? route.q ?? '' : ''))

  function submit(e: FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    navigate({ view: 'search', q: term })
    onSubmitted?.()
  }

  return (
    <form role="search" onSubmit={submit} className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        autoFocus={autoFocus}
        className="h-10 w-full rounded-full border-orange-200 bg-orange-50/40 pl-10 pr-4 text-sm focus-visible:ring-orange-500 dark:border-orange-900 dark:bg-orange-950/20"
      />
    </form>
  )
}

export function Header() {
  const { route, navigate } = useAppRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (view: View) => route.view === view

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate({ view: 'home' })}
          className="flex shrink-0 items-center gap-2"
          aria-label={`${SITE_NAME} — home`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/30">
            <Flame className="h-5 w-5 text-white" aria-hidden />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Trend<span className="text-orange-600 dark:text-orange-400">Cart</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <button
              key={item.view}
              onClick={() => navigate({ view: item.view })}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                isActive(item.view)
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span className="mr-1" aria-hidden>
                {item.emoji}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop search */}
        <div className="ml-auto hidden max-w-md flex-1 md:block">
          <SearchForm />
        </div>

        {/* Mobile: search icon */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Search"
          onClick={() => navigate({ view: 'search' })}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="border-b p-4">
                <span className="text-lg font-extrabold tracking-tight">
                  Trend<span className="text-orange-600 dark:text-orange-400">Cart</span>
                </span>
                <div className="mt-3">
                  <SearchForm autoFocus onSubmitted={() => setMobileOpen(false)} />
                </div>
              </div>
              <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-3">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => {
                      navigate({ view: item.view })
                      setMobileOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors',
                      isActive(item.view)
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'
                        : 'hover:bg-muted',
                    )}
                  >
                    <span className="text-base" aria-hidden>
                      {item.emoji}
                    </span>
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="border-t p-4 text-xs text-muted-foreground">
                <p>
                  Discover What&apos;s Trending.
                  <br />
                  Find What&apos;s Worth Buying.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
