// client/src/components/dashboard/CreditCollectionsSheet.jsx - NEW FILE

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Calendar, Download } from 'lucide-react';
import api from '../../services/api';

export default function CreditCollectionsSheet({ open, onOpenChange }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({
    totalPayments: 0,
    paymentsCount: 0,
    cashPayments: 0,
    mpesaPayments: 0
  });

  useEffect(() => {
    if (open) {
      fetchCreditCollections();
    }
  }, [open, selectedDate]);

  const fetchCreditCollections = async () => {
    try {
      setLoading(true);
      
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch payment transactions for the selected date
      const response = await api.get('/debts/payments/by-date', {
        params: {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString()
        }
      });

      const paymentsList = response.data.data || [];
      setPayments(paymentsList);

      // Calculate summary
      const totalPayments = paymentsList.reduce((sum, pmt) => sum + pmt.amount, 0);
      const cashPayments = paymentsList
        .filter(p => p.paymentMethod === 'cash')
        .reduce((sum, p) => sum + p.amount, 0);
      const mpesaPayments = paymentsList
        .filter(p => p.paymentMethod.includes('mpesa') || p.paymentMethod.includes('gdc'))
        .reduce((sum, p) => sum + p.amount, 0);

      setSummary({
        totalPayments,
        paymentsCount: paymentsList.length,
        cashPayments,
        mpesaPayments
      });

    } catch (error) {
      console.error('Error fetching credit collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (payments.length === 0) {
      alert('No data to download');
      return;
    }

    const headers = ['Transaction #', 'Date', 'Customer', 'Amount', 'Payment Method', 'Received By'];
    const rows = payments.map(pmt => [
      pmt.transactionNumber,
      formatDateTime(pmt.paymentDate),
      pmt.customerName || 'N/A',
      pmt.amount,
      pmt.paymentMethod.replace(/_/g, ' '),
      pmt.receivedByName
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `credit_collections_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      'cash': 'Cash',
      'mpesa_paybill': 'M-Pesa (Paybill)',
      'mpesa_till': 'M-Pesa (Till)',
      'gdc_paybill': 'GDC Paybill',
      'mpesa_beth': 'M-Pesa (Beth)',
      'mpesa_martin': 'M-Pesa (Martin)'
    };
    return methods[method] || method;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Credit Collections History</SheetTitle>
          <SheetDescription>
            View all credit payments collected for a specific date
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Date Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="date">Select Date</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={downloadCSV}
              disabled={payments.length === 0}
              className="mt-7"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700">Total Collections</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(summary.totalPayments)}
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700">Cash Collected</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(summary.cashPayments)}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-700">M-Pesa Collected</div>
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(summary.mpesaPayments)}
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💰 Revenue Impact:</strong> These credit collections <strong>ARE counted as today's revenue</strong>. 
              When customers pay their debts, it becomes revenue on the day of payment.
            </p>
          </div>

          {/* Collections Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading credit collections...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No credit collections found for {new Date(selectedDate).toLocaleDateString()}</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Received By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((pmt) => (
                    <TableRow key={pmt._id}>
                      <TableCell className="font-medium">{pmt.transactionNumber}</TableCell>
                      <TableCell>
                        {new Date(pmt.paymentDate).toLocaleTimeString('en-KE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>{pmt.customerName || 'N/A'}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {formatCurrency(pmt.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">
                          {getPaymentMethodDisplay(pmt.paymentMethod)}
                        </Badge>
                      </TableCell>
                      <TableCell>{pmt.receivedByName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}