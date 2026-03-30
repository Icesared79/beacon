import { fetchMarkets, fetchStats } from '@/lib/atlas-api'
import { DashboardShell } from '@/components/DashboardShell'
import { formatNumber } from '@/lib/format'
import { CoverageTable } from './CoverageTable'

const ACCC_OFFICES: Record<string, string> = {
  MA: 'Boston, MA',
  CT: 'Hartford, CT',
  NY: 'New York, NY',
  NJ: 'Newark, NJ',
  PA: 'Philadelphia, PA',
  FL: 'Tampa, FL',
  GA: 'Atlanta, GA',
  CO: 'Denver, CO',
  TX: 'Houston, TX',
  CA: 'Los Angeles, CA',
  IL: 'Chicago, IL',
  OH: 'Cleveland, OH',
}

const MARKET_NAMES: Record<string, string> = {
  CO: 'Denver, CO',
  PA: 'Philadelphia, PA',
  FL: 'Tampa, FL',
  GA: 'Atlanta, GA',
  NY: 'New York, NY',
  MA: 'Boston, MA',
  CT: 'Hartford, CT',
  NJ: 'Newark, NJ',
  TX: 'Houston, TX',
  CA: 'Los Angeles, CA',
  IL: 'Chicago, IL',
  OH: 'Cleveland, OH',
}

function normalizeState(s: string): string {
  const map: Record<string, string> = { Pennsylvania: 'PA' }
  return map[s] || s
}

function titleCaseLocal(str: string): string {
  return str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const panel: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px 24px',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
}

export default async function CoveragePage() {
  const [{ markets }, stats] = await Promise.all([fetchMarkets(), fetchStats()])

  const stateMap = new Map<string, { state: string; households: number; urgent: number; avgScore: number; equity: number }>()
  for (const m of markets) {
    const st = normalizeState(m.state)
    const existing = stateMap.get(st)
    if (existing) {
      existing.households += m.total_households
      existing.urgent += m.urgent_count
      existing.equity += m.total_equity_at_risk
    } else {
      stateMap.set(st, {
        state: st,
        households: m.total_households,
        urgent: m.urgent_count,
        avgScore: m.avg_score,
        equity: m.total_equity_at_risk,
      })
    }
  }

  const activeStates = new Set(stateMap.keys())
  const gapStates = Object.keys(ACCC_OFFICES).filter((s) => !activeStates.has(s))

  const rows = [
    ...gapStates.map((s) => ({
      state: s,
      displayName: MARKET_NAMES[s] || titleCaseLocal(s),
      office: ACCC_OFFICES[s],
      hasData: false,
      households: 0,
      urgent: 0,
      avgScore: 0,
    })),
    ...[...stateMap.values()]
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((m) => ({
        state: m.state,
        displayName: MARKET_NAMES[m.state] || titleCaseLocal(m.state),
        office: ACCC_OFFICES[m.state] || '—',
        hasData: true,
        households: m.households,
        urgent: m.urgent,
        avgScore: m.avgScore,
      })),
  ]

  return (
    <DashboardShell lastUpdated={stats.last_updated}>
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Coverage Intelligence
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Where Beacon is working — and where it isn&apos;t yet
        </p>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={panel}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
            Markets Active
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {activeStates.size}
          </div>
          <div style={{ width: 32, height: 2, background: 'var(--accent-teal)', marginTop: 12, borderRadius: 1 }} />
        </div>
        <div style={panel}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
            Markets with No Coverage
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {gapStates.length}
          </div>
          <div style={{ width: 32, height: 2, background: 'var(--accent-red)', marginTop: 12, borderRadius: 1 }} />
        </div>
        <div style={panel}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
            Total Households Identified
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatNumber(stats.total_households)}
          </div>
          <div style={{ width: 32, height: 2, background: 'var(--accent-blue)', marginTop: 12, borderRadius: 1 }} />
        </div>
      </div>

      <CoverageTable rows={rows} />
    </DashboardShell>
  )
}
