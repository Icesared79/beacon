'use client'

import { useEffect, useRef, useState } from 'react'

function cleanAddress(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
): string | null {
  const parts = [address, city, state, zip]
    .map(p => (p ?? '').trim())
    .filter(p => p.length > 0 && p.toLowerCase() !== 'null')

  if (parts.length < 2) return null

  const joined = parts.join(', ')
  const clean = joined.replace(/,\s*,/g, ',').trim()

  if (!/\d/.test(clean) || clean.length < 10) return null

  return clean
}

let mapsLoading = false
let mapsLoaded = false
const mapsCallbacks: (() => void)[] = []

function loadMapsApi(apiKey: string): Promise<void> {
  if (mapsLoaded) return Promise.resolve()

  return new Promise((resolve) => {
    mapsCallbacks.push(resolve)

    if (mapsLoading) return

    mapsLoading = true
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=streetView`
    script.async = true
    script.onload = () => {
      mapsLoaded = true
      mapsCallbacks.forEach(cb => cb())
      mapsCallbacks.length = 0
    }
    document.head.appendChild(script)
  })
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const clean = cleanAddress(address, city, state, zip)

  useEffect(() => {
    if (!clean || !apiKey || !containerRef.current) return

    let cancelled = false

    loadMapsApi(apiKey).then(() => {
      if (cancelled || !containerRef.current) return

      const geocoder = new google.maps.Geocoder()

      geocoder.geocode({ address: clean }, (results, status) => {
        if (cancelled || !containerRef.current) return

        if (status !== 'OK' || !results || results.length === 0) {
          setFailed(true)
          return
        }

        const location = results[0].geometry.location

        const sv = new google.maps.StreetViewService()

        sv.getPanorama(
          { location, radius: 100 },
          (data, svStatus) => {
            if (cancelled || !containerRef.current) return

            if (svStatus !== 'OK' || !data?.location?.latLng) {
              setFailed(true)
              return
            }

            new google.maps.StreetViewPanorama(containerRef.current!, {
              position: data.location.latLng,
              pov: { heading: 0, pitch: 0 },
              zoom: 1,
              addressControl: false,
              fullscreenControl: false,
              motionTracking: false,
              motionTrackingControl: false,
              linksControl: false,
            })
          },
        )
      })
    })

    return () => {
      cancelled = true
    }
  }, [clean, apiKey])

  if (!clean || !apiKey) {
    return <Fallback />
  }

  if (failed) {
    return <Fallback />
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '220px',
        borderRadius: '6px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        background: 'var(--bg-elevated)',
      }}
    />
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
