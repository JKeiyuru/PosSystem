// server/models/Production.model.js - ENHANCED with Substitution Tracking

import mongoose from 'mongoose';

const productionIngredientSchema = new mongoose.Schema({
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
  baseUnitQuantity: Number,
  unitCost: Number,
  usedBuyingPrice: {
    type: Boolean,
    default: false
  },
  // NEW: Track if this ingredient was substituted
  wasSubstituted: {
    type: Boolean,
    default: false
  },
  originalProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  originalProductName: String
});

const productionSchema = new mongoose.Schema({
  productionNumber: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['standard', 'custom'],
    default: 'standard'
  },
  formula: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionFormula'
  },
  ingredients: [productionIngredientSchema],
  
  // For standard production (TELE feeds)
  finalProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  finalProductName: String,
  
  // For custom production (customer combinations)
  customerName: String,
  customOutputName: String,
  sellingPrice: {
    type: Number,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  
  outputQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  outputBags: {
    type: Number,
    default: 0
  },
  outputKgs: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  costPerUnit: Number,
  
  soldImmediately: {
    type: Boolean,
    default: false
  },
  saleReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  
  // NEW: Track if substitutions were made
  hasSubstitutions: {
    type: Boolean,
    default: false
  },
  
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: String,
  notes: String,
  productionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate production number
productionSchema.pre('validate', async function(next) {
  if (!this.productionNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const count = await mongoose.model('Production').countDocuments({
        createdAt: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      });
      
      this.productionNumber = `PROD-${year}${month}${day}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating production number:', error);
      this.productionNumber = `PROD-${Date.now()}`;
    }
  }
  
  // Check if any ingredients were substituted
  if (this.ingredients && this.ingredients.length > 0) {
    this.hasSubstitutions = this.ingredients.some(ing => ing.wasSubstituted);
  }
  
  next();
});

// Add index for searching by formula
productionSchema.index({ formula: 1, createdAt: -1 });
productionSchema.index({ hasSubstitutions: 1 });

export default mongoose.model('Production', productionSchema);