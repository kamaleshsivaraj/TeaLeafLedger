import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Pencil, Trash2, X, Users as UsersIcon, ShieldCheck } from 'lucide-react';
import { userAPI } from '../api/client';

const ROLES = ['ADMIN', 'MANAGER', 'OPERATOR', 'ACCOUNTANT'];
const VERIFICATION_FILTERS = [
  { value: '', label: 'All' },
  { value: 'email', label: 'Email verified' },
  { value: 'phone', label: 'Phone verified' },
  { value: 'both', label: 'Fully verified' },
  { value: 'any', label: 'Any verification' },
  { value: 'none', label: 'Not verified' },
];

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'OPERATOR' };

const roleColor = {
  ADMIN: 'pill-red',
  MANAGER: 'pill-amber',
  OPERATOR: 'pill-green',
  ACCOUNTANT: 'pill-gray',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [verification, setVerification] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedQ) params.q = debouncedQ;
      if (role) params.role = role;
      if (verification) params.verification = verification;
      const res = await userAPI.getAll(params);
      setUsers(res.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, role, verification]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function createUser() {
    setBusy(true);
    try {
      await userAPI.create(form);
      toast.success('User created');
      setShowCreate(false);
      setForm(emptyForm);
      loadUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not create user');
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await userAPI.update(editingUser.id, {
        name: form.name,
        phone: form.phone,
        role: form.role,
        emailVerified: form.emailVerified,
        phoneVerified: form.phoneVerified,
        password: form.password || undefined,
      });
      toast.success('User updated');
      setEditingUser(null);
      loadUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update user');
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser() {
    setBusy(true);
    try {
      await userAPI.remove(deletingUser.id);
      toast.success('User deleted');
      setDeletingUser(null);
      loadUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not delete user');
    } finally {
      setBusy(false);
    }
  }

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      password: '',
      emailVerified: u.emailVerified,
      phoneVerified: u.phoneVerified,
    });
  };

  const filterBar = (
    <div className="card no-print flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input-field pl-9" placeholder="Name, email or phone" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="select-field">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Verification</label>
        <select value={verification} onChange={(e) => setVerification(e.target.value)} className="select-field">
          {VERIFICATION_FILTERS.map((f) => <option key={f.value || 'all'} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <button onClick={() => { setShowCreate(true); setForm(emptyForm); }} className="btn-primary inline-flex items-center gap-2 justify-center">
        <Plus size={16} /> Add user
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {filterBar}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Verification</th>
              <th>2FA</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">No users match the current filters.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center text-xs font-bold">
                        {u.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{u.name} {u.id === JSON.parse(localStorage.getItem('user') || '{}').id && <span className="text-xs text-gray-400">(you)</span>}</span>
                    </div>
                  </td>
                  <td className="text-gray-600 dark:text-gray-300">{u.email}</td>
                  <td className="text-gray-600 dark:text-gray-300">{u.phone || '—'}</td>
                  <td><span className={roleColor[u.role]}>{u.role}</span></td>
                  <td>
                    <div className="flex gap-1.5">
                      {u.emailVerified ? <span className="pill-green">Email</span> : <span className="pill-gray">Email pending</span>}
                      <span className={u.phoneVerified ? 'pill-green' : 'pill-gray'}>{u.phoneVerified ? 'Phone' : 'Phone pending'}</span>
                    </div>
                  </td>
                  <td>{u.twoFactorEnabled ? <span className="pill-green">On</span> : <span className="pill-gray">Off</span>}</td>
                  <td>
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => openEdit(u)} title="Edit user" className="p-1.5 rounded-lg text-brand-600 bg-brand-50 hover:bg-brand-100"><Pencil size={14} /></button>
                      <button onClick={() => setDeletingUser(u)} title="Delete user" className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><UsersIcon size={18} /> Add user</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial password</label>
                <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select className="select-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={createUser} disabled={busy} className="btn-primary text-sm">{busy ? 'Creating...' : 'Create user'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditingUser(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><ShieldCheck size={18} /> Edit user</h3>
              <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                Manual verification: an operator can mark a user's email/phone as verified here after confirming by phone or in person.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (read-only)</label>
                <input className="input-field" value={form.email} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select className="select-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={!!form.emailVerified} onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })} className="rounded border-gray-300" />
                  Email verified
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={!!form.phoneVerified} onChange={(e) => setForm({ ...form, phoneVerified: e.target.checked })} className="rounded border-gray-300" />
                  Phone verified
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reset password (leave blank to keep current)</label>
                <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New password" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditingUser(null)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={saveEdit} disabled={busy} className="btn-primary text-sm">{busy ? 'Saving...' : 'Save changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeletingUser(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Delete user</h3>
            <p className="text-sm text-gray-500 mb-4">
              Delete <strong className="text-gray-900 dark:text-gray-100">{deletingUser.name}</strong> ({deletingUser.email})? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeletingUser(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={deleteUser} disabled={busy} className="btn-danger text-sm">{busy ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}