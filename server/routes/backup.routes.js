// server/routes/backup.routes.js

import express from 'express';
import {
  getBackupSettings,
  updateBackupSettings,
  runBackupNow,
  getBackupHistory
} from '../controllers/backup.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/settings', protect, authorize('admin'), getBackupSettings);
router.put('/settings', protect, authorize('admin'), updateBackupSettings);
router.post('/run', protect, authorize('admin'), runBackupNow);
router.get('/history', protect, authorize('admin'), getBackupHistory);

export default router;
