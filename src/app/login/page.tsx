'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BeaconLogo } from '@/components/BeaconLogo'
import { getBrowserClient } from '@/lib/supabase'

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

    const supabase = getBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Invalid email or password. Contact your administrator for access.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B5EA8] flex-col justify-between p-12">
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
            <BeaconLogo className="h-8 w-8" color="#1B5EA8" />
            <div>
              <p className="text-[#1B5EA8] font-semibold text-lg">Beacon</p>
              <p className="text-gray-500 text-xs">by American Consumer Credit Counseling</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to Beacon</h2>
          <p className="text-gray-500 text-sm mb-8">
            Access is restricted to ACCC staff. Contact your administrator if you need
            access.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@consumercredit.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5EA8] focus:border-transparent"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm text-[#1B5EA8] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5EA8] focus:border-transparent"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B5EA8] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#144A87] transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Beacon is a community outreach platform operated by Red Planet
              Data exclusively for American Consumer Credit Counseling staff.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
