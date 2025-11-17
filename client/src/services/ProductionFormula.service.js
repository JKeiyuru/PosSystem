// client/src/services/productionFormula.service.js - NEW

import api from './api';

export const productionFormulaService = {
  create: async (data) => {
    const response = await api.post('/production-formulas', data);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/production-formulas', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/production-formulas/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/production-formulas/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/production-formulas/${id}`);
    return response.data;
  },

  execute: async (id, data) => {
    const response = await api.post(`/production-formulas/${id}/execute`, data);
    return response.data;
  }
};