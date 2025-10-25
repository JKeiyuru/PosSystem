// server/controllers/invoice.controller.js

import Invoice from '../models/Invoice.model.js';
import Sale from '../models/Sale.model.js';

export const createInvoice = async (req, res) => {
  try {
    const { type, customer, items, subtotal, tax, total, dueDate, notes, sale } = req.body;

    const invoice = await Invoice.create({
      type,
      customer,
      items,
      subtotal,
      tax,
      total,
      dueDate,
      notes,
      sale,
      createdBy: req.user.id
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const { type, status, customerId } = req.query;
    
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (customerId) query.customer = customerId;

    const invoices = await Invoice.find(query)
      .populate('customer')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('sale')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paidDate } = req.body;
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status, ...(paidDate && { paidDate }) },
      { new: true }
    ).populate('customer');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createInvoiceFromSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    
    const sale = await Sale.findById(saleId).populate('customer');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    if (!sale.customer) {
      return res.status(400).json({
        success: false,
        message: 'Sale must have a customer to generate invoice'
      });
    }

    const items = sale.items.map(item => ({
      description: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));

    const invoice = await Invoice.create({
      type: 'invoice',
      customer: sale.customer._id,
      sale: sale._id,
      items,
      subtotal: sale.subtotal,
      tax: sale.tax,
      total: sale.total,
      createdBy: req.user.id
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Invoice created from sale successfully',
      data: populatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};