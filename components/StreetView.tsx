'use client'

import { useEffect, useRef, useState } from 'react'

function cleanAddress(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
): string | null {
  const parts = [address, city, state, zip]
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0 && p.toLowerCase() !== 'null')
  if (parts.length < 2) return null
  const clean = parts.join(', ').replace(/,\s*,/g, ',').trim()
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.onload = () => {
      mapsLoaded = true
      mapsCallbacks.forEach((cb) => cb())
      mapsCallbacks.length = 0
    }
    document.head.appendChild(script)
  })
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const clean = cleanAddress(address, city, state, zip)

  useEffect(() => {
    if (!apiKey || !clean) {
      setStatus('error')
      return
    }
    let cancelled = false

    async function init() {
      try {
        // Get pano_id from metadata — no Geocoding API needed
        const metaRes = await fetch(
          `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(clean!)}&key=${apiKey}`,
        )
        const meta = await metaRes.json()
        if (cancelled || meta.status !== 'OK' || !meta.pano_id) {
          setStatus('error')
          return
        }

        await loadMapsApi(apiKey!)
        if (cancelled || !containerRef.current) return

        new (window as any).google.maps.StreetViewPanorama(containerRef.current, {
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
        })

        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [clean, apiKey])

  if (!apiKey || !clean || status === 'error') {
    return <Fallback />
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: 220 }} />
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-elevated)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading Street View...</span>
        </div>
      )}
    </div>
  )
}
