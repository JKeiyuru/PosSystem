// server/routes/auth.routes.js - UPDATED

import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Admin only routes
router.post('/register', protect, authorize('admin'), register);
router.get('/users', protect, authorize('admin', 'manager'), getAllUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

export default router;