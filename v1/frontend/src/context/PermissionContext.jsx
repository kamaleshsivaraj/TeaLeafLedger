import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { permissionAPI } from '../api/client';
import { useAuth } from './AuthContext';

const PermissionContext = createContext(null);

const ADMIN_PERMISSIONS = (() => {
  const all = {};
  for (const m of ['DASHBOARD', 'COLLECTION', 'FARMERS', 'DELIVERIES', 'RATES', 'FINANCE', 'REPORTS', 'USERS']) {
    all[m] = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PRINT'];
  }
  return all;
})();

export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    permissionAPI.getModules().then((res) => {
      setModules(res.data?.modules || []);
      setActions(res.data?.actions || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    if (!user) {
      setPermissions({});
      setLoading(false);
      return;
    }
    if (user.role === 'ADMIN') {
      setPermissions(ADMIN_PERMISSIONS);
      setLoading(false);
      return;
    }
    permissionAPI.getMatrix(user.role)
      .then((res) => setPermissions(res.data || {}))
      .catch(() => setPermissions({}))
      .finally(() => setLoading(false));
  }, [user]);

  const has = useCallback((module, action) => {
    if (!user || !module) return false;
    if (user.role === 'ADMIN') return true;
    const set = permissions[module];
    return !!set && set.includes(action);
  }, [user, permissions]);

  const canView = useCallback((module) => has(module, 'VIEW'), [has]);

  return (
    <PermissionContext.Provider value={{ permissions, modules, actions, loading, has, canView }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}