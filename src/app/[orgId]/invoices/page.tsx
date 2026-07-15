import { getInvoices } from "@/actions/invoices";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";

export default async function InvoicesPage(props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const { orgId } = params;

  const invoices = await getInvoices({ organizationId: orgId });

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            Invoices
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage and print your organization&apos;s invoices</p>
        </div>
        <Link
          href={`/${orgId}/invoices/new`}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm active:scale-95 transition-all duration-200"
        >
          <Plus size={18} />
          Create Invoice
        </Link>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No invoices yet</h3>
            <p className="text-gray-500 mt-1">Create your first invoice to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4 pl-6">Invoice #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice: { id: string, invoiceNumber: string, billTo: string | null, issueDate: Date, amount: number, status: string, currency: string }) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 pl-6 font-medium text-gray-900">
                    <Link href={`/${orgId}/invoices/${invoice.id}`} className="hover:text-primary-hover hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-semibold text-gray-900">
                    {invoice.amount.toLocaleString(undefined, { style: 'currency', currency: invoice.currency })}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        invoice.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Link
                      href={`/${orgId}/invoices/${invoice.id}`}
                      className="text-sm font-semibold text-primary-hover hover:text-primary transition-colors flex items-center justify-end gap-1"
                    >
                      View / Print
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
