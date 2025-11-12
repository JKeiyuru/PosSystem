// server/routes/production.routes.js

import express from 'express';
import {
  completeProduction,
  getProductionHistory,
  getProductionById,
  getProductionStats
} from '../controllers/production.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/complete', protect, completeProduction);
router.get('/history', protect, getProductionHistory);
router.get('/stats', protect, getProductionStats);
router.get('/:id', protect, getProductionById);

export default router;