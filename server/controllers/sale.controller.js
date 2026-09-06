// server/controllers/sale.controller.js
// Revenue calculations now go through utils/salesCalculations.js so that every
// screen (dashboard, daily report, reports, email) agrees on the numbers.

import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Customer from '../models/Customer.model.js';
import StockMovement from '../models/StockMovement.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import mongoose from 'mongoose';
import {
  calculateSalesBreakdown,
  getDayRange,
  formatCurrency,
  round2,
} from '../utils/salesCalculations.js';

export const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const { start: startOfDay, end: endOfDay } = getDayRange(date ? new Date(date) : new Date());

    const [sales, creditPayments] = await Promise.all([
      Sale.find({ saleDate: { $gte: startOfDay, $lte: endOfDay } })
        .populate('customer')
        .populate('cashier', 'name'),
      PaymentTransaction.find({ paymentDate: { $gte: startOfDay, $lte: endOfDay } }),
    ]);

    const breakdown = calculateSalesBreakdown(sales, creditPayments);

    res.json({
      success: true,
      data: {
        sales,
        payments: creditPayments,
        summary: {
          // Money actually received today (cash + digital + debt repayments)
          totalSales: breakdown.totalCollected,
          totalCollected: breakdown.totalCollected,

          // Everything sold today, credit included (turnover)
          grossSalesValue: breakdown.grossSalesValue,

          // Cash / digital detail
          cashSales: breakdown.saleCashCollected,
          totalMpesa: breakdown.saleDigitalCollected,
          totalMpesaPaybill: breakdown.totalMpesaPaybill,
          totalMpesaBeth: breakdown.totalMpesaBeth,
          totalMpesaMartin: breakdown.totalMpesaMartin,
          totalMpesaTill: breakdown.totalMpesaTill,
          totalGdcPaybill: breakdown.totalGdcPaybill,
          methodTotals: breakdown.methodTotals,

          // Credit given today (new debt, NOT revenue)
          totalCredit: breakdown.creditIssued,
          creditIssued: breakdown.creditIssued,

          // Debt repayments collected today (IS revenue)
          creditPaymentsToday: breakdown.creditPaymentsCollected,
          creditPaymentsCash: breakdown.creditPaymentsCash,
          creditPaymentsMpesa: breakdown.creditPaymentsDigital,

          // Profitability
          totalCost: breakdown.totalCost,
          grossProfit: breakdown.grossProfit,

          // Counts
          salesCount: breakdown.salesCount,
          paymentsCount: breakdown.paymentsCount,

          // Reconciliation
          totalCash: breakdown.totalCash,
          totalDigital: breakdown.totalDigital,
        },
      },
    });
  } catch (error) {
    console.error('Error in getDailySales:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod, splitPayments, paymentStatus, amountPaid, customer, notes, transport } = req.body;

    if (!items || items.length === 0) {
      throw new Error('Sale must have at least one item');
    }

    let subtotal = 0;
    let totalItemDiscounts = 0;
    const saleItems = [];

    // Process each item
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }

      let unitPrice, unit, baseUnitQuantity;
      
      // Handle sub-units
      if (item.unit && item.unit !== product.baseUnit) {
        const subUnit = product.subUnits.find(su => su.name === item.unit);
        
        if (!subUnit) {
          throw new Error(`Unit ${item.unit} not available for ${product.name}`);
        }

        unitPrice = subUnit.pricePerUnit;
        unit = item.unit;
        baseUnitQuantity = product.convertToBaseUnit(item.unit, item.quantity);
        
        if (!product.hasEnoughStock(item.unit, item.quantity)) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${Math.floor(product.quantity * subUnit.conversionRate)} ${unit}`);
        }

        if (unit !== product.baseUnit) {
          product.openedBags += Math.ceil(baseUnitQuantity);
        }
      } else {
        unitPrice = product.sellingPrice;
        unit = product.baseUnit;
        baseUnitQuantity = item.quantity;
        
        if (product.quantity < baseUnitQuantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity} ${unit}`);
        }
      }

      // Calculate item totals with discount
      const itemDiscount = parseFloat(item.discount) || 0;
      const itemSubtotal = unitPrice * item.quantity;
      const totalPrice = itemSubtotal - itemDiscount;
      
      subtotal += itemSubtotal;
      totalItemDiscounts += itemDiscount;

      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unit,
        unitPrice,
        discount: itemDiscount,
        totalPrice,
        baseUnitQuantity,
        buyingPrice: product.buyingPrice
      });

      // Update product stock
      product.quantity -= baseUnitQuantity;
      
      if (product.openedBags > Math.ceil(product.quantity)) {
        product.openedBags = Math.ceil(product.quantity);
      }
      
      await product.save({ session });

      // Record stock movement
      await StockMovement.create([{
        product: product._id,
        movementType: 'sale',
        quantity: -baseUnitQuantity,
        previousQuantity: product.quantity + baseUnitQuantity,
        newQuantity: product.quantity,
        reference: `Sold ${item.quantity} ${unit}`,
        performedBy: req.user.id
      }], { session });
    }

    // Calculate final totals
    const transportAmount = parseFloat(transport) || 0;
    const total = round2(subtotal - totalItemDiscounts + transportAmount);

    // ── PAYMENT NORMALISATION ─────────────────────────────────────────
    // Every sale ends up with an explicit splitPayments array. Any line with
    // method === 'credit' is DEBT, never money received. This is what makes
    // the daily totals and the customer's debt correct.
    let paymentLines = [];

    if (Array.isArray(splitPayments) && splitPayments.length > 0) {
      paymentLines = splitPayments
        .filter((p) => p && p.method && parseFloat(p.amount) > 0)
        .map((p) => ({ method: p.method, amount: round2(p.amount) }));
    } else if (paymentMethod) {
      const declared = round2(amountPaid);
      const amount = paymentMethod === 'credit' ? total : declared > 0 ? declared : total;
      paymentLines = [{ method: paymentMethod, amount }];
    }

    // Money actually received now (credit lines excluded).
    const paidAmount = round2(
      paymentLines
        .filter((p) => p.method !== 'credit')
        .reduce((sum, p) => sum + p.amount, 0)
    );

    // Anything not paid now is credit, whatever the client sent.
    let calculatedAmountDue = round2(total - paidAmount);
    if (calculatedAmountDue < 0.01) calculatedAmountDue = 0;

    // Keep the credit line consistent with the real outstanding amount.
    paymentLines = paymentLines.filter((p) => p.method !== 'credit');
    if (calculatedAmountDue > 0) {
      paymentLines.push({ method: 'credit', amount: calculatedAmountDue });
    }

    // Primary method = largest non-credit line, else 'credit'.
    const nonCreditLines = paymentLines.filter((p) => p.method !== 'credit');
    let finalPaymentMethod;
    if (nonCreditLines.length > 0) {
      finalPaymentMethod = [...nonCreditLines].sort((a, b) => b.amount - a.amount)[0].method;
    } else {
      finalPaymentMethod = 'credit';
    }

    // Determine payment status
    let finalPaymentStatus;
    if (calculatedAmountDue <= 0) {
      finalPaymentStatus = 'paid';
    } else if (paidAmount > 0) {
      finalPaymentStatus = 'partial';
    } else {
      finalPaymentStatus = 'unpaid';
    }

    // Get cashier and customer info
    const cashierName = req.user.name;
    let customerName = null;
    let customerDoc = null;

    if (customer) {
      customerDoc = await Customer.findById(customer).session(session);
      if (customerDoc) {
        customerName = customerDoc.name;

        // Check credit limit whenever debt is being created.
        // A credit limit of 0 means "no limit set".
        if (calculatedAmountDue > 0 && customerDoc.creditLimit > 0) {
          const newTotalCredit = round2(customerDoc.currentCredit + calculatedAmountDue);
          if (newTotalCredit > customerDoc.creditLimit) {
            throw new Error(
              `Credit limit exceeded. Customer limit: ${formatCurrency(customerDoc.creditLimit)}, ` +
              `Current debt: ${formatCurrency(customerDoc.currentCredit)}, ` +
              `New credit: ${formatCurrency(calculatedAmountDue)}, ` +
              `Total would be: ${formatCurrency(newTotalCredit)}`
            );
          }
        }
      }
    } else if (calculatedAmountDue > 0) {
      throw new Error('Credit sales require a customer to be selected');
    }

    // Create sale
    const sale = await Sale.create([{
      items: saleItems,
      subtotal,
      discount: totalItemDiscounts,
      transport: transportAmount,
      total,
      paymentMethod: finalPaymentMethod,
      splitPayments: paymentLines,
      paymentStatus: finalPaymentStatus,
      amountPaid: paidAmount,
      amountPaidAtSale: paidAmount,
      amountDue: calculatedAmountDue,
      customer: customer || null,
      customerName,
      cashier: req.user.id,
      cashierName,
      notes: notes || '',
      isCreditPayment: false
    }], { session });

    // Update customer totals — credit ALWAYS accumulates onto existing debt.
    if (customerDoc) {
      customerDoc.totalPurchases = round2(customerDoc.totalPurchases + total);
      if (calculatedAmountDue > 0) {
        customerDoc.currentCredit = round2(customerDoc.currentCredit + calculatedAmountDue);
      }
      await customerDoc.save({ session });
    }


    await session.commitTransaction();

    // Return populated sale
    const populatedSale = await Sale.findById(sale[0]._id)
      .populate('items.product')
      .populate('customer')
      .populate('cashier');

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: populatedSale
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

export const updateSalePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amountPaid, paymentMethod } = req.body;
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    const payment = parseFloat(amountPaid);
    
    // Create payment transaction
    const paymentTransaction = await PaymentTransaction.create([{
      customer: sale.customer,
      customerName: sale.customerName,
      amount: payment,
      paymentMethod: paymentMethod || 'cash',
      sales: [{
        sale: sale._id,
        amountApplied: payment
      }],
      receivedBy: req.user.id,
      receivedByName: req.user.name,
      notes: `Payment for sale ${sale.saleNumber}`
    }], { session });

    // Update sale
    sale.amountPaid += payment;
    sale.amountDue = Math.max(0, sale.total - sale.amountPaid);
    
    if (sale.amountDue <= 0) {
      sale.paymentStatus = 'paid';
      sale.amountDue = 0;
    } else if (sale.amountPaid > 0) {
      sale.paymentStatus = 'partial';
    }

    await sale.save({ session });

    // Update customer credit
    if (sale.customer) {
      const customer = await Customer.findById(sale.customer).session(session);
      if (customer) {
        customer.currentCredit = Math.max(0, customer.currentCredit - payment);
        await customer.save({ session });
      }
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: {
        sale,
        transaction: paymentTransaction[0]
      }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

export const getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, paymentStatus, customer } = req.query;
    
    let query = {};

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (paymentStatus) {
      if (paymentStatus.includes(',')) {
        query.paymentStatus = { $in: paymentStatus.split(',') };
      } else {
        query.paymentStatus = paymentStatus;
      }
    }
    if (customer) query.customer = customer;

    const sales = await Sale.find(query)
      .populate('customer')
      .populate('cashier', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product')
      .populate('customer')
      .populate('cashier', 'name email');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;
    
    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.saleDate = {};
      if (startDate) matchQuery.saleDate.$gte = new Date(startDate);
      if (endDate) matchQuery.saleDate.$lte = new Date(endDate);
    }

    const topProducts = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTopCustomers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;
    
    let matchQuery = { customer: { $ne: null } };
    if (startDate || endDate) {
      matchQuery.saleDate = {};
      if (startDate) matchQuery.saleDate.$gte = new Date(startDate);
      if (endDate) matchQuery.saleDate.$lte = new Date(endDate);
    }

    const topCustomers = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$customer',
          customerName: { $first: '$customerName' },
          totalPurchases: { $sum: '$total' },
          totalPaid: { $sum: '$amountPaid' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalPurchases: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Restore stock for all items
    for (const item of sale.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.quantity += item.baseUnitQuantity || item.quantity;
        await product.save({ session });

        // Record stock movement
        await StockMovement.create([{
          product: product._id,
          movementType: 'adjustment',
          quantity: item.baseUnitQuantity || item.quantity,
          previousQuantity: product.quantity - (item.baseUnitQuantity || item.quantity),
          newQuantity: product.quantity,
          notes: `Sale ${sale.saleNumber} deleted`,
          performedBy: req.user.id
        }], { session });
      }
    }

    // Update customer totals
    if (sale.customer) {
      const customer = await Customer.findById(sale.customer).session(session);
      if (customer) {
        customer.totalPurchases = Math.max(0, customer.totalPurchases - sale.total);
        customer.currentCredit = Math.max(0, customer.currentCredit - sale.amountDue);
        await customer.save({ session });
      }
    }

    await Sale.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};
