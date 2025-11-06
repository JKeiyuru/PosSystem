// client/src/pages/Customers.jsx - Enhanced with Sales History

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
import { Plus, Edit, Trash2, Search, CreditCard, DollarSign, History, Eye } from 'lucide-react';
import { customerService } from '../services/customer.service';
import { saleService } from '../services/sale.service';
import { formatCurrency, formatDateTime } from '../lib/utils';
import api from '../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [isSalesHistoryDialogOpen, setIsSalesHistoryDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [salesHistory, setSalesHistory] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    customerType: 'regular',
    creditLimit: '0',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll({ search: searchQuery });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreditClick = async (customer) => {
    try {
      setSelectedCustomer(customer);
      
      const response = await saleService.getAll({
        customer: customer._id,
        paymentStatus: 'unpaid,partial'
      });
      
      setCustomerSales(response.data.filter(sale => sale.amountDue > 0));
      setIsCreditDialogOpen(true);
    } catch (error) {
      console.error('Error fetching customer sales:', error);
    }
  };

  const handleViewSalesHistory = async (customer) => {
    try {
      setSelectedCustomer(customer);
      const response = await api.get(`/customers/${customer._id}/sales-history`);
      setSalesHistory(response.data.data);
      setIsSalesHistoryDialogOpen(true);
    } catch (error) {
      console.error('Error fetching sales history:', error);
      alert('Error loading sales history');
    }
  };

  const handlePayment = async (saleId) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      await saleService.updatePayment(saleId, { amountPaid: parseFloat(paymentAmount) });
      alert('Payment recorded successfully');
      
      await handleCreditClick(selectedCustomer);
      await fetchCustomers();
      setPaymentAmount('');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer._id, formData);
      } else {
        await customerService.create(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      address: customer.address || '',
      customerType: customer.customerType,
      creditLimit: customer.creditLimit,
      notes: customer.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.delete(id);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      customerType: 'regular',
      creditLimit: '0',
      notes: ''
    });
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Current Credit</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={customer.customerType === 'wholesale' ? 'default' : 'secondary'}>
                      {customer.customerType}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(customer.totalPurchases)}</TableCell>
                  <TableCell>
                    {customer.currentCredit > 0 ? (
                      <button
                        onClick={() => handleCreditClick(customer)}
                        className="text-red-600 font-semibold flex items-center hover:underline cursor-pointer"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        {formatCurrency(customer.currentCredit)}
                      </button>
                    ) : (
                      <span className="text-green-600">{formatCurrency(0)}</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(customer.creditLimit)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewSalesHistory(customer)}
                        title="View Sales History"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(customer._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerType">Customer Type</Label>
                <Select 
                  value={formData.customerType} 
                  onValueChange={(value) => setFormData({...formData, customerType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCustomer ? 'Update' : 'Create'} Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credit Payment Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Credit Details - {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Credit Outstanding</p>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(selectedCustomer?.currentCredit || 0)}
                    </p>
                  </div>
                  <CreditCard className="h-12 w-12 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="font-semibold mb-3">Unpaid Sales</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell>{formatDateTime(sale.saleDate)}</TableCell>
                      <TableCell>{formatCurrency(sale.total)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(sale.amountPaid)}</TableCell>
                      <TableCell className="text-red-600 font-semibold">{formatCurrency(sale.amountDue)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {sale.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            className="w-24"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                          <Button
                            size="sm"
                            onClick={() => handlePayment(sale._id)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {customerSales.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No unpaid sales found for this customer
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales History Dialog */}
      <Dialog open={isSalesHistoryDialogOpen} onOpenChange={setIsSalesHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Sales History - {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          {salesHistory && (
            <div className="space-y-4">
              {/* Statistics Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Total Sales</div>
                    <div className="text-2xl font-bold">{salesHistory.statistics.totalSales}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Total Purchased</div>
                    <div className="text-2xl font-bold">{formatCurrency(salesHistory.statistics.totalPurchases)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Total Paid</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(salesHistory.statistics.totalPaid)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Current Credit</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(salesHistory.statistics.currentCredit)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Table */}
              <div>
                <h3 className="font-semibold mb-3">Recent Sales</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesHistory.sales.map((sale) => (
                      <TableRow key={sale._id}>
                        <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                        <TableCell>{formatDateTime(sale.saleDate)}</TableCell>
                        <TableCell>{sale.items.length} items</TableCell>
                        <TableCell>{formatCurrency(sale.total)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(sale.amountPaid)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(sale.amountDue)}</TableCell>
                        <TableCell className="capitalize">{sale.paymentMethod.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'}>
                            {sale.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Payment Transactions */}
              {salesHistory.payments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Credit Payment History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Received By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesHistory.payments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell className="font-medium">{payment.transactionNumber}</TableCell>
                          <TableCell>{formatDateTime(payment.paymentDate)}</TableCell>
                          <TableCell className="text-green-600 font-semibold">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="capitalize">{payment.paymentMethod.replace('_', ' ')}</TableCell>
                          <TableCell>{payment.receivedByName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}