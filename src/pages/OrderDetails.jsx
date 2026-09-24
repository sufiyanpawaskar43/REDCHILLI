
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { getOrderDetails, createInvoice } from '@/utils/db';
import { supabase } from '@/lib/supabase';
import { OrderTypeBadge, StatusBadge, MoneyRow } from '@/components/ui/Badges';
import { ErrorState } from '@/components/ui/States';
import { FullPageSpinner } from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import KOTPrint, { KOTA4Print } from '@/components/print/KOTPrint';
import InvoicePrint from '@/components/print/InvoicePrint';
import { formatCurrency, formatDateTime } from '@/utils/helpers';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printView, setPrintView] = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orderData, hotelRes] = await Promise.all([
        getOrderDetails(id),
        supabase.from('hotel_settings').select('*').limit(1).maybeSingle(),
      ]);
      if (!orderData) {
        setError('Order not found.');
        return;
      }
      setOrder(orderData);
      setHotel(hotelRes.data || null);

      const { data: existing } = await supabase.from('invoices').select('id').eq('order_id', id).maybeSingle();
      if (existing?.id) {
        const { getInvoiceDetails } = await import('@/utils/db');
        setInvoice(await getInvoiceDetails(existing.id));
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const result = await createInvoice(order.id);
      setInvoice(result);
      toast.success('Invoice ready.');
    } catch (err) {
      console.error(err);
      toast.error('Unable to generate invoice.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <FullPageSpinner label="Loading order..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={load} /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="btn-icon text-charcoal-400 hover:bg-charcoal-800"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold">{order.order_number}</h1>
            <p className="text-sm text-charcoal-500">KOT #{String(order.kot_number).padStart(3, '0')} · {formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setPrintView('kot-thermal')}><Printer className="w-4 h-4" /> KOT 80mm</button>
          <button className="btn-ghost btn-sm" onClick={() => setPrintView('kot-a4')}><Printer className="w-4 h-4" /> KOT A4</button>
          <button className="btn-gold btn-sm" onClick={generate} disabled={generating || !!invoice}><FileText className="w-4 h-4" /> {invoice ? 'Invoice Ready' : generating ? 'Generating...' : 'Generate Invoice'}</button>
          {invoice && <Link to={`/invoices/${invoice.id}`} className="btn-primary btn-sm">View Invoice</Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Order Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-charcoal-500">Type</span><OrderTypeBadge type={order.order_type} /></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Table</span><span>{order.table_number || '—'}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Room</span><span>{order.room_number || '—'}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Guests</span><span>{order.guest_count}</span></div>
            <div className="flex justify-between"><span className="text-charcoal-500">Status</span><StatusBadge status={order.order_status} /></div>
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr className="border-b border-charcoal-800">
                <th className="table-header">Item</th><th className="table-header">Variant</th><th className="table-header text-center">Qty</th><th className="table-header text-right">Price</th><th className="table-header text-right">Total</th>
              </tr></thead>
              <tbody>{order.order_items.map((item) => (
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
          <div className="ml-auto w-64 pt-4">
            <MoneyRow label="Subtotal" amount={order.subtotal} />
            <MoneyRow label="Discount" amount={-order.discount} accent />
            <MoneyRow label="Tax" amount={order.tax} />
            <MoneyRow label="Grand Total" amount={order.total} bold />
          </div>
          {order.notes && <div className="mt-4 bg-charcoal-800 rounded-lg p-3"><p className="text-xs uppercase text-charcoal-500">Notes</p><p className="text-sm mt-1">{order.notes}</p></div>}
        </div>
      </div>

      <Modal open={!!printView} onClose={() => setPrintView(null)} title="Print Preview" size="lg">
        <div className="print-area bg-white rounded-lg overflow-auto">
          {printView === 'kot-thermal' && <KOTPrint order={order} hotelName={hotel?.hotel_name || 'RED CHILLI'} />}
          {printView === 'kot-a4' && <KOTA4Print order={order} hotelName={hotel?.hotel_name || 'RED CHILLI'} />}
          {printView === 'invoice' && <InvoicePrint invoice={invoice} hotel={hotel} />}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setPrintView(null)}>Close</button>
          <button className="btn-primary" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</button>
        </div>
      </Modal>
    </div>
  );
}
