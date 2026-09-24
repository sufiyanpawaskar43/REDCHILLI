
import { formatTime, orderTypeLabel } from '@/utils/helpers';

export default function KOTPrint({ order, hotelName = 'RED CHILLI' }) {
  if (!order) return null;
  const kot = String(order.kot_number ?? order.kitchen_token_number ?? '—').padStart(3, '0');

  return (
    <div className="thermal-print bg-white text-black mx-auto" style={{ maxWidth: '80mm' }}>
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <h1 className="font-bold text-base tracking-wide">{hotelName}</h1>
        <p className="text-xs font-semibold">KITCHEN ORDER</p>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mb-2">
        <div>
          {order.order_type === 'DINE_IN' ? <>TABLE: <b>{order.table_number}</b></> :
            order.order_type === 'ROOM_SERVICE' ? <>ROOM: <b>{order.room_number}</b></> :
            <b>TAKEAWAY</b>}
        </div>
        <div className="text-right">KOT: <b>#{kot}</b></div>
        <div>GUESTS: <b>{order.guest_count || 1}</b></div>
        <div className="text-right">TIME: <b>{formatTime(order.created_at)}</b></div>
      </div>

      <div className="border-t border-dashed border-gray-400 pt-2">
        {(order.order_items || []).map((item) => (
          <div key={item.id} className="mb-2">
            <div className="font-bold">{item.quantity} × {item.item_name}</div>
            {item.variant_name && <div className="pl-4 text-xs">{item.variant_name}</div>}
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
          <p className="font-bold text-xs">NOTE:</p>
          <p className="text-xs">{order.notes}</p>
        </div>
      )}
    </div>
  );
}

export function KOTA4Print({ order, hotelName = 'RED CHILLI' }) {
  if (!order) return null;
  const kot = String(order.kot_number ?? order.kitchen_token_number ?? '—').padStart(3, '0');

  return (
    <div className="a4-print bg-white text-black mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold tracking-wide">{hotelName}</h1>
        <p className="text-base font-semibold">Kitchen Order</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5 border border-gray-300 rounded p-3 text-sm">
        <div><b>Type:</b> {orderTypeLabel(order.order_type)}</div>
        <div><b>{order.order_type === 'DINE_IN' ? 'Table' : order.order_type === 'ROOM_SERVICE' ? 'Room' : 'Mode'}:</b> {order.table_number || order.room_number || 'Takeaway'}</div>
        <div><b>KOT:</b> #{kot}</div>
        <div><b>Guests:</b> {order.guest_count || 1}</div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-400">
            <th className="text-left py-2 w-16">Qty</th>
            <th className="text-left py-2">Item</th>
            <th className="text-left py-2">Variant</th>
          </tr>
        </thead>
        <tbody>
          {(order.order_items || []).map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-2 font-bold">{item.quantity}</td>
              <td className="py-2 font-medium">{item.item_name}</td>
              <td className="py-2 text-gray-600">{item.variant_name || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.notes && (
        <div className="mt-5 p-3 border border-gray-300 rounded">
          <p className="font-semibold">Note:</p>
          <p>{order.notes}</p>
        </div>
      )}
    </div>
  );
}
