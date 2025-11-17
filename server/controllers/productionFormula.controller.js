// server/controllers/productionFormula.controller.js - NEW

import ProductionFormula from '../models/ProductionFormula.model.js';
import Product from '../models/Product.model.js';

export const createFormula = async (req, res) => {
  try {
    const { 
      name, 
      type, 
      finalProduct, 
      customerName, 
      customOutputName,
      ingredients,
      defaultOutputBags,
      defaultOutputKgs,
      notes 
    } = req.body;

    // Validate ingredients
    const processedIngredients = [];
    for (const ing of ingredients) {
      const product = await Product.findById(ing.product);
      if (!product) {
        throw new Error(`Product ${ing.product} not found`);
      }

      processedIngredients.push({
        product: product._id,
        productName: product.name,
        quantity: ing.quantity,
        unit: ing.unit,
        useBuyingPrice: ing.useBuyingPrice || false
      });
    }

    let finalProductName = null;
    if (type === 'standard' && finalProduct) {
      const finalProd = await Product.findById(finalProduct);
      if (finalProd) {
        finalProductName = finalProd.name;
      }
    }

    const formula = await ProductionFormula.create({
      name,
      type: type || 'standard',
      finalProduct: type === 'standard' ? finalProduct : null,
      finalProductName,
      customerName: type === 'custom' ? customerName : null,
      customOutputName: type === 'custom' ? customOutputName : null,
      ingredients: processedIngredients,
      defaultOutputBags: defaultOutputBags || 0,
      defaultOutputKgs: defaultOutputKgs || 0,
      notes,
      createdBy: req.user.id,
      createdByName: req.user.name
    });

    res.status(201).json({
      success: true,
      message: 'Formula created successfully',
      data: formula
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllFormulas = async (req, res) => {
  try {
    const { type, search } = req.query;
    
    let query = { isActive: true };
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const formulas = await ProductionFormula.find(query)
      .populate('ingredients.product')
      .populate('finalProduct')
      .populate('createdBy', 'name')
      .sort({ type: 1, name: 1 });

    res.json({
      success: true,
      data: formulas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getFormulaById = async (req, res) => {
  try {
    const formula = await ProductionFormula.findById(req.params.id)
      .populate('ingredients.product')
      .populate('finalProduct')
      .populate('createdBy', 'name email');

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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateFormula = async (req, res) => {
  try {
    const formula = await ProductionFormula.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('ingredients.product').populate('finalProduct');

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    res.json({
      success: true,
      message: 'Formula updated successfully',
      data: formula
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteFormula = async (req, res) => {
  try {
    const formula = await ProductionFormula.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const executeFormula = async (req, res) => {
  try {
    const { id } = req.params;
    const { outputBags, outputKgs, customQuantities } = req.body;

    const formula = await ProductionFormula.findById(id)
      .populate('ingredients.product')
      .populate('finalProduct');

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    // Use custom quantities if provided, otherwise use formula defaults
    const ingredients = customQuantities || formula.ingredients.map(ing => ({
      product: ing.product._id,
      quantity: ing.quantity,
      unit: ing.unit,
      useBuyingPrice: ing.useBuyingPrice
    }));

    const productionData = {
      type: formula.type,
      formula: formula._id,
      ingredients,
      finalProduct: formula.finalProduct?._id,
      customerName: formula.customerName,
      customOutputName: formula.customOutputName,
      outputBags: outputBags || formula.defaultOutputBags,
      outputKgs: outputKgs || formula.defaultOutputKgs,
      outputQuantity: (outputBags || formula.defaultOutputBags) + 
                     ((outputKgs || formula.defaultOutputKgs) / 50)
    };

    // Import and call completeProduction
    const { completeProductionFromFormula } = await import('./production.controller.js');
    return completeProductionFromFormula(req, res, productionData, formula);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};