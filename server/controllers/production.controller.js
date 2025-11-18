// server/controllers/production.controller.js - ENHANCED with Direct Sales

import Production from '../models/Production.model.js';
import ProductionFormula from '../models/ProductionFormula.model.js';
import Product from '../models/Product.model.js';
import StockMovement from '../models/StockMovement.model.js';
import Sale from '../models/Sale.model.js';
import Customer from '../models/Customer.model.js';
import mongoose from 'mongoose';

export const completeProduction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      type,
      ingredients, 
      finalProduct, 
      customerName,
      customOutputName,
      outputQuantity, 
      outputBags, 
      outputKgs,
      sellingPrice,
      sellImmediately,
      saleData,
      notes
    } = req.body;

    if (!ingredients || ingredients.length === 0) {
      throw new Error('Production must have at least one ingredient');
    }

    if (type === 'standard' && !finalProduct) {
      throw new Error('Final product is required for standard production');
    }

    if (type === 'custom' && (!customerName || !customOutputName)) {
      throw new Error('Customer name and output name are required for custom production');
    }

    // For standard production, output is required
    if (type === 'standard' && !outputQuantity) {
      throw new Error('Output quantity is required for standard production');
    }

    // For custom production, selling price is required
    if (type === 'custom' && (!sellingPrice || parseFloat(sellingPrice) <= 0)) {
      throw new Error('Selling price is required for custom production');
    }

    let totalCost = 0;
    const processedIngredients = [];

    // Process each ingredient - deduct stock with multi-unit support
    for (const ing of ingredients) {
      const product = await Product.findById(ing.product).session(session);
      
      if (!product) {
        throw new Error(`Product ${ing.product} not found`);
      }

      // Convert quantity to base units
      let baseUnitQuantity = ing.quantity;
      if (ing.unit !== product.baseUnit) {
        const subUnit = product.subUnits.find(su => su.name === ing.unit);
        if (!subUnit) {
          throw new Error(`Unit ${ing.unit} not found for ${product.name}`);
        }
        baseUnitQuantity = ing.quantity / subUnit.conversionRate;
      }

      // Validate stock availability
      if (product.quantity < baseUnitQuantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.baseUnit}`);
      }

      // Determine price to use
      let priceToUse;
      if (ing.unit === product.baseUnit) {
        // Base unit - allow choice
        priceToUse = ing.useBuyingPrice ? product.buyingPrice : product.sellingPrice;
      } else {
        // Sub-unit - always use selling price
        const subUnit = product.subUnits.find(su => su.name === ing.unit);
        priceToUse = subUnit ? subUnit.pricePerUnit : product.sellingPrice;
      }
      
      const cost = priceToUse * ing.quantity;
      totalCost += cost;

      processedIngredients.push({
        product: product._id,
        productName: product.name,
        quantity: ing.quantity,
        unit: ing.unit,
        baseUnitQuantity,
        unitCost: priceToUse,
        usedBuyingPrice: ing.useBuyingPrice || false
      });

      // Deduct stock in base units
      const previousQuantity = product.quantity;
      product.quantity -= baseUnitQuantity;
      await product.save({ session });

      // Record stock movement
      await StockMovement.create([{
        product: product._id,
        movementType: 'production',
        quantity: -baseUnitQuantity,
        previousQuantity,
        newQuantity: product.quantity,
        reference: type === 'custom' 
          ? `Used in custom production for ${customerName}` 
          : `Used in production`,
        performedBy: req.user.id
      }], { session });
    }

    const costPerUnit = outputQuantity && outputQuantity > 0 ? totalCost / outputQuantity : totalCost;

    // Handle different production types
    let productionData = {
      type: type || 'standard',
      ingredients: processedIngredients,
      outputQuantity: outputQuantity || 1,
      outputBags: outputBags || 0,
      outputKgs: outputKgs || 0,
      totalCost,
      costPerUnit,
      performedBy: req.user.id,
      performedByName: req.user.name,
      notes: notes || ''
    };

    let createdSale = null;

    if (type === 'custom') {
      // Custom production - direct sale
      productionData.customerName = customerName;
      productionData.customOutputName = customOutputName;
      productionData.sellingPrice = parseFloat(sellingPrice);
      productionData.totalRevenue = parseFloat(sellingPrice); // Total price for the batch
      productionData.profit = parseFloat(sellingPrice) - totalCost;
      productionData.soldImmediately = true; // Always true for custom
      productionData.outputQuantity = 1; // One custom batch

      // Create sale for custom production
      if (saleData) {
        const saleTotal = parseFloat(sellingPrice);
        const amountPaid = saleData.amountPaid || 0;
        const amountDue = Math.max(0, saleTotal - amountPaid);

        let paymentStatus = 'paid';
        if (saleData.paymentMethod === 'credit' || amountPaid === 0) {
          paymentStatus = 'unpaid';
        } else if (amountPaid < saleTotal) {
          paymentStatus = 'partial';
        }

        // Find or create customer
        let customer = null;
        const existingCustomer = await Customer.findOne({ 
          name: { $regex: new RegExp(`^${customerName}$`, 'i') }
        }).session(session);

        if (existingCustomer) {
          customer = existingCustomer;
        } else {
          const newCustomer = await Customer.create([{
            name: customerName,
            phone: 'N/A',
            customerType: 'regular',
            notes: `Created from custom production: ${customOutputName}`
          }], { session });
          customer = newCustomer[0];
        }

        // Create sale
        const sale = await Sale.create([{
          items: [{
            product: null,
            productName: `${customerName} - ${customOutputName}`,
            quantity: 1,
            unit: 'batch',
            unitPrice: parseFloat(sellingPrice),
            discount: 0,
            totalPrice: parseFloat(sellingPrice),
            baseUnitQuantity: 1
          }],
          subtotal: parseFloat(sellingPrice),
          discount: 0,
          transport: 0,
          tax: 0,
          total: parseFloat(sellingPrice),
          paymentMethod: saleData.paymentMethod,
          splitPayments: saleData.splitPayments,
          paymentStatus,
          amountPaid,
          amountDue,
          customer: customer._id,
          customerName: customer.name,
          cashier: req.user.id,
          cashierName: req.user.name,
          notes: `From custom production: ${customOutputName}`,
          isCreditPayment: false
        }], { session });

        createdSale = sale[0];
        productionData.saleReference = createdSale._id;

        // Update customer totals
        customer.totalPurchases += saleTotal;
        if (amountDue > 0) {
          customer.currentCredit += amountDue;
        }
        await customer.save({ session });
      }
      
    } else {
      // Standard production (TELE feeds) - add to inventory
      const finalProductDoc = await Product.findById(finalProduct).session(session);
      if (!finalProductDoc) {
        throw new Error('Final product not found');
      }

      productionData.finalProduct = finalProductDoc._id;
      productionData.finalProductName = finalProductDoc.name;

      // Add stock to final product
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
    }

    const production = await Production.create([productionData], { session });

    await session.commitTransaction();

    // Populate sale if created
    if (createdSale) {
      const populatedSale = await Sale.findById(createdSale._id)
        .populate('customer')
        .populate('cashier', 'name');

      res.status(201).json({
        success: true,
        message: 'Production and sale completed successfully',
        data: production[0],
        sale: populatedSale
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Production completed successfully',
        data: production[0]
      });
    }
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

// Helper function for executing formulas
export const completeProductionFromFormula = async (req, res, productionData, formula) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalCost = 0;
    const processedIngredients = [];

    // Process each ingredient with multi-unit support
    for (const ing of productionData.ingredients) {
      const product = await Product.findById(ing.product).session(session);
      
      if (!product) {
        throw new Error(`Product ${ing.product} not found`);
      }

      // Convert to base units
      let baseUnitQuantity = ing.quantity;
      if (ing.unit !== product.baseUnit) {
        const subUnit = product.subUnits.find(su => su.name === ing.unit);
        if (!subUnit) {
          throw new Error(`Unit ${ing.unit} not found for ${product.name}`);
        }
        baseUnitQuantity = ing.quantity / subUnit.conversionRate;
      }

      if (product.quantity < baseUnitQuantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const priceToUse = ing.useBuyingPrice ? product.buyingPrice : product.sellingPrice;
      const cost = priceToUse * ing.quantity;
      totalCost += cost;

      processedIngredients.push({
        product: product._id,
        productName: product.name,
        quantity: ing.quantity,
        unit: ing.unit,
        baseUnitQuantity,
        unitCost: priceToUse,
        usedBuyingPrice: ing.useBuyingPrice || false
      });

      const previousQuantity = product.quantity;
      product.quantity -= baseUnitQuantity;
      await product.save({ session });

      await StockMovement.create([{
        product: product._id,
        movementType: 'production',
        quantity: -baseUnitQuantity,
        previousQuantity,
        newQuantity: product.quantity,
        reference: `Formula: ${formula.name}`,
        performedBy: req.user.id
      }], { session });
    }

    const costPerUnit = totalCost / productionData.outputQuantity;

    const finalProductionData = {
      ...productionData,
      ingredients: processedIngredients,
      totalCost,
      costPerUnit,
      performedBy: req.user.id,
      performedByName: req.user.name
    };

    // Handle standard vs custom
    if (productionData.type === 'standard' && productionData.finalProduct) {
      const finalProductDoc = await Product.findById(productionData.finalProduct).session(session);
      if (finalProductDoc) {
        const previousQuantity = finalProductDoc.quantity;
        finalProductDoc.quantity += productionData.outputQuantity;
        await finalProductDoc.save({ session });

        await StockMovement.create([{
          product: finalProductDoc._id,
          movementType: 'production',
          quantity: productionData.outputQuantity,
          previousQuantity,
          newQuantity: finalProductDoc.quantity,
          reference: `Formula: ${formula.name}`,
          performedBy: req.user.id
        }], { session });
      }
    }

    const production = await Production.create([finalProductionData], { session });

    // Update formula usage stats
    formula.lastUsed = new Date();
    formula.usageCount += 1;
    await formula.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Production completed successfully using formula',
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
    const { startDate, endDate, type, limit = 50 } = req.query;

    let query = {};

    if (startDate || endDate) {
      query.productionDate = {};
      if (startDate) query.productionDate.$gte = new Date(startDate);
      if (endDate) query.productionDate.$lte = new Date(endDate);
    }

    if (type) {
      query.type = type;
    }

    const productions = await Production.find(query)
      .populate('finalProduct')
      .populate('formula')
      .populate('ingredients.product')
      .populate('performedBy', 'name')
      .populate('saleReference')
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
      .populate('formula')
      .populate('ingredients.product')
      .populate('performedBy', 'name email')
      .populate('saleReference');

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
    const { startDate, endDate, type } = req.query;

    let matchQuery = {};

    if (startDate || endDate) {
      matchQuery.productionDate = {};
      if (startDate) matchQuery.productionDate.$gte = new Date(startDate);
      if (endDate) matchQuery.productionDate.$lte = new Date(endDate);
    }

    if (type) {
      matchQuery.type = type;
    }

    const stats = await Production.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalProductions: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalProfit: { $sum: '$profit' },
          totalOutput: { $sum: '$outputQuantity' },
          avgCostPerUnit: { $avg: '$costPerUnit' }
        }
      }
    ]);

    // Get most produced products
    const topProducts = await Production.aggregate([
      { $match: { ...matchQuery, type: 'standard' } },
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

    // Get custom production stats
    const customStats = await Production.aggregate([
      { $match: { ...matchQuery, type: 'custom' } },
      {
        $group: {
          _id: '$customerName',
          customerName: { $first: '$customerName' },
          totalProductions: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalProfit: { $sum: '$profit' }
        }
      },
      { $sort: { totalProductions: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalProductions: 0,
          totalCost: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalOutput: 0,
          avgCostPerUnit: 0
        },
        topProducts,
        topCustomers: customStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};