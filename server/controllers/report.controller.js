// server/controllers/report.controller.js

import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Customer from '../models/Customer.model.js';
import StockMovement from '../models/StockMovement.model.js';

export const getDailySalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      saleDate: { $gte: start, $lte: end }
    }).populate('customer').populate('cashier', 'name');

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCost = await calculateCostOfGoodsSold(sales);
    const grossProfit = totalRevenue - totalCost;

    const paymentBreakdown = {
      cash: sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
      mpesa: sales.filter(s => s.paymentMethod === 'mpesa').reduce((sum, s) => sum + s.total, 0),
      credit: sales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0)
    };

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalSales: sales.length,
          totalRevenue,
          totalCost,
          grossProfit,
          profitMargin: ((grossProfit / totalRevenue) * 100).toFixed(2) + '%'
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
    // Assets
    const products = await Product.find({ isActive: true });
    const inventory = products.reduce((sum, p) => sum + (p.quantity * p.buyingPrice), 0);
    
    // Receivables (customer credit)
    const customers = await Customer.find({ isActive: true });
    const accountsReceivable = customers.reduce((sum, c) => sum + c.currentCredit, 0);

    // Sales data for period
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const sales = await Sale.find({ saleDate: { $gte: startOfMonth } });
    const cashInHand = sales.filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.amountPaid, 0);

    const totalAssets = inventory + accountsReceivable + cashInHand;

    // Liabilities (for simplicity, we'll use accounts payable as 0 for now)
    const accountsPayable = 0;
    const totalLiabilities = accountsPayable;

    // Equity
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
        const productId = item.product.toString();
        
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

    const sales = await Sale.find({
      saleDate: { $gte: start, $lte: end }
    });

    const cashIn = sales.filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    const mpesaIn = sales.filter(s => s.paymentMethod === 'mpesa')
      .reduce((sum, s) => sum + s.amountPaid, 0);

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
        totalInflow: cashIn + mpesaIn,
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

// Helper function
async function calculateCostOfGoodsSold(sales) {
  let totalCost = 0;

  for (const sale of sales) {
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        totalCost += item.quantity * product.buyingPrice;
      }
    }
  }

  return totalCost;
}