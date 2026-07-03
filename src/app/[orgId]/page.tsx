import OrganizationOverview from '@/components/dashboard/OrganizationOverview'
import { getOrganizations } from '@/actions/board'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function OrgPage(props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const { orgId } = params;

  const organizations = await getOrganizations()
  const org = organizations.find(o => o.id === orgId)

  if (!org) {
    return <div className="p-8 text-center text-gray-500">Organization not found</div>
  }

  const { data: session } = await auth.getSession()
  const memberCount = await prisma.organizationUser.count({ where: { organizationId: orgId } })

  return (
    <OrganizationOverview
      org={org}
      currentUser={{ id: session?.user?.id || '', name: session?.user?.name, email: session?.user?.email }}
      memberCount={memberCount}
    />
  )
}
