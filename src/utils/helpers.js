export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function dateRangeISO(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function generateIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  const msg = error.message || String(error);
  if (msg.includes('Invalid login')) return 'Invalid email or password.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Unable to connect to the billing server. Please try again.';
  return fallback;
}

export function orderTypeLabel(type) {
  const labels = { DINE_IN: 'Dine In', TAKEAWAY: 'Takeaway', ROOM_SERVICE: 'Room Service' };
  return labels[type] || type || '—';
}

export function orderTypeIcon(type) {
  const icons = { DINE_IN: 'utensils', TAKEAWAY: 'shopping-bag', ROOM_SERVICE: 'bed-double' };
  return icons[type] || 'clipboard';
}
