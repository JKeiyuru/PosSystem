// server/routes/analytics.routes.js - NEW FILE

import express from 'express';
import { resetAnalytics } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/reset', protect, resetAnalytics);

export default router;
