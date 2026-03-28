'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Household, Schema } from '@/lib/atlas-api'
import { AtlasStatus } from '@/components/AtlasStatus'
import {
  formatCurrency,
  isFilteredOut,
  signalLabel,
  signalColor,
  priorityGroup,
  titleCase,
} from '@/lib/format'

interface Props {
  initialHouseholds: Household[]
  schema: Schema
}

const EQUITY_RANGES = [
  { label: 'Any Equity', min: 0, max: Infinity },
  { label: 'Under $100K', min: 0, max: 100_000 },
  { label: '$100K – $500K', min: 100_000, max: 500_000 },
  { label: '$500K – $1M', min: 500_000, max: 1_000_000 },
  { label: 'Over $1M', min: 1_000_000, max: Infinity },
]

function SignalBadge({ code }: { code: string }) {
  const color = signalColor(code)
  const bg =
    color === 'red'
      ? 'bg-red-100 text-red-700'
      : color === 'amber'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-blue-100 text-blue-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${bg}`}>
      {signalLabel(code)}
    </span>
  )
}

function timeSinceSignal(dateStr: string | null): string {
  if (!dateStr) return '—'
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days < 1) return 'Today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month' : `${months} months`
}

export function HouseholdsList({ initialHouseholds, schema }: Props) {
  const [stateFilter, setStateFilter] = useState('')
  const [signalFilter, setSignalFilter] = useState('')
  const [equityIdx, setEquityIdx] = useState(0)

  const cleanHouseholds = useMemo(
    () => initialHouseholds.filter((h) => !isFilteredOut(h)),
    [initialHouseholds]
  )

  const filtered = useMemo(() => {
    let list = cleanHouseholds
    if (stateFilter) list = list.filter((h) => h.state === stateFilter)
    if (signalFilter) list = list.filter((h) => h.signal_codes.includes(signalFilter))
    const eq = EQUITY_RANGES[equityIdx]
    if (equityIdx > 0) {
      list = list.filter(
        (h) =>
          h.estimated_equity != null &&
          h.estimated_equity >= eq.min &&
          h.estimated_equity < eq.max
      )
    }
    return list
  }, [cleanHouseholds, stateFilter, signalFilter, equityIdx])

  const groups = useMemo(() => {
    const critical: Household[] = []
    const high: Household[] = []
    const monitor: Household[] = []
    for (const h of filtered) {
      const g = priorityGroup(h.compound_score, h.has_distress)
      if (g === 'critical') critical.push(h)
      else if (g === 'high') high.push(h)
      else monitor.push(h)
    }
    return { critical, high, monitor }
  }, [filtered])

  const activeFilters: { label: string; clear: () => void }[] = []
  if (stateFilter)
    activeFilters.push({ label: `State: ${stateFilter}`, clear: () => setStateFilter('') })
  if (signalFilter)
    activeFilters.push({
      label: `Signal: ${signalLabel(signalFilter)}`,
      clear: () => setSignalFilter(''),
    })
  if (equityIdx > 0)
    activeFilters.push({
      label: `Equity: ${EQUITY_RANGES[equityIdx].label}`,
      clear: () => setEquityIdx(0),
    })

  const stateCount = new Set(filtered.map((h) => h.state)).size

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--beacon-text)]">Households</h1>
          <p className="text-sm text-[var(--beacon-text-secondary)]">
            {filtered.length.toLocaleString()} households across {stateCount} states
          </p>
        </div>
        <AtlasStatus lastUpdated={schema.last_updated} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-[var(--beacon-border)] bg-[var(--beacon-surface)] text-[var(--beacon-text)]"
        >
          <option value="">All States</option>
          {schema.states_covered.map((s) => (
            <option key={s.state} value={s.state}>
              {s.state} ({s.households.toLocaleString()})
            </option>
          ))}
        </select>

        <select
          value={signalFilter}
          onChange={(e) => setSignalFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-[var(--beacon-border)] bg-[var(--beacon-surface)] text-[var(--beacon-text)]"
        >
          <option value="">All Indicators</option>
          {schema.signal_types.map((s) => (
            <option key={s.code} value={s.code}>
              {signalLabel(s.code)} ({s.signal_count.toLocaleString()})
            </option>
          ))}
        </select>

        <select
          value={equityIdx}
          onChange={(e) => setEquityIdx(Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-lg border border-[var(--beacon-border)] bg-[var(--beacon-surface)] text-[var(--beacon-text)]"
        >
          {EQUITY_RANGES.map((r, i) => (
            <option key={i} value={i}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((f) => (
            <button
              key={f.label}
              onClick={f.clear}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--beacon-primary-muted)] text-[var(--beacon-primary)] text-xs font-medium"
            >
              {f.label}
              <span className="ml-1 text-[var(--beacon-primary)]">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Priority groups */}
      <PriorityGroup
        label="Critical"
        description="Active foreclosure or tax lien — immediate outreach"
        borderColor="border-[var(--beacon-critical)]"
        items={groups.critical}
      />
      <PriorityGroup
        label="High Need"
        description="Tax delinquency, bankruptcy, or probate — outreach this week"
        borderColor="border-[var(--beacon-high)]"
        items={groups.high}
      />
      <PriorityGroup
        label="Monitor"
        description="Early distress indicators — watch list"
        borderColor="border-[var(--beacon-info)]"
        items={groups.monitor}
      />

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[var(--beacon-text-muted)] text-sm">
          No households match the current filters.
        </div>
      )}
    </div>
  )
}

function PriorityGroup({
  label,
  description,
  borderColor,
  items,
}: {
  label: string
  description: string
  borderColor: string
  items: Household[]
}) {
  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-sm font-semibold text-[var(--beacon-text)]">
          {label} ({items.length.toLocaleString()})
        </h3>
        <span className="text-xs text-[var(--beacon-text-muted)]">{description}</span>
      </div>
      <div className="bg-[var(--beacon-surface)] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {items.slice(0, 50).map((h, i) => (
          <div
            key={h.parcel_id}
            className={`flex items-center gap-4 px-4 py-3 border-l-4 ${borderColor} hover:bg-[var(--beacon-surface-alt)] transition-colors ${
              i > 0 ? 'border-t border-t-[var(--beacon-border)]' : ''
            }`}
          >
            {/* Name + address */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[var(--beacon-text)] truncate">
                {titleCase(h.owner_name || '')}
              </p>
              <p className="text-[13px] text-[var(--beacon-text-muted)] truncate">
                {titleCase(h.address)}, {titleCase(h.city)}, {h.state} {h.zip}
              </p>
            </div>

            {/* Signal badges */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              {h.signal_codes.length > 0 && <SignalBadge code={h.signal_codes[0]} />}
              {h.signal_codes.length > 1 && (
                <span className="text-[11px] text-[var(--beacon-text-muted)]">
                  +{h.signal_codes.length - 1} more
                </span>
              )}
            </div>

            {/* Equity */}
            <div className="hidden lg:block text-right shrink-0 w-28">
              <p className="text-sm font-medium text-[var(--beacon-text)]">
                {formatCurrency(h.estimated_equity)}
              </p>
              {!h.last_sale_price && h.assessed_value && (
                <p className="text-[11px] text-[var(--beacon-text-muted)]">Based on assessed value</p>
              )}
            </div>

            {/* Time in distress */}
            <div className="hidden lg:block text-right shrink-0 w-20">
              <p className="text-xs text-[var(--beacon-text-muted)]">
                {timeSinceSignal(h.first_signal_date)}
              </p>
            </div>

            {/* Review */}
            <Link
              href={`/dashboard/households/${encodeURIComponent(h.parcel_id)}`}
              className="shrink-0 px-3 py-1.5 text-xs font-medium border border-[var(--beacon-border)] rounded-md text-[var(--beacon-text-secondary)] hover:bg-[var(--beacon-surface-alt)] transition-colors"
            >
              Review
            </Link>
          </div>
        ))}
        {items.length > 50 && (
          <div className="px-4 py-3 text-xs text-center text-[var(--beacon-text-muted)] border-t border-[var(--beacon-border)]">
            Showing 50 of {items.length.toLocaleString()} — use filters to narrow results
          </div>
        )}
      </div>
    </div>
  )
}
