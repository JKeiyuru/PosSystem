// client/src/components/customers/CustomerStatement.jsx

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Download, Loader2, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { generateCustomerStatementPDF } from '../../utils/customerStatement';
import api from '../../services/api';

export default function CustomerStatement({ customer, open, onOpenChange, businessInfo }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchStatement = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date.');
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/customers/${customer._id}/statement`, {
        params: { startDate, endDate },
      });
      setStatementData(response.data.data);
      setPreviewMode(true);
    } catch (error) {
      console.error('Error fetching statement:', error);
      alert('Error loading statement: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!statementData) return;
    try {
      const doc = generateCustomerStatementPDF(
        { ...statementData, startDate, endDate },
        businessInfo
      );
      doc.save(`Statement-${customer.name}-${startDate}-${endDate}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF.');
    }
  };

  const handleClose = () => {
    setPreviewMode(false);
    setStatementData(null);
    setStartDate('');
    setEndDate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Customer Statement — {customer?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Date Range Selector */}
        {!previewMode && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Select a date range to generate the customer statement.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stmt-start">Start Date</Label>
                <Input
                  id="stmt-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stmt-end">End Date</Label>
                <Input
                  id="stmt-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={fetchStatement} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Generate Statement'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Statement Preview */}
        {previewMode && statementData && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-blue-900 text-white rounded-lg p-4">
              <h2 className="text-lg font-bold">{businessInfo?.businessName || 'Bekhal Animal Feeds'}</h2>
              {businessInfo?.businessAddress && (
                <p className="text-sm opacity-80">{businessInfo.businessAddress}</p>
              )}
              {businessInfo?.businessPhone && (
                <p className="text-sm opacity-80">{businessInfo.businessPhone}</p>
              )}
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-blue-900">CUSTOMER STATEMENT</h3>
              <p className="text-sm text-gray-500">
                Period: {formatDate(startDate)} — {formatDate(endDate)}
              </p>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-2 text-sm border rounded-lg p-3 bg-gray-50">
              <div>
                <span className="font-semibold">NAME:</span>{' '}
                {statementData.customer?.name}
              </div>
              <div>
                <span className="font-semibold">DATE:</span>{' '}
                {formatDate(new Date())}
              </div>
              <div>
                <span className="font-semibold">CONTACTS:</span>{' '}
                {statementData.customer?.phone}
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Particulars</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {(statementData.transactions || []).map((tx, idx) => (
                    <>
                      <tr
                        key={`tx-${idx}`}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                      >
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-3 py-1.5">
                          {tx.type === 'sale'
                            ? `SALE INVOICE: ${tx.reference}`
                            : `PAYMENT RECEIPT: ${tx.reference}`}
                        </td>
                        <td
                          className={`px-3 py-1.5 text-right font-medium ${
                            tx.type === 'payment'
                              ? 'text-red-600'
                              : 'text-blue-700'
                          }`}
                        >
                          {tx.type === 'payment'
                            ? `-${formatCurrency(tx.amount)}`
                            : formatCurrency(tx.amount)}
                        </td>
                        <td
                          className={`px-3 py-1.5 text-right font-medium ${
                            tx.balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {formatCurrency(tx.balance)}
                        </td>
                        <td className="px-3 py-1.5 text-gray-600">
                          {tx.detail || ''}
                        </td>
                      </tr>
                      {tx.type === 'sale' &&
                        (tx.items || []).map((item, iIdx) => (
                          <tr
                            key={`item-${idx}-${iIdx}`}
                            className="bg-gray-50 text-xs"
                          >
                            <td></td>
                            <td className="px-6 py-1 text-gray-500 italic">
                              {item.productName} — {item.quantity} x{' '}
                              {formatCurrency(item.unitPrice)} ={' '}
                              {formatCurrency(item.totalPrice)}
                            </td>
                            <td colSpan={3}></td>
                          </tr>
                        ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Final Balance */}
            <div className="bg-blue-900 text-white rounded-lg px-4 py-3 flex justify-between font-bold text-base">
              <span>BALANCE:</span>
              <span>{formatCurrency(statementData.finalBalance || 0)}</span>
            </div>

            {/* Aging */}
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-2">
                AGING ANALYSIS
              </h4>
              <div className="grid grid-cols-4 border rounded overflow-hidden text-xs text-center">
                {['ABOVE 90 DAYS', '60-90 DAYS', '30-60 DAYS', '0-30 DAYS'].map(
                  (label, i) => {
                    const keys = ['above90', 'days60to90', 'days30to60', 'days0to30'];
                    return (
                      <div key={i}>
                        <div className="bg-blue-100 text-blue-900 font-bold py-1 px-2">
                          {label}
                        </div>
                        <div className="py-2 font-semibold">
                          {formatCurrency(statementData.aging?.[keys[i]] || 0)}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-500 border-t pt-3">
              <p className="italic mb-2">
                NB: Complaints verified within 24 hours ONLY.
              </p>
              <div className="flex justify-between">
                <span>Statement By: ___________________________</span>
                <span>Signature: ___________________________</span>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
              >
                Back
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}