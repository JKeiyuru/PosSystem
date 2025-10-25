// client/src/services/invoice.service.js

import api from './api';

export const invoiceService = {
  create: async (invoice) => {
    const response = await api.post('/invoices', invoice);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  updateStatus: async (id, status, paidDate) => {
    const response = await api.put(`/invoices/${id}/status`, { status, paidDate });
    return response.data;
  },

  createFromSale: async (saleId) => {
    const response = await api.post(`/invoices/from-sale/${saleId}`);
    return response.data;
  }
};