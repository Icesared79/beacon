'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Phone {
  number: string
  type: string
  dnc: boolean
  carrier: string
  rank: number
}

interface Email {
  email: string
  rank: number
}

interface Person {
  first_name: string
  last_name: string
  full_name: string
  dob: string | null
  age: string | null
  deceased: boolean
  property_owner: boolean
  litigator: boolean
  mailing_address: {
    street: string
    city: string
    state: string
    zip: string
  } | null
  phones: Phone[]
  emails: Email[]
}

interface TracerResult {
  hit: boolean
  persons_count: number
  credits_deducted: number
  persons: Person[]
  error?: boolean
  message?: string
}

type LookupState = 'idle' | 'loading' | 'success' | 'empty' | 'error'

const STEPS = [
  'Locating property records...',
  'Searching ownership history...',
  'Cross-referencing contact data...',
  'Compiling results...',
]

const STEP_DELAYS = [800, 1400, 2000]

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return raw
}

export function ContactLookup({
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
  const [lookupState, setLookupState] = useState<LookupState>('idle')
  const [result, setResult] = useState<TracerResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const apiDone = useRef(false)
  const apiResult = useRef<TracerResult | null>(null)
  const minTimeElapsed = useRef(false)

  const finishLoading = useCallback(() => {
    const data = apiResult.current
    if (!data) return
    if (data.error) {
      setErrorMsg(data.message || 'Please try again in a moment')
      setLookupState('error')
    } else if (!data.hit || data.persons_count === 0) {
      setLookupState('empty')
    } else {
      setResult(data)
      setLookupState('success')
    }
  }, [])

  const handleLookup = async () => {
    setLookupState('loading')
    setActiveStep(0)
    setResult(null)
    setErrorMsg('')
    apiDone.current = false
    apiResult.current = null
    minTimeElapsed.current = false

    // Start step timers
    STEP_DELAYS.forEach((delay, i) => {
      setTimeout(() => setActiveStep(i + 1), delay)
    })

    // Minimum 2s loading
    setTimeout(() => {
      minTimeElapsed.current = true
      if (apiDone.current) finishLoading()
    }, 2000)

    try {
      const res = await fetch('/api/tracerfy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, city, state, zip }),
      })
      const data = await res.json()
      apiResult.current = res.ok ? data : { error: true, message: data.message || 'Lookup failed', hit: false, persons_count: 0, credits_deducted: 0, persons: [] }
    } catch {
      apiResult.current = { error: true, message: 'Unable to reach server', hit: false, persons_count: 0, credits_deducted: 0, persons: [] }
    }

    apiDone.current = true
    if (minTimeElapsed.current) finishLoading()
  }

  const reset = () => {
    setLookupState('idle')
    setResult(null)
    setErrorMsg('')
    setActiveStep(0)
  }

  // IDLE
  if (lookupState === 'idle') {
    return (
      <div>
        <button
          onClick={handleLookup}
          style={{
            padding: '8px 20px',
            fontSize: 12,
            fontWeight: 600,
            background: 'transparent',
            border: '1px solid var(--border-default)',
            color: 'var(--accent-blue-text)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Look Up Contact
        </button>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>Powered by Tracerfy</div>
      </div>
    )
  }

  // LOADING
  if (lookupState === 'loading') {
    return (
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}
      >
        {STEPS.map((step, i) => {
          const isComplete = i < activeStep
          const isActive = i === activeStep
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}>
              {/* Connecting line */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 4,
                    top: 12,
                    width: 1,
                    height: 20,
                    borderLeft: '1px dashed var(--border-subtle)',
                  }}
                />
              )}
              {/* Dot */}
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  marginTop: 2,
                  flexShrink: 0,
                  background: isComplete
                    ? 'var(--accent-teal)'
                    : isActive
                      ? 'var(--accent-blue)'
                      : 'transparent',
                  border: isComplete || isActive
                    ? 'none'
                    : '1.5px solid var(--text-faint)',
                  animation: isActive ? 'pulse 1.2s ease-in-out infinite' : undefined,
                }}
              />
              {/* Text */}
              <div
                style={{
                  fontSize: 12,
                  color: isComplete
                    ? 'var(--text-secondary)'
                    : isActive
                      ? 'var(--text-primary)'
                      : 'var(--text-faint)',
                  fontWeight: isActive ? 500 : 400,
                  paddingBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isActive ? 1 : isComplete ? 0.8 : 0.5,
                  transition: 'opacity 0.3s ease, color 0.3s ease',
                }}
              >
                {isComplete && <span style={{ fontSize: 10, color: 'var(--accent-teal)' }}>✓</span>}
                {step}
              </div>
            </div>
          )
        })}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
          }
        `}</style>
      </div>
    )
  }

  // SUCCESS
  if (lookupState === 'success' && result) {
    const person = result.persons[0]
    const phones = person?.phones?.filter((p) => p.number) ?? []
    const emails = person?.emails?.filter((e) => e.email) ?? []
    const mailingAddr = person?.mailing_address
    const hasMailingAddr = mailingAddr && mailingAddr.street

    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          animation: 'fadeIn 0.3s ease',
        }}
      >
        {/* Name header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {person?.full_name || 'Unknown'}
          </span>
          {person?.age && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Age {person.age}</span>
          )}
        </div>

        {/* Phones */}
        {phones.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
              Phone Numbers
            </div>
            {phones
              .sort((a, b) => a.rank - b.rank)
              .map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatPhone(p.number)}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)', textTransform: 'uppercase',
                    background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)',
                    border: '1px solid var(--badge-blue-border)',
                  }}>
                    {p.type}
                  </span>
                  {p.rank === 1 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)', textTransform: 'uppercase',
                      background: 'var(--badge-teal-bg)', color: 'var(--badge-teal-text)',
                      border: '1px solid var(--badge-teal-border)',
                    }}>
                      Primary
                    </span>
                  )}
                  {p.dnc && (
                    <span style={{ fontSize: 10, color: 'var(--accent-red-text)' }}>DNC</span>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Emails */}
        {emails.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
              Email Addresses
            </div>
            {emails
              .sort((a, b) => a.rank - b.rank)
              .map((e, i) => (
                <div key={i} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {e.email}
                </div>
              ))}
          </div>
        )}

        {/* Mailing address */}
        {hasMailingAddr && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
              Associated Addresses
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {mailingAddr.street}, {mailingAddr.city}, {mailingAddr.state} {mailingAddr.zip}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Powered by Tracerfy</span>
          <button
            onClick={reset}
            style={{
              fontSize: 11,
              color: 'var(--accent-blue-text)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            Search Again
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // EMPTY
  if (lookupState === 'empty') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>No contact information found</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>This property may have limited public records</div>
        <button
          onClick={reset}
          style={{
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: 600,
            background: 'transparent',
            border: '1px solid var(--border-default)',
            color: 'var(--accent-blue-text)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  // ERROR
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>Unable to complete lookup</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{errorMsg || 'Please try again in a moment'}</div>
      <button
        onClick={reset}
        style={{
          padding: '6px 16px',
          fontSize: 12,
          fontWeight: 600,
          background: 'transparent',
          border: '1px solid var(--border-default)',
          color: 'var(--accent-blue-text)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Try Again
      </button>
    </div>
  )
}
