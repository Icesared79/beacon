'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BeaconLogo } from '@/components/BeaconLogo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // TODO: Replace with Supabase auth
    if (email && password) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } else {
      setError('Please enter your email and password');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 px-4">
      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#1B5EA8 1px, transparent 1px), linear-gradient(90deg, #1B5EA8 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo and heading */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BeaconLogo size={56} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-beacon-text">
            Beacon
          </h1>
          <p className="mt-1.5 text-sm text-beacon-text-muted">
            Financial distress intelligence
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-xl shadow-sm border border-beacon-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-beacon-text-secondary mb-1.5 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="counselor@consumercredit.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-beacon-border bg-beacon-bg text-sm text-beacon-text placeholder:text-beacon-text-muted focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 focus:border-beacon-primary transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-beacon-text-secondary mb-1.5 uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-beacon-border bg-beacon-bg text-sm text-beacon-text placeholder:text-beacon-text-muted focus:outline-none focus:ring-2 focus:ring-beacon-primary/20 focus:border-beacon-primary transition-all"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs text-beacon-critical font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: loading ? '#94A3B8' : '#1B5EA8' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Tagline */}
        <p className="text-center mt-6 text-xs text-beacon-text-muted">
          For ACCC counselors only — invite required
        </p>

        {/* Powered by */}
        <p className="text-center mt-8 text-[10px] text-beacon-text-muted/60 tracking-wide">
          Powered by Red Planet Data
        </p>
      </div>
    </div>
  );
}
