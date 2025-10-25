// server/models/Invoice.model.js

import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['invoice', 'credit_note', 'debit_note'],
    required: true
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'cancelled'],
    default: 'draft'
  },
  dueDate: {
    type: Date
  },
  paidDate: {
    type: Date
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate invoice number based on type
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    let prefix;
    switch(this.type) {
      case 'invoice':
        prefix = 'INV';
        break;
      case 'credit_note':
        prefix = 'CN';
        break;
      case 'debit_note':
        prefix = 'DN';
        break;
    }
    
    const count = await mongoose.model('Invoice').countDocuments({
      type: this.type,
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    
    this.invoiceNumber = `${prefix}-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);