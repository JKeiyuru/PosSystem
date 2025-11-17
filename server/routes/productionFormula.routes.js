// server/routes/productionFormula.routes.js - NEW

import express from 'express';
import {
  createFormula,
  getAllFormulas,
  getFormulaById,
  updateFormula,
  deleteFormula,
  executeFormula
} from '../controllers/productionFormula.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createFormula);
router.get('/', protect, getAllFormulas);
router.get('/:id', protect, getFormulaById);
router.put('/:id', protect, updateFormula);
router.delete('/:id', protect, deleteFormula);
router.post('/:id/execute', protect, executeFormula);

export default router;