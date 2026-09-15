'use client'

import { useAppRouter, type View } from './app-router'
import { AFFILIATE_DISCLOSURE, SITE_NAME, SITE_TAGLINE } from '@/lib/constants'
import { ShieldCheck } from 'lucide-react'

const FOOTER_SECTIONS: Array<{ title: string; links: Array<{ view: View; label: string }> }> = [
  {
    title: 'Discover',
    links: [
      { view: 'trending', label: '🔥 Trending Now' },
      { view: 'best-sellers', label: '🏆 Best Sellers' },
      { view: 'deals', label: '💰 Today\u2019s Deals' },
      { view: 'hidden-gems', label: '💎 Hidden Gems' },
      { view: 'viral', label: '🚀 Going Viral' },
    ],
  },
  {
    title: 'Browse',
    links: [
      { view: 'categories', label: '🗂️ All Categories' },
      { view: 'reviews', label: '📝 Reviews & Guides' },
      { view: 'search', label: '🔍 Search' },
      { view: 'home', label: '🏠 Homepage' },
    ],
  },
]

export function Footer() {
  const { navigate } = useAppRouter()

  return (
    <footer className="mt-auto border-t bg-zinc-50 dark:bg-zinc-950/60">
      {/* Affiliate disclosure banner */}
      <div className="border-b border-amber-200/60 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3.5 sm:px-6">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            <span className="font-bold">Affiliate Disclosure: </span>
            {AFFILIATE_DISCLOSURE}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight">
                Trend<span className="text-orange-600 dark:text-orange-400">Cart</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{SITE_TAGLINE}</p>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
              TrendCart ranks products using our own TrendCart Score built from public signals —
              ratings, review growth, deal strength and measured interest. We never claim access
              to private sales data, and we don&apos;t publish fake reviews or invented discounts.
            </p>
          </div>
          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h3 className="text-sm font-bold">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate({ view: link.view })}
                      className="text-sm text-muted-foreground transition-colors hover:text-orange-700 hover:underline dark:hover:text-orange-400"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved. {SITE_NAME} is an
            independent review and discovery site and is not endorsed by or affiliated with
            Amazon.
          </p>
          <button
            onClick={() => navigate({ view: 'admin' })}
            className="rounded-full border px-3 py-1 transition-colors hover:border-orange-300 hover:text-orange-700 dark:hover:border-orange-800 dark:hover:text-orange-400"
          >
            Admin
          </button>
        </div>
      </div>
    </footer>
  )
}
