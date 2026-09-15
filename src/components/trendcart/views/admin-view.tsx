'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAppRouter } from '../app-router'
import { fetchJson, type ProductQuery } from '../api'
import type { AdminStats, CategoryDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  Boxes,
  LogOut,
  Lock,
  MousePointerClick,
  Package,
  Percent,
  Settings as SettingsIcon,
  Tags,
  Trash2,
  User,
  Eye,
} from 'lucide-react'
import { AdminProductsPanel } from './admin-products'
import { useToast } from '@/hooks/use-toast'

const TOKEN_KEY = 'trendcart_admin_token'
const API_BASE = '/api/admin'

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token ?? ''}`,
    },
  })
  if (res.status === 401) {
    throw new AuthError('Session expired — please sign in again')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/* ============================== Login ============================== */

function LoginCard({ onLogin }: { onLogin: (token: string) => void }) {
  const { toast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await fetchJson<{ token: string }>('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      onLogin(data.token)
      toast({ title: 'Welcome back', description: 'Signed in to the TrendCart admin dashboard.' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border bg-card p-7 shadow-lg"
        aria-labelledby="admin-login-title"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/30">
          <Lock className="h-5 w-5 text-white" aria-hidden />
        </span>
        <h1 id="admin-login-title" className="mt-4 text-center text-xl font-extrabold tracking-tight">
          TrendCart Admin
        </h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Manage products, categories, deals and site settings.
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-username">Username</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
                autoComplete="username"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                autoComplete="current-password"
                required
              />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="mt-6 h-11 w-full rounded-full bg-gradient-to-r from-orange-600 to-red-500 font-bold"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="mt-4 rounded-xl bg-muted/70 p-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">
          Demo credentials: <span className="font-bold">admin</span> / <span className="font-bold">trendcart2026</span>
          <br />
          (Change these before any real deployment.)
        </p>
      </form>
    </div>
  )
}

/* ============================== Overview ============================== */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminFetch<{ stats: AdminStats }>('/stats')
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!stats)
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Package} label="Products" value={stats.totalProducts} sub={`${stats.activeProducts} active · ${stats.draftProducts} draft`} />
        <StatCard icon={Tags} label="Categories" value={stats.totalCategories} sub={`${stats.activeDeals} active deals`} />
        <StatCard icon={Eye} label="Product Views" value={stats.totalViews.toLocaleString()} sub="All-time tracked views" />
        <StatCard icon={MousePointerClick} label="Outbound Clicks" value={stats.totalClicks.toLocaleString()} sub="All-time Amazon clicks" />
        <StatCard
          icon={BarChart3}
          label="Outbound CTR"
          value={`${stats.ctr.toFixed(1)}%`}
          sub="Clicks ÷ views — the site's primary KPI"
        />
        <StatCard icon={Percent} label="Deal Coverage" value={`${Math.round((stats.activeDeals / Math.max(stats.activeProducts, 1)) * 100)}%`} sub="Active products marked as deals" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top products by clicks */}
        <section className="rounded-2xl border bg-card p-4" aria-labelledby="top-products">
          <h3 id="top-products" className="text-sm font-extrabold">
            Most-clicked products
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs text-right">Views</TableHead>
                <TableHead className="text-xs text-right">Clicks</TableHead>
                <TableHead className="text-xs text-right">CTR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[220px] truncate text-xs font-semibold">
                    <img src={p.image} alt="" className="mr-2 inline h-6 w-6 rounded object-cover" />
                    {p.name}
                  </TableCell>
                  <TableCell className="text-right text-xs">{p.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs font-bold text-orange-700 dark:text-orange-400">
                    {p.clicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {p.views > 0 ? `${((p.clicks / p.views) * 100).toFixed(1)}%` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {/* Recent clicks */}
        <section className="rounded-2xl border bg-card p-4" aria-labelledby="recent-clicks">
          <h3 id="recent-clicks" className="text-sm font-extrabold">
            Recent outbound clicks
          </h3>
          <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
            {stats.recentClicks.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2">
                <span className="min-w-0 truncate text-xs font-semibold">{c.productName}</span>
                <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                  {c.source}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

/* ============================== Categories ============================== */

function CategoriesTab() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<CategoryDTO[] | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(() => {
    adminFetch<{ categories: CategoryDTO[] }>('/categories')
      .then((d) => setCategories(d.categories))
      .catch((e) => toast({ title: 'Failed to load categories', description: e.message, variant: 'destructive' }))
  }, [toast])

  useEffect(() => {
    reload()
  }, [reload])

  async function addCategory(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await adminFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, icon, description }),
      })
      toast({ title: 'Category added', description: `“${name}” is live.` })
      setName('')
      setIcon('')
      setDescription('')
      reload()
    } catch (err) {
      toast({
        title: 'Could not add category',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  async function deleteCategory(cat: CategoryDTO) {
    if (!window.confirm(`Delete category “${cat.name}”?`)) return
    try {
      await adminFetch(`/categories/${cat.id}`, { method: 'DELETE' })
      toast({ title: 'Category deleted' })
      reload()
    } catch (err) {
      toast({
        title: 'Could not delete category',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={addCategory} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        <h3 className="text-sm font-extrabold">Add category</h3>
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Name</Label>
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Baby" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-icon">Icon (emoji)</Label>
          <Input id="cat-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍼" className="w-20 text-center" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-desc">Description</Label>
          <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What belongs in this category…" rows={3} />
        </div>
        <Button type="submit" disabled={busy} className="rounded-full bg-gradient-to-r from-orange-600 to-red-500 font-bold">
          {busy ? 'Adding…' : 'Add category'}
        </Button>
      </form>

      <div className="lg:col-span-2">
        {!categories ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl dark:bg-orange-950/40" aria-hidden>
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {c.name}{' '}
                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      /{c.slug}
                    </span>
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                  {c.productCount} products
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-red-500 hover:text-red-600"
                  aria-label={`Delete ${c.name}`}
                  onClick={() => deleteCategory(c)}
                  disabled={c.productCount > 0}
                  title={c.productCount > 0 ? 'Category still has products' : 'Delete category'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ============================== Settings ============================== */

function SettingsTab() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Record<string, string> | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminFetch<{ settings: Record<string, string> }>('/settings')
      .then((d) => setSettings(d.settings))
      .catch((e) => toast({ title: 'Failed to load settings', description: e.message, variant: 'destructive' }))
  }, [toast])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!settings) return
    setBusy(true)
    try {
      const data = await adminFetch<{ settings: Record<string, string> }>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      setSettings(data.settings)
      toast({
        title: 'Settings saved',
        description: 'New affiliate tag will apply to all outbound links immediately.',
      })
    } catch (err) {
      toast({
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  if (!settings) return <Skeleton className="h-64 rounded-2xl" />

  const update = (key: string, value: string) => setSettings((s) => ({ ...(s ?? {}), [key]: value }))

  return (
    <form onSubmit={save} className="max-w-xl space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="set-tag">Amazon Associates tag</Label>
        <Input id="set-tag" value={settings.amazon_affiliate_tag ?? ''} onChange={(e) => update('amazon_affiliate_tag', e.target.value)} placeholder="yourstore-20" />
        <p className="text-[11px] text-muted-foreground">
          Appended to every outbound Amazon link (e.g. <code>?tag=yourstore-20</code>). Applied
          site-wide on next page load.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="set-name">Site name</Label>
        <Input id="set-name" value={settings.site_name ?? ''} onChange={(e) => update('site_name', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="set-tagline">Tagline</Label>
        <Input id="set-tagline" value={settings.tagline ?? ''} onChange={(e) => update('tagline', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="set-disclosure">Affiliate disclosure</Label>
        <Textarea id="set-disclosure" value={settings.affiliate_disclosure ?? ''} onChange={(e) => update('affiliate_disclosure', e.target.value)} rows={4} />
      </div>
      <Button type="submit" disabled={busy} className="rounded-full bg-gradient-to-r from-orange-600 to-red-500 font-bold">
        {busy ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  )
}

/* ============================== Shell ============================== */

type AdminTab = 'overview' | 'products' | 'categories' | 'settings'

const TABS: Array<{ key: AdminTab; label: string; icon: React.ElementType }> = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'products', label: 'Products', icon: Boxes },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

export function AdminView() {
  const { navigate } = useAppRouter()
  const { toast } = useToast()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<AdminTab>('overview')

  useEffect(() => {
    setToken(getAdminToken())
    setReady(true)
  }, [])

  function handleLogin(t: string) {
    try {
      localStorage.setItem(TOKEN_KEY, t)
    } catch {
      // storage may be blocked; session lives in memory only
    }
    setToken(t)
  }

  function logout() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {}
    setToken(null)
    toast({ title: 'Signed out' })
  }

  if (!ready) return null

  if (!token) return <LoginCard onLogin={handleLogin} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the TrendCart catalog, categories, deals and monetization settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate({ view: 'home' })}>
            View site
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={logout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Sign out
          </Button>
        </div>
      </div>

      <div role="tablist" aria-label="Admin sections" className="flex flex-wrap gap-1 rounded-full border bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? 'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-600 to-red-500 px-4 py-1.5 text-xs font-extrabold text-white shadow'
                : 'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            <t.icon className="h-3.5 w-3.5" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'products' && (
        <AdminProductsPanel
          onAuthError={() => {
            try {
              localStorage.removeItem(TOKEN_KEY)
            } catch {}
            setToken(null)
          }}
        />
      )}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}
