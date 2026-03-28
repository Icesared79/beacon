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

function cleanAddress(
  address: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  zip: string | null | undefined,
): string | null {
  if (!address || !state) return null

  const parts: string[] = [address]
  const normalizedState = STATE_ABBREV[state] || state

  if (city && !address.toUpperCase().includes(city.toUpperCase())) {
    parts.push(city)
  }

  parts.push(normalizedState)

  if (zip) {
    parts.push(zip.split('-')[0])
  }

  let clean = parts.join(', ')
  clean = clean.replace(/,\s*,/g, ',')
  clean = clean.replace(/\b(null|undefined|none)\b/gi, '')
  clean = clean.replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').replace(/\s+/g, ' ').trim()

  if (clean.length < 10 || !/\d/.test(clean)) return null

  return clean
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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const clean = cleanAddress(address, city, state, zip)

  if (!clean || !apiKey) {
    return <Fallback />
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${encodeURIComponent(clean)}`

  console.log('[StreetView] Cleaned address:', clean)
  console.log('[StreetView] Embed URL:', embedUrl)

  return (
    <div>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        style={{
          width: '100%',
          height: 220,
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          display: 'block',
        }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        onError={() => {
          if (iframeRef.current) iframeRef.current.style.display = 'none'
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
