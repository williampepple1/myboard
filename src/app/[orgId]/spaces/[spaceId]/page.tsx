import SpaceClient from '@/components/dashboard/SpaceClient'

export default async function SpacePage(props: { params: Promise<{ spaceId: string, orgId: string }> }) {
  const params = await props.params;
  
  return (
    <SpaceClient spaceId={params.spaceId} orgId={params.orgId} />
  )
}
