/* eslint-disable react-hooks/exhaustive-deps */
// client/src/pages/Invoices.jsx - COMPLETELY RESTRUCTURED

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, Download, Plus, X, AlertTriangle } from 'lucide-react';
import { invoiceService } from '../services/invoice.service';
import { productService } from '../services/product.service';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Invoices() {
  const { user } = useAuth();
  const [outgoingInvoices, setOutgoingInvoices] = useState([]);
  const [receivingInvoices, setReceivingInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [priceChangeNotifications, setPriceChangeNotifications] = useState([]);
  
  const [receiveFormData, setReceiveFormData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    productId: '',
    quantity: '',
    buyingPrice: '',
    notes: ''
  });

  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchOutgoingInvoices();
    fetchReceivingInvoices();
    fetchProducts();
  }, []);

  const fetchOutgoingInvoices = async () => {
    try {
      const response = await invoiceService.getAll();
      setOutgoingInvoices(response.data);
    } catch (error) {
      console.error('Error fetching outgoing invoices:', error);
    }
  };

  const fetchReceivingInvoices = async () => {
    try {
      // Fetch receiving invoices from backend
      const response = await api.get('/receiving-invoices');
      setReceivingInvoices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching receiving invoices:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleViewOutgoingInvoice = async (id) => {
    try {
      const response = await invoiceService.getById(id);
      setSelectedInvoice(response.data);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const handleUpdateInvoiceStatus = async (id, status) => {
    try {
      await invoiceService.updateStatus(id, status, status === 'paid' ? new Date() : null);
      fetchOutgoingInvoices();
      if (selectedInvoice && selectedInvoice._id === id) {
        handleViewOutgoingInvoice(id);
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleReceiveGoods = async () => {
    try {
      if (!receiveFormData.productId || !receiveFormData.quantity || !receiveFormData.buyingPrice) {
        alert('Please fill in all required fields');
        return;
      }

      const selectedProduct = products.find(p => p._id === receiveFormData.productId);
      if (!selectedProduct) {
        alert('Selected product not found');
        return;
      }

      const newBuyingPrice = parseFloat(receiveFormData.buyingPrice);
      const currentBuyingPrice = selectedProduct.buyingPrice;
      
      // Check if buying price changed
      let priceChanged = false;
      if (Math.abs(newBuyingPrice - currentBuyingPrice) > 0.01) {
        priceChanged = true;
      }

      // Create receiving invoice
      const invoiceData = {
        invoiceNumber: receiveFormData.invoiceNumber,
        date: receiveFormData.date,
        supplier: receiveFormData.supplier,
        product: receiveFormData.productId,
        productName: selectedProduct.name,
        quantity: parseFloat(receiveFormData.quantity),
        buyingPrice: newBuyingPrice,
        previousBuyingPrice: currentBuyingPrice,
        priceChanged: priceChanged,
        notes: receiveFormData.notes,
        receivedBy: user.id,
        receivedByName: user.name
      };

      const response = await api.post('/receiving-invoices', invoiceData);

      if (response.data.success) {
        // Show price change notification if applicable
        if (priceChanged && isAdmin) {
          const notification = {
            id: Date.now(),
            productName: selectedProduct.name,
            previousPrice: currentBuyingPrice,
            newPrice: newBuyingPrice,
            invoiceNumber: receiveFormData.invoiceNumber,
            date: new Date()
          };
          setPriceChangeNotifications([notification, ...priceChangeNotifications]);
        }

        alert('Goods received successfully! Inventory has been updated.');
        setIsReceiveDialogOpen(false);
        setReceiveFormData({
          invoiceNumber: '',
          date: new Date().toISOString().split('T')[0],
          supplier: '',
          productId: '',
          quantity: '',
          buyingPrice: '',
          notes: ''
        });
        fetchReceivingInvoices();
        fetchProducts();
      }
    } catch (error) {
      console.error('Error receiving goods:', error);
      alert('Error receiving goods: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setReceiveFormData({
        ...receiveFormData,
        productId,
        buyingPrice: product.buyingPrice.toString()
      });
    }
  };

  const dismissNotification = (notificationId) => {
    setPriceChangeNotifications(priceChangeNotifications.filter(n => n.id !== notificationId));
  };

  const getTypeBadge = (type) => {
    const types = {
      invoice: { label: 'Invoice', color: 'default' },
      credit_note: { label: 'Credit Note', color: 'success' },
      debit_note: { label: 'Debit Note', color: 'warning' }
    };
    return <Badge variant={types[type]?.color || 'default'}>{types[type]?.label || type}</Badge>;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      draft: { label: 'Draft', color: 'secondary' },
      sent: { label: 'Sent', color: 'default' },
      paid: { label: 'Paid', color: 'success' },
      cancelled: { label: 'Cancelled', color: 'destructive' }
    };
    return <Badge variant={statuses[status]?.color || 'default'}>{statuses[status]?.label || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-600">Manage incoming and outgoing invoices</p>
        </div>
      </div>

      {/* Price Change Notifications - Only for Admins */}
      {isAdmin && priceChangeNotifications.length > 0 && (
        <div className="space-y-2">
          {priceChangeNotifications.map((notification) => (
            <Alert key={notification.id} className="border-orange-300 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>Price Change Alert:</strong> {notification.productName} buying price changed from{' '}
                  {formatCurrency(notification.previousPrice)} to {formatCurrency(notification.newPrice)}{' '}
                  (Invoice: {notification.invoiceNumber}) - {formatDateTime(notification.date)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Tabs for Two Sections */}
      <Tabs defaultValue="to-us" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="to-us">Invoices To Us (Receiving)</TabsTrigger>
          <TabsTrigger value="from-us">Invoices From Us (Outgoing)</TabsTrigger>
        </TabsList>

        {/* SECTION 1: Invoices To Us (Receiving Stock) */}
        <TabsContent value="to-us" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Receive Goods from Suppliers</CardTitle>
              <Button onClick={() => setIsReceiveDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Receive Goods
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Use this section to record deliveries from suppliers. This will automatically update inventory.
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Buying Price</TableHead>
                    <TableHead>Price Change</TableHead>
                    <TableHead>Received By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivingInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>{invoice.supplier}</TableCell>
                      <TableCell>{invoice.productName}</TableCell>
                      <TableCell>{invoice.quantity}</TableCell>
                      <TableCell>{formatCurrency(invoice.buyingPrice)}</TableCell>
                      <TableCell>
                        {invoice.priceChanged ? (
                          <Badge variant="warning">
                            Changed from {formatCurrency(invoice.previousBuyingPrice)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No Change</Badge>
                        )}
                      </TableCell>
                      <TableCell>{invoice.receivedByName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {receivingInvoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No receiving invoices recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 2: Invoices From Us (Outgoing) */}
        <TabsContent value="from-us" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outgoing Invoices</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {outgoingInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                      <TableCell>{invoice.customer?.name}</TableCell>
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
                  ))}
                </TableBody>
              </Table>

              {outgoingInvoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No outgoing invoices yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receive Goods Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receive Goods from Supplier</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                Recording this delivery will automatically update the product's inventory and buying price if changed.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="INV-2024-001"
                  value={receiveFormData.invoiceNumber}
                  onChange={(e) => setReceiveFormData({...receiveFormData, invoiceNumber: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={receiveFormData.date}
                  onChange={(e) => setReceiveFormData({...receiveFormData, date: e.target.value})}
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="supplier">Supplier Name *</Label>
                <Input
                  id="supplier"
                  placeholder="Enter supplier name"
                  value={receiveFormData.supplier}
                  onChange={(e) => setReceiveFormData({...receiveFormData, supplier: e.target.value})}
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select 
                  value={receiveFormData.productId} 
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} (Current stock: {product.quantity} {product.baseUnit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Received *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={receiveFormData.quantity}
                  onChange={(e) => setReceiveFormData({...receiveFormData, quantity: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyingPrice">Buying Price (per unit) *</Label>
                <Input
                  id="buyingPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={receiveFormData.buyingPrice}
                  onChange={(e) => setReceiveFormData({...receiveFormData, buyingPrice: e.target.value})}
                  required
                />
                {receiveFormData.productId && products.find(p => p._id === receiveFormData.productId) && (
                  <p className="text-xs text-gray-600">
                    Current buying price: {formatCurrency(products.find(p => p._id === receiveFormData.productId).buyingPrice)}
                  </p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Optional notes..."
                  value={receiveFormData.notes}
                  onChange={(e) => setReceiveFormData({...receiveFormData, notes: e.target.value})}
                />
              </div>
            </div>

            {receiveFormData.productId && receiveFormData.buyingPrice && products.find(p => p._id === receiveFormData.productId) && (
              Math.abs(parseFloat(receiveFormData.buyingPrice) - products.find(p => p._id === receiveFormData.productId).buyingPrice) > 0.01 && (
                <Alert className="border-orange-300 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <strong>Price Change Detected:</strong> The buying price you entered differs from the current price. 
                    {isAdmin ? ' You will be notified, and ' : ' Admin will be notified, and '}
                    the system will automatically update the product's buying price.
                  </AlertDescription>
                </Alert>
              )
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReceiveGoods}>
              Receive & Update Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Outgoing Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
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
    </div>
  );
}
