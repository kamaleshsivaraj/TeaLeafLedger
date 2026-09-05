import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { farmerAPI, collectionAPI, rateAPI, financeAPI } from '../api/client';
import toast from 'react-hot-toast';
import { Search, X, Printer, Eye, Table2, Pencil, Trash2 } from 'lucide-react';

const GRADES = ['Standard green leaf', 'Premium green leaf', 'Rejected leaf'];

const printRoot = document.createElement('div');
printRoot.id = 'print-root';
document.body.appendChild(printRoot);

export default function Collection() {
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [bagCount, setBagCount] = useState(0);
  const [bagWeights, setBagWeights] = useState([]);
  const [waterTare, setWaterTare] = useState(0);
  const [otherTare, setOtherTare] = useState(0);

  const [grade, setGrade] = useState(GRADES[0]);
  const [activeRate, setActiveRate] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [loading, setLoading] = useState(false);

  const [taxMode, setTaxMode] = useState(() => localStorage.getItem('taxMode') || 'none');
  const [cgst, setCgst] = useState(() => Number(localStorage.getItem('taxCgst')) || 0);
  const [sgst, setSgst] = useState(() => Number(localStorage.getItem('taxSgst')) || 0);
  const [igst, setIgst] = useState(() => Number(localStorage.getItem('taxIgst')) || 0);

  const [savedToday, setSavedToday] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [allCollections, setAllCollections] = useState([]);
  const [allLoading, setAllLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);

  const [editForm, setEditForm] = useState({
    farmerId: '',
    grade: GRADES[0],
    bagWeights: [],
    waterTare: 0,
    otherTare: 0,
    taxMode: 'none',
    cgst: 0,
    sgst: 0,
    igst: 0,
  });

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const apiDate = new Date().toISOString().slice(0, 10);

  const loadFarmers = useCallback(async () => {
    try {
      const res = await farmerAPI.getAll();
      setFarmers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadSavedToday = useCallback(async () => {
    try {
      const res = await collectionAPI.getByDateRange(apiDate, apiDate);
      setSavedToday(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [apiDate]);

  const loadActiveRate = useCallback(async (g) => {
    try {
      const res = await rateAPI.getActive(g);
      setActiveRate(res.data > 0 ? res.data : 0);
    } catch {
      setActiveRate(0);
    }
  }, []);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  useEffect(() => {
    loadSavedToday();
  }, [loadSavedToday]);

  useEffect(() => {
    loadActiveRate(grade);
  }, [grade, loadActiveRate]);

  useEffect(() => {
    localStorage.setItem('taxMode', taxMode);
    localStorage.setItem('taxCgst', String(cgst));
    localStorage.setItem('taxSgst', String(sgst));
    localStorage.setItem('taxIgst', String(igst));
  }, [taxMode, cgst, sgst, igst]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lq = q.toLowerCase();
    const results = farmers.filter(f =>
      f.name?.toLowerCase().includes(lq) ||
      f.code?.toLowerCase().includes(lq) ||
      f.phone?.toLowerCase().includes(lq) ||
      f.division?.toLowerCase().includes(lq)
    ).slice(0, 8);
    setSearchResults(results);
  };

  const selectFarmer = async (f) => {
    setSelectedFarmer(f);
    setSearchQuery(f.name);
    setSearchResults([]);
    try {
      const res = await financeAPI.getOutstanding(f.id);
      setOutstanding(res.data?.outstanding || 0);
    } catch {
      setOutstanding(0);
    }
  };

  const clearFarmer = () => {
    setSearchQuery('');
    setSelectedFarmer(null);
    setOutstanding(0);
    setSearchResults([]);
  };

  const updateBagCount = (delta) => {
    const newCount = Math.max(0, Math.min(100, bagCount + delta));
    setBagCount(newCount);
    setBagWeights(prev => {
      const updated = [...prev];
      while (updated.length < newCount) updated.push(1.0);
      return updated.slice(0, newCount);
    });
  };

  const updateBagWeight = (index, value) => {
    const updated = [...bagWeights];
    updated[index] = parseFloat(value) || 0;
    setBagWeights(updated);
  };

  // ---------- calculations ----------
  const bagTotal = bagWeights.reduce((sum, w) => sum + w, 0);
  const bagTare = bagCount * 1.0;
  const totalTare = bagTare + (parseFloat(waterTare) || 0) + (parseFloat(otherTare) || 0);
  const grossWeight = Math.max(0, bagTotal - totalTare);
  const netWeight = Math.floor(grossWeight);
  const grossAmount = netWeight * activeRate;
  const recovery = outstanding > 0 ? Math.min(200, grossAmount) : 0;
  const baseAmount = Math.max(0, grossAmount - recovery);
  const taxTotal = taxMode === 'inter'
    ? baseAmount * (parseFloat(igst) || 0) / 100
    : taxMode === 'intra'
      ? baseAmount * ((parseFloat(cgst) || 0) + (parseFloat(sgst) || 0)) / 100
      : 0;
  const amount = baseAmount + taxTotal;

  const now = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

  const rcDate = new Date();
  const rcNo = `TL-${rcDate.getFullYear()}${String(rcDate.getMonth() + 1).padStart(2, '0')}${String(rcDate.getDate()).padStart(2, '0')}-${String(rcDate.getHours()).padStart(2, '0')}${String(rcDate.getMinutes()).padStart(2, '0')}`;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedFarmer) { toast.error('Please select a supplier'); return; }
    if (netWeight <= 0) { toast.error('Enter valid leaf weight'); return; }
    setLoading(true);
    try {
      await collectionAPI.create({
        farmerId: selectedFarmer.id,
        grade,
        weight: netWeight,
        bagCount,
        bagWeights: JSON.stringify(bagWeights),
        bagTotal,
        bagTare,
        waterTare: parseFloat(waterTare) || 0,
        otherTare: parseFloat(otherTare) || 0,
        totalTare,
        grossWeight,
        rate: activeRate,
        grossAmount,
        advanceRecovery: recovery,
        baseAmount,
        amount,
        tax: JSON.stringify({ mode: taxMode, cgst, sgst, igst, total: taxTotal }),
      });

      toast.success(`Collection saved — ${money(amount)}`);
      clearFarmer();
      setBagCount(0);
      setBagWeights([]);
      setWaterTare(0);
      setOtherTare(0);
      loadSavedToday();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (withoutAmount = false) => {
    if (!selectedFarmer) { toast.error('Select a supplier before printing'); return; }
    document.body.classList.add('print-receipt');
    if (withoutAmount) document.body.classList.add('print-without-amount');
    const pageSetup = document.createElement('style');
    pageSetup.id = 'print-page-setup';
    pageSetup.textContent = '@page { size: 80mm auto; margin: 2mm; }';
    document.head.appendChild(pageSetup);
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-receipt');
      document.body.classList.remove('print-without-amount');
      document.getElementById('print-page-setup')?.remove();
    }, 300);
  };

  const openEdit = (c) => {
    let weights = [];
    try { weights = JSON.parse(c.bagWeights || '[]'); } catch {}
    let tax = { mode: 'none', cgst: 0, sgst: 0, igst: 0 };
    try { tax = JSON.parse(c.tax || '{}'); } catch {}
    setEditForm({
      farmerId: c.farmerId,
      grade: c.grade || GRADES[0],
      bagWeights: Array.isArray(weights) && weights.length ? weights : [c.weight || 0],
      waterTare: c.waterTare || 0,
      otherTare: c.otherTare || 0,
      taxMode: tax.mode || 'none',
      cgst: tax.cgst || 0,
      sgst: tax.sgst || 0,
      igst: tax.igst || 0,
    });
    setEditing(c);
  };

  const saveEdit = async () => {
    setUpdateBusy(true);
    try {
      await collectionAPI.update(editing.id, {
        farmerId: editForm.farmerId,
        grade: editForm.grade,
        bagWeights: JSON.stringify(editForm.bagWeights.filter((w) => w > 0)),
        waterTare: parseFloat(editForm.waterTare) || 0,
        otherTare: parseFloat(editForm.otherTare) || 0,
        tax: JSON.stringify({ mode: editForm.taxMode, cgst: Number(editForm.cgst), sgst: Number(editForm.sgst), igst: Number(editForm.igst) }),
      });
      toast.success('Collection updated');
      setEditing(null);
      loadSavedToday();
      if (showAll) loadAllCollections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update collection');
    } finally {
      setUpdateBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await collectionAPI.remove(deleting.id);
      toast.success('Collection deleted');
      setDeleting(null);
      loadSavedToday();
      if (showAll) loadAllCollections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete collection');
    } finally {
      setDeleteBusy(false);
    }
  };

  const loadAllCollections = async () => {
    setAllLoading(true);
    try {
      const res = await collectionAPI.getAll();
      setAllCollections(res.data || []);
    } catch (err) {
      toast.error('Failed to load all collections');
    } finally {
      setAllLoading(false);
    }
  };

  const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const taxInput = (label, value, setter) => (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label} (%)</label>
      <input
        type="number"
        value={value}
        onChange={(e) => setter(e.target.value)}
        className="input-field"
        min="0"
        max="100"
        step="0.01"
        disabled={taxMode === 'none'}
      />
    </div>
  );

  const receiptPrint = (
    <div className="print-only-receipt">
      <div className="rc-center">
        <p className="rc-logo">🍃</p>
        <p className="rc-title">TEA LEAF LEDGER</p>
        <p className="rc-sub">Green Leaf Collection Centre</p>
        <p className="rc-sub">Centre 01 · Nuwara Eliya</p>
      </div>
      <div className="rc-divider" />
      <div className="rc-row"><span>Receipt</span><span>{rcNo}</span></div>
      <div className="rc-row"><span>Date &amp; Time</span><span>{now}</span></div>
      <div className="rc-row"><span>Supplier</span><span>{selectedFarmer?.name || '—'}</span></div>
      <div className="rc-row"><span>Code</span><span>{selectedFarmer?.code || '—'}</span></div>
      <div className="rc-row"><span>Phone</span><span>{selectedFarmer?.phone || '—'}</span></div>
      <div className="rc-row"><span>Grade</span><span>{grade}</span></div>
      <div className="rc-divider" />
      <p className="rc-section">Weighment</p>
      <div className="rc-row"><span>No. of bags</span><span>{bagCount}</span></div>
      <div className="rc-row"><span>Bag weight</span><span>{bagTotal.toFixed(2)} kg</span></div>
      <div className="rc-row"><span>Water tare</span><span>- {(parseFloat(waterTare) || 0).toFixed(2)} kg</span></div>
      <div className="rc-row"><span>Other tare</span><span>- {(parseFloat(otherTare) || 0).toFixed(2)} kg</span></div>
      <div className="rc-row"><span>Total tare</span><span>- {totalTare.toFixed(2)} kg</span></div>
      <div className="rc-row"><span>Gross weight</span><span>{grossWeight.toFixed(2)} kg</span></div>
      <div className="rc-row rc-strong"><span>Net leaf weight</span><span>{netWeight.toFixed(1)} kg</span></div>
      <div className="rc-divider pwa" />
      <p className="rc-section pwa">Payment</p>
      <div className="rc-row pwa"><span>Rate</span><span>{money(activeRate)} / kg</span></div>
      <div className="rc-row pwa"><span>Gross amount</span><span>{money(grossAmount)}</span></div>
      <div className="rc-row pwa"><span>Advance recovery</span><span>- {money(recovery)}</span></div>
      {taxMode !== 'none' && (
        <div className="rc-row pwa"><span>Tax ({taxMode === 'inter' ? 'IGST' : 'CGST+SGST'})</span><span>+ {money(taxTotal)}</span></div>
      )}
      <div className="rc-divider pwa" />
      <div className="rc-row rc-total pwa"><span>NET PAYABLE</span><span>{money(amount)}</span></div>
      <div className="rc-divider" />
      <p className="rc-center rc-sub">Thank you! · Report any damaged bags</p>
      <p className="rc-center rc-foot">Powered by TeaLeafLedger · {today}</p>
    </div>
  );

  return (
    <div className="space-y-6 receipt-print-area">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Collection desk</p>
          <h2 className="text-xl font-bold text-gray-900">Record green leaf</h2>
          <p className="text-sm text-gray-500">Search a farmer, capture their weighment, apply tax, then issue a printable receipt.</p>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">◷ {today}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          {/* Step 1 — Find supplier */}
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <h3 className="font-bold text-gray-900">Find supplier</h3>
                <p className="text-sm text-gray-500">Search by name, code or phone number.</p>
              </div>
            </div>

            <div className="relative">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Search farmer name, code, phone or division"
                />
                {searchQuery && (
                  <button type="button" onClick={clearFarmer} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {searchResults.map(f => (
                    <button key={f.id} type="button" onClick={() => selectFarmer(f)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <p className="text-sm font-medium text-gray-900">{f.name}</p>
                      <p className="text-xs text-gray-500">{f.code} · {f.phone} · {f.division}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedFarmer && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
                <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {selectedFarmer.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedFarmer.name}</p>
                  <p className="text-xs text-gray-500">{selectedFarmer.code} · {selectedFarmer.division}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  Advance outstanding: {money(outstanding)}
                </span>
              </div>
            )}
          </div>

          {/* Step 2 — Enter bags */}
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <h3 className="font-bold text-gray-900">Enter bags</h3>
                <p className="text-sm text-gray-500">Count the bags and record weight.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bags</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateBagCount(-1)} className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">−</button>
                  <input type="number" value={bagCount} onChange={(e) => { const v = parseInt(e.target.value) || 0; setBagCount(v); setBagWeights(Array(v).fill(1.0)); }} className="w-16 text-center input-field" min="0" />
                  <button type="button" onClick={() => updateBagCount(1)} className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">+</button>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Bag total</p>
                <p className="text-sm font-bold text-gray-900">{bagTotal.toFixed(2)} kg</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Bag tare total</p>
                <p className="text-sm font-bold text-gray-900">{bagTare.toFixed(2)} kg</p>
              </div>
            </div>

            {bagWeights.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {bagWeights.map((w, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500 mb-1 block">Bag {i + 1}</label>
                    <div className="flex items-center">
                      <input type="number" value={w} onChange={(e) => updateBagWeight(i, e.target.value)} className="input-field" min="0" step="0.01" />
                      <span className="ml-1 text-xs text-gray-500">kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Water tare (kg)</label>
                <input type="number" value={waterTare} onChange={(e) => setWaterTare(e.target.value)} className="input-field" min="0" step="0.01" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Other tare (kg)</label>
                <input type="number" value={otherTare} onChange={(e) => setOtherTare(e.target.value)} className="input-field" min="0" step="0.01" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">Total tare: <strong>{totalTare.toFixed(2)} kg</strong></p>
          </div>

          {/* Step 3 — Weigh leaf */}
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <h3 className="font-bold text-gray-900">Weigh leaf</h3>
                <p className="text-sm text-gray-500">Gross and net weights are calculated automatically.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Gross weight</label>
                <div className="flex items-center">
                  <input type="text" value={grossWeight.toFixed(2)} readOnly className="input-field bg-gray-50" />
                  <span className="ml-1 text-xs text-gray-500">kg</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Net leaf</label>
                <div className="flex items-center">
                  <input type="text" value={netWeight.toFixed(1)} readOnly className="input-field bg-gray-50" />
                  <span className="ml-1 text-xs text-gray-500">kg</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Grade</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="select-field">
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className={`p-3 rounded-lg mb-4 ${activeRate > 0 ? 'bg-brand-50' : 'bg-gray-100'}`}>
              <p className="text-sm text-gray-600">
                Today's rate: <strong className="text-brand-700">{activeRate > 0 ? money(activeRate) + ' / kg' : 'No active rate — falling back to 0'}</strong>
              </p>
            </div>

            {/* Step 4 — Tax */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <h3 className="font-bold text-gray-900">Apply tax</h3>
                  <p className="text-sm text-gray-500">Select tax mode; rates are applied on the payable amount after advance recovery.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mode</label>
                  <select value={taxMode} onChange={(e) => setTaxMode(e.target.value)} className="select-field">
                    <option value="none">No tax</option>
                    <option value="intra">Intra-state (CGST+SGST)</option>
                    <option value="inter">Inter-state (IGST)</option>
                  </select>
                </div>
                {taxInput('CGST', cgst, setCgst)}
                {taxInput('SGST', sgst, setSgst)}
                {taxInput('IGST', igst, setIgst)}
              </div>
              {taxMode !== 'none' && (
                <p className="mt-2 text-sm text-gray-600">Tax on {money(baseAmount)} = <strong className="text-gray-900">{money(taxTotal)}</strong></p>
              )}
            </div>

            <button type="submit" disabled={loading || !selectedFarmer} className="w-full btn-primary py-2.5">
              {loading ? 'Saving...' : 'Save collection & issue receipt →'}
            </button>
          </div>
        </form>

        {/* Receipt panel */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-fit sticky top-6 receipt-panel">
          <div className="bg-gray-900 text-white text-center py-3">
            <p className="text-xs text-gray-400">🍃 TeaLeafLedger</p>
            <p className="text-sm font-bold">COLLECTION RECEIPT</p>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Supplier</span>
              <span className="font-medium">{selectedFarmer?.name || '—'} <span className="text-gray-400 text-xs">{selectedFarmer?.code || ''}</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date & time</span>
              <span className="font-medium text-right text-xs">{now}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between"><span className="text-gray-500">Grade</span><span className="font-medium">{grade}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bags</span><span className="font-medium">{bagCount}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bag weight</span><span className="font-medium">{bagTotal.toFixed(2)} kg</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bag tare</span><span className="font-medium">− {bagTare.toFixed(2)} kg</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Water tare</span><span className="font-medium">− {(parseFloat(waterTare) || 0).toFixed(2)} kg</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Other tare</span><span className="font-medium">− {(parseFloat(otherTare) || 0).toFixed(2)} kg</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total tare</span><span className="font-medium">− {totalTare.toFixed(2)} kg</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gross weight</span><span className="font-medium">{grossWeight.toFixed(2)} kg</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Net weight</span><span className="font-medium">{netWeight.toFixed(1)} kg</span></div>
            <hr className="border-gray-200" />
            <div className="flex justify-between amount-field"><span className="text-gray-500">Rate</span><span className="font-medium">{money(activeRate)} / kg</span></div>
            <div className="flex justify-between amount-field"><span className="text-gray-500">Gross amount</span><span className="font-medium">{money(grossAmount)}</span></div>
            <div className="flex justify-between amount-field">
              <span className="text-gray-500">Advance recovery</span>
              <span className="font-medium text-red-600">
                {outstanding > 0 ? `− ${money(recovery)}` : `${money(0)} (no advance)`}
              </span>
            </div>
            <hr className="border-gray-200" />
            {taxMode !== 'none' && (
              <>
                <div className="flex justify-between amount-field">
                  <span className="text-gray-500">{taxMode === 'inter' ? 'IGST' : `CGST + SGST`}</span>
                  <span className="font-medium">+ {money(taxTotal)}</span>
                </div>
                <hr className="border-gray-200" />
              </>
            )}
            <div className="flex justify-between text-base amount-field">
              <span className="font-bold">Net payable</span>
              <span className="font-bold text-brand-700">{money(amount)}</span>
            </div>
          </div>
          <div className="p-3 border-t border-gray-200 flex gap-2">
            <button onClick={() => printReceipt(false)} className="flex-1 btn-secondary text-xs py-2"><Printer size={14} className="inline mr-1" /> Print</button>
            <button onClick={() => printReceipt(true)} className="flex-1 btn-secondary text-xs py-2"><Printer size={14} className="inline mr-1" /> Print w/o amount</button>
          </div>
        </div>
      </div>

      {/* Saved today + view all */}
      <div className="card no-print">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Saved collections — today ({savedToday.length})</h3>
            <p className="text-sm text-gray-500">Most recent weighments recorded for {today}.</p>
          </div>
          <button onClick={() => { const next = !showAll; setShowAll(next); if (next && allCollections.length === 0) loadAllCollections(); }} className="btn-secondary text-sm py-2">
            <Table2 size={15} className="inline mr-1.5 -mt-0.5" /> {showAll ? 'Hide all collections' : 'View all collections'}
          </button>
        </div>

        {savedToday.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No collections recorded today yet.</p>
            <p className="text-xs mt-1">Complete the weighment above and save to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Supplier</th>
                  <th className="py-2 pr-4 font-medium">Grade</th>
                  <th className="py-2 pr-4 font-medium text-right">Net kg</th>
                  <th className="py-2 pr-4 font-medium text-right">Rate</th>
                  <th className="py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {savedToday.map(c => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-xs text-gray-500">{new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2 pr-4 text-gray-500">{c.code}</td>
                    <td className="py-2 pr-4 font-medium">{c.farmer}</td>
                    <td className="py-2 pr-4 text-gray-600">{c.grade}</td>
                    <td className="py-2 pr-4 text-right">{c.weight}</td>
                    <td className="py-2 pr-4 text-right">{c.rate}</td>
                    <td className="py-2 text-right font-semibold">{money(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAll && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={15} className="text-gray-400" />
              <h4 className="font-bold text-gray-900">All collections</h4>
              <span className="text-xs text-gray-500">({allCollections.length} records)</span>
            </div>
            {allLoading ? (
              <p className="text-sm text-gray-400 py-6 text-center">Loading all collections…</p>
            ) : allCollections.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No collections found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Code</th>
                      <th className="py-2 pr-4 font-medium">Supplier</th>
                      <th className="py-2 pr-4 font-medium">Grade</th>
                      <th className="py-2 pr-4 font-medium text-right">Net kg</th>
                      <th className="py-2 pr-4 font-medium text-right">Rate</th>
                      <th className="py-2 pr-4 font-medium text-right">Tare</th>
                      <th className="py-2 pr-4 font-medium text-right">Adv. rec.</th>
                      <th className="py-2 pr-4 font-medium text-right">Tax</th>
                      <th className="py-2 pr-4 font-medium text-right">Amount</th>
                      <th className="py-2 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCollections.map(c => {
                      let tax = { mode: 'none', total: 0 };
                      try { tax = JSON.parse(c.tax || '{}'); } catch {}
                      return (
                        <tr key={c.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-xs text-gray-500">{c.date}</td>
                          <td className="py-2 pr-4 text-gray-500">{c.code}</td>
                          <td className="py-2 pr-4 font-medium">{c.farmer}</td>
                          <td className="py-2 pr-4 text-gray-600">{c.grade}</td>
                          <td className="py-2 pr-4 text-right">{c.weight}</td>
                          <td className="py-2 pr-4 text-right">{c.rate}</td>
                          <td className="py-2 pr-4 text-right">{c.totalTare}</td>
                          <td className="py-2 pr-4 text-right text-red-600">{c.advanceRecovery || 0}</td>
                          <td className="py-2 pr-4 text-right">{tax.total || 0}</td>
                          <td className="py-2 pr-4 text-right font-semibold">{money(c.amount)}</td>
                          <td className="py-2 text-center">
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => openEdit(c)} title="Edit collection" className="p-1.5 rounded-lg text-brand-600 bg-brand-50 hover:bg-brand-100"><Pencil size={14} /></button>
                              <button onClick={() => setDeleting(c)} title="Delete collection" className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditing(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Edit collection</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                <select className="select-field" value={editForm.farmerId} onChange={(e) => setEditForm({ ...editForm, farmerId: Number(e.target.value) })}>
                  {farmers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
                <select className="select-field" value={editForm.grade} onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bag weights (kg, comma separated)</label>
                <input
                  className="input-field"
                  value={editForm.bagWeights.join(', ')}
                  onChange={(e) => setEditForm({ ...editForm, bagWeights: e.target.value.split(',').map((s) => parseFloat(s.trim()) || 0) })}
                  placeholder="1.0, 1.2, 0.9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Water tare (kg)</label>
                  <input type="number" className="input-field" value={editForm.waterTare} onChange={(e) => setEditForm({ ...editForm, waterTare: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Other tare (kg)</label>
                  <input type="number" className="input-field" value={editForm.otherTare} onChange={(e) => setEditForm({ ...editForm, otherTare: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tax mode</label>
                  <select className="select-field" value={editForm.taxMode} onChange={(e) => setEditForm({ ...editForm, taxMode: e.target.value })}>
                    <option value="none">None</option>
                    <option value="intra">Intra</option>
                    <option value="inter">Inter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">CGST %</label>
                  <input type="number" className="input-field" value={editForm.cgst} onChange={(e) => setEditForm({ ...editForm, cgst: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">SGST %</label>
                  <input type="number" className="input-field" value={editForm.sgst} onChange={(e) => setEditForm({ ...editForm, sgst: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IGST %</label>
                  <input type="number" className="input-field" value={editForm.igst} onChange={(e) => setEditForm({ ...editForm, igst: e.target.value })} />
                </div>
              </div>

              <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                Weight and amount are recomputed automatically on the server (cumulative tare, advance recovery and tax) when saved.
              </p>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={saveEdit} disabled={updateBusy} className="btn-primary text-sm">{updateBusy ? 'Saving...' : 'Save changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleting(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Delete collection</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete the collection for <strong className="text-gray-900 dark:text-gray-100">{deleting.farmer}</strong> from {deleting.date} ({deleting.weight} kg, {money(deleting.amount)})? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleting(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteBusy} className="btn-danger text-sm">{deleteBusy ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {createPortal(receiptPrint, printRoot)}
    </div>
  );
}