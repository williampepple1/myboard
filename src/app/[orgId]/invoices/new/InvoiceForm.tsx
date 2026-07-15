'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice } from '@/actions/invoices';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function InvoiceForm({ orgId, projects }: { orgId: string, projects: { id: string, name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    billTo: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    taxRate: 0,
    discount: 0,
    projectId: '',
  });

  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0 }
  ]);

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountAmount = subtotal * (formData.discount / 100);
    const taxAmount = (subtotal - discountAmount) * (formData.taxRate / 100);
    return subtotal - discountAmount + taxAmount;
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = calculateTotal();
      await createInvoice({
        invoiceNumber: formData.invoiceNumber,
        billTo: formData.billTo,
        issueDate: new Date(formData.issueDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        notes: formData.notes,
        taxRate: formData.taxRate,
        discount: formData.discount,
        amount,
        items: items.filter(item => item.description.trim() !== '')
      }, { organizationId: orgId, projectId: formData.projectId || undefined });
      
      router.push(`/${orgId}/invoices`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to create invoice');
      } else {
        setError('Failed to create invoice');
      }
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Number</label>
          <input 
            type="text" 
            required
            value={formData.invoiceNumber}
            onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Bill To</label>
          <textarea 
            required
            rows={2}
            value={formData.billTo}
            onChange={e => setFormData({...formData, billTo: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="Client Name&#10;Client Address"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Issue Date</label>
          <input 
            type="date" 
            required
            value={formData.issueDate}
            onChange={e => setFormData({...formData, issueDate: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Due Date (Optional)</label>
          <input 
            type="date" 
            value={formData.dueDate}
            onChange={e => setFormData({...formData, dueDate: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Link to Project (Optional)</label>
          <select 
            value={formData.projectId}
            onChange={e => setFormData({...formData, projectId: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
          >
            <option value="">-- No Project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Line Items</h3>
          <button 
            type="button" 
            onClick={addItem}
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
        
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Description"
                  required
                  value={item.description}
                  onChange={e => handleItemChange(idx, 'description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary outline-none"
                />
              </div>
              <div className="w-24">
                <input 
                  type="number" 
                  min="1"
                  required
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary outline-none"
                />
              </div>
              <div className="w-32">
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  required
                  placeholder="Price"
                  value={item.unitPrice}
                  onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary outline-none"
                />
              </div>
              <button 
                type="button"
                onClick={() => removeItem(idx)}
                className="p-2.5 mt-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
          <textarea 
            rows={4}
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="Payment terms, additional info..."
          />
        </div>
        
        <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-600">Subtotal</span>
            <span className="font-semibold">${items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-bold text-gray-600 whitespace-nowrap">Discount (%)</label>
            <input 
              type="number" 
              min="0"
              max="100"
              value={formData.discount}
              onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
              className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-primary outline-none text-right"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-bold text-gray-600 whitespace-nowrap">Tax Rate (%)</label>
            <input 
              type="number" 
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={e => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})}
              className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-primary outline-none text-right"
            />
          </div>
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <span className="text-lg font-black text-gray-900">Total</span>
            <span className="text-xl font-black text-gray-900">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 mr-4 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}
