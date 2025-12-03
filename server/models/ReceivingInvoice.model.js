// server/models/ReceivingInvoice.model.js - UPDATED with multiple products support

import mongoose from 'mongoose';

const receivingInvoiceItemSchema = new mongoose.Schema({
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
  itemTotal: {
    type: Number,
    default: 0
  }
});

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
  items: [receivingInvoiceItemSchema],
  calculatedTotal: {
    type: Number,
    required: true,
    default: 0
  },
  actualInvoiceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  variance: {
    type: Number,
    default: 0
  },
  varianceReason: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'unpaid'
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

// Calculate totals before saving
receivingInvoiceSchema.pre('save', function(next) {
  // Calculate item totals
  this.items.forEach(item => {
    item.itemTotal = item.quantity * item.buyingPrice;
  });
  
  // Calculate total from all items
  this.calculatedTotal = this.items.reduce((sum, item) => sum + item.itemTotal, 0);
  
  // Calculate variance
  this.variance = this.actualInvoiceAmount - this.calculatedTotal;
  
  next();
});

export default mongoose.model('ReceivingInvoice', receivingInvoiceSchema);
