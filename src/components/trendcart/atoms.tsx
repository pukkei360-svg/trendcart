'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BADGE_META, DEAL_LABEL_META, formatCount } from '@/lib/constants'
import type { Badge, DealLabel } from '@/lib/types'

/* ---------- Rating stars ---------- */

export function RatingStars({
  rating,
  reviewCount,
  size = 'sm',
  className,
}: {
  rating: number
  reviewCount?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dim = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  const rounded = Math.round(rating * 2) / 2
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex" aria-label={`Rated ${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              dim,
              i <= rounded
                ? 'fill-amber-400 text-amber-400'
                : i - 0.5 === rounded
                  ? 'fill-amber-400/40 text-amber-400'
                  : 'fill-muted text-muted-foreground/30',
            )}
          />
        ))}
      </span>
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">({formatCount(reviewCount)})</span>
      )}
    </span>
  )
}

/* ---------- Trend badge ---------- */

export function TrendBadge({
  badge,
  size = 'sm',
  className,
}: {
  badge: Badge
  size?: 'sm' | 'md'
  className?: string
}) {
  const meta = BADGE_META[badge] ?? BADGE_META.trending
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold text-white shadow-sm',
        size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]',
        meta.className,
        className,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  )
}

/* ---------- Deal label chip ---------- */

export function DealChip({
  label,
  className,
}: {
  label: DealLabel | string
  className?: string
}) {
  const meta = DEAL_LABEL_META[label] ?? DEAL_LABEL_META['Great Deal']
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
        meta.className,
        className,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {label}
    </span>
  )
}

/* ---------- Discount chip ---------- */

export function DiscountChip({ discount, className }: { discount: number; className?: string }) {
  if (discount <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-extrabold text-red-600 dark:bg-red-950/60 dark:text-red-400',
        className,
      )}
    >
      -{discount}%
    </span>
  )
}

/* ---------- Trending score ring ---------- */

export function ScoreRing({
  score,
  size = 44,
  label,
}: {
  score: number
  size?: number
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, score))
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference
  const color = clamped >= 85 ? '#ea580c' : clamped >= 70 ? '#f59e0b' : clamped >= 55 ? '#d97706' : '#52525b'
  return (
    <span className="inline-flex items-center gap-2" title={`TrendCart Score: ${clamped}/100${label ? ` — ${label}` : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/15"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={size * 0.32}
          fontWeight={800}
          fill="currentColor"
          className="text-foreground"
        >
          {clamped}
        </text>
      </svg>
      {label && (
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      )}
    </span>
  )
}

/* ---------- Section heading ---------- */

export function SectionHeading({
  emoji,
  title,
  subtitle,
  action,
}: {
  emoji?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          {emoji && (
            <span className="mr-2" aria-hidden>
              {emoji}
            </span>
          )}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------- View all link ---------- */

export function ViewAllLink({ onClick, label = 'View all' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-400 dark:hover:bg-orange-950/70"
    >
      {label}
      <span aria-hidden>→</span>
    </button>
  )
}
