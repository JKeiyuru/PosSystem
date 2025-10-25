// server/routes/report.routes.js

import express from 'express';
import {
  getDailySalesReport,
  getBalanceSheet,
  getProductPerformance,
  getCashFlowReport
} from '../controllers/report.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/daily-sales', protect, getDailySalesReport);
router.get('/balance-sheet', protect, authorize('admin', 'manager'), getBalanceSheet);
router.get('/product-performance', protect, getProductPerformance);
router.get('/cash-flow', protect, authorize('admin', 'manager'), getCashFlowReport);

export default router;