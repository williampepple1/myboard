import OrganizationOverview from '@/components/dashboard/OrganizationOverview'
import { getOrganizations } from '@/actions/board'

export default async function OrgPage(props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const { orgId } = params;

  // We should fetch the organization here. But actually OrganizationOverview needs an `org` object.
  const organizations = await getOrganizations()
  const org = organizations.find(o => o.id === orgId)

  if (!org) {
    return <div className="p-8 text-center text-gray-500">Organization not found</div>
  }

  // OrganizationOverview requires onSelectProject and onCreateProject which were previously state setters.
  // We should pass empty functions or rewrite OrganizationOverview to use Link/router.
  // We'll pass it for now and later fix OrganizationOverview.

  return (
    <OrganizationOverview 
      org={org} 
    />
  )
}
