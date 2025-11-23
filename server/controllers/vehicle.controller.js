import Vehicle from '../models/Vehicle.model.js';
import FuelRecord from '../models/FuelRecord.model.js';
import MaintenanceRecord from '../models/MaintenanceRecord.model.js';

// Vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Fuel Records
export const getAllFuelRecords = async (req, res) => {
  try {
    const { vehicle } = req.query;
    
    let query = {};
    if (vehicle) query.vehicle = vehicle;

    const fuelRecords = await FuelRecord.find(query)
      .populate('vehicle')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: fuelRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createFuelRecord = async (req, res) => {
  try {
    const fuelRecord = await FuelRecord.create(req.body);
    
    const populated = await FuelRecord.findById(fuelRecord._id)
      .populate('vehicle')
      .populate('recordedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Fuel record created successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getVehicleStats = async (req, res) => {
  try {
    const { id } = req.params;

    const fuelRecords = await FuelRecord.find({ vehicle: id }).sort({ date: 1 });
    const maintenanceRecords = await MaintenanceRecord.find({ vehicle: id });

    let totalFuelCost = 0;
    let totalLiters = 0;
    let totalMaintenanceCost = 0;
    let totalKmDriven = 0;

    fuelRecords.forEach(record => {
      totalFuelCost += record.totalCost;
      totalLiters += record.liters;
    });

    maintenanceRecords.forEach(record => {
      totalMaintenanceCost += record.cost;
    });

    for (let i = 1; i < fuelRecords.length; i++) {
      totalKmDriven += fuelRecords[i].odometerReading - fuelRecords[i-1].odometerReading;
    }

    const fuelEfficiency = totalLiters > 0 ? totalKmDriven / totalLiters : 0;

    res.json({
      success: true,
      data: {
        totalFuelCost,
        totalLiters,
        totalMaintenanceCost,
        totalKmDriven,
        fuelEfficiency: fuelEfficiency.toFixed(2),
        lastOdometerReading: fuelRecords.length > 0 ? fuelRecords[fuelRecords.length - 1].odometerReading : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Maintenance Records
export const getAllMaintenanceRecords = async (req, res) => {
  try {
    const { vehicle } = req.query;
    
    let query = {};
    if (vehicle) query.vehicle = vehicle;

    const maintenanceRecords = await MaintenanceRecord.find(query)
      .populate('vehicle')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: maintenanceRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createMaintenanceRecord = async (req, res) => {
  try {
    const maintenanceRecord = await MaintenanceRecord.create(req.body);
    
    const populated = await MaintenanceRecord.findById(maintenanceRecord._id)
      .populate('vehicle')
      .populate('recordedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};