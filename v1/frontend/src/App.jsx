import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { usePermissions } from './context/PermissionContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Collection from './pages/Collection';
import Farmers from './pages/Farmers';
import Deliveries from './pages/Deliveries';
import Rates from './pages/Rates';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Account from './pages/Account';
import Users from './pages/Users';
import Privileges from './pages/Privileges';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ModuleRoute({ module, children }) {
  const { canView } = usePermissions();
  if (!canView(module)) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="collection" element={<ModuleRoute module="COLLECTION"><Collection /></ModuleRoute>} />
        <Route path="farmers" element={<ModuleRoute module="FARMERS"><Farmers /></ModuleRoute>} />
        <Route path="deliveries" element={<ModuleRoute module="DELIVERIES"><Deliveries /></ModuleRoute>} />
        <Route path="rates" element={<ModuleRoute module="RATES"><Rates /></ModuleRoute>} />
        <Route path="finance" element={<ModuleRoute module="FINANCE"><Finance /></ModuleRoute>} />
        <Route path="reports" element={<ModuleRoute module="REPORTS"><Reports /></ModuleRoute>} />
        <Route path="account" element={<Account />} />
        <Route path="users" element={<ModuleRoute module="USERS"><Users /></ModuleRoute>} />
        <Route path="privileges" element={<ModuleRoute module="USERS"><Privileges /></ModuleRoute>} />
      </Route>
    </Routes>
  );
}
