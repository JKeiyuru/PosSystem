// server/controllers/receivingInvoice.controller.js - FIXED

import ReceivingInvoice from '../models/ReceivingInvoice.model.js';
import Product from '../models/Product.model.js';
import StockMovement from '../models/StockMovement.model.js';
import mongoose from 'mongoose';

export const createReceivingInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      invoiceNumber, 
      date, 
      supplier, 
      product: productId, 
      productName,
      quantity, 
      buyingPrice,
      previousBuyingPrice,
      priceChanged,
      notes
    } = req.body;

    // Validate product exists
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error('Product not found');
    }

    // Update product inventory
    const previousQuantity = product.quantity;
    product.quantity += parseFloat(quantity);
    
    // Update buying price if changed
    if (priceChanged) {
      product.buyingPrice = parseFloat(buyingPrice);
    }

    product.lastRestocked = new Date();
    await product.save({ session });

    // Record stock movement - FIXED: Use req.user.id for performedBy
    await StockMovement.create([{
      product: product._id,
      movementType: 'restock',
      quantity: parseFloat(quantity),
      previousQuantity,
      newQuantity: product.quantity,
      buyingPrice: parseFloat(buyingPrice),
      reference: `Receiving Invoice: ${invoiceNumber}`,
      notes: `Supplier: ${supplier}`,
      performedBy: req.user.id // FIXED: Changed from receivedBy to req.user.id
    }], { session });

    // Create receiving invoice record
    const receivingInvoice = await ReceivingInvoice.create([{
      invoiceNumber,
      date: new Date(date),
      supplier,
      product: product._id,
      productName: product.name,
      quantity: parseFloat(quantity),
      buyingPrice: parseFloat(buyingPrice),
      previousBuyingPrice: parseFloat(previousBuyingPrice),
      priceChanged: priceChanged || false,
      notes,
      receivedBy: req.user.id, // User who received
      receivedByName: req.user.name
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Goods received successfully',
      data: receivingInvoice[0]
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

export const getAllReceivingInvoices = async (req, res) => {
  try {
    const { startDate, endDate, supplier, product } = req.query;
    
    let query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (supplier) {
      query.supplier = { $regex: supplier, $options: 'i' };
    }

    if (product) {
      query.product = product;
    }

    const receivingInvoices = await ReceivingInvoice.find(query)
      .populate('product', 'name category')
      .populate('receivedBy', 'name email')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: receivingInvoices
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
    const receivingInvoice = await ReceivingInvoice.findById(req.params.id)
      .populate('product')
      .populate('receivedBy', 'name email');

    if (!receivingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Receiving invoice not found'
      });
    }

    res.json({
      success: true,
      data: receivingInvoice
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

    const receivingInvoices = await ReceivingInvoice.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('product').populate('receivedBy', 'name');

    const totalCost = receivingInvoices.reduce((sum, inv) => sum + inv.totalCost, 0);
    const totalItems = receivingInvoices.length;
    const priceChanges = receivingInvoices.filter(inv => inv.priceChanged).length;

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary: {
          totalItems,
          totalCost,
          priceChanges
        },
        invoices: receivingInvoices
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
