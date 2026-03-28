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

export function titleCase(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const ENTITY_PATTERNS = [
  /\bLLC\b/i,
  /\bINC\b/i,
  /\bCORP\b/i,
  /\bAUTHORITY\b/i,
  /\bHOUSING AUTH\b/i,
  /\bASSOCIATION\b/i,
  /\bFOUNDATION\b/i,
  /\bCHURCH\b/i,
  /\bPARISH\b/i,
]

export function isEntity(name: string | null | undefined): boolean {
  if (!name) return true
  return ENTITY_PATTERNS.some((p) => p.test(name))
}

export function isFilteredOut(h: {
  owner_name: string | null
  assessed_value: number | null
  estimated_equity: number | null
}): boolean {
  if (!h.owner_name) return true
  if (isEntity(h.owner_name)) return true
  if (h.assessed_value != null && h.assessed_value < 5000) return true
  if (h.estimated_equity != null && h.estimated_equity <= 0) return true
  return false
}

export function signalLabel(code: string): string {
  return code
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function signalColor(code: string): 'red' | 'amber' | 'blue' {
  if (/foreclosure|tax.?lien|distress/i.test(code)) return 'red'
  if (/bankruptcy|probate|delinquen/i.test(code)) return 'amber'
  return 'blue'
}

export function priorityGroup(score: number, hasDistress: boolean): 'critical' | 'high' | 'monitor' {
  if (score >= 70 && hasDistress) return 'critical'
  if (score >= 50) return 'high'
  return 'monitor'
}
