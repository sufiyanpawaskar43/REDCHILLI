
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Search, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OrderTypeBadge, StatusBadge } from '@/components/ui/Badges';
import { TableSkeleton, ErrorState } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/States';
import { FilterDropdown } from '@/components/ui/Filters';
import { formatCurrency, formatDateTime, todayISO } from '@/utils/helpers';

const PAGE_SIZE = 20;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('today');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('orders')
        .select('id,order_number,kitchen_token_number,order_type,table_number,room_number,guest_count,subtotal,discount,tax,total,order_status,created_at', { count: 'exact' });

      if (date === 'today') query = query.gte('created_at', `${todayISO()}T00:00:00`);
      if (date === 'week') {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        query = query.gte('created_at', start.toISOString());
      }
      if (type) query = query.eq('order_type', type);
      if (search.trim()) {
        const q = search.trim().replace(/[%_]/g, '');
        query = query.or(`order_number.ilike.%${q}%,table_number.ilike.%${q}%,room_number.ilike.%${q}%`);
      }

      query = query.order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, error: queryError, count: total } = await query;
      if (queryError) throw queryError;
      setOrders(data || []);
      setCount(total || 0);
    } catch (err) {
      console.error(err);
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, [date, page, search, type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [date, search, type]);

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Search order, table or room..." />
        </div>
        <FilterDropdown label="Type" value={type} onChange={setType} options={[
          { value: 'DINE_IN', label: 'Dine In' },
          { value: 'TAKEAWAY', label: 'Takeaway' },
          { value: 'ROOM_SERVICE', label: 'Room Service' },
        ]} />
        <FilterDropdown label="Date" value={date} onChange={setDate} options={[
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'all', label: 'All Time' },
        ]} />
      </div>

      {loading ? <TableSkeleton rows={7} cols={8} /> :
        error ? <ErrorState message={error} onRetry={load} /> :
        !orders.length ? <EmptyState icon={Receipt} title="No orders found" message="Try another date, order type or search." /> :
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead><tr className="border-b border-charcoal-800 bg-charcoal-800/50">
                  <th className="table-header">Order</th>
                  <th className="table-header">KOT</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Table / Room</th>
                  <th className="table-header">Guests</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header">Created</th>
                  <th className="table-header">Status</th>
                  <th className="table-header" />
                </tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="table-row">
                      <td className="table-cell font-semibold text-chilli-400">{order.order_number}</td>
                      <td className="table-cell">#{String(order.kitchen_token_number).padStart(3, '0')}</td>
                      <td className="table-cell"><OrderTypeBadge type={order.order_type} /></td>
                      <td className="table-cell">{order.table_number ? `Table ${order.table_number}` : order.room_number ? `Room ${order.room_number}` : 'Takeaway'}</td>
                      <td className="table-cell">{order.guest_count}</td>
                      <td className="table-cell text-right font-semibold">{formatCurrency(order.total)}</td>
                      <td className="table-cell text-xs text-charcoal-400">{formatDateTime(order.created_at)}</td>
                      <td className="table-cell"><StatusBadge status={order.order_status} /></td>
                      <td className="table-cell">
                        <Link to={`/orders/${order.id}`} className="btn-icon text-charcoal-400 hover:text-charcoal-100" title="Open order"><ChevronRight className="w-4 h-4" /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-charcoal-500">Page {page + 1} of {pages} · {count} orders</p>
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
