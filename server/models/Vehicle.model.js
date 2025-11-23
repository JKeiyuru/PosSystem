import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  },
  type: {
    type: String,
    enum: ['truck', 'van', 'pickup', 'car', 'motorcycle'],
    default: 'truck'
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

vehicleSchema.index({ registrationNumber: 1 });

export default mongoose.model('Vehicle', vehicleSchema);