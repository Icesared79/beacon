'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  AlertCircle,
  Phone,
  CheckCircle,
  ArrowRight,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { getBrowserClient } from '@/lib/supabase';

interface StatCard {
  label: string;
  value: number;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const DEMO_STATS: StatCard[] = [
  {
    label: 'Households Who May Need Help',
    value: 1247,
    sublabel: 'This week',
    icon: Users,
    color: '#1B5EA8',
    bgColor: '#EBF2FB',
  },
  {
    label: 'Families at Risk of Foreclosure',
    value: 384,
    sublabel: 'Urgent intervention needed',
    icon: AlertCircle,
    color: '#DC2626',
    bgColor: '#FEF2F2',
  },
  {
    label: 'People Reached So Far',
    value: 892,
    sublabel: 'This month',
    icon: Phone,
    color: '#D97706',
    bgColor: '#FFFBEB',
  },
  {
    label: 'Families in Program',
    value: 156,
    sublabel: 'Enrolled in debt management',
    icon: CheckCircle,
    color: '#16A34A',
    bgColor: '#F0FDF4',
  },
];

interface ActivityItem {
  id: string;
  action: string;
  prospect: string;
  location: string;
  time: string;
  type: 'status_change' | 'note_added' | 'new_prospect';
}

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: '1', action: 'Started counseling session', prospect: 'Robert M. Fischer', location: 'Denver, CO', time: '12 min ago', type: 'status_change' },
  { id: '2', action: 'New household needs help', prospect: '1847 Elm Street', location: 'Chicago, IL', time: '28 min ago', type: 'new_prospect' },
  { id: '3', action: 'Added counselor note', prospect: 'Maria G. Santos', location: 'Atlanta, GA', time: '1 hr ago', type: 'note_added' },
  { id: '4', action: 'Enrolled in debt management', prospect: 'James T. Winslow', location: 'Philadelphia, PA', time: '2 hr ago', type: 'status_change' },
  { id: '5', action: 'New household needs help', prospect: '2201 Oak Avenue', location: 'Boston, MA', time: '2 hr ago', type: 'new_prospect' },
  { id: '6', action: 'Outreach made', prospect: 'Linda K. Chen', location: 'Detroit, MI', time: '3 hr ago', type: 'status_change' },
  { id: '7', action: 'New household needs help', prospect: '990 Pine Road', location: 'Dallas, TX', time: '3 hr ago', type: 'new_prospect' },
  { id: '8', action: 'Added counselor note', prospect: 'David A. Wright', location: 'Houston, TX', time: '4 hr ago', type: 'note_added' },
  { id: '9', action: 'Flagged for counseling', prospect: 'Sarah P. Nguyen', location: 'Miami, FL', time: '5 hr ago', type: 'status_change' },
  { id: '10', action: 'Enrolled in debt management', prospect: 'Michael R. Brown', location: 'Los Angeles, CA', time: '6 hr ago', type: 'status_change' },
];

function getActivityIcon(type: string) {
  switch (type) {
    case 'status_change': return <ArrowRight size={14} />;
    case 'note_added': return <ClipboardList size={14} />;
    case 'new_prospect': return <AlertCircle size={14} />;
    default: return <ArrowRight size={14} />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'status_change': return 'bg-blue-100 text-blue-600';
    case 'note_added': return 'bg-slate-100 text-slate-600';
    case 'new_prospect': return 'bg-red-100 text-red-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    setMounted(true);
    async function loadUser() {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('beacon_users')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        const name = data?.full_name || session.user.email?.split('@')[0] || '';
        setFirstName(name.split(' ')[0]);
      }
    }
    loadUser();
  }, []);

  const greeting = firstName
    ? `Good morning, ${firstName}.`
    : 'Good morning.';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s who may need help in your community today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {DEMO_STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              'bg-white rounded-xl border border-beacon-border p-5 opacity-0',
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
        {/* Activity feed */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-beacon-border">
          <div className="px-5 py-4 border-b border-beacon-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-beacon-text">Recent Activity</h2>
            <span className="text-xs text-beacon-text-muted">Last 24 hours</span>
          </div>
          <div className="divide-y divide-beacon-border">
            {DEMO_ACTIVITY.map((item) => (
              <div key={item.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-beacon-surface-alt/50 transition-colors">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', getActivityColor(item.type))}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-beacon-text">
                    <span className="font-medium">{item.action}</span>
                  </p>
                  <p className="text-xs text-beacon-text-secondary mt-0.5">
                    {item.prospect} &middot; {item.location}
                  </p>
                </div>
                <span className="text-xs text-beacon-text-muted whitespace-nowrap flex-shrink-0">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick access */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-beacon-border p-5">
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
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MapPin size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-beacon-text">Community Map</p>
                  <p className="text-xs text-beacon-text-muted">Where people need help most</p>
                </div>
                <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
              </Link>

              <Link
                href="/dashboard/prospects?assigned=me"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-beacon-surface-alt transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <ClipboardList size={16} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-beacon-text">My Assignments</p>
                  <p className="text-xs text-beacon-text-muted">Households assigned to you</p>
                </div>
                <ArrowRight size={14} className="text-beacon-text-muted group-hover:text-beacon-text transition-colors" />
              </Link>
            </div>
          </div>

          {/* Distress summary */}
          <div className="bg-white rounded-xl border border-beacon-border p-5">
            <h2 className="text-sm font-semibold text-beacon-text mb-3">Distress Indicators</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Tax Delinquency', count: 8421, pct: 34, color: '#D97706' },
                { label: 'Foreclosure Risk', count: 3102, pct: 13, color: '#DC2626' },
                { label: 'LLC Dissolved', count: 2847, pct: 12, color: '#EA580C' },
                { label: 'Established Homeowner', count: 6203, pct: 25, color: '#2563EB' },
                { label: 'Equity at Risk', count: 4012, pct: 16, color: '#16A34A' },
              ].map((s) => (
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
          </div>
        </div>
      </div>
    </div>
  );
}
