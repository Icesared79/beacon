'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Map,
  Settings,
  Menu,
  X,
  LogOut,
  Megaphone,
} from 'lucide-react'
import { BeaconLogo } from './BeaconLogo'
import { cn } from '@/lib/utils'
import { getBrowserClient } from '@/lib/supabase'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Households', href: '/dashboard/prospects', icon: Users },
  { name: 'Community Map', href: '/dashboard/markets', icon: Map },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface BeaconUser {
  full_name: string
  role: string
  email: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<BeaconUser | null>(null)

  useEffect(() => {
    async function loadUser() {
      const supabase = getBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        // Try to get beacon_users record
        const { data } = await supabase
          .from('beacon_users')
          .select('full_name, role, email')
          .eq('id', session.user.id)
          .single()

        if (data) {
          setUser(data)
        } else {
          // Fallback to auth metadata
          setUser({
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              'User',
            role: 'counselor',
            email: session.user.email || '',
          })
        }
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    const supabase = getBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'ACCC Counselor'
  const displayRole = user?.role || 'counselor'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <BeaconLogo className="h-8 w-8" color="#1B5EA8" />
        <div>
          <p className="font-semibold text-gray-900 text-base leading-tight">Beacon</p>
          <p className="text-gray-400 text-xs">by ACCC</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-beacon-primary-muted text-beacon-primary-dark'
                  : 'text-beacon-text-secondary hover:bg-beacon-surface-alt hover:text-beacon-text'
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="mt-auto px-6 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#1B5EA8] flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {displayRole.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-md hover:bg-beacon-surface-alt text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-300 mt-3">Powered by Red Planet Data</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-beacon-surface shadow-md border border-beacon-border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-beacon-surface border-r border-beacon-border transform transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-beacon-surface border-r border-beacon-border">
        {navContent}
      </aside>
    </>
  )
}
