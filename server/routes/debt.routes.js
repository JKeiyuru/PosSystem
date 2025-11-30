// server/routes/debt.routes.js - UPDATED

import express from 'express';
import {
  getAllDebts,
  recordDebtPayment,
  generateDebtReport,
  getTodayDebtPayments // NEW
} from '../controllers/debt.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getAllDebts);
router.post('/payment', protect, recordDebtPayment);
router.get('/report', protect, generateDebtReport);
router.get('/payments/today', protect, getTodayDebtPayments); // NEW

export default router;
