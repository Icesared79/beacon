'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Users as UsersIcon, Target } from 'lucide-react';
import { USMap } from '@/components/USMap';
import {
  ACCC_MARKETS,
  ACCC_OFFICES,
  MONTHLY_TREND,
  SIGNAL_BREAKDOWN,
} from '@/lib/market-data';
import { formatNumber } from '@/lib/utils';

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'rising': return <TrendingUp size={14} className="text-red-500" />;
    case 'declining': return <TrendingDown size={14} className="text-emerald-500" />;
    default: return <Minus size={14} className="text-slate-400" />;
  }
}

function getTrendLabel(trend: string) {
  switch (trend) {
    case 'rising': return 'Rising';
    case 'declining': return 'Declining';
    default: return 'Stable';
  }
}

export default function MarketsPage() {
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);

  const filteredMarkets = useMemo(() => {
    if (!selectedOffice) return ACCC_MARKETS;
    return ACCC_MARKETS.filter((m) => m.city === selectedOffice);
  }, [selectedOffice]);

  const totals = useMemo(() => {
    const data = filteredMarkets;
    return {
      prospects: data.reduce((s, m) => s + m.prospects, 0),
      critical: data.reduce((s, m) => s + m.critical, 0),
      avgScore: Math.round(data.reduce((s, m) => s + m.score, 0) / data.length),
    };
  }, [filteredMarkets]);

  const officesWithProspects = ACCC_OFFICES.map((o) => {
    const market = ACCC_MARKETS.find((m) => m.city === o.city);
    return { ...o, prospects: market?.prospects || 0 };
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-beacon-text tracking-tight">Markets</h1>
          <p className="text-sm text-beacon-text-muted mt-1">
            Distress signal density across ACCC operating markets
          </p>
        </div>
        <div>
          <select
            value={selectedOffice || ''}
            onChange={(e) => setSelectedOffice(e.target.value || null)}
            className="text-sm border border-beacon-border rounded-lg px-3 py-2 bg-white text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/20"
          >
            <option value="">All Offices</option>
            {ACCC_OFFICES.map((o) => (
              <option key={o.city} value={o.city}>
                {o.city}, {o.state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* US Map */}
      <div className="bg-white rounded-xl border border-beacon-border mb-6 overflow-hidden">
        <USMap
          offices={officesWithProspects}
          onOfficeClick={(o) => setSelectedOffice(o.city === selectedOffice ? null : o.city)}
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-beacon-border p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <UsersIcon size={16} className="text-beacon-primary" />
            <span className="text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Total Prospects</span>
          </div>
          <p className="text-2xl font-bold text-beacon-text">{formatNumber(totals.prospects)}</p>
        </div>
        <div className="bg-white rounded-xl border border-beacon-border p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <AlertCircle size={16} className="text-beacon-critical" />
            <span className="text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Critical Signals</span>
          </div>
          <p className="text-2xl font-bold text-beacon-critical">{formatNumber(totals.critical)}</p>
        </div>
        <div className="bg-white rounded-xl border border-beacon-border p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Target size={16} className="text-beacon-high" />
            <span className="text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-beacon-text">{totals.avgScore}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Market table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-beacon-border">
          <div className="px-5 py-4 border-b border-beacon-border">
            <h2 className="text-sm font-semibold text-beacon-text">Top Markets by Distress Concentration</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-beacon-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Market</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Prospects</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Critical</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Trend</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-beacon-text-muted uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beacon-border">
                {filteredMarkets.map((market) => (
                  <tr key={market.city} className="hover:bg-beacon-surface-alt/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-beacon-text">{market.city}</p>
                      <p className="text-xs text-beacon-text-muted">{market.county} County, {market.state}</p>
                    </td>
                    <td className="text-right px-4 py-3 text-sm font-medium text-beacon-text">
                      {formatNumber(market.prospects)}
                    </td>
                    <td className="text-right px-4 py-3 text-sm font-medium text-beacon-critical">
                      {formatNumber(market.critical)}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        {getTrendIcon(market.trend)}
                        {getTrendLabel(market.trend)}
                      </span>
                    </td>
                    <td className="text-right px-5 py-3">
                      <span
                        className="inline-flex items-center justify-center w-9 h-6 rounded-md text-xs font-bold text-white"
                        style={{
                          backgroundColor:
                            market.score >= 80
                              ? '#DC2626'
                              : market.score >= 70
                              ? '#D97706'
                              : market.score >= 60
                              ? '#2563EB'
                              : '#94A3B8',
                        }}
                      >
                        {market.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signal breakdown donut */}
        <div className="bg-white rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4">Signal Breakdown</h2>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={SIGNAL_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#FFFFFF"
                >
                  {SIGNAL_BREAKDOWN.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {SIGNAL_BREAKDOWN.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-beacon-text-secondary">{s.name}</span>
                <span className="font-semibold text-beacon-text">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly trend chart */}
      <div className="bg-white rounded-xl border border-beacon-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-beacon-text">New Distress Signals Detected (6 Months)</h2>
          <span className="text-xs text-beacon-text-muted">National total</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MONTHLY_TREND} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [formatNumber(Number(value)), 'Signals']}
              contentStyle={{
                background: '#0F172A',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Bar dataKey="signals" fill="#1B5EA8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
