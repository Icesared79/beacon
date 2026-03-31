import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Beacon — ACCC',
  description: 'Community outreach intelligence for American Consumer Credit Counseling',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>{children}</body>
    </html>
  )
}
