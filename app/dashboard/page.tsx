import { fetchStats } from '@/lib/atlas-api'
import { formatNumber } from '@/lib/format'
import { DashboardShell } from '@/components/DashboardShell'
import Link from 'next/link'

export default async function DashboardPage() {
  const stats = await fetchStats()

  const criticalCount = stats.urgent_households
  const highNeedCount = stats.high_households
  const monitorCount = stats.total_households - stats.urgent_households - stats.high_households
  const total = stats.total_households || 1

  const tiles = [
    { label: 'Households Identified', value: formatNumber(stats.total_households), accent: 'var(--accent-blue)' },
    { label: 'Families at Risk', value: formatNumber(stats.high_households), accent: 'var(--accent-red)' },
    { label: 'States with Coverage', value: String(stats.states_covered), accent: 'var(--accent-teal)' },
    { label: 'Avg Need Score', value: stats.avg_compound_score.toFixed(1), accent: 'var(--accent-amber)', showTooltip: stats.avg_compound_score > 100 },
  ]

  return (
    <DashboardShell lastUpdated={stats.last_updated}>
      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {tiles.map((t) => (
          <div
            key={t.label}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>
              {t.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'baseline', gap: 4 }}>
              {t.value}
              {t.showTooltip && (
                <span title="Score derived from composite signal weighting — values above 100 indicate multiple overlapping distress factors." style={{ fontSize: 14, color: 'var(--text-muted)', cursor: 'help' }}>*</span>
              )}
            </div>
            <div style={{ width: 32, height: 2, background: t.accent, marginTop: 12, borderRadius: 1 }} />
          </div>
        ))}
      </div>

      {/* Distress Indicators */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: 28,
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 12 }}>
          Distress Indicators
        </div>
        <div style={{ width: '100%', height: 8, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden', display: 'flex' }}>
          {criticalCount > 0 && (
            <div style={{ width: `${Math.max((criticalCount / total) * 100, 2)}%`, height: '100%', background: 'var(--accent-red)' }} />
          )}
          {highNeedCount > 0 && (
            <div style={{ width: `${Math.max((highNeedCount / total) * 100, 2)}%`, height: '100%', background: 'var(--accent-amber)' }} />
          )}
          {monitorCount > 0 && (
            <div style={{ width: `${Math.max((monitorCount / total) * 100, 2)}%`, height: '100%', background: 'var(--accent-blue)' }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          {criticalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Critical</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{formatNumber(criticalCount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-amber)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>High Need</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{formatNumber(highNeedCount)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Monitor</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{formatNumber(monitorCount)}</span>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <Link href="/dashboard/households?filter=urgent" style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '3px solid var(--accent-red)',
              borderRadius: '0 8px 8px 0',
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Urgent Households</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Families with active foreclosure or tax lien</div>
          </div>
        </Link>
        <Link href="/dashboard/coverage" style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '3px solid var(--accent-blue)',
              borderRadius: '0 8px 8px 0',
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Coverage Intelligence</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Where Beacon is working — and where it isn&apos;t yet</div>
          </div>
        </Link>
        <Link href="/dashboard/households" style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '3px solid var(--accent-teal)',
              borderRadius: '0 8px 8px 0',
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>All Households</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Browse all identified households</div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 12 }}>
          Recent Activity
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>
          No activity yet — counselor actions will appear here
        </div>
      </div>
    </DashboardShell>
  )
}
