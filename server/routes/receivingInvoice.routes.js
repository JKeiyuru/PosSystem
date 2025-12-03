// server/routes/receivingInvoice.routes.js - UPDATED

import express from 'express';
import {
  createReceivingInvoice,
  getAllReceivingInvoices,
  getReceivingInvoiceById,
  getDailyReceivingReport,
  updatePaymentStatus
} from '../controllers/receivingInvoice.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createReceivingInvoice);
router.get('/', protect, getAllReceivingInvoices);
router.get('/daily-report', protect, getDailyReceivingReport);
router.get('/:id', protect, getReceivingInvoiceById);
router.patch('/:id/payment-status', protect, updatePaymentStatus);

export default router;
