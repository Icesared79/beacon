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
  'hmda loan denial': 'HMDA Loan Denial',
  high_vacancy: 'High Vacancy',
  'high vacancy': 'High Vacancy',
  tax_lien: 'Tax Lien',
  tax_delinquency: 'Tax Delinquency',
  foreclosure: 'Foreclosure',
  bankruptcy: 'Bankruptcy',
  probate: 'Probate',
  high_equity: 'High Equity',
  high_equity_confirmed: 'High Equity',
  long_hold_confirmed: 'Long Hold',
  distress_flagged: 'Distress Flagged',
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

export type SignalBadgeColor = 'red' | 'amber' | 'teal' | 'blue'

export function signalBadgeColor(code: string): SignalBadgeColor {
  const c = code.toLowerCase()
  // RED: foreclosure, tax_lien, lis_pendens, sheriff_sale, reo, active_foreclosure
  if (/foreclosure|tax.?lien|lis.?pendens|sheriff.?sale|reo|active.?foreclosure/i.test(c)) return 'red'
  // AMBER: bankruptcy, tax_delinquency, probate, hmda, distress, pre_foreclosure, notice_of_default, mortgage_default
  if (/bankruptcy|tax.?delinquen|probate|hmda|distress|pre.?foreclosure|notice.?of.?default|mortgage.?default/i.test(c)) return 'amber'
  // TEAL: high_equity, long_hold, ownership, equity
  if (/high.?equity|long.?hold|ownership|equity/i.test(c)) return 'teal'
  // BLUE: high_vacancy, vacancy
  if (/vacanc/i.test(c)) return 'blue'
  return 'blue'
}

const URGENT_SIGNALS = [
  'foreclosure', 'tax_lien', 'tax lien', 'active foreclosure',
  'lis pendens', 'sheriff sale', 'reo',
]

const HIGH_NEED_SIGNALS = [
  'bankruptcy', 'tax_delinquency', 'tax delinquency', 'probate',
  'hmda_loan_denial', 'hmda loan denial', 'pre_foreclosure',
  'pre-foreclosure', 'notice of default',
]

export function getRiskLevel(signals: string[]): 'Urgent' | 'High Need' | 'Moderate' {
  const normalized = signals.map((s) => s.toLowerCase().trim())
  if (normalized.some((s) => URGENT_SIGNALS.some((u) => s.includes(u)))) return 'Urgent'
  if (normalized.some((s) => HIGH_NEED_SIGNALS.some((h) => s.includes(h)))) return 'High Need'
  return 'Moderate'
}

export function priorityGroupBySignals(signalCodes: string[]): 'critical' | 'high' | 'monitor' {
  const risk = getRiskLevel(signalCodes)
  if (risk === 'Urgent') return 'critical'
  if (risk === 'High Need') return 'high'
  return 'monitor'
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
