// server/controllers/production.controller.js

import Production from '../models/Production.model.js';
import Product from '../models/Product.model.js';
import StockMovement from '../models/StockMovement.model.js';
import mongoose from 'mongoose';

export const completeProduction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ingredients, finalProduct, outputQuantity, outputBags, outputKgs } = req.body;

    if (!ingredients || ingredients.length === 0) {
      throw new Error('Production must have at least one ingredient');
    }

    if (!finalProduct || !outputQuantity) {
      throw new Error('Final product and output quantity are required');
    }

    let totalCost = 0;
    const processedIngredients = [];

    // Process each ingredient - deduct stock
    for (const ing of ingredients) {
      const product = await Product.findById(ing.product).session(session);
      
      if (!product) {
        throw new Error(`Product ${ing.product} not found`);
      }

      // Validate stock availability
      if (product.quantity < ing.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.baseUnit}`);
      }

      const cost = product.sellingPrice * ing.quantity;
      totalCost += cost;

      processedIngredients.push({
        product: product._id,
        productName: product.name,
        quantity: ing.quantity,
        unit: ing.unit,
        unitCost: product.sellingPrice
      });

      // Deduct stock
      const previousQuantity = product.quantity;
      product.quantity -= ing.quantity;
      await product.save({ session });

      // Record stock movement
      await StockMovement.create([{
        product: product._id,
        movementType: 'production',
        quantity: -ing.quantity,
        previousQuantity,
        newQuantity: product.quantity,
        reference: `Used in production`,
        performedBy: req.user.id
      }], { session });
    }

    // Add stock to final product
    const finalProductDoc = await Product.findById(finalProduct).session(session);
    if (!finalProductDoc) {
      throw new Error('Final product not found');
    }

    const previousFinalQuantity = finalProductDoc.quantity;
    finalProductDoc.quantity += outputQuantity;
    await finalProductDoc.save({ session });

    // Record stock movement for final product
    await StockMovement.create([{
      product: finalProductDoc._id,
      movementType: 'production',
      quantity: outputQuantity,
      previousQuantity: previousFinalQuantity,
      newQuantity: finalProductDoc.quantity,
      reference: `Produced from ingredients`,
      performedBy: req.user.id
    }], { session });

    // Create production record
    const costPerUnit = totalCost / outputQuantity;

    const production = await Production.create([{
      ingredients: processedIngredients,
      finalProduct: finalProductDoc._id,
      finalProductName: finalProductDoc.name,
      outputQuantity,
      outputBags: outputBags || 0,
      outputKgs: outputKgs || 0,
      totalCost,
      costPerUnit,
      performedBy: req.user.id,
      performedByName: req.user.name
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Production completed successfully',
      data: production[0]
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

export const getProductionHistory = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    let query = {};

    if (startDate || endDate) {
      query.productionDate = {};
      if (startDate) query.productionDate.$gte = new Date(startDate);
      if (endDate) query.productionDate.$lte = new Date(endDate);
    }

    const productions = await Production.find(query)
      .populate('finalProduct')
      .populate('ingredients.product')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: productions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProductionById = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id)
      .populate('finalProduct')
      .populate('ingredients.product')
      .populate('performedBy', 'name email');

    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Production record not found'
      });
    }

    res.json({
      success: true,
      data: production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProductionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};

    if (startDate || endDate) {
      matchQuery.productionDate = {};
      if (startDate) matchQuery.productionDate.$gte = new Date(startDate);
      if (endDate) matchQuery.productionDate.$lte = new Date(endDate);
    }

    const stats = await Production.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalProductions: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
          totalOutput: { $sum: '$outputQuantity' },
          avgCostPerUnit: { $avg: '$costPerUnit' }
        }
      }
    ]);

    // Get most produced products
    const topProducts = await Production.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$finalProduct',
          finalProductName: { $first: '$finalProductName' },
          totalProduced: { $sum: '$outputQuantity' },
          productionCount: { $sum: 1 },
          totalCost: { $sum: '$totalCost' }
        }
      },
      { $sort: { totalProduced: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalProductions: 0,
          totalCost: 0,
          totalOutput: 0,
          avgCostPerUnit: 0
        },
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};