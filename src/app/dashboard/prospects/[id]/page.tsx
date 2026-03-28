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
import { getSignalsForProspect, getSuggestedService, hasHardDistress } from '@/lib/prospect-helpers';
import type { Prospect } from '@/lib/prospect-helpers';
import { cn, formatCurrency, getScoreColor, getScoreLabel, formatOwnerName } from '@/lib/utils';
import { StreetView } from '@/components/StreetView';

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
  const [apiEvents, setApiEvents] = useState<SignalEvent[]>([]);

  useEffect(() => {
    async function loadProspect() {
      try {
        const res = await fetch(`/api/beacon/prospects/${id}`);
        const data = await res.json();
        if (data.prospect) {
          setProspect(data.prospect);
          setStatus(data.prospect.status || 'new');
        }
        // Fix 1: Use real signal events from the API when available
        if (data.events && data.events.length > 0) {
          setApiEvents(data.events);
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

  // Fix 1: Use real API events when available, fall back to interpolated events
  const events: SignalEvent[] = useMemo(() => {
    if (!prospect) return [];
    // If we have real events from the enriched Atlas API, use them
    if (apiEvents.length > 0) return apiEvents;
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
  }, [prospect, apiEvents]);

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

  const distress = hasHardDistress(prospect);
  const scoreColor = getScoreColor(prospect.compound_score, distress);
  const scoreLabel = getScoreLabel(prospect.compound_score, distress);

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
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">
                {prospect.last_sale_price != null && prospect.last_sale_price <= 1 ? 'Estimated Equity' : 'Equity at Stake'}
              </p>
              {prospect.last_sale_price != null && prospect.last_sale_price <= 1 ? (
                <>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(prospect.assessed_value)}</p>
                  <p className="text-[10px] text-beacon-text-muted">Based on assessed value</p>
                </>
              ) : (
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(prospect.estimated_equity)}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Last Sale</p>
              {prospect.last_sale_price != null && prospect.last_sale_price <= 1 ? (
                <p className="text-sm font-medium text-beacon-text-muted mt-0.5">Transfer (non-market)</p>
              ) : (
                <p className="text-sm font-medium text-beacon-text mt-0.5">{formatCurrency(prospect.last_sale_price)}</p>
              )}
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
              First detected: {events.length > 0 ? events[0].detected_date : prospect.first_signal_date || '—'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Most recent: {events.length > 0 ? events[events.length - 1].detected_date : prospect.most_recent_signal_date || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Unified Intelligence Panel ── */}
      <div className="bg-beacon-surface rounded-xl border border-beacon-border p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Left — Hardship Timeline */}
          <div className="lg:border-r lg:border-beacon-border lg:pr-6 pb-6 lg:pb-0">
            <p className="text-[10px] font-bold text-beacon-text-muted uppercase tracking-wider mb-4">Hardship Timeline</p>
            <div className="relative">
              {/* Vertical timeline line */}
              {events.length > 1 && (
                <div className="absolute left-[5px] top-[10px] bottom-[10px] w-px bg-beacon-border" />
              )}
              <div className="space-y-5">
                {events.map((event, idx) => {
                  const sevDef = SEVERITY_COLORS[event.severity] || SEVERITY_COLORS.info;
                  const signalLabel = SIGNAL_COLORS[event.signal_type as keyof typeof SIGNAL_COLORS]?.label || event.signal_type;
                  return (
                    <div key={event.id} className="flex gap-4">
                      {/* Timeline dot */}
                      <div className="relative z-10 flex-shrink-0 mt-1">
                        <div className={cn(
                          'w-[11px] h-[11px] rounded-full border-2',
                          event.severity === 'critical' ? 'border-red-500 bg-red-100 dark:bg-red-900/40' :
                          event.severity === 'high' ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/40' :
                          event.severity === 'warning' ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/40' :
                          'border-blue-400 bg-blue-100 dark:bg-blue-900/40'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-beacon-text tabular-nums">{event.detected_date}</span>
                          <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded', sevDef.bg, sevDef.text)}>
                            {event.severity}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-beacon-text leading-snug">{signalLabel}</p>
                        <p className="text-xs text-beacon-text-secondary mt-0.5 leading-relaxed">{event.description}</p>
                        {event.amount && (
                          <p className="text-[11px] text-beacon-text-muted mt-1">
                            Amount: {formatCurrency(event.amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <p className="text-xs text-beacon-text-muted">No signals detected.</p>
                )}
              </div>
            </div>
            {prospect.distress_months && prospect.distress_months > 0 && (
              <p className="text-[11px] text-beacon-text-muted mt-4 pt-3 border-t border-beacon-border">
                {prospect.distress_months} months in distress
              </p>
            )}
          </div>

          {/* Middle — Equity Position */}
          <div className="lg:border-r lg:border-beacon-border lg:px-6 border-t lg:border-t-0 border-beacon-border pt-6 lg:pt-0 pb-6 lg:pb-0">
            <p className="text-[10px] font-bold text-beacon-text-muted uppercase tracking-wider mb-4">Equity Position</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-beacon-text-muted">Assessed Value</p>
                <p className="text-lg font-bold text-beacon-text mt-0.5">{formatCurrency(prospect.assessed_value)}</p>
              </div>
              <div>
                <p className="text-xs text-beacon-text-muted">Estimated Equity</p>
                {prospect.last_sale_price != null && prospect.last_sale_price <= 1 ? (
                  <>
                    <p className="text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(prospect.assessed_value)}
                    </p>
                    <p className="text-[10px] text-beacon-text-muted">Based on assessed value</p>
                  </>
                ) : (
                  <p className={cn('text-lg font-bold mt-0.5', prospect.estimated_equity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-beacon-text-muted')}>
                    {prospect.estimated_equity > 0 ? formatCurrency(prospect.estimated_equity) : 'Unavailable'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-beacon-text-muted">Last Sale Price</p>
                {prospect.last_sale_price != null && prospect.last_sale_price <= 1 ? (
                  <p className="text-sm font-semibold text-beacon-text-muted mt-0.5">Transfer (non-market)</p>
                ) : prospect.last_sale_price > 0 ? (
                  <p className="text-sm font-semibold text-beacon-text mt-0.5">{formatCurrency(prospect.last_sale_price)}</p>
                ) : (
                  <p className="text-sm font-semibold text-beacon-text-muted mt-0.5">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-beacon-text-muted">Years in Property</p>
                <p className="text-sm font-semibold text-beacon-text mt-0.5">{prospect.years_held ? `${Math.round(prospect.years_held)} years` : 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-beacon-text-muted">County</p>
                <p className="text-sm font-semibold text-beacon-text mt-0.5">{prospect.county || '—'}</p>
              </div>
            </div>
          </div>

          {/* Right — Action Intelligence */}
          <div className="lg:pl-6 border-t lg:border-t-0 border-beacon-border pt-6 lg:pt-0">
            <p className="text-[10px] font-bold text-beacon-text-muted uppercase tracking-wider mb-4">Action Intelligence</p>

            {/* Service Category */}
            <div className="mb-5">
              <p className="text-xs text-beacon-text-muted mb-1">Service Category</p>
              <p className="text-base font-bold text-beacon-text">{suggestedService}</p>
            </div>

            {/* Contact Information */}
            <div className="pt-4 border-t border-beacon-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-beacon-text-muted">Contact Information</p>
                {!contactFetched && !contactLoading && (
                  <button
                    onClick={fetchContact}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ backgroundColor: 'var(--beacon-primary)' }}
                  >
                    <Search size={12} />
                    Look Up Contact
                  </button>
                )}
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

              {/* Idle */}
              {!contactFetched && !contactLoading && (
                <p className="text-xs text-beacon-text-muted">Contact lookup available</p>
              )}

              {/* Loading */}
              {contactLoading && (
                <div className="space-y-3">
                  <div className="w-full h-1.5 bg-beacon-surface-alt rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${contactProgress}%`, backgroundColor: 'var(--beacon-primary)' }}
                    />
                  </div>
                  <div className="space-y-2">
                    {[
                      { step: 1, label: 'Connecting to skip trace service' },
                      { step: 2, label: `Searching for ${formattedName}` },
                      { step: 3, label: 'Cross-referencing records' },
                      { step: 4, label: 'Processing results' },
                    ].map(({ step, label }) => (
                      <div key={step} className="flex items-center gap-2">
                        {contactStep > step ? (
                          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                        ) : contactStep === step ? (
                          <Loader2 size={13} className="text-blue-500 animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-[13px] h-[13px] rounded-full border-2 border-beacon-border flex-shrink-0" />
                        )}
                        <span className={cn('text-[11px]', contactStep >= step ? 'text-beacon-text' : 'text-beacon-text-muted')}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {!contactLoading && contactError && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
                  <XCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-red-700">{contactError}</p>
                    <p className="text-[10px] text-red-500 mt-0.5">Try again in a few minutes.</p>
                  </div>
                </div>
              )}

              {/* Results */}
              {contactFetched && !contactLoading && contactInfo && (() => {
                const hasPhones = contactInfo.phones && contactInfo.phones.length > 0;
                const hasEmails = contactInfo.emails && contactInfo.emails.length > 0;
                const hasMailingAddr = !!contactInfo.mailingAddress;
                const hasAnyContact = hasPhones || hasEmails || hasMailingAddr;

                return (
                  <div className="space-y-2.5">
                    {hasAnyContact && (
                      <>
                        {hasPhones && contactInfo.phones.map((phone, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Phone size={13} className="text-beacon-text-muted flex-shrink-0" />
                            <a href={`tel:${phone.number}`} className="text-xs text-beacon-primary hover:underline">{phone.number}</a>
                            <span className="text-[10px] text-beacon-text-muted uppercase">{phone.type}</span>
                          </div>
                        ))}
                        {hasEmails && contactInfo.emails.map((email, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Mail size={13} className="text-beacon-text-muted flex-shrink-0" />
                            <a href={`mailto:${email}`} className="text-xs text-beacon-primary hover:underline">{email}</a>
                          </div>
                        ))}
                        {hasMailingAddr && contactInfo.mailingAddress && (
                          <div className="flex items-center gap-2">
                            <MapPin size={13} className="text-beacon-text-muted flex-shrink-0" />
                            <span className="text-xs text-beacon-text-secondary">
                              {contactInfo.mailingAddress.street}, {contactInfo.mailingAddress.city}{' '}
                              {contactInfo.mailingAddress.state} {contactInfo.mailingAddress.zip}
                            </span>
                          </div>
                        )}
                        {savedRecord && (
                          <p className="text-[10px] text-beacon-text-muted flex items-center gap-1 mt-1">
                            <CalendarClock size={10} />
                            Looked up {formatLookupDate(savedRecord.attemptedAt)}
                          </p>
                        )}
                      </>
                    )}
                    {!hasAnyContact && (
                      <div>
                        <p className="text-xs text-beacon-text-muted">No contact records found.</p>
                        {savedRecord && (
                          <p className="text-[10px] text-beacon-text-muted flex items-center gap-1 mt-1">
                            <CalendarClock size={10} />
                            Searched {formatLookupDate(savedRecord.attemptedAt)}
                          </p>
                        )}
                        {savedRecord && !canRequery && daysUntilRequery > 0 && (
                          <p className="text-[10px] text-beacon-text-muted mt-1">
                            Re-lookup eligible in {daysUntilRequery} day{daysUntilRequery !== 1 ? 's' : ''}.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
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
