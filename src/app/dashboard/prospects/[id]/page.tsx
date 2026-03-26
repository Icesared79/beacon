'use client';

import { use, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Home,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Plus,
  Printer,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  ShieldCheck,
  RefreshCw,
  CalendarClock,
} from 'lucide-react';

import { SIGNAL_COLORS, STATUS_FLOW } from '@/lib/design-tokens';
import { getSignalsForProspect, getSuggestedService } from '@/lib/prospect-helpers';
import type { Prospect } from '@/lib/prospect-helpers';
import { cn, formatCurrency, getScoreColor, getScoreLabel, formatOwnerName } from '@/lib/utils';
import { StreetView } from '@/components/StreetView';

const EVENT_ICONS: Record<string, string> = {
  tax_delinquency: '💰',
  lis_pendens: '⚖️',
  llc_dissolved: '🏢',
  long_hold: '📅',
  high_equity: '📈',
  bankruptcy: '📋',
  probate: '📜',
};

// ─── Contact lookup persistence ───
interface ContactRecord {
  attemptedAt: string; // ISO timestamp
  found: boolean;
  phones: Array<{ number: string; type: string }>;
  emails: string[];
  mailingAddress: { street: string; city: string; state: string; zip: string } | null;
}

const CONTACT_STORAGE_KEY = 'beacon_contact_lookups';
const REQUERY_COOLDOWN_DAYS = 30;

function loadContactRecord(prospectId: string): ContactRecord | null {
  try {
    const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, ContactRecord>;
    return all[prospectId] || null;
  } catch {
    return null;
  }
}

function saveContactRecord(prospectId: string, record: ContactRecord) {
  try {
    const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
    const all: Record<string, ContactRecord> = raw ? JSON.parse(raw) : {};
    all[prospectId] = record;
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
}

function formatLookupDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' at '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  high: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  info: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
};

interface SignalEvent {
  id: string;
  prospect_id: string;
  signal_type: string;
  severity: string;
  detected_date: string;
  description: string;
  amount?: number;
}

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [status, setStatus] = useState('new');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<Array<{ text: string; time: string }>>([]);
  const [contactInfo, setContactInfo] = useState<{
    phones: Array<{ number: string; type: string }>;
    emails: string[];
    mailingAddress: { street: string; city: string; state: string; zip: string } | null;
  } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactFetched, setContactFetched] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactStep, setContactStep] = useState(0);
  const [contactProgress, setContactProgress] = useState(0);
  const [savedRecord, setSavedRecord] = useState<ContactRecord | null>(null);

  useEffect(() => {
    async function loadProspect() {
      try {
        const res = await fetch(`/api/beacon/prospects/${id}`);
        const data = await res.json();
        if (data.prospect) {
          setProspect(data.prospect);
          setStatus(data.prospect.status || 'new');
        }
      } catch (err) {
        console.error('Failed to load prospect:', err);
      } finally {
        setPageLoading(false);
      }
    }
    loadProspect();
  }, [id]);

  const signals = prospect ? getSignalsForProspect(prospect) : [];

  // Generate timeline events from prospect hardship flags + dates
  const events: SignalEvent[] = useMemo(() => {
    if (!prospect) return [];
    const first = prospect.first_signal_date;
    const recent = prospect.most_recent_signal_date;
    if (!first) return [];

    const items: SignalEvent[] = [];
    const pid = prospect.id;

    // Helper: interpolate a date between first and recent
    const interpolate = (frac: number): string => {
      const d0 = new Date(first);
      const d1 = recent ? new Date(recent) : new Date();
      const ms = d0.getTime() + (d1.getTime() - d0.getTime()) * frac;
      return new Date(ms).toISOString().slice(0, 10);
    };

    // Tax delinquency — often the earliest warning sign
    if (prospect.has_tax_delinquency) {
      items.push({
        id: `${pid}-tax-1`,
        prospect_id: pid,
        signal_type: 'tax_delinquency',
        severity: 'warning',
        detected_date: first,
        description: 'Property tax delinquency detected — past-due balance identified in county records.',
      });
      if (prospect.distress_months && prospect.distress_months > 6) {
        items.push({
          id: `${pid}-tax-2`,
          prospect_id: pid,
          signal_type: 'tax_delinquency',
          severity: 'high',
          detected_date: interpolate(0.5),
          description: 'Tax delinquency persists — risk of tax lien sale increasing.',
          amount: prospect.assessed_value ? Math.round(prospect.assessed_value * 0.012) : undefined,
        });
      }
    }

    // Lis pendens / foreclosure
    if (prospect.has_lis_pendens) {
      items.push({
        id: `${pid}-lis-1`,
        prospect_id: pid,
        signal_type: 'lis_pendens',
        severity: 'critical',
        detected_date: interpolate(prospect.has_tax_delinquency ? 0.35 : 0.1),
        description: 'Lis pendens filed — formal foreclosure proceedings initiated.',
      });
    }

    // Bankruptcy
    if (prospect.has_bankruptcy) {
      items.push({
        id: `${pid}-bk-1`,
        prospect_id: pid,
        signal_type: 'bankruptcy',
        severity: 'critical',
        detected_date: interpolate(prospect.has_lis_pendens ? 0.6 : 0.3),
        description: 'Bankruptcy filing detected — may need immediate counseling referral.',
      });
    }

    // Probate
    if (prospect.has_probate) {
      items.push({
        id: `${pid}-probate-1`,
        prospect_id: pid,
        signal_type: 'probate',
        severity: 'high',
        detected_date: interpolate(0.2),
        description: 'Probate filing detected — property may be in estate transition.',
      });
    }

    // Dissolved LLC
    if (prospect.has_dissolved_llc) {
      items.push({
        id: `${pid}-llc-1`,
        prospect_id: pid,
        signal_type: 'llc_dissolved',
        severity: 'high',
        detected_date: interpolate(0.15),
        description: 'Owning LLC dissolved or inactive — property ownership structure at risk.',
      });
    }

    // Long hold
    if (prospect.is_long_hold && prospect.years_held && prospect.years_held >= 10) {
      items.push({
        id: `${pid}-hold-1`,
        prospect_id: pid,
        signal_type: 'long_hold',
        severity: 'info',
        detected_date: first,
        description: `Property held for ${Math.round(prospect.years_held)} years — established homeowner with deep community ties.`,
      });
    }

    // High equity
    if (prospect.is_high_equity && prospect.estimated_equity && prospect.estimated_equity >= 50000) {
      items.push({
        id: `${pid}-equity-1`,
        prospect_id: pid,
        signal_type: 'high_equity',
        severity: 'info',
        detected_date: interpolate(0.05),
        description: `${formatCurrency(prospect.estimated_equity)} in home equity at stake — significant family wealth to protect.`,
      });
    }

    // Sort chronologically
    items.sort((a, b) => a.detected_date.localeCompare(b.detected_date));
    return items;
  }, [prospect]);

  // Load any previously saved lookup on mount
  useEffect(() => {
    const record = loadContactRecord(id);
    if (record) {
      setSavedRecord(record);
      setContactInfo({
        phones: record.phones,
        emails: record.emails,
        mailingAddress: record.mailingAddress,
      });
      setContactFetched(true);
    }
  }, [id]);

  // Compute re-lookup eligibility
  const canRequery = useMemo(() => {
    if (!savedRecord) return true; // never looked up
    if (savedRecord.found) return false; // has results — no need
    return daysSince(savedRecord.attemptedAt) >= REQUERY_COOLDOWN_DAYS;
  }, [savedRecord]);

  const daysUntilRequery = useMemo(() => {
    if (!savedRecord || savedRecord.found) return 0;
    return Math.max(0, REQUERY_COOLDOWN_DAYS - daysSince(savedRecord.attemptedAt));
  }, [savedRecord]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-beacon-primary" size={24} />
        <span className="ml-2 text-sm text-beacon-text-muted">Loading household...</span>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-20">
        <p className="text-beacon-text-muted">Household not found.</p>
        <Link href="/dashboard/prospects" className="text-sm text-beacon-primary mt-2 inline-block">
          Back to Households
        </Link>
      </div>
    );
  }

  const scoreColor = getScoreColor(prospect.compound_score);
  const scoreLabel = getScoreLabel(prospect.compound_score);

  function handleAddNote() {
    if (!noteText.trim()) return;
    setNotes((prev) => [
      { text: noteText, time: 'Just now' },
      ...prev,
    ]);
    setNoteText('');
  }

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
  }

  function finalizeLookup(phones: Array<{ number: string; type: string }>, emails: string[], mailingAddress: ContactRecord['mailingAddress']) {
    const found = phones.length > 0 || emails.length > 0 || !!mailingAddress;
    const record: ContactRecord = {
      attemptedAt: new Date().toISOString(),
      found,
      phones,
      emails,
      mailingAddress,
    };
    saveContactRecord(id, record);
    setSavedRecord(record);
    setContactInfo({ phones, emails, mailingAddress });
    setContactFetched(true);
    setContactLoading(false);
    setContactProgress(100);
    setContactStep(4);
  }

  async function fetchContact() {
    if (!prospect) return;
    setContactLoading(true);
    setContactError('');
    setContactStep(1);
    setContactProgress(10);

    try {
      setContactStep(2);
      setContactProgress(30);

      // Single synchronous call — instant trace endpoint, no polling needed
      const res = await fetch('/api/beacon/skip-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formattedName,
          address: prospect.address,
          city: prospect.city,
          state: prospect.state,
          zip: prospect.zip,
        }),
      });

      setContactStep(3);
      setContactProgress(70);

      const data = await res.json();

      if (!res.ok) {
        setContactError(data.error || `Lookup failed (${res.status})`);
        setContactLoading(false);
        setContactStep(0);
        return;
      }

      setContactStep(4);
      setContactProgress(100);

      // Map phones — instant API returns {number, type, dnc, carrier}
      const phones = (data.phones || []).map((p: { number: string; type: string; dnc?: boolean }) => ({
        number: p.number,
        type: p.type || 'Unknown',
      }));
      const emails = data.emails || [];
      const mailingAddress = data.mailingAddress || null;

      finalizeLookup(phones, emails, mailingAddress);
    } catch (err) {
      setContactError('Network error — could not reach skip trace service');
      setContactLoading(false);
      setContactStep(0);
    }
  }

  const formattedName = formatOwnerName(prospect.owner_name);
  const suggestedService = getSuggestedService(prospect);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/prospects"
        className="inline-flex items-center gap-1.5 text-sm text-beacon-text-muted hover:text-beacon-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Households
      </Link>

      {/* Header with score */}
      <div className="bg-beacon-surface rounded-xl border border-beacon-border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-beacon-text">
              {prospect.address}, {prospect.city} {prospect.state} {prospect.zip}
            </h1>
            <p className="text-sm text-beacon-text-secondary mt-1">{formattedName}</p>
            <p className="text-xs text-beacon-text-muted mt-0.5">
              {prospect.last_sale_date ? `Owned since ${prospect.last_sale_date.slice(0, 4)}` : 'Ownership date unknown'}{prospect.years_held ? ` (${Math.round(prospect.years_held)} years)` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Risk Level</p>
              <p
                className="text-2xl font-bold mt-0.5"
                style={{ color: scoreColor }}
              >
                {scoreLabel}
              </p>
              <div className="w-32 h-2 bg-beacon-surface-alt rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full score-bar-fill"
                  style={{
                    backgroundColor: scoreColor,
                    '--score-width': `${prospect.compound_score}%`,
                  } as React.CSSProperties}
                />
              </div>
              <p className="text-[10px] text-beacon-text-muted mt-1">
                {prospect.signal_count} distress indicator{prospect.signal_count !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg border border-beacon-border text-beacon-text-muted hover:bg-beacon-surface-alt transition-colors"
              title="Print"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Street View */}
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
        <StreetView
          address={prospect.address}
          city={prospect.city}
          state={prospect.state}
          zip={prospect.zip}
        />
      )}

      {/* Property details + Signal summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Property details */}
        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <Home size={15} className="text-beacon-primary" />
            Property Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Assessed Value</p>
              <p className="text-lg font-bold text-beacon-text mt-0.5">{formatCurrency(prospect.assessed_value)}</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Equity at Stake</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(prospect.estimated_equity)}</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Last Sale</p>
              <p className="text-sm font-medium text-beacon-text mt-0.5">{formatCurrency(prospect.last_sale_price)}</p>
              <p className="text-xs text-beacon-text-muted">{prospect.last_sale_date || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Years Held</p>
              <p className="text-sm font-medium text-beacon-text mt-0.5">{prospect.years_held ? `${Math.round(prospect.years_held)} years` : 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">County</p>
              <p className="text-sm font-medium text-beacon-text mt-0.5">{prospect.county || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Office</p>
              <p className="text-sm font-medium text-beacon-text mt-0.5">{prospect.office_city || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        {/* Signal summary */}
        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-beacon-accent" />
            Distress Indicators
          </h2>
          <div className="space-y-2.5 mb-4">
            {signals.map((s) => {
              const def = SIGNAL_COLORS[s as keyof typeof SIGNAL_COLORS];
              if (!def) return null;
              const typeEvents = events.filter((e) => e.signal_type === s);
              const severity = typeEvents.length > 0 ? typeEvents[typeEvents.length - 1].severity : 'info';
              const sevDef = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;
              return (
                <div
                  key={s}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-beacon-surface-alt/50"
                >
                  <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-bold', def.bg, def.text)}>
                    {def.label}
                  </span>
                  <span className="text-xs text-beacon-text-muted">—</span>
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', sevDef.bg, sevDef.text)}>
                    {severity}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-xs text-beacon-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              First detected: {prospect.first_signal_date || '—'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Most recent: {prospect.most_recent_signal_date || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline event list */}
      <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5 mb-6">
        <h2 className="text-sm font-semibold text-beacon-text mb-4">Hardship Timeline</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-beacon-border" />

          <div className="space-y-4">
            {events.map((event) => {
              const sevDef = SEVERITY_COLORS[event.severity] || SEVERITY_COLORS.info;
              return (
                <div key={event.id} className="flex items-start gap-4 pl-1">
                  <div className="relative z-10 w-7 h-7 rounded-full bg-beacon-surface border-2 border-beacon-border flex items-center justify-center text-sm flex-shrink-0">
                    {EVENT_ICONS[event.signal_type] || '📌'}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-beacon-text">{event.detected_date}</span>
                      <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded', sevDef.bg, sevDef.text)}>
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-sm text-beacon-text-secondary">{event.description}</p>
                    {event.amount && (
                      <p className="text-xs text-beacon-text-muted mt-0.5">
                        Amount: {formatCurrency(event.amount)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Household Intelligence Summary */}
      <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5 mb-6">
        <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
          <FileText size={15} className="text-beacon-primary" />
          Household Intelligence Summary
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Distress Signals */}
          <div>
            <p className="text-[10px] font-bold text-beacon-text-muted uppercase tracking-wider mb-2">Distress Signals</p>
            <div className="space-y-1.5">
              {events.map((event) => {
                const sevDef = SEVERITY_COLORS[event.severity] || SEVERITY_COLORS.info;
                const signalLabel = SIGNAL_COLORS[event.signal_type as keyof typeof SIGNAL_COLORS]?.label || event.signal_type;
                return (
                  <div key={event.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded', sevDef.bg, sevDef.text)}>
                        {event.severity}
                      </span>
                      <span className="text-beacon-text">{signalLabel}</span>
                    </div>
                    <span className="text-beacon-text-muted text-[11px] tabular-nums">{event.detected_date}</span>
                  </div>
                );
              })}
              {events.length === 0 && (
                <p className="text-xs text-beacon-text-muted">No signals detected.</p>
              )}
            </div>
          </div>

          {/* Equity Position */}
          <div>
            <p className="text-[10px] font-bold text-beacon-text-muted uppercase tracking-wider mb-2">Equity Position</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-beacon-text-muted">Assessed Value</p>
                <p className="text-sm font-semibold text-beacon-text">{formatCurrency(prospect.assessed_value)}</p>
              </div>
              <div>
                <p className="text-xs text-beacon-text-muted">Estimated Equity</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(prospect.estimated_equity)}</p>
              </div>
              {prospect.last_sale_price > 0 && (
                <div>
                  <p className="text-xs text-beacon-text-muted">Last Sale</p>
                  <p className="text-sm font-medium text-beacon-text">{formatCurrency(prospect.last_sale_price)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Hardship Timeline + Service */}
          <div>
            <p className="text-[10px] font-bold text-beacon-text-muted uppercase tracking-wider mb-2">Hardship Timeline</p>
            <div className="space-y-1">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-xs">
                  <span className="text-beacon-text-muted tabular-nums text-[11px]">{event.detected_date}</span>
                  <span className="text-beacon-text">{EVENT_ICONS[event.signal_type] || '📌'} {SIGNAL_COLORS[event.signal_type as keyof typeof SIGNAL_COLORS]?.label || event.signal_type}</span>
                </div>
              ))}
              {prospect.distress_months && prospect.distress_months > 0 && (
                <p className="text-[10px] text-beacon-text-muted mt-1">{prospect.distress_months} months in distress</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-beacon-border">
              <p className="text-[10px] font-bold text-beacon-text-muted uppercase tracking-wider mb-1">Service Category</p>
              <p className="text-sm font-semibold text-beacon-primary-dark">{suggestedService}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information — Tracerfy skip trace */}
      <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-beacon-text flex items-center gap-2">
            <Phone size={15} className="text-beacon-primary" />
            Contact Information
          </h2>
          <div className="flex items-center gap-2">
            {/* First lookup button — never looked up before */}
            {!contactFetched && !contactLoading && (
              <button
                onClick={fetchContact}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--beacon-primary)' }}
              >
                <Search size={13} />
                Look Up Contact
              </button>
            )}
            {/* Re-lookup button — previous lookup had no results and cooldown has passed */}
            {contactFetched && !contactLoading && savedRecord && !savedRecord.found && canRequery && (
              <button
                onClick={fetchContact}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--beacon-primary)' }}
              >
                <RefreshCw size={12} />
                Search Again
              </button>
            )}
          </div>
        </div>

        {/* ── Idle state (never looked up) ── */}
        {!contactFetched && !contactLoading && (
          <p className="text-xs text-beacon-text-muted">
            Contact lookup available
          </p>
        )}

        {/* ── Loading state — step-by-step progress ── */}
        {contactLoading && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-beacon-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${contactProgress}%`,
                  backgroundColor: 'var(--beacon-primary)',
                }}
              />
            </div>

            {/* Step indicators */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                {contactStep > 1 ? (
                  <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                ) : contactStep === 1 ? (
                  <Loader2 size={15} className="text-blue-500 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-[15px] h-[15px] rounded-full border-2 border-beacon-border flex-shrink-0" />
                )}
                <span className={cn('text-xs', contactStep >= 1 ? 'text-beacon-text' : 'text-beacon-text-muted')}>
                  Connecting to skip trace service
                </span>
              </div>

              <div className="flex items-center gap-3">
                {contactStep > 2 ? (
                  <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                ) : contactStep === 2 ? (
                  <Loader2 size={15} className="text-blue-500 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-[15px] h-[15px] rounded-full border-2 border-beacon-border flex-shrink-0" />
                )}
                <span className={cn('text-xs', contactStep >= 2 ? 'text-beacon-text' : 'text-beacon-text-muted')}>
                  Searching for {formattedName} at {prospect.address}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {contactStep > 3 ? (
                  <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                ) : contactStep === 3 ? (
                  <Loader2 size={15} className="text-blue-500 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-[15px] h-[15px] rounded-full border-2 border-beacon-border flex-shrink-0" />
                )}
                <span className={cn('text-xs', contactStep >= 3 ? 'text-beacon-text' : 'text-beacon-text-muted')}>
                  Cross-referencing public records
                </span>
              </div>

              <div className="flex items-center gap-3">
                {contactStep >= 4 ? (
                  <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="w-[15px] h-[15px] rounded-full border-2 border-beacon-border flex-shrink-0" />
                )}
                <span className={cn('text-xs', contactStep >= 4 ? 'text-beacon-text' : 'text-beacon-text-muted')}>
                  Processing results
                </span>
              </div>
            </div>

            <p className="text-[10px] text-beacon-text-muted leading-relaxed mt-2">
              Searching phone, email, and mailing records. This usually takes a few seconds.
            </p>
          </div>
        )}

        {/* ── Error state ── */}
        {!contactLoading && contactError && (
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
            <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-700">{contactError}</p>
              <p className="text-[10px] text-red-500 mt-1">This may be a temporary issue. Try again in a few minutes.</p>
            </div>
          </div>
        )}

        {/* ── Results state ── */}
        {contactFetched && !contactLoading && contactInfo && (() => {
          const hasPhones = contactInfo.phones && contactInfo.phones.length > 0;
          const hasEmails = contactInfo.emails && contactInfo.emails.length > 0;
          const hasMailingAddr = !!contactInfo.mailingAddress;
          const hasAnyContact = hasPhones || hasEmails || hasMailingAddr;

          return (
            <div className="space-y-4">
              {/* ── Found contact info ── */}
              {hasAnyContact && (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50">
                    <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-emerald-700">
                        Contact information found
                      </p>
                      <p className="text-[10px] mt-0.5 text-emerald-600">
                        Found {contactInfo.phones.length} phone{contactInfo.phones.length !== 1 ? 's' : ''}, {contactInfo.emails.length} email{contactInfo.emails.length !== 1 ? 's' : ''}{hasMailingAddr ? ', 1 mailing address' : ''}
                      </p>
                      {savedRecord && (
                        <p className="text-[10px] mt-1 text-emerald-500 flex items-center gap-1">
                          <CalendarClock size={10} />
                          Looked up {formatLookupDate(savedRecord.attemptedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {hasPhones && contactInfo.phones.map((phone, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Phone size={14} className="text-beacon-text-muted flex-shrink-0" />
                        <a
                          href={`tel:${phone.number}`}
                          className="text-sm text-beacon-primary hover:underline"
                        >
                          {phone.number}
                        </a>
                        <span className="text-[10px] text-beacon-text-muted uppercase tracking-wider">
                          {phone.type}
                        </span>
                      </div>
                    ))}
                    {hasEmails && contactInfo.emails.map((email, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Mail size={14} className="text-beacon-text-muted flex-shrink-0" />
                        <a
                          href={`mailto:${email}`}
                          className="text-sm text-beacon-primary hover:underline"
                        >
                          {email}
                        </a>
                      </div>
                    ))}
                    {hasMailingAddr && contactInfo.mailingAddress && (
                      <div className="flex items-center gap-3">
                        <MapPin size={14} className="text-beacon-text-muted flex-shrink-0" />
                        <span className="text-sm text-beacon-text-secondary">
                          {contactInfo.mailingAddress.street}, {contactInfo.mailingAddress.city}{' '}
                          {contactInfo.mailingAddress.state} {contactInfo.mailingAddress.zip}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── No results found ── */}
              {!hasAnyContact && (
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <ShieldCheck size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-600">
                      Search completed — no contact records available
                    </p>
                    {savedRecord && (
                      <p className="text-[10px] mt-1 text-slate-500 flex items-center gap-1">
                        <CalendarClock size={10} />
                        Searched {formatLookupDate(savedRecord.attemptedAt)}
                      </p>
                    )}
                    <p className="text-[10px] mt-1.5 text-slate-400 leading-relaxed">
                      No phone, email, or mailing records were found for &ldquo;{formattedName}&rdquo; at {prospect.address}, {prospect.city} {prospect.state}.
                      This is common for individuals with unlisted numbers, newer addresses, or properties held under entity names.
                    </p>

                    {/* Cooldown info */}
                    {savedRecord && !canRequery && daysUntilRequery > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <RefreshCw size={10} className="text-slate-400" />
                        <p className="text-[10px] text-slate-400">
                          Eligible for re-lookup in {daysUntilRequery} day{daysUntilRequery !== 1 ? 's' : ''}.
                          Records are updated monthly — re-searching too soon uses a credit with no new data.
                        </p>
                      </div>
                    )}
                    {savedRecord && canRequery && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <RefreshCw size={10} className="text-blue-500" />
                        <p className="text-[10px] text-blue-600">
                          Eligible for re-lookup — click &ldquo;Search Again&rdquo; above to check for new records.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* What was searched — always shown for transparency */}
              <div className="flex items-start gap-2 pt-2 border-t border-beacon-border">
                <Database size={12} className="text-beacon-text-muted flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-beacon-text-muted leading-relaxed">
                  Searched public phone, email, and mailing records for <span className="font-medium">{formattedName}</span> associated
                  with <span className="font-medium">{prospect.address}, {prospect.city} {prospect.state} {prospect.zip}</span>.
                </p>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Counselor notes + status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes */}
        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <FileText size={15} className="text-beacon-text-secondary" />
            Counselor Notes
          </h2>
          <div className="mb-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this household..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-beacon-border bg-beacon-bg text-sm text-beacon-text placeholder:text-beacon-text-muted focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40 transition-colors"
              style={{ backgroundColor: 'var(--beacon-primary)' }}
            >
              <Plus size={14} />
              Add Note
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-xs text-beacon-text-muted italic">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n, i) => (
                <div key={i} className="p-3 rounded-lg bg-beacon-surface-alt">
                  <p className="text-sm text-beacon-text">{n.text}</p>
                  <p className="text-[10px] text-beacon-text-muted mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status and assignment */}
        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <User size={15} className="text-beacon-text-secondary" />
            Status &amp; Assignment
          </h2>

          <div className="mb-4">
            <label className="block text-xs font-medium text-beacon-text-muted uppercase tracking-wider mb-1.5">
              Current Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full text-sm border border-beacon-border rounded-lg px-3 py-2.5 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
            >
              {STATUS_FLOW.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-beacon-text-muted uppercase tracking-wider mb-1.5">
              Assigned Counselor
            </label>
            <select
              className="w-full text-sm border border-beacon-border rounded-lg px-3 py-2.5 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
            >
              <option value="">Unassigned</option>
              <option value="counselor-1">Sarah Martinez — {prospect.office_city}</option>
              <option value="counselor-2">David Kim — {prospect.office_city}</option>
              <option value="counselor-3">Rachel Thompson — {prospect.office_city}</option>
            </select>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            {status === 'new' && (
              <button
                onClick={() => handleStatusChange('reviewed')}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#CA8A04' }}
              >
                Flag for Counseling
              </button>
            )}
            {status === 'reviewed' && (
              <button
                onClick={() => handleStatusChange('contacted')}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#D97706' }}
              >
                Record Outreach
              </button>
            )}
            {status === 'contacted' && (
              <button
                onClick={() => handleStatusChange('in_counseling')}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#7C3AED' }}
              >
                Start Counseling
              </button>
            )}
            {status === 'in_counseling' && (
              <button
                onClick={() => handleStatusChange('enrolled')}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#16A34A' }}
              >
                Enroll in DMP
              </button>
            )}
          </div>

          {/* Activity log */}
          <div className="mt-6">
            <h3 className="text-xs font-medium text-beacon-text-muted uppercase tracking-wider mb-2">Activity Log</h3>
            {status !== prospect.status ? (
              <div className="p-2.5 rounded-lg bg-beacon-surface-alt text-xs text-beacon-text-secondary">
                Status changed from <span className="font-medium">{prospect.status}</span> to{' '}
                <span className="font-medium">{status}</span> — Just now
              </div>
            ) : (
              <p className="text-xs text-beacon-text-muted italic">No activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
