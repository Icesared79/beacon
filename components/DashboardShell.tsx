'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/households', label: 'Households' },
  { href: '/dashboard/coverage', label: 'Coverage' },
]

export function DashboardShell({
  children,
  lastUpdated,
}: {
  children: React.ReactNode
  lastUpdated?: string
}) {
  const pathname = usePathname()

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Topbar */}
      <header
        style={{
          height: 'var(--topbar-height)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-blue)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: 'var(--text-primary)',
              }}
            >
              BEACON
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    borderRadius: 4,
                    padding: '5px 12px',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease, background 0.15s ease',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <ThemeToggle />
          {formattedDate && (
            <>
              <div
                style={{
                  width: 1,
                  height: 16,
                  background: 'var(--border-subtle)',
                  margin: '0 12px',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.03em',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent-teal)',
                    display: 'inline-block',
                  }}
                />
                Atlas data · Updated {formattedDate}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>{children}</main>
    </div>
  )
}
