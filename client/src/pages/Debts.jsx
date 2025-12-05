// client/src/pages/Debts.jsx - COMPLETELY FIXED with proper ID handling

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Search, DollarSign, FileText, Download, Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { debtService } from '../services/debt.service';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

export default function Debts() {
  const { user } = useAuth();
  const location = useLocation();
  const isCashier = user?.role === 'cashier';
  const isAdmin = user?.role === 'admin';
  
  const [debts, setDebts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetchDebts();
    
    // Handle navigation from Customers page
    if (location.state?.customerId) {
      setSearchQuery(location.state.customerName || '');
    }
  }, [searchQuery, dateRange, location.state]);

  const fetchDebts = async () => {
    try {
      const params = {
        search: searchQuery,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      const response = await debtService.getAll(params);
      console.log('Fetched debts:', response.data); // Debug log
      setDebts(response.data);
    } catch (error) {
      console.error('Error fetching debts:', error);
      alert('Error loading debts: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePayDebt = async () => {
    const amount = parseFloat(paymentAmount);
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    // Check if customer ID exists
    if (!selectedCustomer.customerId) {
      alert('Error: Customer ID is missing. Please refresh the page and try again.');
      console.error('Missing customer ID:', selectedCustomer);
      return;
    }

    // Compare with the actual total debt from the selected customer object
    if (amount > selectedCustomer.totalDebt) {
      alert(`Payment amount (${formatCurrency(amount)}) cannot exceed total debt (${formatCurrency(selectedCustomer.totalDebt)})`);
      return;
    }

    try {
      setLoading(true);
      
      console.log('Recording payment for customer:', selectedCustomer.customerId); // Debug log
      
      await debtService.recordPayment({
        customerId: selectedCustomer.customerId,
        amount,
        paymentMethod
      });

      alert('Payment recorded successfully! Debt payment will be counted as today\'s revenue.');
      setIsPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentMethod('cash');
      fetchDebts();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDebt = async (debt) => {
    if (!isAdmin) {
      alert('Only administrators can delete debts');
      return;
    }

    // Check if customer ID exists
    if (!debt.customerId) {
      alert('Error: Customer ID is missing. Cannot delete debt.');
      console.error('Missing customer ID in debt:', debt);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the debt for ${debt.customerName}? This will clear ${formatCurrency(debt.totalDebt)} from their account. This action cannot be undone.`)) {
      try {
        console.log('Deleting debt for customer:', debt.customerId); // Debug log
        await debtService.deleteDebt(debt.customerId);
        alert('Debt deleted successfully');
        fetchDebts();
      } catch (error) {
        console.error('Error deleting debt:', error);
        alert('Error deleting debt: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates for the report');
      return;
    }

    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      const response = await debtService.generateReport(params);
      setReportData(response.data);
      setShowReport(true);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    }
  };

  const downloadReport = () => {
    alert('Download functionality will be implemented');
  };

  const calculateTotals = () => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.totalDebt, 0);
    const totalCustomers = debts.length;
    
    return { totalDebt, totalCustomers };
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Debts Management</h1>
            <p className="text-gray-600">Track and manage customer debts</p>
          </div>
          {!isCashier && (
            <Button onClick={generateReport} disabled={!dateRange.startDate || !dateRange.endDate}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          )}
        </div>

        {/* Summary Cards - HIDDEN FOR CASHIERS */}
        {!isCashier && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Customers with Debt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.totalCustomers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding Debt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalDebt)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Debt per Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totals.totalCustomers > 0 ? totals.totalDebt / totals.totalCustomers : 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Debts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Debt</TableHead>
                  <TableHead>Number of Sales</TableHead>
                  <TableHead>Oldest Debt Date</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => (
                  <TableRow key={debt.customerId || debt._id}>
                    <TableCell className="font-medium">
                      {debt.customerName}
                      {!debt.customerId && (
                        <span className="ml-2 text-xs text-red-500" title="Customer ID missing">
                          <AlertCircle className="h-3 w-3 inline" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{debt.customerPhone || '-'}</TableCell>
                    <TableCell>
                      <span className="text-red-600 font-semibold">
                        {formatCurrency(debt.totalDebt)}
                      </span>
                    </TableCell>
                    <TableCell>{debt.numberOfSales}</TableCell>
                    <TableCell>{debt.oldestDebtDate ? formatDateTime(debt.oldestDebtDate) : '-'}</TableCell>
                    <TableCell>{formatCurrency(debt.creditLimit || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={debt.totalDebt > (debt.creditLimit || 0) ? 'destructive' : 'warning'}>
                        {debt.totalDebt > (debt.creditLimit || 0) ? 'Over Limit' : 'Within Limit'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            console.log('Selected debt for payment:', debt); // Debug log
                            setSelectedCustomer(debt);
                            setIsPaymentDialogOpen(true);
                          }}
                          disabled={!debt.customerId}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Pay Debt
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteDebt(debt)}
                            title="Delete Debt (Admin Only)"
                            disabled={!debt.customerId}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {debts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No debts found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Debt Payment</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Customer:</span>
                  <span>{selectedCustomer.customerName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Phone:</span>
                  <span>{selectedCustomer.customerPhone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Debt:</span>
                  <span className="text-red-600 font-semibold">
                    {formatCurrency(selectedCustomer.totalDebt)}
                  </span>
                </div>
                {!selectedCustomer.customerId && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-700">
                      ⚠️ Warning: Customer ID is missing. Payment cannot be processed.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  placeholder="Enter payment amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={!selectedCustomer.customerId}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                  disabled={!selectedCustomer.customerId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa_paybill">M-Pesa (Paybill)</SelectItem>
                    <SelectItem value="mpesa_till">M-Pesa (Till)</SelectItem>
                    <SelectItem value="gdc_paybill">GDC Paybill</SelectItem>
                    <SelectItem value="mpesa_beth">M-Pesa (Beth)</SelectItem>
                    <SelectItem value="mpesa_martin">M-Pesa (Martin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentAmount && selectedCustomer.customerId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Payment Amount:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(parseFloat(paymentAmount) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-1">
                    <span>Remaining Balance:</span>
                    <span className="text-red-600">
                      {formatCurrency(Math.max(0, selectedCustomer.totalDebt - (parseFloat(paymentAmount) || 0)))}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  💡 This payment will be counted as today's revenue
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayDebt} 
                  disabled={loading || !selectedCustomer.customerId}
                >
                  {loading ? 'Processing...' : 'Record Payment'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog - HIDDEN FOR CASHIERS */}
      {!isCashier && (
        <Dialog open={showReport} onOpenChange={setShowReport}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Debts Report</DialogTitle>
            </DialogHeader>

            {reportData && (
              <div className="space-y-6">
                {/* Report Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">Bekhal Animal Feeds</h2>
                  <p className="text-sm text-gray-600">Debts Report</p>
                  <p className="text-sm text-gray-600">
                    Period: {reportData.startDate ? formatDateTime(reportData.startDate) : 'All'} to {reportData.endDate ? formatDateTime(reportData.endDate) : 'All'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Generated on: {formatDateTime(new Date())}
                  </p>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-gray-600">Total Customers</div>
                      <div className="text-2xl font-bold">{reportData.summary.totalCustomers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-gray-600">Total Outstanding Debt</div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(reportData.summary.totalDebt)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-gray-600">Total Sales on Credit</div>
                      <div className="text-2xl font-bold">{reportData.summary.totalCreditSales}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Breakdown */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Breakdown</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total Debt</TableHead>
                        <TableHead>Sales Count</TableHead>
                        <TableHead>Days Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.customers.map((customer, index) => (
                        <TableRow key={index}>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell className="text-red-600 font-semibold">
                            {formatCurrency(customer.debt)}
                          </TableCell>
                          <TableCell>{customer.salesCount}</TableCell>
                          <TableCell>{customer.daysOutstanding} days</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowReport(false)}>
                    Close
                  </Button>
                  <Button onClick={downloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
