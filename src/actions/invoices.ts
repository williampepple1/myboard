"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { InvoiceStatus } from "@prisma/client";

export type InvoiceScope = {
  organizationId: string;
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

export async function createInvoice(data: {
  invoiceNumber: string;
  amount: number;
  currency?: string;
  status?: InvoiceStatus;
  issueDate?: Date;
  dueDate?: Date;
  billTo?: string;
  notes?: string;
  taxRate?: number;
  discount?: number;
  items: { description: string; quantity: number; unitPrice: number }[];
}, scope: InvoiceScope) {
  await getSession();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency || "USD",
      status: data.status || "DRAFT",
      issueDate: data.issueDate || new Date(),
      dueDate: data.dueDate,
      billTo: data.billTo,
      notes: data.notes,
      taxRate: data.taxRate || 0,
      discount: data.discount || 0,
      organizationId: scope.organizationId,
      projectId: scope.projectId,
      items: {
        create: data.items,
      },
    },
    include: {
      items: true,
    },
  });

  revalidateInvoicePaths(scope);
  return invoice;
}

export async function updateInvoice(id: string, data: {
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  status?: InvoiceStatus;
  issueDate?: Date;
  dueDate?: Date;
  billTo?: string;
  notes?: string;
  taxRate?: number;
  discount?: number;
  items?: { id?: string; description: string; quantity: number; unitPrice: number }[];
}) {
  await getSession();

  // If items are provided, we need to handle updates/creations/deletions.
  // The simplest way for a document-like structure is to delete existing and recreate,
  // or use an upsert strategy. Deleting and recreating is robust here since items don't have complex relations.
  
  const updateData: Record<string, unknown> = { ...data };
  if (data.items) {
    updateData.items = {
      deleteMany: {}, // Delete all existing items
      create: data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: {
      items: true,
    },
  });

  revalidateInvoicePaths({
    organizationId: invoice.organizationId,
    projectId: invoice.projectId || undefined,
  });
  return invoice;
}

export async function deleteInvoice(id: string) {
  await getSession();
  
  const invoice = await prisma.invoice.delete({
    where: { id },
  });

  revalidateInvoicePaths({
    organizationId: invoice.organizationId,
    projectId: invoice.projectId || undefined,
  });
  return invoice;
}

export async function getInvoices(scope: InvoiceScope) {
  await getSession();

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: scope.organizationId,
      projectId: scope.projectId || undefined,
    },
    include: {
      items: true,
    },
    orderBy: {
      issueDate: 'desc',
    },
  });

  return invoices;
}

export async function getInvoice(id: string) {
  await getSession();

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      organization: true,
      project: true,
    },
  });

  return invoice;
}

function revalidateInvoicePaths(scope: InvoiceScope) {
  if (scope.projectId) {
    revalidatePath(`/${scope.organizationId}/projects/${scope.projectId}/invoices`);
  }
  revalidatePath(`/${scope.organizationId}/invoices`);
}
