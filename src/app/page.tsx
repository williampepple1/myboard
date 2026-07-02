import { getOrganizations } from '@/actions/board'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/dashboard/ClientLayout'
import { Organization } from '@/store/boardStore'
import { FolderKanban } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: session } = await auth.getSession()
  if (!session?.user) {
    redirect('/login')
  }

  const organizations = await getOrganizations()
  if (organizations.length > 0) {
    redirect(`/${organizations[0].id}`)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <ClientLayout initialOrgs={organizations as unknown as Organization[]}>
        <div className="flex flex-col items-center justify-center h-full text-[#6B778C] gap-4 animate-in fade-in">
          <FolderKanban size={48} className="opacity-20" />
          <p>Select or create an organization to start planning.</p>
        </div>
      </ClientLayout>
    </div>
  )
}
