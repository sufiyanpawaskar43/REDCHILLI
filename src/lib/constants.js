export const ORDER_TYPES = {
  DINE_IN: { label: 'Dine In', icon: 'utensils', color: 'chilli' },
  TAKEAWAY: { label: 'Takeaway', icon: 'shopping-bag', color: 'gold' },
  ROOM_SERVICE: { label: 'Room Service', icon: 'bed-double', color: 'blue' },
};

export const ORDER_STATUS = {
  PENDING: { label: 'Pending', badge: 'badge-gold' },
  COMPLETED: { label: 'Completed', badge: 'badge-green' },
  CANCELLED: { label: 'Cancelled', badge: 'badge-red' },
};

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'layout-dashboard', roles: ['staff', 'admin'] },
  { path: '/billing', label: 'New Bill', icon: 'receipt', roles: ['staff', 'admin'] },
  { path: '/orders', label: 'Orders', icon: 'clipboard-list', roles: ['staff', 'admin'] },
  { path: '/invoices', label: 'Invoices', icon: 'file-text', roles: ['staff', 'admin'] },
  { path: '/reports', label: 'Reports', icon: 'bar-chart-3', roles: ['staff', 'admin'] },
  { path: '/menu', label: 'Menu', icon: 'book-open', roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: 'settings', roles: ['admin'] },
];

export const DEFAULT_HOTEL = {
  name: 'RED CHILLI',
  tagline: 'Hotel & Restaurant',
};

export const STORAGE_KEYS = {
  CART: 'rc_cart',
  ORDER_TYPE: 'rc_order_type',
  TABLE: 'rc_table',
  ROOM: 'rc_room',
  GUESTS: 'rc_guests',
  NOTES: 'rc_notes',
  DISCOUNT: 'rc_discount',
};
