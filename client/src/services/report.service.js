// client/src/services/report.service.js

import api from './api';

export const reportService = {
  getDailySales: async (startDate, endDate) => {
    const response = await api.get('/reports/daily-sales', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getBalanceSheet: async () => {
    const response = await api.get('/reports/balance-sheet');
    return response.data;
  },

  getProductPerformance: async (startDate, endDate) => {
    const response = await api.get('/reports/product-performance', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getCashFlow: async (startDate, endDate) => {
    const response = await api.get('/reports/cash-flow', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};