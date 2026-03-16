// client/src/pages/Customers.jsx
// VERSION 3: Complete with all original features + cashier statement downloads + role-based permissions

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2, Search, CreditCard, History, FileText, Download } from 'lucide-react';
import { customerService } from '../services/customer.service';
import { formatCurrency, formatDateTime } from '../lib/utils';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CustomerStatement from '../components/customers/CustomerStatement';
import { toast } from 'sonner';

export default function Customers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCashier = user?.role === 'cashier';
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSalesHistoryDialogOpen, setIsSalesHistoryDialogOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [salesHistory, setSalesHistory] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    customerType: 'regular', creditLimit: '0', notes: '',
  });

  useEffect(() => {
    fetchCustomers();
    fetchBusinessInfo();
  }, [searchQuery]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll({ search: searchQuery });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchBusinessInfo = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.success) setBusinessInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  const handleCreditClick = (customer) => {
    navigate('/debts', {
      state: { customerId: customer._id, customerName: customer.name },
    });
  };

  const handleViewSalesHistory = async (customer) => {
    try {
      setSelectedCustomer(customer);
      const response = await api.get(`/customers/${customer._id}/sales-history`);
      setSalesHistory(response.data.data);
      setIsSalesHistoryDialogOpen(true);
    } catch (error) {
      console.error('Error fetching sales history:', error);
      toast.error('Error loading sales history');
    }
  };

  const handleOpenStatement = (customer) => {
    setSelectedCustomer(customer);
    setIsStatementOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Customer name is required');
        return;
      }
      if (!formData.phone.trim()) {
        toast.error('Phone number is required');
        return;
      }

      const dataToSubmit = {
        ...formData,
        creditLimit: isAdmin ? parseFloat(formData.creditLimit) || 0 : 0, // Only admin can set credit limit
      };

      if (editingCustomer) {
        await customerService.update(editingCustomer._id, dataToSubmit);
        toast.success('Customer updated successfully');
      } else {
        await customerService.create(dataToSubmit);
        toast.success('Customer created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Error saving customer: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (customer) => {
    if (!isAdmin) {
      toast.error('You do not have permission to edit customers');
      return;
    }
    setEditingCustomer(customer);
    setFormData({
      name: customer.name, 
      email: customer.email || '',
      phone: customer.phone, 
      address: customer.address || '',
      customerType: customer.customerType, 
      creditLimit: customer.creditLimit?.toString() || '0',
      notes: customer.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('You do not have permission to delete customers');
      return;
    }
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await customerService.delete(id);
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Error deleting customer: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', address: '',
      customerType: 'regular', creditLimit: '0', notes: '',
    });
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-600">
            {isCashier 
              ? 'Add customers and download statements' 
              : 'Manage your customer database'}
          </p>
        </div>
        {/* All roles can add customers */}
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Customer
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  {isAdmin && <TableHead>Total Purchases</TableHead>}
                  <TableHead>Current Credit</TableHead>
                  {isAdmin && <TableHead>Credit Limit</TableHead>}
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
                    {isAdmin && (
                      <TableCell>{formatCurrency(customer.totalPurchases || 0)}</TableCell>
                    )}
                    <TableCell>
                      {customer.currentCredit > 0 ? (
                        <button
                          onClick={() => handleCreditClick(customer)}
                          className="text-red-600 font-semibold flex items-center hover:underline cursor-pointer"
                          title="Click to go to Debts page"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          {formatCurrency(customer.currentCredit)}
                        </button>
                      ) : (
                        <span className="text-green-600">{formatCurrency(0)}</span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>{formatCurrency(customer.creditLimit || 0)}</TableCell>
                    )}
                    <TableCell>
                      <div className="flex space-x-1">
                        {/* Statement — ALL roles */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenStatement(customer)}
                          title="View / Download Statement"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>

                        {/* Sales history — admin/manager only */}
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSalesHistory(customer)}
                            title="View Sales History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Edit — admin/manager only */}
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(customer)}
                            title="Edit Customer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Delete — admin/manager only */}
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(customer._id)}
                            title="Delete Customer"
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
          {customers.length === 0 && (
            <p className="text-center py-8 text-gray-500">No customers found.</p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerType">Customer Type</Label>
                <Select
                  value={formData.customerType}
                  onValueChange={(v) => setFormData({ ...formData, customerType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Credit limit — admin/manager only */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum credit allowed for this customer
                  </p>
                </div>
              )}

              <div className={`${isAdmin ? '' : 'col-span-2'} space-y-2`}>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

      {/* Sales History Dialog — admin/manager only */}
      <Dialog open={isSalesHistoryDialogOpen} onOpenChange={setIsSalesHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sales History — {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>

          {salesHistory && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Total Sales</div>
                    <div className="text-2xl font-bold">{salesHistory.statistics?.totalSales || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Total Purchased</div>
                    <div className="text-2xl font-bold">{formatCurrency(salesHistory.statistics?.totalPurchases || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Total Paid</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(salesHistory.statistics?.totalPaid || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Current Credit</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(salesHistory.statistics?.currentCredit || 0)}</div>
                  </CardContent>
                </Card>
              </div>

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
                    {salesHistory.sales && salesHistory.sales.length > 0 ? (
                      salesHistory.sales.map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                          <TableCell>{formatDateTime(sale.saleDate)}</TableCell>
                          <TableCell>{sale.items?.length || 0} items</TableCell>
                          <TableCell>{formatCurrency(sale.total)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(sale.amountPaid)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(sale.amountDue)}</TableCell>
                          <TableCell className="capitalize">{sale.paymentMethod?.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'}>
                              {sale.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                          No sales found for this customer
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {salesHistory.payments && salesHistory.payments.length > 0 && (
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
                          <TableCell className="capitalize">{payment.paymentMethod?.replace('_', ' ')}</TableCell>
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

      {/* Customer Statement Dialog — ALL roles */}
      {selectedCustomer && (
        <CustomerStatement
          customer={selectedCustomer}
          open={isStatementOpen}
          onOpenChange={setIsStatementOpen}
          businessInfo={businessInfo}
        />
      )}
    </div>
  );
}