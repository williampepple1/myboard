import { getInvoice } from "@/actions/invoices";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrintButton from "./PrintButton";

export default async function InvoiceDetailPage(props: { params: Promise<{ orgId: string, invoiceId: string }> }) {
  const params = await props.params;
  const { orgId, invoiceId } = params;

  const invoice = await getInvoice(invoiceId);

  if (!invoice) {
    notFound();
  }

  const subtotal = invoice.items.reduce((sum: number, item: { quantity: number, unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * ((invoice.discount || 0) / 100);
  const taxAmount = (subtotal - discountAmount) * ((invoice.taxRate || 0) / 100);
  const total = subtotal - discountAmount + taxAmount;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Non-printable header actions */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href={`/${orgId}/invoices`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <ArrowLeft size={18} />
          Back to Invoices
        </Link>
        <div className="flex gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-10 print:border-none print:shadow-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-8">
          <div>
            {invoice.organization.logoUrl ? (
              <div className="relative h-12 mb-4 flex items-start justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={invoice.organization.logoUrl} alt={invoice.organization.name} className="h-full object-contain" />
              </div>
            ) : (
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{invoice.organization.name}</h2>
            )}
            <p className="text-sm text-gray-500">Invoice #{invoice.invoiceNumber}</p>
            {invoice.project && <p className="text-sm text-gray-500">Project: {invoice.project.name}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-black text-gray-200 tracking-wider uppercase mb-2">INVOICE</h1>
            <span className={`inline-block px-3 py-1 rounded-md text-sm font-bold print:hidden
                ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                  invoice.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                  invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}
              >
                {invoice.status}
              </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
            <p className="text-gray-900 font-medium whitespace-pre-wrap">{invoice.billTo || "N/A"}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Issue Date</h3>
              <p className="text-gray-900 font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Due Date</h3>
              <p className="text-gray-900 font-medium">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-900 text-sm font-bold text-gray-900 uppercase tracking-wider">
                <th className="py-3">Description</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((item: { description: string, quantity: number, unitPrice: number }, idx: number) => (
                <tr key={idx} className="text-gray-700">
                  <td className="py-4 font-medium">{item.description}</td>
                  <td className="py-4 text-center">{item.quantity}</td>
                  <td className="py-4 text-right">
                    {item.unitPrice.toLocaleString(undefined, { style: 'currency', currency: invoice.currency })}
                  </td>
                  <td className="py-4 text-right font-semibold">
                    {(item.quantity * item.unitPrice).toLocaleString(undefined, { style: 'currency', currency: invoice.currency })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-full max-w-sm">
            <div className="flex justify-between py-2 text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">{subtotal.toLocaleString(undefined, { style: 'currency', currency: invoice.currency })}</span>
            </div>
            {(invoice.discount || 0) > 0 && (
              <div className="flex justify-between py-2 text-gray-600">
                <span>Discount ({invoice.discount}%)</span>
                <span className="font-medium">-{discountAmount.toLocaleString(undefined, { style: 'currency', currency: invoice.currency })}</span>
              </div>
            )}
            {(invoice.taxRate || 0) > 0 && (
              <div className="flex justify-between py-2 text-gray-600 border-b border-gray-100 pb-4">
                <span>Tax ({invoice.taxRate}%)</span>
                <span className="font-medium">{taxAmount.toLocaleString(undefined, { style: 'currency', currency: invoice.currency })}</span>
              </div>
            )}
            <div className="flex justify-between py-4 text-xl font-bold text-gray-900">
              <span>Total</span>
              <span>{total.toLocaleString(undefined, { style: 'currency', currency: invoice.currency })}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-gray-100 pt-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notes / Terms</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

      </div>
    </div>
  );
}
