'use client'

import { useEffect, useState } from 'react'

export function StreetView({ address }: { address: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [failed, setFailed] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || !address) {
      setFailed(true)
      return
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
          setCoords(data.results[0].geometry.location)
        } else {
          setFailed(true)
        }
      })
      .catch(() => setFailed(true))
  }, [address, apiKey])

  if (failed || !apiKey) {
    return <Fallback />
  }

  if (!coords) {
    // Loading state — subtle placeholder
    return (
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        height: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 12,
      }}>
        Loading street view...
      </div>
    )
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${coords.lat},${coords.lng}&heading=210&pitch=10&fov=90`

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
