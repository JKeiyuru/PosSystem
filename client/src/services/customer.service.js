// client/src/services/customer.service.js

import api from './api';

export const customerService = {
  getAll: async (params) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  create: async (customer) => {
    const response = await api.post('/customers', customer);
    return response.data;
  },

  update: async (id, customer) => {
    const response = await api.put(`/customers/${id}`, customer);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  getWithCredit: async () => {
    const response = await api.get('/customers/credit');
    return response.data;
  }
};