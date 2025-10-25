// server/models/Customer.model.js

import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  customerType: {
    type: String,
    enum: ['regular', 'wholesale', 'retail'],
    default: 'regular'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  currentCredit: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

// Index for faster searches
customerSchema.index({ name: 'text', phone: 1, email: 1 });

export default mongoose.model('Customer', customerSchema);