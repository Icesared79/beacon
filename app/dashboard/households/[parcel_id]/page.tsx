import { fetchHousehold, fetchStats } from '@/lib/atlas-api'
import { DashboardShell } from '@/components/DashboardShell'
import { HouseholdDetail } from './HouseholdDetail'

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ parcel_id: string }>
}) {
  const { parcel_id } = await params
  const [household, stats] = await Promise.all([
    fetchHousehold(decodeURIComponent(parcel_id)),
    fetchStats(),
  ])

  return (
    <DashboardShell lastUpdated={stats.last_updated}>
      <HouseholdDetail household={household} />
    </DashboardShell>
  )
}
