// server/routes/invoice.routes.js

import express from 'express';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  createInvoiceFromSale
} from '../controllers/invoice.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createInvoice);
router.get('/', protect, getAllInvoices);
router.get('/:id', protect, getInvoiceById);
router.put('/:id/status', protect, updateInvoiceStatus);
router.post('/from-sale/:saleId', protect, createInvoiceFromSale);

export default router;