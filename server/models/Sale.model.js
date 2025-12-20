// server/models/Sale.model.js - FIXED with per-sale profit calculation

import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  productName: {
    type: String,
    required: true
  },
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
    required: false,
  },
  buyingPrice: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
});

const splitPaymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'mpesa_paybill', 'mpesa_till', 'gdc_paybill', 'mpesa_beth', 'mpesa_martin', 'credit'],
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
  // NEW: Store calculated profit at time of sale
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  grossProfit: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa_paybill', 'mpesa_till', 'gdc_paybill', 'mpesa_beth', 'mpesa_martin', 'credit'],
    required: true
  },
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
  isCreditPayment: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Helper function to generate unique sale number with proper locking
async function generateUniqueSaleNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const prefix = `BAF-${year}${month}${day}`;
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      const latestSale = await mongoose.model('Sale')
        .findOne({ 
          saleNumber: { $regex: `^${prefix}` } 
        })
        .sort({ saleNumber: -1 })
        .select('saleNumber')
        .lean();
      
      let nextNumber = 1;
      
      if (latestSale && latestSale.saleNumber) {
        const match = latestSale.saleNumber.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const proposedNumber = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
      const exists = await mongoose.model('Sale').findOne({ saleNumber: proposedNumber }).lean();
      
      if (!exists) {
        return proposedNumber;
      }
      
      attempts++;
      
    } catch (error) {
      console.error('Error in generateUniqueSaleNumber (attempt ' + (attempts + 1) + '):', error);
      attempts++;
    }
  }
  
  const timestamp = Date.now().toString().slice(-10);
  return `BAF-${timestamp}`;
}

// Calculate profit before saving
saleSchema.pre('save', function(next) {
  // Calculate total cost from buying prices
  let totalCost = 0;
  
  this.items.forEach(item => {
    const itemCost = item.buyingPrice * (item.baseUnitQuantity || item.quantity);
    totalCost += itemCost;
  });
  
  this.totalCost = totalCost;
  // Gross profit = Total revenue - Total cost
  this.grossProfit = this.total - totalCost;
  
  next();
});

// Generate sale number before validation
saleSchema.pre('validate', async function(next) {
  if (!this.saleNumber) {
    try {
      this.saleNumber = await generateUniqueSaleNumber();
    } catch (error) {
      console.error('Failed to generate sale number:', error);
      const timestamp = Date.now().toString().slice(-10);
      this.saleNumber = `BAF-${timestamp}`;
    }
  }
  
  if (this.amountDue < 0) {
    this.amountDue = 0;
  }
  
  next();
});

export default mongoose.model('Sale', saleSchema);