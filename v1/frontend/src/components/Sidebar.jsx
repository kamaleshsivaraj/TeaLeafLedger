import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Scale, Users, Truck, DollarSign, Receipt, BarChart3, ShieldCheck, UserCog, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const baseNav = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/collection', icon: Scale, label: 'Daily collection' },
  { to: '/farmers', icon: Users, label: 'Farmers' },
  { to: '/deliveries', icon: Truck, label: 'Factory deliveries' },
  { to: '/rates', icon: DollarSign, label: 'Rate management' },
  { to: '/finance', icon: Receipt, label: 'Payments & advances' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/account', icon: ShieldCheck, label: 'Account & security' },
];

const adminNav = [
  { to: '/users', icon: UserCog, label: 'Users' },
];

export default function Sidebar({ open, onClose, currentPath }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAdmin ? [...baseNav.slice(0, 7), ...adminNav, baseNav[7]] : baseNav;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xl">🍃</span>
          <div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">TeaLeafLedger</span>
            <span className="block text-[10px] text-gray-500">Collection Centre</span>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Collection day open</span>
          </div>
          <p className="text-[11px] text-gray-400">{today} · Centre 01</p>
          <p className="text-[10px] text-gray-400 mt-2">© 2026 <strong>Kamalesh Sivaraj</strong></p>
        </div>
      </aside>
    </>
  );
}
