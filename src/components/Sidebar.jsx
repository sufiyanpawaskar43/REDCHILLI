import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS } from '@/lib/constants';
import { LogOut, X } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function Sidebar({ open, onClose }) {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.roles.includes('admin') && !isAdmin) return false;
    return true;
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-charcoal-900 border-r border-charcoal-800
        flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-charcoal-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-charcoal-950 border border-charcoal-700 flex items-center justify-center overflow-hidden shadow-lg shadow-black/30">
              <img src="/assets/red-chilli-logo.png" alt="Red Chilli" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-cream-100 leading-tight">RED CHILLI</h1>
              <p className="text-[10px] text-charcoal-500 uppercase tracking-widest">Billing System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden btn-icon text-charcoal-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const Icon = Icons[item.icon] || Icons.Circle;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-chilli-600/15 text-chilli-400 border-l-2 border-chilli-500'
                    : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-charcoal-800 p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-charcoal-700 flex items-center justify-center text-sm font-bold text-chilli-400">
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-charcoal-200 truncate">
                {profile?.full_name || 'Staff'}
              </p>
              <p className="text-xs text-charcoal-500 capitalize">{profile?.role || 'staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-charcoal-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
