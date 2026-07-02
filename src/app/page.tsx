import { getOrganizations } from '@/actions/board'
import DashboardClient from './DashboardClient'
import UserMenu from './UserMenu'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { data: session } = await auth.getSession()
  if (!session?.user) {
    redirect('/login')
  }


  const organizations = await getOrganizations()
  
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b border-border bg-panel flex items-center justify-between px-6 glass-panel z-10 sticky top-0">
        <h1 className="text-xl font-bold text-primary">KanbanFlow</h1>
        <div className="flex items-center gap-4 text-sm">
          <UserMenu name={session.user.name as string | undefined} email={session.user.email as string | undefined} />
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        <DashboardClient initialOrgs={organizations} />
      </div>
    </main>
  )
}
