import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPath = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthPath) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/me/password', data),
  sendPasswordOtp: () => api.post('/auth/me/password/otp'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  sendEmailCode: () => api.post('/auth/me/email/send'),
  confirmEmail: (code) => api.post('/auth/me/email/confirm', { code }),
  sendPhoneCode: () => api.post('/auth/me/phone/send'),
  confirmPhone: (code) => api.post('/auth/me/phone/confirm', { code }),
  get2faSetup: () => api.get('/auth/2fa/setup'),
  enable2fa: (code) => api.post('/auth/2fa/enable', { code }),
  disable2fa: (code) => api.post('/auth/2fa/disable', { code }),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const permissionAPI = {
  getModules: () => api.get('/permissions/modules'),
  getMatrix: (role) => api.get(`/permissions/${role}`),
  updateMatrix: (role, matrix) => api.put(`/permissions/${role}`, matrix),
};

export const settingsAPI = {
  getDayStatus: () => api.get('/settings/day-status'),
  getDayStatusHistory: () => api.get('/settings/day-status/history'),
  updateDayStatus: (status) => api.put('/settings/day-status', { status }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
};

export const farmerAPI = {
  getAll: (params) => api.get('/farmers', { params }),
  getById: (id) => api.get(`/farmers/${id}`),
  create: (data) => api.post('/farmers', data),
  update: (id, data) => api.put(`/farmers/${id}`, data),
  delete: (id) => api.delete(`/farmers/${id}`),
};

export const collectionAPI = {
  getAll: () => api.get('/collections'),
  getById: (id) => api.get(`/collections/${id}`),
  create: (data) => api.post('/collections', data),
  update: (id, data) => api.put(`/collections/${id}`, data),
  remove: (id) => api.delete(`/collections/${id}`),
  getByDateRange: (from, to) => api.get('/collections/range', { params: { from, to } }),
  getByFarmer: (farmerId) => api.get(`/collections/farmer/${farmerId}`),
};

export const rateAPI = {
  getAll: () => api.get('/rates'),
  getById: (id) => api.get(`/rates/${id}`),
  create: (data) => api.post('/rates', data),
  update: (id, data) => api.put(`/rates/${id}`, data),
  delete: (id) => api.delete(`/rates/${id}`),
  getActive: (grade) => api.get(`/rates/active/${grade}`),
};

export const financeAPI = {
  getSummary: () => api.get('/finance/summary'),
  getLedger: (params) => api.get('/finance/ledger', { params }),
  getOutstanding: (farmerId) => api.get(`/finance/outstanding/${farmerId}`),
  getAdvances: () => api.get('/finance/advances'),
  createAdvance: (data) => api.post('/finance/advances', data),
  updateAdvance: (id, data) => api.put(`/finance/advances/${id}`, data),
  deleteAdvance: (id) => api.delete(`/finance/advances/${id}`),
  getPayments: () => api.get('/finance/payments'),
  createPayment: (data) => api.post('/finance/payments', data),
  updatePayment: (id, data) => api.put(`/finance/payments/${id}`, data),
  deletePayment: (id) => api.delete(`/finance/payments/${id}`),
};

export const deliveryAPI = {
  getAll: (params) => api.get('/deliveries', { params }),
  getById: (id) => api.get(`/deliveries/${id}`),
  create: (data) => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  delete: (id) => api.delete(`/deliveries/${id}`),
};

export const reportAPI = {
  getCollectionSummary: (from, to) => api.get('/reports/collection', { params: { from, to } }),
  getFactoryReconciliation: (from, to) => api.get('/reports/factory', { params: { from, to } }),
  getSupplierPassbook: (farmerId) => api.get(`/reports/passbook/${farmerId}`),
  getWeeklyPaymentSheet: (from, to) => api.get('/reports/payments', { params: { from, to } }),
};

export default api;
