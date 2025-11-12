// server/models/Sale.model.js - FULLY UPDATED

import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 0.001
  },
  unit: {
    type: String,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // NEW: Item-level discount
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  baseUnitQuantity: {
    type: Number,
    required: true,
  }
});

// NEW: Split payment schema
const splitPaymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'mpesa_paybill', 'mpesa_beth', 'mpesa_martin', 'credit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
    // This is now the TOTAL of all item discounts
  },
  transport: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa_paybill', 'mpesa_beth', 'mpesa_martin', 'credit'],
    required: true
  },
  // NEW: Split payments array
  splitPayments: [splitPaymentSchema],
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'unpaid'],
    default: 'paid'
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  amountDue: {
    type: Number,
    default: 0,
    min: 0
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: String,
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cashierName: String,
  notes: String,
  saleDate: {
    type: Date,
    default: Date.now
  },
  // Track if this is a credit payment (not initial sale)
  isCreditPayment: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate sale number before validation
saleSchema.pre('validate', async function(next) {
  if (!this.saleNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      const count = await mongoose.model('Sale').countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      this.saleNumber = `BAF-${year}${month}${day}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating sale number:', error);
      this.saleNumber = `BAF-${Date.now()}`;
    }
  }
  
  if (this.amountDue < 0) {
    this.amountDue = 0;
  }
  
  next();
});

export default mongoose.model('Sale', saleSchema);