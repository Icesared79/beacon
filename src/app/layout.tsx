import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Beacon by ACCC',
    template: '%s — Beacon by ACCC',
  },
  description:
    'Financial distress intelligence for American Consumer Credit Counseling counselors.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='6' fill='%231B5EA8'/%3E%3Crect x='14' y='14' width='4' height='12' rx='0.5' fill='white' opacity='0.9'/%3E%3Crect x='12' y='11' width='8' height='4' rx='0.5' fill='white'/%3E%3Cpath d='M11 13 L4 9' stroke='white' stroke-width='1.5' stroke-linecap='round' opacity='0.7'/%3E%3Cpath d='M21 13 L28 9' stroke='white' stroke-width='1.5' stroke-linecap='round' opacity='0.7'/%3E%3Ccircle cx='16' cy='10' r='1' fill='white'/%3E%3Crect x='10' y='26' width='12' height='2' rx='1' fill='white' opacity='0.6'/%3E%3C/svg%3E",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
