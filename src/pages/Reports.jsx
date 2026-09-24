
import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CalendarDays, IndianRupee, Receipt, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardCard } from '@/components/ui/Badges';
import { ErrorState } from '@/components/ui/States';
import { formatCurrency, todayISO } from '@/utils/helpers';

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export default function Reports() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);

  const [from, setFrom] = useState(toISODate(start));
  const [to, setTo] = useState(toISODate(end));
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!from || !to || from > to) {
      setError('Please select a valid date range.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [summaryRes, salesRes, topRes] = await Promise.all([
        supabase.rpc('get_dashboard_summary', { p_from: from, p_to: to }),
        supabase.rpc('get_sales_report', { p_from: from, p_to: to }),
        supabase.rpc('get_top_menu_items', { p_from: from, p_to: to, p_limit: 10 }),
      ]);

      if (summaryRes.error) throw summaryRes.error;
      if (salesRes.error) throw salesRes.error;
      if (topRes.error) throw topRes.error;

      setSummary(summaryRes.data || {});
      setSales(salesRes.data || []);
      setTopItems(topRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const totals = sales.reduce((acc, row) => ({
    orders: acc.orders + Number(row.order_count || 0),
    subtotal: acc.subtotal + Number(row.subtotal || 0),
    discount: acc.discount + Number(row.discount || 0),
    tax: acc.tax + Number(row.tax || 0),
    total: acc.total + Number(row.total || 0),
  }), { orders: 0, subtotal: 0, discount: 0, tax: 0, total: 0 });

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400 font-semibold">Analytics</p>
          <h1 className="text-2xl font-bold mt-1">Sales Reports</h1>
          <p className="text-sm text-charcoal-500 mt-1">Backend-calculated sales and item performance.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div><label className="label">From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-sm" /></div>
          <div><label className="label">To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-sm" /></div>
          <button className="btn-primary btn-sm" onClick={load}><CalendarDays className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <DashboardCard icon={Receipt} label="Orders" value={totals.orders} accent="chilli" />
            <DashboardCard icon={IndianRupee} label="Sales" value={formatCurrency(totals.total)} accent="green" />
            <DashboardCard icon={TrendingUp} label="Tax" value={formatCurrency(totals.tax)} accent="gold" />
            <DashboardCard icon={BarChart3} label="Top Items" value={topItems.length} accent="blue" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="card xl:col-span-2 overflow-hidden">
              <div className="px-5 py-4 border-b border-charcoal-800">
                <h3 className="font-bold">Daily Sales</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead><tr className="border-b border-charcoal-800">
                    <th className="table-header">Date</th><th className="table-header">Orders</th><th className="table-header">Completed</th><th className="table-header">Cancelled</th><th className="table-header text-right">Subtotal</th><th className="table-header text-right">Discount</th><th className="table-header text-right">Tax</th><th className="table-header text-right">Total</th>
                  </tr></thead>
                  <tbody>{sales.map((row) => (
                    <tr key={row.sale_date} className="table-row">
                      <td className="table-cell">{row.sale_date}</td><td className="table-cell">{row.order_count}</td><td className="table-cell text-emerald-400">{row.completed_count}</td><td className="table-cell text-red-400">{row.cancelled_count}</td><td className="table-cell text-right">{formatCurrency(row.subtotal)}</td><td className="table-cell text-right">{formatCurrency(row.discount)}</td><td className="table-cell text-right">{formatCurrency(row.tax)}</td><td className="table-cell text-right font-semibold">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-charcoal-800">
                <h3 className="font-bold">Top Menu Items</h3>
              </div>
              <div className="p-4 space-y-3">
                {topItems.map((item, index) => (
                  <div key={`${item.item_name}-${index}`} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-charcoal-800 flex items-center justify-center text-xs font-bold text-gold-400">{index + 1}</span>
                    <div className="flex-1 min-w-0"><p className="text-sm truncate">{item.item_name}</p><p className="text-xs text-charcoal-500">{item.quantity} sold</p></div>
                    <span className="text-sm font-semibold">{formatCurrency(item.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-4">Range Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Metric label="Gross Sales" value={formatCurrency(summary?.grossSales || totals.total)} />
              <Metric label="Discount" value={formatCurrency(summary?.discount || totals.discount)} />
              <Metric label="Tax" value={formatCurrency(summary?.tax || totals.tax)} />
              <Metric label="Invoiced" value={formatCurrency(summary?.invoiced || 0)} />
              <Metric label="Orders" value={summary?.orders || totals.orders} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="bg-charcoal-800/60 border border-charcoal-700 rounded-xl p-4"><p className="text-xs text-charcoal-500">{label}</p><p className="text-lg font-bold mt-1">{value}</p></div>;
}
