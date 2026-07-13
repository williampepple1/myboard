import { headers } from "next/headers";
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getFinanceData } from "@/actions/finance"
import ExpenseTracker from "@/components/finance/ExpenseTracker"

export const dynamic = 'force-dynamic'

export default async function OrganizationExpensesPage(props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const { orgId } = params;

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }

  const orgUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      }
    },
    include: { role: true }
  })

  if (!orgUser || (!orgUser.role.canViewFinance && !orgUser.role.canManageSettings)) {
    return (
      <div className="flex-1 p-8 text-center text-gray-500 flex items-center justify-center h-full">
        <p>You do not have permission to view organization finances.</p>
      </div>
    )
  }

  const { expenses, budgets, categories } = await getFinanceData({ organizationId: orgId })

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Organization Finances</h1>
      <ExpenseTracker 
        expenses={expenses as any} 
        budgets={budgets as any} 
        categories={categories as any} 
        scope={{ organizationId: orgId }} 
      />
    </div>
  )
}
