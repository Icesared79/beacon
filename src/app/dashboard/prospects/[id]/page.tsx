'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
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
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SIGNAL_COLORS, STATUS_FLOW } from '@/lib/design-tokens';
import {
  DEMO_PROSPECTS,
  getSignalsForProspect,
  getDemoSignalEvents,
} from '@/lib/prospect-data';
import { cn, formatCurrency, getScoreColor, getScoreLabel } from '@/lib/utils';

const EVENT_ICONS: Record<string, string> = {
  tax_delinquency: '💰',
  lis_pendens: '⚖️',
  llc_dissolved: '🏢',
  long_hold: '📅',
  high_equity: '📈',
  bankruptcy: '📋',
  probate: '📜',
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-700' },
  high: { bg: 'bg-amber-100', text: 'text-amber-700' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  info: { bg: 'bg-blue-100', text: 'text-blue-600' },
};

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const prospect = DEMO_PROSPECTS.find((p) => p.id === id);
  const [status, setStatus] = useState(prospect?.status || 'new');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<Array<{ text: string; time: string }>>([]);
  const [contactInfo, setContactInfo] = useState<{
    phones: Array<{ number: string; type: string }>;
    emails: string[];
    mailingAddress: { street: string; city: string; state: string; zip: string } | null;
  } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactFetched, setContactFetched] = useState(false);

  const signals = prospect ? getSignalsForProspect(prospect) : [];
  const events = useMemo(() => getDemoSignalEvents(id), [id]);

  if (!prospect) {
    return (
      <div className="text-center py-20">
        <p className="text-beacon-text-muted">Prospect not found.</p>
        <Link href="/dashboard/prospects" className="text-sm text-beacon-primary mt-2 inline-block">
          Back to Prospects
        </Link>
      </div>
    );
  }

  const scoreColor = getScoreColor(prospect.compound_score);
  const scoreLabel = getScoreLabel(prospect.compound_score);

  // Build timeline chart data — group events by signal type with date ranges
  const signalTypes = [...new Set(events.map((e) => e.signal_type))];
  const timelineData = signalTypes.map((type) => {
    const typeEvents = events.filter((e) => e.signal_type === type);
    const def = SIGNAL_COLORS[type as keyof typeof SIGNAL_COLORS];
    return {
      name: def?.label || type,
      events: typeEvents.length,
      type,
    };
  });

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

  async function fetchContact() {
    if (!prospect) return;
    setContactLoading(true);
    try {
      const res = await fetch('/api/beacon/skip-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prospect.owner_name,
          address: prospect.address,
          city: prospect.city,
          state: prospect.state,
          zip: prospect.zip,
        }),
      });
      const data = await res.json();
      setContactInfo(data);
      setContactFetched(true);
    } catch {
      setContactFetched(true);
    }
    setContactLoading(false);
  }

  // Build "why this matters" explanation
  const equity = prospect.estimated_equity;
  const signalCount = prospect.signal_count;
  let explanation = '';
  if (prospect.compound_score >= 80) {
    explanation = `This homeowner is showing ${signalCount} simultaneous distress signals. They have significant equity in their home (${formatCurrency(equity)}) but are unable to meet their financial obligations. They are a strong candidate for ACCC's debt management program — early intervention could help them avoid foreclosure and protect their equity.`;
  } else if (prospect.is_long_hold && prospect.is_high_equity) {
    explanation = `This homeowner purchased their property ${prospect.years_held} years ago for ${formatCurrency(prospect.last_sale_price)}. The property is now worth approximately ${formatCurrency(prospect.assessed_value)}, representing ${formatCurrency(equity)} in equity. They have significant assets to protect and strong motivation to find a debt solution.`;
  } else {
    explanation = `This homeowner is showing early signs of financial distress with ${signalCount} signal(s) detected. With ${formatCurrency(equity)} in estimated equity, early outreach from ACCC could help them stabilize before the situation escalates.`;
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/prospects"
        className="inline-flex items-center gap-1.5 text-sm text-beacon-text-muted hover:text-beacon-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Prospects
      </Link>

      {/* Header with score */}
      <div className="bg-white rounded-xl border border-beacon-border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-beacon-text">
              {prospect.address}, {prospect.city} {prospect.state} {prospect.zip}
            </h1>
            <p className="text-sm text-beacon-text-secondary mt-1">{prospect.owner_name}</p>
            <p className="text-xs text-beacon-text-muted mt-0.5">
              Owned since {prospect.last_sale_date.slice(0, 4)} ({prospect.years_held} years)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: scoreColor }}>
                {prospect.compound_score}
                <span className="text-base font-normal text-beacon-text-muted">/100</span>
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
              <p
                className="text-xs font-bold uppercase tracking-wider mt-1"
                style={{ color: scoreColor }}
              >
                {scoreLabel}
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

      {/* Property details + Signal summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Property details */}
        <div className="bg-white rounded-xl border border-beacon-border p-5">
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
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Est. Equity</p>
              <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(prospect.estimated_equity)}</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Last Sale</p>
              <p className="text-sm font-medium text-beacon-text mt-0.5">{formatCurrency(prospect.last_sale_price)}</p>
              <p className="text-xs text-beacon-text-muted">{prospect.last_sale_date}</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Years Held</p>
              <p className="text-sm font-medium text-beacon-text mt-0.5">{prospect.years_held} years</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">County</p>
              <p className="text-sm font-medium text-beacon-text mt-0.5">{prospect.county}</p>
            </div>
            <div>
              <p className="text-xs text-beacon-text-muted uppercase tracking-wider">Office</p>
              <p className="text-sm font-medium text-beacon-text mt-0.5">{prospect.office_city || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        {/* Signal summary */}
        <div className="bg-white rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-beacon-accent" />
            Signal Summary
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
              First detected: {prospect.first_signal_date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Most recent: {prospect.most_recent_signal_date}
            </span>
          </div>
        </div>
      </div>

      {/* Signal timeline chart */}
      <div className="bg-white rounded-xl border border-beacon-border p-5 mb-6">
        <h2 className="text-sm font-semibold text-beacon-text mb-4">Signal Timeline</h2>
        <ResponsiveContainer width="100%" height={Math.max(120, timelineData.length * 40)}>
          <BarChart data={timelineData} layout="vertical" barCategoryGap="20%">
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: '#475569' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value} event(s)`, 'Detections']}
              contentStyle={{
                background: '#0F172A',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="events" radius={[0, 4, 4, 0]}>
              {timelineData.map((entry) => {
                const def = SIGNAL_COLORS[entry.type as keyof typeof SIGNAL_COLORS];
                const colors: Record<string, string> = {
                  lis_pendens: '#DC2626',
                  tax_delinquency: '#D97706',
                  llc_dissolved: '#EA580C',
                  bankruptcy: '#DC2626',
                  probate: '#7C3AED',
                  long_hold: '#2563EB',
                  high_equity: '#16A34A',
                };
                return <Cell key={entry.type} fill={colors[entry.type] || '#94A3B8'} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline event list */}
      <div className="bg-white rounded-xl border border-beacon-border p-5 mb-6">
        <h2 className="text-sm font-semibold text-beacon-text mb-4">Event History</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-beacon-border" />

          <div className="space-y-4">
            {events.map((event) => {
              const sevDef = SEVERITY_COLORS[event.severity] || SEVERITY_COLORS.info;
              return (
                <div key={event.id} className="flex items-start gap-4 pl-1">
                  <div className="relative z-10 w-7 h-7 rounded-full bg-white border-2 border-beacon-border flex items-center justify-center text-sm flex-shrink-0">
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

      {/* Why this matters */}
      <div className="bg-beacon-primary-muted/50 rounded-xl border border-beacon-primary/10 p-5 mb-6">
        <h2 className="text-sm font-semibold text-beacon-primary-dark mb-2 flex items-center gap-2">
          <FileText size={15} />
          Why This Matters
        </h2>
        <p className="text-sm text-beacon-text-secondary leading-relaxed">{explanation}</p>
      </div>

      {/* Contact Information — Tracerfy skip trace */}
      <div className="bg-white rounded-xl border border-beacon-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-beacon-text flex items-center gap-2">
            <Phone size={15} className="text-beacon-primary" />
            Contact Information
          </h2>
          {!contactFetched && (
            <button
              onClick={fetchContact}
              disabled={contactLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-60 transition-colors"
              style={{ backgroundColor: '#1B5EA8' }}
            >
              {contactLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Phone size={13} />
                  Look Up Contact
                </>
              )}
            </button>
          )}
        </div>

        {!contactFetched && !contactLoading && (
          <p className="text-xs text-beacon-text-muted">
            Click &ldquo;Look Up Contact&rdquo; to retrieve phone and email for this prospect via skip trace.
          </p>
        )}

        {contactLoading && (
          <div className="flex items-center gap-2 text-xs text-beacon-text-muted">
            <Loader2 size={14} className="animate-spin" />
            Searching records for {prospect.owner_name}...
          </div>
        )}

        {contactFetched && contactInfo && (
          <div className="space-y-2.5">
            {contactInfo.phones && contactInfo.phones.length > 0 ? (
              contactInfo.phones.map((phone, i) => (
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
              ))
            ) : (
              <p className="text-xs text-beacon-text-muted flex items-center gap-2">
                <Phone size={13} className="text-beacon-text-muted" />
                No phone numbers found
              </p>
            )}
            {contactInfo.emails && contactInfo.emails.length > 0 ? (
              contactInfo.emails.map((email, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Mail size={14} className="text-beacon-text-muted flex-shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-beacon-primary hover:underline"
                  >
                    {email}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-beacon-text-muted flex items-center gap-2">
                <Mail size={13} className="text-beacon-text-muted" />
                No email addresses found
              </p>
            )}
            {contactInfo.mailingAddress && (
              <div className="flex items-center gap-3">
                <MapPin size={14} className="text-beacon-text-muted flex-shrink-0" />
                <span className="text-sm text-beacon-text-secondary">
                  {contactInfo.mailingAddress.street}, {contactInfo.mailingAddress.city}{' '}
                  {contactInfo.mailingAddress.state} {contactInfo.mailingAddress.zip}
                </span>
              </div>
            )}
          </div>
        )}

        {contactFetched && !contactInfo && (
          <p className="text-xs text-beacon-text-muted">No contact information found for this prospect.</p>
        )}
      </div>

      {/* Counselor notes + status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes */}
        <div className="bg-white rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <FileText size={15} className="text-beacon-text-secondary" />
            Counselor Notes
          </h2>
          <div className="mb-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this prospect..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-beacon-border bg-beacon-bg text-sm text-beacon-text placeholder:text-beacon-text-muted focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#1B5EA8' }}
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
        <div className="bg-white rounded-xl border border-beacon-border p-5">
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
                Mark as Reviewed
              </button>
            )}
            {status === 'reviewed' && (
              <button
                onClick={() => handleStatusChange('contacted')}
                className="flex-1 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#D97706' }}
              >
                Mark as Contacted
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
