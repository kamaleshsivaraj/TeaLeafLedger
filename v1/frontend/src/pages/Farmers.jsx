import { useState, useEffect } from "react";
import { farmerAPI } from "../api/client";
import { usePermissions } from "../context/PermissionContext";
import toast from "react-hot-toast";
import { Search, X, Plus, Edit2, Trash2 } from "lucide-react";

export default function Farmers() {
  const { has } = usePermissions();
  const canCreate = has("FARMERS", "CREATE");
  const canUpdate = has("FARMERS", "UPDATE");
  const canDelete = has("FARMERS", "DELETE");
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editFarmer, setEditFarmer] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    phone: "",
    division: "",
    status: "ACTIVE",
    monthlyLeaf: 0,
    advanceBalance: 0,
  });

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    try {
      const res = await farmerAPI.getAll({
        search,
        division: divisionFilter,
        status: statusFilter,
      });
      setFarmers(res.data || []);
    } catch (err) {
      toast.error("Failed to load farmers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, [search, divisionFilter, statusFilter]);

  const openAdd = () => {
    setEditFarmer(null);
    setForm({
      name: "",
      code: "",
      phone: "",
      division: "",
      status: "ACTIVE",
      monthlyLeaf: 0,
      advanceBalance: 0,
    });
    setShowForm(true);
  };
  const openEdit = (f) => {
    setEditFarmer(f);
    setForm({
      name: f.name,
      code: f.code,
      phone: f.phone,
      division: f.division,
      status: f.status,
      monthlyLeaf: f.monthlyLeaf || 0,
      advanceBalance: f.advanceBalance || 0,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editFarmer) {
        await farmerAPI.update(editFarmer.id, form);
        toast.success("Farmer updated");
      } else {
        await farmerAPI.create(form);
        toast.success("Farmer added");
      }
      setShowForm(false);
      loadFarmers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save farmer");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await farmerAPI.delete(deleting.id);
      toast.success("Farmer deleted");
      setDeleting(null);
      loadFarmers();
    } catch (err) {
      toast.error("Failed to delete farmer");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Supplier registry
          </p>
          <h2 className="text-xl font-bold text-gray-900">Farmers</h2>
          <p className="text-sm text-gray-500">
            Manage profiles, passbooks and collection history.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openAdd}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add farmer
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Search name, code, phone or division"
          />
        </div>
        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          className="select-field w-auto"
        >
          <option value="">All divisions</option>
          <option>Kegalle Division</option>
          <option>Rambukkana</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-field w-auto"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Division</th>
              <th>Last collection</th>
              <th>Monthly leaf</th>
              <th>Advance balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {farmers.map((f) => (
              <tr key={f.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {f.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{f.name}</p>
                      <p className="text-xs text-gray-500">
                        {f.code} · {f.phone}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-gray-600">{f.division}</td>
                <td className="text-gray-600">
                  {f.lastCollection || "No collection yet"}
                </td>
                <td className="font-medium">
                  {(f.monthlyLeaf || 0).toFixed(1)} kg
                </td>
                <td className="font-medium">
                  Rs. {Number(f.advanceBalance || 0).toLocaleString()}
                </td>
                <td><span className={f.status === "ACTIVE" ? 'pill-green' : 'pill-red'}>{f.status === "ACTIVE" ? 'Active' : 'INACTIVE'}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    {canUpdate && (
                      <button
                        onClick={() => openEdit(f)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleting(f)}
                        title="Delete farmer"
                        className="p-1.5 rounded hover:bg-red-50 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {farmers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No farmers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editFarmer ? "Edit farmer" : "Add farmer"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Full name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="e.g. S. Perera"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Supplier code
                </label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="input-field"
                  required
                  placeholder="TF-1201"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Phone number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  required
                  placeholder="077 123 4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Division
                </label>
                <input
                  value={form.division}
                  onChange={(e) =>
                    setForm({ ...form, division: e.target.value })
                  }
                  className="input-field"
                  required
                  placeholder="Kegalle Division"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="select-field"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editFarmer ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleting(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Delete farmer</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-gray-100">{deleting.name}</strong> ({deleting.code})? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleting(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteBusy} className="btn-danger text-sm">{deleteBusy ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
      {!canCreate && !canUpdate && (
        <p className="text-sm text-gray-400 text-center py-2">
          You have read-only access to farmers.
        </p>
      )}
    </div>
  );
}
