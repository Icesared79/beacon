const ENTITY_KEYWORDS = [
  'LLC', 'L.L.C', 'INC', 'CORP', 'CORPORATION', 'LTD', 'LP', 'LLP',
  'AUTHORITY', 'HOUSING AUTH', 'ASSOCIATION', 'FOUNDATION',
  'CHURCH', 'PARISH', 'FUND', 'TRUST', 'PROPERTIES', 'REALTY',
  'MANAGEMENT', 'HOLDINGS', 'DEVELOPMENT', 'PARTNERS', 'GROUP',
  'SERVICES', 'ENTERPRISES', 'SOLUTIONS', 'REGULAR',
]

export function isEntityName(name: string | null | undefined): boolean {
  if (!name || name.trim().length < 2) return true
  const upper = name.toUpperCase()
  return ENTITY_KEYWORDS.some((kw) => upper.includes(kw))
}

export function formatOwnerName(name: string): string {
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
