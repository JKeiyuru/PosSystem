// server/controllers/sale.controller.js - FIXED: Credit sales NOT counted as revenue

import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Customer from '../models/Customer.model.js';
import StockMovement from '../models/StockMovement.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import mongoose from 'mongoose';

export const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      saleDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('customer').populate('cashier', 'name');

    const payments = await PaymentTransaction.find({
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    console.log(`Found ${sales.length} sales and ${payments.length} payment transactions for the day`);

    // CRITICAL FIX: Only count CASH and M-PESA sales as revenue, NOT credit sales
    
    // 1. Cash sales (actual cash received today from direct sales)
    const cashSales = sales
      .filter(s => s.paymentMethod === 'cash' && s.paymentMethod !== 'credit')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    // 2. M-Pesa sales (actual M-Pesa received today from direct sales)
    const mpesaPaybill = sales
      .filter(s => s.paymentMethod === 'mpesa_paybill')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    const mpesaBeth = sales
      .filter(s => s.paymentMethod === 'mpesa_beth')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    const mpesaMartin = sales
      .filter(s => s.paymentMethod === 'mpesa_martin')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    const mpesaTill = sales
      .filter(s => s.paymentMethod === 'mpesa_till')
      .reduce((sum, s) => sum + s.amountPaid, 0);

    const gdcPaybill = sales
      .filter(s => s.paymentMethod === 'gdc_paybill')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    const totalMpesa = mpesaPaybill + mpesaBeth + mpesaMartin + mpesaTill + gdcPaybill;

    // 3. Cash from credit payments collected today (from previous credit sales)
    const cashFromCreditPayments = payments
      .filter(p => p.paymentMethod === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // 4. M-Pesa from credit payments collected today
    const mpesaFromCreditPayments = payments
      .filter(p => p.paymentMethod.includes('mpesa') || p.paymentMethod.includes('gdc'))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalCreditPayments = cashFromCreditPayments + mpesaFromCreditPayments;

    // 5. Total CASH received (for end of day reconciliation)
    const totalCash = cashSales + cashFromCreditPayments;

    // 6. Credit sales made TODAY (NOT counted as revenue - just for tracking)
    const creditSalesToday = sales
      .filter(s => s.paymentMethod === 'credit')
      .reduce((sum, s) => sum + s.total, 0);

    // TOTAL REVENUE = Cash + M-Pesa + Credit Payments (NOT including new credit sales)
    const totalRevenue = totalCash + totalMpesa + mpesaFromCreditPayments;

    console.log('Revenue Calculation:');
    console.log('  Cash Sales:', cashSales);
    console.log('  M-Pesa Sales:', totalMpesa);
    console.log('  Cash from Credit Payments:', cashFromCreditPayments);
    console.log('  M-Pesa from Credit Payments:', mpesaFromCreditPayments);
    console.log('  = TOTAL REVENUE:', totalRevenue);
    console.log('  Credit Sales Today (NOT revenue):', creditSalesToday);

    res.json({
      success: true,
      data: {
        sales,
        payments,
        summary: {
          // Today's actual revenue (money received)
          totalSales: totalRevenue,
          
          // Cash breakdown
          totalCash, // For end of day reconciliation
          cashSales, // From direct cash sales
          cashFromCreditPayments, // From credit collections
          
          // M-Pesa breakdown
          totalMpesa,
          totalMpesaPaybill: mpesaPaybill,
          totalMpesaBeth: mpesaBeth,
          totalMpesaMartin: mpesaMartin,
          totalMpesaTill: mpesaTill,
          totalGdcPaybill: gdcPaybill,
          mpesaFromCreditPayments,
          
          // Credit sales (NOT revenue yet)
          totalCredit: creditSalesToday,
          
          // Credit payments collected today
          creditPaymentsToday: totalCreditPayments,
          
          salesCount: sales.length,
          paymentsCount: payments.length
        }
      }
    });
  } catch (error) {
    console.error('Error in getDailySales:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export other functions...
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
    const total = subtotal - totalItemDiscounts + transportAmount;

    // Handle split payments
    let paidAmount = 0;
    let finalPaymentMethod = paymentMethod;
    let paymentBreakdown = null;

    if (splitPayments && splitPayments.length > 0) {
      paymentBreakdown = splitPayments.filter(p => p.amount && parseFloat(p.amount) > 0);
      paidAmount = paymentBreakdown.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      if (paymentBreakdown.length > 0) {
        const sortedPayments = [...paymentBreakdown].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        finalPaymentMethod = sortedPayments[0].method;
      }
    } else {
      paidAmount = parseFloat(amountPaid) || 0;
    }

    // CRITICAL FIX: For credit sales, amountPaid should be 0 unless partial payment
    if (finalPaymentMethod === 'credit' && paidAmount === 0) {
      paidAmount = 0; // Ensure no money counted today
    }

    let calculatedAmountDue = total - paidAmount;
    if (calculatedAmountDue < 0) calculatedAmountDue = 0;

    // Determine payment status
    let finalPaymentStatus;
    if (finalPaymentMethod === 'credit' && paidAmount === 0) {
      finalPaymentStatus = 'unpaid';
    } else if (paidAmount >= total) {
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
        
        // Check credit limit
        if (finalPaymentMethod === 'credit') {
          const newTotalCredit = customerDoc.currentCredit + calculatedAmountDue;
          if (newTotalCredit > customerDoc.creditLimit) {
            throw new Error(`Credit limit exceeded. Customer limit: ${formatCurrency(customerDoc.creditLimit)}, Current debt: ${formatCurrency(customerDoc.currentCredit)}, New sale: ${formatCurrency(calculatedAmountDue)}, Total would be: ${formatCurrency(newTotalCredit)}`);
          }
        }
      }
    } else if (finalPaymentMethod === 'credit') {
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
      splitPayments: paymentBreakdown,
      paymentStatus: finalPaymentStatus,
      amountPaid: paidAmount,
      amountDue: calculatedAmountDue,
      customer: customer || null,
      customerName,
      cashier: req.user.id,
      cashierName,
      notes: notes || '',
      isCreditPayment: false
    }], { session });

    // Update customer totals
    if (customerDoc) {
      customerDoc.totalPurchases += total;
      if (calculatedAmountDue > 0) {
        customerDoc.currentCredit += calculatedAmountDue;
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

// Helper function for currency formatting
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
}