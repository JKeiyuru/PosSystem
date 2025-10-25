// server/controllers/stock.controller.js

import Product from '../models/Product.model.js';
import StockMovement from '../models/StockMovement.model.js';
import mongoose from 'mongoose';

export const bulkRestock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = req.body; // Array of { productId, quantity, buyingPrice, sellingPrice }

    if (!items || items.length === 0) {
      throw new Error('No items provided for restocking');
    }

    const results = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const previousQuantity = product.quantity;
      product.quantity += item.quantity;
      
      if (item.buyingPrice !== undefined) {
        product.buyingPrice = item.buyingPrice;
      }
      
      if (item.sellingPrice !== undefined) {
        product.sellingPrice = item.sellingPrice;
      }

      product.lastRestocked = new Date();
      await product.save({ session });

      // Record stock movement
      await StockMovement.create([{
        product: product._id,
        movementType: 'restock',
        quantity: item.quantity,
        previousQuantity,
        newQuantity: product.quantity,
        buyingPrice: item.buyingPrice,
        sellingPrice: item.sellingPrice,
        notes: item.notes,
        performedBy: req.user.id
      }], { session });

      results.push(product);
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: `${results.length} products restocked successfully`,
      data: results
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

export const adjustStock = async (req, res) => {
  try {
    const { productId, newQuantity, reason, notes } = req.body;

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const previousQuantity = product.quantity;
    const difference = newQuantity - previousQuantity;

    product.quantity = newQuantity;
    await product.save();

    // Record stock movement
    await StockMovement.create({
      product: product._id,
      movementType: 'adjustment',
      quantity: difference,
      previousQuantity,
      newQuantity,
      notes: notes || reason,
      performedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getStockMovements = async (req, res) => {
  try {
    const { productId, movementType, startDate, endDate } = req.query;
    
    let query = {};

    if (productId) query.product = productId;
    if (movementType) query.movementType = movementType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(query)
      .populate('product', 'name barcode')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getStockValue = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });

    const stockValue = products.reduce((total, product) => {
      return total + (product.quantity * product.buyingPrice);
    }, 0);

    const potentialRevenue = products.reduce((total, product) => {
      return total + (product.quantity * product.sellingPrice);
    }, 0);

    res.json({
      success: true,
      data: {
        stockValue,
        potentialRevenue,
        potentialProfit: potentialRevenue - stockValue,
        totalProducts: products.length,
        totalItems: products.reduce((sum, p) => sum + p.quantity, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};