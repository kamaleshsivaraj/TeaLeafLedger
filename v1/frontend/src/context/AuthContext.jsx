import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingLogin, setPendingLogin] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const persistAuth = ({ token: newToken, id, name, email, role }) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify({ id, name, email, role }));
    setToken(newToken);
    setUser({ id, name, email, role });
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const data = response.data;
    if (data.twoFactorRequired) {
      setPendingLogin({ email, password });
      return data;
    }
    persistAuth(data);
    return data;
  };

  const confirm2fa = async (code) => {
    if (!pendingLogin) {
      throw new Error('No pending login');
    }
    const response = await authAPI.login({ ...pendingLogin, code });
    const data = response.data;
    persistAuth(data);
    setPendingLogin(null);
    return data;
  };

  const signup = async (name, email, phone, password) => {
    const response = await authAPI.signup({ name, email, phone, password });
    persistAuth(response.data);
    return response.data;
  };

  const refreshUser = async () => {
    const res = await authAPI.me();
    const u = res.data;
    const next = { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role };
    localStorage.setItem('user', JSON.stringify(next));
    setUser(next);
    return u;
  };

  const setAuthData = (data) => persistAuth(data);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPendingLogin(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, pendingLogin, login, confirm2fa, signup, refreshUser, setAuthData, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
