import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, Sun, Moon, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI } from '../api/client';

const pageLabels = {
  '/': { eyebrow: 'Good morning', title: 'Overview' },
  '/collection': { eyebrow: 'Collection desk', title: 'Daily collection' },
  '/farmers': { eyebrow: 'Supplier registry', title: 'Farmers' },
  '/deliveries': { eyebrow: 'Outbound reconciliation', title: 'Factory deliveries' },
  '/rates': { eyebrow: 'Pricing controls', title: 'Rate management' },
  '/finance': { eyebrow: 'Settlement centre', title: 'Payments & advances' },
  '/reports': { eyebrow: 'Insights', title: 'Reports' },
  '/account': { eyebrow: 'Profile & access', title: 'Account & security' },
};

const typePill = {
  INFO: '. pill-gray',
  SUCCESS: '. pill-green',
  WARNING: '. pill-amber',
};

function pillClass(type) {
  switch (type) {
    case 'SUCCESS': return 'pill-green';
    case 'WARNING': return 'pill-amber';
    case 'ERROR': return 'pill-red';
    default: return 'pill-gray';
  }
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef(null);

  const path = window.location.pathname;
  const labels = pageLabels[path] || pageLabels['/'];

  useEffect(() => {
    notificationAPI.getAll().then((res) => setNotifications(res.data.data || res.data || []));
    refreshUnread();
    const interval = setInterval(refreshUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function refreshUnread() {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnread(res.data?.count ?? res.data ?? 0);
    } catch {
      /* ignore */
    }
  }

  async function markAllRead() {
    await notificationAPI.markAllRead();
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    await refreshUnread();
  }

  async function markRead(id) {
    await notificationAPI.markRead(id);
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
    await refreshUnread();
  }

  async function removeNotification(id) {
    await notificationAPI.remove(id);
    setNotifications((n) => n.filter((x) => x.id !== id));
    await refreshUnread();
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-3 flex items-center gap-4">
      <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
        <Menu size={20} className="text-gray-600 dark:text-gray-400" />
      </button>

      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{labels.eyebrow}</p>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{labels.title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={bellRef}>
          <button onClick={() => setBellOpen((o) => !o)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative">
            <Bell size={18} className="text-gray-500 dark:text-gray-400" />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread || '!'}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</p>
                {hasUnread && (
                  <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications</p>
                )}
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${n.read ? '' : 'bg-brand-50/50 dark:bg-brand-900/20'}`} onClick={() => markRead(n.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${n.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>{n.title}</p>
                      <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} className="text-gray-300 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <span className={`${pillClass(n.type)} mt-1.5`}>{n.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
          <button onClick={() => navigate('/account')} title="Account & security" className="flex items-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 p-1">
            <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </button>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}