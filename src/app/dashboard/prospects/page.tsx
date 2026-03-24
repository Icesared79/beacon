'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Download, ChevronLeft, ChevronRight, ArrowRight, X } from 'lucide-react';
import { SIGNAL_COLORS, STATUS_FLOW } from '@/lib/design-tokens';
import { DEMO_PROSPECTS, getSignalsForProspect } from '@/lib/prospect-data';
import { cn, formatCurrency, formatNumber, getScoreColor, getScoreLabel } from '@/lib/utils';

const PAGE_SIZE = 25;

export default function ProspectsPage() {
  const [officeFilter, setOfficeFilter] = useState('');
  const [signalFilter, setSignalFilter] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const offices = useMemo(
    () => [...new Set(DEMO_PROSPECTS.map((p) => p.office_city).filter(Boolean))].sort(),
    []
  );

  const filtered = useMemo(() => {
    let data = DEMO_PROSPECTS;
    if (officeFilter) data = data.filter((p) => p.office_city === officeFilter);
    if (statusFilter) data = data.filter((p) => p.status === statusFilter);
    if (minScore > 0) data = data.filter((p) => p.compound_score >= minScore);
    if (signalFilter) {
      data = data.filter((p) => {
        const signals = getSignalsForProspect(p);
        return signals.includes(signalFilter);
      });
    }
    return data.sort((a, b) => b.compound_score - a.compound_score);
  }, [officeFilter, signalFilter, minScore, statusFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const hasFilters = officeFilter || signalFilter || minScore > 0 || statusFilter;

  function clearFilters() {
    setOfficeFilter('');
    setSignalFilter('');
    setMinScore(0);
    setStatusFilter('');
    setPage(0);
  }

  function exportCSV() {
    const header = 'Address,City,State,Owner,Score,Signals,Status\n';
    const rows = filtered.map((p) => {
      const signals = getSignalsForProspect(p)
        .map((s) => SIGNAL_COLORS[s as keyof typeof SIGNAL_COLORS]?.label || s)
        .join('; ');
      return `"${p.address}","${p.city}","${p.state}","${p.owner_name}",${p.compound_score},"${signals}","${p.status}"`;
    });
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beacon-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-beacon-text tracking-tight">Prospects</h1>
          <p className="text-sm text-beacon-text-muted mt-1">
            {formatNumber(filtered.length)} homeowners showing distress signals
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-beacon-border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
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
            <option value="">All Signals</option>
            {Object.entries(SIGNAL_COLORS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          <select
            value={minScore}
            onChange={(e) => { setMinScore(Number(e.target.value)); setPage(0); }}
            className="text-sm border border-beacon-border rounded-lg px-3 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
          >
            <option value={0}>Min Score</option>
            <option value={40}>40+</option>
            <option value={60}>60+</option>
            <option value={80}>80+</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="text-sm border border-beacon-border rounded-lg px-3 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
          >
            <option value="">All Statuses</option>
            {STATUS_FLOW.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-medium text-beacon-text-muted hover:text-beacon-text transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Prospect table */}
      <div className="bg-white rounded-xl border border-beacon-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-beacon-border bg-beacon-surface-alt/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Signals</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Score</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Status</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beacon-border">
              {pageData.map((prospect) => {
                const signals = getSignalsForProspect(prospect);
                const statusDef = STATUS_FLOW.find((s) => s.value === prospect.status);
                return (
                  <tr key={prospect.id} className="hover:bg-beacon-surface-alt/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-beacon-text">{prospect.address}</p>
                      <p className="text-xs text-beacon-text-muted">{prospect.city}, {prospect.state} {prospect.zip}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-beacon-text">{prospect.owner_name}</p>
                      <p className="text-xs text-beacon-text-muted">
                        {prospect.years_held}yr hold &middot; {formatCurrency(prospect.estimated_equity)} equity
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
                      <div className="inline-flex flex-col items-center gap-1">
                        <span
                          className="text-sm font-bold"
                          style={{ color: getScoreColor(prospect.compound_score) }}
                        >
                          {prospect.compound_score}
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
                        <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: getScoreColor(prospect.compound_score) }}>
                          {getScoreLabel(prospect.compound_score)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: statusDef?.color || '#94A3B8' }}
                      >
                        {statusDef?.label || prospect.status}
                      </span>
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
