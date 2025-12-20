// client/src/pages/Sales.jsx - WITH PROFIT FROM SALE RECORDS AND DOWNLOADS

import { useState, useEffect, useRef } from 'react';
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
import { Eye, Printer, Edit, Trash2, Download, Search, TrendingUp } from 'lucide-react';
import { saleService } from '../services/sale.service';
import { formatCurrency, formatDateTime } from '../lib/utils';
import Receipt from '../components/pos/Receipt';
import { useReactToPrint } from 'react-to-print';
import api from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../hooks/useAuth';
import { downloadSalesCSV } from '../utils/reportDownload';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amountPaid: ''
  });
  const receiptRef = useRef();

  const canDeleteSales = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchSales();
    fetchBusinessInfo();
  }, [dateRange, filterPaymentMethod, filterPaymentStatus]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSales(allSales);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allSales.filter(sale => {
        const saleNumber = sale.saleNumber?.toLowerCase() || '';
        const customerName = sale.customerName?.toLowerCase() || '';
        return saleNumber.includes(query) || customerName.includes(query);
      });
      setSales(filtered);
    }
  }, [searchQuery, allSales]);

  const fetchSales = async () => {
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      if (filterPaymentMethod && filterPaymentMethod !== 'all') {
        params.paymentMethod = filterPaymentMethod;
      }
      if (filterPaymentStatus && filterPaymentStatus !== 'all') {
        params.paymentStatus = filterPaymentStatus;
      }

      const response = await saleService.getAll(params);
      setAllSales(response.data);
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchBusinessInfo = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.success) {
        setBusinessInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  const handleViewSale = async (id) => {
    try {
      const response = await saleService.getById(id);
      setSelectedSale(response.data);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching sale:', error);
    }
  };

  const handleEditSale = async (sale) => {
    setSelectedSale(sale);
    setEditFormData({
      amountPaid: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    try {
      const amountPaid = parseFloat(editFormData.amountPaid);
      
      if (!amountPaid || amountPaid <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }

      if (amountPaid > selectedSale.amountDue) {
        alert('Payment amount cannot exceed amount due');
        return;
      }

      await saleService.updatePayment(selectedSale._id, { amountPaid });
      alert('Payment updated successfully');
      setIsEditDialogOpen(false);
      fetchSales();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSale = async (id) => {
    if (!canDeleteSales) {
      alert('You do not have permission to delete sales');
      return;
    }

    if (window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      try {
        await api.delete(`/sales/${id}`);
        alert('Sale deleted successfully');
        fetchSales();
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Error deleting sale: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !selectedSale) return;

    try {
      const receiptElement = receiptRef.current;
      
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, imgHeight + 10]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight);
      pdf.save(`Receipt-${selectedSale.saleNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${selectedSale?.saleNumber}`,
  });

  const getPaymentMethodBadge = (method) => {
    const methods = {
      cash: { label: 'Cash', color: 'default' },
      mpesa_paybill: { label: 'M-Pesa (Paybill)', color: 'success' },
      mpesa_till: { label: 'M-Pesa (Till)', color: 'success' },
      gdc_paybill: { label: 'GDC Paybill', color: 'success' },
      mpesa_beth: { label: 'M-Pesa (Beth)', color: 'success' },
      mpesa_martin: { label: 'M-Pesa (Martin)', color: 'success' },
      credit: { label: 'Credit', color: 'warning' }
    };
    return <Badge variant={methods[method]?.color || 'default'}>{methods[method]?.label || method}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const statuses = {
      paid: { label: 'Paid', color: 'success' },
      partial: { label: 'Partial', color: 'warning' },
      unpaid: { label: 'Unpaid', color: 'destructive' }
    };
    return <Badge variant={statuses[status]?.color || 'default'}>{statuses[status]?.label || status}</Badge>;
  };

  // Calculate totals including profit
  const calculateTotals = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPaid = sales.reduce((sum, sale) => sum + sale.amountPaid, 0);
    const totalDue = sales.reduce((sum, sale) => sum + sale.amountDue, 0);
    // Use the grossProfit stored in each sale
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.grossProfit || 0), 0);
    
    return { totalRevenue, totalPaid, totalDue, totalProfit };
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
            <p className="text-gray-600">View and manage all sales transactions</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => downloadSalesCSV(sales)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards - WITH PROFIT CARD */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sales.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
            </CardContent>
          </Card>

          {/* Total Profit Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totals.totalProfit)}</div>
              <p className="text-xs text-green-600 mt-1">
                For selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalDue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - WITH SEARCH BAR */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by sale number or customer name..."
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa_paybill">M-Pesa (Paybill)</SelectItem>
                    <SelectItem value="mpesa_beth">M-Pesa (Beth)</SelectItem>
                    <SelectItem value="mpesa_martin">M-Pesa (Martin)</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table - WITH PROFIT COLUMN */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Sales 
              {searchQuery && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (Showing {sales.length} of {allSales.length} results)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell>{formatDateTime(sale.saleDate)}</TableCell>
                      <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                      <TableCell>{sale.cashierName}</TableCell>
                      <TableCell>{getPaymentMethodBadge(sale.paymentMethod)}</TableCell>
                      <TableCell>{formatCurrency(sale.total)}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {formatCurrency(sale.grossProfit || 0)}
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSale(sale._id)}
                            title="View Sale"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {sale.amountDue > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSale(sale)}
                              title="Update Payment"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteSales && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSale(sale._id)}
                              title="Delete Sale"
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
            </div>

            {sales.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No sales found matching your search' : 'No sales found for the selected filters'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Sale Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-4">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Sale Number</p>
                  <p className="font-semibold">{selectedSale.saleNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{formatDateTime(selectedSale.saleDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">{selectedSale.customerName || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cashier</p>
                  <p className="font-semibold">{selectedSale.cashierName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <div className="mt-1">{getPaymentMethodBadge(selectedSale.paymentMethod)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <div className="mt-1">{getPaymentStatusBadge(selectedSale.paymentStatus)}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(selectedSale.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedSale.total)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Gross Profit:</span>
                    <span>{formatCurrency(selectedSale.grossProfit || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="text-green-600">{formatCurrency(selectedSale.amountPaid)}</span>
                  </div>
                  {selectedSale.amountDue > 0 && (
                    <div className="flex justify-between">
                      <span>Amount Due:</span>
                      <span className="text-red-600 font-semibold">{formatCurrency(selectedSale.amountDue)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden Receipt for Printing */}
              <div className="hidden">
                <Receipt 
                  ref={receiptRef} 
                  sale={selectedSale} 
                  businessInfo={businessInfo}
                />
              </div>
                              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handlePrintReceipt}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Total Amount:</span>
                  <span className="font-semibold">{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Already Paid:</span>
                  <span className="text-green-600">{formatCurrency(selectedSale.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Due:</span>
                  <span className="text-red-600 font-semibold">{formatCurrency(selectedSale.amountDue)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  placeholder="Enter payment amount"
                  value={editFormData.amountPaid}
                  onChange={(e) => setEditFormData({...editFormData, amountPaid: e.target.value})}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePayment}>
                  Update Payment
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}