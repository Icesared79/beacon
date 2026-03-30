'use client';

import { useEffect, useRef, useState } from 'react';

interface StreetViewProps {
  address: string;
  city: string;
  state: string;
  zip: string;
}

function cleanAddress(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
): string | null {
  const parts = [address, city, state, zip]
    .map(p => (p ?? '').trim())
    .filter(p => p.length > 0 && p.toLowerCase() !== 'null');
  if (parts.length < 2) return null;
  const clean = parts.join(', ').replace(/,\s*,/g, ',').trim();
  if (!/\d/.test(clean) || clean.length < 10) return null;
  return clean;
}

function Fallback() {
  return (
    <div
      style={{
        height: 100,
        background: 'var(--beacon-surface-alt)',
        border: '1px solid var(--beacon-border)',
        borderRadius: 'var(--radius-lg, 12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--beacon-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span style={{ fontSize: 12, color: 'var(--beacon-text-muted)' }}>Property view unavailable</span>
    </div>
  );
}

export function StreetView({ address, city, state, zip }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const fullAddress = cleanAddress(address, city, state, zip);

  useEffect(() => {
    if (!apiKey || !fullAddress) { setStatus('error'); return; }
    let cancelled = false;

    async function init() {
      try {
        // Step 1: Check for Street View coverage via metadata endpoint
        const metaRes = await fetch(
          `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(fullAddress!)}&key=${apiKey}`
        );
        const meta = await metaRes.json();
        if (cancelled || meta.status !== 'OK' || !meta.pano_id) {
          setStatus('error');
          return;
        }

        // Step 2: Load Maps JS API if not already loaded
        if (!(window as any).google?.maps) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
            if (existing) {
              const check = setInterval(() => {
                if ((window as any).google?.maps) { clearInterval(check); resolve(); }
              }, 100);
              setTimeout(() => { clearInterval(check); reject(); }, 10000);
              return;
            }
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.onload = () => {
              const check = setInterval(() => {
                if ((window as any).google?.maps?.StreetViewPanorama) { clearInterval(check); resolve(); }
              }, 50);
              setTimeout(() => { clearInterval(check); reject(); }, 5000);
            };
            script.onerror = () => reject();
            document.head.appendChild(script);
          });
        }

        if (cancelled || !containerRef.current) return;

        // Step 3: Render interactive panorama
        new (window as any).google.maps.StreetViewPanorama(containerRef.current, {
          pano: meta.pano_id,
          pov: { heading: 0, pitch: 5 },
          zoom: 0,
          addressControl: true,
          showRoadLabels: false,
          fullscreenControl: true,
          zoomControl: true,
          panControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          linksControl: true,
        });

        if (!cancelled) setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => { cancelled = true; };
  }, [address, city, state, zip, apiKey, fullAddress]);

  if (!apiKey || !fullAddress) return <Fallback />;

  if (status === 'error') {
    return <Fallback />;
  }

  return (
    <div style={{ borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden', marginBottom: 24, border: '1px solid var(--beacon-border)', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: 220 }}
      />
      {status === 'loading' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--beacon-surface-alt)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--beacon-text-muted)' }}>Loading Street View...</span>
        </div>
      )}
    </div>
  );
}
