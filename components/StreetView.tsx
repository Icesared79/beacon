'use client'

export function StreetView({
  address,
  city,
  state,
  zip,
}: {
  address: string
  city: string
  state: string
  zip?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) return <Fallback />

  // Use raw address fields from Atlas — no title-casing, no formatting
  // Google's geocoder handles uppercase addresses fine
  const rawLocation = `${address}, ${city}, ${state}${zip ? ' ' + zip : ''}`
  const embedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${encodeURIComponent(rawLocation)}&heading=210&pitch=10&fov=90`

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
