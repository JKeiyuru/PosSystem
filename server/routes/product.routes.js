// server/routes/product.routes.js

import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  generateBarcode,
  getLowStockProducts,
  getCategories,
  bulkImport,
  getProductPricing
} from '../controllers/product.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getAllProducts);
router.get('/low-stock', protect, getLowStockProducts);
router.get('/categories', protect, getCategories);
router.get('/:id', protect, getProductById);
router.post('/', protect, createProduct);
router.post('/bulk-import', protect, bulkImport);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/barcode', protect, generateBarcode);
router.get('/:id/pricing', protect, getProductPricing);

export default router;