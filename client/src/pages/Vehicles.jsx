// client/src/pages/Vehicles.jsx - FIXED

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Fuel, Wrench, Car } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { vehicleService } from '../services/vehicle.service';
import { useAuth } from '../hooks/useAuth';

export default function Vehicles() {
  const { user, loading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [showFuelDialog, setShowFuelDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    type: 'truck',
    status: 'active'
  });

  const [fuelForm, setFuelForm] = useState({
    vehicle: '',
    date: new Date().toISOString().split('T')[0],
    odometerReading: '',
    liters: '',
    costPerLiter: '',
    totalCost: '',
    station: '',
    notes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicle: '',
    date: new Date().toISOString().split('T')[0],
    type: 'regular',
    description: '',
    cost: '',
    odometerReading: '',
    nextServiceDue: '',
    performedBy: '',
    notes: ''
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchAllData();
    }
  }, [authLoading, user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, fuelRes, maintenanceRes] = await Promise.all([
        vehicleService.getAllVehicles(),
        vehicleService.getAllFuelRecords(),
        vehicleService.getAllMaintenanceRecords()
      ]);
      
      setVehicles(vehiclesRes.data || []);
      setFuelRecords(fuelRes.data || []);
      setMaintenanceRecords(maintenanceRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!vehicleForm.registrationNumber || !vehicleForm.make) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      if (selectedVehicle) {
        await vehicleService.updateVehicle(selectedVehicle._id, vehicleForm);
      } else {
        await vehicleService.createVehicle(vehicleForm);
      }
      await fetchAllData();
      resetVehicleForm();
      setShowVehicleDialog(false);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Error saving vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFuel = async () => {
    if (!fuelForm.vehicle || !fuelForm.odometerReading || !fuelForm.liters) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      const totalCost = parseFloat(fuelForm.liters) * parseFloat(fuelForm.costPerLiter);
      await vehicleService.createFuelRecord({
        ...fuelForm,
        totalCost,
        recordedBy: user._id
      });
      await fetchAllData();
      resetFuelForm();
      setShowFuelDialog(false);
    } catch (error) {
      console.error('Error adding fuel record:', error);
      alert('Error adding fuel record');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenance = async () => {
    if (!maintenanceForm.vehicle || !maintenanceForm.description || !maintenanceForm.cost) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      await vehicleService.createMaintenanceRecord({
        ...maintenanceForm,
        performedBy: maintenanceForm.performedBy || user.name,
        recordedBy: user._id
      });
      await fetchAllData();
      resetMaintenanceForm();
      setShowMaintenanceDialog(false);
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      alert('Error adding maintenance record');
    } finally {
      setLoading(false);
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      registrationNumber: '',
      make: '',
      model: '',
      year: '',
      type: 'truck',
      status: 'active'
    });
    setSelectedVehicle(null);
  };

  const resetFuelForm = () => {
    setFuelForm({
      vehicle: '',
      date: new Date().toISOString().split('T')[0],
      odometerReading: '',
      liters: '',
      costPerLiter: '',
      totalCost: '',
      station: '',
      notes: ''
    });
  };

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      vehicle: '',
      date: new Date().toISOString().split('T')[0],
      type: 'regular',
      description: '',
      cost: '',
      odometerReading: '',
      nextServiceDue: '',
      performedBy: '',
      notes: ''
    });
  };

  const calculateVehicleStats = (vehicleId) => {
    const vehicleFuelRecords = fuelRecords.filter(r => r.vehicle?._id === vehicleId).sort((a, b) => new Date(a.date) - new Date(b.date));
    const vehicleMaintenanceRecords = maintenanceRecords.filter(r => r.vehicle?._id === vehicleId);

    let totalFuelCost = 0;
    let totalLiters = 0;
    let totalMaintenanceCost = 0;
    let totalKmDriven = 0;
    let fuelEfficiency = 0;

    vehicleFuelRecords.forEach(record => {
      totalFuelCost += record.totalCost;
      totalLiters += record.liters;
    });

    vehicleMaintenanceRecords.forEach(record => {
      totalMaintenanceCost += record.cost;
    });

    // Calculate fuel efficiency
    for (let i = 1; i < vehicleFuelRecords.length; i++) {
      const kmDriven = vehicleFuelRecords[i].odometerReading - vehicleFuelRecords[i-1].odometerReading;
      totalKmDriven += kmDriven;
    }

    if (totalLiters > 0 && totalKmDriven > 0) {
      fuelEfficiency = totalKmDriven / totalLiters;
    }

    return {
      totalFuelCost,
      totalLiters,
      totalMaintenanceCost,
      totalKmDriven,
      fuelEfficiency: fuelEfficiency.toFixed(2),
      lastOdometerReading: vehicleFuelRecords.length > 0 ? vehicleFuelRecords[vehicleFuelRecords.length - 1].odometerReading : 0
    };
  };

  // Check if user can modify (only after auth is loaded)
  const canModify = user && (user.role === 'admin' || user.role === 'manager');

  // Show loading state while auth is loading
  if (authLoading || (loading && vehicles.length === 0)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If no user after auth loaded, shouldn't happen due to PrivateRoute but just in case
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Please log in</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Management</h1>
          <p className="text-gray-600">Track fuel, maintenance, and vehicle performance</p>
        </div>
        {canModify && (
          <Button onClick={() => setShowVehicleDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Car className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="fuel">
            <Fuel className="mr-2 h-4 w-4" />
            Fuel Records
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="mr-2 h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map(vehicle => {
              const stats = calculateVehicleStats(vehicle._id);
              return (
                <Card key={vehicle._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{vehicle.registrationNumber}</CardTitle>
                        <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                      </div>
                      <Badge variant={vehicle.status === 'active' ? 'success' : 'secondary'}>
                        {vehicle.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Type</p>
                        <p className="font-semibold capitalize">{vehicle.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Year</p>
                        <p className="font-semibold">{vehicle.year}</p>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Odometer:</span>
                        <span className="font-semibold">{stats.lastOdometerReading} km</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fuel Efficiency:</span>
                        <span className="font-semibold">{stats.fuelEfficiency} km/L</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Fuel Cost:</span>
                        <span className="font-semibold">{formatCurrency(stats.totalFuelCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Maintenance Cost:</span>
                        <span className="font-semibold">{formatCurrency(stats.totalMaintenanceCost)}</span>
                      </div>
                    </div>

                    {canModify && (
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setVehicleForm(vehicle);
                            setShowVehicleDialog(true);
                          }}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {vehicles.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No vehicles added yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowFuelDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fuel Record
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Liters</TableHead>
                    <TableHead>Cost/L</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Station</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelRecords.map((record, index) => {
                    const prevRecord = fuelRecords.find((r, i) => 
                      i < index && r.vehicle?._id === record.vehicle?._id
                    );
                    const kmDriven = prevRecord ? record.odometerReading - prevRecord.odometerReading : 0;
                    const efficiency = kmDriven > 0 ? (kmDriven / record.liters).toFixed(2) : '-';

                    return (
                      <TableRow key={record._id}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.vehicle?.registrationNumber}</TableCell>
                        <TableCell>{record.odometerReading} km</TableCell>
                        <TableCell>{record.liters} L</TableCell>
                        <TableCell>{formatCurrency(record.costPerLiter)}</TableCell>
                        <TableCell>{formatCurrency(record.totalCost)}</TableCell>
                        <TableCell>
                          {efficiency !== '-' && (
                            <Badge variant={parseFloat(efficiency) > 8 ? 'success' : 'warning'}>
                              {efficiency} km/L
                            </Badge>
                          )}
                          {efficiency === '-' && '-'}
                        </TableCell>
                        <TableCell>{record.station}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-end">
            {canModify && (
              <Button onClick={() => setShowMaintenanceDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Maintenance Record
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords.map(record => (
                    <TableRow key={record._id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>{record.vehicle?.registrationNumber}</TableCell>
                      <TableCell>
                        <Badge variant={record.type === 'regular' ? 'success' : 'warning'}>
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{formatCurrency(record.cost)}</TableCell>
                      <TableCell>{record.odometerReading} km</TableCell>
                      <TableCell>{record.performedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={showVehicleDialog} onOpenChange={setShowVehicleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registration Number *</Label>
                <Input
                  value={vehicleForm.registrationNumber}
                  onChange={(e) => setVehicleForm({...vehicleForm, registrationNumber: e.target.value})}
                  placeholder="KXX 123X"
                />
              </div>
              <div className="space-y-2">
                <Label>Make *</Label>
                <Input
                  value={vehicleForm.make}
                  onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                  placeholder="Hilux"
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={vehicleForm.year}
                  onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={vehicleForm.type} onValueChange={(value) => setVehicleForm({...vehicleForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={vehicleForm.status} onValueChange={(value) => setVehicleForm({...vehicleForm, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowVehicleDialog(false);
                resetVehicleForm();
              }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddVehicle} disabled={loading}>
                {loading ? 'Saving...' : (selectedVehicle ? 'Update' : 'Add Vehicle')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Fuel Record Dialog */}
      <Dialog open={showFuelDialog} onOpenChange={setShowFuelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fuel Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <Select value={fuelForm.vehicle} onValueChange={(value) => setFuelForm({...fuelForm, vehicle: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.filter(v => v.status === 'active').map(vehicle => (
                    <SelectItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={fuelForm.date}
                  onChange={(e) => setFuelForm({...fuelForm, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Odometer Reading (km) *</Label>
                <Input
                  type="number"
                  value={fuelForm.odometerReading}
                  onChange={(e) => setFuelForm({...fuelForm, odometerReading: e.target.value})}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Liters *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fuelForm.liters}
                  onChange={(e) => setFuelForm({...fuelForm, liters: e.target.value})}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label>Cost per Liter *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fuelForm.costPerLiter}
                  onChange={(e) => setFuelForm({...fuelForm, costPerLiter: e.target.value})}
                  placeholder="150"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Fuel Station</Label>
                <Input
                  value={fuelForm.station}
                  onChange={(e) => setFuelForm({...fuelForm, station: e.target.value})}
                  placeholder="Shell Westlands"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Input
                  value={fuelForm.notes}
                  onChange={(e) => setFuelForm({...fuelForm, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            {fuelForm.liters && fuelForm.costPerLiter && (
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Total Cost:</p>
                <p className="text-xl font-bold">{formatCurrency(parseFloat(fuelForm.liters) * parseFloat(fuelForm.costPerLiter))}</p>
              </div>
            )}
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowFuelDialog(false);
                resetFuelForm();
              }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddFuel} disabled={loading}>
                {loading ? 'Adding...' : 'Add Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Record Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Maintenance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Vehicle *</Label>
                <Select value={maintenanceForm.vehicle} onValueChange={(value) => setMaintenanceForm({...maintenanceForm, vehicle: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={maintenanceForm.date}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={maintenanceForm.type} onValueChange={(value) => setMaintenanceForm({...maintenanceForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Service</SelectItem>
                    <SelectItem value="breakdown">Breakdown</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description *</Label>
                <Input
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                  placeholder="Oil change, tire rotation, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Cost (KES) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={maintenanceForm.cost}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: e.target.value})}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label>Odometer Reading (km)</Label>
                <Input
                  type="number"
                  value={maintenanceForm.odometerReading}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, odometerReading: e.target.value})}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Performed By</Label>
                <Input
                  value={maintenanceForm.performedBy}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, performedBy: e.target.value})}
                  placeholder="Mechanic name or garage"
                />
              </div>
              <div className="space-y-2">
                <Label>Next Service Due</Label>
                <Input
                  type="date"
                  value={maintenanceForm.nextServiceDue}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, nextServiceDue: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Input
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowMaintenanceDialog(false);
                resetMaintenanceForm();
              }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddMaintenance} disabled={loading}>
                {loading ? 'Adding...' : 'Add Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}