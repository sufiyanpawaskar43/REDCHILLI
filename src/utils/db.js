
import { supabase } from '@/lib/supabase';

export function normalizeOrder(row = {}) {
  return {
    ...row,
    kot_number: row.kot_number ?? row.kitchen_token_number,
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    tax: Number(row.tax || 0),
    total: Number(row.total || 0),
    guest_count: Number(row.guest_count || 1),
    order_items: (row.order_items || []).map((item) => ({
      ...item,
      item_name: item.item_name ?? item.item_name_snapshot,
      variant_name: item.variant_name ?? item.variant_name_snapshot,
      unit_price: Number(item.unit_price ?? item.unit_price_snapshot ?? 0),
      line_total: Number(item.line_total || 0),
    })),
  };
}

export function normalizeOrderResult(result = {}) {
  return {
    id: result.id ?? result.orderId,
    order_number: result.order_number ?? result.orderNumber,
    kot_number: result.kot_number ?? result.kitchenTokenNumber ?? result.tokenNumber,
    subtotal: Number(result.subtotal || 0),
    discount: Number(result.discount ?? result.discountAmount ?? 0),
    tax: Number(result.tax ?? result.totalTax ?? 0),
    total: Number(result.total ?? result.grandTotal ?? 0),
    order_type: result.order_type ?? result.orderType,
    table_number: result.table_number ?? result.tableNumber,
    room_number: result.room_number ?? result.roomNumber,
    guest_count: Number(result.guest_count ?? result.guestCount ?? 1),
    status: result.status ?? result.order_status ?? 'PENDING',
    raw: result,
  };
}

export function normalizeInvoice(raw = {}) {
  const invoice = raw.invoice ?? raw;
  const items = raw.items ?? raw.invoice_items ?? invoice.invoice_items ?? [];

  return {
    ...invoice,
    invoice_number: invoice.invoice_number ?? invoice.invoiceNumber,
    order_id: invoice.order_id ?? invoice.orderId,
    order_number: invoice.order_number ?? invoice.orderNumber,
    kot_number: invoice.kot_number ?? invoice.kitchen_token_number ?? invoice.kitchenTokenNumber ?? invoice.kitchen_token_number_snapshot,
    order_type: invoice.order_type ?? invoice.orderType ?? invoice.order_type_snapshot,
    table_number: invoice.table_number ?? invoice.tableNumber ?? invoice.table_number_snapshot,
    room_number: invoice.room_number ?? invoice.roomNumber ?? invoice.room_number_snapshot,
    guest_count: Number(invoice.guest_count ?? invoice.guestCount ?? invoice.guest_count_snapshot ?? 1),
    subtotal: Number(invoice.subtotal || 0),
    discount: Number(invoice.discount ?? invoice.discount_amount ?? 0),
    cgst_amount: Number(invoice.cgst_amount ?? invoice.cgst ?? 0),
    sgst_amount: Number(invoice.sgst_amount ?? invoice.sgst ?? 0),
    igst_amount: Number(invoice.igst_amount ?? invoice.igst ?? 0),
    other_tax_amount: Number(invoice.other_tax_amount ?? invoice.otherTax ?? 0),
    grand_total: Number(invoice.grand_total ?? invoice.grandTotal ?? 0),
    hotel_name: invoice.hotel_name ?? invoice.hotel_name_snapshot,
    hotel_address: invoice.hotel_address ?? invoice.hotel_address_snapshot,
    hotel_gst: invoice.hotel_gst ?? invoice.hotel_gst_snapshot,
    created_at: invoice.created_at,
    invoice_items: items.map((item) => ({
      ...item,
      item_name: item.item_name ?? item.item_name_snapshot ?? item.name,
      variant_name: item.variant_name ?? item.variant_name_snapshot ?? item.variant,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price ?? item.unit_price_snapshot ?? 0),
      line_total: Number(item.line_total || 0),
    })),
  };
}

export async function createStaffOrder(payload) {
  const { data, error } = await supabase.rpc('create_staff_order_with_guest_count', payload);
  if (error) throw error;
  return normalizeOrderResult(data || {});
}

export async function createInvoice(orderId) {
  const { data, error } = await supabase.rpc('create_invoice_for_order', {
    p_order_id: orderId,
  });
  if (error) throw error;
  return normalizeInvoice(data || {});
}

export async function getInvoiceDetails(invoiceId) {
  const { data, error } = await supabase.rpc('get_invoice_details', {
    p_invoice_id: invoiceId,
  });

  if (!error && data) return normalizeInvoice(data);

  const { data: fallback, error: fallbackError } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items(*)
    `)
    .eq('id', invoiceId)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  if (!fallback) return null;

  let orderNumber = null;
  const { data: order } = await supabase
    .from('orders')
    .select('order_number')
    .eq('id', fallback.order_id)
    .maybeSingle();

  orderNumber = order?.order_number ?? null;

  return normalizeInvoice({
    ...fallback,
    order_number: orderNumber,
  });
}

export async function getOrderDetails(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      kitchen_token_number,
      token_date,
      order_type,
      table_number,
      room_number,
      guest_count,
      subtotal,
      discount,
      tax,
      total,
      order_status,
      notes,
      created_at,
      updated_at,
      order_items(
        id,
        menu_item_id,
        menu_item_variant_id,
        item_name_snapshot,
        variant_name_snapshot,
        unit_price_snapshot,
        quantity,
        discount,
        tax,
        line_total,
        created_at
      )
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeOrder(data) : null;
}
