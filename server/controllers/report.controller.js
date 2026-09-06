// server/controllers/report.controller.js - uses the shared sales calculation utility

import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Customer from '../models/Customer.model.js';
import StockMovement from '../models/StockMovement.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import { calculateSalesBreakdown } from '../utils/salesCalculations.js';

// Get monthly revenue and profit data - FIXED to use sale.grossProfit
export const getMonthlyProfit = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const monthlyData = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: startDate,
            $lte: endDate
          },
          paymentStatus: { $in: ['paid', 'partial', 'unpaid'] } // Include all sales
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' }
          },
          revenue: { $sum: '$total' },
          // Use the profit already calculated in the sale document
          profit: { $sum: '$grossProfit' },
          salesCount: { $sum: 1 }
        }
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInString: [
                  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ]
              },
              in: {
                $arrayElemAt: ['$$monthsInString', '$_id.month']
              }
            }
          },
          revenue: 1,
          profit: 1,
          salesCount: 1,
          year: '$_id.year'
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        months: monthlyData
      }
    });
  } catch (error) {
    console.error('Error fetching monthly profit data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get daily/period sales report - money received is attributed per real payment method
export const getDailySalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    const [sales, payments] = await Promise.all([
      Sale.find({ saleDate: { $gte: start, $lte: end } })
        .populate('items.product')
        .populate('customer')
        .populate('cashier', 'name'),
      PaymentTransaction.find({ paymentDate: { $gte: start, $lte: end } }),
    ]);

    const breakdown = calculateSalesBreakdown(sales, payments);

    const paymentBreakdown = {
      cash: breakdown.totalCash,
      mpesa: breakdown.totalDigital,
      credit: breakdown.creditIssued,
      byMethod: breakdown.byMethod,
      creditPaymentsCollected: breakdown.creditPaymentsCollected,
    };

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalSales: breakdown.salesCount,
          // Turnover: value of everything sold, credit included
          grossSalesValue: breakdown.grossSalesValue,
          // Money actually received in the period (sales + debt repayments)
          totalCollected: breakdown.totalCollected,
          // Kept for backwards compatibility with existing UI
          totalRevenue: breakdown.grossSalesValue,
          totalCost: breakdown.totalCost,
          grossProfit: breakdown.grossProfit,
          creditIssued: breakdown.creditIssued,
          profitMargin: breakdown.grossSalesValue > 0
            ? ((breakdown.grossProfit / breakdown.grossSalesValue) * 100).toFixed(2) + '%'
            : '0%'
        },
        paymentBreakdown,
        sales
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBalanceSheet = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const inventory = products.reduce((sum, p) => sum + (p.quantity * p.buyingPrice), 0);
    
    const customers = await Customer.find({ isActive: true });
    const accountsReceivable = customers.reduce((sum, c) => sum + c.currentCredit, 0);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [monthSales, monthPayments] = await Promise.all([
      Sale.find({ saleDate: { $gte: startOfMonth } }),
      PaymentTransaction.find({ paymentDate: { $gte: startOfMonth } }),
    ]);
    const monthBreakdown = calculateSalesBreakdown(monthSales, monthPayments);
    const cashInHand = monthBreakdown.totalCash;

    const totalAssets = inventory + accountsReceivable + cashInHand;

    const accountsPayable = 0;
    const totalLiabilities = accountsPayable;

    const equity = totalAssets - totalLiabilities;

    res.json({
      success: true,
      data: {
        assets: {
          currentAssets: {
            cashInHand,
            accountsReceivable,
            inventory
          },
          totalAssets
        },
        liabilities: {
          currentLiabilities: {
            accountsPayable
          },
          totalLiabilities
        },
        equity: {
          ownersEquity: equity
        },
        totalLiabilitiesAndEquity: totalLiabilities + equity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProductPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const sales = await Sale.find({
      saleDate: { $gte: start, $lte: end }
    });

    const productStats = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product ? item.product.toString() : 'unknown';
        
        if (!productStats[productId]) {
          productStats[productId] = {
            productId,
            productName: item.productName,
            quantitySold: 0,
            revenue: 0
          };
        }

        productStats[productId].quantitySold += item.quantity;
        productStats[productId].revenue += item.totalPrice;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        period: { start, end },
        topProducts,
        allProducts: Object.values(productStats)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCashFlowReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const [sales, payments] = await Promise.all([
      Sale.find({ saleDate: { $gte: start, $lte: end } }),
      PaymentTransaction.find({ paymentDate: { $gte: start, $lte: end } }),
    ]);

    const breakdown = calculateSalesBreakdown(sales, payments);
    const cashIn = breakdown.totalCash;
    const mpesaIn = breakdown.totalDigital;

    const restockMovements = await StockMovement.find({
      movementType: 'restock',
      createdAt: { $gte: start, $lte: end }
    }).populate('product');

    const cashOut = restockMovements.reduce((sum, movement) => {
      return sum + (movement.quantity * (movement.buyingPrice || 0));
    }, 0);

    const netCashFlow = (cashIn + mpesaIn) - cashOut;

    res.json({
      success: true,
      data: {
        period: { start, end },
        cashIn,
        mpesaIn,
        creditPaymentsCollected: breakdown.creditPaymentsCollected,
        creditIssued: breakdown.creditIssued,
        totalInflow: breakdown.totalCollected,
        cashOut,
        netCashFlow
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};