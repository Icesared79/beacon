'use client'

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

function normalizeState(state: string): string {
  return STATE_ABBREV[state] || state
}

function buildLocation(address: string, city: string | null, state: string, zip: string | null): string {
  const parts: string[] = []

  // Address field — some have city baked in like "5504 CREEKSTONE CT, LAKELAND"
  parts.push(address)

  // Only add city if it exists and isn't already in the address
  if (city && !address.toUpperCase().includes(city.toUpperCase())) {
    parts.push(city)
  }

  // State — normalize full names to abbreviations
  parts.push(normalizeState(state))

  // Zip — use 5-digit only, strip +4 extension
  if (zip) {
    parts.push(zip.split('-')[0])
  }

  return parts.join(', ')
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

  if (!apiKey || !address) return <Fallback />

  const location = buildLocation(address, city, state, zip)
  const embedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${encodeURIComponent(location)}`

  return (
    <iframe
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
    />
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
