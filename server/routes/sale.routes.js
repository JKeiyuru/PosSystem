// server/routes/sale.routes.js

import express from 'express';
import {
  createSale,
  getAllSales,
  getSaleById,
  updateSalePayment,
  getDailySales,
  deleteSale,
  getTopProducts,
  getTopCustomers
} from '../controllers/sale.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createSale);
router.get('/', protect, getAllSales);
router.get('/daily', protect, getDailySales);
router.get('/analytics/top-products', protect, getTopProducts);
router.get('/analytics/top-customers', protect, getTopCustomers);
router.get('/:id', protect, getSaleById);
router.put('/:id/payment', protect, updateSalePayment);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteSale);

export default router;