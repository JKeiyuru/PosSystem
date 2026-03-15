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

// NEW: Get customer statement with running balance
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
    const end = endDate ? new Date(endDate) : new Date();
    // Set end to end of day
    end.setHours(23, 59, 59, 999);

    // Fetch sales in range
    const sales = await Sale.find({
      customer: customerId,
      saleDate: { $gte: start, $lte: end }
    }).sort({ saleDate: 1 });

    // Fetch payment transactions in range
    const payments = await PaymentTransaction.find({
      customer: customerId,
      paymentDate: { $gte: start, $lte: end }
    }).sort({ paymentDate: 1 });

    // Build chronological transaction list
    const allTxs = [
      ...sales.map((s) => ({
        type: 'sale',
        date: s.saleDate,
        reference: s.saleNumber,
        amount: s.total,
        detail: s.paymentMethod ? s.paymentMethod.replace(/_/g, ' ') : '',
        items: s.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
      })),
      ...payments.map((p) => ({
        type: 'payment',
        date: p.paymentDate || p.createdAt,
        reference: p.transactionNumber,
        amount: p.amount,
        detail: p.paymentMethod
          ? p.paymentMethod.replace(/_/g, ' ')
          : '',
        items: [],
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Compute running balance (sales add debt, payments reduce it)
    let runningBalance = 0;
    const transactions = allTxs.map((tx) => {
      if (tx.type === 'sale') {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
      return { ...tx, balance: runningBalance };
    });

    const finalBalance = runningBalance;

    // Aging analysis — based on unpaid sales across all time
    const now = new Date();
    const unpaidSales = await Sale.find({
      customer: customerId,
      amountDue: { $gt: 0 },
    });

    const aging = { above90: 0, days60to90: 0, days30to60: 0, days0to30: 0 };
    for (const sale of unpaidSales) {
      const daysDiff = Math.floor(
        (now - new Date(sale.saleDate)) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 90) aging.above90 += sale.amountDue;
      else if (daysDiff > 60) aging.days60to90 += sale.amountDue;
      else if (daysDiff > 30) aging.days30to60 += sale.amountDue;
      else aging.days0to30 += sale.amountDue;
    }

    res.json({
      success: true,
      data: {
        customer,
        transactions,
        finalBalance,
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