// server/models/DailyReport.model.js

import mongoose from 'mongoose';

const dailyReportSchema = new mongoose.Schema({
  reportDate: {
    type: Date,
    required: true
  },
  openingCash: {
    type: Number,
    required: true,
    min: 0
  },
  expectedCash: {
    type: Number,
    required: true,
    min: 0
  },
  actualCash: {
    type: Number,
    required: true,
    min: 0
  },
  variance: {
    type: Number,
    required: true
  },
  totalExpenses: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  expensesNotes: {
    type: String
  },
  // Sales Summary
  totalSales: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  cashSales: {
    type: Number,
    default: 0
  },
  mpesaSales: {
    type: Number,
    default: 0
  },
  creditSales: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  // User who closed
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  closedByName: String,
  notes: String
}, {
  timestamps: true
});

// Index for faster queries
dailyReportSchema.index({ reportDate: -1 });

export default mongoose.model('DailyReport', dailyReportSchema);