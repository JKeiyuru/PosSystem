import mongoose from 'mongoose';

const fuelRecordSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  odometerReading: {
    type: Number,
    required: true,
    min: 0
  },
  liters: {
    type: Number,
    required: true,
    min: 0
  },
  costPerLiter: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  station: {
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

fuelRecordSchema.index({ vehicle: 1, date: -1 });

export default mongoose.model('FuelRecord', fuelRecordSchema);