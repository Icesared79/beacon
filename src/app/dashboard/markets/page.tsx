'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  AlertTriangle,
  Users as UsersIcon,
  AlertCircle,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import {
  ACCC_MARKETS,
  ACCC_OFFICES,
  type MarketData,
} from '@/lib/market-data';
import { formatNumber } from '@/lib/utils';

/* ── Types ── */

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

const OFFICE_SET = new Set(ACCC_OFFICES.map((o) => `${o.city}|${o.state}`));

function buildCoverageRows(): CoverageRow[] {
  const rows: CoverageRow[] = [];
  const seen = new Set<string>();

  // Markets with data
  for (const m of ACCC_MARKETS) {
    const key = `${m.city}|${m.state}`;
    seen.add(key);
    const hasOffice = OFFICE_SET.has(key);
    rows.push({
      city: m.city,
      state: m.state,
      hasOffice,
      coverage: 'active',
      households: m.prospects,
      urgent: m.critical,
      needScore: m.score,
      isGap: false,
    });
  }

  // Offices with no market data = coverage gaps
  for (const o of ACCC_OFFICES) {
    const key = `${o.city}|${o.state}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({
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

  return rows;
}

const ALL_ROWS = buildCoverageRows();

/* ── Sort logic ── */

type SortCol = 'market' | 'office' | 'coverage' | 'households' | 'urgent' | 'needScore';

function defaultSort(a: CoverageRow, b: CoverageRow): number {
  // Gaps first
  if (a.isGap !== b.isGap) return a.isGap ? -1 : 1;
  // Then active by need score desc
  if (a.coverage === 'active' && b.coverage === 'active') return b.needScore - a.needScore;
  // Then no-office last
  if (!a.hasOffice && b.hasOffice) return 1;
  if (a.hasOffice && !b.hasOffice) return -1;
  return 0;
}

/* ── Score badge ── */

function scoreBadgeColor(score: number): string {
  if (score >= 80) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (score >= 65) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (score >= 50) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

/* ── Page ── */

export default function CoveragePage() {
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const rows = useMemo(() => {
    const sorted = [...ALL_ROWS];
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
  }, [sortCol, sortAsc]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  /* Aggregates */
  const marketsActive = ALL_ROWS.filter((r) => r.coverage === 'active').length;
  const marketsNoData = ALL_ROWS.filter((r) => r.isGap).length;
  const totalHouseholds = ALL_ROWS.reduce((s, r) => s + r.households, 0);

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-beacon-text-muted ml-1" />;
    return sortAsc
      ? <ArrowUp size={12} className="text-beacon-primary ml-1" />
      : <ArrowDown size={12} className="text-beacon-primary ml-1" />;
  };

  const thClass = 'text-left text-[11px] font-semibold text-beacon-text-muted uppercase tracking-wider px-3 py-2.5 cursor-pointer select-none hover:text-beacon-text transition-colors whitespace-nowrap';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-beacon-text tracking-tight">
            Coverage Intelligence
          </h1>
          <p className="text-sm text-beacon-text-muted mt-1">
            Where Beacon is working — and where it isn&apos;t yet.
          </p>
        </div>
      </div>

      {/* ── Summary Tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Building2 size={13} className="text-green-600 dark:text-green-400" />
            <span className="text-[10px] font-medium text-beacon-text-muted uppercase tracking-wider">
              Markets Active
            </span>
          </div>
          <p className="text-2xl font-bold text-beacon-text">{marketsActive}</p>
        </div>

        <div className="bg-beacon-surface rounded-xl border border-beacon-border border-l-[3px] border-l-red-500 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <AlertTriangle size={13} className="text-red-500" />
            <span className="text-[10px] font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
              Markets with No Coverage
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{marketsNoData}</p>
        </div>

        <div className="bg-beacon-surface rounded-xl border border-beacon-border p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <UsersIcon size={13} className="text-beacon-primary" />
            <span className="text-[10px] font-medium text-beacon-text-muted uppercase tracking-wider">
              Total Households Identified
            </span>
          </div>
          <p className="text-2xl font-bold text-beacon-text">{formatNumber(totalHouseholds)}</p>
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
                  {/* Market */}
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-beacon-text">{row.city}</span>
                    <span className="text-beacon-text-muted ml-1">{row.state}</span>
                  </td>

                  {/* Office */}
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

                  {/* Coverage */}
                  <td className="px-3 py-2.5">
                    {row.coverage === 'active' ? (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">Active</span>
                    ) : (
                      <span className="text-xs font-medium text-beacon-text-muted">No Data</span>
                    )}
                  </td>

                  {/* Households */}
                  <td className="px-3 py-2.5 tabular-nums">
                    {row.households > 0 ? (
                      <span className="text-beacon-text font-medium">{formatNumber(row.households)}</span>
                    ) : (
                      <span className="text-beacon-text-muted">&mdash;</span>
                    )}
                  </td>

                  {/* Urgent */}
                  <td className="px-3 py-2.5 tabular-nums">
                    {row.urgent > 0 ? (
                      <span className="text-beacon-text font-medium">{formatNumber(row.urgent)}</span>
                    ) : (
                      <span className="text-beacon-text-muted">&mdash;</span>
                    )}
                  </td>

                  {/* Need Score */}
                  <td className="px-3 py-2.5">
                    {row.needScore > 0 ? (
                      <span className={`inline-flex items-center justify-center h-5 min-w-[28px] rounded text-[10px] font-bold px-1.5 ${scoreBadgeColor(row.needScore)}`}>
                        {row.needScore}
                      </span>
                    ) : (
                      <span className="text-beacon-text-muted">&mdash;</span>
                    )}
                  </td>

                  {/* Gap Indicator */}
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
