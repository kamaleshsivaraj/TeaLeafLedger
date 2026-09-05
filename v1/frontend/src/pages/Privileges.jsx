import { useState, useEffect } from 'react';
import { permissionAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Save, Lock } from 'lucide-react';

const ROLES = ['MANAGER', 'ACCOUNTANT', 'OPERATOR'];

const MODULE_INFO = {
  DASHBOARD:  { label: 'Overview / dashboard',  desc: 'Home screen with today\'s collection stats and quick links.' },
  COLLECTION: { label: 'Daily collection',      desc: 'Record weighments, issue receipts and manage collection records.' },
  FARMERS:    { label: 'Farmers',               desc: 'Supplier registry — profiles, codes and passbook data.' },
  DELIVERIES: { label: 'Factory deliveries',    desc: 'Track dispatched leaf and weighbridge reconciliation.' },
  RATES:      { label: 'Rate management',       desc: 'Set payable rates by leaf grade.' },
  FINANCE:    { label: 'Payments & advances',   desc: 'Supplier advances, payments and transaction ledger.' },
  REPORTS:    { label: 'Reports',               desc: 'Generate collection, factory and settlement reports.' },
  USERS:      { label: 'Users',                 desc: 'Manage team members and their roles (ADMIN super-role only).' },
};

const ACTION_INFO = {
  VIEW:   { label: 'View',   tip: 'See the module / tab in the sidebar' },
  CREATE: { label: 'Create', tip: 'Add new records in the module' },
  UPDATE: { label: 'Update', tip: 'Edit existing records' },
  DELETE: { label: 'Delete', tip: 'Remove records' },
  PRINT:  { label: 'Print',  tip: 'Print receipts / reports' },
};

export default function Privileges() {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [activeRole, setActiveRole] = useState('MANAGER');
  const [matrices, setMatrices] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    permissionAPI.getModules().then((res) => {
      setModules(res.data?.modules || []);
      setActions(res.data?.actions || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);
    Promise.all(ROLES.map((role) => permissionAPI.getMatrix(role)))
      .then((results) => {
        const next = {};
        ROLES.forEach((role, i) => { next[role] = results[i].data || {}; });
        setMatrices(next);
      })
      .catch(() => toast.error('Failed to load role permissions'))
      .finally(() => setLoading(false));
  }, [user]);

  const toggle = (module, action) => {
    setMatrices((prev) => {
      const m = { ...prev };
      const roleMatrix = { ...(m[activeRole] || {}) };
      const current = new Set(roleMatrix[module] || []);
      if (current.has(action)) current.delete(action); else current.add(action);
      roleMatrix[module] = [...current];
      m[activeRole] = roleMatrix;
      return m;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await permissionAPI.updateMatrix(activeRole, matrices[activeRole]);
      toast.success(`${activeRole} permissions saved`);
      setDirty(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Roles &amp; access control</p>
          <h2 className="text-xl font-bold text-gray-900">Roles &amp; privileges</h2>
          <p className="text-sm text-gray-500">Define what each role can do across modules and buttons. Tab access follows the <strong>View</strong> permission.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => { setActiveRole(role); setDirty(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${activeRole === role ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
          >
            {role.toLowerCase()}
          </button>
        ))}
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500">
          <Lock size={14} /> ADMIN <span className="font-normal text-gray-400">— full access, unmodifiable</span>
        </span>
        {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>ADMIN</strong> (super-role) always has full access to every module and cannot be modified or deleted. The {activeRole.toLowerCase()} role below currently has {modules.filter((m) => (matrices[activeRole]?.[m] || []).includes('VIEW')).length} of {modules.length} modules enabled.
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              <th className="py-3 pr-4 font-medium w-64">Module</th>
              {actions.map((a) => (
                <th key={a} className="py-3 px-2 font-medium text-center" title={ACTION_INFO[a]?.tip}>
                  {ACTION_INFO[a]?.label}
                  <span className="block text-[9px] font-normal text-gray-400">(permission)</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="py-3 pr-4">
                  <p className="font-medium text-gray-900">{MODULE_INFO[mod]?.label || mod}</p>
                  <p className="text-xs text-gray-500">{MODULE_INFO[mod]?.desc}</p>
                </td>
                {actions.map((a) => {
                  const checked = (matrices[activeRole]?.[mod] || []).includes(a);
                  return (
                    <td key={a} className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(mod, a)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Granting <strong>View</strong> enables the module tab for {activeRole.toLowerCase()} users. Buttons inside a module are shown only when the matching permission is ticked.
        </p>
        <button onClick={save} disabled={!dirty || saving} className={`btn-primary flex items-center gap-2 ${!dirty ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Save size={16} /> {saving ? 'Saving...' : `Save ${activeRole.toLowerCase()} permissions`}
        </button>
      </div>
    </div>
  );
}