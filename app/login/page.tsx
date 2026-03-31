'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid credentials.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel — branding */}
      <div
        style={{
          width: '50%',
          background: '#1B5EA8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 48,
        }}
        className="hidden lg:flex"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/beacon-logo.svg"
            alt="Beacon"
            width={36}
            height={36}
            style={{ borderRadius: '8px' }}
          />
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 18, letterSpacing: '0.02em' }}>Beacon</p>
            <p style={{ color: '#93c5fd', fontSize: 12 }}>by American Consumer Credit Counseling</p>
          </div>
        </div>

        <div>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 24 }}>
            Find the families who need us before they know to ask.
          </h1>
          <p style={{ color: '#93c5fd', fontSize: 16, lineHeight: 1.6 }}>
            Beacon identifies families in financial distress across ACCC&apos;s communities
            — giving counselors a proactive way to offer help before families reach
            crisis stage and lose everything.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <div>
            <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>754K+</p>
            <p style={{ color: '#93c5fd', fontSize: 12, marginTop: 4 }}>Families identified</p>
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>371K+</p>
            <p style={{ color: '#93c5fd', fontSize: 12, marginTop: 4 }}>Need urgent help</p>
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>5</p>
            <p style={{ color: '#93c5fd', fontSize: 12, marginTop: 4 }}>States covered</p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--bg-base)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
            <img
              src="/beacon-logo.svg"
              alt="Beacon"
              width={36}
              height={36}
              style={{ borderRadius: '8px' }}
            />
            <div>
              <p style={{ color: 'var(--accent-blue-text)', fontWeight: 600, fontSize: 16 }}>Beacon</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>by American Consumer Credit Counseling</p>
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Sign in to Beacon</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>
            Access is restricted to ACCC staff. Contact your administrator if you need access.
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@consumercredit.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                <a href="#" style={{ fontSize: 12, color: 'var(--accent-blue-text)', textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: 'var(--accent-red-text)', fontWeight: 500, marginBottom: 16 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'var(--accent-blue)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              Beacon is a community outreach platform operated by Red Planet
              Data exclusively for American Consumer Credit Counseling staff.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
