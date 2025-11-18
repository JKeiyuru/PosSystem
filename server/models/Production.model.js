// server/models/Production.model.js - ENHANCED

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
  baseUnitQuantity: Number, // Quantity in base units
  unitCost: Number,
  usedBuyingPrice: {
    type: Boolean,
    default: false
  }
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
  // Formula reference if using saved formula
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
  
  // If sold immediately (for custom combinations)
  soldImmediately: {
    type: Boolean,
    default: false
  },
  saleReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
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
  next();
});

export default mongoose.model('Production', productionSchema);