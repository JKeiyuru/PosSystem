// client/src/services/stock.service.js

import api from './api';

export const stockService = {
  bulkRestock: async (items) => {
    const response = await api.post('/stock/bulk-restock', { items });
    return response.data;
  },

  adjustStock: async (adjustment) => {
    const response = await api.post('/stock/adjust', adjustment);
    return response.data;
  },

  getMovements: async (params) => {
    const response = await api.get('/stock/movements', { params });
    return response.data;
  },

  getStockValue: async () => {
    const response = await api.get('/stock/value');
    return response.data;
  }
};