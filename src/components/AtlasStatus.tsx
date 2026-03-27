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
      try {
        const res = await fetch('/api/atlas/notify');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silent — indicator is decorative
      }
    }
    poll();
    const interval = setInterval(poll, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const hasData = data?.status === 'ok' && data?.timestamp;

  return (
    <p className="text-[11px] text-beacon-text-muted mt-1 flex items-center gap-1.5">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${hasData ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
      <span>
        {label}
        {' · '}
        {hasData
          ? `Last refreshed ${timeAgo(data!.timestamp!)}`
          : 'Syncing…'
        }
        {hasData && data!.total_households
          ? ` · ${formatCount(data!.total_households!)} households`
          : ''
        }
      </span>
    </p>
  );
}
