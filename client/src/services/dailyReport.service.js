// client/src/services/dailyReport.service.js

import api from './api';

export const dailyReportService = {
  create: async (reportData) => {
    const response = await api.post('/daily-reports', reportData);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/daily-reports', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/daily-reports/${id}`);
    return response.data;
  },

  getByDate: async (date) => {
    const response = await api.get('/daily-reports/by-date', { params: { date } });
    return response.data;
  },

  sendEmail: async (reportId) => {
    const response = await api.post(`/daily-reports/${reportId}/send-email`);
    return response.data;
  }
};