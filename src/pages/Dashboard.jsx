import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  FileText,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Utensils,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import {
  DashboardCard,
  OrderTypeBadge,
  StatusBadge,
} from '@/components/ui/Badges';
import {
  TableSkeleton,
  ErrorState,
} from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/States';
import {
  formatCurrency,
  formatDateTime,
  todayISO,
} from '@/utils/helpers';

export default function Dashboard() {
  // --------------------------------------------------
  // DATE
  // --------------------------------------------------
  const today = todayISO();

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --------------------------------------------------
  // LOAD DASHBOARD DATA
  // --------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        summaryRes,
        ordersRes,
        topRes,
      ] = await Promise.all([
        // Dashboard summary
        supabase.rpc('get_dashboard_summary', {
          p_from: today,
          p_to: today,
        }),

        // Recent orders
        supabase
          .from('orders')
          .select(
            `
              id,
              order_number,
              kitchen_token_number,
              order_type,
              table_number,
              room_number,
              guest_count,
              subtotal,
              discount,
              tax,
              total,
              order_status,
              created_at
            `
          )
          .gte('created_at', `${today}T00:00:00`)
          .order('created_at', {
            ascending: false,
          })
          .limit(8),

        // Top selling items
        supabase.rpc('get_top_menu_items', {
          p_from: today,
          p_to: today,
          p_limit: 5,
        }),
      ]);

      // ------------------------------------------------
      // ERROR HANDLING
      // ------------------------------------------------

      if (summaryRes.error) {
        throw summaryRes.error;
      }

      if (ordersRes.error) {
        throw ordersRes.error;
      }

      if (topRes.error) {
        throw topRes.error;
      }

      // ------------------------------------------------
      // SET DATA
      // ------------------------------------------------

      setSummary(summaryRes.data || {});
      setRecentOrders(ordersRes.data || []);
      setTopItems(topRes.data || []);
    } catch (err) {
      console.error('Dashboard loading error:', err);

      setError(
        err?.message ||
          'Unable to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  }, [today]);

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    load();
  }, [load]);

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        {/* Dashboard cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="card p-5 space-y-3"
            >
              <div className="skeleton h-10 w-10 rounded-lg" />

              <div className="skeleton h-8 w-24" />

              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Orders skeleton */}
        <TableSkeleton
          rows={5}
          cols={6}
        />
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message={error}
          onRetry={load}
        />
      </div>
    );
  }

  // --------------------------------------------------
  // NORMALIZE SUMMARY
  // --------------------------------------------------

  const orders = Number(
    summary?.orders ?? 0
  );

  const grossSales = Number(
    summary?.grossSales ??
      summary?.gross_sales ??
      0
  );

  const invoiced = Number(
    summary?.invoiced ??
      summary?.invoice_total ??
      0
  );

  const discount = Number(
    summary?.discount ??
      summary?.total_discount ??
      0
  );

  const tax = Number(
    summary?.tax ??
      summary?.total_tax ??
      0
  );

  const completedOrders = Number(
    summary?.completedOrders ??
      summary?.completed_orders ??
      0
  );

  const cancelledOrders = Number(
    summary?.cancelledOrders ??
      summary?.cancelled_orders ??
      0
  );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="flex flex-wrap items-end justify-between gap-3">

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400 font-semibold">
            Today at Red Chilli
          </p>

          <h1 className="text-2xl lg:text-3xl font-bold text-cream-100 mt-1">
            Counter Overview
          </h1>

          <p className="text-sm text-charcoal-500 mt-1">
            Live operational summary for {today}.
          </p>
        </div>

        <Link
          to="/billing"
          className="btn-primary"
        >
          <Receipt className="w-4 h-4" />

          New Bill
        </Link>
      </div>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">

        <DashboardCard
          icon={ShoppingBag}
          label="Today's Orders"
          value={orders}
          accent="chilli"
        />

        <DashboardCard
          icon={TrendingUp}
          label="Gross Sales"
          value={formatCurrency(grossSales)}
          accent="green"
        />

        <DashboardCard
          icon={FileText}
          label="Invoiced"
          value={formatCurrency(invoiced)}
          accent="gold"
        />

        <DashboardCard
          icon={Package}
          label="Tax Collected"
          value={formatCurrency(tax)}
          accent="blue"
        />

      </div>

      {/* =================================================
          RECENT ORDERS + TOP ITEMS
      ================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">

        {/* ===============================================
            RECENT ORDERS
        =============================================== */}

        <div className="xl:col-span-2 card overflow-hidden">

          <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-800">

            <div>
              <h3 className="font-bold text-charcoal-100">
                Recent Orders
              </h3>

              <p className="text-xs text-charcoal-500 mt-0.5">
                Latest counter activity
              </p>
            </div>

            <Link
              to="/orders"
              className="flex items-center gap-1 text-xs text-chilli-400 hover:text-chilli-300"
            >
              View All

              <ArrowRight className="w-3 h-3" />
            </Link>

          </div>

          {recentOrders.length === 0 ? (

            <EmptyState
              icon={Receipt}
              title="No orders today"
              message="New bills will appear here."
            />

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[760px]">

                <thead>

                  <tr className="border-b border-charcoal-800">

                    <th className="table-header">
                      Order
                    </th>

                    <th className="table-header">
                      KOT
                    </th>

                    <th className="table-header">
                      Type
                    </th>

                    <th className="table-header">
                      Table / Room
                    </th>

                    <th className="table-header">
                      Guests
                    </th>

                    <th className="table-header text-right">
                      Total
                    </th>

                    <th className="table-header">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recentOrders.map((order) => (

                    <tr
                      key={order.id}
                      className="table-row"
                    >

                      {/* Order */}

                      <td className="table-cell">

                        <Link
                          to={`/orders/${order.id}`}
                          className="font-semibold text-chilli-400 hover:text-chilli-300"
                        >
                          {order.order_number}
                        </Link>

                        <p className="text-[11px] text-charcoal-500 mt-0.5">
                          {formatDateTime(
                            order.created_at
                          )}
                        </p>

                      </td>

                      {/* KOT */}

                      <td className="table-cell">

                        #
                        {String(
                          order.kitchen_token_number ?? 0
                        ).padStart(3, '0')}

                      </td>

                      {/* Order Type */}

                      <td className="table-cell">

                        <OrderTypeBadge
                          type={order.order_type}
                        />

                      </td>

                      {/* Table / Room */}

                      <td className="table-cell">

                        {order.order_type === 'DINE_IN' &&
                        order.table_number
                          ? `Table ${order.table_number}`
                          : order.order_type === 'ROOM_SERVICE' &&
                            order.room_number
                          ? `Room ${order.room_number}`
                          : 'Takeaway'}

                      </td>

                      {/* Guests */}

                      <td className="table-cell">

                        {order.guest_count ?? 1}

                      </td>

                      {/* Total */}

                      <td className="table-cell text-right font-semibold">

                        {formatCurrency(
                          order.total ?? 0
                        )}

                      </td>

                      {/* Status */}

                      <td className="table-cell">

                        <StatusBadge
                          status={
                            order.order_status
                          }
                        />

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* ===============================================
            TOP SELLING ITEMS
        =============================================== */}

        <div className="card overflow-hidden">

          <div className="flex items-center gap-2 px-5 py-4 border-b border-charcoal-800">

            <BarChart3 className="w-4 h-4 text-gold-400" />

            <div>

              <h3 className="font-bold text-charcoal-100">
                Top Selling Items
              </h3>

              <p className="text-xs text-charcoal-500">
                By quantity today
              </p>

            </div>

          </div>

          {topItems.length === 0 ? (

            <EmptyState
              icon={Utensils}
              title="No sales yet"
              message="Top items appear after orders are placed."
            />

          ) : (

            <div className="p-4 space-y-3">

              {topItems.map((item, index) => (

                <div
                  key={`${item.item_name ?? item.name ?? 'item'}-${index}`}
                  className="flex items-center gap-3"
                >

                  {/* Ranking */}

                  <div className="w-8 h-8 rounded-lg bg-charcoal-800 flex items-center justify-center text-xs font-bold text-gold-400">
                    {index + 1}
                  </div>

                  {/* Item */}

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-medium text-charcoal-200 truncate">
                      {item.item_name ??
                        item.name ??
                        'Unknown Item'}
                    </p>

                    <p className="text-xs text-charcoal-500">
                      {item.quantity ??
                        item.total_quantity ??
                        0}{' '}
                      sold
                    </p>

                  </div>

                  {/* Revenue */}

                  <span className="text-sm font-semibold text-charcoal-300">

                    {formatCurrency(
                      item.revenue ??
                        item.total_revenue ??
                        0
                    )}

                  </span>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          ADDITIONAL SUMMARY
      ================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Discounts */}

        <div className="card p-4">

          <p className="text-xs text-charcoal-500">
            Discounts
          </p>

          <p className="text-lg font-bold text-charcoal-100 mt-1">
            {formatCurrency(discount)}
          </p>

        </div>

        {/* Tax */}

        <div className="card p-4">

          <p className="text-xs text-charcoal-500">
            Tax
          </p>

          <p className="text-lg font-bold text-charcoal-100 mt-1">
            {formatCurrency(tax)}
          </p>

        </div>

        {/* Completed */}

        <div className="card p-4">

          <p className="text-xs text-charcoal-500">
            Completed
          </p>

          <p className="text-lg font-bold text-emerald-400 mt-1">
            {completedOrders}
          </p>

        </div>

        {/* Cancelled */}

        <div className="card p-4">

          <p className="text-xs text-charcoal-500">
            Cancelled
          </p>

          <p className="text-lg font-bold text-red-400 mt-1">
            {cancelledOrders}
          </p>

        </div>

      </div>

    </div>
  );
}