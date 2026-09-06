/* eslint-disable react-hooks/exhaustive-deps */
// client/src/pages/Invoices.jsx
// VERSION 3: Complete with all original features + admin edit/delete + PDF download

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Eye, Download, Plus, X, AlertTriangle, Search, Trash2, Calendar,
  Filter, ChevronDown, ChevronUp, Printer, FileText, Edit, AlertCircle
} from 'lucide-react';
import { invoiceService } from '../services/invoice.service';
import { productService } from '../services/product.service';
import { formatCurrency, formatDate, formatDateTime, debounce } from '../lib/utils';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { generateReceivingInvoicePDF } from '../utils/receivingInvoicePDF';

export default function Invoices() {
  const { user } = useAuth();
  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');

  const [outgoingInvoices, setOutgoingInvoices] = useState([]);
  const [receivingInvoices, setReceivingInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);

  // Dialog open states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isViewReceivingDialogOpen, setIsViewReceivingDialogOpen] = useState(false);
  const [isEditReceivingDialogOpen, setIsEditReceivingDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const [priceChangeNotifications, setPriceChangeNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dailySummary, setDailySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const [loading, setLoading] = useState({
    outgoing: false, receiving: false, products: false,
    daily: false, submitting: false, deleting: false
  });
  const [expandedInvoices, setExpandedInvoices] = useState({});

  // ── RECEIVE FORM ────────────────────────────────────────────────────
  const emptyReceiveForm = {
    invoiceNumber: '', date: new Date().toISOString().split('T')[0],
    supplier: '', items: [], actualInvoiceAmount: '',
    varianceReason: '', paymentStatus: 'unpaid', notes: ''
  };
  const [receiveFormData, setReceiveFormData] = useState(emptyReceiveForm);
  const [currentItem, setCurrentItem] = useState({ productId: '', quantity: '', buyingPrice: '' });
  const [formErrors, setFormErrors] = useState({});

  // ── EDIT FORM ────────────────────────────────────────────────────────
  const [editFormData, setEditFormData] = useState(emptyReceiveForm);
  const [editCurrentItem, setEditCurrentItem] = useState({ productId: '', quantity: '', buyingPrice: '' });
  const [editFormErrors, setEditFormErrors] = useState({});

  const debouncedSearch = useCallback(debounce((v) => fetchReceivingInvoices(v), 300), []);

  // ── INIT ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(p => ({ ...p, outgoing: true, receiving: true, products: true, daily: true }));
      try {
        await Promise.all([
          fetchOutgoingInvoices(),
          fetchReceivingInvoices(),
          fetchProducts(),
          fetchDailySummary(selectedDate),
          fetchBusinessInfo()
        ]);
      } catch (error) {
        toast.error('Failed to load invoices data');
      } finally {
        setLoading(p => ({ ...p, outgoing: false, receiving: false, products: false, daily: false }));
      }
    };
    init();
  }, []);

  useEffect(() => { fetchDailySummary(selectedDate); }, [selectedDate]);

  // ── FETCHERS ──────────────────────────────────────────────────────────
  const fetchBusinessInfo = async () => {
    try {
      const r = await api.get('/settings');
      if (r.data.success) setBusinessInfo(r.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchOutgoingInvoices = async () => {
    try {
      const r = await invoiceService.getAll();
      setOutgoingInvoices(r.data || []);
    } catch (error) {
      console.error('Error fetching outgoing invoices:', error);
      toast.error('Failed to load outgoing invoices');
    }
  };

  const fetchReceivingInvoices = async (search = searchQuery) => {
    try {
      const params = {};
      if (search) params.search = search;
      if (paymentStatusFilter && paymentStatusFilter !== 'all') params.paymentStatus = paymentStatusFilter;
      const r = await api.get('/receiving-invoices', { params });
      setReceivingInvoices(r.data.data || []);
    } catch (error) {
      console.error('Error fetching receiving invoices:', error);
      toast.error('Failed to load receiving invoices');
    }
  };

  const fetchProducts = async () => {
    try {
      const r = await productService.getAll();
      setProducts(r.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchDailySummary = async (date) => {
    try {
      setLoading(p => ({ ...p, daily: true }));
      const r = await api.get('/receiving-invoices/daily-report', { params: { date } });
      setDailySummary(r.data);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      toast.error('Failed to load daily summary');
    } finally { 
      setLoading(p => ({ ...p, daily: false })); 
    }
  };

  // ── HELPERS ───────────────────────────────────────────────────────────
  const handleSearch = (v) => { setSearchQuery(v); debouncedSearch(v); };
  const handlePaymentStatusFilter = (s) => { setPaymentStatusFilter(s); fetchReceivingInvoices(); };
  const toggleExpansion = (id) => setExpandedInvoices(p => ({ ...p, [id]: !p[id] }));
  const calculateTotal = (items) => items.reduce((s, i) => s + i.itemTotal, 0);
  const calculateVariance = (items, actual) => parseFloat(actual || 0) - calculateTotal(items);

  // ── VIEW DIALOGS ──────────────────────────────────────────────────────
  const handleViewOutgoingInvoice = async (id) => {
    try {
      const r = await invoiceService.getById(id);
      setSelectedInvoice(r.data);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleViewReceivingInvoice = async (id) => {
    try {
      const r = await api.get(`/receiving-invoices/${id}`);
      setSelectedInvoice(r.data.data);
      setIsViewReceivingDialogOpen(true);
    } catch (error) {
      console.error('Error fetching receiving invoice:', error);
      toast.error('Failed to load receiving invoice details');
    }
  };

  // ── PDF DOWNLOAD ──────────────────────────────────────────────────────
  const handleDownloadReceivingPDF = (invoice) => {
    try {
      const doc = generateReceivingInvoicePDF(invoice, businessInfo);
      doc.save(`Receiving-Invoice-${invoice.invoiceNumber}-${formatDate(invoice.date)}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Error generating PDF');
    }
  };

  // ── STATUS UPDATES ────────────────────────────────────────────────────
  const handleUpdateInvoiceStatus = async (id, status) => {
    try {
      await invoiceService.updateStatus(id, status, status === 'paid' ? new Date() : null);
      fetchOutgoingInvoices();
      if (selectedInvoice?._id === id) handleViewOutgoingInvoice(id);
      toast.success('Invoice status updated');
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
      if (selectedInvoice?._id === id) {
        const r = await api.get(`/receiving-invoices/${id}`);
        setSelectedInvoice(r.data.data);
      }
      toast.success('Payment status updated');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  // ── DELETE RECEIVING INVOICE (Admin only) ─────────────────────────────
  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      setLoading(p => ({ ...p, deleting: true }));
      await api.delete(`/invoices/receiving/${invoiceToDelete._id}`);
      toast.success('Invoice deleted. Stock has been reversed.');
      setIsDeleteConfirmOpen(false);
      setInvoiceToDelete(null);
      fetchReceivingInvoices();
      fetchProducts();
      fetchDailySummary(selectedDate);
    } catch (err) {
      toast.error('Error deleting invoice: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(p => ({ ...p, deleting: false }));
    }
  };

  // ── EDIT RECEIVING INVOICE (Admin only) ───────────────────────────────
  const openEditDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setEditFormData({
      invoiceNumber: invoice.invoiceNumber,
      date: new Date(invoice.date).toISOString().split('T')[0],
      supplier: invoice.supplier,
      items: invoice.items.map(i => ({
        productId: i.product?._id || i.product,
        productName: i.productName,
        quantity: i.quantity,
        buyingPrice: i.buyingPrice,
        previousBuyingPrice: i.previousBuyingPrice,
        itemTotal: i.itemTotal,
        priceChanged: i.priceChanged
      })),
      actualInvoiceAmount: invoice.actualInvoiceAmount.toString(),
      varianceReason: invoice.varianceReason || '',
      paymentStatus: invoice.paymentStatus,
      notes: invoice.notes || ''
    });
    setEditCurrentItem({ productId: '', quantity: '', buyingPrice: '' });
    setEditFormErrors({});
    setIsEditReceivingDialogOpen(true);
  };

  const handleEditProductSelect = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setEditCurrentItem({ productId, quantity: '', buyingPrice: product.buyingPrice.toString() });
      setEditFormErrors(p => ({ ...p, productId: '' }));
    }
  };

  const addEditItem = () => {
    const errors = {};
    if (!editCurrentItem.productId) errors.productId = 'Product is required';
    if (!editCurrentItem.quantity || parseFloat(editCurrentItem.quantity) <= 0) errors.quantity = 'Valid quantity required';
    if (!editCurrentItem.buyingPrice || parseFloat(editCurrentItem.buyingPrice) < 0) errors.buyingPrice = 'Valid price required';
    if (Object.keys(errors).length > 0) { setEditFormErrors(errors); return; }

    const product = products.find(p => p._id === editCurrentItem.productId);
    if (!product) { toast.error('Product not found'); return; }

    const existing = editFormData.items.findIndex(i => i.productId === editCurrentItem.productId);
    if (existing > -1) {
      const updated = [...editFormData.items];
      updated[existing].quantity += parseFloat(editCurrentItem.quantity);
      updated[existing].buyingPrice = parseFloat(editCurrentItem.buyingPrice);
      updated[existing].itemTotal = updated[existing].quantity * updated[existing].buyingPrice;
      updated[existing].priceChanged = Math.abs(updated[existing].buyingPrice - (updated[existing].previousBuyingPrice || product.buyingPrice)) > 0.01;
      setEditFormData(p => ({ ...p, items: updated }));
    } else {
      const qty = parseFloat(editCurrentItem.quantity);
      const price = parseFloat(editCurrentItem.buyingPrice);
      setEditFormData(p => ({
        ...p,
        items: [...p.items, {
          productId: editCurrentItem.productId,
          productName: product.name,
          quantity: qty,
          buyingPrice: price,
          previousBuyingPrice: product.buyingPrice,
          itemTotal: qty * price,
          priceChanged: Math.abs(price - product.buyingPrice) > 0.01
        }]
      }));
    }
    setEditCurrentItem({ productId: '', quantity: '', buyingPrice: '' });
    setEditFormErrors({});
  };

  const removeEditItem = (index) => {
    setEditFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
  };

  const submitEdit = async () => {
    const errors = {};
    if (!editFormData.invoiceNumber.trim()) errors.invoiceNumber = 'Required';
    if (!editFormData.supplier.trim()) errors.supplier = 'Required';
    if (editFormData.items.length === 0) errors.items = 'At least one product is required';
    if (!editFormData.actualInvoiceAmount || parseFloat(editFormData.actualInvoiceAmount) < 0) errors.actualInvoiceAmount = 'Valid amount required';
    const variance = calculateVariance(editFormData.items, editFormData.actualInvoiceAmount);
    if (Math.abs(variance) > 0.01 && !editFormData.varianceReason.trim()) errors.varianceReason = 'Variance reason required';
    if (Object.keys(errors).length > 0) { setEditFormErrors(errors); toast.error('Please fix the errors'); return; }

    try {
      setLoading(p => ({ ...p, submitting: true }));
      await api.put(`/invoices/receiving/${selectedInvoice._id}`, {
        invoiceNumber: editFormData.invoiceNumber.trim(),
        date: editFormData.date,
        supplier: editFormData.supplier.trim(),
        items: editFormData.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          buyingPrice: i.buyingPrice
        })),
        actualInvoiceAmount: parseFloat(editFormData.actualInvoiceAmount),
        varianceReason: Math.abs(variance) > 0.01 ? editFormData.varianceReason.trim() : null,
        paymentStatus: editFormData.paymentStatus,
        notes: editFormData.notes.trim() || null
      });
      toast.success('Invoice updated. Stock has been adjusted.');
      setIsEditReceivingDialogOpen(false);
      fetchReceivingInvoices();
      fetchProducts();
      fetchDailySummary(selectedDate);
    } catch (err) {
      toast.error('Error updating invoice: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(p => ({ ...p, submitting: false }));
    }
  };

  // ── RECEIVE GOODS ─────────────────────────────────────────────────────
  const handleProductSelect = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setCurrentItem({ productId, quantity: '', buyingPrice: product.buyingPrice.toString() });
      setFormErrors(p => ({ ...p, productId: '' }));
    }
  };

  const validateItem = () => {
    const errors = {};
    if (!currentItem.productId) errors.productId = 'Product is required';
    if (!currentItem.quantity || parseFloat(currentItem.quantity) <= 0) errors.quantity = 'Valid quantity required';
    if (!currentItem.buyingPrice || parseFloat(currentItem.buyingPrice) < 0) errors.buyingPrice = 'Valid price required';
    return errors;
  };

  const addItemToList = () => {
    const errors = validateItem();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const product = products.find(p => p._id === currentItem.productId);
    if (!product) { toast.error('Product not found'); return; }

    const existing = receiveFormData.items.findIndex(i => i.productId === currentItem.productId);
    if (existing > -1) {
      const updated = [...receiveFormData.items];
      updated[existing].quantity += parseFloat(currentItem.quantity);
      updated[existing].buyingPrice = parseFloat(currentItem.buyingPrice);
      updated[existing].itemTotal = updated[existing].quantity * updated[existing].buyingPrice;
      updated[existing].priceChanged = Math.abs(updated[existing].buyingPrice - updated[existing].previousBuyingPrice) > 0.01;
      setReceiveFormData(p => ({ ...p, items: updated }));
    } else {
      const qty = parseFloat(currentItem.quantity);
      const price = parseFloat(currentItem.buyingPrice);
      setReceiveFormData(p => ({
        ...p,
        items: [...p.items, {
          productId: currentItem.productId,
          productName: product.name,
          quantity: qty,
          buyingPrice: price,
          previousBuyingPrice: product.buyingPrice,
          itemTotal: qty * price,
          priceChanged: Math.abs(price - product.buyingPrice) > 0.01
        }]
      }));
    }
    setCurrentItem({ productId: '', quantity: '', buyingPrice: '' });
    setFormErrors({});
  };

  const removeItem = (index) => setReceiveFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }));

  const validateReceiveForm = () => {
    const errors = {};
    if (!receiveFormData.invoiceNumber.trim()) errors.invoiceNumber = 'Required';
    if (!receiveFormData.supplier.trim()) errors.supplier = 'Required';
    if (receiveFormData.items.length === 0) errors.items = 'At least one product is required';
    if (!receiveFormData.actualInvoiceAmount || parseFloat(receiveFormData.actualInvoiceAmount) < 0) errors.actualInvoiceAmount = 'Valid amount required';
    const variance = calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount);
    if (Math.abs(variance) > 0.01 && !receiveFormData.varianceReason.trim()) errors.varianceReason = 'Variance reason required';
    return errors;
  };

  const handleReceiveGoods = async () => {
    const errors = validateReceiveForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); toast.error('Please fix the errors'); return; }
    setLoading(p => ({ ...p, submitting: true }));
    try {
      const variance = calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount);
      const r = await api.post('/receiving-invoices', {
        invoiceNumber: receiveFormData.invoiceNumber.trim(),
        date: receiveFormData.date,
        supplier: receiveFormData.supplier.trim(),
        items: receiveFormData.items.map(i => ({ productId: i.productId, quantity: i.quantity, buyingPrice: i.buyingPrice })),
        actualInvoiceAmount: parseFloat(receiveFormData.actualInvoiceAmount),
        varianceReason: Math.abs(variance) > 0.01 ? receiveFormData.varianceReason.trim() : null,
        paymentStatus: receiveFormData.paymentStatus,
        notes: receiveFormData.notes.trim() || null
      });
      if (r.data.success) {
        if (r.data.priceChanges?.length > 0) {
          setPriceChangeNotifications(prev => [
            ...r.data.priceChanges.map(c => ({
              id: Date.now() + Math.random(),
              productName: c.productName,
              previousPrice: c.previousPrice,
              newPrice: c.newPrice,
              invoiceNumber: receiveFormData.invoiceNumber,
              date: new Date()
            })),
            ...prev
          ]);
        }
        toast.success('Goods received successfully! Inventory updated.');
        setIsReceiveDialogOpen(false);
        setReceiveFormData(emptyReceiveForm);
        setCurrentItem({ productId: '', quantity: '', buyingPrice: '' });
        setFormErrors({});
        fetchReceivingInvoices();
        fetchProducts();
        fetchDailySummary(selectedDate);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to receive goods');
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
    } finally {
      setLoading(p => ({ ...p, submitting: false }));
    }
  };

  const dismissNotification = (notificationId) => {
    setPriceChangeNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const dismissAllNotifications = () => {
    setPriceChangeNotifications([]);
  };

  // ── BADGE HELPERS ─────────────────────────────────────────────────────
  const getTypeBadge = (type) => {
    const map = {
      invoice: ['default', 'Invoice'],
      credit_note: ['success', 'Credit Note'],
      debit_note: ['warning', 'Debit Note']
    };
    const [variant, label] = map[type] || ['default', type];
    return <Badge variant={variant}>{label}</Badge>;
  };
  
  const getStatusBadge = (status) => {
    const map = {
      draft: ['secondary', 'Draft'],
      sent: ['default', 'Sent'],
      paid: ['success', 'Paid'],
      cancelled: ['destructive', 'Cancelled']
    };
    const [variant, label] = map[status] || ['default', status];
    return <Badge variant={variant}>{label}</Badge>;
  };
  
  const getPaymentBadge = (status) =>
    status === 'paid'
      ? <Badge variant="success">Paid</Badge>
      : <Badge variant="destructive">Unpaid</Badge>;

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

  // ── SHARED ITEM ADDER (reused for both receive + edit dialogs) ─────────
  const ItemAdderRow = ({ currentItm, setCurrentItm, onAdd, errors, setErrors }) => (
    <div className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-lg">
      <div className="col-span-5 space-y-2">
        <Label>Product <span className="text-red-500">*</span></Label>
        <Select value={currentItm.productId} onValueChange={(id) => {
          const p = products.find(p => p._id === id);
          if (p) { 
            setCurrentItm({ productId: id, quantity: '', buyingPrice: p.buyingPrice.toString() }); 
            setErrors(e => ({ ...e, productId: '' })); 
          }
        }}>
          <SelectTrigger className={errors.productId ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map(p => (
              <SelectItem key={p._id} value={p._id}>
                <div className="flex flex-col">
                  <span>{p.name}</span>
                  <span className="text-xs text-gray-500">
                    Stock: {p.quantity} {p.baseUnit} | Current: {formatCurrency(p.buyingPrice)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.productId && <p className="text-sm text-red-500">{errors.productId}</p>}
      </div>
      <div className="col-span-3 space-y-2">
        <Label>Quantity <span className="text-red-500">*</span></Label>
        <Input type="number" step="0.01" min="0.01" placeholder="0"
          value={currentItm.quantity}
          onChange={(e) => { setCurrentItm(p => ({ ...p, quantity: e.target.value })); setErrors(p => ({ ...p, quantity: '' })); }}
          className={errors.quantity ? 'border-red-500' : ''} />
        {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
      </div>
      <div className="col-span-3 space-y-2">
        <Label>Buying Price <span className="text-red-500">*</span></Label>
        <Input type="number" step="0.01" min="0" placeholder="0.00"
          value={currentItm.buyingPrice}
          onChange={(e) => { setCurrentItm(p => ({ ...p, buyingPrice: e.target.value })); setErrors(p => ({ ...p, buyingPrice: '' })); }}
          className={errors.buyingPrice ? 'border-red-500' : ''} />
        {errors.buyingPrice && <p className="text-sm text-red-500">{errors.buyingPrice}</p>}
      </div>
      <div className="col-span-1">
        <Button type="button" onClick={onAdd} className="w-full h-10" disabled={!currentItm.productId}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────
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
              <Button variant="ghost" size="sm" onClick={dismissAllNotifications}>
                Dismiss All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priceChangeNotifications.slice(0, 3).map((n) => (
                <Alert key={n.id} className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex-1">
                      <strong>Price Change:</strong> {n.productName} buying price changed from{' '}
                      {formatCurrency(n.previousPrice)} to {formatCurrency(n.newPrice)}{' '}
                      (Invoice: {n.invoiceNumber}) - {formatDateTime(n.date)}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => dismissNotification(n.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
              {priceChangeNotifications.length > 3 && (
                <p className="text-sm text-gray-600 text-center">
                  ... and {priceChangeNotifications.length - 3} more notifications
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="to-us" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="to-us">
            <FileText className="h-4 w-4 mr-2" />Invoices To Us (Receiving)
          </TabsTrigger>
          <TabsTrigger value="from-us">
            <FileText className="h-4 w-4 mr-2" />Invoices From Us (Outgoing)
          </TabsTrigger>
        </TabsList>

        {/* ── RECEIVING TAB ─────────────────────────────────────────── */}
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
                  <Button variant="outline" size="sm" onClick={() => toast.info('Export feature coming soon')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.daily ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
                </div>
              ) : dailySummary ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-sm text-gray-600">Total Invoices</p>
                      <p className="text-2xl font-bold text-emerald-600">{dailySummary.summary?.totalInvoices || 0}</p>
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
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-sm text-gray-600">Unique Suppliers</p>
                      <p className="text-xl font-bold text-emerald-600">{dailySummary.summary?.uniqueSuppliers || 0}</p>
                    </div>
                    <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-xl font-bold text-pink-600">{dailySummary.summary?.totalItems || 0}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No data available for selected date</div>
              )}
            </CardContent>
          </Card>

          {/* Receiving Invoices Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Received Invoices</CardTitle>
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
                <Button onClick={() => setIsReceiveDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Receive Goods
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
                      <TableHead>Calculated</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Payment</TableHead>
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
                              <Button variant="ghost" size="sm" onClick={() => toggleExpansion(invoice._id)}>
                                {expandedInvoices[invoice._id] ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell>{invoice.supplier}</TableCell>
                            <TableCell>{formatCurrency(invoice.calculatedTotal)}</TableCell>
                            <TableCell>{formatCurrency(invoice.actualInvoiceAmount)}</TableCell>
                            <TableCell>
                              <span className={`font-semibold ${invoice.variance !== 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {formatCurrency(invoice.variance)}
                              </span>
                            </TableCell>
                            <TableCell>{getPaymentBadge(invoice.paymentStatus)}</TableCell>
                            <TableCell>{invoice.receivedByName}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline" onClick={() => handleViewReceivingInvoice(invoice._id)} title="View">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDownloadReceivingPDF(invoice)} title="Download PDF">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handlePrintInvoice?.(invoice)} title="Print">
                                  <Printer className="h-4 w-4" />
                                </Button>
                                {isAdmin && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => openEditDialog(invoice)} title="Edit Invoice">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-red-600 border-red-300 hover:bg-red-50" 
                                      onClick={() => handleDeleteClick(invoice)} 
                                      title="Delete Invoice"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {invoice.paymentStatus === 'unpaid' && (
                                  <Button size="sm" variant="default" onClick={() => handleUpdatePaymentStatus(invoice._id, 'paid')}>
                                    Mark Paid
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedInvoices[invoice._id] && invoice.items?.length > 0 && (
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
                                          <TableCell className="text-right font-medium">{formatCurrency(item.itemTotal)}</TableCell>
                                          <TableCell>
                                            {item.priceChanged
                                              ? <Badge variant="warning">Changed from {formatCurrency(item.previousBuyingPrice)}</Badge>
                                              : <Badge variant="secondary">No Change</Badge>}
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

        {/* ── OUTGOING TAB ──────────────────────────────────────────── */}
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
                              <Button size="sm" variant="outline" onClick={() => handleViewOutgoingInvoice(invoice._id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => window.print()}>
                                <Printer className="h-4 w-4" />
                              </Button>
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <Button size="sm" onClick={() => handleUpdateInvoiceStatus(invoice._id, 'paid')}>
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

      {/* ── RECEIVE GOODS DIALOG ───────────────────────────────────────── */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Goods from Supplier</DialogTitle>
            <DialogDescription>
              Add multiple products from the same supplier invoice. The system will automatically update inventory and buying prices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Header info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Number <span className="text-red-500">*</span></Label>
                  <Input placeholder="INV-2024-001" 
                    value={receiveFormData.invoiceNumber}
                    onChange={(e) => { 
                      setReceiveFormData(p => ({ ...p, invoiceNumber: e.target.value })); 
                      setFormErrors(p => ({ ...p, invoiceNumber: '' })); 
                    }}
                    className={formErrors.invoiceNumber ? 'border-red-500' : ''} />
                  {formErrors.invoiceNumber && <p className="text-sm text-red-500">{formErrors.invoiceNumber}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={receiveFormData.date} 
                    onChange={(e) => setReceiveFormData(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Supplier Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Supplier name" 
                    value={receiveFormData.supplier}
                    onChange={(e) => { 
                      setReceiveFormData(p => ({ ...p, supplier: e.target.value })); 
                      setFormErrors(p => ({ ...p, supplier: '' })); 
                    }}
                    className={formErrors.supplier ? 'border-red-500' : ''} />
                  {formErrors.supplier && <p className="text-sm text-red-500">{formErrors.supplier}</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Add product row */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Add Products</h3>
                {formErrors.items && <p className="text-sm text-red-500">{formErrors.items}</p>}
              </div>
              <ItemAdderRow
                currentItm={currentItem} setCurrentItm={setCurrentItem}
                onAdd={addItemToList} errors={formErrors} setErrors={setFormErrors}
              />
              {currentItem.productId && currentItem.buyingPrice && products.find(p => p._id === currentItem.productId) && (
                Math.abs(parseFloat(currentItem.buyingPrice) - (products.find(p => p._id === currentItem.productId)?.buyingPrice || 0)) > 0.01 && (
                  <div className="text-sm p-2 bg-emerald-50 rounded border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-800">
                        ⚠ Price will be updated from {formatCurrency(products.find(p => p._id === currentItem.productId)?.buyingPrice)} to {formatCurrency(parseFloat(currentItem.buyingPrice))}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Items list */}
            {receiveFormData.items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b font-semibold flex justify-between">
                  <span>Items Added ({receiveFormData.items.length})</span>
                  {receiveFormData.items.some(item => item.priceChanged) && (
                    <Badge variant="warning">⚠ Some prices will be updated</Badge>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiveFormData.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{item.productName}</span>
                              {item.priceChanged && (
                                <span className="text-xs text-gray-500">
                                  Was: {formatCurrency(item.previousBuyingPrice)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.buyingPrice)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.itemTotal)}</TableCell>
                          <TableCell>
                            {item.priceChanged
                              ? <Badge variant="warning">Price Changed</Badge>
                              : <Badge variant="secondary">No Change</Badge>}
                          </TableCell>
                          <TableCell>
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(i)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="bg-gray-50 p-3 border-t font-semibold flex justify-between">
                  <span>Calculated Total:</span>
                  <span>{formatCurrency(calculateTotal(receiveFormData.items))}</span>
                </div>
              </div>
            )}

            {/* Amount & payment */}
            {receiveFormData.items.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold">Invoice Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Actual Invoice Amount <span className="text-red-500">*</span></Label>
                      <Input type="number" step="0.01" min="0" placeholder="0.00"
                        value={receiveFormData.actualInvoiceAmount}
                        onChange={(e) => { 
                          setReceiveFormData(p => ({ ...p, actualInvoiceAmount: e.target.value })); 
                          setFormErrors(p => ({ ...p, actualInvoiceAmount: '' })); 
                        }}
                        className={formErrors.actualInvoiceAmount ? 'border-red-500' : ''} />
                      {formErrors.actualInvoiceAmount && <p className="text-sm text-red-500">{formErrors.actualInvoiceAmount}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Variance</Label>
                      <div className={`p-3 rounded border text-center ${Math.abs(calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount)) > 0.01 ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
                        <div className="text-lg font-bold">
                          {formatCurrency(calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount))}
                        </div>
                        <div className="text-xs text-gray-600">
                          {calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount) > 0 ? 'Overpayment' : 
                           calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount) < 0 ? 'Underpayment' : 'Exact Match'}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Variance Reason {Math.abs(calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount)) > 0.01 && <span className="text-red-500">*</span>}</Label>
                      <Textarea placeholder="Explain any difference..." rows={2}
                        value={receiveFormData.varianceReason}
                        onChange={(e) => { 
                          setReceiveFormData(p => ({ ...p, varianceReason: e.target.value })); 
                          setFormErrors(p => ({ ...p, varianceReason: '' })); 
                        }}
                        className={formErrors.varianceReason ? 'border-red-500' : ''} />
                      {formErrors.varianceReason && <p className="text-sm text-red-500">{formErrors.varianceReason}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Status</Label>
                      <Select value={receiveFormData.paymentStatus} onValueChange={(v) => setReceiveFormData(p => ({ ...p, paymentStatus: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input placeholder="Additional notes..." value={receiveFormData.notes} 
                        onChange={(e) => setReceiveFormData(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Summary Alert */}
            {receiveFormData.items.length > 0 && (
              <Alert className={Math.abs(calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount)) > 0.01 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
                {Math.abs(calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount)) > 0.01 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      <strong>Variance Detected:</strong> There's a difference of {formatCurrency(calculateVariance(receiveFormData.items, receiveFormData.actualInvoiceAmount))} between calculated and actual amounts.
                      {isAdmin ? ' You will be notified.' : ' Admin will be notified.'}
                    </AlertDescription>
                  </>
                ) : (
                  <AlertDescription className="text-green-700">
                    <strong>Perfect Match:</strong> Calculated total matches the actual invoice amount.
                  </AlertDescription>
                )}
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { 
              setIsReceiveDialogOpen(false); 
              setReceiveFormData(emptyReceiveForm); 
              setFormErrors({}); 
            }}>
              Cancel
            </Button>
            <Button onClick={handleReceiveGoods} disabled={loading.submitting || receiveFormData.items.length === 0}>
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
        </DialogContent>
      </Dialog>

      {/* ── EDIT RECEIVING INVOICE DIALOG (Admin only) ─────────────────── */}
      <Dialog open={isEditReceivingDialogOpen} onOpenChange={setIsEditReceivingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Receiving Invoice — {selectedInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Changes will reverse the original stock and re-apply it with the updated quantities and prices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number <span className="text-red-500">*</span></Label>
                <Input value={editFormData.invoiceNumber}
                  onChange={(e) => { 
                    setEditFormData(p => ({ ...p, invoiceNumber: e.target.value })); 
                    setEditFormErrors(p => ({ ...p, invoiceNumber: '' })); 
                  }}
                  className={editFormErrors.invoiceNumber ? 'border-red-500' : ''} />
                {editFormErrors.invoiceNumber && <p className="text-sm text-red-500">{editFormErrors.invoiceNumber}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editFormData.date} 
                  onChange={(e) => setEditFormData(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Supplier <span className="text-red-500">*</span></Label>
                <Input value={editFormData.supplier}
                  onChange={(e) => { 
                    setEditFormData(p => ({ ...p, supplier: e.target.value })); 
                    setEditFormErrors(p => ({ ...p, supplier: '' })); 
                  }}
                  className={editFormErrors.supplier ? 'border-red-500' : ''} />
                {editFormErrors.supplier && <p className="text-sm text-red-500">{editFormErrors.supplier}</p>}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Products</h3>
                {editFormErrors.items && <p className="text-sm text-red-500">{editFormErrors.items}</p>}
              </div>
              <ItemAdderRow
                currentItm={editCurrentItem} setCurrentItm={setEditCurrentItem}
                onAdd={addEditItem} errors={editFormErrors} setErrors={setEditFormErrors}
              />

              {editFormData.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b font-semibold">
                    Items ({editFormData.items.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editFormData.items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.buyingPrice)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(item.itemTotal)}</TableCell>
                            <TableCell>
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeEditItem(i)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="bg-gray-50 p-3 border-t font-semibold flex justify-between">
                    <span>Calculated Total:</span>
                    <span>{formatCurrency(calculateTotal(editFormData.items))}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Actual Invoice Amount <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.01" min="0"
                  value={editFormData.actualInvoiceAmount}
                  onChange={(e) => { 
                    setEditFormData(p => ({ ...p, actualInvoiceAmount: e.target.value })); 
                    setEditFormErrors(p => ({ ...p, actualInvoiceAmount: '' })); 
                  }}
                  className={editFormErrors.actualInvoiceAmount ? 'border-red-500' : ''} />
                {editFormErrors.actualInvoiceAmount && <p className="text-sm text-red-500">{editFormErrors.actualInvoiceAmount}</p>}
              </div>
              <div className="space-y-2">
                <Label>Variance</Label>
                <div className={`p-3 rounded border text-center ${Math.abs(calculateVariance(editFormData.items, editFormData.actualInvoiceAmount)) > 0.01 ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
                  <div className="text-lg font-bold">
                    {formatCurrency(calculateVariance(editFormData.items, editFormData.actualInvoiceAmount))}
                  </div>
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Variance Reason {Math.abs(calculateVariance(editFormData.items, editFormData.actualInvoiceAmount)) > 0.01 && <span className="text-red-500">*</span>}</Label>
                <Textarea rows={2} value={editFormData.varianceReason}
                  onChange={(e) => { 
                    setEditFormData(p => ({ ...p, varianceReason: e.target.value })); 
                    setEditFormErrors(p => ({ ...p, varianceReason: '' })); 
                  }}
                  className={editFormErrors.varianceReason ? 'border-red-500' : ''} />
                {editFormErrors.varianceReason && <p className="text-sm text-red-500">{editFormErrors.varianceReason}</p>}
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={editFormData.paymentStatus} onValueChange={(v) => setEditFormData(p => ({ ...p, paymentStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={editFormData.notes} onChange={(e) => setEditFormData(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Saving will reverse all original stock additions and re-apply with the updated quantities and prices.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditReceivingDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={loading.submitting || editFormData.items.length === 0}>
              {loading.submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRM DIALOG ──────────────────────────────────────── */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Receiving Invoice?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p>Are you sure you want to delete invoice <strong>"{invoiceToDelete?.invoiceNumber}"</strong>?</p>
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                This will permanently delete the invoice and <strong>reverse all stock additions</strong> that were made when it was received. This cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading.deleting}>
              {loading.deleting ? 'Deleting...' : 'Delete & Reverse Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── VIEW RECEIVING INVOICE DIALOG ─────────────────────────────── */}
      <Dialog open={isViewReceivingDialogOpen} onOpenChange={setIsViewReceivingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receiving Invoice Details — {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && selectedInvoice.items && (
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
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div><span className="font-semibold">Supplier:</span> {selectedInvoice.supplier}</div>
                <div><span className="font-semibold">Invoice Date:</span> {formatDate(selectedInvoice.date)}</div>
                <div><span className="font-semibold">Received By:</span> {selectedInvoice.receivedByName}</div>
                <div><span className="font-semibold">Date Received:</span> {formatDate(selectedInvoice.createdAt)}</div>
              </div>

              {/* Items Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Buying Price</TableHead>
                    <TableHead className="text-right">Prev Price</TableHead>
                    <TableHead className="text-right">Item Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.buyingPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.previousBuyingPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.itemTotal)}</TableCell>
                      <TableCell>
                        {item.priceChanged
                          ? <Badge variant="warning">Price Changed</Badge>
                          : <Badge variant="secondary">No Change</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
                    <div className={`flex justify-between font-bold text-lg border-t pt-2 ${selectedInvoice.variance !== 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      <span>Variance:</span>
                      <span>{formatCurrency(selectedInvoice.variance)}</span>
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
                <div className="p-3 bg-gray-50 rounded">
                  <span className="font-semibold text-sm">Notes: </span>
                  <span className="text-sm text-gray-600">{selectedInvoice.notes}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsViewReceivingDialogOpen(false)}>Close</Button>
                <Button variant="outline" onClick={() => handleDownloadReceivingPDF(selectedInvoice)}>
                  <Download className="mr-2 h-4 w-4" />Download PDF
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />Print
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

      {/* ── VIEW OUTGOING INVOICE DIALOG ──────────────────────────────── */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
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
                  <p><span className="font-semibold">Date:</span> {formatDate(selectedInvoice.createdAt)}</p>
                  {selectedInvoice.dueDate && (
                    <p><span className="font-semibold">Due Date:</span> {formatDate(selectedInvoice.dueDate)}</p>
                  )}
                  <p><span className="font-semibold">Status:</span> {getStatusBadge(selectedInvoice.status)}</p>
                </div>
              </div>

              {/* Items Table */}
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
                  {selectedInvoice.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />Print/Download
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