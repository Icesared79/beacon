'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { AtlasStatus } from '@/components/AtlasStatus';

interface DashboardStats {
  total: number;
  foreclosureCount: number;
  statesWithCoverage: number;
  avgScore: number;
}

interface DistressIndicator {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [distress, setDistress] = useState<DistressIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    async function loadDashboard() {
      try {
        const res = await fetch('/api/beacon/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setDistress(data.distressIndicators);
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Households Identified',
          value: stats.total,
          sublabel: 'Total identified',
          color: '#1B5EA8',
        },
        {
          label: 'Families at Risk',
          value: stats.foreclosureCount,
          sublabel: 'Lis pendens on file',
          color: '#DC2626',
        },
        {
          label: 'States',
          value: stats.statesWithCoverage,
          sublabel: 'With Atlas data',
          color: '#D97706',
        },
        {
          label: 'Avg Need Score',
          value: stats.avgScore,
          sublabel: 'Across all prospects',
          color: '#2563EB',
        },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-beacon-text tracking-tight">Dashboard</h1>
          <p className="text-[15px] text-beacon-text-muted mt-1.5">
            {stats
              ? `${formatNumber(stats.total)} households across ${stats.statesWithCoverage} states`
              : 'Loading overview...'}
          </p>
        </div>
        <AtlasStatus label="Atlas data" />
      </div>

      {/* Stat cards — clean, no icons, no colored backgrounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
                <div className="h-3 w-28 bg-slate-100 rounded mb-3" />
                <div className="h-8 w-20 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            ))
          : statCards.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  'bg-white rounded-xl shadow-sm p-5 opacity-0',
                  mounted && 'animate-fade-in-up',
                  mounted && `stagger-${i + 1}`
                )}
              >
                <p className="text-xs font-medium text-beacon-text-muted uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-2 tracking-tight" style={{ color: stat.color }}>
                  {formatNumber(stat.value)}
                </p>
                <p className="text-xs text-beacon-text-muted mt-1.5">{stat.sublabel}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-beacon-border/50">
            <h2 className="text-sm font-semibold text-beacon-text">Recent Activity</h2>
          </div>
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-beacon-text-secondary">No activity yet</p>
            <p className="text-xs text-beacon-text-muted mt-1">
              Counselor actions will appear here as outreach begins.
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick Access */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-beacon-text mb-4">Quick Access</h2>
            <div className="space-y-1">
              <Link
                href="/dashboard/prospects"
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-beacon-text">View Households</p>
                  <p className="text-xs text-beacon-text-muted">Families who may need help</p>
                </div>
                <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
              </Link>

              <Link
                href="/dashboard/markets"
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-beacon-text">Coverage</p>
                  <p className="text-xs text-beacon-text-muted">Where Beacon is working</p>
                </div>
                <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
              </Link>

              <Link
                href="/dashboard/prospects?minScore=70"
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-beacon-text">Urgent Households</p>
                  <p className="text-xs text-beacon-text-muted">Critical tier — immediate outreach</p>
                </div>
                <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
              </Link>
            </div>
          </div>

          {/* Distress Indicators */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-beacon-text mb-4">Distress Indicators</h2>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-beacon-text-muted" />
              </div>
            ) : (
              <div className="space-y-3">
                {distress.map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-beacon-text-secondary">{s.label}</span>
                      <span className="font-semibold text-beacon-text tabular-nums">{formatNumber(s.count)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
