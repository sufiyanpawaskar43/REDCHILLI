
import { formatCurrency, formatDateTime, orderTypeLabel } from '@/utils/helpers';

function InvoiceHeader({ invoice, hotel }) {
  const name = hotel?.hotel_name || invoice.hotel_name || 'RED CHILLI';
  const address = hotel?.address || invoice.hotel_address || '';
  const gst = hotel?.gst_number || invoice.hotel_gst || '';

  return (
    <div className="text-center mb-5 pb-4 border-b-2 border-gray-800">
      <h1 className="text-3xl font-bold tracking-wide">{name}</h1>
      {address && <p className="text-sm text-gray-600 mt-1">{address}</p>}
      {gst && <p className="text-sm text-gray-600">GSTIN: {gst}</p>}
      <p className="text-lg font-semibold mt-2">TAX INVOICE</p>
    </div>
  );
}

export default function InvoicePrint({ invoice, hotel, items = [] }) {
  if (!invoice) return null;
  const rows = items.length ? items : invoice.invoice_items || [];

  return (
    <div className="a4-print bg-white text-black mx-auto">
      <InvoiceHeader invoice={invoice} hotel={hotel} />

      <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
        <div className="space-y-1">
          <p><b>Invoice No:</b> {invoice.invoice_number}</p>
          <p><b>Order No:</b> {invoice.order_number || '—'}</p>
          <p><b>KOT No:</b> #{String(invoice.kot_number ?? '—').padStart(3, '0')}</p>
        </div>
        <div className="space-y-1 text-right">
          <p><b>Date:</b> {formatDateTime(invoice.created_at)}</p>
          <p><b>Order Type:</b> {orderTypeLabel(invoice.order_type)}</p>
          <p><b>{invoice.order_type === 'DINE_IN' ? 'Table' : invoice.order_type === 'ROOM_SERVICE' ? 'Room' : 'Mode'}:</b> {invoice.table_number || invoice.room_number || 'Takeaway'}</p>
          <p><b>Guests:</b> {invoice.guest_count || 1}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 border-2 border-gray-800">
            <th className="text-left py-2 px-2">#</th>
            <th className="text-left py-2 px-2">Item</th>
            <th className="text-left py-2 px-2">Variant</th>
            <th className="text-center py-2 px-2">Qty</th>
            <th className="text-right py-2 px-2">Price</th>
            <th className="text-right py-2 px-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={item.id || index} className="border-b border-gray-300">
              <td className="py-2 px-2">{index + 1}</td>
              <td className="py-2 px-2 font-medium">{item.item_name}</td>
              <td className="py-2 px-2 text-gray-600">{item.variant_name || '—'}</td>
              <td className="py-2 px-2 text-center">{item.quantity}</td>
              <td className="py-2 px-2 text-right">{formatCurrency(item.unit_price)}</td>
              <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-80 mt-5 space-y-1 text-sm">
        <Row label="Subtotal" value={invoice.subtotal} />
        {invoice.discount > 0 && <Row label="Discount" value={-invoice.discount} />}
        {invoice.cgst_amount > 0 && <Row label="CGST" value={invoice.cgst_amount} />}
        {invoice.sgst_amount > 0 && <Row label="SGST" value={invoice.sgst_amount} />}
        {invoice.igst_amount > 0 && <Row label="IGST" value={invoice.igst_amount} />}
        {invoice.other_tax_amount > 0 && <Row label="Other Tax" value={invoice.other_tax_amount} />}
        <div className="flex justify-between py-2 border-t-2 border-gray-800 text-lg font-bold">
          <span>GRAND TOTAL</span>
          <span>{formatCurrency(invoice.grand_total)}</span>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Thank you for dining with us!</p>
        <p className="mt-1">Computer-generated invoice.</p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1">
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

export function InvoiceThermalPrint({ invoice, hotel, items = [] }) {
  if (!invoice) return null;
  const rows = items.length ? items : invoice.invoice_items || [];
  const name = hotel?.hotel_name || invoice.hotel_name || 'RED CHILLI';

  return (
    <div className="thermal-print bg-white text-black mx-auto">
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <h1 className="font-bold text-sm">{name}</h1>
        {hotel?.address && <p className="text-xs">{hotel.address}</p>}
        {hotel?.gst_number && <p className="text-xs">GST: {hotel.gst_number}</p>}
        <p className="font-semibold text-xs mt-1">TAX INVOICE</p>
      </div>

      <div className="text-xs space-y-0.5 mb-2">
        <div className="flex justify-between"><span>Invoice:</span><b>{invoice.invoice_number}</b></div>
        <div className="flex justify-between"><span>Order:</span><span>{invoice.order_number || '—'}</span></div>
        <div className="flex justify-between"><span>KOT:</span><span>#{String(invoice.kot_number ?? '—').padStart(3, '0')}</span></div>
        <div className="flex justify-between"><span>Date:</span><span>{formatDateTime(invoice.created_at)}</span></div>
        <div className="flex justify-between"><span>Type:</span><span>{orderTypeLabel(invoice.order_type)}</span></div>
        {invoice.table_number && <div className="flex justify-between"><span>Table:</span><span>{invoice.table_number}</span></div>}
        {invoice.room_number && <div className="flex justify-between"><span>Room:</span><span>{invoice.room_number}</span></div>}
        <div className="flex justify-between"><span>Guests:</span><span>{invoice.guest_count || 1}</span></div>
      </div>

      <div className="border-t border-dashed border-gray-400 pt-2">
        {rows.map((item, index) => (
          <div key={item.id || index} className="text-xs py-0.5">
            <div className="flex">
              <span className="flex-1">{item.item_name}</span>
              <span className="w-8 text-center">{item.quantity}</span>
              <span className="w-16 text-right">{formatCurrency(item.line_total)}</span>
            </div>
            {item.variant_name && <div className="pl-2 text-gray-600">{item.variant_name}</div>}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 mt-2 pt-1 text-xs">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
        {invoice.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(invoice.discount)}</span></div>}
        {invoice.cgst_amount > 0 && <div className="flex justify-between"><span>CGST</span><span>{formatCurrency(invoice.cgst_amount)}</span></div>}
        {invoice.sgst_amount > 0 && <div className="flex justify-between"><span>SGST</span><span>{formatCurrency(invoice.sgst_amount)}</span></div>}
        {invoice.igst_amount > 0 && <div className="flex justify-between"><span>IGST</span><span>{formatCurrency(invoice.igst_amount)}</span></div>}
        {invoice.other_tax_amount > 0 && <div className="flex justify-between"><span>Other Tax</span><span>{formatCurrency(invoice.other_tax_amount)}</span></div>}
        <div className="flex justify-between font-bold text-sm border-t border-gray-800 pt-1 mt-1">
          <span>TOTAL</span><span>{formatCurrency(invoice.grand_total)}</span>
        </div>
      </div>
    </div>
  );
}
