'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BeaconLogo } from './BeaconLogo'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/dashboard/households', label: 'Households', icon: '◉' },
  { href: '/dashboard/coverage', label: 'Coverage', icon: '◎' },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[var(--beacon-bg)]">
      {/* Top nav */}
      <header className="bg-[var(--beacon-surface)] border-b border-[var(--beacon-border)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BeaconLogo className="h-7 w-7" color="var(--beacon-primary)" />
            <span className="font-semibold text-[var(--beacon-text)] text-lg tracking-tight">Beacon</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--beacon-primary-muted)] text-[var(--beacon-primary)]'
                      : 'text-[var(--beacon-text-secondary)] hover:text-[var(--beacon-text)] hover:bg-[var(--beacon-surface-alt)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="text-xs text-[var(--beacon-text-muted)]">ACCC Staff Portal</div>
      </header>

      {/* Content */}
      <main className="p-6 max-w-[1400px] mx-auto">{children}</main>
    </div>
  )
}
