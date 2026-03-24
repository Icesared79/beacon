'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Map,
  Settings,
  Menu,
  X,
  LogOut,
  Megaphone,
} from 'lucide-react';
import { BeaconLogo } from './BeaconLogo';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Prospects', href: '/dashboard/prospects', icon: Users },
  { name: 'Markets', href: '/dashboard/markets', icon: Map },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-beacon-border">
        <BeaconLogo size={28} />
        <span className="text-lg font-semibold tracking-tight text-beacon-primary-dark">
          Beacon
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
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
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-beacon-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-beacon-primary-muted flex items-center justify-center">
            <span className="text-xs font-semibold text-beacon-primary">AC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-beacon-text truncate">ACCC Counselor</p>
            <p className="text-xs text-beacon-text-muted">counselor</p>
          </div>
          <button className="p-1.5 rounded-md hover:bg-beacon-surface-alt text-beacon-text-muted hover:text-beacon-text-secondary transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Powered by */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-beacon-text-muted tracking-wide">
          Powered by Red Planet Data
        </p>
      </div>
    </div>
  );

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
  );
}
