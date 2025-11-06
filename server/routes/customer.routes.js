// server/routes/customer.routes.js

import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersWithCredit,
  getCustomerSalesHistory
} from '../controllers/customer.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getAllCustomers);
router.get('/credit', protect, getCustomersWithCredit);
router.get('/:id', protect, getCustomerById);
router.get('/:id/sales-history', protect, getCustomerSalesHistory);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

export default router;