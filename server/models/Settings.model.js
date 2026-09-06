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
  }],

  // ===== Automatic local backups =====
  backupEnabled: {
    type: Boolean,
    default: false
  },
  // Absolute folder path on the computer running the server
  backupPath: {
    type: String,
    default: ''
  },
  // 24h time, e.g. "22:00"
  backupTime: {
    type: String,
    default: '22:00'
  },
  // If the machine was off at backupTime, run as soon as it is back on
  backupCatchUp: {
    type: Boolean,
    default: true
  },
  // Delete backup folders older than this many days (0 = keep forever)
  backupRetentionDays: {
    type: Number,
    default: 30,
    min: 0
  },
  lastBackupAt: Date,
  lastBackupStatus: {
    type: String,
    enum: ['success', 'failed', 'never'],
    default: 'never'
  },
  lastBackupMessage: String,
  lastBackupFolder: String
}, {
  timestamps: true
});

export default mongoose.model('Settings', settingsSchema);