'use client';

import { useEffect, useRef, useState } from 'react';

interface StreetViewProps {
  address: string;
  city: string;
  state: string;
  zip: string;
}

export function StreetView({ address, city, state, zip }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;

  useEffect(() => {
    if (!apiKey) { setStatus('error'); return; }
    let cancelled = false;

    async function init() {
      try {
        // Step 1: Get pano_id from Street View metadata (works without Geocoding API)
        const metaRes = await fetch(
          `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(fullAddress)}&key=${apiKey}`
        );
        const meta = await metaRes.json();
        if (cancelled || meta.status !== 'OK' || !meta.pano_id) {
          setStatus('error');
          return;
        }

        // Step 2: Load Maps JS API
        if (!window.google?.maps) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
            if (existing) {
              const check = setInterval(() => {
                if (window.google?.maps) { clearInterval(check); resolve(); }
              }, 100);
              setTimeout(() => { clearInterval(check); reject(); }, 10000);
              return;
            }
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.onload = () => {
              // Wait for google.maps to be fully ready
              const check = setInterval(() => {
                if (window.google?.maps?.StreetViewPanorama) { clearInterval(check); resolve(); }
              }, 50);
              setTimeout(() => { clearInterval(check); reject(); }, 5000);
            };
            script.onerror = () => reject();
            document.head.appendChild(script);
          });
        }

        if (cancelled || !containerRef.current) return;

        // Step 3: Render interactive panorama using pano_id
        new google.maps.StreetViewPanorama(containerRef.current, {
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

  if (!apiKey) return null;

  // Fallback: static image
  if (status === 'error') {
    return (
      <div className="rounded-xl border border-beacon-border overflow-hidden mb-6">
        <img
          src={`https://maps.googleapis.com/maps/api/streetview?size=1200x400&location=${encodeURIComponent(fullAddress)}&fov=90&pitch=5&key=${apiKey}`}
          alt={`Street view of ${address}`}
          className="w-full h-[260px] object-cover"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-beacon-border overflow-hidden mb-6 relative">
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: 300 }}
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
          <span className="text-xs text-white/50">Loading Street View...</span>
        </div>
      )}
    </div>
  );
}
