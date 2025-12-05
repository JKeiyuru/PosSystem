// server/routes/customer.routes.js - UPDATED with sync endpoint

import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersWithCredit,
  getCustomerSalesHistory,
  syncAllCustomerCredits // NEW
} from '../controllers/customer.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getAllCustomers);
router.get('/credit', protect, getCustomersWithCredit);
router.post('/sync-credits', protect, authorize('admin', 'manager'), syncAllCustomerCredits); // NEW
router.get('/:id', protect, getCustomerById);
router.get('/:id/sales-history', protect, getCustomerSalesHistory);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

export default router;