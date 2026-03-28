import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Beacon — ACCC',
  description: 'Community outreach intelligence for American Consumer Credit Counseling',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
