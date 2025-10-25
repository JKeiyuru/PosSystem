// server/models/Settings.model.js

import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: 'Bekhal Animal Feeds'
  },
  businessEmail: {
    type: String,
    default: 'bekhalanimalfeeds@business.com'
  },
  businessPhone: String,
  businessAddress: String,
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currency: {
    type: String,
    default: 'KES'
  },
  receiptFooter: String,
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  enableEmailAlerts: {
    type: Boolean,
    default: true
  },
  dailyReportTime: {
    type: String,
    default: '18:00'
  },
  reportRecipients: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('Settings', settingsSchema);