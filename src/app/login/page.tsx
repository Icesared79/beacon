'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BeaconLogo } from '@/components/BeaconLogo'

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
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setError('Invalid email or password. Contact your administrator for access.')
        setLoading(false)
        return
      }

      // Hard redirect so the proxy sees the new cookie
      window.location.href = '/dashboard'
    } catch {
      setError('Unable to reach the server. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-beacon-bg flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B5EA8] dark:bg-[#0F2847] flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <BeaconLogo className="h-10 w-10 text-white" />
          <div>
            <p className="text-white font-semibold text-xl tracking-tight">Beacon</p>
            <p className="text-blue-200 text-sm">by American Consumer Credit Counseling</p>
          </div>
        </div>

        {/* Middle statement */}
        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-6">
            Find the families who need us before they know to ask.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Beacon identifies families in financial distress across ACCC&apos;s communities
            — giving counselors a proactive way to offer help before families reach
            crisis stage and lose everything.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-white text-2xl font-bold font-mono">31,007</p>
            <p className="text-blue-200 text-sm mt-1">Families identified</p>
          </div>
          <div>
            <p className="text-white text-2xl font-bold font-mono">7,718</p>
            <p className="text-blue-200 text-sm mt-1">Need urgent help</p>
          </div>
          <div>
            <p className="text-white text-2xl font-bold font-mono">40+</p>
            <p className="text-blue-200 text-sm mt-1">Communities served</p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <BeaconLogo className="h-8 w-8" color="var(--beacon-primary)" />
            <div>
              <p className="text-beacon-primary font-semibold text-lg">Beacon</p>
              <p className="text-beacon-text-muted text-xs">by American Consumer Credit Counseling</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-beacon-text mb-2">Sign in to Beacon</h2>
          <p className="text-beacon-text-secondary text-sm mb-8">
            Access is restricted to ACCC staff. Contact your administrator if you need
            access.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-beacon-text-secondary mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@consumercredit.com"
                className="w-full px-4 py-3 border border-beacon-border rounded-lg text-sm bg-beacon-surface text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/30 focus:border-transparent"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-beacon-text-secondary">
                  Password
                </label>
                <a href="#" className="text-sm text-beacon-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-beacon-border rounded-lg text-sm bg-beacon-surface text-beacon-text focus:outline-none focus:ring-2 focus:ring-beacon-primary/30 focus:border-transparent"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-beacon-primary text-white py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-beacon-border">
            <p className="text-xs text-beacon-text-muted text-center">
              Beacon is a community outreach platform operated by Red Planet
              Data exclusively for American Consumer Credit Counseling staff.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
