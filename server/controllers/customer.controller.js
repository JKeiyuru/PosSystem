// server/controllers/customer.controller.js

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

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
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

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};