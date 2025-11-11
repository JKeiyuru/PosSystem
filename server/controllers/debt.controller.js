// server/controllers/debt.controller.js

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
      amountDue: { $gt: 0 }
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
          customerId: '$_id',
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

    // Apply search filter if provided
    let filteredDebts = debts;
    if (search) {
      filteredDebts = debts.filter(debt =>
        debt.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        debt.customerPhone?.includes(search)
      );
    }

    res.json({
      success: true,
      data: filteredDebts
    });
  } catch (error) {
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

    if (!customerId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment data'
      });
    }

    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (amount > customer.currentCredit) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds customer debt'
      });
    }

    // Get all unpaid/partial sales for this customer, sorted by date (oldest first)
    const unpaidSales = await Sale.find({
      customer: customerId,
      amountDue: { $gt: 0 }
    }).sort({ saleDate: 1 }).session(session);

    let remainingPayment = amount;
    const updatedSales = [];

    // Apply payment to sales starting from oldest
    for (const sale of unpaidSales) {
      if (remainingPayment <= 0) break;

      const paymentForThisSale = Math.min(remainingPayment, sale.amountDue);
      
      sale.amountPaid += paymentForThisSale;
      sale.amountDue -= paymentForThisSale;
      
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

    // Update customer credit
    customer.currentCredit = Math.max(0, customer.currentCredit - amount);
    await customer.save({ session });

    await session.commitTransaction();

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
    res.status(500).json({
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
      amountDue: { $gt: 0 }
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};