'use client'

import { useRef } from 'react'

const STATE_ABBREV: Record<string, string> = {
  Pennsylvania: 'PA',
  'New York': 'NY',
  Florida: 'FL',
  Colorado: 'CO',
  Georgia: 'GA',
  Texas: 'TX',
  California: 'CA',
  Connecticut: 'CT',
  Massachusetts: 'MA',
  'New Jersey': 'NJ',
  Ohio: 'OH',
  Illinois: 'IL',
  Maryland: 'MD',
}

function buildStreetViewUrl(
  address: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  zip: string | null | undefined,
  apiKey: string
): string | null {
  if (!address || !apiKey || !state) return null

  // Assemble raw address from parts
  const parts: string[] = [address]
  const normalizedState = STATE_ABBREV[state] || state

  // Add city if present and not already baked into address field
  if (city && !address.toUpperCase().includes(city.toUpperCase())) {
    parts.push(city)
  }

  parts.push(normalizedState)

  // 5-digit zip only
  if (zip) {
    parts.push(zip.split('-')[0])
  }

  let clean = parts.join(', ')

  // Step 1: replace double commas (missing city field)
  clean = clean.replace(/,\s*,/g, ',')

  // Step 2: remove any "null", "undefined", "none" tokens
  clean = clean.replace(/\b(null|undefined|none)\b/gi, '')

  // Step 3: collapse multiple spaces and stray commas at start/end
  clean = clean.replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').replace(/\s+/g, ' ').trim()

  // Step 4: must have at least a street number + street name to be valid
  if (clean.length < 10 || !/\d/.test(clean)) return null

  // Step 5: encode for URL
  const encoded = encodeURIComponent(clean)

  const url = `https://maps.googleapis.com/maps/api/streetview?size=1200x240&location=${encoded}&key=${apiKey}&return_error_codes=true`

  // Debug logging
  console.log('[StreetView] Raw parts:', { address, city, state, zip })
  console.log('[StreetView] Cleaned address:', clean)
  console.log('[StreetView] Final URL:', url)

  return url
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
  const fallbackRef = useRef<HTMLDivElement>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const url = buildStreetViewUrl(address, city, state, zip, apiKey)

  if (!url) {
    return <Fallback />
  }

  return (
    <div>
      <img
        src={url}
        alt="Street view"
        style={{
          width: '100%',
          height: 220,
          objectFit: 'cover',
          borderRadius: 'var(--radius-lg)',
          display: 'block',
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          if (fallbackRef.current) fallbackRef.current.style.display = 'flex'
        }}
      />
      <div
        ref={fallbackRef}
        style={{
          display: 'none',
          height: 100,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          fontSize: 12,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>Property view unavailable</span>
      </div>
    </div>
  )
}

function Fallback() {
  return (
    <div style={{
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
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span>Property view unavailable</span>
    </div>
  )
}
