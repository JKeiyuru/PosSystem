// server/models/PaymentTransaction.model.js

import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: String,
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa_paybill', 'mpesa_beth', 'mpesa_martin'],
    required: true
  },
  sales: [{
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale'
    },
    amountApplied: Number
  }],
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedByName: String,
  notes: String,
  paymentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate transaction number
paymentTransactionSchema.pre('validate', async function(next) {
  if (!this.transactionNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      const count = await mongoose.model('PaymentTransaction').countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      this.transactionNumber = `PMT-${year}${month}${day}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating transaction number:', error);
      this.transactionNumber = `PMT-${Date.now()}`;
    }
  }
  next();
});

export default mongoose.model('PaymentTransaction', paymentTransactionSchema);