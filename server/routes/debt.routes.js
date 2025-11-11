// server/routes/debt.routes.js

import express from 'express';
import {
  getAllDebts,
  recordDebtPayment,
  generateDebtReport
} from '../controllers/debt.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getAllDebts);
router.post('/payment', protect, recordDebtPayment);
router.get('/report', protect, generateDebtReport);

export default router;