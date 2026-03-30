'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  Users as UsersIcon,
  AlertCircle,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Loader2,
} from 'lucide-react';
import { ACCC_OFFICES } from '@/lib/market-data';
import { formatNumber } from '@/lib/utils';
import { AtlasStatus } from '@/components/AtlasStatus';

/* ── Types ── */

interface MarketFromAPI {
  city: string;
  state: string;
  county: string;
  prospects: number;
  critical: number;
  high: number;
  warning: number;
  score: number;
}

interface CoverageRow {
  city: string;
  state: string;
  hasOffice: boolean;
  coverage: 'active' | 'no_data';
  households: number;
  urgent: number;
  needScore: number;
  isGap: boolean;
}

/* ── Build unified coverage rows ── */

// Normalize city names to Title Case for matching
function normalizeCity(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const OFFICE_SET = new Set(ACCC_OFFICES.map((o) => `${normalizeCity(o.city)}|${o.state}`));

function buildCoverageRows(markets: MarketFromAPI[]): CoverageRow[] {
  const seen = new Map<string, CoverageRow>();

  for (const m of markets) {
    const city = normalizeCity(m.city);
    const state = (m.state || '').trim().toUpperCase();
    const key = `${city}|${state}`;

    const existing = seen.get(key);
    if (existing) {
      // Fix 2: Merge duplicates (e.g. "DENVER CO" and "Denver CO")
      existing.households += m.prospects;
      existing.urgent += m.critical;
      existing.needScore = Math.round((existing.needScore + m.score) / 2);
    } else {
      const hasOffice = OFFICE_SET.has(key);
      seen.set(key, {
        city,
        state,
        hasOffice,
        coverage: 'active',
        households: m.prospects,
        urgent: m.critical,
        needScore: m.score,
        isGap: false,
      });
    }
  }

  for (const o of ACCC_OFFICES) {
    const key = `${normalizeCity(o.city)}|${o.state}`;
    if (!seen.has(key)) {
      seen.set(key, {
        city: o.city,
        state: o.state,
        hasOffice: true,
        coverage: 'no_data',
        households: 0,
        urgent: 0,
        needScore: 0,
        isGap: true,
      });
    }
  }

  return Array.from(seen.values());
}

/* ── Sort logic ── */

type SortCol = 'market' | 'office' | 'coverage' | 'households' | 'urgent' | 'needScore';

function defaultSort(a: CoverageRow, b: CoverageRow): number {
  if (a.isGap !== b.isGap) return a.isGap ? -1 : 1;
  if (a.coverage === 'active' && b.coverage === 'active') return b.needScore - a.needScore;
  if (!a.hasOffice && b.hasOffice) return 1;
  if (a.hasOffice && !b.hasOffice) return -1;
  return 0;
}

/* ── Score badge ── */

function scoreBadgeColor(score: number): string {
  if (score >= 70) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (score >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (score >= 30) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

/* ── Page ── */

export default function CoveragePage() {
  const [markets, setMarkets] = useState<MarketFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function loadMarkets() {
      try {
        const res = await fetch('/api/beacon/markets');
        if (res.ok) {
          const data = await res.json();
          setMarkets(data.markets || []);
        }
      } catch (err) {
        console.error('Failed to load markets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMarkets();
  }, []);

  const allRows = useMemo(() => buildCoverageRows(markets), [markets]);

  const rows = useMemo(() => {
    const sorted = [...allRows];
    if (!sortCol) {
      sorted.sort(defaultSort);
      return sorted;
    }
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'market':
          cmp = a.city.localeCompare(b.city);
          break;
        case 'office':
          cmp = (a.hasOffice ? 1 : 0) - (b.hasOffice ? 1 : 0);
          break;
        case 'coverage':
          cmp = a.coverage.localeCompare(b.coverage);
          break;
        case 'households':
          cmp = a.households - b.households;
          break;
        case 'urgent':
          cmp = a.urgent - b.urgent;
          break;
        case 'needScore':
          cmp = a.needScore - b.needScore;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [allRows, sortCol, sortAsc]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  /* Aggregates */
  const marketsActive = allRows.filter((r) => r.coverage === 'active').length;
  const marketsNoData = allRows.filter((r) => r.isGap).length;
  const totalHouseholds = allRows.reduce((s, r) => s + r.households, 0);

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-beacon-text-muted ml-1" />;
    return sortAsc
      ? <ArrowUp size={12} className="text-beacon-primary ml-1" />
      : <ArrowDown size={12} className="text-beacon-primary ml-1" />;
  };

  const thClass = 'text-left text-[11px] font-semibold text-beacon-text-muted uppercase tracking-wider px-3 py-2.5 cursor-pointer select-none hover:text-beacon-text transition-colors whitespace-nowrap';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-beacon-primary" size={24} />
        <span className="ml-2 text-sm text-beacon-text-muted">Loading coverage data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--beacon-text)' }}>
            Coverage Intelligence
          </h1>
          <p style={{ fontSize: 13, color: 'var(--beacon-text-muted)', marginTop: 4 }}>
            Where Beacon is working — and where it isn&apos;t yet.
          </p>
          <AtlasStatus label="Coverage data" />
        </div>
      </div>

      {/* ── Summary Tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-beacon-surface rounded-xl border border-beacon-border text-center" style={{ padding: '20px 24px' }}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Building2 size={13} className="text-green-600 dark:text-green-400" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--beacon-text-muted)' }}>
              Markets Active
            </span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--beacon-text)', fontVariantNumeric: 'tabular-nums' }}>{marketsActive}</p>
        </div>

        <div className="bg-beacon-surface rounded-xl border border-beacon-border border-l-[3px] border-l-red-500 text-center" style={{ padding: '20px 24px' }}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <AlertTriangle size={13} className="text-red-500" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--beacon-critical)' }}>
              Markets with No Coverage
            </span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--beacon-critical)', fontVariantNumeric: 'tabular-nums' }}>{marketsNoData}</p>
        </div>

        <div className="bg-beacon-surface rounded-xl border border-beacon-border text-center" style={{ padding: '20px 24px' }}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <UsersIcon size={13} className="text-beacon-primary" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--beacon-text-muted)' }}>
              Total Households Identified
            </span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--beacon-text)', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(totalHouseholds)}</p>
        </div>
      </div>

      {/* ── Coverage Table ── */}
      <div className="bg-beacon-surface rounded-xl border border-beacon-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-beacon-border bg-beacon-bg">
                <th className={thClass} onClick={() => toggleSort('market')}>
                  <span className="inline-flex items-center">Market <SortIcon col="market" /></span>
                </th>
                <th className={thClass} onClick={() => toggleSort('office')}>
                  <span className="inline-flex items-center">ACCC Office <SortIcon col="office" /></span>
                </th>
                <th className={thClass} onClick={() => toggleSort('coverage')}>
                  <span className="inline-flex items-center">Beacon Coverage <SortIcon col="coverage" /></span>
                </th>
                <th className={thClass} onClick={() => toggleSort('households')}>
                  <span className="inline-flex items-center">Households <SortIcon col="households" /></span>
                </th>
                <th className={thClass} onClick={() => toggleSort('urgent')}>
                  <span className="inline-flex items-center">Urgent <SortIcon col="urgent" /></span>
                </th>
                <th className={thClass} onClick={() => toggleSort('needScore')}>
                  <span className="inline-flex items-center">Need Score <SortIcon col="needScore" /></span>
                </th>
                <th className={`${thClass} cursor-default hover:text-beacon-text-muted`}>
                  <span>Gap</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beacon-border">
              {rows.map((row) => (
                <tr
                  key={`${row.city}-${row.state}`}
                  className={`transition-colors ${
                    row.isGap
                      ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'hover:bg-beacon-surface-alt/50'
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-beacon-text">{row.city}</span>
                    <span className="text-beacon-text-muted ml-1">{row.state}</span>
                  </td>

                  <td className="px-3 py-2.5">
                    {row.hasOffice ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-beacon-text-secondary">Yes</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-xs text-beacon-text-muted">No</span>
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {row.coverage === 'active' ? (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">Active</span>
                    ) : (
                      <span className="text-xs font-medium text-beacon-text-muted">No Data</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 tabular-nums">
                    {row.households > 0 ? (
                      <span className="text-beacon-text font-medium">{formatNumber(row.households)}</span>
                    ) : (
                      <span className="text-beacon-text-muted">&mdash;</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 tabular-nums">
                    {row.urgent > 0 ? (
                      <span className="text-beacon-text font-medium">{formatNumber(row.urgent)}</span>
                    ) : (
                      <span className="text-beacon-text-muted">&mdash;</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {row.needScore > 0 ? (
                      <span className={`inline-flex items-center justify-center h-5 min-w-[28px] rounded text-[10px] font-bold px-1.5 ${scoreBadgeColor(row.needScore)}`}>
                        {row.needScore}
                      </span>
                    ) : (
                      <span className="text-beacon-text-muted">&mdash;</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {row.isGap && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <AlertCircle size={10} />
                        Coverage Gap
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
