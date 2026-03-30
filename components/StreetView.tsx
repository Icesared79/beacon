'use client'

function buildStreetViewUrl(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
  apiKey: string | undefined,
): string | null {
  if (!apiKey) return null

  const parts = [address, city, state, zip]
    .map(p => (p ?? '').trim())
    .filter(p => p.length > 0 && p.toLowerCase() !== 'null')

  if (parts.length < 2) return null

  const joined = parts.join(', ')
  const clean = joined.replace(/,\s*,/g, ',').trim()

  if (!/\d/.test(clean) || clean.length < 10) return null

  const encoded = encodeURIComponent(clean)

  return (
    `https://maps.googleapis.com/maps/api/streetview`
    + `?size=1200x240`
    + `&location=${encoded}`
    + `&key=${apiKey}`
    + `&return_error_codes=true`
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
  const url = buildStreetViewUrl(
    address,
    city,
    state,
    zip,
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  )

  console.log('[StreetView] url:', url)

  if (!url) {
    return <Fallback />
  }

  return (
    <>
      <img
        src={url}
        alt="Property street view"
        style={{
          width: '100%',
          height: '220px',
          objectFit: 'cover',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          display: 'block',
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          const fb = document.getElementById('sv-fallback')
          if (fb) fb.style.display = 'flex'
        }}
      />
      <div
        id="sv-fallback"
        style={{
          display: 'none',
          height: '100px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '12px',
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
    </>
  )
}

function Fallback() {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
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
