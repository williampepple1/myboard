import { getOrganizations } from '@/actions/board'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/dashboard/ClientLayout'
import { Organization } from '@/store/boardStore'

export const dynamic = 'force-dynamic'

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = await auth.getSession()
  if (!session?.user) {
    redirect('/login')
  }

  const organizations = await getOrganizations()
  
  return (
    <ClientLayout initialOrgs={organizations as unknown as Organization[]}>
      {children}
    </ClientLayout>
  )
}
