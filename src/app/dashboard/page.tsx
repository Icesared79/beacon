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

  // Derive Critical segment: total - high_need - monitor
  const distressWithCritical = (() => {
    if (!stats || distress.length === 0) return distress;
    const highNeed = distress.find(d => d.label.includes('High Need'));
    const monitor = distress.find(d => d.label.includes('Monitor'));
    const criticalFromApi = distress.find(d => d.label.includes('Critical'));
    const total = stats.total;
    const highCount = highNeed?.count ?? 0;
    const monitorCount = monitor?.count ?? 0;
    const criticalCount = criticalFromApi?.count ?? Math.max(0, total - highCount - monitorCount);

    const segments: DistressIndicator[] = [];
    if (criticalCount > 0) {
      segments.push({ label: 'Critical', count: criticalCount, pct: total > 0 ? (criticalCount / total) * 100 : 0, color: '#DC2626' });
    }
    if (highCount > 0) {
      segments.push({ label: 'High Need', count: highCount, pct: total > 0 ? (highCount / total) * 100 : 0, color: '#D97706' });
    }
    if (monitorCount > 0) {
      segments.push({ label: 'Monitor', count: monitorCount, pct: total > 0 ? (monitorCount / total) * 100 : 0, color: '#2563EB' });
    }
    return segments;
  })();

  const barTotal = distressWithCritical.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--beacon-text)' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--beacon-text-muted)', marginTop: 4 }}>
            {stats
              ? `${formatNumber(stats.total)} households across ${stats.statesWithCoverage} states`
              : 'Loading overview...'}
          </p>
        </div>
        <AtlasStatus label="Atlas data" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" style={{ marginBottom: 28 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-beacon-surface rounded-xl shadow-sm animate-pulse" style={{ padding: '20px 24px' }}>
                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded mb-3" />
                <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            ))
          : statCards.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  'bg-beacon-surface rounded-xl shadow-sm opacity-0',
                  mounted && 'animate-fade-in-up',
                  mounted && `stagger-${i + 1}`
                )}
                style={{ padding: '20px 24px' }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--beacon-text-muted)' }}>
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-2 tracking-tight" style={{ color: stat.color, fontVariantNumeric: 'tabular-nums' }}>
                  {formatNumber(stat.value)}
                </p>
                <p style={{ fontSize: 13, color: 'var(--beacon-text-muted)', marginTop: 6, lineHeight: 1.5 }}>{stat.sublabel}</p>
              </div>
            ))}
      </div>

      {/* Distress Indicators — bar + legend */}
      <div className="bg-beacon-surface rounded-xl shadow-sm" style={{ padding: '20px 24px', marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--beacon-text-muted)', marginBottom: 12 }}>
          DISTRESS INDICATORS
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={16} className="animate-spin text-beacon-text-muted" />
          </div>
        ) : (
          <>
            {/* Stacked bar */}
            <div style={{ display: 'flex', width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: 'var(--beacon-surface-alt)' }}>
              {distressWithCritical.map((s) => {
                let widthPct = barTotal > 0 ? (s.count / barTotal) * 100 : 0;
                if (s.count > 0 && widthPct < 2) widthPct = 2;
                return (
                  <div
                    key={s.label}
                    style={{ width: `${widthPct}%`, backgroundColor: s.color, transition: 'width 0.7s ease' }}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {distressWithCritical.map((s, i) => (
                <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--beacon-text-secondary)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                  {s.label}
                  <span style={{ fontWeight: 600, color: 'var(--beacon-text)', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(s.count)}</span>
                  {i < distressWithCritical.length - 1 && <span style={{ color: 'var(--beacon-border-dark)', marginLeft: 4 }}>|</span>}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-beacon-surface rounded-xl shadow-sm">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--beacon-border)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--beacon-text-muted)' }}>Recent Activity</p>
          </div>
          <div style={{ padding: 24 }} className="flex flex-col items-center justify-center text-center">
            <p style={{ fontSize: 13, color: 'var(--beacon-text-secondary)', lineHeight: 1.5 }}>No activity yet</p>
            <p style={{ fontSize: 13, color: 'var(--beacon-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
              Counselor actions will appear here as outreach begins.
            </p>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-beacon-surface rounded-xl shadow-sm" style={{ padding: '24px 28px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--beacon-text-muted)', marginBottom: 16 }}>Quick Access</p>
          <div className="space-y-1">
            <Link
              href="/dashboard/prospects"
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-beacon-surface-alt transition-colors group"
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--beacon-text)', lineHeight: 1.5 }}>View Households</p>
                <p style={{ fontSize: 13, color: 'var(--beacon-text-muted)', lineHeight: 1.5 }}>Families who may need help</p>
              </div>
              <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
            </Link>

            <Link
              href="/dashboard/markets"
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-beacon-surface-alt transition-colors group"
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--beacon-text)', lineHeight: 1.5 }}>Coverage</p>
                <p style={{ fontSize: 13, color: 'var(--beacon-text-muted)', lineHeight: 1.5 }}>Where Beacon is working</p>
              </div>
              <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
            </Link>

            <Link
              href="/dashboard/prospects?minScore=70"
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-beacon-surface-alt transition-colors group"
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--beacon-text)', lineHeight: 1.5 }}>Urgent Households</p>
                <p style={{ fontSize: 13, color: 'var(--beacon-text-muted)', lineHeight: 1.5 }}>Critical tier — immediate outreach</p>
              </div>
              <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
