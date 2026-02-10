// server/routes/sale.routes.js - ADD this route for revenue analytics

import express from 'express';
import {
  getDailySales,
  createSale,
  updateSalePayment,
  getAllSales,
  getSaleById,
  getTopProducts,
  getTopCustomers,
  deleteSale
} from '../controllers/sale.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/daily', authenticate, getDailySales);
router.get('/', authenticate, getAllSales);
router.get('/analytics/top-products', authenticate, getTopProducts);
router.get('/analytics/top-customers', authenticate, getTopCustomers);
router.get('/:id', authenticate, getSaleById);
router.post('/', authenticate, createSale);
router.put('/:id/payment', authenticate, updateSalePayment);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), deleteSale);

// NEW ROUTE: Get revenue breakdown for a specific period
router.get('/analytics/revenue-breakdown', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get sales in period
    const sales = await Sale.find({
      saleDate: { $gte: start, $lte: end }
    });

    // Get credit payments in period
    const creditPayments = await PaymentTransaction.find({
      paymentDate: { $gte: start, $lte: end }
    });

    // Calculate revenue correctly
    const cashSales = sales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + (s.amountPaid || 0), 0);

    const mpesaSales = sales
      .filter(s => s.paymentMethod.includes('mpesa') || s.paymentMethod === 'gdc_paybill')
      .reduce((sum, s) => sum + (s.amountPaid || 0), 0);

    const creditGiven = sales
      .filter(s => s.paymentMethod === 'credit')
      .reduce((sum, s) => sum + s.total, 0);

    const creditCollectionsCash = creditPayments
      .filter(p => p.paymentMethod === 'cash')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const creditCollectionsMpesa = creditPayments
      .filter(p => p.paymentMethod.includes('mpesa') || p.paymentMethod.includes('gdc'))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalCreditCollections = creditCollectionsCash + creditCollectionsMpesa;
    const totalRevenue = cashSales + mpesaSales + totalCreditCollections;

    res.json({
      success: true,
      data: {
        period: { startDate: start, endDate: end },
        revenue: {
          total: totalRevenue,
          cashSales: cashSales,
          mpesaSales: mpesaSales,
          creditCollections: totalCreditCollections,
          creditCollectionsCash: creditCollectionsCash,
          creditCollectionsMpesa: creditCollectionsMpesa
        },
        credit: {
          given: creditGiven,
          willBecomeRevenue: true
        },
        counts: {
          sales: sales.length,
          creditPayments: creditPayments.length
        }
      }
    });
  } catch (error) {
    console.error('Error in revenue breakdown:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;