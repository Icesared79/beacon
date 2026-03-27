'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  AlertCircle,
  MapPin,
  BarChart3,
  ArrowRight,
  ClipboardList,
  Inbox,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

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
  const [firstName, setFirstName] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [distress, setDistress] = useState<DistressIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    async function loadUser() {
      // User name comes from the session cookie, not a database
      // For now, greeting is generic until proper auth is wired
    }

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

    loadUser();
    loadDashboard();
  }, []);

  const greeting = firstName
    ? `Good morning, ${firstName}.`
    : 'Good morning.';

  const statCards = stats
    ? [
        {
          label: 'Households Who May Need Help',
          value: stats.total,
          sublabel: 'Total identified',
          icon: Users,
          color: '#1B5EA8',
          bgColor: '#EBF2FB',
        },
        {
          label: 'Families at Risk of Foreclosure',
          value: stats.foreclosureCount,
          sublabel: 'Lis pendens on file',
          icon: AlertCircle,
          color: '#DC2626',
          bgColor: '#FEF2F2',
        },
        {
          label: 'States with Coverage',
          value: stats.statesWithCoverage,
          sublabel: 'Markets identified',
          icon: MapPin,
          color: '#D97706',
          bgColor: '#FFFBEB',
        },
        {
          label: 'Avg Distress Score',
          value: stats.avgScore,
          sublabel: 'Across all prospects',
          icon: BarChart3,
          color: '#16A34A',
          bgColor: '#F0FDF4',
        },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-beacon-text">
          {greeting}
        </h1>
        <p className="text-beacon-text-secondary mt-1">
          Here&apos;s who may need help in your community today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-beacon-surface rounded-xl border border-beacon-border p-5 animate-pulse"
              >
                <div className="h-3 w-32 bg-beacon-surface-alt rounded mb-3" />
                <div className="h-7 w-16 bg-beacon-surface-alt rounded mb-2" />
                <div className="h-3 w-20 bg-beacon-surface-alt rounded" />
              </div>
            ))
          : statCards.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  'bg-beacon-surface rounded-xl border border-beacon-border p-5 opacity-0',
                  mounted && 'animate-fade-in-up',
                  mounted && `stagger-${i + 1}`
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-beacon-text-muted uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1.5" style={{ color: stat.color }}>
                      {formatNumber(stat.value)}
                    </p>
                    <p className="text-xs text-beacon-text-muted mt-1">{stat.sublabel}</p>
                  </div>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    <stat.icon size={18} style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity feed — empty state until real counselor actions exist */}
        <div className="xl:col-span-2 bg-beacon-surface rounded-xl border border-beacon-border">
          <div className="px-5 py-4 border-b border-beacon-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-beacon-text">Recent Activity</h2>
          </div>
          <div className="px-5 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-beacon-surface-alt flex items-center justify-center mb-3">
              <Inbox size={20} className="text-beacon-text-muted" />
            </div>
            <p className="text-sm text-beacon-text-secondary">
              No activity yet
            </p>
            <p className="text-xs text-beacon-text-muted mt-1">
              Counselor actions will appear here as outreach begins.
            </p>
          </div>
        </div>

        {/* Quick access */}
        <div className="space-y-4">
          <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5">
            <h2 className="text-sm font-semibold text-beacon-text mb-4">Quick Access</h2>
            <div className="space-y-2.5">
              <Link
                href="/dashboard/prospects"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-beacon-surface-alt transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-beacon-primary-muted flex items-center justify-center">
                  <Users size={16} className="text-beacon-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-beacon-text">View Households</p>
                  <p className="text-xs text-beacon-text-muted">Families who may need help</p>
                </div>
                <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
              </Link>

              <Link
                href="/dashboard/markets"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-beacon-surface-alt transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-beacon-text">Coverage</p>
                  <p className="text-xs text-beacon-text-muted">Where Beacon is working — and where it isn&apos;t yet</p>
                </div>
                <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
              </Link>

              <Link
                href="/dashboard/prospects?assigned=me"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-beacon-surface-alt transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <ClipboardList size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-beacon-text">My Assignments</p>
                  <p className="text-xs text-beacon-text-muted">Households assigned to you</p>
                </div>
                <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
              </Link>
            </div>
          </div>

          {/* Distress summary — real data from API */}
          <div className="bg-beacon-surface rounded-xl border border-beacon-border p-5">
            <h2 className="text-sm font-semibold text-beacon-text mb-3">Distress Indicators</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 w-full bg-beacon-surface-alt rounded mb-1.5" />
                    <div className="h-1.5 w-full bg-beacon-surface-alt rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {distress.map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-beacon-text-secondary">{s.label}</span>
                      <span className="font-medium text-beacon-text">{formatNumber(s.count)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-beacon-surface-alt rounded-full overflow-hidden">
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
