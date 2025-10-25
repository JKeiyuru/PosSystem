// server/models/StockMovement.model.js

import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  movementType: {
    type: String,
    enum: ['restock', 'sale', 'adjustment', 'return', 'damaged'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  buyingPrice: Number,
  sellingPrice: Number,
  reference: {
    type: String
  },
  notes: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
stockMovementSchema.index({ product: 1, movementType: 1, createdAt: -1 });

export default mongoose.model('StockMovement', stockMovementSchema);