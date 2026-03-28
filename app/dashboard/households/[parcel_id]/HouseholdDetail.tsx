'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { HouseholdDetail as HouseholdDetailType } from '@/lib/atlas-api'
import { formatOwnerName, getSeverityBadgeClass, formatMailingAddress } from '@/lib/format-name'
import {
  formatCurrency,
  formatSalePrice,
  formatAddress,
  signalLabel,
  signalBadgeColor,
  severityLabel,
  titleCase,
  getRiskLevel,
} from '@/lib/format'

type BadgeColor = 'red' | 'amber' | 'teal' | 'blue'

function badgeStyle(color: BadgeColor) {
  const map = {
    red: { background: 'var(--badge-red-bg)', color: 'var(--badge-red-text)', border: '1px solid var(--badge-red-border)' },
    amber: { background: 'var(--badge-amber-bg)', color: 'var(--badge-amber-text)', border: '1px solid var(--badge-amber-border)' },
    teal: { background: 'var(--badge-teal-bg)', color: 'var(--badge-teal-text)', border: '1px solid var(--badge-teal-border)' },
    blue: { background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)', border: '1px solid var(--badge-blue-border)' },
  }
  return map[color]
}

function riskBadgeFromSignals(signalCodes: string[]) {
  const level = getRiskLevel(signalCodes)
  if (level === 'Urgent') return { label: 'Urgent', ...badgeStyle('red') }
  if (level === 'High Need') return { label: 'High Need', ...badgeStyle('amber') }
  return { label: 'Moderate', ...badgeStyle('blue') }
}

function deriveService(codes: string[]): string {
  if (codes.some((c) => /foreclosure|tax.?lien/i.test(c))) return 'Housing Counseling'
  if (codes.some((c) => /bankruptcy/i.test(c))) return 'Debt Management'
  if (codes.some((c) => /probate/i.test(c))) return 'Financial Planning'
  if (codes.some((c) => /denial|loan/i.test(c))) return 'Credit Counseling'
  return 'General Counseling'
}

const panel: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px 24px',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  fontWeight: 600,
  marginBottom: 16,
}

const colLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 6,
}

const selectBase: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  outline: 'none',
}

export function HouseholdDetail({ household: h }: { household: HouseholdDetailType }) {
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState<string[]>([])
  const [status, setStatus] = useState('new')
  const [counselor, setCounselor] = useState('')
  const fallbackRef = useRef<HTMLDivElement>(null)

  const risk = riskBadgeFromSignals(h.signal_codes)
  const rawAddr = `${titleCase(h.address)}, ${titleCase(h.city)}, ${h.state} ${h.zip}`
  const fullAddress = formatAddress(rawAddr)
  const yearsHeld = h.years_held ?? null
  const signals = h.signals ?? []

  const firstDate = h.first_signal_date ? new Date(h.first_signal_date).toLocaleDateString() : null
  const lastSignalDate = signals.length > 0
    ? new Date(Math.max(...signals.map((s) => new Date(s.detected_at).getTime()))).toLocaleDateString()
    : null
  const showMostRecent = lastSignalDate && lastSignalDate !== firstDate

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasApiKey = apiKey && apiKey.length > 0
  const streetViewEmbedUrl = hasApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(fullAddress)}&maptype=satellite&zoom=18`
    : null

  return (
    <div>
      {/* 1. Header */}
      <Link href="/dashboard/households" style={{ fontSize: 12, color: 'var(--accent-blue-text)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
        ← Households
      </Link>

      <div style={{ ...panel, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border-subtle)', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{fullAddress}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{
              ...risk,
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {risk.label}
            </span>
            <button
              onClick={() => window.print()}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              title="Print"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Street View */}
      <div style={{ marginBottom: 24 }}>
        {streetViewEmbedUrl && (
          <iframe
            src={streetViewEmbedUrl}
            style={{
              width: '100%',
              height: 220,
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              display: 'block',
            }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => {
              if (fallbackRef.current) fallbackRef.current.style.display = 'flex'
            }}
          />
        )}
        <div
          ref={fallbackRef}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            height: 100,
            display: streetViewEmbedUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 12,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Property view unavailable</span>
        </div>
      </div>

      {/* 3. Property Details | Distress Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={panel}>
          <div style={sectionLabel}>Property Details</div>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DetailRow label="Assessed Value" value={formatCurrency(h.assessed_value)} />
            <DetailRow label="Estimated Equity" value={formatCurrency(h.estimated_equity)} />
            <DetailRow label="Last Sale" value={formatSalePrice(h.last_sale_price)} />
            <DetailRow label="Years Held" value={yearsHeld ? `${yearsHeld} years` : '—'} />
            <DetailRow label="County" value={h.county || '—'} />
          </dl>
        </div>

        <div style={panel}>
          <div style={sectionLabel}>Distress Indicators</div>
          {h.signal_codes.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No signals detected</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {h.signal_codes.map((code) => {
                const color = signalBadgeColor(code)
                const signal = signals.find((s) => s.code === code)
                return (
                  <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      ...badgeStyle(color),
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                      padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                      {signalLabel(code)}
                    </span>
                    {signal?.detected_at && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Detected {new Date(signal.detected_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )
              })}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 4 }}>
                {firstDate && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>First detected: {firstDate}</div>}
                {showMostRecent && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Most recent: {lastSignalDate}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Hardship Timeline | Equity Position | Action Intelligence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Hardship Timeline */}
        <div style={panel}>
          <div style={sectionLabel}>Hardship Timeline</div>
          {signals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...signals]
                .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
                .map((s, i) => {
                  const sevColor = getSeverityBadgeClass(s.category)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, width: 72 }}>
                        {new Date(s.detected_at).toLocaleDateString()}
                      </span>
                      <span style={{
                        ...badgeStyle(sevColor),
                        fontSize: 9, fontWeight: 700, padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)', textTransform: 'uppercase',
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {severityLabel(s.category)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {s.label || signalLabel(s.code)}
                      </span>
                    </div>
                  )
                })}
            </div>
          ) : h.signal_codes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {h.signal_codes.map((code) => (
                <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--accent-${signalBadgeColor(code)})` }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{signalLabel(code)}</span>
                </div>
              ))}
              {firstDate && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>First detected: {firstDate}</div>}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No signals detected</p>
          )}
        </div>

        {/* Equity Position */}
        <div style={panel}>
          <div style={sectionLabel}>Equity Position</div>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DetailRow label="Assessed Value" value={formatCurrency(h.assessed_value)} />
            <DetailRow label="Estimated Equity" value={formatCurrency(h.estimated_equity)} />
            <DetailRow label="Last Sale Price" value={formatSalePrice(h.last_sale_price)} />
            <DetailRow label="Years in Property" value={yearsHeld ? `${yearsHeld}` : '—'} />
            <DetailRow label="County" value={h.county || '—'} />
          </dl>
        </div>

        {/* Action Intelligence */}
        <div style={panel}>
          <div style={sectionLabel}>Action Intelligence</div>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DetailRow label="Service Category" value={deriveService(h.signal_codes)} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <dt style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Need Score</dt>
              <dd style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'baseline', gap: 2 }}>
                {String(h.compound_score)}
                {h.compound_score > 100 && (
                  <span title="Score reflects multiple overlapping distress factors" style={{ fontSize: 14, color: 'var(--text-muted)', cursor: 'help' }}>*</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 5. Contact Information */}
      <div style={{ ...panel, marginBottom: 16 }}>
        <div style={sectionLabel}>Contact Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Owner</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatOwnerName(h.owner_name || 'Unknown Owner')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Mailing Address</div>
            {h.owner_mailing_address ? (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatMailingAddress(h.owner_mailing_address)}
                {h.owner_city && `, ${formatMailingAddress(h.owner_city)}`}
                {h.owner_state && `, ${h.owner_state}`}
                {h.owner_zip && ` ${h.owner_zip}`}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>No mailing address on file</div>
            )}
          </div>
        </div>
        <button style={{
          marginTop: 14, padding: '8px 12px', fontSize: 12, fontWeight: 500,
          background: 'transparent', border: '1px solid var(--border-default)',
          color: 'var(--accent-blue-text)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        }}>
          Look Up Contact
        </button>
      </div>

      {/* 6. Counselor Notes */}
      <div style={{ ...panel, marginBottom: 12 }}>
        <div style={sectionLabel}>Counselor Notes</div>
        {savedNotes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {savedNotes.map((n, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
                {n}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>No notes yet</p>
        )}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note about this household..."
          style={{
            width: '100%', padding: '8px 12px', fontSize: 13,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)', resize: 'none', height: 80, outline: 'none',
          }}
        />
        <button
          onClick={() => {
            if (notes.trim()) {
              setSavedNotes((prev) => [...prev, notes.trim()])
              setNotes('')
            }
          }}
          style={{
            marginTop: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
            background: 'var(--accent-blue)', color: '#ffffff', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}
        >
          Add Note
        </button>
      </div>

      {/* 7. Status / Counselor / Flag row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: 12, alignItems: 'end',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 12,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}>
        <div>
          <div style={colLabel}>Current Status</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectBase}>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="contacted">Contacted</option>
            <option value="enrolled">Enrolled</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <div style={colLabel}>Assigned Counselor</div>
          <select value={counselor} onChange={(e) => setCounselor(e.target.value)} style={selectBase}>
            <option value="">Unassigned</option>
            <option value="counselor1">Counselor 1</option>
            <option value="counselor2">Counselor 2</option>
          </select>
        </div>
        <div>
          <div style={{ height: 18 }} />
          <button style={{
            width: '100%', padding: '10px 16px', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            background: '#d97706', color: '#ffffff', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ⚑ Flag for Counseling
          </button>
        </div>
      </div>

      {/* 8. Activity Log */}
      <div style={panel}>
        <div style={sectionLabel}>Activity Log</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
          No activity recorded yet
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <dt style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</dt>
      <dd style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{value}</dd>
    </div>
  )
}
