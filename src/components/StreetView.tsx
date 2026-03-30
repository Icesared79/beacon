'use client';

import { useState } from 'react';

interface StreetViewProps {
  address: string;
  city: string;
  state: string;
  zip: string;
}

function buildStreetViewUrl(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
  apiKey: string | undefined
): string | null {
  if (!apiKey) return null;
  const parts = [address, city, state, zip]
    .map(p => (p ?? '').trim())
    .filter(p => p.length > 0 && p.toLowerCase() !== 'null');
  if (parts.length < 2) return null;
  const clean = parts.join(', ').replace(/,\s*,/g, ',').trim();
  if (!/\d/.test(clean) || clean.length < 10) return null;
  return `https://maps.googleapis.com/maps/api/streetview`
    + `?size=1200x240`
    + `&location=${encodeURIComponent(clean)}`
    + `&key=${apiKey}`
    + `&return_error_codes=true`;
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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const url = buildStreetViewUrl(address, city, state, zip, apiKey);
  const [imgError, setImgError] = useState(false);

  if (!url || imgError) {
    return <Fallback />;
  }

  return (
    <div style={{ borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden', marginBottom: 24, border: '1px solid var(--beacon-border)' }}>
      <img
        src={url}
        alt={`Street view of ${address}`}
        onError={() => setImgError(true)}
        style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}
