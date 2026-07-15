import prisma from "@/lib/prisma";
import InvoiceForm from "./InvoiceForm";

export default async function NewInvoicePage(props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const { orgId } = params;

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create New Invoice
        </h1>
        <p className="text-gray-500 font-medium mt-1">Fill in the details below to generate an invoice</p>
      </div>
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
        <InvoiceForm orgId={orgId} projects={projects} />
      </div>
    </div>
  );
}
