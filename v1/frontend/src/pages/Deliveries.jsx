import { useState, useEffect } from 'react';
import { deliveryAPI } from '../api/client';
import { usePermissions } from '../context/PermissionContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Deliveries() {
  const { has } = usePermissions();
  const canCreate = has('DELIVERIES', 'CREATE');
  const canUpdate = has('DELIVERIES', 'UPDATE');
  const canDelete = has('DELIVERIES', 'DELETE');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editDelivery, setEditDelivery] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [form, setForm] = useState({ number: '', factory: 'Kelani Valley Tea Factory', date: new Date().toISOString().slice(0, 10), sent: '', factoryWeight: '', status: 'Awaiting factory weight' });

  useEffect(() => { loadDeliveries(); }, [search, statusFilter]);

  const loadDeliveries = async () => {
    try {
      const res = await deliveryAPI.getAll({ search, status: statusFilter });
      setDeliveries(res.data || []);
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditDelivery(null); setForm({ number: `DL-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-01`, factory: 'Kelani Valley Tea Factory', date: new Date().toISOString().slice(0,10), sent: '', factoryWeight: '', status: 'Awaiting factory weight' }); setShowForm(true); };
  const openEdit = (d) => { setEditDelivery(d); setForm({ number: d.number, factory: d.factory, date: d.date, sent: d.sent, factoryWeight: d.factoryWeight, status: d.status }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, sent: parseFloat(form.sent), factoryWeight: parseFloat(form.factoryWeight) };
      if (editDelivery) {
        await deliveryAPI.update(editDelivery.id, payload);
        toast.success('Delivery updated');
      } else {
        await deliveryAPI.create(payload);
        toast.success('Delivery saved');
      }
      setShowForm(false);
      loadDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save delivery');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try { await deliveryAPI.delete(deleting.id); toast.success('Delivery deleted'); setDeleting(null); loadDeliveries(); } catch { toast.error('Failed to delete'); } finally { setDeleteBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outbound reconciliation</p>
          <h2 className="text-xl font-bold text-gray-900">Factory deliveries</h2>
          <p className="text-sm text-gray-500">Track dispatched leaf and weighbridge differences.</p>
        </div>
        {canCreate && <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> New delivery</button>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs" placeholder="Search delivery number or factory" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field w-auto">
          <option value="">All status</option>
          <option>Reconciled</option>
          <option>Awaiting factory weight</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Delivery no.</th>
              <th>Factory</th>
              <th>Sent weight</th>
              <th>Factory weight</th>
              <th>Variance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map(d => {
              const variance = (d.factoryWeight || 0) - (d.sent || 0);
              const pct = d.sent ? Math.abs(variance / d.sent * 100) : 0;
              return (
                <tr key={d.id}>
                  <td><p className="font-medium text-gray-900">{d.number}</p><p className="text-xs text-gray-500">{d.date}</p></td>
                  <td className="text-gray-600">{d.factory}</td>
                  <td>{(d.sent || 0).toFixed(1)} kg</td>
                  <td>{(d.factoryWeight || 0).toFixed(1)} kg</td>
                  <td className={variance < 0 ? 'text-red-600' : 'text-green-600'}>{variance >= 0 ? '+' : ''}{variance.toFixed(1)} kg ({pct.toFixed(2)}%)</td>
                  <td><span className={d.status === 'Reconciled' ? 'pill-green' : 'pill-amber'}>{d.status}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      {canUpdate && <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>}
                      {canDelete && <button onClick={() => setDeleting(d)} title="Delete delivery" className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {deliveries.length === 0 && <tr><td colSpan="7" className="text-center py-8 text-gray-500">No deliveries found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editDelivery ? 'Edit delivery' : 'New delivery'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100"><span className="text-xl">&times;</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Delivery number</label><input value={form.number} onChange={(e) => setForm({...form, number: e.target.value})} className="input-field" required /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Factory</label><input value={form.factory} onChange={(e) => setForm({...form, factory: e.target.value})} className="input-field" required /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Dispatch date</label><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="input-field" required /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Sent weight (kg)</label><input type="number" value={form.sent} onChange={(e) => setForm({...form, sent: e.target.value})} className="input-field" min="0" step="0.1" required /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Factory weight (kg)</label><input type="number" value={form.factoryWeight} onChange={(e) => setForm({...form, factoryWeight: e.target.value})} className="input-field" min="0" step="0.1" required /></div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="select-field">
                  <option>Reconciled</option>
                  <option>Awaiting factory weight</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editDelivery ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleting(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Delete delivery</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete delivery <strong className="text-gray-900 dark:text-gray-100">{deleting.number}</strong> ({deleting.date})? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleting(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteBusy} className="btn-danger text-sm">{deleteBusy ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
