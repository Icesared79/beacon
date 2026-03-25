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

export function getScoreColor(score: number): string {
  if (score >= 80) return '#DC2626';
  if (score >= 60) return '#D97706';
  if (score >= 40) return '#2563EB';
  return '#94A3B8';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Urgent';
  if (score >= 60) return 'High Need';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

export function getDistressColor(score: number): string {
  if (score >= 80) return '#DC2626';
  if (score >= 60) return '#D97706';
  if (score >= 40) return '#2563EB';
  if (score >= 20) return '#93C5FD';
  return '#E2E8F0';
}
