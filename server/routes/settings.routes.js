// server/routes/settings.routes.js

import express from 'express';
import {
  getSettings,
  updateSettings
} from '../controllers/settings.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, authorize('admin'), updateSettings);

export default router;