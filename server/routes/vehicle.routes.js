import express from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAllFuelRecords,
  createFuelRecord,
  getVehicleStats,
  getAllMaintenanceRecords,
  createMaintenanceRecord
} from '../controllers/vehicle.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Fuel records - MUST come before /:id routes
router.get('/fuel', protect, getAllFuelRecords);
router.post('/fuel', protect, createFuelRecord);

// Maintenance records - MUST come before /:id routes
router.get('/maintenance', protect, getAllMaintenanceRecords);
router.post('/maintenance', protect, authorize('admin', 'manager'), createMaintenanceRecord);

// Vehicle routes
router.get('/', protect, getAllVehicles);
router.get('/:id', protect, getVehicleById);
router.post('/', protect, authorize('admin', 'manager'), createVehicle);
router.put('/:id', protect, authorize('admin', 'manager'), updateVehicle);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteVehicle);
router.get('/:id/stats', protect, getVehicleStats);

export default router;