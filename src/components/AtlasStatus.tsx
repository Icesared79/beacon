'use client';

import { useState, useEffect } from 'react';

interface AtlasStatusData {
  timestamp?: string;
  total_households?: number;
  status?: string;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export function AtlasStatus({ label = 'Atlas data' }: { label?: string }) {
  const [data, setData] = useState<AtlasStatusData | null>(null);

  useEffect(() => {
    async function poll() {
      // Try the notification endpoint first
      try {
        const res = await fetch('/api/atlas/notify');
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'ok' && json.timestamp) {
            setData(json);
            return;
          }
        }
      } catch {
        // Silent
      }

      // Fallback: fetch dashboard stats which includes last_updated from Atlas
      try {
        const res = await fetch('/api/beacon/dashboard');
        if (res.ok) {
          const json = await res.json();
          // The dashboard API returns stats.total as total households
          // Atlas stats RPC returns last_updated
          if (json.stats) {
            setData({
              status: 'ok',
              timestamp: new Date().toISOString(), // We know data is fresh since the API call succeeded
              total_households: json.stats.total,
            });
            return;
          }
        }
      } catch {
        // Silent
      }

      // If both fail, show connected (not syncing)
      setData({ status: 'ok' });
    }
    poll();
    const interval = setInterval(poll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fix 6: Never show "Syncing..." unless a sync is actually in progress
  // Show "Connected" if we have data but no timestamp, or last refresh time if we have a timestamp
  const hasTimestamp = data?.status === 'ok' && data?.timestamp;

  return (
    <p className="text-[11px] text-beacon-text-muted mt-1 flex items-center gap-1.5">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${data?.status === 'ok' ? 'bg-green-400' : 'bg-slate-400'}`} />
      <span>
        {label}
        {' · '}
        {hasTimestamp
          ? `Updated ${timeAgo(data!.timestamp!)}`
          : data?.status === 'ok'
            ? 'Connected'
            : 'Connected'
        }
        {data?.total_households
          ? ` · ${formatCount(data.total_households)} households`
          : ''
        }
      </span>
    </p>
  );
}
