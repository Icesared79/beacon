export const beaconTheme = {
  colors: {
    primary: '#1B5EA8',
    primaryDark: '#144A87',
    primaryLight: '#2B74C8',
    primaryMuted: '#EBF2FB',

    accent: '#E8540A',
    accentLight: '#FEF0E8',

    critical: '#DC2626',
    high: '#D97706',
    warning: '#CA8A04',
    info: '#2563EB',

    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    borderDark: '#CBD5E1',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',

    success: '#16A34A',
    successLight: '#DCFCE7',
  },
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
} as const;

export const SIGNAL_COLORS = {
  lis_pendens: { bg: 'bg-red-100', text: 'text-red-700', label: 'Foreclosure Risk' },
  tax_delinquency: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Tax Delinquent' },
  llc_dissolved: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'LLC Dissolved' },
  bankruptcy: { bg: 'bg-red-100', text: 'text-red-800', label: 'Bankruptcy' },
  long_hold: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Established Homeowner' },
  high_equity: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Equity at Risk' },
  probate: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Probate' },
} as const;

export const STATUS_FLOW = [
  { value: 'new', label: 'New Referral', color: '#2563EB' },
  { value: 'reviewed', label: 'Needs Counseling', color: '#CA8A04' },
  { value: 'contacted', label: 'Outreach Made', color: '#D97706' },
  { value: 'in_counseling', label: 'In Counseling', color: '#7C3AED' },
  { value: 'enrolled', label: 'In Program', color: '#16A34A' },
  { value: 'not_qualified', label: 'Not Qualified', color: '#94A3B8' },
] as const;
