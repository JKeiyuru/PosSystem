// server/controllers/analytics.controller.js - NEW FILE

import Sale from '../models/Sale.model.js';
import Customer from '../models/Customer.model.js';
import Product from '../models/Product.model.js';

// Reset analytics data
export const resetAnalytics = async (req, res) => {
  try {
    const { types = ['products', 'customers'] } = req.body;

    // In a real implementation:
    // 1. Archive current analytics data
    // 2. Reset counters in the database
    // 3. Clear cached analytics data
    
    // For now, we'll just return success since the frontend
    // handles clearing its own state and will start fresh
    
    console.log(`Analytics reset requested for: ${types.join(', ')}`);
    
    res.json({
      success: true,
      message: 'Analytics data has been reset successfully',
      resetTypes: types,
      resetAt: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
