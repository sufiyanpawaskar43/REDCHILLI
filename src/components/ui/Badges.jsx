import { formatCurrency, orderTypeLabel } from '@/utils/helpers';
import { Utensils, ShoppingBag, BedDouble } from 'lucide-react';

const typeIcons = {
  DINE_IN: Utensils,
  TAKEAWAY: ShoppingBag,
  ROOM_SERVICE: BedDouble,
};

export function DashboardCard({ icon: Icon, label, value, sublabel, accent = 'chilli' }) {
  const accents = {
    chilli: 'text-chilli-500 bg-chilli-500/10',
    gold: 'text-gold-500 bg-gold-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-emerald-500 bg-emerald-500/10',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {sublabel && <span className="text-xs text-charcoal-500">{sublabel}</span>}
      </div>
      <p className="text-2xl font-bold text-charcoal-100">{value}</p>
      <p className="text-xs text-charcoal-400 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function OrderTypeBadge({ type }) {
  const Icon = typeIcons[type] || Utensils;
  const colors = {
    DINE_IN: 'badge-red',
    TAKEAWAY: 'badge-gold',
    ROOM_SERVICE: 'badge-blue',
  };
  return (
    <span className={colors[type] || 'badge-gray'}>
      <Icon className="w-3 h-3" />
      {orderTypeLabel(type)}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    PENDING: 'badge-gold',
    COMPLETED: 'badge-green',
    CANCELLED: 'badge-red',
    ACTIVE: 'badge-green',
    INACTIVE: 'badge-gray',
    AVAILABLE: 'badge-green',
    UNAVAILABLE: 'badge-red',
  };
  const labels = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    AVAILABLE: 'Available',
    UNAVAILABLE: 'Unavailable',
  };
  return <span className={map[status] || 'badge-gray'}>{labels[status] || status}</span>;
}

export function StatRow({ label, value, bold = false }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? 'border-t border-charcoal-700 pt-2 mt-1' : ''}`}>
      <span className={`text-sm ${bold ? 'font-bold text-charcoal-100' : 'text-charcoal-400'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-chilli-400' : 'text-charcoal-200'}`}>{value}</span>
    </div>
  );
}

export function MoneyRow({ label, amount, bold = false, accent = false }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? 'border-t border-charcoal-700 pt-2 mt-1' : ''}`}>
      <span className={`text-sm ${bold ? 'font-bold text-charcoal-100' : accent ? 'text-chilli-400' : 'text-charcoal-400'}`}>{label}</span>
      <span className={`text-sm font-semibold ${bold ? 'text-chilli-400' : 'text-charcoal-200'}`}>{formatCurrency(amount)}</span>
    </div>
  );
}
