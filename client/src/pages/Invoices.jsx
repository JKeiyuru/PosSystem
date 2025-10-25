/* eslint-disable react-hooks/exhaustive-deps */
// client/src/pages/Invoices.jsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Eye, Download } from 'lucide-react';
import { invoiceService } from '../services/invoice.service';
import { formatCurrency, formatDate } from '../lib/utils';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [filterType, filterStatus]);

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (filterType && filterType !== 'all') {
        params.type = filterType;
      }
      if (filterStatus && filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const response = await invoiceService.getAll(params);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleViewInvoice = async (id) => {
    try {
      const response = await invoiceService.getById(id);
      setSelectedInvoice(response.data);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await invoiceService.updateStatus(id, status, status === 'paid' ? new Date() : null);
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === id) {
        handleViewInvoice(id);
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
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
          <h1 className="text-3xl font-bold">Invoices & Notes</h1>
          <p className="text-gray-600">Manage invoices, credit notes, and debit notes</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="credit_note">Credit Note</SelectItem>
                  <SelectItem value="debit_note">Debit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
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
              {invoices.map((invoice) => (
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
                        onClick={() => handleViewInvoice(invoice._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUpdateStatus(invoice._id, 'paid')}
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
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
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
                <Button variant="outline" onClick={handlePrintInvoice}>
                  <Download className="mr-2 h-4 w-4" />
                  Print/Download
                </Button>
                {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                  <Button onClick={() => handleUpdateStatus(selectedInvoice._id, 'paid')}>
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