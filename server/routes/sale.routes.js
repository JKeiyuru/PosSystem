// server/routes/sale.routes.js

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

import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

/* =========================
   SALES ROUTES (PROTECTED)
   ========================= */

router.get('/daily', protect, getDailySales);
router.get('/', protect, getAllSales);

router.get('/analytics/top-products', protect, getTopProducts);
router.get('/analytics/top-customers', protect, getTopCustomers);

// NEW ROUTE: Revenue breakdown for a specific period
router.get('/analytics/revenue-breakdown', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get sales in the period
    const sales = await Sale.find({
      saleDate: { $gte: start, $lte: end }
    });

    // Get credit payments in the period
    const creditPayments = await PaymentTransaction.find({
      paymentDate: { $gte: start, $lte: end }
    });

    // Calculate revenue
    const cashSales = sales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + (s.amountPaid || 0), 0);

    const mpesaSales = sales
      .filter(
        s =>
          s.paymentMethod?.includes('mpesa') ||
          s.paymentMethod === 'gdc_paybill'
      )
      .reduce((sum, s) => sum + (s.amountPaid || 0), 0);

    const creditGiven = sales
      .filter(s => s.paymentMethod === 'credit')
      .reduce((sum, s) => sum + s.total, 0);

    const creditCollectionsCash = creditPayments
      .filter(p => p.paymentMethod === 'cash')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const creditCollectionsMpesa = creditPayments
      .filter(
        p =>
          p.paymentMethod?.includes('mpesa') ||
          p.paymentMethod?.includes('gdc')
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalCreditCollections =
      creditCollectionsCash + creditCollectionsMpesa;

    const totalRevenue =
      cashSales + mpesaSales + totalCreditCollections;

    res.json({
      success: true,
      data: {
        period: { startDate: start, endDate: end },
        revenue: {
          total: totalRevenue,
          cashSales,
          mpesaSales,
          creditCollections: totalCreditCollections,
          creditCollectionsCash,
          creditCollectionsMpesa
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

/* =========================
   SALE CRUD
   ========================= */

router.get('/:id', protect, getSaleById);
router.post('/', protect, createSale);
router.put('/:id/payment', protect, updateSalePayment);
router.delete(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  deleteSale
);

export default router;
