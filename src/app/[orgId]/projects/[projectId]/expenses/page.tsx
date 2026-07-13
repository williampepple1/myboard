import { headers } from "next/headers";
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getFinanceData } from "@/actions/finance"
import ExpenseTracker from "@/components/finance/ExpenseTracker"

export const dynamic = 'force-dynamic'

export default async function ProjectExpensesPage(props: { params: Promise<{ orgId: string, projectId: string }> }) {
  const params = await props.params;
  const { orgId, projectId } = params;

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

  // We allow access if they can view org finances, or if we define a separate project-level permission.
  // For now, adhering to the "Admin will be the only one to see by default, but they can include anyone they like"
  if (!orgUser || (!orgUser.role.canViewFinance && !orgUser.role.canManageSettings)) {
    return (
      <div className="flex-1 p-8 text-center text-gray-500 flex items-center justify-center h-full">
        <p>You do not have permission to view project finances.</p>
      </div>
    )
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project || project.organizationId !== orgId) {
    return <div className="p-8 text-center text-gray-500">Project not found</div>
  }

  const { expenses, budgets, categories } = await getFinanceData({ projectId, organizationId: orgId })

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Project Finances: {project.name}</h1>
      <ExpenseTracker 
        expenses={expenses as any} 
        budgets={budgets as any} 
        categories={categories as any} 
        scope={{ projectId, organizationId: orgId }} 
      />
    </div>
  )
}
