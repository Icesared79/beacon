import { fetchHouseholds, fetchSchema, fetchStats } from '@/lib/atlas-api'
import { DashboardShell } from '@/components/DashboardShell'
import { HouseholdsList } from './HouseholdsList'

export default async function HouseholdsPage() {
  const [{ households }, schema, stats] = await Promise.all([
    fetchHouseholds({ limit: 500 }),
    fetchSchema(),
    fetchStats(),
  ])

  return (
    <DashboardShell lastUpdated={stats.last_updated}>
      <HouseholdsList initialHouseholds={households} schema={schema} />
    </DashboardShell>
  )
}
