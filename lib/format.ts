export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatCompactCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function formatSalePrice(price: number | null | undefined): string {
  if (price == null) return '—'
  if (price <= 1) return 'Transfer (non-market)'
  return formatCurrency(price)
}

export function formatAddress(address: string): string {
  return address.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim()
}

export function titleCase(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export { isEntityName } from '@/lib/format-name'
export { formatOwnerName } from '@/lib/format-name'

const SIGNAL_NAMES: Record<string, string> = {
  hmda_loan_denial: 'HMDA Loan Denial',
  high_vacancy: 'High Vacancy',
  long_hold_confirmed: 'Long Hold',
  distress_flagged: 'Distress Flagged',
  high_equity_confirmed: 'High Equity',
}

export function signalLabel(code: string): string {
  if (SIGNAL_NAMES[code]) return SIGNAL_NAMES[code]
  return code
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const SEVERITY_LABELS: Record<string, string> = {
  distress: 'Distress',
  property: 'Property',
  financial: 'Financial',
  critical: 'Critical',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  warning: 'Warning',
}

export function severityLabel(raw: string): string {
  return SEVERITY_LABELS[raw.toLowerCase()] || titleCase(raw)
}

export function getSignalBadgeStyle(code: string, _unused?: string): {
  background: string; color: string; border: string
} {
  const c = code.toLowerCase()

  // Amber: hmda_loan_denial, distress_flagged
  if (c.includes('hmda') || c.includes('distress')) {
    return {
      background: 'var(--badge-amber-bg)',
      color: 'var(--badge-amber-text)',
      border: '1px solid var(--badge-amber-border)',
    }
  }
  // Blue: high_vacancy
  if (c.includes('vacancy') || c.includes('vacant')) {
    return {
      background: 'var(--badge-blue-bg)',
      color: 'var(--badge-blue-text)',
      border: '1px solid var(--badge-blue-border)',
    }
  }
  // Teal: high_equity_confirmed, long_hold_confirmed (and default)
  return {
    background: 'var(--badge-teal-bg)',
    color: 'var(--badge-teal-text)',
    border: '1px solid var(--badge-teal-border)',
  }
}

const CRITICAL_KEYWORDS = [
  'foreclosure', 'tax_lien', 'lis_pendens', 'sheriff', 'reo',
]

const HIGH_NEED_KEYWORDS = [
  'hmda_loan_denial', 'distress_flagged',
  'bankruptcy', 'probate', 'tax_delinq',
]

export function getHouseholdGroup(signal_codes: string[]): 'critical' | 'high_need' | 'monitor' {
  const codes = signal_codes.map((s) => s.toLowerCase())
  if (CRITICAL_KEYWORDS.some((k) => codes.some((c) => c.includes(k)))) return 'critical'
  if (HIGH_NEED_KEYWORDS.some((k) => codes.some((c) => c.includes(k)))) return 'high_need'
  return 'monitor'
}

export function getRiskLevel(signals: string[]): 'Urgent' | 'High Need' | 'Moderate' {
  const group = getHouseholdGroup(signals)
  if (group === 'critical') return 'Urgent'
  if (group === 'high_need') return 'High Need'
  return 'Moderate'
}

export function sortSignalsBySeverity(codes: string[]): string[] {
  return [...codes].sort((a, b) => signalSeverityRank(a) - signalSeverityRank(b))
}

function signalSeverityRank(code: string): number {
  const c = code.toLowerCase()
  if (CRITICAL_KEYWORDS.some((k) => c.includes(k))) return 0
  if (HIGH_NEED_KEYWORDS.some((k) => c.includes(k))) return 1
  return 2
}

export function formatDistressDuration(dateStr: string | null): string {
  if (!dateStr) return '—'
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days < 1) return '<1d'
  if (days < 30) return `${days}d`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months}mo`
  }
  const years = Math.floor(days / 365)
  return `${years}y`
}
