
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { getInvoiceDetails } from '@/utils/db';
import { supabase } from '@/lib/supabase';
import { OrderTypeBadge, MoneyRow } from '@/components/ui/Badges';
import { FullPageSpinner } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/States';
import Modal from '@/components/ui/Modal';
import InvoicePrint, { InvoiceThermalPrint } from '@/components/print/InvoicePrint';
import { formatCurrency, formatDateTime } from '@/utils/helpers';

export default function InvoiceDetails() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printView, setPrintView] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [invoiceData, hotelRes] = await Promise.all([
        getInvoiceDetails(id),
        supabase.from('hotel_settings').select('*').limit(1).maybeSingle(),
      ]);
      if (!invoiceData) {
        setError('Invoice not found.');
        return;
      }
      setInvoice(invoiceData);
      setHotel(hotelRes.data || null);
    } catch (err) {
      console.error(err);
      setError('Unable to load invoice details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <FullPageSpinner label="Loading invoice..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={load} /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="btn-icon text-charcoal-400 hover:bg-charcoal-800"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-sm text-charcoal-500">{formatDateTime(invoice.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setPrintView('a4')}><Printer className="w-4 h-4" /> A4</button>
          <button className="btn-ghost btn-sm" onClick={() => setPrintView('thermal')}><Printer className="w-4 h-4" /> 80mm</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Invoice Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-charcoal-500">Invoice</span><span>{invoice.invoice_number}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Order</span><span>{invoice.order_number || '—'}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-500">KOT</span><span>#{String(invoice.kot_number ?? '—').padStart(3, '0')}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Type</span><OrderTypeBadge type={invoice.order_type} /></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Table</span><span>{invoice.table_number || '—'}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Room</span><span>{invoice.room_number || '—'}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Guests</span><span>{invoice.guest_count}</span></div>
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead><tr className="border-b border-charcoal-800">
                <th className="table-header">Item</th><th className="table-header">Variant</th><th className="table-header text-center">Qty</th><th className="table-header text-right">Price</th><th className="table-header text-right">Total</th>
              </tr></thead>
              <tbody>{invoice.invoice_items.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="table-cell font-medium">{item.item_name}</td>
                  <td className="table-cell text-charcoal-500">{item.variant_name || '—'}</td>
                  <td className="table-cell text-center">{item.quantity}</td>
                  <td className="table-cell text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="table-cell text-right font-semibold">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="ml-auto w-72 pt-4">
            <MoneyRow label="Subtotal" amount={invoice.subtotal} />
            {invoice.discount > 0 && <MoneyRow label="Discount" amount={-invoice.discount} accent />}
            {invoice.cgst_amount > 0 && <MoneyRow label="CGST" amount={invoice.cgst_amount} />}
            {invoice.sgst_amount > 0 && <MoneyRow label="SGST" amount={invoice.sgst_amount} />}
            {invoice.igst_amount > 0 && <MoneyRow label="IGST" amount={invoice.igst_amount} />}
            {invoice.other_tax_amount > 0 && <MoneyRow label="Other Tax" amount={invoice.other_tax_amount} />}
            <MoneyRow label="Grand Total" amount={invoice.grand_total} bold />
          </div>
        </div>
      </div>

      <Modal open={!!printView} onClose={() => setPrintView(null)} title="Print Preview" size="lg">
        <div className="print-area bg-white rounded-lg overflow-auto">
          {printView === 'a4' && <InvoicePrint invoice={invoice} hotel={hotel} />}
          {printView === 'thermal' && <InvoiceThermalPrint invoice={invoice} hotel={hotel} />}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setPrintView(null)}>Close</button>
          <button className="btn-primary" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</button>
        </div>
      </Modal>
    </div>
  );
}
