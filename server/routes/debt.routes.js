// server/routes/debt.routes.js - UPDATED

import express from 'express';
import {
  getAllDebts,
  recordDebtPayment,
  generateDebtReport,
  getTodayDebtPayments,
  deleteDebt,
  getPaymentsByDate // NEW
} from '../controllers/debt.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getAllDebts);
router.post('/payment', protect, recordDebtPayment);
router.get('/report', protect, generateDebtReport);
router.get('/payments/today', protect, getTodayDebtPayments);
router.get('/payments/by-date', protect, getPaymentsByDate); // NEW
router.delete('/:customerId', protect, authorize('admin'), deleteDebt);

export default router;