'use client'

import { useState } from 'react'

function buildStreetViewUrl(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
  apiKey: string | undefined,
): string | null {
  if (!apiKey) return null
  const parts = [address, city, state, zip]
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0 && p.toLowerCase() !== 'null')
  if (parts.length < 2) return null
  const clean = parts.join(', ').replace(/,\s*,/g, ',').trim()
  if (!/\d/.test(clean) || clean.length < 10) return null
  return (
    `https://maps.googleapis.com/maps/api/streetview` +
    `?size=1200x240` +
    `&location=${encodeURIComponent(clean)}` +
    `&key=${apiKey}` +
    `&return_error_codes=true`
  )
}

function Fallback() {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: 'var(--text-muted)',
        fontSize: 12,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      <span>Property view unavailable</span>
    </div>
  )
}

export function StreetView({
  address,
  city,
  state,
  zip,
}: {
  address: string
  city: string | null
  state: string
  zip: string | null
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = buildStreetViewUrl(address, city, state, zip, apiKey)
  const [imgError, setImgError] = useState(false)

  if (!url || imgError) {
    return <Fallback />
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <img
        src={url}
        alt={`Street view of ${address}`}
        onError={() => setImgError(true)}
        style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}
