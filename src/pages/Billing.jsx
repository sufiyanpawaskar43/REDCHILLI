import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Check,
  FileText,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  Utensils,
  X,
  StickyNote,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal';
import { CardSkeleton, ErrorState } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/States';
import { MoneyRow } from '@/components/ui/Badges';

import KOTPrint, { KOTA4Print } from '@/components/print/KOTPrint';
import InvoicePrint, {
  InvoiceThermalPrint,
} from '@/components/print/InvoicePrint';

import {
  createInvoice,
  createStaffOrder,
  getOrderDetails,
} from '@/utils/db';

import {
  classNames,
  formatCurrency,
  generateIdempotencyKey,
} from '@/utils/helpers';

const ORDER_TYPES = [
  {
    value: 'DINE_IN',
    label: 'Dine In',
    icon: Utensils,
  },
  {
    value: 'TAKEAWAY',
    label: 'Takeaway',
    icon: ShoppingBag,
  },
  {
    value: 'ROOM_SERVICE',
    label: 'Room Service',
    icon: BedDouble,
  },
];

export default function Billing() {
  const toast = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [cart, setCart] = useState([]);
  const [variantItem, setVariantItem] = useState(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [printView, setPrintView] = useState(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        catRes,
        itemRes,
        variantRes,
        hotelRes,
        taxRes,
      ] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('id,name,slug,display_order,is_active')
          .eq('is_active', true)
          .order('display_order'),

        supabase
          .from('menu_items')
          .select(
            'id,category_id,name,description,food_type,availability,is_active,display_order'
          )
          .eq('is_active', true)
          .order('display_order')
          .order('name'),

        supabase
          .from('menu_item_variants')
          .select(
            'id,menu_item_id,name,price,is_default,is_active'
          )
          .eq('is_active', true),

        supabase
          .from('hotel_settings')
          .select('*')
          .limit(1)
          .maybeSingle(),

        supabase
          .from('tax_settings')
          .select('*')
          .limit(1)
          .maybeSingle(),
      ]);

      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;
      if (variantRes.error) throw variantRes.error;
      if (hotelRes.error) throw hotelRes.error;
      if (taxRes.error) throw taxRes.error;

      setCategories(catRes.data || []);
      setItems(itemRes.data || []);
      setVariants(variantRes.data || []);
      setHotel(hotelRes.data || null);
      setTaxSettings(taxRes.data || null);
    } catch (err) {
      console.error(err);
      setError('Unable to load the Red Chilli menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'F4') {
        event.preventDefault();
        document.getElementById('menu-search')?.focus();
      }

      if (event.key === 'F8' && cart.length && !creating) {
        event.preventDefault();
        handleCreateOrder();
      }

      if (event.key === 'Escape' && cartOpen) {
        event.preventDefault();
        setCartOpen(false);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [cart.length, creating, cartOpen]);

  const variantsByItem = useMemo(() => {
    const map = {};

    variants.forEach((variant) => {
      if (!map[variant.menu_item_id]) {
        map[variant.menu_item_id] = [];
      }

      map[variant.menu_item_id].push(variant);
    });

    Object.values(map).forEach((list) => {
      list.sort(
        (a, b) =>
          Number(b.is_default) - Number(a.is_default)
      );
    });

    return map;
  }, [variants]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const categoryMatch =
        category === 'all' ||
        item.category_id === category;

      const searchMatch =
        !q ||
        item.name.toLowerCase().includes(q);

      return categoryMatch && searchMatch;
    });
  }, [items, category, search]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.unit_price) * item.quantity,
        0
      ),
    [cart]
  );

  const discountValue = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  );

  const taxable = Math.max(
    subtotal - discountValue,
    0
  );

  const cgstPreview =
    Math.round(
      (taxable *
        Number(taxSettings?.cgst_rate || 0)) /
        100 *
        100
    ) / 100;

  const sgstPreview =
    Math.round(
      (taxable *
        Number(taxSettings?.sgst_rate || 0)) /
        100 *
        100
    ) / 100;

  const igstPreview =
    Math.round(
      (taxable *
        Number(taxSettings?.igst_rate || 0)) /
        100 *
        100
    ) / 100;

  const otherTaxPreview =
    Math.round(
      (taxable *
        Number(taxSettings?.other_tax_rate || 0)) /
        100 *
        100
    ) / 100;

  const estimatedTax =
    cgstPreview +
    sgstPreview +
    igstPreview +
    otherTaxPreview;

  const estimatedTotal =
    Math.round(
      (taxable + estimatedTax) * 100
    ) / 100;

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const addItem = (item, variant) => {
    const selected =
      variant ||
      variantsByItem[item.id]?.[0];

    if (!selected) {
      toast.error(
        'This menu item has no active variant.'
      );
      return;
    }

    if (item.availability !== 'AVAILABLE') {
      toast.error(
        'This item is currently unavailable.'
      );
      return;
    }

    const key = `${item.id}:${selected.id}`;

    setCart((current) => {
      const existing = current.find(
        (line) => line.key === key
      );

      if (existing) {
        return current.map((line) =>
          line.key === key
            ? {
                ...line,
                quantity: line.quantity + 1,
              }
            : line
        );
      }

      return [
        ...current,
        {
          key,
          menuItemId: item.id,
          menuItemVariantId: selected.id,
          item_name: item.name,
          variant_name: selected.name,
          unit_price: Number(selected.price),
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (key, delta) => {
    setCart((current) =>
      current
        .map((line) =>
          line.key === key
            ? {
                ...line,
                quantity: line.quantity + delta,
              }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const validate = () => {
    if (!cart.length) {
      toast.error(
        'Please add at least one item.'
      );
      return false;
    }

    if (
      orderType === 'DINE_IN' &&
      !tableNumber.trim()
    ) {
      toast.error(
        'Table number is required.'
      );
      return false;
    }

    if (
      orderType === 'ROOM_SERVICE' &&
      !roomNumber.trim()
    ) {
      toast.error(
        'Room number is required.'
      );
      return false;
    }

    if (
      !Number.isInteger(Number(guestCount)) ||
      Number(guestCount) < 1
    ) {
      toast.error(
        'Guest count must be at least 1.'
      );
      return false;
    }

    return true;
  };

  async function handleCreateOrder() {
    if (creating || !validate()) {
      return;
    }

    setCreating(true);

    try {
      const order = await createStaffOrder({
        p_order_type: orderType,

        p_table_number:
          orderType === 'DINE_IN'
            ? tableNumber.trim()
            : null,

        p_room_number:
          orderType === 'ROOM_SERVICE'
            ? roomNumber.trim()
            : null,

        p_notes:
          notes.trim() || null,

        p_idempotency_key:
          generateIdempotencyKey(),

        p_items: cart.map((line) => ({
          menuItemId: line.menuItemId,
          menuItemVariantId:
            line.menuItemVariantId,
          quantity: line.quantity,
        })),

        p_discount: discountValue,

        p_guest_count:
          Number(guestCount),
      });

      if (!order.id) {
        throw new Error(
          'Order created but no order id was returned.'
        );
      }

      const fullOrder =
        await getOrderDetails(order.id);

      setCreatedOrder(
        fullOrder || order
      );

      try {
        const invoice =
          await createInvoice(order.id);

        setCreatedInvoice(invoice);

        toast.success(
          'Order and invoice created successfully.'
        );
      } catch (invoiceError) {
        console.error(invoiceError);

        toast.success(
          'Order created. Invoice can be generated from Order Details.'
        );

        setCreatedInvoice(null);
      }

      setCart([]);
      setDiscount('');
      setNotes('');
      setTableNumber('');
      setRoomNumber('');
      setGuestCount(1);
      setCartOpen(false);
    } catch (err) {
      console.error(err);

      const message = String(
        err?.message || ''
      ).toLowerCase();

      if (
        message.includes('unavailable')
      ) {
        toast.error(
          'One or more items are no longer available.'
        );
      } else if (
        message.includes('idempotency')
      ) {
        toast.error(
          'This order request was already processed.'
        );
      } else if (
        message.includes('authentication')
      ) {
        toast.error(
          'Please sign in again.'
        );
      } else {
        toast.error(
          'Unable to create order. Please try again.'
        );
      }
    } finally {
      setCreating(false);
    }
  }

  const startNewBill = () => {
    setCreatedOrder(null);
    setCreatedInvoice(null);
    setPrintView(null);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <CardSkeleton count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message={error}
          onRetry={loadMenu}
        />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">

      {/* TOP CONTROLS */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-3 border-b border-charcoal-800 bg-charcoal-900/70 space-y-3">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex gap-1 bg-charcoal-800 rounded-xl p-1">
            {ORDER_TYPES.map(
              ({
                value,
                label,
                icon: Icon,
              }) => (
                <button
                  key={value}
                  onClick={() =>
                    setOrderType(value)
                  }
                  className={classNames(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all',
                    orderType === value
                      ? 'bg-chilli-600 text-white shadow-md'
                      : 'text-charcoal-400 hover:text-charcoal-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {label}
                  </span>
                </button>
              )
            )}
          </div>

          {orderType === 'DINE_IN' && (
            <input
              className="input w-28"
              value={tableNumber}
              onChange={(e) =>
                setTableNumber(e.target.value)
              }
              placeholder="Table"
            />
          )}

          {orderType === 'ROOM_SERVICE' && (
            <input
              className="input w-28"
              value={roomNumber}
              onChange={(e) =>
                setRoomNumber(e.target.value)
              }
              placeholder="Room"
            />
          )}

          <div className="flex items-center bg-charcoal-800 rounded-lg">
            <button
              className="btn-icon text-charcoal-400"
              onClick={() =>
                setGuestCount((v) =>
                  Math.max(1, v - 1)
                )
              }
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="w-8 text-center text-sm font-bold text-charcoal-100">
              {guestCount}
            </span>

            <button
              className="btn-icon text-charcoal-400"
              onClick={() =>
                setGuestCount((v) => v + 1)
              }
            >
              <Plus className="w-4 h-4" />
            </button>

            <span className="pr-3 text-xs text-charcoal-500 hidden sm:inline">
              Guests
            </span>
          </div>

          <button
            className="btn-ghost btn-sm"
            onClick={() => setNotesOpen(true)}
          >
            <StickyNote className="w-4 h-4" />

            <span className="hidden sm:inline">
              Notes
            </span>
          </button>

          <button
            className="btn-ghost btn-sm"
            onClick={() =>
              setDiscountOpen(true)
            }
          >
            <Tag className="w-4 h-4" />

            <span className="hidden sm:inline">
              Discount
            </span>

            {discountValue > 0 && (
              <span className="text-chilli-400">
                {formatCurrency(
                  discountValue
                )}
              </span>
            )}
          </button>

          {/* MOBILE CART BUTTON */}
          <button
            className="lg:hidden btn-primary ml-auto"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount}
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />

          <input
            id="menu-search"
            className="input pl-10"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search menu items... (F4)"
          />
        </div>
      </div>

      {/* CATEGORY BAR */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-2 border-b border-charcoal-800 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setCategory('all')}
            className={classNames(
              'px-3 py-1.5 rounded-lg text-sm font-semibold',
              category === 'all'
                ? 'bg-chilli-600 text-white'
                : 'bg-charcoal-800 text-charcoal-400'
            )}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setCategory(cat.id)
              }
              className={classNames(
                'px-3 py-1.5 rounded-lg text-sm font-semibold',
                category === cat.id
                  ? 'bg-chilli-600 text-white'
                  : 'bg-charcoal-800 text-charcoal-400'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* MENU */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">

          {!filteredItems.length ? (
            <EmptyState
              icon={Search}
              title="No menu items found"
              message="Try another search or category."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredItems.map((item) => {
                const list =
                  variantsByItem[item.id] ||
                  [];

                const first = list[0];

                const unavailable =
                  item.availability !==
                  'AVAILABLE';

                return (
                  <button
                    key={item.id}
                    disabled={
                      unavailable ||
                      !list.length
                    }
                    onClick={() =>
                      list.length > 1
                        ? setVariantItem(item)
                        : addItem(
                            item,
                            first
                          )
                    }
                    className={classNames(
                      'card p-3 text-left transition-all',
                      unavailable
                        ? 'opacity-45 cursor-not-allowed'
                        : 'hover:border-chilli-600/60 hover:-translate-y-0.5'
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <h3 className="font-semibold text-sm text-charcoal-100 line-clamp-2">
                        {item.name}
                      </h3>

                      <span
                        className={
                          item.food_type ===
                          'VEG'
                            ? 'text-emerald-400 text-[10px] border border-emerald-500/40 rounded px-1'
                            : 'text-red-400 text-[10px] border border-red-500/40 rounded px-1'
                        }
                      >
                        {item.food_type}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-500 mt-2 line-clamp-2">
                      {item.description ||
                        (first
                          ? first.name
                          : 'No active variant')}
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-gold-400 font-bold">
                        {first
                          ? formatCurrency(
                              first.price
                            )
                          : '—'}
                      </span>

                      {unavailable ? (
                        <span className="badge-red">
                          Unavailable
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-lg bg-chilli-600/15 flex items-center justify-center text-chilli-400">
                          <Plus className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* DESKTOP CART */}
        <div className="hidden lg:flex w-[360px] min-h-0 flex-shrink-0 border-l border-charcoal-800 bg-charcoal-900">
          <CartPanel
            cart={cart}
            subtotal={subtotal}
            discount={discountValue}
            taxable={taxable}
            estimatedTax={estimatedTax}
            estimatedTotal={estimatedTotal}
            creating={creating}
            onQty={updateQuantity}
            onRemove={(key) =>
              setCart((c) =>
                c.filter(
                  (x) => x.key !== key
                )
              )
            }
            onCreate={handleCreateOrder}
            onClear={() => {
              setCart([]);
              setDiscount('');
            }}
          />
        </div>
      </div>

      {/* MOBILE CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">

          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() =>
              setCartOpen(false)
            }
          />

          {/* DRAWER */}
          <div className="absolute right-0 top-0 h-dvh max-h-dvh w-full max-w-md bg-charcoal-900 shadow-2xl flex flex-col overflow-hidden">

            {/* DRAWER HEADER */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-charcoal-800">
              <h3 className="font-bold">
                Current Bill
              </h3>

              <button
                className="btn-icon"
                onClick={() =>
                  setCartOpen(false)
                }
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CART PANEL */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <CartPanel
                cart={cart}
                subtotal={subtotal}
                discount={discountValue}
                taxable={taxable}
                estimatedTax={estimatedTax}
                estimatedTotal={estimatedTotal}
                creating={creating}
                onQty={updateQuantity}
                onRemove={(key) =>
                  setCart((c) =>
                    c.filter(
                      (x) => x.key !== key
                    )
                  )
                }
                onCreate={async () => {
                  await handleCreateOrder();
                }}
                onClear={() => {
                  setCart([]);
                  setDiscount('');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* VARIANT MODAL */}
      <Modal
        open={!!variantItem}
        onClose={() =>
          setVariantItem(null)
        }
        title={
          variantItem?.name ||
          'Select Variant'
        }
        size="sm"
      >
        <div className="space-y-2">
          {(variantsByItem[
            variantItem?.id
          ] || []).map((variant) => (
            <button
              key={variant.id}
              className="w-full flex justify-between items-center p-3 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-left"
              onClick={() => {
                addItem(
                  variantItem,
                  variant
                );
                setVariantItem(null);
              }}
            >
              <span className="font-semibold">
                {variant.name}
              </span>

              <span className="text-gold-400 font-bold">
                {formatCurrency(
                  variant.price
                )}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* DISCOUNT MODAL */}
      <Modal
        open={discountOpen}
        onClose={() =>
          setDiscountOpen(false)
        }
        title="Apply Discount"
        size="sm"
      >
        <label className="label">
          Discount Amount (₹)
        </label>

        <input
          type="number"
          min="0"
          max={subtotal}
          value={discount}
          onChange={(e) =>
            setDiscount(
              e.target.value
            )
          }
          className="input"
          placeholder="0"
        />

        <div className="mt-4 bg-charcoal-800 rounded-lg p-3">
          <MoneyRow
            label="Subtotal"
            amount={subtotal}
          />

          <MoneyRow
            label="Discount"
            amount={-discountValue}
            accent
          />

          <MoneyRow
            label="Taxable Amount"
            amount={taxable}
            bold
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="btn-primary"
            onClick={() =>
              setDiscountOpen(false)
            }
          >
            Apply
          </button>
        </div>
      </Modal>

      {/* NOTES MODAL */}
      <Modal
        open={notesOpen}
        onClose={() =>
          setNotesOpen(false)
        }
        title="Order Notes"
        size="sm"
      >
        <textarea
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          rows={4}
          className="input resize-none"
          placeholder="Less spicy, no onion..."
        />

        <div className="mt-4 flex justify-end">
          <button
            className="btn-primary"
            onClick={() =>
              setNotesOpen(false)
            }
          >
            Save
          </button>
        </div>
      </Modal>

      {/* ORDER CREATED */}
      <Modal
        open={!!createdOrder}
        onClose={startNewBill}
        title="Order Created Successfully"
        size="md"
      >
        {createdOrder && (
          <div className="space-y-4">

            <div className="w-14 h-14 rounded-full bg-emerald-500/15 mx-auto flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="text-center">
              <p className="text-xs text-charcoal-500">
                Order Number
              </p>

              <p className="text-xl font-bold text-chilli-400">
                {createdOrder.order_number}
              </p>

              <p className="text-sm text-charcoal-400 mt-1">
                KOT #
                {String(
                  createdOrder.kot_number
                ).padStart(3, '0')}
              </p>
            </div>

            <div className="bg-charcoal-800 rounded-lg p-4">
              <MoneyRow
                label="Subtotal"
                amount={
                  createdOrder.subtotal
                }
              />

              <MoneyRow
                label="Discount"
                amount={
                  -createdOrder.discount
                }
                accent
              />

              <MoneyRow
                label="Tax"
                amount={
                  createdOrder.tax
                }
              />

              <MoneyRow
                label="Grand Total"
                amount={
                  createdOrder.total
                }
                bold
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-ghost"
                onClick={() =>
                  setPrintView(
                    'kot-thermal'
                  )
                }
              >
                <Printer className="w-4 h-4" />
                KOT 80mm
              </button>

              <button
                className="btn-ghost"
                onClick={() =>
                  setPrintView(
                    'kot-a4'
                  )
                }
              >
                <Printer className="w-4 h-4" />
                KOT A4
              </button>

              <button
                className="btn-gold"
                disabled={!createdInvoice}
                onClick={() =>
                  setPrintView(
                    'invoice-a4'
                  )
                }
              >
                <FileText className="w-4 h-4" />
                Invoice
              </button>

              <button
                className="btn-primary"
                onClick={startNewBill}
              >
                New Bill
              </button>
            </div>

            {!createdInvoice && (
              <p className="text-xs text-amber-400">
                Invoice could not be generated
                automatically. Open the order
                and retry.
              </p>
            )}

            <button
              className="w-full text-xs text-charcoal-500 hover:text-charcoal-300"
              onClick={() =>
                navigate(
                  `/orders/${createdOrder.id}`
                )
              }
            >
              Open Order Details
            </button>
          </div>
        )}
      </Modal>

      {/* PRINT PREVIEW */}
      <Modal
        open={!!printView}
        onClose={() =>
          setPrintView(null)
        }
        title="Print Preview"
        size="lg"
      >
        <div className="print-area bg-white rounded-lg overflow-auto">
          {printView === 'kot-thermal' && (
            <KOTPrint
              order={createdOrder}
              hotelName={
                hotel?.hotel_name ||
                'RED CHILLI'
              }
            />
          )}

          {printView === 'kot-a4' && (
            <KOTA4Print
              order={createdOrder}
              hotelName={
                hotel?.hotel_name ||
                'RED CHILLI'
              }
            />
          )}

          {printView === 'invoice-a4' && (
            <InvoicePrint
              invoice={createdInvoice}
              hotel={hotel}
              items={
                createdInvoice?.invoice_items ||
                []
              }
            />
          )}

          {printView === 'invoice-thermal' && (
            <InvoiceThermalPrint
              invoice={createdInvoice}
              hotel={hotel}
              items={
                createdInvoice?.invoice_items ||
                []
              }
            />
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="btn-ghost"
            onClick={() =>
              setPrintView(null)
            }
          >
            Close
          </button>

          <button
            className="btn-primary"
            onClick={() =>
              window.print()
            }
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </Modal>
    </div>
  );
}


/* =========================================================
   CART PANEL
   ========================================================= */

function CartPanel({
  cart,
  subtotal,
  discount,
  taxable,
  estimatedTax,
  estimatedTotal,
  creating,
  onQty,
  onRemove,
  onCreate,
  onClear,
}) {
  return (
    <div className="flex flex-col h-full min-h-0 w-full">

      {/* CART HEADER */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-charcoal-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-charcoal-100">
            Current Bill
          </h3>

          <p className="text-xs text-charcoal-500">
            {cart.reduce(
              (s, i) => s + i.quantity,
              0
            )}{' '}
            items
          </p>
        </div>

        <button
          className="text-xs text-red-400 hover:text-red-300"
          onClick={onClear}
          disabled={!cart.length}
        >
          Clear
        </button>
      </div>

      {/* SCROLLABLE ITEMS */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">

        {!cart.length ? (
          <EmptyState
            icon={ShoppingCart}
            title="Cart is empty"
            message="Select menu items to start a bill."
          />
        ) : (
          cart.map((line) => (
            <div
              key={line.key}
              className="rounded-xl bg-charcoal-800 p-3"
            >
              <div className="flex items-start gap-2">

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal-100">
                    {line.item_name}
                  </p>

                  <p className="text-xs text-charcoal-500">
                    {line.variant_name}
                  </p>

                  <p className="text-xs text-gold-400 mt-1">
                    {formatCurrency(
                      line.unit_price
                    )}{' '}
                    each
                  </p>
                </div>

                <button
                  className="text-charcoal-500 hover:text-red-400 p-1"
                  onClick={() =>
                    onRemove(line.key)
                  }
                  aria-label={`Remove ${line.item_name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">

                <div className="flex items-center gap-1 bg-charcoal-900 rounded-lg">

                  <button
                    className="btn-icon"
                    onClick={() =>
                      onQty(line.key, -1)
                    }
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-7 text-center text-sm font-bold">
                    {line.quantity}
                  </span>

                  <button
                    className="btn-icon"
                    onClick={() =>
                      onQty(line.key, 1)
                    }
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                </div>

                <span className="font-bold text-charcoal-100">
                  {formatCurrency(
                    line.unit_price *
                      line.quantity
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FIXED / NON-SCROLLING BILL SUMMARY */}
      <div className="flex-shrink-0 border-t border-charcoal-800 p-4 bg-charcoal-900 pb-[calc(1rem+env(safe-area-inset-bottom))]">

        <MoneyRow
          label="Subtotal"
          amount={subtotal}
        />

        <MoneyRow
          label="Discount"
          amount={-discount}
          accent
        />

        <div className="flex justify-between text-xs text-charcoal-500 py-1">
          <span>Tax</span>
          <span className="text-right">
            Calculated by backend
          </span>
        </div>

        <MoneyRow
          label="Tax"
          amount={estimatedTax}
        />

        <div className="border-t border-charcoal-700 mt-2 pt-2">

          <div className="flex justify-between items-center gap-3">
            <span className="font-bold">
              Estimated Total
            </span>

            <span className="text-xl font-bold text-gold-400 whitespace-nowrap">
              {formatCurrency(
                estimatedTotal
              )}
            </span>
          </div>

          <p className="text-[11px] text-charcoal-500 mt-1">
            Final total is calculated and
            validated by Supabase.
          </p>
        </div>

        {/* CREATE ORDER BUTTON */}
        <button
          type="button"
          className="btn-primary w-full mt-3 btn-lg flex-shrink-0"
          disabled={!cart.length || creating}
          onClick={onCreate}
        >
          {creating
            ? 'Creating...'
            : 'Create Order • F8'}
        </button>
      </div>
    </div>
  );
}