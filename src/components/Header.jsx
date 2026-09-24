import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Menu, Calendar } from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/billing': 'New Bill',
  '/orders': 'Orders',
  '/invoices': 'Invoices',
  '/reports': 'Reports',
  '/menu': 'Menu Management',
  '/menu/categories': 'Categories',
  '/menu/items': 'Menu Items',
  '/menu/variants': 'Variants',
  '/settings': 'Settings',
};

export default function Header({ onMenuClick }) {
  const { profile } = useAuth();
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const path = location.pathname;
  let title = 'Dashboard';
  if (path.startsWith('/orders/')) title = 'Order Details';
  else if (path.startsWith('/invoices/')) title = 'Invoice Details';
  else title = pageTitles[path] || pageTitles[path.split('/').slice(0, 2).join('/')] || 'Red Chilli';

  return (
    <header className="h-16 bg-charcoal-900 border-b border-charcoal-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden btn-icon text-charcoal-300 hover:bg-charcoal-800">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-charcoal-100">{title}</h2>
          <p className="text-xs text-charcoal-500 hidden sm:block">Red Chilli Hotel & Restaurant</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm text-charcoal-400">
          <Calendar className="w-4 h-4" />
          <span>{now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
          <span className="text-charcoal-600">|</span>
          <span className="font-mono">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-chilli-600/20 flex items-center justify-center text-xs font-bold text-chilli-400">
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-charcoal-200 leading-tight">{profile?.full_name || 'Staff'}</p>
            <p className="text-xs text-charcoal-500 capitalize">{profile?.role || 'staff'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
