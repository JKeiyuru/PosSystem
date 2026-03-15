// server/controllers/production.controller.js
// VERSION 3: Complete with reverseProduction and completeProductionFromFormula

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
    if (type === 'standard' && !outputQuantity) {
      throw new Error('Output quantity is required for standard production');
    }
    if (type === 'custom' && (!sellingPrice || parseFloat(sellingPrice) <= 0)) {
      throw new Error('Selling price is required for custom production');
    }

    let totalCost = 0;
    const processedIngredients = [];

    for (const ing of ingredients) {
      const product = await Product.findById(ing.product).session(session);
      if (!product) throw new Error(`Product ${ing.product} not found`);

      let baseUnitQuantity = ing.quantity;
      if (ing.unit !== product.baseUnit) {
        const subUnit = product.subUnits.find(su => su.name === ing.unit);
        if (!subUnit) throw new Error(`Unit ${ing.unit} not found for ${product.name}`);
        baseUnitQuantity = ing.quantity / subUnit.conversionRate;
      }

      if (product.quantity < baseUnitQuantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.baseUnit}`);
      }

      let priceToUse;
      if (ing.unit === product.baseUnit) {
        priceToUse = ing.useBuyingPrice ? product.buyingPrice : product.sellingPrice;
      } else {
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

      const previousQuantity = product.quantity;
      product.quantity -= baseUnitQuantity;
      await product.save({ session });

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
      productionData.customerName = customerName;
      productionData.customOutputName = customOutputName;
      productionData.sellingPrice = parseFloat(sellingPrice);
      productionData.totalRevenue = parseFloat(sellingPrice);
      productionData.profit = parseFloat(sellingPrice) - totalCost;
      productionData.soldImmediately = true;
      productionData.outputQuantity = 1;

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

        customer.totalPurchases += saleTotal;
        if (amountDue > 0) customer.currentCredit += amountDue;
        await customer.save({ session });
      }

    } else {
      const finalProductDoc = await Product.findById(finalProduct).session(session);
      if (!finalProductDoc) throw new Error('Final product not found');

      productionData.finalProduct = finalProductDoc._id;
      productionData.finalProductName = finalProductDoc.name;

      const previousFinalQuantity = finalProductDoc.quantity;
      finalProductDoc.quantity += outputQuantity;
      await finalProductDoc.save({ session });

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

    if (createdSale) {
      const populatedSale = await Sale.findById(createdSale._id)
        .populate('customer')
        .populate('cashier');
      return res.status(201).json({
        success: true,
        message: 'Production and sale completed successfully',
        data: production[0],
        sale: populatedSale
      });
    }

    res.status(201).json({
      success: true,
      message: 'Production completed successfully',
      data: production[0]
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
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

    // Get original formula ingredients for comparison
    const originalIngredients = formula.ingredients || [];

    // Process each ingredient with multi-unit support
    for (const ing of productionData.ingredients) {
      const product = await Product.findById(ing.product).session(session);
      
      if (!product) {
        throw new Error(`Product ${ing.product} not found`);
      }

      // Check if this ingredient was substituted
      const originalIng = originalIngredients.find(orig => 
        orig.quantity === ing.quantity && orig.unit === ing.unit
      );
      
      const wasSubstituted = originalIng && originalIng.product.toString() !== ing.product.toString();

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
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.baseUnit}, Required: ${baseUnitQuantity.toFixed(2)} ${product.baseUnit}`);
      }

      const priceToUse = ing.useBuyingPrice ? product.buyingPrice : product.sellingPrice;
      const cost = priceToUse * ing.quantity;
      totalCost += cost;

      const ingredientData = {
        product: product._id,
        productName: product.name,
        quantity: ing.quantity,
        unit: ing.unit,
        baseUnitQuantity,
        unitCost: priceToUse,
        usedBuyingPrice: ing.useBuyingPrice || false,
        wasSubstituted: wasSubstituted,
        originalProduct: wasSubstituted ? originalIng.product : product._id,
        originalProductName: wasSubstituted ? originalIng.productName : product.name
      };

      processedIngredients.push(ingredientData);

      const previousQuantity = product.quantity;
      product.quantity -= baseUnitQuantity;
      await product.save({ session });

      await StockMovement.create([{
        product: product._id,
        movementType: 'production',
        quantity: -baseUnitQuantity,
        previousQuantity,
        newQuantity: product.quantity,
        reference: wasSubstituted 
          ? `Formula: ${formula.name} (Substituted for ${originalIng.productName})`
          : `Formula: ${formula.name}`,
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
      performedByName: req.user.name,
      hasSubstitutions: processedIngredients.some(ing => ing.wasSubstituted)
    };

    // Handle standard vs custom production
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
          reference: finalProductionData.hasSubstitutions 
            ? `Formula: ${formula.name} (with substitutions)`
            : `Formula: ${formula.name}`,
          performedBy: req.user.id
        }], { session });
      }
    } else if (productionData.type === 'custom' && productionData.sellImmediately) {
      // Handle custom production with direct sale
      const saleData = productionData.saleData || {};
      const saleTotal = parseFloat(productionData.sellingPrice || 0);
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
        name: { $regex: new RegExp(`^${productionData.customerName}$`, 'i') }
      }).session(session);

      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        const newCustomer = await Customer.create([{
          name: productionData.customerName,
          phone: 'N/A',
          customerType: 'regular',
          notes: `Created from custom production: ${productionData.customOutputName}`
        }], { session });
        customer = newCustomer[0];
      }

      // Create sale
      const sale = await Sale.create([{
        items: [{
          product: null,
          productName: `${productionData.customerName} - ${productionData.customOutputName}`,
          quantity: 1,
          unit: 'batch',
          unitPrice: saleTotal,
          discount: 0,
          totalPrice: saleTotal,
          baseUnitQuantity: 1
        }],
        subtotal: saleTotal,
        discount: 0,
        transport: 0,
        tax: 0,
        total: saleTotal,
        paymentMethod: saleData.paymentMethod || 'cash',
        splitPayments: saleData.splitPayments,
        paymentStatus,
        amountPaid,
        amountDue,
        customer: customer._id,
        customerName: customer.name,
        cashier: req.user.id,
        cashierName: req.user.name,
        notes: finalProductionData.hasSubstitutions
          ? `From custom production: ${productionData.customOutputName} (with substitutions)`
          : `From custom production: ${productionData.customOutputName}`,
        isCreditPayment: false
      }], { session });

      finalProductionData.saleReference = sale[0]._id;
      finalProductionData.totalRevenue = saleTotal;
      finalProductionData.profit = saleTotal - totalCost;

      // Update customer totals
      customer.totalPurchases += saleTotal;
      if (amountDue > 0) {
        customer.currentCredit += amountDue;
      }
      await customer.save({ session });
    }

    const production = await Production.create([finalProductionData], { session });

    // Update formula usage stats
    formula.lastUsed = new Date();
    formula.usageCount += 1;
    await formula.save({ session });

    await session.commitTransaction();

    // If sale was created, populate and return it
    if (finalProductionData.saleReference) {
      const populatedSale = await Sale.findById(finalProductionData.saleReference)
        .populate('customer')
        .populate('cashier', 'name');

      res.status(201).json({
        success: true,
        message: 'Production completed successfully using formula',
        data: production[0],
        sale: populatedSale
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Production completed successfully using formula',
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

// NEW: Reverse a production record
export const reverseProduction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const production = await Production.findById(req.params.id).session(session);

    if (!production) {
      return res.status(404).json({ success: false, message: 'Production record not found' });
    }

    if (production.isReversed) {
      return res.status(400).json({ success: false, message: 'Production has already been reversed' });
    }

    // Return all ingredients back to inventory
    for (const ing of production.ingredients) {
      const product = await Product.findById(ing.product).session(session);
      if (product) {
        const previousQuantity = product.quantity;
        product.quantity += (ing.baseUnitQuantity || ing.quantity);
        await product.save({ session });

        await StockMovement.create([{
          product: product._id,
          movementType: 'adjustment',
          quantity: ing.baseUnitQuantity || ing.quantity,
          previousQuantity,
          newQuantity: product.quantity,
          reference: `Reversed production: ${production.productionNumber || production._id}`,
          performedBy: req.user.id
        }], { session });
      }
    }

    // Remove final product from inventory (standard production)
    if (production.type === 'standard' && production.finalProduct) {
      const finalProduct = await Product.findById(production.finalProduct).session(session);
      if (finalProduct) {
        const previousQuantity = finalProduct.quantity;
        finalProduct.quantity = Math.max(0, finalProduct.quantity - production.outputQuantity);
        await finalProduct.save({ session });

        await StockMovement.create([{
          product: finalProduct._id,
          movementType: 'adjustment',
          quantity: -production.outputQuantity,
          previousQuantity,
          newQuantity: finalProduct.quantity,
          reference: `Reversed production: ${production.productionNumber || production._id}`,
          performedBy: req.user.id
        }], { session });
      }
    }

    // Handle reversal of associated sale for custom productions
    if (production.type === 'custom' && production.saleReference) {
      const sale = await Sale.findById(production.saleReference).session(session);
      if (sale) {
        // Mark sale as reversed/voided
        sale.paymentStatus = 'voided';
        sale.notes = (sale.notes || '') + ' | Reversed with production';
        await sale.save({ session });

        // Update customer credit if applicable
        if (sale.customer && sale.amountDue > 0) {
          const customer = await Customer.findById(sale.customer).session(session);
          if (customer) {
            customer.currentCredit = Math.max(0, customer.currentCredit - sale.amountDue);
            await customer.save({ session });
          }
        }
      }
    }

    // Mark production as reversed
    production.isReversed = true;
    production.reversedAt = new Date();
    production.reversedBy = req.user.id;
    production.reversedByName = req.user.name;
    await production.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Production reversed successfully. Ingredients returned to inventory.',
      data: production
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error reversing production:', error);
    res.status(500).json({ success: false, message: error.message });
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
    if (type) query.type = type;

    const productions = await Production.find(query)
      .populate('finalProduct')
      .populate('formula')
      .populate('ingredients.product')
      .populate('performedBy', 'name')
      .populate('saleReference')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: productions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(404).json({ success: false, message: 'Production record not found' });
    }

    res.json({ success: true, data: production });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    if (type) matchQuery.type = type;

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
    res.status(500).json({ success: false, message: error.message });
  }
};