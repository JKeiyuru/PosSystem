// server/models/ProductionFormula.model.js - NEW

import mongoose from 'mongoose';

const formulaIngredientSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: String,
  useBuyingPrice: {
    type: Boolean,
    default: false // If true, use buying price; if false, use selling price
  }
});

const productionFormulaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['standard', 'custom'], // standard = TELE feeds, custom = customer combinations
    default: 'standard'
  },
  // For standard formulas (TELE feeds)
  finalProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  finalProductName: String,
  
  // For custom formulas (customer combinations)
  customerName: String,
  customOutputName: String,
  
  ingredients: [formulaIngredientSchema],
  
  // Output configuration
  defaultOutputBags: {
    type: Number,
    default: 0
  },
  defaultOutputKgs: {
    type: Number,
    default: 0
  },
  
  notes: String,
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: String,
  
  lastUsed: Date,
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster searches
productionFormulaSchema.index({ name: 'text', customerName: 'text' });
productionFormulaSchema.index({ type: 1, isActive: 1 });

export default mongoose.model('ProductionFormula', productionFormulaSchema);