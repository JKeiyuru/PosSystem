// server/models/Product.model.js - UPDATED

import mongoose from 'mongoose';

const subUnitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['kg', 'kasuku', 'bucket', 'bag','piece','g','liter']
  },
  conversionRate: {
    type: Number,
    required: true,
    // How many of this unit in one base unit (bag)
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  // NEW: Allow manual override
  manualConversionRate: {
    type: Boolean,
    default: false
    // If true, user manually set the conversion rate
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  baseUnit: {
    type: String,
    required: true,
    default: 'bag'
  },
  baseUnitSize: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  buyingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  subUnits: [subUnitSchema],
  
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  openedBags: {
    type: Number,
    default: 0,
  },
  reorderLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRestocked: {
    type: Date
  },
  hasMultipleUnits: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

productSchema.index({ name: 'text', barcode: 1, category: 1 });

productSchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.buyingPrice) / this.buyingPrice * 100).toFixed(2);
});

productSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
});

productSchema.methods.calculateSubUnitPrice = function(subUnitName, quantity) {
  const subUnit = this.subUnits.find(su => su.name === subUnitName);
  
  if (!subUnit) {
    throw new Error(`Sub-unit ${subUnitName} not found for product ${this.name}`);
  }

  const totalPrice = subUnit.pricePerUnit * quantity;
  
  return {
    unitPrice: subUnit.pricePerUnit,
    quantity,
    totalPrice,
    subUnit: subUnitName
  };
};

productSchema.methods.convertToBaseUnit = function(subUnitName, quantity) {
  if (subUnitName === this.baseUnit) {
    return quantity;
  }

  const subUnit = this.subUnits.find(su => su.name === subUnitName);
  
  if (!subUnit) {
    throw new Error(`Sub-unit ${subUnitName} not found`);
  }

  return quantity / subUnit.conversionRate;
};

productSchema.methods.hasEnoughStock = function(subUnitName, quantity) {
  const bagsRequired = this.convertToBaseUnit(subUnitName, quantity);
  return this.quantity >= bagsRequired;
};

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);