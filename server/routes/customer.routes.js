// server/routes/customer.routes.js
// UPDATED: Added /statement route for customer statement PDF generation

import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersWithCredit,
  getCustomerSalesHistory,
  getCustomerStatement,
  syncAllCustomerCredits,
} from '../controllers/customer.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getAllCustomers);
router.get('/credit', protect, getCustomersWithCredit);
router.post(
  '/sync-credits',
  protect,
  authorize('admin', 'manager'),
  syncAllCustomerCredits
);
router.get('/:id', protect, getCustomerById);
router.get('/:id/sales-history', protect, getCustomerSalesHistory);
// New: customer statement route — accessible by all authenticated roles
router.get('/:id/statement', protect, getCustomerStatement);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

export default router;