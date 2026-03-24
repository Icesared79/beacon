import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beacon — Financial Distress Intelligence',
  description: 'Proactive homeowner outreach intelligence for ACCC counselors',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
