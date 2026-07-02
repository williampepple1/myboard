import PlanClient from '@/components/dashboard/PlanClient'

export default async function PlanPage(props: { params: Promise<{ planId: string, orgId: string }> }) {
  const params = await props.params;
  
  return (
    <PlanClient planId={params.planId} orgId={params.orgId} />
  )
}
