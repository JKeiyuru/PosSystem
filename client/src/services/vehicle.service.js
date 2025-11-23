import api from './api';

export const vehicleService = {
  // Vehicles
  getAllVehicles: async () => {
    const response = await api.get('/vehicles');
    return response.data;
  },

  getVehicleById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  createVehicle: async (data) => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  updateVehicle: async (id, data) => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },

  // Fuel Records
  getAllFuelRecords: async (params) => {
    const response = await api.get('/vehicles/fuel', { params });
    return response.data;
  },

  createFuelRecord: async (data) => {
    const response = await api.post('/vehicles/fuel', data);
    return response.data;
  },

  getVehicleStats: async (id) => {
    const response = await api.get(`/vehicles/${id}/stats`);
    return response.data;
  },

  // Maintenance Records
  getAllMaintenanceRecords: async (params) => {
    const response = await api.get('/vehicles/maintenance', { params });
    return response.data;
  },

  createMaintenanceRecord: async (data) => {
    const response = await api.post('/vehicles/maintenance', data);
    return response.data;
  }
};