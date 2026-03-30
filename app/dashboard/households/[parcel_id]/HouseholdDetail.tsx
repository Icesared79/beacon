'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { HouseholdDetail as HouseholdDetailType, Signal } from '@/lib/atlas-api'
import { ContactLookup } from '@/components/ContactLookup'
import { StreetView } from '@/components/StreetView'
import { formatOwnerName, formatMailingAddress } from '@/lib/format-name'
import {
  formatCurrency,
  formatSalePrice,
  formatAddress,
  signalLabel,
  getSignalBadgeStyle,
  getHouseholdGroup,
  sortSignalsBySeverity,
  severityLabel,
  titleCase,
} from '@/lib/format'

function riskBadgeFromSignals(signalCodes: string[]) {
  const group = getHouseholdGroup(signalCodes)
  if (group === 'critical') return { label: 'Urgent', ...getSignalBadgeStyle('foreclosure') }
  if (group === 'high_need') return { label: 'High Need', ...getSignalBadgeStyle('hmda_loan_denial') }
  return { label: 'Moderate', ...getSignalBadgeStyle('high_equity_confirmed') }
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
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  fontWeight: 700,
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

  return (
    <div>
      {/* 1. Header */}
      <Link href="/dashboard/households" style={{ fontSize: 12, color: 'var(--accent-blue-text)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
        ← Households
      </Link>

      <div style={{ ...panel, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border-subtle)', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>{fullAddress}</h1>
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
        <StreetView address={h.address} city={h.city} state={h.state} zip={h.zip} />
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
              {sortSignalsBySeverity(h.signal_codes).map((code) => {
                const signal = signals.find((s) => s.code === code)
                return (
                  <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      ...getSignalBadgeStyle(code, signal?.label || code),
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
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, width: 72 }}>
                        {new Date(s.detected_at).toLocaleDateString()}
                      </span>
                      <span style={{
                        ...getSignalBadgeStyle(s.code, s.label || s.category),
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
              {sortSignalsBySeverity(h.signal_codes).map((code) => (
                <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: getSignalBadgeStyle(code, code).color }} />
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

        {/* Outreach Intelligence */}
        <div style={panel}>
          <OutreachIntelligence
            riskLevel={risk.label as 'Urgent' | 'High Need' | 'Moderate'}
            signals={signals}
            signalCodes={h.signal_codes}
            needScore={h.compound_score}
            serviceCategory={h.suggested_service || deriveService(h.signal_codes)}
          />
        </div>
      </div>

      {/* 5. Outreach Briefing */}
      <OutreachBriefing
        signalCodes={h.signal_codes}
        signals={signals}
        yearsHeld={yearsHeld}
        estimatedEquity={h.estimated_equity}
        lastSalePrice={h.last_sale_price}
        serviceCategory={h.suggested_service || deriveService(h.signal_codes)}
        compoundScore={h.compound_score}
        firstSignalDate={h.first_signal_date}
      />

      {/* 6. Contact Information (was 5) */}
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
        <div style={{ marginTop: 14 }}>
          <ContactLookup
            address={h.address}
            city={h.city}
            state={h.state}
            zip={h.zip}
          />
        </div>
      </div>

      {/* 7. Counselor Notes */}
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

      {/* 8. Status / Counselor / Flag row */}
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

      {/* 9. Activity Log */}
      <div style={panel}>
        <div style={sectionLabel}>Activity Log</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
          No activity recorded yet
        </div>
      </div>
    </div>
  )
}

function signalDotColor(code: string): string {
  const c = code.toLowerCase()
  if (c.includes('hmda') || c.includes('distress')) return '#f59e0b'
  if (c.includes('vacancy')) return '#3b82f6'
  if (c.includes('equity') || c.includes('long_hold')) return '#10b981'
  return 'var(--text-muted)'
}

function signalImpact(code: string): string {
  const c = code.toLowerCase()
  if (c.includes('hmda') || c.includes('distress')) return 'High impact'
  if (c.includes('vacancy')) return 'Moderate impact'
  return 'Low impact'
}

function OutreachIntelligence({
  riskLevel,
  signals,
  signalCodes,
  needScore,
  serviceCategory,
}: {
  riskLevel: 'Urgent' | 'High Need' | 'Moderate'
  signals: Signal[]
  signalCodes: string[]
  needScore: number
  serviceCategory: string
}) {
  const riskConfig = {
    Urgent: {
      border: 'var(--accent-red)',
      labelColor: 'var(--accent-red-text)',
      barColor: '#ef4444',
      action: 'Call today',
    },
    'High Need': {
      border: 'var(--accent-amber)',
      labelColor: 'var(--accent-amber-text)',
      barColor: '#f59e0b',
      action: 'Outreach this week',
    },
    Moderate: {
      border: 'var(--accent-teal)',
      labelColor: 'var(--accent-teal-text)',
      barColor: '#10b981',
      action: 'Add to watch list',
    },
  }
  const config = riskConfig[riskLevel]

  // Use signals array if available, fall back to signalCodes
  const allSignals = signals.length > 0
    ? signals.map((s) => s.code)
    : signalCodes
  const signalCount = allSignals.length

  const barWidth = Math.min((needScore / 200) * 100, 100)

  return (
    <div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 16 }}>
        Outreach Intelligence
      </div>

      {/* Recommended Action */}
      <div style={{
        borderLeft: `3px solid ${config.border}`,
        borderRadius: '0 6px 6px 0',
        background: 'var(--bg-elevated)',
        padding: '14px 16px',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: config.labelColor, fontWeight: 700 }}>
          Recommended Action
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
          {config.action}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
          {signalCount === 0
            ? 'No distress signals detected'
            : `${signalCount} active distress signal${signalCount === 1 ? '' : 's'} detected`}
        </div>
      </div>

      {/* Score Drivers */}
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 10 }}>
        Score Drivers
      </div>
      {allSignals.length > 0 ? (
        <div>
          {allSignals.map((code, i) => (
            <div
              key={code + i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: i < allSignals.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: signalDotColor(code), flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{signalLabel(code)}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {signalImpact(code)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
          No signals on record
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '0.5px solid var(--border-subtle)', margin: '16px 0' }} />

      {/* Need Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>Need Score</span>
        <div style={{ flex: 1, margin: '0 12px', height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${barWidth}%`, height: '100%', background: config.barColor, borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {needScore}
          {needScore > 100 && (
            <span title="Score reflects multiple overlapping distress factors" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2, cursor: 'help' }}>*</span>
          )}
        </span>
      </div>

      {/* Recommended Service */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Recommended Service</span>
        <span style={{
          background: 'var(--badge-blue-bg)',
          color: 'var(--badge-blue-text)',
          border: '1px solid var(--badge-blue-border)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
        }}>
          {serviceCategory || 'Credit Counseling'}
        </span>
      </div>
    </div>
  )
}

/* ─── Outreach Briefing Panel ─── */

const SIGNAL_NAMES: Record<string, string> = {
  hmda_loan_denial: 'HMDA Loan Denial',
  distress_flagged: 'Distress Flagged',
  high_vacancy: 'High Vacancy',
  high_equity_confirmed: 'High Equity Confirmed',
  long_hold_confirmed: 'Long Hold Confirmed',
}

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  hmda_loan_denial:
    'Homeowner applied for a mortgage or refinance and was denied. May indicate credit issues, income documentation problems, or predatory lending patterns.',
  distress_flagged:
    'Multiple overlapping distress signals detected. This household shows compound indicators of financial hardship.',
  high_vacancy:
    'Property shows signs of vacancy or abandonment based on utility and occupancy data.',
  high_equity_confirmed:
    'Property has significant assessed equity with no active mortgage on record. Owner may be equity-rich but cash-poor.',
  long_hold_confirmed:
    'Homeowner has held this property for an extended period without a recorded sale or transfer. Indicates strong attachment to the home.',
}

const SIGNAL_DOT_COLORS: Record<string, string> = {
  distress_flagged: '#ef4444',
  hmda_loan_denial: '#f59e0b',
  high_vacancy: '#3b82f6',
  high_equity_confirmed: '#10b981',
  long_hold_confirmed: '#10b981',
}

const SIGNAL_SORT_ORDER: Record<string, number> = {
  distress_flagged: 0,
  hmda_loan_denial: 1,
  high_vacancy: 2,
}

function deriveSituation(codes: string[]): { value: string; sub: string } {
  if (codes.includes('distress_flagged'))
    return {
      value: 'Active distress signal detected',
      sub: 'Multiple overlapping distress signals detected on this property.',
    }
  if (codes.includes('hmda_loan_denial'))
    return {
      value: 'Mortgage application denied',
      sub: 'HMDA denial on file. Homeowner attempted to access credit and was turned down.',
    }
  if (codes.includes('high_vacancy'))
    return {
      value: 'Vacant or abandoned property',
      sub: 'Property shows signs of vacancy or abandonment.',
    }
  return { value: 'Distress indicators present', sub: 'See signal detail below.' }
}

function deriveServiceSub(category: string): string {
  switch (category) {
    case 'Credit Counseling':
      return 'Based on HMDA denial pattern and equity position'
    case 'Debt Management Program':
    case 'Debt Management':
      return 'Based on tax delinquency or foreclosure signals'
    case 'Bankruptcy Counseling':
      return 'Based on bankruptcy filing indicators'
    case 'Housing Counseling':
      return 'Based on probate or ownership signals'
    default:
      return 'Based on active distress signals'
  }
}

function OutreachBriefing({
  signalCodes,
  signals,
  yearsHeld,
  estimatedEquity,
  lastSalePrice,
  serviceCategory,
  compoundScore,
  firstSignalDate,
}: {
  signalCodes: string[]
  signals: Signal[]
  yearsHeld: number | null
  estimatedEquity: number | null
  lastSalePrice: number | null
  serviceCategory: string
  compoundScore: number
  firstSignalDate: string | null
}) {
  const situation = deriveSituation(signalCodes)

  // Household context
  const equityStatus =
    estimatedEquity != null && estimatedEquity > 100000
      ? 'high equity'
      : estimatedEquity != null && estimatedEquity > 0
        ? 'some equity'
        : 'equity unknown'

  let contextValue: string
  if (yearsHeld != null && yearsHeld > 10) contextValue = `Long-term owner, ${equityStatus}`
  else if (yearsHeld != null && yearsHeld > 0) contextValue = `Owner since ${new Date().getFullYear() - yearsHeld}, ${equityStatus}`
  else contextValue = equityStatus.charAt(0).toUpperCase() + equityStatus.slice(1)

  const contextSubParts: string[] = []
  if (yearsHeld != null) contextSubParts.push(`In property ${yearsHeld} years`)
  if (estimatedEquity != null) contextSubParts.push(`$${estimatedEquity.toLocaleString()} equity`)
  else contextSubParts.push('Equity unknown')
  if (lastSalePrice != null && lastSalePrice > 0) contextSubParts.push(`Last sale $${lastSalePrice.toLocaleString()}`)
  else contextSubParts.push('No recorded sale')
  const contextSub = contextSubParts.join(' · ')

  // Signal detail sorted
  const sortedCodes = [...signalCodes].sort((a, b) => {
    const oa = SIGNAL_SORT_ORDER[a] ?? 99
    const ob = SIGNAL_SORT_ORDER[b] ?? 99
    return oa - ob
  })

  const currentYear = new Date().getFullYear()

  const cardStyle = (borderColor: string): React.CSSProperties => ({
    background: 'var(--bg-elevated)',
    borderRadius: '0 6px 6px 0',
    borderLeft: `3px solid ${borderColor}`,
    padding: '14px 16px',
  })

  const cardLabel = (color: string): React.CSSProperties => ({
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    marginBottom: 6,
    color,
  })

  const cardValue: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  }

  const cardSub: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginTop: 4,
    lineHeight: 1.4,
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 12,
      }}
    >
      <div style={sectionLabel}>Outreach Briefing</div>

      {/* Top Row — Three cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Situation */}
        <div style={cardStyle('var(--accent-amber)')}>
          <div style={cardLabel('var(--accent-amber-text)')}>Situation</div>
          <div style={cardValue}>{situation.value}</div>
          <div style={cardSub}>{situation.sub}</div>
        </div>

        {/* Household Context */}
        <div style={cardStyle('var(--accent-blue)')}>
          <div style={cardLabel('var(--accent-blue-text)')}>Household Context</div>
          <div style={cardValue}>{contextValue}</div>
          <div style={cardSub}>{contextSub}</div>
        </div>

        {/* Relevant Service */}
        <div style={cardStyle('var(--accent-teal)')}>
          <div style={cardLabel('var(--accent-teal-text)')}>Relevant Service</div>
          <div style={cardValue}>{serviceCategory}</div>
          <div style={cardSub}>{deriveServiceSub(serviceCategory)}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '0.5px solid var(--border-subtle)', margin: '16px 0' }} />

      {/* Signal Detail */}
      <div style={sectionLabel}>Signal Detail</div>
      {sortedCodes.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
          No signals on record
        </div>
      ) : (
        sortedCodes.map((code) => {
          const sig = signals.find((s) => s.code === code)
          const dotColor = SIGNAL_DOT_COLORS[code] || 'var(--text-muted)'
          const name = SIGNAL_NAMES[code] || signalLabel(code)
          const desc = SIGNAL_DESCRIPTIONS[code] || ''
          const detectedAt = sig?.detected_at
            ? `Detected ${new Date(sig.detected_at).toLocaleDateString()}`
            : firstSignalDate
              ? `Detected ${new Date(firstSignalDate).toLocaleDateString()}`
              : null

          return (
            <div
              key={code}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: dotColor,
                  marginTop: 3,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {name}
                </div>
                {desc && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {desc}
                  </div>
                )}
                {detectedAt && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {detectedAt}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}

      {/* Equity Callout Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginTop: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Equity at Stake
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {estimatedEquity != null ? `$${estimatedEquity.toLocaleString()}` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Based on assessed value
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Years in Property
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {yearsHeld != null ? `${yearsHeld} years` : 'Unknown'}
          </div>
          {yearsHeld != null && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              Since {currentYear - yearsHeld}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Need Score
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {compoundScore}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {compoundScore > 100 ? 'Above average distress threshold' : 'Moderate distress indicators'}
          </div>
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
