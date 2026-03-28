'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { HouseholdDetail as HouseholdDetailType } from '@/lib/atlas-api'
import {
  formatCurrency,
  formatSalePrice,
  signalLabel,
  signalColor,
  titleCase,
} from '@/lib/format'

function riskLevel(score: number, hasDistress: boolean): { label: string; color: string } {
  if (score >= 70 && hasDistress) return { label: 'Urgent', color: 'bg-red-100 text-red-700' }
  if (score >= 50) return { label: 'High Need', color: 'bg-amber-100 text-amber-700' }
  return { label: 'Moderate', color: 'bg-blue-100 text-blue-700' }
}

function deriveService(codes: string[]): string {
  if (codes.some((c) => /foreclosure|tax.?lien/i.test(c))) return 'Housing Counseling'
  if (codes.some((c) => /bankruptcy/i.test(c))) return 'Debt Management'
  if (codes.some((c) => /probate/i.test(c))) return 'Financial Planning'
  if (codes.some((c) => /denial|loan/i.test(c))) return 'Credit Counseling'
  return 'General Counseling'
}

export function HouseholdDetail({ household: h }: { household: HouseholdDetailType }) {
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState<string[]>([])
  const [status, setStatus] = useState('new')
  const [counselor, setCounselor] = useState('')

  const risk = riskLevel(h.compound_score, h.has_distress)
  const fullAddress = `${titleCase(h.address)}, ${titleCase(h.city)}, ${h.state} ${h.zip}`
  const yearsHeld = h.years_held ?? null
  const ownerSince = yearsHeld ? `${new Date().getFullYear() - yearsHeld}` : null
  const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${encodeURIComponent(fullAddress)}`

  const signals = h.signals ?? []

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/households"
        className="inline-flex items-center gap-1 text-sm text-[var(--beacon-primary)] hover:underline mb-4"
      >
        ← Back to Households
      </Link>

      {/* Header card */}
      <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--beacon-text)]">{fullAddress}</h1>
            <p className="text-sm text-[var(--beacon-text-muted)] mt-1">
              {titleCase(h.owner_name || 'Unknown Owner')}
            </p>
            {ownerSince && (
              <p className="text-xs text-[var(--beacon-text-muted)] mt-1">
                Owned since ~{ownerSince} ({yearsHeld} years)
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${risk.color}`}>
              {risk.label}
            </span>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-md border border-[var(--beacon-border)] text-[var(--beacon-text-muted)] hover:bg-[var(--beacon-surface-alt)]"
              title="Print"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Street View */}
      <div className="rounded-lg overflow-hidden mb-6 h-[200px] bg-[var(--beacon-surface-alt)]">
        <iframe
          src={streetViewUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          onError={(e) => {
            const el = e.currentTarget
            el.style.display = 'none'
          }}
        />
      </div>

      {/* Two column: Property Details + Distress Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Property Details */}
        <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
            Property Details
          </h2>
          <dl className="space-y-3">
            <DetailRow label="Assessed Value" value={formatCurrency(h.assessed_value)} />
            <DetailRow label="Estimated Equity" value={formatCurrency(h.estimated_equity)} />
            <DetailRow label="Last Sale" value={formatSalePrice(h.last_sale_price)} />
            <DetailRow label="Years Held" value={yearsHeld ? `${yearsHeld} years` : '—'} />
            <DetailRow label="County" value={h.county || '—'} />
          </dl>
        </div>

        {/* Distress Indicators */}
        <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
            Distress Indicators
          </h2>
          {h.signal_codes.length === 0 ? (
            <p className="text-sm text-[var(--beacon-text-muted)]">No signals detected</p>
          ) : (
            <div className="space-y-3">
              {h.signal_codes.map((code) => {
                const color = signalColor(code)
                const signal = signals.find((s) => s.signal_type === code)
                const bg =
                  color === 'red'
                    ? 'bg-red-100 text-red-700'
                    : color === 'amber'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                return (
                  <div key={code} className="flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${bg}`}>
                      {signalLabel(code)}
                    </span>
                    {signal?.detected_at && (
                      <span className="text-xs text-[var(--beacon-text-muted)]">
                        Detected {new Date(signal.detected_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )
              })}
              {h.first_signal_date && (
                <p className="text-xs text-[var(--beacon-text-muted)] pt-2 border-t border-[var(--beacon-border)]">
                  First detected: {new Date(h.first_signal_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Three column intelligence panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Hardship Timeline */}
        <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
            Hardship Timeline
          </h2>
          {signals.length > 0 ? (
            <div className="space-y-3">
              {signals
                .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
                .map((s, i) => {
                  const color = signalColor(s.signal_type)
                  const bg =
                    color === 'red'
                      ? 'bg-red-100 text-red-700'
                      : color === 'amber'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs text-[var(--beacon-text-muted)] shrink-0 w-20">
                        {new Date(s.detected_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${bg}`}>
                        {s.severity}
                      </span>
                      <span className="text-xs text-[var(--beacon-text-secondary)]">
                        {s.description || signalLabel(s.signal_type)}
                      </span>
                    </div>
                  )
                })}
            </div>
          ) : h.signal_codes.length > 0 ? (
            <div className="space-y-2">
              {h.signal_codes.map((code) => (
                <div key={code} className="flex items-center gap-2">
                  <SignalDot code={code} />
                  <span className="text-xs text-[var(--beacon-text-secondary)]">
                    {signalLabel(code)}
                  </span>
                </div>
              ))}
              {h.first_signal_date && (
                <p className="text-xs text-[var(--beacon-text-muted)] mt-2">
                  First detected: {new Date(h.first_signal_date).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--beacon-text-muted)]">No signals detected</p>
          )}
        </div>

        {/* Equity Position */}
        <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
            Equity Position
          </h2>
          <dl className="space-y-3">
            <DetailRow label="Assessed Value" value={formatCurrency(h.assessed_value)} />
            <DetailRow label="Estimated Equity" value={formatCurrency(h.estimated_equity)} />
            <DetailRow label="Last Sale Price" value={formatSalePrice(h.last_sale_price)} />
            <DetailRow label="Years in Property" value={yearsHeld ? `${yearsHeld}` : '—'} />
            <DetailRow label="County" value={h.county || '—'} />
          </dl>
        </div>

        {/* Action Intelligence */}
        <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
            Action Intelligence
          </h2>
          <dl className="space-y-3 mb-4">
            <DetailRow label="Service Category" value={deriveService(h.signal_codes)} />
            <DetailRow label="Suggested Service" value={h.suggested_service || '—'} />
            <DetailRow label="Need Score" value={String(h.compound_score)} />
          </dl>
          <div className="pt-3 border-t border-[var(--beacon-border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-2">
              Contact Information
            </p>
            {h.owner_mailing_address ? (
              <p className="text-xs text-[var(--beacon-text-secondary)]">
                {h.owner_mailing_address}
                {h.owner_city && `, ${h.owner_city}`}
                {h.owner_state && `, ${h.owner_state}`}
                {h.owner_zip && ` ${h.owner_zip}`}
              </p>
            ) : (
              <p className="text-xs text-[var(--beacon-text-muted)]">No mailing address on file</p>
            )}
            <button className="mt-3 w-full px-3 py-2 text-xs font-medium border border-[var(--beacon-border)] rounded-md text-[var(--beacon-text-secondary)] hover:bg-[var(--beacon-surface-alt)]">
              Look Up Contact
            </button>
          </div>
        </div>
      </div>

      {/* Counselor Notes */}
      <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
          Counselor Notes
        </h2>
        {savedNotes.length > 0 ? (
          <div className="space-y-2 mb-4">
            {savedNotes.map((n, i) => (
              <div key={i} className="p-3 bg-[var(--beacon-surface-alt)] rounded text-sm text-[var(--beacon-text-secondary)]">
                {n}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--beacon-text-muted)] mb-4">No notes yet</p>
        )}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note about this household..."
          className="w-full px-3 py-2 text-sm border border-[var(--beacon-border)] rounded-lg bg-[var(--beacon-surface)] text-[var(--beacon-text)] resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[var(--beacon-primary)]/30"
        />
        <button
          onClick={() => {
            if (notes.trim()) {
              setSavedNotes((prev) => [...prev, notes.trim()])
              setNotes('')
            }
          }}
          className="mt-2 px-4 py-2 text-sm font-medium border border-[var(--beacon-border)] rounded-md text-[var(--beacon-text-secondary)] hover:bg-[var(--beacon-surface-alt)]"
        >
          Add Note
        </button>
      </div>

      {/* Status and Assignment */}
      <div className="bg-[var(--beacon-surface)] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-4">
          Status & Assignment
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-[var(--beacon-text-muted)] mb-1">
              Current Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--beacon-border)] bg-[var(--beacon-surface)] text-[var(--beacon-text)]"
            >
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="outreach">Outreach Initiated</option>
              <option value="counseling">In Counseling</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--beacon-text-muted)] mb-1">
              Assigned Counselor
            </label>
            <select
              value={counselor}
              onChange={(e) => setCounselor(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--beacon-border)] bg-[var(--beacon-surface)] text-[var(--beacon-text)]"
            >
              <option value="">Unassigned</option>
              <option value="counselor1">Counselor 1</option>
              <option value="counselor2">Counselor 2</option>
            </select>
          </div>
        </div>
        <button className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[var(--beacon-high)] text-white hover:opacity-90 transition-colors">
          Flag for Counseling
        </button>
        <div className="mt-4 pt-4 border-t border-[var(--beacon-border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--beacon-text-muted)] mb-2">
            Activity Log
          </p>
          <p className="text-sm text-[var(--beacon-text-muted)] text-center py-4">
            No activity recorded yet
          </p>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs text-[var(--beacon-text-muted)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--beacon-text)]">{value}</dd>
    </div>
  )
}

function SignalDot({ code }: { code: string }) {
  const color = signalColor(code)
  const bg =
    color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'
  return <span className={`inline-block w-2 h-2 rounded-full ${bg}`} />
}
