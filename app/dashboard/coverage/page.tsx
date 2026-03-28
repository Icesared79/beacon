import { fetchMarkets, fetchStats } from '@/lib/atlas-api'
import { DashboardShell } from '@/components/DashboardShell'
import { AtlasStatus } from '@/components/AtlasStatus'
import { formatNumber, formatCompactCurrency, titleCase } from '@/lib/format'

// ACCC offices — used to determine coverage gaps
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

function normalizeState(s: string): string {
  const map: Record<string, string> = {
    Pennsylvania: 'PA',
  }
  return map[s] || s
}

export default async function CoveragePage() {
  const [{ markets }, stats] = await Promise.all([fetchMarkets(), fetchStats()])

  // Normalize and aggregate by state
  const stateMap = new Map<
    string,
    { state: string; households: number; urgent: number; avgScore: number; equity: number; cities: string[] }
  >()
  for (const m of markets) {
    const st = normalizeState(m.state)
    const existing = stateMap.get(st)
    if (existing) {
      existing.households += m.total_households
      existing.urgent += m.urgent_count
      existing.equity += m.total_equity_at_risk
      if (m.city) existing.cities.push(titleCase(m.city))
    } else {
      stateMap.set(st, {
        state: st,
        households: m.total_households,
        urgent: m.urgent_count,
        avgScore: m.avg_score,
        equity: m.total_equity_at_risk,
        cities: m.city ? [titleCase(m.city)] : [],
      })
    }
  }

  const activeStates = new Set(stateMap.keys())
  const gapStates = Object.keys(ACCC_OFFICES).filter((s) => !activeStates.has(s))

  const rows = [
    ...gapStates.map((s) => ({
      state: s,
      office: ACCC_OFFICES[s],
      hasData: false,
      households: 0,
      urgent: 0,
      avgScore: 0,
      equity: 0,
    })),
    ...[...stateMap.values()]
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((m) => ({
        state: m.state,
        office: ACCC_OFFICES[m.state] || '—',
        hasData: true,
        households: m.households,
        urgent: m.urgent,
        avgScore: m.avgScore,
        equity: m.equity,
      })),
  ]

  return (
    <DashboardShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--beacon-text)]">Coverage Intelligence</h1>
          <p className="text-sm text-[var(--beacon-text-secondary)]">
            Where Beacon is working — and where it isn&apos;t yet
          </p>
        </div>
        <AtlasStatus lastUpdated={stats.last_updated} />
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--beacon-surface)] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--beacon-text-muted)] mb-1">
            Markets Active
          </p>
          <p className="text-2xl font-bold text-[var(--beacon-text)] font-mono">
            {activeStates.size}
          </p>
        </div>
        <div className="bg-[var(--beacon-surface)] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--beacon-text-muted)] mb-1">
            Markets with No Coverage
          </p>
          <p className="text-2xl font-bold text-[var(--beacon-text)] font-mono">
            {gapStates.length}
          </p>
        </div>
        <div className="bg-[var(--beacon-surface)] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--beacon-text-muted)] mb-1">
            Total Households Identified
          </p>
          <p className="text-2xl font-bold text-[var(--beacon-text)] font-mono">
            {formatNumber(stats.total_households)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--beacon-surface)] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--beacon-border)]">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)]">
                Market
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)]">
                ACCC Office
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)]">
                Beacon Coverage
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)]">
                Households
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)]">
                Urgent
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)]">
                Need Score
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)]">
                Gap
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.state}
                className="border-b border-[var(--beacon-border)] last:border-b-0 hover:bg-[var(--beacon-surface-alt)] transition-colors"
              >
                <td className="px-4 py-3 font-medium text-[var(--beacon-text)]">{r.state}</td>
                <td className="px-4 py-3 text-[var(--beacon-text-secondary)]">{r.office}</td>
                <td className="px-4 py-3">
                  {r.hasData ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--beacon-surface-alt)] text-[var(--beacon-text-muted)]">
                      None
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[var(--beacon-text)] font-mono">
                  {r.hasData ? formatNumber(r.households) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-[var(--beacon-text)] font-mono">
                  {r.hasData ? formatNumber(r.urgent) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-[var(--beacon-text)] font-mono">
                  {r.hasData ? r.avgScore.toFixed(1) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {!r.hasData && r.office !== '—' ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
                      Coverage Gap
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  )
}
