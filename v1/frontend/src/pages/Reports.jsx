import { useState, useEffect } from 'react';
import { reportAPI, farmerAPI } from '../api/client';
import { usePermissions } from '../context/PermissionContext';
import toast from 'react-hot-toast';
import { Scale, Users, Truck, DollarSign, Printer } from 'lucide-react';

export default function Reports() {
  const { has, canView } = usePermissions();
  const canPrint = has('REPORTS', 'PRINT');
  const canViewFarmers = canView('FARMERS');
  const [from, setFrom] = useState('2026-08-01');
  const [to, setTo] = useState('2026-08-31');
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState('');
  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState('');

  useEffect(() => {
    if (canViewFarmers) farmerAPI.getAll().then(res => setFarmers(res.data || [])).catch(console.error);
  }, [canViewFarmers]);

  const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const generate = async (type) => {
    setReportType(type);
    setLoading(true);
    setReport(null);
    try {
      if (type === 'collection') {
        const res = await reportAPI.getCollectionSummary(from, to);
        setReport(res.data);
      } else if (type === 'factory') {
        const res = await reportAPI.getFactoryReconciliation(from, to);
        setReport(res.data);
      } else if (type === 'payments') {
        const res = await reportAPI.getWeeklyPaymentSheet(from, to);
        setReport(res.data);
      } else if (type === 'passbook') {
        if (!selectedFarmer) { toast.error('Select a supplier first'); setLoading(false); return; }
        const res = await reportAPI.getSupplierPassbook(selectedFarmer);
        setReport(res.data);
      }
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { type: 'collection', icon: Scale, title: 'Daily collection summary', desc: 'Total leaf, suppliers and value for the selected period.' },
    { type: 'passbook', icon: Users, title: 'Supplier passbook', desc: 'Collections, payments and advances for one supplier.', extra: (
      <select value={selectedFarmer} onChange={(e) => setSelectedFarmer(e.target.value)} className="select-field w-full mt-2">
        <option value="">Select supplier</option>
        {farmers.map(f => <option key={f.id} value={f.id}>{f.name} · {f.code}</option>)}
      </select>
    )},
    { type: 'factory', icon: Truck, title: 'Factory reconciliation', desc: 'Dispatch versus factory-weight variance report.' },
    { type: 'payments', icon: DollarSign, title: 'Weekly payment sheet', desc: 'Supplier settlement totals and payment status.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Insights</p>
          <h2 className="text-xl font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500">Generate live reports from your database records.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <label className="text-gray-500 font-medium">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-auto" />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-gray-500 font-medium">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-auto" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map(({ type, icon: Icon, title, desc, extra }) => (
          <div key={type} className="card flex flex-col">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center mb-3"><Icon size={18} className="text-brand-600" /></div>
            <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 mb-2 flex-1">{desc}</p>
            {extra}
            <button onClick={() => generate(type)} disabled={loading} className="btn-secondary text-sm mt-3">
              {loading && reportType === type ? 'Generating...' : 'Generate report →'}
            </button>
          </div>
        ))}
      </div>

      {report && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">{report.title || 'Report'}</h3>
              <p className="text-sm text-gray-500">{from} → {to}</p>
            </div>
            {canPrint && <button onClick={() => window.print()} className="btn-secondary text-sm"><Printer size={14} className="inline mr-1" /> Print report</button>}
          </div>

          {reportType === 'collection' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Collections</p><p className="text-lg font-bold">{report.totalCollections || 0}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total weight</p><p className="text-lg font-bold">{(report.totalWeight || 0).toFixed(1)} kg</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total value</p><p className="text-lg font-bold">{money(report.totalAmount)}</p></div>
              </div>
              {report.collections?.length > 0 && (
                <div className="table-container"><table><thead><tr><th>Date</th><th>Supplier</th><th>Grade</th><th>Weight</th><th>Amount</th></tr></thead><tbody>
                  {report.collections.map((c, i) => <tr key={i}><td>{c.date}</td><td>{c.farmer}</td><td>{c.grade}</td><td>{c.weight?.toFixed(1)} kg</td><td>{money(c.amount)}</td></tr>)}
                </tbody></table></div>
              )}
            </div>
          )}

          {reportType === 'factory' && report.deliveries?.length > 0 && (
            <div className="table-container"><table><thead><tr><th>Delivery</th><th>Factory</th><th>Sent</th><th>Factory wt</th><th>Variance</th><th>Status</th></tr></thead><tbody>
              {report.deliveries.map((d, i) => <tr key={i}><td>{d.number}</td><td>{d.factory}</td><td>{d.sent?.toFixed(1)} kg</td><td>{d.factoryWeight?.toFixed(1)} kg</td><td className={d.variance < 0 ? 'text-red-600' : 'text-green-600'}>{d.variance >= 0 ? '+' : ''}{d.variance?.toFixed(1)} kg</td><td><span className={d.status === 'Reconciled' ? 'pill-green' : 'pill-amber'}>{d.status}</span></td></tr>)}
            </tbody></table></div>
          )}

          {reportType === 'payments' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Suppliers due</p><p className="text-lg font-bold">{report.supplierCount || 0}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total due</p><p className="text-lg font-bold">{money(report.totalDue)}</p></div>
              </div>
              {report.rows?.length > 0 && (
                <div className="table-container"><table><thead><tr><th>Supplier</th><th>Code</th><th>Due</th></tr></thead><tbody>
                  {report.rows.map((r, i) => <tr key={i}><td className="font-medium">{r.farmer}</td><td>{r.code}</td><td className="font-bold">{money(r.due)}</td></tr>)}
                </tbody></table></div>
              )}
            </div>
          )}

          {reportType === 'passbook' && report.farmer && (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Earned</p><p className="text-lg font-bold">{money(report.earned)}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Advances</p><p className="text-lg font-bold">{money(report.advances)}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Payments</p><p className="text-lg font-bold">{money(report.payments)}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Balance</p><p className="text-lg font-bold">{money(report.balance)}</p></div>
              </div>
              {report.transactions?.length > 0 && (
                <div className="table-container"><table><thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead><tbody>
                  {report.transactions.map((t, i) => <tr key={i}><td>{t.date}</td><td><span className={t.type === 'Collection' ? 'pill-green' : t.type === 'Advance' ? 'pill-amber' : 'pill-gray'}>{t.type}</span></td><td className="font-bold">{money(t.amount)}</td></tr>)}
                </tbody></table></div>
              )}
            </div>
          )}

          {report.error && <p className="text-red-600 text-sm">{report.error}</p>}
        </div>
      )}
    </div>
  );
}
