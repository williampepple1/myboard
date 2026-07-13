"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { BudgetPeriod } from "@prisma/client";

// Types
export type FinanceScope = {
  userId?: string;
  organizationId?: string;
  projectId?: string;
};

// Ensure user is authenticated
async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ----------------------------------------------------------------------------
// Expenses
// ----------------------------------------------------------------------------

export async function createExpense(data: {
  amount: number;
  currency: string;
  description?: string;
  date: Date;
  categoryId?: string;
}, scope: FinanceScope) {
  const session = await getSession();

  const expense = await prisma.expense.create({
    data: {
      amount: data.amount,
      currency: data.currency || "USD",
      description: data.description,
      date: data.date,
      categoryId: data.categoryId,
      userId: scope.userId || (scope.organizationId || scope.projectId ? null : session.user.id),
      organizationId: scope.organizationId,
      projectId: scope.projectId,
    },
  });

  revalidateFinancePaths(scope);
  return expense;
}

export async function updateExpense(id: string, data: {
  amount?: number;
  currency?: string;
  description?: string;
  date?: Date;
  categoryId?: string;
}) {
  await getSession();
  
  const expense = await prisma.expense.update({
    where: { id },
    data,
  });

  revalidateFinancePaths({
    userId: expense.userId || undefined,
    organizationId: expense.organizationId || undefined,
    projectId: expense.projectId || undefined,
  });
  return expense;
}

export async function deleteExpense(id: string) {
  await getSession();
  
  const expense = await prisma.expense.delete({
    where: { id },
  });

  revalidateFinancePaths({
    userId: expense.userId || undefined,
    organizationId: expense.organizationId || undefined,
    projectId: expense.projectId || undefined,
  });
  return expense;
}

// ----------------------------------------------------------------------------
// Budgets
// ----------------------------------------------------------------------------

export async function createBudget(data: {
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate?: Date;
  endDate?: Date;
}, scope: FinanceScope) {
  const session = await getSession();

  const budget = await prisma.budget.create({
    data: {
      name: data.name,
      amount: data.amount,
      currency: data.currency || "USD",
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate,
      userId: scope.userId || (scope.organizationId || scope.projectId ? null : session.user.id),
      organizationId: scope.organizationId,
      projectId: scope.projectId,
    },
  });

  revalidateFinancePaths(scope);
  return budget;
}

export async function updateBudget(id: string, data: {
  name?: string;
  amount?: number;
  currency?: string;
  period?: BudgetPeriod;
  startDate?: Date;
  endDate?: Date;
}) {
  await getSession();

  const budget = await prisma.budget.update({
    where: { id },
    data,
  });

  revalidateFinancePaths({
    userId: budget.userId || undefined,
    organizationId: budget.organizationId || undefined,
    projectId: budget.projectId || undefined,
  });
  return budget;
}

export async function deleteBudget(id: string) {
  await getSession();

  const budget = await prisma.budget.delete({
    where: { id },
  });

  revalidateFinancePaths({
    userId: budget.userId || undefined,
    organizationId: budget.organizationId || undefined,
    projectId: budget.projectId || undefined,
  });
  return budget;
}

// ----------------------------------------------------------------------------
// Categories
// ----------------------------------------------------------------------------

export async function createExpenseCategory(data: {
  name: string;
  color?: string;
}, scope: FinanceScope) {
  const session = await getSession();

  const category = await prisma.expenseCategory.create({
    data: {
      name: data.name,
      color: data.color || "#000000",
      userId: scope.userId || (scope.organizationId ? null : session.user.id),
      organizationId: scope.organizationId,
    },
  });

  revalidateFinancePaths(scope);
  return category;
}

// ----------------------------------------------------------------------------
// Retrieval & Aggregation
// ----------------------------------------------------------------------------

export async function getFinanceData(scope: FinanceScope) {
  const session = await getSession();
  
  // Enforce security
  if (!scope.organizationId && !scope.projectId && scope.userId !== session.user.id) {
    if (!scope.userId) {
      scope.userId = session.user.id;
    } else {
      throw new Error("Unauthorized");
    }
  }

  const whereClause = {
    userId: scope.userId || null,
    organizationId: scope.organizationId || null,
    projectId: scope.projectId || null,
  };

  // If viewing at project level, we might also want to see org-level categories
  const categoryWhere = scope.organizationId ? { organizationId: scope.organizationId } : { userId: scope.userId || session.user.id };

  const [expenses, budgets, categories] = await Promise.all([
    prisma.expense.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.budget.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.expenseCategory.findMany({
      where: {
        OR: [
          categoryWhere,
          { id: 'GLOBAL' } // Assuming we might have global categories in future
        ]
      }
    })
  ]);

  return { expenses, budgets, categories };
}

function revalidateFinancePaths(scope: FinanceScope) {
  if (scope.projectId) {
    revalidatePath(`/${scope.organizationId}/projects/${scope.projectId}/expenses`);
  } else if (scope.organizationId) {
    revalidatePath(`/${scope.organizationId}/expenses`);
  } else {
    revalidatePath(`/expenses`);
  }
}
