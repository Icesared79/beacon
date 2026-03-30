import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function getScoreColor(score: number, hasHardDistress = true): string {
  if (!hasHardDistress) return '#94A3B8';        // Gray — no hard distress
  if (score >= 70) return '#DC2626';              // Red (Urgent)
  if (score >= 50) return '#D97706';              // Amber (High Need)
  return '#2563EB';                               // Blue (Moderate)
}

export function getScoreLabel(score: number, hasHardDistress = true): string {
  if (!hasHardDistress) return 'Low';             // No hard distress = never Urgent/High Need
  if (score >= 70) return 'Urgent';
  if (score >= 50) return 'High Need';
  return 'Moderate';
}

export function getDistressColor(score: number): string {
  if (score >= 70) return '#DC2626';
  if (score >= 50) return '#D97706';
  if (score >= 30) return '#2563EB';
  if (score >= 10) return '#93C5FD';
  return '#E2E8F0';
}

// ── Business entity detection ──
const BUSINESS_KEYWORDS = [
  'LLC', ' LP', ' INC', ' CORP', 'PROPERTIES', 'APARTMENTS',
  'INVESTMENTS', 'MANAGEMENT', 'REALTY', 'ASSOCIATES', 'GROUP',
  'HOLDINGS', 'VENTURES', ' LTD', 'PARTNERS', 'PARTNERSHIP',
  'COMPANY', 'ENTERPRISES', 'DEVELOPMENT',
  'CENTER', 'CENTRE', 'CHURCH', 'BIBLE', 'MINISTRY',
  'TEMPLE', 'MOSQUE', 'TRANSIT', 'AUTHORITY', 'TRANSPORTATION',
  'DISTRICT', 'FOUNDATION', 'HOSPITAL',
  'COMMUNITY', 'ASSOCIATION', 'SOCIETY', 'KOLLEL',
];

const PERSONAL_TRUST_WORDS = [
  'FAMILY TRUST', 'REVOCABLE TRUST', 'LIVING TRUST',
  'SURVIVOR TRUST', 'IRREVOCABLE TRUST',
];

export function isBusinessEntity(name: string): boolean {
  const upper = name.toUpperCase();
  // Personal trusts are not business entities
  if (PERSONAL_TRUST_WORDS.some(w => upper.includes(w))) return false;
  if (BUSINESS_KEYWORDS.some(kw => upper.includes(kw))) return true;
  // Generic TRUST without personal indicator
  if (upper.includes('TRUST')) return true;
  return false;
}

/**
 * Format an owner name from Atlas format (ALL CAPS, LAST,FIRST) to Title Case First Last.
 * Handles: "SMITH,JOHN A" → "John A Smith"
 *          "AYERS,ANDREA A & HOWARD" → "Andrea A & Howard Ayers"
 *          "JOHNSON FAMILY TRUST" → "Johnson Family Trust"
 */
export function formatOwnerName(raw: string): string {
  if (!raw) return 'Unknown';

  // If it's a business entity, just title-case it
  if (isBusinessEntity(raw)) {
    return toTitleCase(raw);
  }

  // Handle LAST,FIRST format
  const commaIdx = raw.indexOf(',');
  if (commaIdx > 0) {
    const last = raw.slice(0, commaIdx).trim();
    const first = raw.slice(commaIdx + 1).trim();
    if (first && last) {
      return toTitleCase(`${first} ${last}`);
    }
  }

  // No comma — just title-case
  return toTitleCase(raw);
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    // Fix common suffixes that should stay uppercase
    .replace(/\bLlc\b/g, 'LLC')
    .replace(/\bLtd\b/g, 'LTD')
    .replace(/\bLp\b/g, 'LP')
    .replace(/\bInc\b/g, 'Inc.')
    .replace(/\bIi\b/g, 'II')
    .replace(/\bIii\b/g, 'III')
    .replace(/\bIv\b/g, 'IV');
}
