// server/models/Production.model.js

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
  unitCost: Number
});

const productionSchema = new mongoose.Schema({
  productionNumber: {
    type: String,
    unique: true
  },
  ingredients: [productionIngredientSchema],
  finalProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  finalProductName: String,
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