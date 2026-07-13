import { headers } from "next/headers";
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

  const session = await auth.api.getSession({ headers: await headers() })

  const [members, memberCount] = await Promise.all([
    prisma.organizationUser.findMany({
      where: { organizationId: orgId },
      include: { user: true, role: true },
    }),
    prisma.organizationUser.count({ where: { organizationId: orgId } }),
  ])

  const currentUserOrgUser = members.find(m => m.userId === session?.user?.id)
  const canCreateNote = currentUserOrgUser?.role.canCreateNote || false
  const canDeleteNote = currentUserOrgUser?.role.canDeleteNote || false
  const canEditNote = currentUserOrgUser?.role.canEditNote || false

  return (
    <OrganizationOverview
      org={org}
      members={members.map(m => ({ id: m.userId, name: m.user.name, email: m.user.email, role: m.role.name }))}
      currentUser={{ id: session?.user?.id || '', name: session?.user?.name, email: session?.user?.email, role: currentUserOrgUser?.role.name }}
      memberCount={memberCount}
      canCreateNote={canCreateNote}
      canDeleteNote={canDeleteNote}
      canEditNote={canEditNote}
    />
  )
}
