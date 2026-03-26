'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X, Search, Loader2, ChevronDown, AlertTriangle, Clock, Eye } from 'lucide-react';
import { SIGNAL_COLORS } from '@/lib/design-tokens';
import { getSignalsForProspect, hasHardDistress, getPriorityGroup, getPrimarySignal, getDaysInDistress } from '@/lib/prospect-helpers';
import type { Prospect, PriorityGroup } from '@/lib/prospect-helpers';
import { cn, formatCurrency, formatNumber, formatOwnerName } from '@/lib/utils';

const PAGE_SIZE = 25;

const EQUITY_PRESETS = [
  { label: 'Any', min: '', max: '' },
  { label: 'Under $100K', min: '', max: '100000' },
  { label: '$100K–$500K', min: '100000', max: '500000' },
  { label: '$500K–$1M', min: '500000', max: '1000000' },
  { label: 'Over $1M', min: '1000000', max: '' },
];

interface FilterOption { value: string; label: string; }
interface IndicatorOption { key: string; label: string; }

const GROUP_CONFIG: Record<PriorityGroup, {
  label: string;
  description: string;
  color: string;
  bgLight: string;
  bgDark: string;
  textColor: string;
  icon: typeof AlertTriangle;
}> = {
  critical: {
    label: 'Critical',
    description: 'Active foreclosure or lis pendens — immediate outreach',
    color: '#DC2626',
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    bgDark: 'bg-red-100 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-400',
    icon: AlertTriangle,
  },
  high_need: {
    label: 'High Need',
    description: 'Tax delinquency, bankruptcy, or probate — outreach this week',
    color: '#D97706',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    bgDark: 'bg-amber-100 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    icon: Clock,
  },
  monitor: {
    label: 'Monitor',
    description: 'Early stage signals — watch list',
    color: '#2563EB',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    bgDark: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-400',
    icon: Eye,
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

  // Per-group pagination
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

  // Reset pagination when filters change
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

  // Sort all prospects by compound_score desc, then group
  const grouped = useMemo(() => {
    const sorted = [...prospects].sort((a, b) => b.compound_score - a.compound_score);
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

  // Visible groups (non-empty)
  const visibleGroups = GROUP_ORDER.filter(g => groupCounts[g] > 0);

  // Build subtitle
  const subtitleText = `${formatNumber(totalCount)} household${totalCount !== 1 ? 's' : ''} identified`;
  const stateLabel = stateFilter ? stateOptions.find(s => s.value === stateFilter)?.label || stateFilter : '';
  const groupCountsText = visibleGroups.map(g =>
    `${formatNumber(groupCounts[g])} ${GROUP_CONFIG[g].label}`
  ).join(' · ');

  function setGroupPage(group: PriorityGroup, page: number) {
    setGroupPages(prev => ({ ...prev, [group]: page }));
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
          {subtitleText}{stateLabel ? ` in ${stateLabel}` : ''}
          {loading && <Loader2 className="inline-block ml-2 animate-spin" size={12} />}
        </p>
        {groupCountsText && (
          <p className="text-xs text-beacon-text-muted mt-0.5">{groupCountsText}</p>
        )}
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
              <button onClick={() => setNameSearch('')} className="absolute right-2.5 top-2.5 text-beacon-text-muted hover:text-beacon-text">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* State */}
          <div className="relative">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
            >
              <option value="">All States</option>
              {stateOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-beacon-text-muted pointer-events-none" />
          </div>

          {/* Indicator */}
          <div className="relative">
            <select
              value={signalFilter}
              onChange={(e) => setSignalFilter(e.target.value)}
              className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
            >
              <option value="">All Indicators</option>
              {indicatorOptions.map(ind => <option key={ind.key} value={ind.key}>{ind.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-beacon-text-muted pointer-events-none" />
          </div>

          {/* Equity */}
          <div className="relative">
            <select
              value={equityPreset}
              onChange={(e) => setEquityPreset(Number(e.target.value))}
              className="appearance-none text-sm border border-beacon-border rounded-lg pl-3 pr-8 py-2 bg-beacon-bg text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 cursor-pointer"
            >
              {EQUITY_PRESETS.map((preset, i) => <option key={i} value={i}>Equity: {preset.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-beacon-text-muted pointer-events-none" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium text-beacon-text-muted hover:text-beacon-text transition-colors">
              <X size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Priority groups */}
      {visibleGroups.length === 0 ? (
        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-12 text-center">
          <p className="text-sm text-beacon-text-muted">No households match your current filters</p>
        </div>
      ) : (
        <div className="space-y-6">
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
  const Icon = config.icon;
  const pageCount = Math.ceil(prospects.length / PAGE_SIZE);
  const pageData = prospects.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="bg-beacon-surface rounded-xl border border-beacon-border overflow-hidden">
      {/* Group header */}
      <div className={cn('px-5 py-3 border-b border-beacon-border flex items-center gap-3', config.bgLight)}>
        <div className={cn('flex items-center justify-center w-7 h-7 rounded-lg', config.bgDark)}>
          <Icon size={14} style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-bold', config.textColor)}>{config.label}</span>
            <span className="text-xs text-beacon-text-muted">({formatNumber(prospects.length)})</span>
          </div>
          <p className="text-xs text-beacon-text-muted">{config.description}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-beacon-border bg-beacon-surface-alt/50">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-beacon-text-muted uppercase tracking-wider w-[18%]">Owner</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-beacon-text-muted uppercase tracking-wider w-[22%]">Address</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-beacon-text-muted uppercase tracking-wider w-[16%]">Primary Signal</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-beacon-text-muted uppercase tracking-wider w-[12%]">Equity</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-beacon-text-muted uppercase tracking-wider w-[10%]">In Distress</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-beacon-text-muted uppercase tracking-wider w-[10%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beacon-border">
            {pageData.map(prospect => (
              <ProspectRow key={prospect.id} prospect={prospect} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-beacon-border">
          <span className="text-xs text-beacon-text-muted">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, prospects.length)} of {formatNumber(prospects.length)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1 rounded-md border border-beacon-border text-beacon-text-muted hover:bg-beacon-surface-alt disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-beacon-text-secondary font-medium">{page + 1} / {pageCount}</span>
            <button
              onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
              className="p-1 rounded-md border border-beacon-border text-beacon-text-muted hover:bg-beacon-surface-alt disabled:opacity-40 transition-colors"
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

function ProspectRow({ prospect }: { prospect: Prospect }) {
  const primarySignal = getPrimarySignal(prospect);
  const signalCount = getSignalsForProspect(prospect).length;
  const days = getDaysInDistress(prospect);
  const primaryDef = primarySignal ? SIGNAL_COLORS[primarySignal as keyof typeof SIGNAL_COLORS] : null;

  return (
    <tr className="hover:bg-beacon-surface-alt/30 transition-colors group">
      {/* Owner name */}
      <td className="px-5 py-3">
        <p className="text-sm font-medium text-beacon-text truncate">{formatOwnerName(prospect.owner_name)}</p>
      </td>

      {/* Address */}
      <td className="px-4 py-3">
        <p className="text-sm text-beacon-text truncate">{prospect.address}</p>
        <p className="text-xs text-beacon-text-muted">{prospect.city}, {prospect.state} {prospect.zip}</p>
      </td>

      {/* Primary signal + count */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {primaryDef && (
            <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap', primaryDef.bg, primaryDef.text)}>
              {primaryDef.label}
            </span>
          )}
          {signalCount > 1 && (
            <span className="text-[10px] text-beacon-text-muted whitespace-nowrap">{signalCount} signals</span>
          )}
        </div>
      </td>

      {/* Equity */}
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-semibold text-beacon-text tabular-nums">{formatCurrency(prospect.assessed_value || prospect.estimated_equity)}</p>
      </td>

      {/* Days in distress */}
      <td className="px-4 py-3 text-right">
        {days !== null ? (
          <p className="text-xs text-beacon-text-secondary tabular-nums">{days}d</p>
        ) : (
          <p className="text-xs text-beacon-text-muted">—</p>
        )}
      </td>

      {/* Review button */}
      <td className="px-4 py-3 text-center">
        <Link
          href={`/dashboard/prospects/${prospect.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-beacon-primary bg-beacon-primary-muted hover:bg-beacon-primary hover:text-white transition-colors"
        >
          Review
        </Link>
      </td>
    </tr>
  );
}
