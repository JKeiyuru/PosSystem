// server/controllers/customer.controller.js - UPDATED with credit sync

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
      // Calculate actual debt from sales
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
      
      // Update if there's a mismatch
      if (Math.abs(customer.currentCredit - calculatedDebt) > 0.01) {
        console.log(`Syncing credit for ${customer.name}: ${customer.currentCredit} -> ${calculatedDebt}`);
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

    // Sync credit
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
      console.log(`Syncing credit for ${customer.name}: ${customer.currentCredit} -> ${calculatedDebt}`);
      customer.currentCredit = calculatedDebt;
      await customer.save();
    }

    // Get customer sales history
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

    // Sync credit
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

    // Calculate statistics
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

    // Sync credit for all customers with debt
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
