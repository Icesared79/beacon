import { fetchHousehold } from '@/lib/atlas-api'
import { DashboardShell } from '@/components/DashboardShell'
import { HouseholdDetail } from './HouseholdDetail'

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ parcel_id: string }>
}) {
  const { parcel_id } = await params
  const household = await fetchHousehold(decodeURIComponent(parcel_id))

  return (
    <DashboardShell>
      <HouseholdDetail household={household} />
    </DashboardShell>
  )
}
