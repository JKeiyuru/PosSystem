// server/models/Product.model.js

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
    // e.g., 70 kg in 1 bag, 25 kasukus in 1 bag, 5 buckets in 1 bag
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  profitMargin: {
    type: Number,
    default: 0
    // Extra profit when selling full bag in this unit
    // e.g., 60 for kasuku, 100 for bucket
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
  // Base unit (what we count in inventory)
  baseUnit: {
    type: String,
    required: true,
    default: 'bag'
  },
  // Size of base unit (e.g., 70 for 70kg bag, 50 for 50kg bag, 1 for piece)
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
    // Buying price per base unit (per bag)
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
    // Selling price per base unit (per bag)
  },
  // Sub-units for selling
  subUnits: [subUnitSchema],
  
  // Inventory tracking
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    // Total bags (can be decimal for opened bags)
  },
  openedBags: {
    type: Number,
    default: 0,
    // Number of bags that have been opened
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
  // Product type for pricing logic
  hasMultipleUnits: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster searches
productSchema.index({ name: 'text', barcode: 1, category: 1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.buyingPrice) / this.buyingPrice * 100).toFixed(2);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
});

// Method to calculate price for a sub-unit
productSchema.methods.calculateSubUnitPrice = function(subUnitName, quantity) {
  const subUnit = this.subUnits.find(su => su.name === subUnitName);
  
  if (!subUnit) {
    throw new Error(`Sub-unit ${subUnitName} not found for product ${this.name}`);
  }

  // Calculate base price
  const totalPrice = subUnit.pricePerUnit * quantity;
  
  return {
    unitPrice: subUnit.pricePerUnit,
    quantity,
    totalPrice,
    subUnit: subUnitName
  };
};

// Method to convert sub-unit quantity to base unit (bags)
productSchema.methods.convertToBaseUnit = function(subUnitName, quantity) {
  if (subUnitName === this.baseUnit) {
    return quantity;
  }

  const subUnit = this.subUnits.find(su => su.name === subUnitName);
  
  if (!subUnit) {
    throw new Error(`Sub-unit ${subUnitName} not found`);
  }

  // Convert to bags
  return quantity / subUnit.conversionRate;
};

// Method to check if enough stock for a sub-unit sale
productSchema.methods.hasEnoughStock = function(subUnitName, quantity) {
  const bagsRequired = this.convertToBaseUnit(subUnitName, quantity);
  return this.quantity >= bagsRequired;
};

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);