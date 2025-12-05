// client/src/services/debt.service.js - UPDATED with delete function

import api from './api';

export const debtService = {
  getAll: async (params) => {
    const response = await api.get('/debts', { params });
    return response.data;
  },

  recordPayment: async (data) => {
    const response = await api.post('/debts/payment', data);
    return response.data;
  },

  generateReport: async (params) => {
    const response = await api.get('/debts/report', { params });
    return response.data;
  },

  // NEW: Delete debt
  deleteDebt: async (customerId) => {
    const response = await api.delete(`/debts/${customerId}`);
    return response.data;
  }
};
