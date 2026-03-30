const ENTITY_KEYWORDS = [
  'LLC', 'L.L.C', 'INC', 'CORP', 'CORPORATION', 'LTD', 'LP', 'LLP',
  'AUTHORITY', 'HOUSING AUTH', 'ASSOCIATION', 'FOUNDATION',
  'CHURCH', 'PARISH', 'FUND', 'TRUST', 'PROPERTIES', 'REALTY',
  'MANAGEMENT', 'HOLDINGS', 'DEVELOPMENT', 'PARTNERS', 'GROUP',
  'SERVICES', 'ENTERPRISES', 'SOLUTIONS', 'REGULAR',
  'DEPARTMENT', 'DEPT', 'CITY OF', 'COUNTY OF', 'STATE OF',
  'BUREAU', 'AGENCY', 'COMMISSION', 'BOARD OF', 'OFFICE OF',
  'PROTECTION', 'ENVIRONMENTAL', 'MUNICIPAL', 'FEDERAL',
  'NATIONAL', 'AUTHORITY OF', 'DISTRICT',
]

export function isEntityName(name: string | null | undefined): boolean {
  if (!name || name.trim().length < 2) return true
  const upper = name.toUpperCase()
  return ENTITY_KEYWORDS.some((kw) => upper.includes(kw))
}

export function formatOwnerName(name: string): string {
  // Strip ownership percentage suffixes
  name = name.replace(/\s+\d+\.?\d*%(\s+\d+\.?\d*%)*\s*$/g, '').trim()

  if (name.includes(',')) {
    const [last, ...firstParts] = name.split(',')
    const first = firstParts.join(' ').trim()
    if (first) {
      return toTitleCase(first) + ' ' + toTitleCase(last)
    }
  }
  return toTitleCase(name)
}

function toTitleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getSeverityBadgeClass(severity: string): 'red' | 'amber' | 'teal' | 'blue' {
  const s = severity.toLowerCase()
  if (['distress', 'critical', 'foreclosure', 'tax_lien'].includes(s)) return 'red'
  if (['hmda_loan_denial', 'distress_flagged', 'financial', 'bankruptcy', 'tax_delinquency', 'probate', 'warning', 'high', 'hmda'].includes(s)) return 'amber'
  if (['high_equity_confirmed', 'long_hold_confirmed', 'ownership', 'equity', 'high_equity', 'property'].includes(s)) return 'teal'
  if (['high_vacancy'].includes(s)) return 'blue'
  return 'blue'
}

export function formatMailingAddress(addr: string): string {
  if (!addr) return addr
  return addr
    .split(' ')
    .map((word) => {
      if (/^[A-Z]{2}$/.test(word)) return word
      if (/^\d+(-\d+)?$/.test(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
