import { fetchHouseholds, fetchSchema } from '@/lib/atlas-api'
import { DashboardShell } from '@/components/DashboardShell'
import { AtlasStatus } from '@/components/AtlasStatus'
import { HouseholdsList } from './HouseholdsList'

export default async function HouseholdsPage() {
  const [{ households }, schema] = await Promise.all([
    fetchHouseholds({ limit: 500 }),
    fetchSchema(),
  ])

  return (
    <DashboardShell>
      <HouseholdsList
        initialHouseholds={households}
        schema={schema}
      />
    </DashboardShell>
  )
}
