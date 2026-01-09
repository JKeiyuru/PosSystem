// server/controllers/receivingInvoice.controller.js - WITH DELETE ITEM FUNCTIONALITY

import ReceivingInvoice from '../models/ReceivingInvoice.model.js';
import Product from '../models/Product.model.js';
import mongoose from 'mongoose';

export const createReceivingInvoice = async (req, res) => {
  try {
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

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product is required'
      });
    }

    // Process each item and update product inventory
    const processedItems = [];
    const priceChanges = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      const previousBuyingPrice = product.buyingPrice;
      const newBuyingPrice = parseFloat(item.buyingPrice);
      const priceChanged = Math.abs(newBuyingPrice - previousBuyingPrice) > 0.01;

      // Update product inventory and buying price
      product.quantity += parseFloat(item.quantity);
      product.buyingPrice = newBuyingPrice;
      await product.save();

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: parseFloat(item.quantity),
        buyingPrice: newBuyingPrice,
        previousBuyingPrice: previousBuyingPrice,
        priceChanged: priceChanged,
        itemTotal: parseFloat(item.quantity) * newBuyingPrice
      });

      if (priceChanged) {
        priceChanges.push({
          productName: product.name,
          previousPrice: previousBuyingPrice,
          newPrice: newBuyingPrice
        });
      }
    }

    // Calculate totals
    const calculatedTotal = processedItems.reduce((sum, item) => sum + item.itemTotal, 0);
    const variance = parseFloat(actualInvoiceAmount) - calculatedTotal;

    // Validate variance reason if there's a variance
    if (Math.abs(variance) > 0.01 && !varianceReason) {
      return res.status(400).json({
        success: false,
        message: 'Variance reason is required when actual amount differs from calculated total'
      });
    }

    // Create receiving invoice
    const receivingInvoice = await ReceivingInvoice.create({
      invoiceNumber,
      date,
      supplier,
      items: processedItems,
      calculatedTotal,
      actualInvoiceAmount: parseFloat(actualInvoiceAmount),
      variance,
      varianceReason: variance !== 0 ? varianceReason : null,
      paymentStatus: paymentStatus || 'unpaid',
      notes,
      receivedBy: req.user.id,
      receivedByName: req.user.name
    });

    const populatedInvoice = await ReceivingInvoice.findById(receivingInvoice._id)
      .populate('items.product')
      .populate('receivedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Goods received successfully',
      data: populatedInvoice,
      priceChanges: priceChanges
    });
  } catch (error) {
    console.error('Error creating receiving invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllReceivingInvoices = async (req, res) => {
  try {
    const { search, paymentStatus, startDate, endDate } = req.query;
    
    let query = {};

    // Search by invoice number or supplier
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const invoices = await ReceivingInvoice.find(query)
      .populate('items.product')
      .populate('receivedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

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

export const getReceivingInvoiceById = async (req, res) => {
  try {
    const invoice = await ReceivingInvoice.findById(req.params.id)
      .populate('items.product')
      .populate('receivedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Receiving invoice not found'
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

export const getDailyReceivingReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const invoices = await ReceivingInvoice.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('items.product')
    .populate('receivedBy', 'name email')
    .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.actualInvoiceAmount, 0),
      totalPaid: invoices.filter(inv => inv.paymentStatus === 'paid').length,
      totalUnpaid: invoices.filter(inv => inv.paymentStatus === 'unpaid').length,
      amountPaid: invoices
        .filter(inv => inv.paymentStatus === 'paid')
        .reduce((sum, inv) => sum + inv.actualInvoiceAmount, 0),
      amountUnpaid: invoices
        .filter(inv => inv.paymentStatus === 'unpaid')
        .reduce((sum, inv) => sum + inv.actualInvoiceAmount, 0),
      totalVariance: invoices.reduce((sum, inv) => sum + inv.variance, 0),
      uniqueSuppliers: [...new Set(invoices.map(inv => inv.supplier))].length,
      totalItems: invoices.reduce((sum, inv) => sum + inv.items.length, 0)
    };

    res.json({
      success: true,
      date: targetDate,
      summary,
      invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!['paid', 'unpaid'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const invoice = await ReceivingInvoice.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    )
    .populate('items.product')
    .populate('receivedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// NEW: Delete item from receiving invoice
export const deleteInvoiceItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceId, itemId } = req.params;

    const invoice = await ReceivingInvoice.findById(invoiceId).session(session);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Find the item to delete
    const itemIndex = invoice.items.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
      throw new Error('Item not found in invoice');
    }

    const itemToDelete = invoice.items[itemIndex];

    // Reverse the stock addition
    const product = await Product.findById(itemToDelete.product).session(session);
    if (product) {
      product.quantity -= itemToDelete.quantity;
      // Optionally revert price change if needed
      // product.buyingPrice = itemToDelete.previousBuyingPrice;
      await product.save({ session });
    }

    // Remove item from array
    invoice.items.splice(itemIndex, 1);

    // Recalculate totals
    invoice.calculatedTotal = invoice.items.reduce((sum, item) => sum + item.itemTotal, 0);
    invoice.variance = invoice.actualInvoiceAmount - invoice.calculatedTotal;

    // If no items left, optionally delete the invoice or mark as invalid
    if (invoice.items.length === 0) {
      await ReceivingInvoice.findByIdAndDelete(invoiceId).session(session);
      await session.commitTransaction();
      
      return res.json({
        success: true,
        message: 'Last item removed. Invoice deleted.',
        invoiceDeleted: true
      });
    }

    await invoice.save({ session });
    await session.commitTransaction();

    const populatedInvoice = await ReceivingInvoice.findById(invoiceId)
      .populate('items.product')
      .populate('receivedBy', 'name email');

    res.json({
      success: true,
      message: 'Item removed from invoice successfully',
      data: populatedInvoice
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