// server/models/ReceivingInvoice.model.js - NEW FILE

import mongoose from 'mongoose';

const receivingInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  buyingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  previousBuyingPrice: {
    type: Number,
    required: true
  },
  priceChanged: {
    type: Boolean,
    default: false
  },
  totalCost: {
    type: Number,
    default: 0
  },
  notes: String,
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedByName: String
}, {
  timestamps: true
});

// Calculate total cost before saving
receivingInvoiceSchema.pre('save', function(next) {
  this.totalCost = this.quantity * this.buyingPrice;
  next();
});

export default mongoose.model('ReceivingInvoice', receivingInvoiceSchema);
