// server/controllers/productionFormula.controller.js - UPDATED with ingredient addition endpoint

const ProductionFormula = require('../models/ProductionFormula');
const Product = require('../models/Product');
const Production = require('../models/Production');
const Sale = require('../models/Sale');

exports.createFormula = async (req, res) => {
  try {
    const { name, type, ingredients, finalProduct, customerName, customOutputName, defaultOutputBags, defaultOutputKgs } = req.body;

    if (!name || !type || !ingredients || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and ingredients are required'
      });
    }

    const enrichedIngredients = await Promise.all(
      ingredients.map(async (ing) => {
        const product = await Product.findById(ing.product);
        if (!product) {
          throw new Error(`Product not found: ${ing.product}`);
        }
        return {
          ...ing,
          productName: product.name,
          baseUnit: product.baseUnit,
          sellingPrice: product.sellingPrice,
          buyingPrice: product.buyingPrice
        };
      })
    );

    const formulaData = {
      name,
      type,
      ingredients: enrichedIngredients,
      createdBy: req.user._id,
      defaultOutputBags: defaultOutputBags || 0,
      defaultOutputKgs: defaultOutputKgs || 0
    };

    if (type === 'standard') {
      formulaData.finalProduct = finalProduct;
      const finalProd = await Product.findById(finalProduct);
      if (finalProd) {
        formulaData.finalProductName = finalProd.name;
      }
    } else {
      formulaData.customerName = customerName;
      formulaData.customOutputName = customOutputName;
    }

    const formula = await ProductionFormula.create(formulaData);

    res.status(201).json({
      success: true,
      message: 'Formula created successfully',
      data: formula
    });
  } catch (error) {
    console.error('Error creating formula:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating formula'
    });
  }
};

exports.getAllFormulas = async (req, res) => {
  try {
    const formulas = await ProductionFormula.find()
      .populate('finalProduct', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      data: formulas
    });
  } catch (error) {
    console.error('Error fetching formulas:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching formulas'
    });
  }
};

exports.getFormulaById = async (req, res) => {
  try {
    const formula = await ProductionFormula.findById(req.params.id)
      .populate('finalProduct')
      .populate('createdBy', 'name');

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    res.json({
      success: true,
      data: formula
    });
  } catch (error) {
    console.error('Error fetching formula:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching formula'
    });
  }
};

// NEW: Update formula (for adding ingredients)
exports.updateFormula = async (req, res) => {
  try {
    const { ingredients } = req.body;
    const formula = await ProductionFormula.findById(req.params.id);

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    // Enrich new ingredients with product details
    if (ingredients) {
      const enrichedIngredients = await Promise.all(
        ingredients.map(async (ing) => {
          const product = await Product.findById(ing.product);
          if (!product) {
            throw new Error(`Product not found: ${ing.product}`);
          }
          return {
            product: ing.product,
            productName: ing.productName || product.name,
            quantity: ing.quantity,
            unit: ing.unit,
            baseUnit: product.baseUnit,
            sellingPrice: product.sellingPrice,
            buyingPrice: product.buyingPrice,
            useBuyingPrice: ing.useBuyingPrice || false
          };
        })
      );

      formula.ingredients = enrichedIngredients;
    }

    await formula.save();

    res.json({
      success: true,
      message: 'Formula updated successfully',
      data: formula
    });
  } catch (error) {
    console.error('Error updating formula:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating formula'
    });
  }
};

exports.executeFormula = async (req, res) => {
  try {
    const formula = await ProductionFormula.findById(req.params.id)
      .populate('finalProduct')
      .populate('createdBy', 'name');

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    const { 
      scale = 'full', 
      scaledIngredients,
      outputBags,
      outputKgs,
      sellingPrice,
      sellImmediately,
      saleData,
      hasSubstitutions,
      substitutionDetails
    } = req.body;

    const scaleMultiplier = scale === 'full' ? 1 : scale === 'half' ? 0.5 : 0.25;

    const ingredientsToUse = scaledIngredients || formula.ingredients.map(ing => ({
      ...ing,
      quantity: ing.quantity * scaleMultiplier
    }));

    for (const ing of ingredientsToUse) {
      const product = await Product.findById(ing.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${ing.product}`
        });
      }

      let quantityToDeduct = ing.quantity;
      if (ing.unit !== product.baseUnit) {
        const subUnit = product.subUnits.find(su => su.name === ing.unit);
        if (subUnit) {
          quantityToDeduct = ing.quantity / subUnit.conversionRate;
        }
      }

      if (product.quantity < quantityToDeduct) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }
    }

    const totalCost = ingredientsToUse.reduce((sum, ing) => {
      const product = formula.ingredients.find(i => i.product.toString() === ing.product.toString());
      const price = ing.useBuyingPrice ? (product?.buyingPrice || 0) : (product?.sellingPrice || 0);
      return sum + (price * ing.quantity);
    }, 0);

    for (const ing of ingredientsToUse) {
      const product = await Product.findById(ing.product);
      let quantityToDeduct = ing.quantity;
      
      if (ing.unit !== product.baseUnit) {
        const subUnit = product.subUnits.find(su => su.name === ing.unit);
        if (subUnit) {
          quantityToDeduct = ing.quantity / subUnit.conversionRate;
        }
      }

      product.quantity -= quantityToDeduct;
      await product.save();
    }

    const productionData = {
      type: formula.type,
      ingredients: ingredientsToUse.map(ing => {
        const originalIng = formula.ingredients.find(i => i.product.toString() === ing.product.toString());
        return {
          product: ing.product,
          productName: ing.productName || originalIng?.productName,
          quantity: ing.quantity,
          unit: ing.unit,
          unitCost: ing.useBuyingPrice ? (originalIng?.buyingPrice || 0) : (originalIng?.sellingPrice || 0),
          usedBuyingPrice: ing.useBuyingPrice || false
        };
      }),
      totalCost,
      performedBy: req.user._id,
      performedByName: req.user.name,
      fromFormula: formula._id,
      formulaName: formula.name,
      formulaScale: scale,
      hasSubstitutions: hasSubstitutions || false,
      substitutionDetails: substitutionDetails || []
    };

    if (formula.type === 'standard') {
      const finalOutputBags = outputBags !== undefined ? outputBags : (formula.defaultOutputBags || 0) * scaleMultiplier;
      const finalOutputKgs = outputKgs !== undefined ? outputKgs : (formula.defaultOutputKgs || 0) * scaleMultiplier;
      const outputQuantity = finalOutputBags + (finalOutputKgs / 50);

      productionData.finalProduct = formula.finalProduct._id;
      productionData.finalProductName = formula.finalProduct.name;
      productionData.outputQuantity = outputQuantity;
      productionData.outputBags = finalOutputBags;
      productionData.outputKgs = finalOutputKgs;
      productionData.costPerUnit = outputQuantity > 0 ? totalCost / outputQuantity : 0;

      const finalProduct = await Product.findById(formula.finalProduct._id);
      finalProduct.quantity += outputQuantity;
      await finalProduct.save();
    } else {
      productionData.customerName = formula.customerName;
      productionData.customOutputName = formula.customOutputName;
      productionData.sellingPrice = sellingPrice;
      productionData.outputQuantity = 1;
      productionData.outputBags = 0;
      productionData.outputKgs = 0;
      productionData.soldImmediately = sellImmediately || false;
      productionData.totalRevenue = sellingPrice;
      productionData.profit = sellingPrice - totalCost;

      if (sellImmediately && saleData) {
        const sale = await Sale.create({
          customer: {
            name: formula.customerName
          },
          items: [{
            product: null,
            name: formula.customOutputName,
            quantity: 1,
            unitPrice: sellingPrice,
            total: sellingPrice
          }],
          subtotal: sellingPrice,
          total: sellingPrice,
          paymentMethod: saleData.paymentMethod || 'cash',
          splitPayments: saleData.splitPayments,
          paymentStatus: saleData.paymentStatus || 'paid',
          amountPaid: saleData.amountPaid || sellingPrice,
          createdBy: req.user._id,
          createdByName: req.user.name,
          isProduction: true,
          productionType: 'custom'
        });

        productionData.sale = sale._id;
        productionData.saleNumber = sale.saleNumber;
      }
    }

    const production = await Production.create(productionData);

    formula.usageCount += 1;
    formula.lastUsedAt = new Date();
    await formula.save();

    const response = {
      success: true,
      message: 'Formula executed successfully',
      data: production
    };

    if (productionData.sale) {
      const sale = await Sale.findById(productionData.sale);
      response.sale = sale;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error executing formula:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error executing formula'
    });
  }
};

exports.deleteFormula = async (req, res) => {
  try {
    const formula = await ProductionFormula.findByIdAndDelete(req.params.id);

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    res.json({
      success: true,
      message: 'Formula deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting formula:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting formula'
    });
  }
};