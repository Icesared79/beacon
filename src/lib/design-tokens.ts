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
  lis_pendens: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Foreclosure Risk' },
  tax_delinquency: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Tax Delinquent' },
  llc_dissolved: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'LLC Dissolved' },
  bankruptcy: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Bankruptcy' },
  long_hold: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', label: 'Established Homeowner' },
  high_equity: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', label: 'Equity at Risk' },
  probate: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Probate' },
} as const;

// Badge color tokens by signal type — case-insensitive substring match
const RED_SIGNALS = ['foreclosure', 'tax_lien', 'tax lien', 'lis_pendens', 'lis pendens', 'sheriff_sale', 'reo', 'active_foreclosure'];
const AMBER_SIGNALS = ['bankruptcy', 'tax_delinquency', 'tax delinquency', 'probate', 'hmda_loan_denial', 'hmda loan denial', 'pre_foreclosure', 'notice_of_default', 'mortgage_default', 'distress'];
const TEAL_SIGNALS = ['high_equity', 'high equity', 'high_equity_confirmed', 'long_hold', 'long hold', 'ownership', 'equity'];
const BLUE_SIGNALS = ['high_vacancy', 'high vacancy', 'vacancy'];

export type BadgeColor = 'red' | 'amber' | 'teal' | 'blue' | 'gray';

export const BADGE_STYLES: Record<BadgeColor, { bg: string; text: string }> = {
  red:   { bg: 'bg-red-100 dark:bg-red-900/30',   text: 'text-red-700 dark:text-red-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  teal:  { bg: 'bg-teal-100 dark:bg-teal-900/30',  text: 'text-teal-700 dark:text-teal-400' },
  blue:  { bg: 'bg-blue-100 dark:bg-blue-900/30',  text: 'text-blue-700 dark:text-blue-400' },
  gray:  { bg: 'bg-blue-100 dark:bg-blue-900/30',  text: 'text-blue-700 dark:text-blue-400' },
};

export function getSignalBadgeColor(signalType: string): BadgeColor {
  const lower = signalType.toLowerCase();
  // Most specific first: check longer matches before shorter
  const sorted = (arr: string[]) => [...arr].sort((a, b) => b.length - a.length);
  if (sorted(RED_SIGNALS).some(s => lower.includes(s))) return 'red';
  if (sorted(AMBER_SIGNALS).some(s => lower.includes(s))) return 'amber';
  if (sorted(TEAL_SIGNALS).some(s => lower.includes(s))) return 'teal';
  if (sorted(BLUE_SIGNALS).some(s => lower.includes(s))) return 'blue';
  return 'gray';
}

export const STATUS_FLOW = [
  { value: 'new', label: 'New Referral', color: '#2563EB' },
  { value: 'reviewed', label: 'Needs Counseling', color: '#CA8A04' },
  { value: 'contacted', label: 'Outreach Made', color: '#D97706' },
  { value: 'in_counseling', label: 'In Counseling', color: '#7C3AED' },
  { value: 'enrolled', label: 'In Program', color: '#16A34A' },
  { value: 'not_qualified', label: 'Not Qualified', color: '#94A3B8' },
] as const;
