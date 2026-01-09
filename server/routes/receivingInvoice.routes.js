// server/routes/receivingInvoice.routes.js - WITH DELETE ITEM ROUTE

import express from 'express';
import {
  createReceivingInvoice,
  getAllReceivingInvoices,
  getReceivingInvoiceById,
  getDailyReceivingReport,
  updatePaymentStatus,
  deleteInvoiceItem // NEW
} from '../controllers/receivingInvoice.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createReceivingInvoice);
router.get('/', protect, getAllReceivingInvoices);
router.get('/daily-report', protect, getDailyReceivingReport);
router.get('/:id', protect, getReceivingInvoiceById);
router.patch('/:id/payment-status', protect, updatePaymentStatus);

// NEW: Delete item from invoice (admin/manager only)
router.delete('/:invoiceId/items/:itemId', protect, authorize('admin', 'manager'), deleteInvoiceItem);

export default router;