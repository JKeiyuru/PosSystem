// server/routes/invoice.routes.js
// UPDATED: Added delete and edit receiving invoice routes (admin only)

import express from 'express';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  createInvoiceFromSale,
  deleteReceivingInvoice,
  editReceivingInvoice,
} from '../controllers/invoice.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createInvoice);
router.get('/', protect, getAllInvoices);
router.get('/:id', protect, getInvoiceById);
router.put('/:id/status', protect, updateInvoiceStatus);
router.post('/from-sale/:saleId', protect, createInvoiceFromSale);

// Admin only: delete a receiving invoice (reverses stock)
router.delete(
  '/receiving/:id',
  protect,
  authorize('admin', 'manager'),
  deleteReceivingInvoice
);

// Admin only: edit a receiving invoice (adjusts stock)
router.put(
  '/receiving/:id',
  protect,
  authorize('admin', 'manager'),
  editReceivingInvoice
);

export default router;