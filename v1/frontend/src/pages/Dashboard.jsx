import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectionAPI, financeAPI, farmerAPI, deliveryAPI } from '../api/client';
import { usePermissions } from '../context/PermissionContext';
import { Scale, DollarSign, Users, Truck, TrendingUp, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { canView } = usePermissions();
  const canCollections = canView('COLLECTION');
  const canFarmers = canView('FARMERS');
  const canDeliveries = canView('DELIVERIES');
  const canFinance = canView('FINANCE');
  const [stats, setStats] = useState({ collections: 0, totalKg: 0, totalValue: 0, farmers: 0, deliveries: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [canView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const jobs = [];
      if (canCollections) jobs.push(collectionAPI.getAll());
      if (canFarmers) jobs.push(farmerAPI.getAll());
      if (canDeliveries) jobs.push(deliveryAPI.getAll());
      if (canFinance) jobs.push(financeAPI.getSummary());

      const settled = await Promise.allSettled(jobs);
      const values = settled.map((r) => (r.status === 'fulfilled' ? r.value.data : null));
      let idx = 0;

      const collections = canCollections ? (values[idx++] || []) : [];
      const farmers = canFarmers ? (values[idx++] || []) : [];
      const deliveries = canDeliveries ? (values[idx++] || []) : [];
      const summary = canFinance ? (values[idx++] || {}) : {};

      const totalKg = collections.reduce((sum, c) => sum + (c.weight || 0), 0);
      const totalValue = collections.reduce((sum, c) => sum + (c.amount || 0), 0);

      setStats({
        collections: collections.length,
        totalKg,
        totalValue,
        farmers: farmers.length,
        deliveries: deliveries.length,
      });

      setRecent(collections.slice(-5).reverse());
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{today}</p>
          <h2 className="text-2xl font-bold text-gray-900">Here's how collection is moving today.</h2>
        </div>
        {canCollections && (
        <button onClick={() => navigate('/collection')} className="btn-primary flex items-center gap-2">
          + Record collection <ArrowRight size={16} />
        </button>
      )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canCollections && (
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Scale size={18} className="text-green-600" /></div>
            <p className="text-sm text-gray-500">Green leaf collected</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalKg.toFixed(1)} <span className="text-sm font-normal text-gray-500">kg</span></p>
        </div>
        )}

        {canCollections && (
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><DollarSign size={18} className="text-amber-600" /></div>
            <p className="text-sm text-gray-500">Today's payable value</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{money(stats.totalValue)}</p>
        </div>
        )}

        {canFarmers && (
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Users size={18} className="text-blue-600" /></div>
            <p className="text-sm text-gray-500">Active suppliers</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.farmers}</p>
        </div>
        )}

        {canDeliveries && (
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Truck size={18} className="text-purple-600" /></div>
            <p className="text-sm text-gray-500">Factory deliveries</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.deliveries}</p>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canCollections && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Recent activity</h3>
              <p className="text-sm text-gray-500">Latest collection entries</p>
            </div>
            <button onClick={() => navigate('/collection')} className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {recent.length > 0 ? recent.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {c.farmer?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.farmer}</p>
                    <p className="text-xs text-gray-500">{c.code} · {c.grade}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{c.weight?.toFixed(1)} kg</p>
                  <p className="text-xs text-gray-500">{money(c.amount)}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-8">No collections recorded yet. Start by recording a collection.</p>
            )}
          </div>
        </div>
        )}

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp size={18} className="text-green-600" /></div>
            <div>
              <h3 className="font-bold text-gray-900">Quick stats</h3>
              <p className="text-sm text-gray-500">Operational overview</p>
            </div>
          </div>
          <div className="space-y-4">
            {canCollections && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Total collections</span>
              <span className="text-sm font-bold text-gray-900">{stats.collections}</span>
            </div>
            )}
            {canFarmers && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Active suppliers</span>
              <span className="text-sm font-bold text-gray-900">{stats.farmers}</span>
            </div>
            )}
            {canDeliveries && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Deliveries tracked</span>
              <span className="text-sm font-bold text-gray-900">{stats.deliveries}</span>
            </div>
            )}
            {canCollections && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Avg weight per collection</span>
              <span className="text-sm font-bold text-gray-900">
                {stats.collections > 0 ? (stats.totalKg / stats.collections).toFixed(1) : '0.0'} kg
              </span>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
