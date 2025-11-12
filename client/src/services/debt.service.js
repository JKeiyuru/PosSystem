// client/src/services/debt.service.js - NEW FILE

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
  }
};