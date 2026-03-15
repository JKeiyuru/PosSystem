// server/routes/production.routes.js
// UPDATED: Added reverse production endpoint

import express from 'express';
import {
  completeProduction,
  getProductionHistory,
  getProductionById,
  getProductionStats,
  reverseProduction,
} from '../controllers/production.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/complete', protect, completeProduction);
router.get('/history', protect, getProductionHistory);
router.get('/stats', protect, getProductionStats);
router.get('/:id', protect, getProductionById);
// Admin only: reverse a production record
router.post('/:id/reverse', protect, authorize('admin', 'manager'), reverseProduction);

export default router;