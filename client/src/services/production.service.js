// client/src/services/production.service.js - NEW FILE

import api from './api';

export const productionService = {
  complete: async (data) => {
    const response = await api.post('/production/complete', data);
    return response.data;
  },

  getHistory: async (params) => {
    const response = await api.get('/production/history', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/production/${id}`);
    return response.data;
  },

  getStats: async (params) => {
    const response = await api.get('/production/stats', { params });
    return response.data;
  }
};