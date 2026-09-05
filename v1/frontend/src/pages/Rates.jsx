import { useState, useEffect } from 'react';
import { rateAPI } from '../api/client';
import { usePermissions } from '../context/PermissionContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Rates() {
  const { has } = usePermissions();
  const canCreate = has('RATES', 'CREATE');
  const canUpdate = has('RATES', 'UPDATE');
  const canDelete = has('RATES', 'DELETE');
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRate, setEditRate] = useState(null);
  const [form, setForm] = useState({ grade: 'Standard green leaf', amount: '', effective: new Date().toISOString().slice(0, 10), active: true });

  useEffect(() => { loadRates(); }, []);

  const loadRates = async () => {
    try {
      const res = await rateAPI.getAll();
      setRates(res.data || []);
    } catch (err) {
      toast.error('Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const today = new Date().toISOString().slice(0, 10);
  const activeRates = rates.filter(r => r.active && r.effective <= today);
  const standardRate = activeRates.find(r => r.grade === 'Standard green leaf');

  const openAdd = () => { setEditRate(null); setForm({ grade: 'Standard green leaf', amount: '', effective: today, active: true }); setShowForm(true); };
  const openEdit = (r) => { setEditRate(r); setForm({ grade: r.grade, amount: r.amount, effective: r.effective, active: r.active }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editRate) {
        await rateAPI.update(editRate.id, payload);
        toast.success('Rate updated');
      } else {
        await rateAPI.create(payload);
        toast.success('Rate added');
      }
      setShowForm(false);
      loadRates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rate');
    }
  };

  const handleDelete = async (id, grade) => {
    if (!confirm(`Delete the ${grade} rate?`)) return;
    try { await rateAPI.delete(id); toast.success('Rate deleted'); loadRates(); } catch { toast.error('Failed to delete'); }
  };

  const handleReset = async () => {
    if (!confirm('Restore sample rates?')) return;
    try {
      await rateAPI.delete(rates[0]?.id);
      await rateAPI.create({ grade: 'Standard green leaf', amount: 119, effective: '2026-08-20', active: true });
      await rateAPI.create({ grade: 'Premium green leaf', amount: 125, effective: '2026-08-20', active: true });
      await rateAPI.create({ grade: 'Rejected leaf', amount: 0, effective: '2026-08-20', active: true });
      toast.success('Sample rates restored');
      loadRates();
    } catch { toast.error('Failed to reset rates'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pricing controls</p>
          <h2 className="text-xl font-bold text-gray-900">Rate management</h2>
          <p className="text-sm text-gray-500">Set the payable rate by leaf grade.</p>
        </div>
        {canCreate && <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add rate</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Current standard rate</p><p className="text-xl font-bold text-gray-900">{money(standardRate?.amount || 119)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Effective today</p><p className="text-xl font-bold text-gray-900">{activeRates.length} <span className="text-sm font-normal text-gray-500">grades</span></p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total rates</p><p className="text-xl font-bold text-gray-900">{rates.length}</p></div>
      </div>

      <div className="table-container">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Rate schedule</h3>
            <p className="text-sm text-gray-500">Use edit to amend a rate or its effective date.</p>
          </div>
          {(canDelete || canCreate) && <button onClick={handleReset} className="btn-secondary text-sm">↺ Restore sample rates</button>}
        </div>
        <table>
          <thead>
            <tr>
              <th>Leaf grade</th>
              <th>Rate per kg</th>
              <th>Effective from</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rates.map(r => (
              <tr key={r.id}>
                <td className="font-medium text-gray-900">{r.grade}</td>
                <td className="font-bold">{money(r.amount)}</td>
                <td className="text-gray-600">{new Date(r.effective + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td><span className={r.active ? 'pill-green' : 'pill-gray'}>{r.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    {canUpdate && <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>}
                    {canDelete && <button onClick={() => handleDelete(r.id, r.grade)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {rates.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-500">No rates saved yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editRate ? 'Edit rate' : 'Add new rate'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100"><span className="text-xl">&times;</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Leaf grade</label>
                <select value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} className="select-field">
                  <option>Standard green leaf</option>
                  <option>Premium green leaf</option>
                  <option>Rejected leaf</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Rate per kg (Rs.)</label><input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="input-field" min="0" step="0.01" required placeholder="119.00" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Effective from</label><input type="date" value={form.effective} onChange={(e) => setForm({...form, effective: e.target.value})} className="input-field" required /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} className="rounded border-gray-300" />
                <label className="text-sm text-gray-700">Make this rate active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editRate ? 'Update' : 'Save rate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
