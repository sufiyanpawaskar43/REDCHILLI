
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OrderTypeBadge } from '@/components/ui/Badges';
import { TableSkeleton, ErrorState } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/States';
import { FilterDropdown } from '@/components/ui/Filters';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import { normalizeInvoice } from '@/utils/db';

const PAGE_SIZE = 20;

export default function Invoices() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('invoices')
        .select(`
          id, invoice_number, order_id, kitchen_token_number_snapshot,
          order_type_snapshot, table_number_snapshot, room_number_snapshot,
          guest_count_snapshot, subtotal, discount, grand_total, created_at,
          orders(order_number)
        `, { count: 'exact' });

      if (type) query = query.eq('order_type_snapshot', type);
      if (search.trim()) query = query.ilike('invoice_number', `%${search.trim().replace(/[%_]/g, '')}%`);

      query = query.order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, error: queryError, count: total } = await query;
      if (queryError) throw queryError;

      setRows((data || []).map((row) => normalizeInvoice({
        ...row,
        order_number: row.orders?.order_number,
      })));
      setCount(total || 0);
    } catch (err) {
      console.error(err);
      setError('Unable to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [search, type]);

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Search invoice number..." />
        </div>
        <FilterDropdown label="Type" value={type} onChange={setType} options={[
          { value: 'DINE_IN', label: 'Dine In' },
          { value: 'TAKEAWAY', label: 'Takeaway' },
          { value: 'ROOM_SERVICE', label: 'Room Service' },
        ]} />
      </div>

      {loading ? <TableSkeleton rows={7} cols={8} /> :
        error ? <ErrorState message={error} onRetry={load} /> :
        !rows.length ? <EmptyState icon={FileText} title="No invoices found" message="Invoices will appear here after billing." /> :
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead><tr className="border-b border-charcoal-800 bg-charcoal-800/50">
                  <th className="table-header">Invoice</th><th className="table-header">Order</th><th className="table-header">KOT</th><th className="table-header">Type</th><th className="table-header">Table / Room</th><th className="table-header">Guests</th><th className="table-header text-right">Grand Total</th><th className="table-header">Created</th><th className="table-header" />
                </tr></thead>
                <tbody>{rows.map((invoice) => (
                  <tr key={invoice.id} className="table-row">
                    <td className="table-cell font-semibold text-chilli-400">{invoice.invoice_number}</td>
                    <td className="table-cell">{invoice.order_number || '—'}</td>
                    <td className="table-cell">#{String(invoice.kot_number ?? '—').padStart(3, '0')}</td>
                    <td className="table-cell"><OrderTypeBadge type={invoice.order_type} /></td>
                    <td className="table-cell">{invoice.table_number ? `Table ${invoice.table_number}` : invoice.room_number ? `Room ${invoice.room_number}` : 'Takeaway'}</td>
                    <td className="table-cell">{invoice.guest_count}</td>
                    <td className="table-cell text-right font-semibold">{formatCurrency(invoice.grand_total)}</td>
                    <td className="table-cell text-xs text-charcoal-400">{formatDateTime(invoice.created_at)}</td>
                    <td className="table-cell"><Link to={`/invoices/${invoice.id}`} className="btn-icon text-charcoal-400 hover:text-charcoal-100"><ChevronRight className="w-4 h-4" /></Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-charcoal-500">Page {page + 1} of {pages} · {count} invoices</p>
            <div className="flex gap-2">
              <button className="btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="btn-ghost btn-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </>
      }
    </div>
  );
}
