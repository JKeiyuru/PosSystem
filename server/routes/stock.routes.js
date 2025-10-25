// server/routes/stock.routes.js

import express from 'express';
import {
  bulkRestock,
  adjustStock,
  getStockMovements,
  getStockValue
} from '../controllers/stock.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/bulk-restock', protect, bulkRestock);
router.post('/adjust', protect, adjustStock);
router.get('/movements', protect, getStockMovements);
router.get('/value', protect, getStockValue);

export default router;