// client/src/components/dashboard/CreditSalesSheet.jsx - NEW FILE

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

export default function CreditSalesSheet({ open, onOpenChange }) {
  const [creditSales, setCreditSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({
    totalCreditSales: 0,
    salesCount: 0,
    totalAmountDue: 0
  });

  useEffect(() => {
    if (open) {
      fetchCreditSales();
    }
  }, [open, selectedDate]);

  const fetchCreditSales = async () => {
    try {
      setLoading(true);
      
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch sales where payment method is credit
      const response = await api.get('/sales', {
        params: {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          paymentMethod: 'credit'
        }
      });

      const sales = response.data.data || [];
      setCreditSales(sales);

      // Calculate summary
      const totalCreditSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalAmountDue = sales.reduce((sum, sale) => sum + sale.amountDue, 0);

      setSummary({
        totalCreditSales,
        salesCount: sales.length,
        totalAmountDue
      });

    } catch (error) {
      console.error('Error fetching credit sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (creditSales.length === 0) {
      alert('No data to download');
      return;
    }

    const headers = ['Sale Number', 'Date', 'Customer', 'Total', 'Amount Paid', 'Amount Due', 'Status'];
    const rows = creditSales.map(sale => [
      sale.saleNumber,
      formatDateTime(sale.saleDate),
      sale.customerName || 'N/A',
      sale.total,
      sale.amountPaid,
      sale.amountDue,
      sale.paymentStatus
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `credit_sales_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Credit Sales History</SheetTitle>
          <SheetDescription>
            View all credit sales for a specific date
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
              disabled={creditSales.length === 0}
              className="mt-7"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-700">Total Credit Sales</div>
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(summary.totalCreditSales)}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-sm text-emerald-700">Number of Sales</div>
              <div className="text-2xl font-bold text-emerald-900">
                {summary.salesCount}
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-700">Total Amount Due</div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(summary.totalAmountDue)}
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>📝 Note:</strong> These credit sales are <strong>NOT counted as today's revenue</strong>. 
              They will only be counted as revenue when the customer makes a payment.
            </p>
          </div>

          {/* Credit Sales Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading credit sales...</p>
            </div>
          ) : creditSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No credit sales found for {new Date(selectedDate).toLocaleDateString()}</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditSales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell>
                        {new Date(sale.saleDate).toLocaleTimeString('en-KE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>{sale.customerName || 'N/A'}</TableCell>
                      <TableCell>{sale.cashierName}</TableCell>
                      <TableCell>{formatCurrency(sale.total)}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(sale.amountPaid)}
                      </TableCell>
                      <TableCell className="text-red-600 font-semibold">
                        {formatCurrency(sale.amountDue)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.paymentStatus === 'paid'
                              ? 'success'
                              : sale.paymentStatus === 'partial'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {sale.paymentStatus}
                        </Badge>
                      </TableCell>
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