import { useState, useEffect } from 'react';
import { settingsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';

const STATUS_META = {
  OPEN:   { dot: 'bg-green-500', label: 'Open',      text: 'Collection day open' },
  CLOSED: { dot: 'bg-red-500',   label: 'Closed',    text: 'Collection day closed' },
  HALFDAY:{ dot: 'bg-amber-500', label: 'Half day',  text: 'Collection day — half day' },
  WEEKOFF:{ dot: 'bg-gray-400',  label: 'Week off',  text: 'Collection day — week off' },
};

export default function DayStatus() {
  const { user } = useAuth();
  const canChange = user && (user.role === 'ADMIN' || user.role === 'MANAGER');
  const [status, setStatus] = useState('OPEN');
  const [openMenu, setOpenMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    settingsAPI.getDayStatus()
      .then((res) => setStatus(res.data?.status || 'OPEN'))
      .catch(() => {});
  }, []);

  const meta = STATUS_META[status] || STATUS_META.OPEN;

  const change = async (next) => {
    setBusy(true);
    try {
      await settingsAPI.updateDayStatus(next);
      setStatus(next);
      toast.success(`Collection day set to ${STATUS_META[next].label}`);
      setOpenMenu(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update day status');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2.5 h-2.5 ${meta.dot} rounded-full ${status === 'OPEN' ? 'animate-pulse' : ''}`}></span>
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{meta.text}</span>
        {canChange && (
          <button
            onClick={() => setOpenMenu((o) => !o)}
            disabled={busy}
            className="ml-auto p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            title="Change collection day status"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>

      {openMenu && canChange && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden z-40">
            {Object.entries(STATUS_META).map(([key, m]) => (
              <button
                key={key}
                onClick={() => change(key)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span className={`w-2 h-2 ${m.dot} rounded-full`}></span>
                {m.label}
                {status === key && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}