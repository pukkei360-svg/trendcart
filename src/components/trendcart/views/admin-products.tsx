'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { adminFetch, AuthError } from './admin-view'
import type { CategoryDTO, ProductFullDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Pencil, Plus, Star, Trash2, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/constants'

/* ------------------------- Product form state ------------------------- */

interface ProductForm {
  id?: number
  name: string
  slug: string
  shortDescription: string
  description: string
  categoryId: string
  image: string
  amazonUrl: string
  price: string
  oldPrice: string
  rating: string
  reviewCount: string
  trendingScore: string
  popularityScore: string
  trendingReason: string
  badge: string
  viralLabel: string
  whyWeLikeIt: string
  pros: string
  cons: string
  verdict: string
  whoItsFor: string
  whoShouldSkip: string
  isDeal: boolean
  dealLabel: string
  isFeatured: boolean
  status: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  categoryId: '',
  image: '',
  amazonUrl: 'https://www.amazon.com/s?k=',
  price: '',
  oldPrice: '',
  rating: '4.5',
  reviewCount: '0',
  trendingScore: '50',
  popularityScore: '50',
  trendingReason: '',
  badge: 'trending',
  viralLabel: '',
  whyWeLikeIt: '',
  pros: '',
  cons: '',
  verdict: '',
  whoItsFor: '',
  whoShouldSkip: '',
  isDeal: false,
  dealLabel: '',
  isFeatured: false,
  status: 'active',
}

function formFromProduct(p: ProductFullDTO): ProductForm {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description,
    categoryId: String(p.category.id),
    image: p.image,
    amazonUrl: p.amazonUrl,
    price: String(p.price),
    oldPrice: p.oldPrice ? String(p.oldPrice) : '',
    rating: String(p.rating),
    reviewCount: String(p.reviewCount),
    trendingScore: String(p.trendingScore),
    popularityScore: String(p.popularityScore),
    trendingReason: p.trendingReason,
    badge: p.badge,
    viralLabel: p.viralLabel ?? '',
    whyWeLikeIt: p.whyWeLikeIt.join('\n'),
    pros: p.pros.join('\n'),
    cons: p.cons.join('\n'),
    verdict: p.verdict,
    whoItsFor: p.whoItsFor,
    whoShouldSkip: p.whoShouldSkip,
    isDeal: p.isDeal,
    dealLabel: p.dealLabel ?? '',
    isFeatured: p.isFeatured,
    status: p.status,
  }
}

/* ------------------------- Form dialog ------------------------- */

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border p-4">
      <legend className="px-1.5 text-xs font-extrabold uppercase tracking-wider text-orange-700 dark:text-orange-400">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function ProductFormDialog({
  open,
  onOpenChange,
  form,
  setForm,
  categories,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  form: ProductForm
  setForm: (f: ProductForm) => void
  categories: CategoryDTO[]
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const isEdit = form.id !== undefined

  const up = (patch: Partial<ProductForm>) => setForm({ ...form, ...patch })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const payload = {
      name: form.name,
      slug: form.slug,
      shortDescription: form.shortDescription,
      description: form.description,
      categoryId: Number(form.categoryId),
      image: form.image,
      amazonUrl: form.amazonUrl,
      price: parseFloat(form.price),
      oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null,
      rating: parseFloat(form.rating),
      reviewCount: parseInt(form.reviewCount, 10),
      trendingScore: parseInt(form.trendingScore, 10),
      popularityScore: parseInt(form.popularityScore, 10),
      trendingReason: form.trendingReason,
      badge: form.badge,
      viralLabel: form.viralLabel || null,
      whyWeLikeIt: form.whyWeLikeIt,
      pros: form.pros,
      cons: form.cons,
      verdict: form.verdict,
      whoItsFor: form.whoItsFor,
      whoShouldSkip: form.whoShouldSkip,
      isDeal: form.isDeal,
      dealLabel: form.dealLabel || null,
      isFeatured: form.isFeatured,
      status: form.status,
    }
    try {
      if (isEdit) {
        await adminFetch(`/products/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast({ title: 'Product updated', description: `“${form.name}” saved.` })
      } else {
        await adminFetch('/products', { method: 'POST', body: JSON.stringify(payload) })
        toast({ title: 'Product created', description: `“${form.name}” added to the catalog.` })
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast({
        title: isEdit ? 'Update failed' : 'Create failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            Full catalog control — pricing, scores, badges, editorial content and affiliate links.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FieldSection title="Basics">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-name">Product name *</Label>
              <Input id="pf-name" value={form.name} onChange={(e) => up({ name: e.target.value, slug: form.slug || '' })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-slug">Slug (URL)</Label>
              <Input id="pf-slug" value={form.slug} onChange={(e) => up({ slug: e.target.value })} placeholder="auto-generated from name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-category">Category *</Label>
              <Select value={form.categoryId} onValueChange={(v) => up({ categoryId: v })}>
                <SelectTrigger id="pf-category">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-image">Image URL *</Label>
              <Input id="pf-image" value={form.image} onChange={(e) => up({ image: e.target.value })} placeholder="https://…" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-amazon">Amazon URL *</Label>
              <Input id="pf-amazon" value={form.amazonUrl} onChange={(e) => up({ amazonUrl: e.target.value })} placeholder="https://www.amazon.com/…" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-short">Short description (card summary)</Label>
              <Input id="pf-short" value={form.shortDescription} onChange={(e) => up({ shortDescription: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-desc">Full description</Label>
              <Textarea id="pf-desc" value={form.description} onChange={(e) => up({ description: e.target.value })} rows={3} />
            </div>
          </FieldSection>

          <FieldSection title="Pricing & Rating">
            <div className="space-y-1.5">
              <Label htmlFor="pf-price">Current price ($) *</Label>
              <Input id="pf-price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => up({ price: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-oldprice">Previous price ($)</Label>
              <Input id="pf-oldprice" type="number" step="0.01" min="0" value={form.oldPrice} onChange={(e) => up({ oldPrice: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-rating">Rating (0–5) — public average</Label>
              <Input id="pf-rating" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => up({ rating: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-reviews">Review count (public)</Label>
              <Input id="pf-reviews" type="number" min="0" value={form.reviewCount} onChange={(e) => up({ reviewCount: e.target.value })} />
            </div>
          </FieldSection>

          <FieldSection title="TrendCart Scores & Badges">
            <div className="space-y-1.5">
              <Label htmlFor="pf-tscore">Trending score (0–100)</Label>
              <Input id="pf-tscore" type="number" min="0" max="100" value={form.trendingScore} onChange={(e) => up({ trendingScore: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-pscore">Popularity score (0–100)</Label>
              <Input id="pf-pscore" type="number" min="0" max="100" value={form.popularityScore} onChange={(e) => up({ popularityScore: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-badge">Trend badge</Label>
              <Select value={form.badge} onValueChange={(v) => up({ badge: v })}>
                <SelectTrigger id="pf-badge">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exploding">🔥 Exploding</SelectItem>
                  <SelectItem value="rising">🚀 Rising Fast</SelectItem>
                  <SelectItem value="trending">📈 Trending</SelectItem>
                  <SelectItem value="popular">⭐ Popular</SelectItem>
                  <SelectItem value="hidden-gem">💎 Hidden Gem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-viral">Viral label (optional)</Label>
              <Select value={form.viralLabel} onValueChange={(v) => up({ viralLabel: v === '__none__' ? '' : v })}>
                <SelectTrigger id="pf-viral">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="Viral">🔥 Viral</SelectItem>
                  <SelectItem value="Rising">📈 Rising</SelectItem>
                  <SelectItem value="Everyone's Watching">👀 Everyone&apos;s Watching</SelectItem>
                  <SelectItem value="Fast Growing">🚀 Fast Growing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-treason">Why it&apos;s trending (signal-based reason)</Label>
              <Textarea id="pf-treason" value={form.trendingReason} onChange={(e) => up({ trendingReason: e.target.value })} rows={2} />
            </div>
          </FieldSection>

          <FieldSection title="Editorial Content">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-why">Why we like it (one per line)</Label>
              <Textarea id="pf-why" value={form.whyWeLikeIt} onChange={(e) => up({ whyWeLikeIt: e.target.value })} rows={4} placeholder={'Feature one\nFeature two'} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-pros">Pros (one per line)</Label>
              <Textarea id="pf-pros" value={form.pros} onChange={(e) => up({ pros: e.target.value })} rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-cons">Cons (one per line)</Label>
              <Textarea id="pf-cons" value={form.cons} onChange={(e) => up({ cons: e.target.value })} rows={4} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-verdict">Our verdict</Label>
              <Textarea id="pf-verdict" value={form.verdict} onChange={(e) => up({ verdict: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-for">Who is it for</Label>
              <Textarea id="pf-for" value={form.whoItsFor} onChange={(e) => up({ whoItsFor: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-skip">Who should skip it</Label>
              <Textarea id="pf-skip" value={form.whoShouldSkip} onChange={(e) => up({ whoShouldSkip: e.target.value })} rows={2} />
            </div>
          </FieldSection>

          <FieldSection title="Flags & Status">
            <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm font-semibold">
              <span>💰 Mark as deal</span>
              <Switch checked={form.isDeal} onCheckedChange={(v) => up({ isDeal: v })} aria-label="Mark as deal" />
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="pf-dlabel">Deal label</Label>
              <Select value={form.dealLabel || '__none__'} onValueChange={(v) => up({ dealLabel: v === '__none__' ? '' : v })} disabled={!form.isDeal}>
                <SelectTrigger id="pf-dlabel">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="Huge Discount">🔥 Huge Discount</SelectItem>
                  <SelectItem value="Great Deal">💰 Great Deal</SelectItem>
                  <SelectItem value="Limited Deal">⚡ Limited Deal</SelectItem>
                  <SelectItem value="Price Drop">📉 Price Drop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm font-semibold">
              <span>⭐ Feature on homepage</span>
              <Switch checked={form.isFeatured} onCheckedChange={(v) => up({ isFeatured: v })} aria-label="Feature on homepage" />
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="pf-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => up({ status: v })}>
                <SelectTrigger id="pf-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (visible)</SelectItem>
                  <SelectItem value="draft">Draft (hidden)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FieldSection>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="rounded-full bg-gradient-to-r from-orange-600 to-red-500 font-bold">
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------- Products panel ------------------------- */

export function AdminProductsPanel({ onAuthError }: { onAuthError: () => void }) {
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductFullDTO[] | null>(null)
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [term, setTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)

  const reload = useMemo(
    () => async () => {
      try {
        const data = await adminFetch<{ products: ProductFullDTO[] }>('/products')
        setProducts(data.products)
      } catch (err) {
        if (err instanceof AuthError) onAuthError()
        else toast({ title: 'Failed to load products', description: (err as Error).message, variant: 'destructive' })
      }
    },
    [toast, onAuthError],
  )

  useEffect(() => {
    reload()
    adminFetch<{ categories: CategoryDTO[] }>('/categories')
      .then((d) => setCategories(d.categories))
      .catch(() => {})
  }, [reload])

  const filtered = (products ?? []).filter((p) =>
    [p.name, p.category.name, p.slug].some((v) => v.toLowerCase().includes(term.toLowerCase())),
  )

  async function deleteProduct(p: ProductFullDTO) {
    if (!window.confirm(`Delete “${p.name}”? This also removes its click history.`)) return
    try {
      await adminFetch(`/products/${p.id}`, { method: 'DELETE' })
      toast({ title: 'Product deleted', description: `“${p.name}” removed from the catalog.` })
      reload()
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Filter by name, category or slug…"
            className="h-10 rounded-full pl-9"
            aria-label="Filter products"
          />
        </div>
        <Button
          onClick={() => {
            setForm(EMPTY_FORM)
            setDialogOpen(true)
          }}
          className="h-10 rounded-full bg-gradient-to-r from-orange-600 to-red-500 font-bold"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Add product
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Product</TableHead>
              <TableHead className="hidden text-xs md:table-cell">Category</TableHead>
              <TableHead className="text-xs">Price</TableHead>
              <TableHead className="hidden text-xs lg:table-cell">
                <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" aria-hidden /> Rating</span>
              </TableHead>
              <TableHead className="hidden text-xs lg:table-cell">
                <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" aria-hidden /> Score</span>
              </TableHead>
              <TableHead className="hidden text-xs sm:table-cell">Flags</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!products ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {term ? `No products match “${term}”` : 'No products yet — add your first one.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[260px]">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{p.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          /{p.slug} • {p.clicks} clicks
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs md:table-cell">
                    {p.category.icon} {p.category.name}
                  </TableCell>
                  <TableCell className="text-xs font-bold">{formatPrice(p.price)}</TableCell>
                  <TableCell className="hidden text-xs lg:table-cell">
                    ⭐ {p.rating.toFixed(1)} ({p.reviewCount.toLocaleString()})
                  </TableCell>
                  <TableCell className="hidden text-xs lg:table-cell font-bold text-orange-700 dark:text-orange-400">
                    {p.trendingScore}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.status === 'draft' && (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Draft</span>
                      )}
                      {p.isDeal && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400">Deal</span>
                      )}
                      {p.isFeatured && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">Featured</span>
                      )}
                      {p.viralLabel && (
                        <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300">Viral</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => {
                          setForm(formFromProduct(p))
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => deleteProduct(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {products && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {products.length} products
        </p>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        categories={categories}
        onSaved={reload}
      />
    </div>
  )
}
