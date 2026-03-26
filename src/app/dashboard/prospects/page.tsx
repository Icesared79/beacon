'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, ArrowUpDown, ArrowDown, ArrowUp, X, Search, Loader2, ChevronDown } from 'lucide-react';
import { SIGNAL_COLORS } from '@/lib/design-tokens';
import { getSignalsForProspect, getSuggestedService, getInterventionStage } from '@/lib/prospect-helpers';
import type { Prospect, InterventionStage } from '@/lib/prospect-helpers';
import { cn, formatCurrency, formatNumber, getScoreLabel, formatOwnerName } from '@/lib/utils';

const PAGE_SIZE = 25;

const STAGE_STYLES: Record<InterventionStage, { color: string; label: string }> = {
  Late: { color: '#DC2626', label: 'Act now' },
  Mid: { color: '#D97706', label: 'Window narrowing' },
  Early: { color: '#2563EB', label: 'Time to help' },
};

const EQUITY_PRESETS = [
  { label: 'Any', min: '', max: '' },
  { label: 'Under $100K', min: '', max: '100000' },
  { label: '$100K–$500K', min: '100000', max: '500000' },
  { label: '$500K–$1M', min: '500000', max: '1000000' },
  { label: 'Over $1M', min: '1000000', max: '' },
];

interface FilterOption {
  value: string;
  label: string;
}

interface IndicatorOption {
  key: string;
  label: string;
}

type SortField = 'risk' | 'years' | 'equity';
type SortDir = 'desc' | 'asc';

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter options from API
  const [stateOptions, setStateOptions] = useState<FilterOption[]>([]);
  const [indicatorOptions, setIndicatorOptions] = useState<IndicatorOption[]>([]);

  // Active filters
  const [stateFilter, setStateFilter] = useState('');
  const [signalFilter, setSignalFilter] = useState('');
  const [equityPreset, setEquityPreset] = useState(0); // index into EQUITY_PRESETS
  const [nameSearch, setNameSearch] = useState('');

  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  // Load filter options once
  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetch('/api/beacon/prospects/filters');
        const data = await res.json();
        if (data.states) setStateOptions(data.states);
        if (data.indicators) setIndicatorOptions(data.indicators);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadFilters();
  }, []);

  // Fetch prospects with server-side filters
  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '1000' });
      if (stateFilter) params.set('state', stateFilter);
      if (signalFilter) params.set('signal', signalFilter);
      if (nameSearch) params.set('search', nameSearch);
      const preset = EQUITY_PRESETS[equityPreset];
      if (preset.min) params.set('minEquity', preset.min);
      if (preset.max) params.set('maxEquity', preset.max);

      const res = await fetch(`/api/beacon/prospects?${params}`);
      const data = await res.json();
      if (data.prospects) {
        setProspects(data.prospects);
        setTotalCount(data.total ?? data.prospects.length);
      }
    } catch (err) {
      console.error('Failed to fetch prospects:', err);
    } finally {
      setLoading(false);
    }
  }, [stateFilter, signalFilter, nameSearch, equityPreset]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [stateFilter, signalFilter, nameSearch, equityPreset]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-beacon-text-muted" />;
    return sortDir === 'desc'
      ? <ArrowDown size={12} className="text-beacon-primary" />
      : <ArrowUp size={12} className="text-beacon-primary" />;
  }

  const sorted = useMemo(() => {
    const data = [...prospects];
    const dir = sortDir === 'desc' ? -1 : 1;
    switch (sortField) {
      case 'years':
        data.sort((a, b) => dir * ((a.years_held || 0) - (b.years_held || 0)));
        break;
      case 'equity':
        data.sort((a, b) => dir * ((a.estimated_equity || 0) - (b.estimated_equity || 0)));
        break;
      case 'risk':
      default:
        data.sort((a, b) => dir * (a.compound_score - b.compound_score));
        break;
    }
    return data;
  }, [prospects, sortField, sortDir]);

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const hasFilters = stateFilter || signalFilter || nameSearch || equityPreset !== 0;

  function clearFilters() {
    setStateFilter('');
    setSignalFilter('');
    setEquityPreset(0);
    setNameSearch('');
    setPage(0);
  }

  // Build subtitle
  const subtitleParts: string[] = [];
  subtitleParts.push(`${formatNumber(totalCount)} household${totalCount !== 1 ? 's' : ''} identified`);
  if (stateFilter) {
    const stateLabel = stateOptions.find((s) => s.value === stateFilter)?.label || stateFilter;
    subtitleParts[0] += ` in ${stateLabel}`;
  }

  if (loading && prospects.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-beacon-primary" size={24} />
        <span className="ml-2 text-sm text-beacon-text-muted">Loading households...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-beacon-text tracking-tight">Households</h1>
        <p className="text-sm text-beacon-text-muted mt-1">
          {subtitleParts[0]}
          {loading && <Loader2 className="inline-block ml-2 animate-spin" size={12} />}
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-beacon-surface rounded-xl border border-beacon-border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-beacon-text-muted" />
            <input
              type="text"
              placeholder="Name, address, or ZIP"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="pl-8 pr-8 py-2 w-52 border border-beacon-border rounded-lg bg-beacon-bg text-sm text-beacon-text placeholder:text-beacon-text-muted focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
            />
            {nameSearch && (
              <button
                onClick={() => setNameSearch('')}
                className="absolute right-2.5 top-2.5 text-beacon-text-muted hover:text-beacon-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* State filter */}
          <div className="relative">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
            >
              <option value="">All States</option>
              {stateOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-beacon-text-muted pointer-events-none" />
          </div>

          {/* Indicator filter */}
          <div className="relative">
            <select
              value={signalFilter}
              onChange={(e) => setSignalFilter(e.target.value)}
              className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
            >
              <option value="">All Indicators</option>
              {indicatorOptions.map((ind) => (
                <option key={ind.key} value={ind.key}>{ind.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-beacon-text-muted pointer-events-none" />
          </div>

          {/* Equity range */}
          <div className="relative">
            <select
              value={equityPreset}
              onChange={(e) => setEquityPreset(Number(e.target.value))}
              className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
            >
              {EQUITY_PRESETS.map((preset, i) => (
                <option key={i} value={i}>Equity: {preset.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-beacon-text-muted pointer-events-none" />
          </div>

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
      <div className="bg-beacon-surface rounded-xl border border-beacon-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[7%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[29%]" />
              <col className="w-[14%]" />
              <col className="w-[4%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-beacon-border bg-beacon-surface-alt/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">
                  Homeowner
                </th>
                <th
                  className="text-center px-2 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-beacon-text transition-colors"
                  onClick={() => handleSort('years')}
                >
                  <span className="inline-flex items-center gap-1">
                    Years
                    <SortIcon field="years" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">
                  Property
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-beacon-text transition-colors"
                  onClick={() => handleSort('equity')}
                >
                  <span className="inline-flex items-center justify-end gap-1 w-full">
                    Equity
                    <SortIcon field="equity" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">
                  Distress Indicators
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">
                  Action Needed
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beacon-border">
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-beacon-text-muted">
                    No households match the current filters.
                  </td>
                </tr>
              )}
              {pageData.map((prospect) => {
                const signals = getSignalsForProspect(prospect);
                const service = getSuggestedService(prospect);
                const stage = getInterventionStage(prospect);
                const stageStyle = STAGE_STYLES[stage];
                return (
                  <tr key={prospect.id} className="hover:bg-beacon-surface-alt/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-beacon-text truncate">{formatOwnerName(prospect.owner_name)}</p>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <p className="text-sm text-beacon-text tabular-nums">{prospect.years_held ? `${Math.round(prospect.years_held)}` : 'Unknown'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-beacon-text truncate">{prospect.address}</p>
                      <p className="text-xs text-beacon-text-muted">{prospect.city}, {prospect.state} {prospect.zip}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <p className="text-sm font-semibold text-beacon-text tabular-nums">{formatCurrency(prospect.estimated_equity)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {signals.map((s) => {
                          const def = SIGNAL_COLORS[s as keyof typeof SIGNAL_COLORS];
                          if (!def) return null;
                          return (
                            <span
                              key={s}
                              className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold', def.bg, def.text)}
                            >
                              {def.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: stageStyle.color }}
                      >
                        {getScoreLabel(prospect.compound_score)}
                      </p>
                      <p className="text-xs text-beacon-text-secondary mt-0.5">{service}</p>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <Link
                        href={`/dashboard/prospects/${prospect.id}`}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-beacon-text-muted hover:bg-beacon-primary-muted hover:text-beacon-primary transition-colors"
                      >
                        <ArrowRight size={15} />
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
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {formatNumber(totalCount)}
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
