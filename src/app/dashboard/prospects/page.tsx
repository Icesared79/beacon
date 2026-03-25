'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Download, ChevronLeft, ChevronRight, ArrowRight, X, Search } from 'lucide-react';
import { SIGNAL_COLORS } from '@/lib/design-tokens';
import { DEMO_PROSPECTS, getSignalsForProspect, getSuggestedService, getInterventionStage } from '@/lib/prospect-data';
import type { InterventionStage } from '@/lib/prospect-data';
import { cn, formatCurrency, formatNumber, getScoreColor, getScoreLabel } from '@/lib/utils';

const PAGE_SIZE = 25;

const STAGE_STYLES: Record<InterventionStage, { color: string; label: string }> = {
  Late: { color: '#DC2626', label: 'Act now' },
  Mid: { color: '#D97706', label: 'Window narrowing' },
  Early: { color: '#2563EB', label: 'Time to help' },
};

interface QuickFilter {
  id: string;
  label: string;
  description: string;
  apply: (p: typeof DEMO_PROSPECTS[number]) => boolean;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'urgent',
    label: 'Urgent',
    description: 'Families who need immediate help',
    apply: (p) => p.compound_score >= 80,
  },
  {
    id: 'foreclosure',
    label: 'Facing Foreclosure',
    description: 'Active foreclosure proceedings',
    apply: (p) => p.has_lis_pendens,
  },
  {
    id: 'high_equity',
    label: 'Most Equity at Risk',
    description: 'Over $200K at stake',
    apply: (p) => p.estimated_equity >= 200000,
  },
  {
    id: 'bankruptcy',
    label: 'Bankruptcy Filed',
    description: 'May need bankruptcy counseling',
    apply: (p) => p.has_bankruptcy,
  },
  {
    id: 'early',
    label: 'Early Stage',
    description: 'Best chance for DMP success',
    apply: (p) => p.compound_score < 65,
  },
];

export default function ProspectsPage() {
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [officeFilter, setOfficeFilter] = useState('');
  const [signalFilter, setSignalFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [page, setPage] = useState(0);

  const offices = useMemo(
    () => [...new Set(DEMO_PROSPECTS.map((p) => p.office_city).filter(Boolean))].sort(),
    []
  );

  const filtered = useMemo(() => {
    let data = DEMO_PROSPECTS;

    // Quick filter
    if (activeQuickFilter) {
      const qf = QUICK_FILTERS.find((f) => f.id === activeQuickFilter);
      if (qf) data = data.filter(qf.apply);
    }

    // Name/address lookup
    if (nameSearch) {
      const q = nameSearch.toLowerCase();
      data = data.filter((p) =>
        p.owner_name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.zip.includes(q)
      );
    }

    if (officeFilter) data = data.filter((p) => p.office_city === officeFilter);
    if (signalFilter) {
      data = data.filter((p) => {
        const signals = getSignalsForProspect(p);
        return signals.includes(signalFilter);
      });
    }
    if (serviceFilter) {
      data = data.filter((p) => getSuggestedService(p) === serviceFilter);
    }

    return data.sort((a, b) => b.compound_score - a.compound_score);
  }, [activeQuickFilter, nameSearch, officeFilter, signalFilter, serviceFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const hasFilters = activeQuickFilter || officeFilter || signalFilter || serviceFilter || nameSearch;

  function clearFilters() {
    setActiveQuickFilter(null);
    setOfficeFilter('');
    setSignalFilter('');
    setServiceFilter('');
    setNameSearch('');
    setPage(0);
  }

  function exportCSV() {
    const header = 'Address,City,State,Owner,Risk Score,Indicators,Suggested Service,Intervention Stage\n';
    const rows = filtered.map((p) => {
      const signals = getSignalsForProspect(p)
        .map((s) => SIGNAL_COLORS[s as keyof typeof SIGNAL_COLORS]?.label || s)
        .join('; ');
      return `"${p.address}","${p.city}","${p.state}","${p.owner_name}",${p.compound_score},"${signals}","${getSuggestedService(p)}","${getInterventionStage(p)}"`;
    });
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beacon-households-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-beacon-text tracking-tight">Households</h1>
          <p className="text-sm text-beacon-text-muted mt-1">
            {formatNumber(filtered.length)} families who may need help
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-beacon-text-secondary bg-white border border-beacon-border rounded-lg hover:bg-beacon-surface-alt transition-colors"
        >
          <Download size={15} />
          Export
        </button>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.id}
            onClick={() => {
              setActiveQuickFilter(activeQuickFilter === qf.id ? null : qf.id);
              setPage(0);
            }}
            className={cn(
              'px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all',
              activeQuickFilter === qf.id
                ? 'bg-beacon-primary text-white border-beacon-primary shadow-sm'
                : 'bg-white text-beacon-text-secondary border-beacon-border hover:bg-beacon-surface-alt hover:border-beacon-border-dark'
            )}
            title={qf.description}
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-beacon-border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Name/address/ZIP lookup */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-beacon-text-muted" />
            <input
              type="text"
              placeholder="Name, address, or ZIP"
              value={nameSearch}
              onChange={(e) => { setNameSearch(e.target.value); setPage(0); }}
              className="pl-8 pr-8 py-2 w-52 border border-beacon-border rounded-lg bg-beacon-bg text-sm text-beacon-text placeholder:text-beacon-text-muted focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
            />
            {nameSearch && (
              <button
                onClick={() => { setNameSearch(''); setPage(0); }}
                className="absolute right-2.5 top-2.5 text-beacon-text-muted hover:text-beacon-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={officeFilter}
            onChange={(e) => { setOfficeFilter(e.target.value); setPage(0); }}
            className="text-sm border border-beacon-border rounded-lg px-3 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
          >
            <option value="">All Offices</option>
            {offices.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select
            value={signalFilter}
            onChange={(e) => { setSignalFilter(e.target.value); setPage(0); }}
            className="text-sm border border-beacon-border rounded-lg px-3 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
          >
            <option value="">All Indicators</option>
            {Object.entries(SIGNAL_COLORS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setPage(0); }}
            className="text-sm border border-beacon-border rounded-lg px-3 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
          >
            <option value="">All Services</option>
            <option value="Debt Management">Debt Management</option>
            <option value="Foreclosure Prevention">Foreclosure Prevention</option>
            <option value="Bankruptcy Counseling">Bankruptcy Counseling</option>
            <option value="Housing Counseling">Housing Counseling</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-medium text-beacon-text-muted hover:text-beacon-text transition-colors"
            >
              <X size={14} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Household table */}
      <div className="bg-white rounded-xl border border-beacon-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-beacon-border bg-beacon-surface-alt/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Homeowner</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Distress Indicators</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Risk Level</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Suggested Service</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beacon-border">
              {pageData.map((prospect) => {
                const signals = getSignalsForProspect(prospect);
                const service = getSuggestedService(prospect);
                const stage = getInterventionStage(prospect);
                const stageStyle = STAGE_STYLES[stage];
                return (
                  <tr key={prospect.id} className="hover:bg-beacon-surface-alt/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-beacon-text">{prospect.address}</p>
                      <p className="text-xs text-beacon-text-muted">{prospect.city}, {prospect.state} {prospect.zip}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-beacon-text">{prospect.owner_name}</p>
                      <p className="text-xs text-beacon-text-muted">
                        {prospect.years_held}yr homeowner &middot; {formatCurrency(prospect.estimated_equity)} at stake
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {signals.map((s) => {
                          const def = SIGNAL_COLORS[s as keyof typeof SIGNAL_COLORS];
                          if (!def) return null;
                          return (
                            <span
                              key={s}
                              className={cn('inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold', def.bg, def.text)}
                            >
                              {def.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: getScoreColor(prospect.compound_score) }}
                        >
                          {getScoreLabel(prospect.compound_score)}
                        </span>
                        <div className="w-12 h-1.5 bg-beacon-surface-alt rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${prospect.compound_score}%`,
                              backgroundColor: getScoreColor(prospect.compound_score),
                            }}
                          />
                        </div>
                        <span className="text-[9px]" style={{ color: stageStyle.color }}>
                          {stageStyle.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-beacon-text-secondary">{service}</p>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <Link
                        href={`/dashboard/prospects/${prospect.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-beacon-text-muted hover:bg-beacon-primary-muted hover:text-beacon-primary transition-colors"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-beacon-border">
            <span className="text-xs text-beacon-text-muted">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-md border border-beacon-border text-beacon-text-muted hover:bg-beacon-surface-alt disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-beacon-text-secondary font-medium">
                {page + 1} / {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="p-1.5 rounded-md border border-beacon-border text-beacon-text-muted hover:bg-beacon-surface-alt disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
