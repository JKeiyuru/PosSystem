// server/routes/dailyReport.routes.js

import express from 'express';
import {
  createDailyReport,
  getAllDailyReports,
  getDailyReportById,
  getDailyReportByDate,
  sendDailyReportEmail
} from '../controllers/dailyReport.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createDailyReport);
router.get('/', protect, getAllDailyReports);
router.get('/by-date', protect, getDailyReportByDate);
router.get('/:id', protect, getDailyReportById);
router.post('/:id/send-email', protect, sendDailyReportEmail);

export default router;