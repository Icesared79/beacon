import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-beacon-bg">
      <Sidebar />
      <main className="lg:pl-60">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
