// client/src/services/sale.service.js

import api from './api';

export const saleService = {
  create: async (sale) => {
    const response = await api.post('/sales', sale);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  updatePayment: async (id, payment) => {
    const response = await api.put(`/sales/${id}/payment`, payment);
    return response.data;
  },

  getDailySales: async (date) => {
    const response = await api.get('/sales/daily', { params: { date } });
    return response.data;
  }
};