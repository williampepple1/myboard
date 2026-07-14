import { headers } from "next/headers";
import { getOrganizations } from '@/actions/board'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/dashboard/ClientLayout'
import type { Organization } from '@/store/boardStore'

export const dynamic = 'force-dynamic'

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }

  const organizations = await getOrganizations()
  
  return (
    <ClientLayout initialOrgs={organizations as unknown as Organization[]} user={session.user}>
      {children}
    </ClientLayout>
  )
}
