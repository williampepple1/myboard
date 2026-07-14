import { headers } from "next/headers";
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientLayout from '@/components/dashboard/ClientLayout'
import { getOrganizations } from '@/actions/board'
import type { Organization } from '@/store/boardStore'
import { getFinanceData } from "@/actions/finance"
import ExpenseTracker from "@/components/finance/ExpenseTracker"

export const dynamic = 'force-dynamic'

export default async function PersonalExpensesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }

  const organizations = await getOrganizations()
  const { expenses, budgets, categories } = await getFinanceData({ userId: session.user.id })

  return (
    <ClientLayout initialOrgs={organizations as unknown as Organization[]} user={session.user}>
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Personal Finances</h1>
        <ExpenseTracker 
          expenses={expenses} 
          budgets={budgets} 
          categories={categories} 
          scope={{ userId: session.user.id }} 
        />
      </div>
    </ClientLayout>
  )
}
