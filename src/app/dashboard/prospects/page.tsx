'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X, Search, Loader2, ChevronDown } from 'lucide-react';
import { SIGNAL_COLORS } from '@/lib/design-tokens';
import { getSignalsForProspect, hasHardDistress, getPriorityGroup, getPrimarySignal, getDaysInDistress, isEntityOwner } from '@/lib/prospect-helpers';
import type { Prospect, PriorityGroup } from '@/lib/prospect-helpers';
import { cn, formatCurrency, formatNumber, formatOwnerName } from '@/lib/utils';
import { AtlasStatus } from '@/components/AtlasStatus';

const PAGE_SIZE = 25;

const EQUITY_PRESETS = [
  { label: 'Any', min: '', max: '' },
  { label: 'Under $100K', min: '', max: '100000' },
  { label: '$100K\u2013$500K', min: '100000', max: '500000' },
  { label: '$500K\u2013$1M', min: '500000', max: '1000000' },
  { label: 'Over $1M', min: '1000000', max: '' },
];

interface FilterOption { value: string; label: string; }
interface IndicatorOption { key: string; label: string; }

const GROUP_CONFIG: Record<PriorityGroup, {
  label: string;
  description: string;
  color: string;
}> = {
  critical: {
    label: 'Critical',
    description: 'Active foreclosure or lis pendens \u2014 immediate outreach',
    color: '#DC2626',
  },
  high_need: {
    label: 'High Need',
    description: 'Tax delinquency, bankruptcy, or probate \u2014 outreach this week',
    color: '#D97706',
  },
  monitor: {
    label: 'Monitor',
    description: 'Early stage signals \u2014 watch list',
    color: '#2563EB',
  },
};

const GROUP_ORDER: PriorityGroup[] = ['critical', 'high_need', 'monitor'];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stateOptions, setStateOptions] = useState<FilterOption[]>([]);
  const [indicatorOptions, setIndicatorOptions] = useState<IndicatorOption[]>([]);

  const [stateFilter, setStateFilter] = useState('');
  const [signalFilter, setSignalFilter] = useState('');
  const [equityPreset, setEquityPreset] = useState(0);
  const [nameSearch, setNameSearch] = useState('');

  const [groupPages, setGroupPages] = useState<Record<PriorityGroup, number>>({
    critical: 0,
    high_need: 0,
    monitor: 0,
  });

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

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '2000' });
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

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  useEffect(() => {
    setGroupPages({ critical: 0, high_need: 0, monitor: 0 });
  }, [stateFilter, signalFilter, nameSearch, equityPreset]);

  const hasFilters = stateFilter || signalFilter || nameSearch || equityPreset !== 0;

  function clearFilters() {
    setStateFilter('');
    setSignalFilter('');
    setEquityPreset(0);
    setNameSearch('');
  }

  const grouped = useMemo(() => {
    const filtered = prospects.filter(p => {
      if (isEntityOwner(p.owner_name)) return false;
      if (!p.assessed_value || p.assessed_value < 5000) return false;
      if (p.last_sale_price > 1 && (!p.estimated_equity || p.estimated_equity <= 0)) return false;
      return true;
    });
    const sorted = filtered.sort((a, b) => b.compound_score - a.compound_score);
    const groups: Record<PriorityGroup, Prospect[]> = {
      critical: [],
      high_need: [],
      monitor: [],
    };
    for (const p of sorted) {
      groups[getPriorityGroup(p)].push(p);
    }
    return groups;
  }, [prospects]);

  const groupCounts = useMemo(() => ({
    critical: grouped.critical.length,
    high_need: grouped.high_need.length,
    monitor: grouped.monitor.length,
  }), [grouped]);

  const visibleGroups = GROUP_ORDER.filter(g => groupCounts[g] > 0);

  const stateLabel = stateFilter ? stateOptions.find(s => s.value === stateFilter)?.label || stateFilter : '';

  // Count unique states
  const stateCount = useMemo(() => {
    const s = new Set(prospects.map(p => p.state).filter(Boolean));
    return s.size;
  }, [prospects]);

  function setGroupPage(group: PriorityGroup, page: number) {
    setGroupPages(prev => ({ ...prev, [group]: page }));
  }

  // Active filter pills
  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (stateFilter) {
    const sl = stateOptions.find(s => s.value === stateFilter)?.label || stateFilter;
    activeFilters.push({ key: 'state', label: sl, clear: () => setStateFilter('') });
  }
  if (signalFilter) {
    const il = indicatorOptions.find(i => i.key === signalFilter)?.label || signalFilter;
    activeFilters.push({ key: 'signal', label: il, clear: () => setSignalFilter('') });
  }
  if (equityPreset !== 0) {
    activeFilters.push({ key: 'equity', label: EQUITY_PRESETS[equityPreset].label, clear: () => setEquityPreset(0) });
  }

  if (loading && prospects.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-beacon-text-muted" size={24} />
        <span className="ml-2 text-sm text-beacon-text-muted">Loading households...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-beacon-text tracking-tight">Households</h1>
          <p className="text-[15px] text-beacon-text-muted mt-1.5 leading-relaxed">
            {formatNumber(totalCount)} household{totalCount !== 1 ? 's' : ''} identified across {stateCount} state{stateCount !== 1 ? 's' : ''}
            {stateLabel ? ` (filtered to ${stateLabel})` : ''}
            {loading && <Loader2 className="inline-block ml-2 animate-spin" size={12} />}
          </p>
        </div>
        <AtlasStatus label="Atlas data" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-[11px] h-4 w-4 text-beacon-text-muted" />
          <input
            type="text"
            placeholder="Search by name, address, or ZIP..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-[9px] border border-beacon-border rounded-lg bg-white text-sm text-beacon-text placeholder:text-beacon-text-muted focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
          />
          {nameSearch && (
            <button onClick={() => setNameSearch('')} className="absolute right-3 top-[11px] text-beacon-text-muted hover:text-beacon-text">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* State */}
        <div className="relative">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-[9px] bg-white text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
          >
            <option value="">All States</option>
            {stateOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-[11px] h-4 w-4 text-beacon-text-muted pointer-events-none" />
        </div>

        {/* Indicator */}
        <div className="relative">
          <select
            value={signalFilter}
            onChange={(e) => setSignalFilter(e.target.value)}
            className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-[9px] bg-white text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
          >
            <option value="">All Indicators</option>
            {indicatorOptions.map(ind => <option key={ind.key} value={ind.key}>{ind.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-[11px] h-4 w-4 text-beacon-text-muted pointer-events-none" />
        </div>

        {/* Equity */}
        <div className="relative">
          <select
            value={equityPreset}
            onChange={(e) => setEquityPreset(Number(e.target.value))}
            className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-[9px] bg-white text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
          >
            {EQUITY_PRESETS.map((preset, i) => <option key={i} value={i}>Equity: {preset.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-[11px] h-4 w-4 text-beacon-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={f.clear}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded-full border border-beacon-border bg-white text-beacon-text-secondary hover:bg-beacon-surface-alt transition-colors cursor-pointer"
            >
              {f.label}
              <X size={14} className="text-beacon-text-muted" />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button onClick={clearFilters} className="text-xs font-medium text-beacon-text-muted hover:text-beacon-text transition-colors ml-1">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Priority groups */}
      {visibleGroups.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-beacon-text-muted">No households match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleGroups.map(groupKey => (
            <PriorityGroupSection
              key={groupKey}
              groupKey={groupKey}
              prospects={grouped[groupKey]}
              page={groupPages[groupKey]}
              onPageChange={(p) => setGroupPage(groupKey, p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Priority Group Section ──

function PriorityGroupSection({
  groupKey,
  prospects,
  page,
  onPageChange,
}: {
  groupKey: PriorityGroup;
  prospects: Prospect[];
  page: number;
  onPageChange: (page: number) => void;
}) {
  const config = GROUP_CONFIG[groupKey];
  const pageCount = Math.ceil(prospects.length / PAGE_SIZE);
  const pageData = prospects.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Group header — left border accent, white background */}
      <div className="flex items-center gap-3 mb-3 pl-3" style={{ borderLeft: `3px solid ${config.color}` }}>
        <span className="text-sm font-semibold" style={{ color: config.color }}>{config.label}</span>
        <span className="text-[13px] text-beacon-text-muted">{formatNumber(prospects.length)}</span>
      </div>

      {/* Rows */}
      <div>
        {pageData.map(prospect => (
          <ProspectRow key={prospect.id} prospect={prospect} groupColor={config.color} />
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-3 mt-1">
          <span className="text-xs text-beacon-text-muted">
            {page * PAGE_SIZE + 1}\u2013{Math.min((page + 1) * PAGE_SIZE, prospects.length)} of {formatNumber(prospects.length)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md border border-beacon-border text-beacon-text-muted hover:bg-beacon-surface-alt disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-beacon-text-secondary font-medium tabular-nums">{page + 1} / {pageCount}</span>
            <button
              onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
              className="p-1.5 rounded-md border border-beacon-border text-beacon-text-muted hover:bg-beacon-surface-alt disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Individual Row ──

function ProspectRow({ prospect, groupColor }: { prospect: Prospect; groupColor: string }) {
  const primarySignal = getPrimarySignal(prospect);
  const signalCount = getSignalsForProspect(prospect).length;
  const days = getDaysInDistress(prospect);
  const primaryDef = primarySignal ? SIGNAL_COLORS[primarySignal as keyof typeof SIGNAL_COLORS] : null;

  return (
    <Link
      href={`/dashboard/prospects/${prospect.id}`}
      className="block no-underline"
    >
      <div className="flex items-center py-3.5 px-4 border-b border-beacon-border/50 hover:bg-slate-50 transition-colors cursor-pointer group">
        {/* Owner + address */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-beacon-text truncate leading-snug">{formatOwnerName(prospect.owner_name)}</p>
          <p className="text-sm text-beacon-text-muted mt-0.5 truncate">{prospect.address}, {prospect.city}, {prospect.state} {prospect.zip}</p>
        </div>

        {/* Primary signal badge + count */}
        <div className="flex items-center gap-2 ml-6 min-w-[140px]">
          {primaryDef && (
            <span
              className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
              style={{ backgroundColor: groupColor + '12', color: groupColor }}
            >
              {primaryDef.label}
            </span>
          )}
          {signalCount > 1 && (
            <span className="text-xs text-beacon-text-muted whitespace-nowrap">+{signalCount - 1} more</span>
          )}
        </div>

        {/* Equity */}
        <div className="text-right ml-6 min-w-[100px]">
          {prospect.last_sale_price != null && prospect.last_sale_price <= 1 ? (
            <>
              <p className="text-[15px] font-medium text-beacon-text tabular-nums">{formatCurrency(prospect.assessed_value)}</p>
              <p className="text-[11px] text-beacon-text-muted">Based on assessed value</p>
            </>
          ) : (
            <p className="text-[15px] font-medium text-beacon-text tabular-nums">{formatCurrency(prospect.estimated_equity || prospect.assessed_value)}</p>
          )}
        </div>

        {/* Days in distress */}
        <div className="text-right ml-6 min-w-[48px]">
          {days !== null ? (
            <p className="text-sm text-beacon-text tabular-nums font-medium">
              {days >= 365 ? `${Math.round(days / 365)}y` : days >= 30 ? `${Math.round(days / 30)}mo` : `${days}d`}
            </p>
          ) : (
            <p className="text-sm text-beacon-text-muted">\u2014</p>
          )}
        </div>

        {/* Review button */}
        <div className="ml-6">
          <span className="inline-flex items-center px-4 py-1.5 rounded-md text-[13px] font-medium border border-beacon-border text-beacon-text-secondary group-hover:border-beacon-primary group-hover:text-beacon-primary transition-colors">
            Review
          </span>
        </div>
      </div>
    </Link>
  );
}
