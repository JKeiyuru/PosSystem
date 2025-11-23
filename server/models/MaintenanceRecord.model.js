import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['regular', 'breakdown', 'repair', 'inspection', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  odometerReading: {
    type: Number,
    min: 0
  },
  nextServiceDue: {
    type: Date
  },
  performedBy: {
    type: String,
    trim: true
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

maintenanceRecordSchema.index({ vehicle: 1, date: -1 });

export default mongoose.model('MaintenanceRecord', maintenanceRecordSchema);