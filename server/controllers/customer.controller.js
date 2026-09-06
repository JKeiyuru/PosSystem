// server/controllers/customer.controller.js
// UPDATED: Added getCustomerStatement for PDF generation

import Customer from '../models/Customer.model.js';
import Sale from '../models/Sale.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';

export const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ name: 1 });

    // SYNC CUSTOMER CREDIT WITH ACTUAL DEBT
    for (const customer of customers) {
      const actualDebt = await Sale.aggregate([
        {
          $match: {
            customer: customer._id,
            amountDue: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalDebt: { $sum: '$amountDue' }
          }
        }
      ]);

      const calculatedDebt = actualDebt.length > 0 ? actualDebt[0].totalDebt : 0;
      
      if (Math.abs(customer.currentCredit - calculatedDebt) > 0.01) {
        customer.currentCredit = calculatedDebt;
        await customer.save();
      }
    }

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const actualDebt = await Sale.aggregate([
      {
        $match: {
          customer: customer._id,
          amountDue: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: '$amountDue' }
        }
      }
    ]);

    const calculatedDebt = actualDebt.length > 0 ? actualDebt[0].totalDebt : 0;
    
    if (Math.abs(customer.currentCredit - calculatedDebt) > 0.01) {
      customer.currentCredit = calculatedDebt;
      await customer.save();
    }

    const sales = await Sale.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        customer,
        recentSales: sales
      }
    });
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomerSalesHistory = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, page = 1 } = req.query;
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const actualDebt = await Sale.aggregate([
      {
        $match: {
          customer: customer._id,
          amountDue: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: '$amountDue' }
        }
      }
    ]);

    const calculatedDebt = actualDebt.length > 0 ? actualDebt[0].totalDebt : 0;
    
    if (Math.abs(customer.currentCredit - calculatedDebt) > 0.01) {
      customer.currentCredit = calculatedDebt;
      await customer.save();
    }

    let query = { customer: customerId };

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, payments, totalSales] = await Promise.all([
      Sale.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .populate('cashier', 'name'),
      PaymentTransaction.find({ customer: customerId })
        .sort({ createdAt: -1 }),
      Sale.countDocuments(query)
    ]);

    const totalPurchased = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPaid = sales.reduce((sum, sale) => sum + sale.amountPaid, 0);
    const creditPayments = payments.reduce((sum, pmt) => sum + pmt.amount, 0);

    res.json({
      success: true,
      data: {
        customer,
        sales,
        payments,
        statistics: {
          totalSales: totalSales,
          totalPurchased,
          totalPaid,
          creditPayments,
          currentCredit: customer.currentCredit,
          totalPurchases: customer.totalPurchases
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalSales / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error in getCustomerSalesHistory:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Proper A/R statement for a selected period:
// opening balance + period transactions (debits/credits) = closing balance.
export const getCustomerStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const start = startDate ? new Date(startDate) : new Date(0);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    // amountPaidAtSale = deposit taken when the sale was made.
    // Older records may not have it; fall back to (amountPaid - later payments).
    const paidAtSale = (sale, laterPaymentsForSale) => {
      if (sale.amountPaidAtSale !== undefined && sale.amountPaidAtSale !== null) {
        return round2(sale.amountPaidAtSale);
      }
      return Math.max(0, round2((sale.amountPaid || 0) - laterPaymentsForSale));
    };

    const [allSales, allPayments] = await Promise.all([
      Sale.find({ customer: customerId, saleDate: { $lte: end } }).sort({ saleDate: 1 }),
      PaymentTransaction.find({ customer: customerId }).sort({ paymentDate: 1 }),
    ]);

    // How much each sale received through debt-repayment transactions.
    const appliedBySale = {};
    for (const payment of allPayments) {
      for (const applied of payment.sales || []) {
        if (!applied?.sale) continue;
        const key = applied.sale.toString();
        appliedBySale[key] = (appliedBySale[key] || 0) + (applied.amountApplied || 0);
      }
    }

    // ── OPENING BALANCE (everything before the period) ──────────────
    let openingBalance = 0;
    for (const sale of allSales) {
      if (new Date(sale.saleDate) >= start) continue;
      openingBalance += round2(sale.total) - paidAtSale(sale, appliedBySale[sale._id.toString()] || 0);
    }
    for (const payment of allPayments) {
      const date = new Date(payment.paymentDate || payment.createdAt);
      if (date < start) openingBalance -= round2(payment.amount);
    }
    openingBalance = round2(openingBalance);

    // ── PERIOD TRANSACTIONS ─────────────────────────────────────────
    const entries = [];

    for (const sale of allSales) {
      const saleDate = new Date(sale.saleDate);
      if (saleDate < start || saleDate > end) continue;

      entries.push({
        type: 'sale',
        date: sale.saleDate,
        reference: sale.saleNumber,
        description: `Sale invoice ${sale.saleNumber}`,
        debit: round2(sale.total),
        credit: 0,
        amount: round2(sale.total),
        detail: (sale.paymentMethod || '').replace(/_/g, ' '),
        items: (sale.items || []).map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
      });

      const deposit = paidAtSale(sale, appliedBySale[sale._id.toString()] || 0);
      if (deposit > 0) {
        const methods = (sale.splitPayments || [])
          .filter((p) => p.method !== 'credit' && p.amount > 0)
          .map((p) => p.method.replace(/_/g, ' '))
          .join(', ');
        entries.push({
          type: 'payment',
          date: sale.saleDate,
          reference: sale.saleNumber,
          description: `Payment on sale ${sale.saleNumber}`,
          debit: 0,
          credit: deposit,
          amount: deposit,
          detail: methods || (sale.paymentMethod || '').replace(/_/g, ' '),
          items: [],
        });
      }
    }

    for (const payment of allPayments) {
      const date = new Date(payment.paymentDate || payment.createdAt);
      if (date < start || date > end) continue;
      entries.push({
        type: 'payment',
        date,
        reference: payment.transactionNumber,
        description: `Debt payment ${payment.transactionNumber}`,
        debit: 0,
        credit: round2(payment.amount),
        amount: round2(payment.amount),
        detail: (payment.paymentMethod || '').replace(/_/g, ' '),
        items: [],
      });
    }

    entries.sort((a, b) => {
      const diff = new Date(a.date) - new Date(b.date);
      if (diff !== 0) return diff;
      // A sale always comes before the payment made against it.
      return a.type === 'sale' ? -1 : 1;
    });

    let runningBalance = openingBalance;
    let totalDebits = 0;
    let totalCredits = 0;

    const transactions = entries.map((tx) => {
      runningBalance = round2(runningBalance + tx.debit - tx.credit);
      totalDebits = round2(totalDebits + tx.debit);
      totalCredits = round2(totalCredits + tx.credit);
      return { ...tx, balance: runningBalance };
    });

    const closingBalance = round2(runningBalance);

    // ── AGING (unpaid sales as at the statement end date) ───────────
    const aging = { above90: 0, days60to90: 0, days30to60: 0, days0to30: 0 };
    for (const sale of allSales) {
      const outstanding = round2(sale.amountDue);
      if (outstanding <= 0) continue;
      const daysDiff = Math.floor((end - new Date(sale.saleDate)) / (1000 * 60 * 60 * 24));
      if (daysDiff > 90) aging.above90 += outstanding;
      else if (daysDiff > 60) aging.days60to90 += outstanding;
      else if (daysDiff > 30) aging.days30to60 += outstanding;
      else aging.days0to30 += outstanding;
    }
    Object.keys(aging).forEach((k) => {
      aging[k] = round2(aging[k]);
    });

    res.json({
      success: true,
      data: {
        customer,
        period: { startDate: start, endDate: end },
        openingBalance,
        transactions,
        totals: {
          debits: totalDebits,
          credits: totalCredits,
          openingBalance,
          closingBalance,
        },
        closingBalance,
        finalBalance: closingBalance, // backwards compatible
        currentCredit: round2(customer.currentCredit),
        aging,
      },
    });
  } catch (error) {
    console.error('Error in getCustomerStatement:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error in createCustomer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomersWithCredit = async (req, res) => {
  try {
    const customers = await Customer.find({
      isActive: true,
      currentCredit: { $gt: 0 }
    }).sort({ currentCredit: -1 });

    for (const customer of customers) {
      const actualDebt = await Sale.aggregate([
        {
          $match: {
            customer: customer._id,
            amountDue: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalDebt: { $sum: '$amountDue' }
          }
        }
      ]);

      const calculatedDebt = actualDebt.length > 0 ? actualDebt[0].totalDebt : 0;
      
      if (Math.abs(customer.currentCredit - calculatedDebt) > 0.01) {
        customer.currentCredit = calculatedDebt;
        await customer.save();
      }
    }

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error in getCustomersWithCredit:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const syncAllCustomerCredits = async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true });
    let syncCount = 0;
    let errorCount = 0;
    const updates = [];

    for (const customer of customers) {
      try {
        const actualDebt = await Sale.aggregate([
          {
            $match: {
              customer: customer._id,
              amountDue: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalDebt: { $sum: '$amountDue' }
            }
          }
        ]);

        const calculatedDebt = actualDebt.length > 0 ? actualDebt[0].totalDebt : 0;
        const roundedDebt = Math.round(calculatedDebt * 100) / 100;
        const currentCredit = Math.round(customer.currentCredit * 100) / 100;
        
        if (Math.abs(currentCredit - roundedDebt) > 0.01) {
          updates.push({
            name: customer.name,
            oldCredit: currentCredit,
            newCredit: roundedDebt,
          });
          customer.currentCredit = roundedDebt;
          await customer.save();
          syncCount++;
        }
      } catch (error) {
        console.error(`Error syncing ${customer.name}:`, error.message);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: 'Customer credits synchronized successfully',
      data: {
        totalCustomers: customers.length,
        updated: syncCount,
        errors: errorCount,
        updates
      }
    });
  } catch (error) {
    console.error('Error in syncAllCustomerCredits:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};