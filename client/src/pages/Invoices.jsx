/* eslint-disable react-hooks/exhaustive-deps */
// client/src/pages/Invoices.jsx - PRODUCTION READY COMPLETE VERSION

import { useState, useEffect, useCallback } from 'react';
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
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { 
  Eye, 
  Download, 
  Plus, 
  X, 
  AlertTriangle, 
  Search, 
  Trash2, 
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Printer,
  FileText
} from 'lucide-react';
import { invoiceService } from '../services/invoice.service';
import { productService } from '../services/product.service';
import { formatCurrency, formatDate, formatDateTime, debounce } from '../lib/utils';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

export default function Invoices() {
  const { user } = useAuth();
  const [outgoingInvoices, setOutgoingInvoices] = useState([]);
  const [receivingInvoices, setReceivingInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isViewReceivingDialogOpen, setIsViewReceivingDialogOpen] = useState(false);
  const [priceChangeNotifications, setPriceChangeNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dailySummary, setDailySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [loading, setLoading] = useState({
    outgoing: false,
    receiving: false,
    products: false,
    daily: false,
    submitting: false
  });
  const [expandedInvoices, setExpandedInvoices] = useState({});
  
  // Multi-product form
  const [receiveFormData, setReceiveFormData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    items: [],
    actualInvoiceAmount: '',
    varianceReason: '',
    paymentStatus: 'unpaid',
    notes: ''
  });

  // Single item being added
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: '',
    buyingPrice: ''
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      fetchReceivingInvoices(value);
    }, 300),
    []
  );

  useEffect(() => {
    const initData = async () => {
      setLoading(prev => ({ ...prev, outgoing: true, receiving: true, products: true, daily: true }));
      try {
        await Promise.all([
          fetchOutgoingInvoices(),
          fetchReceivingInvoices(),
          fetchProducts(),
          fetchDailySummary(selectedDate)
        ]);
      } catch (error) {
        toast.error('Failed to load invoices data');
      } finally {
        setLoading(prev => ({ ...prev, outgoing: false, receiving: false, products: false, daily: false }));
      }
    };
    initData();
  }, []);

  useEffect(() => {
    fetchDailySummary(selectedDate);
  }, [selectedDate]);

  const fetchOutgoingInvoices = async () => {
    try {
      const response = await invoiceService.getAll();
      setOutgoingInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching outgoing invoices:', error);
      toast.error('Failed to load outgoing invoices');
    }
  };

  const fetchReceivingInvoices = async (search = searchQuery) => {
    try {
      const params = {};
      if (search) params.search = search;
      if (paymentStatusFilter && paymentStatusFilter !== 'all') {
        params.paymentStatus = paymentStatusFilter;
      }
      
      const response = await api.get('/receiving-invoices', { params });
      setReceivingInvoices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching receiving invoices:', error);
      toast.error('Failed to load receiving invoices');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchDailySummary = async (date) => {
    try {
      setLoading(prev => ({ ...prev, daily: true }));
      const response = await api.get('/receiving-invoices/daily-report', {
        params: { date }
      });
      setDailySummary(response.data);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      toast.error('Failed to load daily summary');
    } finally {
      setLoading(prev => ({ ...prev, daily: false }));
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handlePaymentStatusFilter = (status) => {
    setPaymentStatusFilter(status);
    fetchReceivingInvoices();
  };

  const handleViewOutgoingInvoice = async (id) => {
    try {
      const response = await invoiceService.getById(id);
      setSelectedInvoice(response.data);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleViewReceivingInvoice = async (id) => {
    try {
      const response = await api.get(`/receiving-invoices/${id}`);
      setSelectedInvoice(response.data.data);
      setIsViewReceivingDialogOpen(true);
    } catch (error) {
      console.error('Error fetching receiving invoice:', error);
      toast.error('Failed to load receiving invoice details');
    }
  };

  const toggleInvoiceExpansion = (invoiceId) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [invoiceId]: !prev[invoiceId]
    }));
  };

  const handleUpdateInvoiceStatus = async (id, status) => {
    try {
      await invoiceService.updateStatus(id, status, status === 'paid' ? new Date() : null);
      fetchOutgoingInvoices();
      if (selectedInvoice && selectedInvoice._id === id) {
        handleViewOutgoingInvoice(id);
      }
      toast.success('Invoice status updated successfully');
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    try {
      await api.patch(`/receiving-invoices/${id}/payment-status`, { paymentStatus: status });
      fetchReceivingInvoices();
      fetchDailySummary(selectedDate);
      if (selectedInvoice && selectedInvoice._id === id) {
        handleViewReceivingInvoice(id);
      }
      toast.success('Payment status updated successfully');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setCurrentItem({
        productId,
        quantity: '',
        buyingPrice: product.buyingPrice.toString()
      });
      // Clear error for this field
      setFormErrors(prev => ({ ...prev, productId: '' }));
    }
  };

  const validateItem = () => {
    const errors = {};
    if (!currentItem.productId) errors.productId = 'Product is required';
    if (!currentItem.quantity || parseFloat(currentItem.quantity) <= 0) {
      errors.quantity = 'Valid quantity is required';
    }
    if (!currentItem.buyingPrice || parseFloat(currentItem.buyingPrice) < 0) {
      errors.buyingPrice = 'Valid buying price is required';
    }
    return errors;
  };

  const addItemToList = () => {
    const errors = validateItem();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const product = products.find(p => p._id === currentItem.productId);
    if (!product) {
      toast.error('Selected product not found');
      return;
    }

    // Check if product already exists in items
    const existingItemIndex = receiveFormData.items.findIndex(
      item => item.productId === currentItem.productId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      const updatedItems = [...receiveFormData.items];
      const existingItem = updatedItems[existingItemIndex];
      existingItem.quantity += parseFloat(currentItem.quantity);
      existingItem.buyingPrice = parseFloat(currentItem.buyingPrice);
      existingItem.itemTotal = existingItem.quantity * existingItem.buyingPrice;
      existingItem.priceChanged = Math.abs(existingItem.buyingPrice - existingItem.previousBuyingPrice) > 0.01;
      
      setReceiveFormData({
        ...receiveFormData,
        items: updatedItems
      });
    } else {
      // Add new item
      const itemTotal = parseFloat(currentItem.quantity) * parseFloat(currentItem.buyingPrice);
      const newItem = {
        productId: currentItem.productId,
        productName: product.name,
        quantity: parseFloat(currentItem.quantity),
        buyingPrice: parseFloat(currentItem.buyingPrice),
        previousBuyingPrice: product.buyingPrice,
        itemTotal: itemTotal,
        priceChanged: Math.abs(parseFloat(currentItem.buyingPrice) - product.buyingPrice) > 0.01
      };

      setReceiveFormData({
        ...receiveFormData,
        items: [...receiveFormData.items, newItem]
      });
    }

    // Reset current item and clear errors
    setCurrentItem({
      productId: '',
      quantity: '',
      buyingPrice: ''
    });
    setFormErrors({});
  };

  const removeItem = (index) => {
    const updatedItems = [...receiveFormData.items];
    updatedItems.splice(index, 1);
    setReceiveFormData({
      ...receiveFormData,
      items: updatedItems
    });
  };

  const calculateTotal = () => {
    return receiveFormData.items.reduce((sum, item) => sum + item.itemTotal, 0);
  };

  const calculateVariance = () => {
    const calculatedTotal = calculateTotal();
    const actualAmount = parseFloat(receiveFormData.actualInvoiceAmount) || 0;
    return actualAmount - calculatedTotal;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!receiveFormData.invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required';
    }
    
    if (!receiveFormData.supplier.trim()) {
      errors.supplier = 'Supplier name is required';
    }
    
    if (receiveFormData.items.length === 0) {
      errors.items = 'At least one product is required';
    }
    
    if (!receiveFormData.actualInvoiceAmount || parseFloat(receiveFormData.actualInvoiceAmount) < 0) {
      errors.actualInvoiceAmount = 'Valid invoice amount is required';
    }
    
    const variance = calculateVariance();
    if (Math.abs(variance) > 0.01 && !receiveFormData.varianceReason.trim()) {
      errors.varianceReason = 'Variance reason is required when amounts differ';
    }
    
    return errors;
  };

  const handleReceiveGoods = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      const variance = calculateVariance();
      const invoiceData = {
        invoiceNumber: receiveFormData.invoiceNumber.trim(),
        date: receiveFormData.date,
        supplier: receiveFormData.supplier.trim(),
        items: receiveFormData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          buyingPrice: item.buyingPrice
        })),
        actualInvoiceAmount: parseFloat(receiveFormData.actualInvoiceAmount),
        varianceReason: Math.abs(variance) > 0.01 ? receiveFormData.varianceReason.trim() : null,
        paymentStatus: receiveFormData.paymentStatus,
        notes: receiveFormData.notes.trim() || null
      };

      const response = await api.post('/receiving-invoices', invoiceData);

      if (response.data.success) {
        // Show price change notifications if applicable
        if (response.data.priceChanges && response.data.priceChanges.length > 0) {
          const notifications = response.data.priceChanges.map(change => ({
            id: Date.now() + Math.random(),
            productName: change.productName,
            previousPrice: change.previousPrice,
            newPrice: change.newPrice,
            invoiceNumber: receiveFormData.invoiceNumber,
            date: new Date()
          }));
          setPriceChangeNotifications([...notifications, ...priceChangeNotifications]);
        }

        toast.success('Goods received successfully! Inventory has been updated.');
        setIsReceiveDialogOpen(false);
        resetForm();
        fetchReceivingInvoices();
        fetchProducts();
        fetchDailySummary(selectedDate);
      }
    } catch (error) {
      console.error('Error receiving goods:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to receive goods';
      toast.error(errorMessage);
      
      // Handle specific backend errors
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const resetForm = () => {
    setReceiveFormData({
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      items: [],
      actualInvoiceAmount: '',
      varianceReason: '',
      paymentStatus: 'unpaid',
      notes: ''
    });
    setCurrentItem({
      productId: '',
      quantity: '',
      buyingPrice: ''
    });
    setFormErrors({});
  };

  const dismissNotification = (notificationId) => {
    setPriceChangeNotifications(priceChangeNotifications.filter(n => n.id !== notificationId));
  };

  const dismissAllNotifications = () => {
    setPriceChangeNotifications([]);
  };

  const getTypeBadge = (type) => {
    const types = {
      invoice: { label: 'Invoice', variant: 'default' },
      credit_note: { label: 'Credit Note', variant: 'success' },
      debit_note: { label: 'Debit Note', variant: 'warning' }
    };
    const badgeType = types[type] || { label: type, variant: 'default' };
    return <Badge variant={badgeType.variant}>{badgeType.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      draft: { label: 'Draft', variant: 'secondary' },
      sent: { label: 'Sent', variant: 'default' },
      paid: { label: 'Paid', variant: 'success' },
      cancelled: { label: 'Cancelled', variant: 'destructive' }
    };
    const badgeType = statuses[status] || { label: status, variant: 'default' };
    return <Badge variant={badgeType.variant}>{badgeType.label}</Badge>;
  };

  const getPaymentBadge = (status) => {
    return status === 'paid' 
      ? <Badge variant="success" className="whitespace-nowrap">Paid</Badge> 
      : <Badge variant="destructive" className="whitespace-nowrap">Unpaid</Badge>;
  };

  const handlePrintInvoice = (invoice) => {
    // This would open a print-friendly version
    window.open(`/invoices/print/${invoice._id}`, '_blank');
  };

  const handleExportDailyReport = () => {
    // Export daily report as CSV
    toast.info('Export feature coming soon');
  };

  // Loading skeletons
  if (loading.outgoing || loading.receiving || loading.products) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-gray-600">Manage incoming and outgoing invoices</p>
        </div>
      </div>

      {/* Price Change Notifications - Only for Admins */}
      {isAdmin && priceChangeNotifications.length > 0 && (
        <Card className="border-orange-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Price Change Alerts</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissAllNotifications}
                className="text-gray-500 hover:text-gray-700"
              >
                Dismiss All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priceChangeNotifications.slice(0, 3).map((notification) => (
                <Alert key={notification.id} className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex-1">
                      <strong>Price Change:</strong> {notification.productName} buying price changed from{' '}
                      {formatCurrency(notification.previousPrice)} to {formatCurrency(notification.newPrice)}{' '}
                      (Invoice: {notification.invoiceNumber}) - {formatDateTime(notification.date)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
              {priceChangeNotifications.length > 3 && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  ... and {priceChangeNotifications.length - 3} more notifications
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Two Sections */}
      <Tabs defaultValue="to-us" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="to-us" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices To Us (Receiving)
          </TabsTrigger>
          <TabsTrigger value="from-us" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices From Us (Outgoing)
          </TabsTrigger>
        </TabsList>

        {/* SECTION 1: Invoices To Us (Receiving Stock) */}
        <TabsContent value="to-us" className="space-y-6">
          
          {/* Daily Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span>Daily Receiving Summary</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportDailyReport}
                    disabled={loading.daily}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.daily ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : dailySummary ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-gray-600">Total Invoices</p>
                      <p className="text-2xl font-bold text-blue-600">{dailySummary.summary?.totalInvoices || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(dailySummary.summary?.totalAmount || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-sm text-gray-600">Paid Invoices</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {dailySummary.summary?.totalPaid || 0} 
                        <span className="text-sm font-normal ml-2">
                          ({formatCurrency(dailySummary.summary?.amountPaid || 0)})
                        </span>
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <p className="text-sm text-gray-600">Unpaid Invoices</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dailySummary.summary?.totalUnpaid || 0}
                        <span className="text-sm font-normal ml-2">
                          ({formatCurrency(dailySummary.summary?.amountUnpaid || 0)})
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                      <p className="text-sm text-gray-600">Total Variance</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {formatCurrency(dailySummary.summary?.totalVariance || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <p className="text-sm text-gray-600">Unique Suppliers</p>
                      <p className="text-xl font-bold text-indigo-600">{dailySummary.summary?.uniqueSuppliers || 0}</p>
                    </div>
                    <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-xl font-bold text-pink-600">{dailySummary.summary?.totalItems || 0}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available for selected date
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receiving Invoices Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Received Invoices</CardTitle>
              <div className="flex gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by invoice # or supplier..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-64"
                  />
                  <Select value={paymentStatusFilter} onValueChange={handlePaymentStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => fetchReceivingInvoices()}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => setIsReceiveDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Receive Goods
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Calculated Total</TableHead>
                      <TableHead>Actual Amount</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivingInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          No receiving invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      receivingInvoices.map((invoice) => (
                        <>
                          <TableRow key={invoice._id}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleInvoiceExpansion(invoice._id)}
                              >
                                {expandedInvoices[invoice._id] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell>{invoice.supplier}</TableCell>
                            <TableCell>{formatCurrency(invoice.calculatedTotal)}</TableCell>
                            <TableCell>{formatCurrency(invoice.actualInvoiceAmount)}</TableCell>
                            <TableCell>
                              <div className={`font-semibold ${invoice.variance !== 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {formatCurrency(invoice.variance)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getPaymentBadge(invoice.paymentStatus)}
                            </TableCell>
                            <TableCell>{invoice.receivedByName}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewReceivingInvoice(invoice._id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintInvoice(invoice)}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                {invoice.paymentStatus === 'unpaid' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleUpdatePaymentStatus(invoice._id, 'paid')}
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedInvoices[invoice._id] && invoice.items && invoice.items.length > 0 && (
                            <TableRow className="bg-gray-50">
                              <TableCell colSpan={10}>
                                <div className="p-4">
                                  <h4 className="font-semibold mb-2">Products in this Invoice:</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Buying Price</TableHead>
                                        <TableHead className="text-right">Item Total</TableHead>
                                        <TableHead>Price Change</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {invoice.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell>{item.productName}</TableCell>
                                          <TableCell className="text-right">{item.quantity}</TableCell>
                                          <TableCell className="text-right">{formatCurrency(item.buyingPrice)}</TableCell>
                                          <TableCell className="text-right font-medium">
                                            {formatCurrency(item.itemTotal)}
                                          </TableCell>
                                          <TableCell>
                                            {item.priceChanged ? (
                                              <Badge variant="warning">
                                                Changed from {formatCurrency(item.previousBuyingPrice)}
                                              </Badge>
                                            ) : (
                                              <Badge variant="secondary">No Change</Badge>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 2: Invoices From Us (Outgoing) */}
        <TabsContent value="from-us" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outgoing Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outgoingInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No outgoing invoices yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      outgoingInvoices.map((invoice) => (
                        <TableRow key={invoice._id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                          <TableCell>{invoice.customer?.name || '-'}</TableCell>
                          <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                          <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</TableCell>
                          <TableCell>{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewOutgoingInvoice(invoice._id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintInvoice(invoice)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleUpdateInvoiceStatus(invoice._id, 'paid')}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receive Goods Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Goods from Supplier</DialogTitle>
            <DialogDescription>
              Add multiple products from the same supplier invoice. The system will automatically update inventory and buying prices.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleReceiveGoods(); }}>
            <div className="space-y-6 py-4">
              {/* Invoice Header Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Invoice Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">
                      Invoice Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="invoiceNumber"
                      placeholder="INV-2024-001"
                      value={receiveFormData.invoiceNumber}
                      onChange={(e) => {
                        setReceiveFormData({...receiveFormData, invoiceNumber: e.target.value});
                        if (formErrors.invoiceNumber) {
                          setFormErrors({...formErrors, invoiceNumber: ''});
                        }
                      }}
                      className={formErrors.invoiceNumber ? 'border-red-500' : ''}
                      required
                    />
                    {formErrors.invoiceNumber && (
                      <p className="text-sm text-red-500">{formErrors.invoiceNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={receiveFormData.date}
                      onChange={(e) => setReceiveFormData({...receiveFormData, date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="supplier">
                      Supplier Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="supplier"
                      placeholder="Enter supplier name"
                     value={receiveFormData.supplier}
onChange={(e) => {
setReceiveFormData({...receiveFormData, supplier: e.target.value});
if (formErrors.supplier) {
setFormErrors({...formErrors, supplier: ''});
}
}}
className={formErrors.supplier ? 'border-red-500' : ''}
required
/>
{formErrors.supplier && (
<p className="text-sm text-red-500">{formErrors.supplier}</p>
)}
</div>
</div>
</div>

                        <Separator />

          {/* Add Product Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add Products</h3>
              {formErrors.items && (
                <p className="text-sm text-red-500">{formErrors.items}</p>
              )}
            </div>
            
            <div className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-lg">
              <div className="col-span-5 space-y-2">
                <Label>Product <span className="text-red-500">*</span></Label>
                <Select 
                  value={currentItem.productId} 
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger className={formErrors.productId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-xs text-gray-500">
                            Stock: {product.quantity} {product.baseUnit} | 
                            Current Price: {formatCurrency(product.buyingPrice)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.productId && (
                  <p className="text-sm text-red-500">{formErrors.productId}</p>
                )}
              </div>

              <div className="col-span-3 space-y-2">
                <Label>Quantity <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0"
                  value={currentItem.quantity}
                  onChange={(e) => {
                    setCurrentItem({...currentItem, quantity: e.target.value});
                    if (formErrors.quantity) {
                      setFormErrors({...formErrors, quantity: ''});
                    }
                  }}
                  className={formErrors.quantity ? 'border-red-500' : ''}
                />
                {formErrors.quantity && (
                  <p className="text-sm text-red-500">{formErrors.quantity}</p>
                )}
              </div>

              <div className="col-span-3 space-y-2">
                <Label>Buying Price <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={currentItem.buyingPrice}
                  onChange={(e) => {
                    setCurrentItem({...currentItem, buyingPrice: e.target.value});
                    if (formErrors.buyingPrice) {
                      setFormErrors({...formErrors, buyingPrice: ''});
                    }
                  }}
                  className={formErrors.buyingPrice ? 'border-red-500' : ''}
                />
                {formErrors.buyingPrice && (
                  <p className="text-sm text-red-500">{formErrors.buyingPrice}</p>
                )}
              </div>

              <div className="col-span-1">
                <Button 
                  type="button" 
                  onClick={addItemToList} 
                  className="w-full h-10"
                  disabled={!currentItem.productId}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {currentItem.productId && (
              <div className="text-sm p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Selected product: <strong>{products.find(p => p._id === currentItem.productId)?.name}</strong>
                  </span>
                  {currentItem.buyingPrice && products.find(p => p._id === currentItem.productId) && (
                    Math.abs(parseFloat(currentItem.buyingPrice) - (products.find(p => p._id === currentItem.productId)?.buyingPrice || 0)) > 0.01 && (
                      <Badge variant="warning" className="ml-2">
                        ⚠ Price will change!
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Added Items Table */}
          {receiveFormData.items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-semibold">Items Added ({receiveFormData.items.length})</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Buying Price</TableHead>
                      <TableHead className="text-right">Item Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiveFormData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.productName}</span>
                            {item.priceChanged && (
                              <span className="text-xs text-gray-500">
                                Was: {formatCurrency(item.previousBuyingPrice)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.buyingPrice)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.itemTotal)}
                        </TableCell>
                        <TableCell>
                          {item.priceChanged ? (
                            <Badge variant="warning" className="whitespace-nowrap">
                              Price Changed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No Change</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="bg-gray-50 p-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">
                    Calculated Total: {formatCurrency(calculateTotal())}
                  </div>
                  {receiveFormData.items.some(item => item.priceChanged) && (
                    <Badge variant="warning">
                      ⚠ Some prices will be updated
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Invoice Amount & Payment Section */}
          {receiveFormData.items.length > 0 && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-semibold">Invoice Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="actualAmount">
                      Actual Invoice Amount <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="actualAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={receiveFormData.actualInvoiceAmount}
                      onChange={(e) => {
                        setReceiveFormData({...receiveFormData, actualInvoiceAmount: e.target.value});
                        if (formErrors.actualInvoiceAmount) {
                          setFormErrors({...formErrors, actualInvoiceAmount: ''});
                        }
                      }}
                      className={formErrors.actualInvoiceAmount ? 'border-red-500' : ''}
                      required
                    />
                    {formErrors.actualInvoiceAmount && (
                      <p className="text-sm text-red-500">{formErrors.actualInvoiceAmount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Variance</Label>
                    <div className={`p-3 rounded border ${Math.abs(calculateVariance()) > 0.01 ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {formatCurrency(calculateVariance())}
                        </div>
                        <div className="text-sm text-gray-600">
                          {calculateVariance() > 0 ? 'Overpayment' : calculateVariance() < 0 ? 'Underpayment' : 'Exact Amount'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="varianceReason">
                      Variance Reason {Math.abs(calculateVariance()) > 0.01 && <span className="text-red-500">*</span>}
                    </Label>
                    <Textarea
                      id="varianceReason"
                      placeholder="Explain any difference between calculated and actual amount..."
                      value={receiveFormData.varianceReason}
                      onChange={(e) => {
                        setReceiveFormData({...receiveFormData, varianceReason: e.target.value});
                        if (formErrors.varianceReason) {
                          setFormErrors({...formErrors, varianceReason: ''});
                        }
                      }}
                      className={formErrors.varianceReason ? 'border-red-500' : ''}
                      rows={2}
                    />
                    {formErrors.varianceReason && (
                      <p className="text-sm text-red-500">{formErrors.varianceReason}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select 
                      value={receiveFormData.paymentStatus} 
                      onValueChange={(value) => setReceiveFormData({...receiveFormData, paymentStatus: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      placeholder="Additional notes..."
                      value={receiveFormData.notes}
                      onChange={(e) => setReceiveFormData({...receiveFormData, notes: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Summary Alert */}
          {receiveFormData.items.length > 0 && (
            <Alert className={calculateVariance() !== 0 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
              {calculateVariance() !== 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <strong>Variance Detected:</strong> There's a difference of {formatCurrency(calculateVariance())} between calculated and actual amounts.
                    {isAdmin ? ' You will be notified.' : ' Admin will be notified.'}
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertDescription className="text-green-700">
                    <strong>Perfect Match:</strong> Calculated total matches the actual invoice amount.
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsReceiveDialogOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading.submitting || receiveFormData.items.length === 0}
          >
            {loading.submitting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              'Receive & Update Inventory'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  {/* View Outgoing Invoice Dialog */}
  <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Invoice Details</DialogTitle>
      </DialogHeader>
      
      {selectedInvoice && selectedInvoice.type !== 'receiving' && (
        <div className="space-y-6 print:p-8">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">Bekhal Animal Feeds</h2>
              <p className="text-gray-600">Nairobi, Kenya</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{selectedInvoice.invoiceNumber}</p>
              {getTypeBadge(selectedInvoice.type)}
            </div>
          </div>

          {/* Customer & Date Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <p className="font-medium">{selectedInvoice.customer?.name}</p>
              <p className="text-sm text-gray-600">{selectedInvoice.customer?.phone}</p>
              <p className="text-sm text-gray-600">{selectedInvoice.customer?.email}</p>
              <p className="text-sm text-gray-600">{selectedInvoice.customer?.address}</p>
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <p><span className="font-semibold">Date:</span> {formatDate(selectedInvoice.createdAt)}</p>
                {selectedInvoice.dueDate && (
                  <p><span className="font-semibold">Due Date:</span> {formatDate(selectedInvoice.dueDate)}</p>
                )}
                <p><span className="font-semibold">Status:</span> {getStatusBadge(selectedInvoice.status)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedInvoice.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
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
                <span>{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(selectedInvoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(selectedInvoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {selectedInvoice.notes && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Notes:</h3>
              <p className="text-gray-600">{selectedInvoice.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 print:hidden">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Print/Download
            </Button>
            {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
              <Button onClick={() => handleUpdateInvoiceStatus(selectedInvoice._id, 'paid')}>
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>

  {/* View Receiving Invoice Dialog */}
  <Dialog open={isViewReceivingDialogOpen} onOpenChange={setIsViewReceivingDialogOpen}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Receiving Invoice Details</DialogTitle>
      </DialogHeader>
      
      {selectedInvoice && selectedInvoice.items && selectedInvoice.items.length > 0 && (
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">Receiving Invoice</h2>
              <p className="text-gray-600">{selectedInvoice.supplier}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{selectedInvoice.invoiceNumber}</p>
              <div className="mt-2">{getPaymentBadge(selectedInvoice.paymentStatus)}</div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Supplier:</h3>
              <p className="font-medium">{selectedInvoice.supplier}</p>
              <p className="text-sm text-gray-600">Invoice Date: {formatDate(selectedInvoice.date)}</p>
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <p><span className="font-semibold">Received By:</span> {selectedInvoice.receivedByName}</p>
                <p><span className="font-semibold">Date Received:</span> {formatDate(selectedInvoice.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Buying Price</TableHead>
                  <TableHead className="text-right">Previous Price</TableHead>
                  <TableHead className="text-right">Item Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedInvoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{item.productName}</div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.buyingPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.previousBuyingPrice)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.itemTotal)}
                    </TableCell>
                    <TableCell>
                      {item.priceChanged ? (
                        <Badge variant="warning">Price Changed</Badge>
                      ) : (
                        <Badge variant="secondary">No Change</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold">Amount Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Calculated Total:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.calculatedTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Invoice Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.actualInvoiceAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Variance:</span>
                  <span className={selectedInvoice.variance !== 0 ? 'text-orange-600' : 'text-green-600'}>
                    {formatCurrency(selectedInvoice.variance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Payment Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  {getPaymentBadge(selectedInvoice.paymentStatus)}
                </div>
                {selectedInvoice.varianceReason && (
                  <div>
                    <p className="font-semibold text-sm mb-1">Variance Reason:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {selectedInvoice.varianceReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {selectedInvoice.notes && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Notes:</h3>
              <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedInvoice.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsViewReceivingDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            {selectedInvoice.paymentStatus === 'unpaid' && (
              <Button onClick={() => handleUpdatePaymentStatus(selectedInvoice._id, 'paid')}>
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
</div>
);
}
