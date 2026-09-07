import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Scale, Users, Truck, DollarSign, Receipt, BarChart3, ShieldCheck, UserCog, Lock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import DayStatus from './DayStatus';

const baseNav = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', module: 'DASHBOARD' },
  { to: '/collection', icon: Scale, label: 'Daily collection', module: 'COLLECTION' },
  { to: '/farmers', icon: Users, label: 'Farmers', module: 'FARMERS' },
  { to: '/deliveries', icon: Truck, label: 'Factory deliveries', module: 'DELIVERIES' },
  { to: '/rates', icon: DollarSign, label: 'Rate management', module: 'RATES' },
  { to: '/finance', icon: Receipt, label: 'Payments & advances', module: 'FINANCE' },
  { to: '/reports', icon: BarChart3, label: 'Reports', module: 'REPORTS' },
  { to: '/account', icon: ShieldCheck, label: 'Account & security', module: 'ACCOUNT' },
];

const adminNav = [
  { to: '/users', icon: UserCog, label: 'Users', module: 'USERS' },
  { to: '/privileges', icon: Lock, label: 'Roles & privileges', module: 'PRIVILEGES' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const { canView } = usePermissions();
  const isAdmin = user?.role === 'ADMIN';

  const visibleNav = baseNav.filter((n) => n.module === 'ACCOUNT' || canView(n.module));
  const navItems = isAdmin ? [...visibleNav.filter((n) => n.module !== 'ACCOUNT'), ...adminNav, visibleNav.find((n) => n.module === 'ACCOUNT')] : visibleNav;
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

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
            <DayStatus  />
          <p className="text-[11px] text-gray-400">{today} · Centre 01</p>
          <p className="text-[10px] text-gray-400 mt-2">© 2026 <strong>Kamalesh Sivaraj</strong></p>
        </div>
      </aside>
    </>
  );
}