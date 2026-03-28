import { fetchStats } from '@/lib/atlas-api'
import { formatNumber, formatCompactCurrency } from '@/lib/format'
import { DashboardShell } from '@/components/DashboardShell'
import { AtlasStatus } from '@/components/AtlasStatus'
import Link from 'next/link'

export default async function DashboardPage() {
  const stats = await fetchStats()

  const criticalCount = stats.urgent_households
  const highNeedCount = stats.high_households
  const monitorCount = stats.total_households - stats.urgent_households - stats.high_households

  const tiles = [
    { label: 'Households Identified', value: formatNumber(stats.total_households) },
    { label: 'Families at Risk of Foreclosure', value: formatNumber(stats.high_households) },
    { label: 'States with Coverage', value: String(stats.states_covered) },
    { label: 'Avg Need Score', value: stats.avg_compound_score.toFixed(1) },
  ]

  const total = stats.total_households || 1

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--beacon-text)]">Dashboard</h1>
        <AtlasStatus lastUpdated={stats.last_updated} />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="bg-[var(--beacon-surface)] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--beacon-text-muted)] mb-1">
              {t.label}
            </p>
            <p className="text-2xl font-bold text-[var(--beacon-text)] font-mono">{t.value}</p>
          </div>
        ))}
      </div>

      {/* Distress indicators */}
      <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
          Distress Indicators
        </h2>
        <div className="flex items-center gap-4 mb-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--beacon-critical)]" />
              <span className="text-sm text-[var(--beacon-text-secondary)]">
                Critical: {formatNumber(criticalCount)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--beacon-high)]" />
            <span className="text-sm text-[var(--beacon-text-secondary)]">
              High Need: {formatNumber(highNeedCount)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--beacon-info)]" />
            <span className="text-sm text-[var(--beacon-text-secondary)]">
              Monitor: {formatNumber(monitorCount)}
            </span>
          </div>
        </div>
        <div className="h-3 rounded-full bg-[var(--beacon-surface-alt)] overflow-hidden flex">
          {criticalCount > 0 && (
            <div
              className="bg-[var(--beacon-critical)] h-full"
              style={{ width: `${(criticalCount / total) * 100}%` }}
            />
          )}
          <div
            className="bg-[var(--beacon-high)] h-full"
            style={{ width: `${(highNeedCount / total) * 100}%` }}
          />
          <div
            className="bg-[var(--beacon-info)] h-full"
            style={{ width: `${(monitorCount / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Quick access + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/households?filter=urgent"
          className="bg-[var(--beacon-surface)] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow border-l-4 border-[var(--beacon-critical)]"
        >
          <p className="text-sm font-semibold text-[var(--beacon-text)]">Urgent Households</p>
          <p className="text-xs text-[var(--beacon-text-muted)] mt-1">
            Families with active foreclosure or tax lien
          </p>
        </Link>
        <Link
          href="/dashboard/coverage"
          className="bg-[var(--beacon-surface)] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow border-l-4 border-[var(--beacon-info)]"
        >
          <p className="text-sm font-semibold text-[var(--beacon-text)]">Coverage Intelligence</p>
          <p className="text-xs text-[var(--beacon-text-muted)] mt-1">
            Where Beacon is working — and where it isn&apos;t yet
          </p>
        </Link>
        <Link
          href="/dashboard/households"
          className="bg-[var(--beacon-surface)] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow border-l-4 border-[var(--beacon-high)]"
        >
          <p className="text-sm font-semibold text-[var(--beacon-text)]">All Households</p>
          <p className="text-xs text-[var(--beacon-text-muted)] mt-1">
            Browse all identified households
          </p>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
          Recent Activity
        </h2>
        <p className="text-sm text-[var(--beacon-text-muted)] text-center py-8">
          No activity yet — counselor actions will appear here
        </p>
      </div>
    </DashboardShell>
  )
}
