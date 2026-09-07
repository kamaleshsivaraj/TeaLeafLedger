import { useState, useEffect } from 'react';
import { financeAPI, farmerAPI } from '../api/client';
import { usePermissions } from '../context/PermissionContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Finance() {
  const { has } = usePermissions();
  const canCreate = has('FINANCE', 'CREATE');
  const canUpdate = has('FINANCE', 'UPDATE');
  const canDelete = has('FINANCE', 'DELETE');
  const [farmers, setFarmers] = useState([]);
  const [summary, setSummary] = useState({ totalAdvances: 0, totalPayments: 0, outstanding: 0 });
  const [ledger, setLedger] = useState([]);
  const [ledgerType, setLedgerType] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('advance');
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState({ farmerId: '', date: new Date().toISOString().slice(0, 10), amount: '', notes: '' });
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const jobs = [];
      if (has('FARMERS', 'VIEW')) jobs.push(farmerAPI.getAll());
      jobs.push(financeAPI.getSummary());
      jobs.push(financeAPI.getLedger({ type: ledgerType, search: ledgerSearch }));

      const settled = await Promise.allSettled(jobs);
      const values = settled.map((r) => (r.status === 'fulfilled' ? r.value.data : null));
      let idx = 0;

      if (has('FARMERS', 'VIEW')) setFarmers(values[idx++] || []);
      setSummary(values[idx++] || {});
      setLedger(values[idx++] || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    financeAPI.getLedger({ type: ledgerType, search: ledgerSearch }).then(res => setLedger(res.data || [])).catch(console.error);
  }, [ledgerType, ledgerSearch]);

  const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openAdvance = () => { setFormType('advance'); setEditRecord(null); setForm({ farmerId: '', date: new Date().toISOString().slice(0, 10), amount: '', notes: '' }); setShowForm(true); };
  const openPayment = () => { setFormType('payment'); setEditRecord(null); setForm({ farmerId: '', date: new Date().toISOString().slice(0, 10), amount: '', notes: '' }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    const farmer = farmers.find(f => String(f.id) === String(form.farmerId));
    if (!farmer) { toast.error('Please select a supplier'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }

    try {
      const payload = { ...form, farmerId: farmer.id, amount: parseFloat(form.amount) };
      if (formType === 'advance') {
        if (editRecord) await financeAPI.updateAdvance(editRecord.id, payload);
        else await financeAPI.createAdvance(payload);
      } else {
        if (editRecord) await financeAPI.updatePayment(editRecord.id, payload);
        else await financeAPI.createPayment(payload);
      }
      toast.success(`${formType === 'advance' ? 'Advance' : 'Payment'} saved`);
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      if (deleting.type === 'advance') await financeAPI.deleteAdvance(deleting.id);
      else await financeAPI.deletePayment(deleting.id);
      toast.success('Deleted');
      setDeleting(null);
      loadData();
    } catch { toast.error('Failed to delete'); } finally { setDeleteBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Settlement centre</p>
          <h2 className="text-xl font-bold text-gray-900">Payments & advances</h2>
          <p className="text-sm text-gray-500">Manage supplier advances, payments and balances.</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && <button onClick={openAdvance} className="btn-primary flex items-center gap-2"><Plus size={16} /> Record advance</button>}
          {canCreate && <button onClick={openPayment} className="btn-primary flex items-center gap-2"><Plus size={16} /> Record payment</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total advances</p><p className="text-xl font-bold text-gray-900">{money(summary.totalAdvances)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total payments</p><p className="text-xl font-bold text-gray-900">{money(summary.totalPayments)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Outstanding advances</p><p className="text-xl font-bold text-gray-900">{money(summary.outstanding)}</p></div>
      </div>

      <div className="table-container">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Transaction ledger</h3>
            <p className="text-sm text-gray-500">Advances, payments and collection recoveries.</p>
          </div>
          <div className="flex items-center gap-2">
            <input value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} className="input-field w-64" placeholder="Search supplier or code..." />
            <select value={ledgerType} onChange={(e) => setLedgerType(e.target.value)} className="select-field w-auto">
              <option value="">All transactions</option>
              <option value="advance">Advances</option>
              <option value="payment">Payments</option>
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Type</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map(r => (
              <tr key={r.id}>
                <td>
                  <p className="font-medium text-gray-900">{r.farmer}</p>
                  <p className="text-xs text-gray-500">{r.code}</p>
                </td>
                <td><span className={r.type === 'advance' ? 'pill-amber' : 'pill-green'}>{r.label}</span></td>
                <td className="text-gray-600">{r.date}</td>
                <td className="font-medium">{money(r.amount)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {canUpdate && <button onClick={() => { setFormType(r.type); setEditRecord(r); setForm({ farmerId: r.farmerId || '', date: r.date, amount: r.amount, notes: '' }); setShowForm(true); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>}
                    {canDelete && <button onClick={() => setDeleting(r)} title="Delete transaction" className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {ledger.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-500">No transactions found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editRecord ? `Edit ${formType}` : `Record ${formType}`}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100"><span className="text-xl">&times;</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Supplier</label>
                <select value={form.farmerId} onChange={(e) => setForm({...form, farmerId: e.target.value})} className="select-field" required>
                  <option value="">Select supplier</option>
                  {farmers.map(f => <option key={f.id} value={f.id}>{f.name} · {f.code}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Date</label><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="input-field" required /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Amount (Rs.)</label><input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="input-field" min="0.01" step="0.01" required placeholder="0.00" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label><input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="input-field" placeholder="Optional note" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editRecord ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleting(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Delete {deleting.type === 'advance' ? 'advance' : 'payment'}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this {deleting.type} for <strong className="text-gray-900 dark:text-gray-100">{deleting.farmer}</strong> ({deleting.label}, {money(deleting.amount)})? This cannot be undone.
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
