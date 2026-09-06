// client/src/components/reports/CloseOfBusinessDialog.jsx - COMPLETELY FIXED

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Mail, AlertTriangle } from 'lucide-react';
import { dailyReportService } from '../../services/dailyReport.service';
import { formatCurrency } from '../../lib/utils';
import api from '../../services/api';

export default function CloseOfBusinessDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    openingCash: '',
    actualCash: '',
    totalExpenses: '',
    expensesNotes: '',
    notes: ''
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailProgress, setEmailProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleCalculatePreview = async () => {
    const openingCash = parseFloat(formData.openingCash);
    const actualCash = parseFloat(formData.actualCash);
    const totalExpenses = parseFloat(formData.totalExpenses) || 0;

    if (isNaN(openingCash) || openingCash < 0) {
      alert('Please enter a valid opening cash amount (0 or greater)');
      return;
    }

    if (isNaN(actualCash) || actualCash < 0) {
      alert('Please enter a valid actual cash amount');
      return;
    }

    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];
      const salesResponse = await api.get('/sales/daily', { params: { date: today } });
      const summary = salesResponse.data.data.summary;

      console.log('Sales Summary:', summary);

      // CRITICAL FIX: Proper cash calculation
      // Total Cash = Cash from sales + Cash from credit payments (NOT including credit sales)
      const cashSales = summary.cashSales || 0;
      const cashFromCreditPayments = summary.cashFromCreditPayments || 0;
      const totalCashReceived = summary.totalCash || (cashSales + cashFromCreditPayments);
      
      // M-Pesa (digital, not physical cash)
      const mpesaSales = summary.totalMpesa || 0;
      
      // Credit sales (amount given on credit today - NOT cash, NOT revenue yet)
      const creditSalesAmount = summary.totalCredit || 0;
      
      // Credit payments collected today (already included in totalCash)
      const creditPaymentsToday = summary.creditPaymentsToday || 0;

      // EXPECTED CASH = Opening Cash + Total Cash Received - Expenses
      const expectedCash = openingCash + totalCashReceived - totalExpenses;
      
      // VARIANCE = Actual Cash - Expected Cash
      const variance = actualCash - expectedCash;

      console.log('Cash Calculation:');
      console.log('Opening Cash:', openingCash);
      console.log('Total Cash Received:', totalCashReceived);
      console.log('  - Cash Sales:', cashSales);
      console.log('  - Cash from Credit Payments:', cashFromCreditPayments);
      console.log('Expenses:', totalExpenses);
      console.log('Expected Cash:', expectedCash);
      console.log('Actual Cash:', actualCash);
      console.log('Variance:', variance);
      console.log('Credit Sales (NOT cash):', creditSalesAmount);

      setPreview({
        openingCash,
        totalCashReceived,
        cashSales,
        cashFromCreditPayments,
        mpesaSales,
        creditSalesAmount,
        creditPaymentsToday,
        totalExpenses,
        expectedCash,
        actualCash,
        variance,
        salesCount: summary.salesCount,
        totalRevenue: summary.totalSales // Actual revenue (cash + mpesa + credit payments)
      });

      setShowPreview(true);
    } catch (error) {
      console.error('Error calculating preview:', error);
      alert('Error calculating preview: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview) {
      alert('Please calculate preview first');
      return;
    }

    if (window.confirm('Are you sure you want to close business for today? This will send a comprehensive daily report via email.')) {
      try {
        setLoading(true);

        const reportData = {
          reportDate: new Date().toISOString(),
          openingCash: parseFloat(formData.openingCash),
          actualCash: parseFloat(formData.actualCash),
          totalExpenses: parseFloat(formData.totalExpenses) || 0,
          expensesNotes: formData.expensesNotes,
          notes: formData.notes
        };

        console.log('Creating daily report with data:', reportData);

        const response = await dailyReportService.create(reportData);
        
        console.log('Daily report created:', response.data);
        
        setSendingEmail(true);
        setEmailProgress(0);

        const progressInterval = setInterval(() => {
          setEmailProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        try {
          console.log('Sending comprehensive email report...');
          await api.post(`/daily-reports/${response.data._id}/send-email`);
          setEmailProgress(100);
          
          setTimeout(() => {
            alert('✅ Business closed successfully!\n\n📧 Comprehensive daily report has been sent via email.');
            resetForm();
            onSuccess?.();
            onOpenChange(false);
          }, 500);
        } catch (emailError) {
          clearInterval(progressInterval);
          console.error('Error sending email:', emailError);
          alert('⚠️ Report saved but email sending failed.\n\nPlease check email configuration.');
          resetForm();
          onSuccess?.();
          onOpenChange(false);
        }

      } catch (error) {
        console.error('Error closing business:', error);
        alert('Error closing business: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
        setSendingEmail(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      openingCash: '',
      actualCash: '',
      totalExpenses: '',
      expensesNotes: '',
      notes: ''
    });
    setPreview(null);
    setShowPreview(false);
    setEmailProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close of Business</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showPreview ? (
            <>
              <Alert>
                <AlertDescription>
                  Enter the day's financial information to generate the daily checks and balances report.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingCash">Opening Cash (KES) *</Label>
                  <Input
                    id="openingCash"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.openingCash}
                    onChange={(e) => setFormData({...formData, openingCash: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500">Cash at start of day</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualCash">Actual Cash in Hand (KES) *</Label>
                  <Input
                    id="actualCash"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.actualCash}
                    onChange={(e) => setFormData({...formData, actualCash: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500">Cash counted at close</p>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="totalExpenses">Total Expenses (KES)</Label>
                  <Input
                    id="totalExpenses"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.totalExpenses}
                    onChange={(e) => setFormData({...formData, totalExpenses: e.target.value})}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="expensesNotes">Expenses Notes</Label>
                  <Input
                    id="expensesNotes"
                    placeholder="Brief description of expenses..."
                    value={formData.expensesNotes}
                    onChange={(e) => setFormData({...formData, expensesNotes: e.target.value})}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Any additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCalculatePreview} 
                disabled={loading}
                className="w-full"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : 'Calculate Preview'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Daily Checks & Balances Preview</h3>

                {/* CASH FLOW BREAKDOWN */}
                <div className="p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                  <h4 className="font-semibold mb-3 text-emerald-900">💵 Cash Flow Today</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Opening Cash:</span>
                      <span className="font-semibold">{formatCurrency(preview.openingCash)}</span>
                    </div>
                    <div className="flex justify-between pl-4 text-green-700">
                      <span>• Cash from Sales:</span>
                      <span className="font-semibold">{formatCurrency(preview.cashSales)}</span>
                    </div>
                    <div className="flex justify-between pl-4 text-green-700">
                      <span>• Cash from Credit Payments:</span>
                      <span className="font-semibold">{formatCurrency(preview.cashFromCreditPayments)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-700">+ Total Cash Received:</span>
                      <span className="font-semibold text-green-600">+{formatCurrency(preview.totalCashReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">- Expenses Paid:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(preview.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-emerald-300">
                      <span className="font-bold text-emerald-900">= Expected Cash:</span>
                      <span className="font-bold text-emerald-900">{formatCurrency(preview.expectedCash)}</span>
                    </div>
                  </div>
                </div>

                {/* FORMULA EXPLANATION */}
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-sm">
                    <strong>💡 Formula:</strong> Expected Cash = Opening + Cash Received - Expenses<br/>
                    <strong>Calculation:</strong> {formatCurrency(preview.openingCash)} + {formatCurrency(preview.totalCashReceived)} - {formatCurrency(preview.totalExpenses)} = {formatCurrency(preview.expectedCash)}
                  </AlertDescription>
                </Alert>

                {/* IMPORTANT: Credit Sales Note */}
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-sm text-orange-800">
                    <strong>📝 Note on Credit Sales:</strong><br/>
                    Credit sales of {formatCurrency(preview.creditSalesAmount)} are <strong>NOT included</strong> in cash calculations. 
                    They will be counted as revenue when customers pay.
                  </AlertDescription>
                </Alert>

                {/* DIGITAL PAYMENTS (NOT CASH) */}
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <p className="text-xs text-purple-700 mb-2 font-semibold">📱 Digital Payments (Not Physical Cash)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">M-Pesa Sales</p>
                      <p className="text-lg font-bold text-purple-600">{formatCurrency(preview.mpesaSales)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Credit Sales Today</p>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(preview.creditSalesAmount)}</p>
                      <p className="text-xs text-orange-600">(Not revenue yet)</p>
                    </div>
                  </div>
                </div>

                {/* CASH VARIANCE */}
                <div className={`p-4 rounded-lg border-3 ${preview.variance >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Expected vs Actual Cash</p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Expected</p>
                        <p className="text-xl font-bold">{formatCurrency(preview.expectedCash)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Actual</p>
                        <p className="text-xl font-bold">{formatCurrency(preview.actualCash)}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t-2">
                      <p className="text-sm font-semibold mb-2">Cash Variance</p>
                      <p className={`text-4xl font-bold ${preview.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {preview.variance >= 0 ? '+' : ''}{formatCurrency(preview.variance)}
                      </p>
                      <p className="text-sm mt-2 font-semibold">
                        {preview.variance >= 0 ? '✅ Surplus' : '⚠️ Shortage'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BUSINESS SUMMARY */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Sales Count</p>
                    <p className="text-lg font-semibold">{preview.salesCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-lg font-semibold">{formatCurrency(preview.totalRevenue)}</p>
                    <p className="text-xs text-gray-500">(Money actually received)</p>
                  </div>
                </div>

                {sendingEmail && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Sending comprehensive report via email...</span>
                      <span>{emailProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${emailProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(false)}
                  disabled={loading || sendingEmail}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={loading || sendingEmail}
                >
                  {loading || sendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {sendingEmail ? 'Sending Email...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Close Business & Send Report
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}