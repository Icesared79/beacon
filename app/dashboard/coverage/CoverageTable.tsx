'use client'

import { formatNumber } from '@/lib/format'

interface Row {
  state: string
  displayName: string
  office: string
  hasData: boolean
  households: number
  urgent: number
  avgScore: number
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 16px',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-faint)',
  borderBottom: '1px solid var(--border-subtle)',
}

export function CoverageTable({ rows }: { rows: Row[] }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 0,
      overflow: 'hidden',
      transition: 'background-color 0.15s ease, border-color 0.15s ease',
    }}>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Market</th>
            <th style={thStyle}>ACCC Office</th>
            <th style={thStyle}>Beacon Coverage</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Households</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Urgent</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Need Score</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Gap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.state}
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.displayName}</td>
              <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.office}</td>
              <td style={{ padding: '10px 16px' }}>
                {r.hasData ? (
                  <span style={{
                    background: 'var(--badge-teal-bg)',
                    color: 'var(--badge-teal-text)',
                    border: '1px solid var(--badge-teal-border)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    textTransform: 'uppercase',
                  }}>Active</span>
                ) : (
                  <span style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}>None</span>
                )}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {r.hasData ? formatNumber(r.households) : '—'}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {r.hasData ? formatNumber(r.urgent) : '—'}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {r.hasData ? r.avgScore.toFixed(1) : '—'}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                {!r.hasData && r.office !== '—' ? (
                  <span style={{
                    background: 'var(--badge-red-bg)',
                    color: 'var(--badge-red-text)',
                    border: '1px solid var(--badge-red-border)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    textTransform: 'uppercase',
                  }}>Coverage Gap</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
