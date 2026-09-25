import {
  formatCurrency,
  formatDateTime,
  orderTypeLabel,
} from '@/utils/helpers';

/* =========================================================
   SAFE VALUE HELPERS
   ========================================================= */

function numberValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return 0;
}

function getItemName(item) {
  return (
    item.item_name ??
    item.item_name_snapshot ??
    item.name ??
    'Item'
  );
}

function getVariantName(item) {
  return (
    item.variant_name ??
    item.variant_name_snapshot ??
    item.variant ??
    ''
  );
}

function getQuantity(item) {
  return numberValue(
    item.quantity,
    item.qty,
    1
  );
}

function getUnitPrice(item) {
  const quantity = getQuantity(item);

  const directPrice = numberValue(
    item.unit_price,
    item.unit_price_snapshot,
    item.price,
    item.price_snapshot
  );

  if (directPrice > 0) {
    return directPrice;
  }

  const lineTotal = numberValue(
    item.line_total,
    item.line_total_snapshot,
    item.total,
    item.amount
  );

  if (
    lineTotal > 0 &&
    quantity > 0
  ) {
    return lineTotal / quantity;
  }

  return 0;
}

function getLineTotal(item) {
  const directTotal = numberValue(
    item.line_total,
    item.line_total_snapshot,
    item.total,
    item.amount
  );

  if (directTotal > 0) {
    return directTotal;
  }

  return (
    getUnitPrice(item) *
    getQuantity(item)
  );
}

function getInvoiceItems(invoice, items) {
  if (Array.isArray(items) && items.length) {
    return items;
  }

  if (
    Array.isArray(invoice?.invoice_items) &&
    invoice.invoice_items.length
  ) {
    return invoice.invoice_items;
  }

  return [];
}

function getGuestCount(invoice) {
  return numberValue(
    invoice?.guest_count,
    invoice?.guest_count_snapshot,
    1
  );
}

function getKotNumber(invoice) {
  return (
    invoice?.kot_number ??
    invoice?.kitchen_token_number ??
    invoice?.kitchen_token_number_snapshot ??
    '—'
  );
}

function getOrderType(invoice) {
  return (
    invoice?.order_type ??
    invoice?.order_type_snapshot ??
    ''
  );
}

function getTableNumber(invoice) {
  return (
    invoice?.table_number ??
    invoice?.table_number_snapshot ??
    ''
  );
}

function getRoomNumber(invoice) {
  return (
    invoice?.room_number ??
    invoice?.room_number_snapshot ??
    ''
  );
}

function getSubtotal(invoice, rows) {
  const direct = numberValue(
    invoice?.subtotal
  );

  if (direct > 0) {
    return direct;
  }

  return rows.reduce(
    (sum, item) =>
      sum + getLineTotal(item),
    0
  );
}

function getDiscount(invoice) {
  return numberValue(
    invoice?.discount
  );
}

function getTax(invoice) {
  return (
    numberValue(invoice?.cgst_amount) +
    numberValue(invoice?.sgst_amount) +
    numberValue(invoice?.igst_amount) +
    numberValue(invoice?.other_tax_amount)
  );
}

function getGrandTotal(
  invoice,
  subtotal,
  discount,
  tax
) {
  const direct = numberValue(
    invoice?.grand_total,
    invoice?.total
  );

  if (direct > 0) {
    return direct;
  }

  return (
    subtotal -
    discount +
    tax
  );
}

/* =========================================================
   HOTEL HEADER
   ========================================================= */

function InvoiceHeader({
  invoice,
  hotel,
}) {
  const name =
    hotel?.hotel_name ||
    invoice?.hotel_name ||
    'RED CHILLI';

  const address =
    hotel?.address ||
    invoice?.hotel_address ||
    '';

  const gst =
    hotel?.gst_number ||
    invoice?.hotel_gst ||
    '';

  return (
    <div className="invoice-header">
      <h1>{name}</h1>

      {address && (
        <p className="invoice-address">
          {address}
        </p>
      )}

      {gst && (
        <p className="invoice-gst">
          GSTIN: {gst}
        </p>
      )}

      <p className="invoice-title">
        TAX INVOICE
      </p>
    </div>
  );
}

/* =========================================================
   A4 INVOICE
   ========================================================= */

export default function InvoicePrint({
  invoice,
  hotel,
  items = [],
}) {
  if (!invoice) {
    return null;
  }

  const rows = getInvoiceItems(
    invoice,
    items
  );

  const subtotal = getSubtotal(
    invoice,
    rows
  );

  const discount =
    getDiscount(invoice);

  const cgst = numberValue(
    invoice.cgst_amount
  );

  const sgst = numberValue(
    invoice.sgst_amount
  );

  const igst = numberValue(
    invoice.igst_amount
  );

  const otherTax = numberValue(
    invoice.other_tax_amount
  );

  const tax =
    cgst +
    sgst +
    igst +
    otherTax;

  const grandTotal =
    getGrandTotal(
      invoice,
      subtotal,
      discount,
      tax
    );

  const orderType =
    getOrderType(invoice);

  const tableNumber =
    getTableNumber(invoice);

  const roomNumber =
    getRoomNumber(invoice);

  const guestCount =
    getGuestCount(invoice);

  const kotNumber =
    getKotNumber(invoice);

  return (
    <div className="a4-print invoice-document">

      <InvoiceHeader
        invoice={invoice}
        hotel={hotel}
      />

      {/* INFORMATION */}
      <div className="invoice-info-grid">

        <div className="invoice-info-left">
          <p>
            <b>Invoice No:</b>{' '}
            {invoice.invoice_number ||
              '—'}
          </p>

          <p>
            <b>Order No:</b>{' '}
            {invoice.order_number ||
              '—'}
          </p>

          <p>
            <b>KOT No:</b>{' '}
            #
            {String(kotNumber).padStart(
              3,
              '0'
            )}
          </p>
        </div>

        <div className="invoice-info-right">
          <p>
            <b>Date:</b>{' '}
            {formatDateTime(
              invoice.created_at
            )}
          </p>

          <p>
            <b>Order Type:</b>{' '}
            {orderTypeLabel(
              orderType
            )}
          </p>

          <p>
            <b>
              {orderType ===
              'DINE_IN'
                ? 'Table'
                : orderType ===
                  'ROOM_SERVICE'
                ? 'Room'
                : 'Mode'}
              :
            </b>{' '}
            {orderType ===
            'DINE_IN'
              ? tableNumber || '—'
              : orderType ===
                'ROOM_SERVICE'
              ? roomNumber || '—'
              : 'Takeaway'}
          </p>

          <p>
            <b>Guests:</b>{' '}
            {guestCount}
          </p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th className="col-number">
              #
            </th>

            <th className="col-item">
              Item
            </th>

            <th className="col-variant">
              Variant
            </th>

            <th className="col-qty">
              Qty
            </th>

            <th className="col-price">
              Price
            </th>

            <th className="col-total">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (item, index) => {
              const quantity =
                getQuantity(item);

              const unitPrice =
                getUnitPrice(item);

              const lineTotal =
                getLineTotal(item);

              return (
                <tr
                  key={
                    item.id ||
                    `${getItemName(
                      item
                    )}-${index}`
                  }
                >
                  <td className="col-number">
                    {index + 1}
                  </td>

                  <td className="col-item item-name">
                    {getItemName(item)}
                  </td>

                  <td className="col-variant">
                    {getVariantName(
                      item
                    ) || '—'}
                  </td>

                  <td className="col-qty">
                    {quantity}
                  </td>

                  <td className="col-price amount">
                    {formatCurrency(
                      unitPrice
                    )}
                  </td>

                  <td className="col-total amount">
                    {formatCurrency(
                      lineTotal
                    )}
                  </td>
                </tr>
              );
            }
          )}

          {!rows.length && (
            <tr>
              <td
                colSpan="6"
                className="empty-invoice-row"
              >
                No invoice items
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="invoice-totals">

        <InvoiceRow
          label="Subtotal"
          value={subtotal}
        />

        {discount > 0 && (
          <InvoiceRow
            label="Discount"
            value={-discount}
            discount
          />
        )}

        {cgst > 0 && (
          <InvoiceRow
            label="CGST"
            value={cgst}
          />
        )}

        {sgst > 0 && (
          <InvoiceRow
            label="SGST"
            value={sgst}
          />
        )}

        {igst > 0 && (
          <InvoiceRow
            label="IGST"
            value={igst}
          />
        )}

        {otherTax > 0 && (
          <InvoiceRow
            label="Other Tax"
            value={otherTax}
          />
        )}

        <div className="invoice-grand-total">
          <span>
            GRAND TOTAL
          </span>

          <span className="grand-total-amount">
            {formatCurrency(
              grandTotal
            )}
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="invoice-footer">
        <p>
          Thank you for dining with
          us!
        </p>

        <p>
          Computer-generated
          invoice.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   A4 ROW
   ========================================================= */

function InvoiceRow({
  label,
  value,
  discount = false,
}) {
  return (
    <div className="invoice-row">
      <span
        className={
          discount
            ? 'discount-text'
            : ''
        }
      >
        {label}
      </span>

      <span
        className={`invoice-row-amount ${
          discount
            ? 'discount-text'
            : ''
        }`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

/* =========================================================
   80MM THERMAL INVOICE
   ========================================================= */

export function InvoiceThermalPrint({
  invoice,
  hotel,
  items = [],
}) {
  if (!invoice) {
    return null;
  }

  const rows = getInvoiceItems(
    invoice,
    items
  );

  const name =
    hotel?.hotel_name ||
    invoice?.hotel_name ||
    'RED CHILLI';

  const address =
    hotel?.address ||
    invoice?.hotel_address ||
    '';

  const gst =
    hotel?.gst_number ||
    invoice?.hotel_gst ||
    '';

  const subtotal = getSubtotal(
    invoice,
    rows
  );

  const discount =
    getDiscount(invoice);

  const cgst = numberValue(
    invoice.cgst_amount
  );

  const sgst = numberValue(
    invoice.sgst_amount
  );

  const igst = numberValue(
    invoice.igst_amount
  );

  const otherTax = numberValue(
    invoice.other_tax_amount
  );

  const tax =
    cgst +
    sgst +
    igst +
    otherTax;

  const grandTotal =
    getGrandTotal(
      invoice,
      subtotal,
      discount,
      tax
    );

  const orderType =
    getOrderType(invoice);

  return (
    <div className="thermal-print">

      {/* HEADER */}
      <div className="thermal-header">
        <div className="thermal-hotel-name">
          {name}
        </div>

        {address && (
          <div>
            {address}
          </div>
        )}

        {gst && (
          <div>
            GSTIN: {gst}
          </div>
        )}

        <div className="thermal-title">
          TAX INVOICE
        </div>
      </div>

      {/* META */}
      <div className="thermal-meta">

        <div>
          <span>
            Invoice:
          </span>

          <b>
            {invoice.invoice_number ||
              '—'}
          </b>
        </div>

        <div>
          <span>
            Order:
          </span>

          <span>
            {invoice.order_number ||
              '—'}
          </span>
        </div>

        <div>
          <span>
            KOT:
          </span>

          <span>
            #
            {String(
              getKotNumber(invoice)
            ).padStart(
              3,
              '0'
            )}
          </span>
        </div>

        <div>
          <span>
            Date:
          </span>

          <span>
            {formatDateTime(
              invoice.created_at
            )}
          </span>
        </div>

        <div>
          <span>
            Type:
          </span>

          <span>
            {orderTypeLabel(
              orderType
            )}
          </span>
        </div>

        {orderType ===
          'DINE_IN' &&
          getTableNumber(
            invoice
          ) && (
            <div>
              <span>
                Table:
              </span>

              <span>
                {getTableNumber(
                  invoice
                )}
              </span>
            </div>
          )}

        {orderType ===
          'ROOM_SERVICE' &&
          getRoomNumber(
            invoice
          ) && (
            <div>
              <span>
                Room:
              </span>

              <span>
                {getRoomNumber(
                  invoice
                )}
              </span>
            </div>
          )}

        <div>
          <span>
            Guests:
          </span>

          <span>
            {getGuestCount(
              invoice
            )}
          </span>
        </div>
      </div>

      {/* ITEM HEADER */}
      <div className="thermal-item-header">
        <span>ITEM</span>
        <span>QTY</span>
        <span>AMOUNT</span>
      </div>

      {/* ITEMS */}
      <div className="thermal-items">

        {rows.map(
          (item, index) => {
            const quantity =
              getQuantity(item);

            const lineTotal =
              getLineTotal(item);

            return (
              <div
                key={
                  item.id ||
                  index
                }
                className="thermal-item"
              >
                <div className="thermal-item-main">
                  <span className="thermal-item-name">
                    {getItemName(
                      item
                    )}
                  </span>

                  <span className="thermal-qty">
                    {quantity}
                  </span>

                  <span className="thermal-amount">
                    {formatCurrency(
                      lineTotal
                    )}
                  </span>
                </div>

                {getVariantName(
                  item
                ) && (
                  <div className="thermal-variant">
                    {getVariantName(
                      item
                    )}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* TOTALS */}
      <div className="thermal-totals">

        <div className="thermal-row">
          <span>
            Subtotal
          </span>

          <span>
            {formatCurrency(
              subtotal
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="thermal-row">
            <span>
              Discount
            </span>

            <span>
              -
              {formatCurrency(
                discount
              )}
            </span>
          </div>
        )}

        {cgst > 0 && (
          <div className="thermal-row">
            <span>CGST</span>

            <span>
              {formatCurrency(cgst)}
            </span>
          </div>
        )}

        {sgst > 0 && (
          <div className="thermal-row">
            <span>SGST</span>

            <span>
              {formatCurrency(sgst)}
            </span>
          </div>
        )}

        {igst > 0 && (
          <div className="thermal-row">
            <span>IGST</span>

            <span>
              {formatCurrency(igst)}
            </span>
          </div>
        )}

        {otherTax > 0 && (
          <div className="thermal-row">
            <span>
              Other Tax
            </span>

            <span>
              {formatCurrency(
                otherTax
              )}
            </span>
          </div>
        )}

        <div className="thermal-grand-total">
          <span>TOTAL</span>

          <span>
            {formatCurrency(
              grandTotal
            )}
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="thermal-footer">
        <div>
          Thank you for dining
          with us!
        </div>

        <div>
          Computer-generated
          invoice.
        </div>
      </div>
    </div>
  );
}