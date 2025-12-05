// server/controllers/debt.controller.js - COMPLETELY FIXED

import Sale from '../models/Sale.model.js';
import Customer from '../models/Customer.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import mongoose from 'mongoose';

export const getAllDebts = async (req, res) => {
  try {
    const { search, startDate, endDate } = req.query;

    // Build match query for sales
    let matchQuery = {
      paymentStatus: { $in: ['unpaid', 'partial'] },
      amountDue: { $gt: 0 },
      customer: { $ne: null } // IMPORTANT: Only include sales with customers
    };

    if (startDate || endDate) {
      matchQuery.saleDate = {};
      if (startDate) matchQuery.saleDate.$gte = new Date(startDate);
      if (endDate) matchQuery.saleDate.$lte = new Date(endDate);
    }

    // Aggregate debts by customer
    const debts = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$customer',
          customerName: { $first: '$customerName' },
          totalDebt: { $sum: '$amountDue' },
          numberOfSales: { $sum: 1 },
          oldestDebtDate: { $min: '$saleDate' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: {
          path: '$customerInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          customerId: '$_id', // This is the ACTUAL customer ObjectId
          customerName: 1,
          customerPhone: '$customerInfo.phone',
          totalDebt: 1,
          numberOfSales: 1,
          oldestDebtDate: 1,
          creditLimit: '$customerInfo.creditLimit'
        }
      },
      { $sort: { totalDebt: -1 } }
    ]);

    // Filter out any debts without customer IDs
    const validDebts = debts.filter(debt => debt.customerId);

    // Apply search filter if provided
    let filteredDebts = validDebts;
    if (search) {
      filteredDebts = validDebts.filter(debt =>
        debt.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        debt.customerPhone?.includes(search)
      );
    }

    console.log(`Found ${filteredDebts.length} debts with valid customer IDs`);

    res.json({
      success: true,
      data: filteredDebts
    });
  } catch (error) {
    console.error('Error in getAllDebts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getTodayDebtPayments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get payment transactions for today
    const todayPayments = await PaymentTransaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
          payments: { 
            $push: {
              customer: '$customerName',
              amount: '$amount',
              method: '$paymentMethod',
              date: '$createdAt'
            }
          }
        }
      }
    ]);

    const result = todayPayments.length > 0 ? todayPayments[0] : {
      totalPayments: 0,
      paymentCount: 0,
      payments: []
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getTodayDebtPayments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const recordDebtPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerId, amount, paymentMethod } = req.body;

    console.log('Recording payment:', { customerId, amount, paymentMethod });

    // Validate inputs
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Validate customer ID format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error('Invalid customer ID format');
    }

    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      throw new Error('Customer not found');
    }

    console.log('Customer found:', customer.name, 'Current credit:', customer.currentCredit);

    // Use a small epsilon for floating point comparison
    const epsilon = 0.01;
    if (amount > customer.currentCredit + epsilon) {
      throw new Error(`Payment amount (${amount.toFixed(2)}) exceeds customer debt (${customer.currentCredit.toFixed(2)})`);
    }

    // Get all unpaid/partial sales for this customer, sorted by date (oldest first)
    const unpaidSales = await Sale.find({
      customer: customerId,
      amountDue: { $gt: 0 }
    }).sort({ saleDate: 1 }).session(session);

    console.log(`Found ${unpaidSales.length} unpaid sales for customer`);

    let remainingPayment = amount;
    const updatedSales = [];

    // Apply payment to sales starting from oldest
    for (const sale of unpaidSales) {
      if (remainingPayment <= 0) break;

      const paymentForThisSale = Math.min(remainingPayment, sale.amountDue);
      
      sale.amountPaid += paymentForThisSale;
      sale.amountDue -= paymentForThisSale;
      
      // Round to avoid floating point issues
      sale.amountDue = Math.max(0, Math.round(sale.amountDue * 100) / 100);
      
      if (sale.amountDue <= 0) {
        sale.paymentStatus = 'paid';
        sale.amountDue = 0;
      } else {
        sale.paymentStatus = 'partial';
      }

      await sale.save({ session });
      updatedSales.push({
        sale: sale._id,
        amountApplied: paymentForThisSale
      });

      remainingPayment -= paymentForThisSale;
    }

    // Create payment transaction
    const paymentTransaction = await PaymentTransaction.create([{
      customer: customerId,
      customerName: customer.name,
      amount,
      paymentMethod,
      sales: updatedSales,
      receivedBy: req.user.id,
      receivedByName: req.user.name,
      notes: `Debt payment for ${customer.name}`
    }], { session });

    // Update customer credit - round to avoid floating point issues
    const newCredit = Math.max(0, Math.round((customer.currentCredit - amount) * 100) / 100);
    console.log('Updating customer credit from', customer.currentCredit, 'to', newCredit);
    
    customer.currentCredit = newCredit;
    await customer.save({ session });

    await session.commitTransaction();

    console.log('Payment recorded successfully');

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        transaction: paymentTransaction[0],
        updatedSales: updatedSales.length,
        remainingDebt: customer.currentCredit
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in recordDebtPayment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

export const deleteDebt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerId = req.params.customerId;

    console.log('Deleting debt for customer:', customerId);

    // Validate customer ID
    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error('Invalid customer ID');
    }

    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      throw new Error('Customer not found');
    }

    console.log('Clearing debt for customer:', customer.name);

    // Find all unpaid/partial sales for this customer
    const unpaidSales = await Sale.find({
      customer: customerId,
      amountDue: { $gt: 0 }
    }).session(session);

    console.log(`Found ${unpaidSales.length} unpaid sales to clear`);

    // Update all unpaid sales to paid status
    for (const sale of unpaidSales) {
      sale.amountPaid = sale.total;
      sale.amountDue = 0;
      sale.paymentStatus = 'paid';
      await sale.save({ session });
    }

    // Clear customer credit
    const previousCredit = customer.currentCredit;
    customer.currentCredit = 0;
    await customer.save({ session });

    await session.commitTransaction();

    console.log(`Successfully cleared ${formatCurrency(previousCredit)} debt for ${customer.name}`);

    res.json({
      success: true,
      message: 'Debt cleared successfully',
      data: {
        customerId: customer._id,
        customerName: customer.name,
        salesCleared: unpaidSales.length,
        amountCleared: previousCredit
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in deleteDebt:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

export const generateDebtReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {
      paymentStatus: { $in: ['unpaid', 'partial'] },
      amountDue: { $gt: 0 },
      customer: { $ne: null }
    };

    if (startDate || endDate) {
      matchQuery.saleDate = {};
      if (startDate) matchQuery.saleDate.$gte = new Date(startDate);
      if (endDate) matchQuery.saleDate.$lte = new Date(endDate);
    }

    // Get all debts
    const debts = await Sale.find(matchQuery)
      .populate('customer')
      .sort({ saleDate: 1 });

    // Aggregate by customer
    const customerDebts = {};
    let totalDebt = 0;
    let totalCreditSales = 0;

    debts.forEach(sale => {
      totalDebt += sale.amountDue;
      totalCreditSales++;

      if (sale.customer) {
        const customerId = sale.customer._id.toString();
        if (!customerDebts[customerId]) {
          customerDebts[customerId] = {
            name: sale.customerName,
            debt: 0,
            salesCount: 0,
            oldestDate: sale.saleDate
          };
        }
        customerDebts[customerId].debt += sale.amountDue;
        customerDebts[customerId].salesCount++;
        
        if (sale.saleDate < customerDebts[customerId].oldestDate) {
          customerDebts[customerId].oldestDate = sale.saleDate;
        }
      }
    });

    // Convert to array and calculate days outstanding
    const customerArray = Object.values(customerDebts).map(customer => ({
      ...customer,
      daysOutstanding: Math.floor((new Date() - new Date(customer.oldestDate)) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => b.debt - a.debt);

    res.json({
      success: true,
      data: {
        startDate,
        endDate,
        summary: {
          totalCustomers: customerArray.length,
          totalDebt,
          totalCreditSales
        },
        customers: customerArray,
        detailedSales: debts
      }
    });
  } catch (error) {
    console.error('Error in generateDebtReport:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function for formatting currency (for logging)
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
}
