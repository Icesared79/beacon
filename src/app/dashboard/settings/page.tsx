'use client';

import { Settings, User, Building2, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-beacon-text tracking-tight">Settings</h1>
        <p className="text-sm text-beacon-text-muted mt-1">
          Beacon configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <User size={15} className="text-beacon-primary" />
            Profile
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-beacon-text-muted uppercase tracking-wider mb-1">Name</label>
              <input
                type="text"
                defaultValue="ACCC Counselor"
                className="w-full px-3 py-2 rounded-lg border border-beacon-border bg-beacon-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-beacon-text-muted uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                defaultValue="counselor@consumercredit.com"
                className="w-full px-3 py-2 rounded-lg border border-beacon-border bg-beacon-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-beacon-text-muted uppercase tracking-wider mb-1">Role</label>
              <input
                type="text"
                defaultValue="Counselor"
                disabled
                className="w-full px-3 py-2 rounded-lg border border-beacon-border bg-beacon-surface-alt text-sm text-beacon-text-muted"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <Building2 size={15} className="text-beacon-primary" />
            Office
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-beacon-text-muted uppercase tracking-wider mb-1">Office Location</label>
              <select className="w-full px-3 py-2 rounded-lg border border-beacon-border bg-beacon-bg text-sm">
                <option>Newton, MA</option>
                <option>Chicago, IL</option>
                <option>Denver, CO</option>
                <option>Atlanta, GA</option>
                <option>Philadelphia, PA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-beacon-text-muted uppercase tracking-wider mb-1">Market Radius</label>
              <select className="w-full px-3 py-2 rounded-lg border border-beacon-border bg-beacon-bg text-sm">
                <option>25 miles</option>
                <option>50 miles</option>
                <option>100 miles</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <Bell size={15} className="text-beacon-primary" />
            Notifications
          </h2>
          <div className="space-y-3">
            {[
              'New households needing help in my community',
              'Status changes on my assignments',
              'Weekly community impact report',
            ].map((label) => (
              <label key={label} className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded border-beacon-border" />
                <span className="text-sm text-beacon-text-secondary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-beacon-border p-5">
          <h2 className="text-sm font-semibold text-beacon-text mb-4 flex items-center gap-2">
            <Settings size={15} className="text-beacon-primary" />
            Data
          </h2>
          <div className="space-y-2 text-sm text-beacon-text-secondary">
            <p>Atlas connection: <span className="text-emerald-600 font-medium">Connected</span></p>
            <p>Last sync: <span className="font-medium">March 24, 2026</span></p>
            <p>Records loaded: <span className="font-medium">18,247 households</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
