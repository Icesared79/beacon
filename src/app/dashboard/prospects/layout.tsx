import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prospects',
}

export default function ProspectsLayout({ children }: { children: React.ReactNode }) {
  return children
}
