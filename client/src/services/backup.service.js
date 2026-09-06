// client/src/services/backup.service.js

import api from './api';

export const backupService = {
  getSettings: async () => {
    const response = await api.get('/backup/settings');
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await api.put('/backup/settings', data);
    return response.data;
  },

  runNow: async () => {
    const response = await api.post('/backup/run');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/backup/history');
    return response.data;
  }
};

export default backupService;
