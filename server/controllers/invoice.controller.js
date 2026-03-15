// server/controllers/invoice.controller.js
// UPDATED: Added deleteInvoice and editInvoice (admin only)

import Invoice from '../models/Invoice.model.js';
import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Customer from '../models/Customer.model.js';
import StockMovement from '../models/StockMovement.model.js';
import ReceivingInvoice from '../models/ReceivingInvoice.model.js';
import mongoose from 'mongoose';

export const createInvoice = async (req, res) => {
  try {
    const { type, customer, items, subtotal, tax, total, dueDate, notes, sale } = req.body;

    const invoice = await Invoice.create({
      type, customer, items, subtotal, tax, total, dueDate, notes, sale,
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
    res.status(500).json({ success: false, message: error.message });
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

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('sale')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, message: 'Invoice status updated successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Delete receiving invoice and reverse stock
export const deleteReceivingInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await ReceivingInvoice.findById(req.params.id).session(session);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Reverse stock additions for each item
    for (const item of invoice.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        const previousQuantity = product.quantity;
        product.quantity = Math.max(0, product.quantity - item.quantity);
        await product.save({ session });

        await StockMovement.create([{
          product: product._id,
          movementType: 'adjustment',
          quantity: -item.quantity,
          previousQuantity,
          newQuantity: product.quantity,
          reference: `Invoice deleted: ${invoice.invoiceNumber}`,
          performedBy: req.user.id
        }], { session });
      }
    }

    await ReceivingInvoice.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Invoice deleted successfully. Stock has been reversed.'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// NEW: Edit receiving invoice and adjust stock accordingly
export const editReceivingInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await ReceivingInvoice.findById(req.params.id).session(session);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const {
      invoiceNumber,
      date,
      supplier,
      items,
      actualInvoiceAmount,
      varianceReason,
      paymentStatus,
      notes
    } = req.body;

    // Reverse all original stock additions
    for (const oldItem of invoice.items) {
      const product = await Product.findById(oldItem.product).session(session);
      if (product) {
        product.quantity = Math.max(0, product.quantity - oldItem.quantity);
        await product.save({ session });
      }
    }

    // Apply new stock additions
    const processedItems = [];
    for (const newItem of items) {
      const product = await Product.findById(newItem.productId || newItem.product).session(session);
      if (!product) {
        throw new Error(`Product not found: ${newItem.productId || newItem.product}`);
      }

      const previousBuyingPrice = product.buyingPrice;
      const newBuyingPrice = parseFloat(newItem.buyingPrice);
      const priceChanged = Math.abs(newBuyingPrice - previousBuyingPrice) > 0.01;

      product.quantity += parseFloat(newItem.quantity);
      product.buyingPrice = newBuyingPrice;
      await product.save({ session });

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: parseFloat(newItem.quantity),
        buyingPrice: newBuyingPrice,
        previousBuyingPrice,
        priceChanged,
        itemTotal: parseFloat(newItem.quantity) * newBuyingPrice
      });
    }

    const calculatedTotal = processedItems.reduce((sum, i) => sum + i.itemTotal, 0);
    const variance = parseFloat(actualInvoiceAmount) - calculatedTotal;

    invoice.invoiceNumber = invoiceNumber || invoice.invoiceNumber;
    invoice.date = date || invoice.date;
    invoice.supplier = supplier || invoice.supplier;
    invoice.items = processedItems;
    invoice.calculatedTotal = calculatedTotal;
    invoice.actualInvoiceAmount = parseFloat(actualInvoiceAmount);
    invoice.variance = variance;
    invoice.varianceReason = Math.abs(variance) > 0.01 ? varianceReason : null;
    invoice.paymentStatus = paymentStatus || invoice.paymentStatus;
    invoice.notes = notes || invoice.notes;

    await invoice.save({ session });
    await session.commitTransaction();

    const populated = await ReceivingInvoice.findById(invoice._id)
      .populate('items.product')
      .populate('receivedBy', 'name email');

    res.json({
      success: true,
      message: 'Invoice updated successfully. Stock has been adjusted.',
      data: populated
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error editing invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

export const createInvoiceFromSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const sale = await Sale.findById(saleId).populate('customer');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
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
    res.status(500).json({ success: false, message: error.message });
  }
};