'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Household, Schema } from '@/lib/atlas-api'
import { isEntityName, formatOwnerName } from '@/lib/format-name'
import {
  formatCurrency,
  formatAddress,
  signalLabel,
  getSignalBadgeStyle,
  getHouseholdGroup,
  sortSignalsBySeverity,
  titleCase,
  formatDistressDuration,
  getEquityDisplay,
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


function isRowFiltered(h: { owner_name: string | null; assessed_value: number | null; estimated_equity: number | null }): boolean {
  if (!h.owner_name) return true
  if (isEntityName(h.owner_name)) return true
  if (h.assessed_value != null && h.assessed_value < 5000) return true
  if (h.estimated_equity != null && h.estimated_equity <= 0) return true
  return false
}

export function HouseholdsList({ initialHouseholds, schema }: Props) {
  const router = useRouter()
  const [stateFilter, setStateFilter] = useState('')
  const [signalFilter, setSignalFilter] = useState('')
  const [equityIdx, setEquityIdx] = useState(0)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const cleanHouseholds = useMemo(
    () => initialHouseholds.filter((h) => !isRowFiltered(h)),
    [initialHouseholds]
  )

  const filtered = useMemo(() => {
    let list = cleanHouseholds
    if (stateFilter) list = list.filter((h) => h.state === stateFilter)
    if (signalFilter) list = list.filter((h) => h.signal_codes.includes(signalFilter))
    const eq = EQUITY_RANGES[equityIdx]
    if (equityIdx > 0) {
      list = list.filter(
        (h) => h.estimated_equity != null && h.estimated_equity >= eq.min && h.estimated_equity < eq.max
      )
    }
    return list
  }, [cleanHouseholds, stateFilter, signalFilter, equityIdx])

  const groups = useMemo(() => {
    const critical: Household[] = []
    const high: Household[] = []
    const monitor: Household[] = []
    for (const h of filtered) {
      const g = getHouseholdGroup(h.signal_codes)
      if (g === 'critical') critical.push(h)
      else if (g === 'high_need') high.push(h)
      else monitor.push(h)
    }
    // Sort within each group: highest need_score first
    const byScore = (a: Household, b: Household) => b.compound_score - a.compound_score
    critical.sort(byScore)
    high.sort(byScore)
    monitor.sort(byScore)
    return { critical, high, monitor }
  }, [filtered])

  const activeFilters: { label: string; clear: () => void }[] = []
  if (stateFilter) activeFilters.push({ label: `State: ${stateFilter}`, clear: () => setStateFilter('') })
  if (signalFilter) activeFilters.push({ label: `Signal: ${signalLabel(signalFilter)}`, clear: () => setSignalFilter('') })
  if (equityIdx > 0) activeFilters.push({ label: `Equity: ${EQUITY_RANGES[equityIdx].label}`, clear: () => setEquityIdx(0) })

  const stateCount = new Set(filtered.map((h) => h.state)).size

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: 12,
    borderRadius: 4,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    outline: 'none',
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Households
          </h1>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {filtered.length.toLocaleString()} households across {stateCount} states
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={selectStyle}>
            <option value="">All States</option>
            {schema.states_covered.map((s) => (
              <option key={s.state} value={s.state}>{s.state} ({s.households.toLocaleString()})</option>
            ))}
          </select>
          <select value={signalFilter} onChange={(e) => setSignalFilter(e.target.value)} style={selectStyle}>
            <option value="">All Indicators</option>
            {schema.signal_types.map((s) => (
              <option key={s.code} value={s.code}>{signalLabel(s.code)} ({s.signal_count.toLocaleString()})</option>
            ))}
          </select>
          <select value={equityIdx} onChange={(e) => setEquityIdx(Number(e.target.value))} style={selectStyle}>
            {EQUITY_RANGES.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>
        </div>
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {activeFilters.map((f) => (
              <button
                key={f.label}
                onClick={f.clear}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--accent-blue-text)',
                  fontSize: 11,
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {f.label} <span style={{ fontSize: 13 }}>×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority groups */}
      <PriorityGroup
        id="critical"
        label="CRITICAL"
        description="Active foreclosure or tax lien — immediate outreach"
        accentColor="var(--accent-red)"
        labelColor="var(--accent-red-text)"
        items={groups.critical}
        collapsed={collapsed.critical}
        onToggle={() => setCollapsed((p) => ({ ...p, critical: !p.critical }))}
        onNavigate={(id) => router.push(`/dashboard/households/${encodeURIComponent(id)}`)}
      />
      <PriorityGroup
        id="high"
        label="HIGH NEED"
        description="HMDA loan denial or distress signal — outreach this week"
        accentColor="var(--accent-amber)"
        labelColor="var(--accent-amber-text)"
        items={groups.high}
        collapsed={collapsed.high}
        onToggle={() => setCollapsed((p) => ({ ...p, high: !p.high }))}
        onNavigate={(id) => router.push(`/dashboard/households/${encodeURIComponent(id)}`)}
      />
      <PriorityGroup
        id="monitor"
        label="MONITOR"
        description="Equity or vacancy signal — watch list"
        accentColor="var(--accent-blue)"
        labelColor="var(--accent-blue-text)"
        items={groups.monitor}
        collapsed={collapsed.monitor}
        onToggle={() => setCollapsed((p) => ({ ...p, monitor: !p.monitor }))}
        onNavigate={(id) => router.push(`/dashboard/households/${encodeURIComponent(id)}`)}
      />

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', fontSize: 12, color: 'var(--text-muted)' }}>
          No households match the current filters.
        </div>
      )}
    </div>
  )
}

function PriorityGroup({
  id,
  label,
  description,
  accentColor,
  labelColor,
  items,
  collapsed,
  onToggle,
  onNavigate,
}: {
  id: string
  label: string
  description: string
  accentColor: string
  labelColor: string
  items: Household[]
  collapsed?: boolean
  onToggle: () => void
  onNavigate: (parcelId: string) => void
}) {
  if (items.length === 0) return null

  const shown = items.slice(0, 50)

  return (
    <div style={{ marginTop: 0 }}>
      {/* Group header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 24px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ width: 3, height: 16, background: accentColor, borderRadius: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: labelColor }}>
          {label} ({items.length.toLocaleString()})
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>
          {description}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-faint)', marginLeft: 'auto' }}>
          {collapsed ? '▸' : '▾'}
        </span>
      </div>

      {!collapsed && (
        <div style={{ background: 'var(--bg-surface)', transition: 'background-color 0.15s ease' }}>
          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 180px 120px 80px 80px',
              padding: '7px 24px 7px 40px',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span style={colHeaderStyle}>Owner / Address</span>
            <span style={colHeaderStyle}>Signals</span>
            <span style={{ ...colHeaderStyle, textAlign: 'right' }}>Equity</span>
            <span style={{ ...colHeaderStyle, textAlign: 'right' }}>In Distress</span>
            <span style={colHeaderStyle} />
          </div>

          {/* Rows */}
          {shown.map((h, i) => (
            <HouseholdRow key={h.parcel_id} household={h} index={i} onNavigate={onNavigate} />
          ))}
          {items.length > 50 && (
            <div style={{ padding: '10px 24px', fontSize: 11, textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
              Showing 50 of {items.length.toLocaleString()} — use filters to narrow results
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const colHeaderStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-faint)',
  fontWeight: 600,
}

function HouseholdRow({
  household: h,
  index,
  onNavigate,
}: {
  household: Household
  index: number
  onNavigate: (id: string) => void
}) {
  const addr = formatAddress(`${titleCase(h.address)}, ${titleCase(h.city)}, ${h.state} ${h.zip}`)
  const sorted = sortSignalsBySeverity(h.signal_codes)
  const primarySignal = sorted[0]
  const extraCount = sorted.length - 1

  return (
    <div
      onClick={() => onNavigate(h.parcel_id)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 180px 120px 80px 80px',
        padding: '11px 24px 11px 40px',
        borderTop: index > 0 ? '1px solid var(--border-subtle)' : undefined,
        cursor: 'pointer',
        transition: 'background-color 0.1s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Owner / Address */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatOwnerName(h.owner_name || '')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {addr}
        </div>
      </div>

      {/* Signals */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {primarySignal && (
          <span style={{
            ...getSignalBadgeStyle(primarySignal, primarySignal),
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {signalLabel(primarySignal)}
          </span>
        )}
        {extraCount > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>+{extraCount} more</span>
        )}
      </div>

      {/* Equity */}
      {(() => {
        const eq = getEquityDisplay(
          h.assessed_value,
          h.estimated_equity,
          h.last_sale_price,
          h.last_sale_date ?? null,
          h.years_held ?? null
        )
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {eq.value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: eq.badgeColor === 'teal' ? '#10b981' : eq.badgeColor === 'amber' ? '#f59e0b' : '#ef4444',
                display: 'inline-block', flexShrink: 0,
              }} />
              {eq.note}
            </div>
          </div>
        )
      })()}

      {/* In Distress */}
      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {formatDistressDuration(h.first_signal_date)}
      </div>

      {/* Review */}
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(h.parcel_id) }}
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            color: 'var(--accent-blue-text)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          REVIEW
        </button>
      </div>
    </div>
  )
}
