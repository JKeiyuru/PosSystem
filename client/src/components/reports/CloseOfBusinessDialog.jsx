// client/src/components/reports/CloseOfBusinessDialog.jsx

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
import { Loader2, Mail } from 'lucide-react';
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
  const openingCash = parseFloat(formData.openingCash) || 0;
  const actualCash = parseFloat(formData.actualCash) || 0;
  const totalExpenses = parseFloat(formData.totalExpenses) || 0;

  if (!openingCash || !actualCash) {
    alert('Please enter opening cash and actual cash');
    return;
  }

  try {
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const salesResponse = await api.get('/sales/daily', { params: { date: today } });
    const summary = salesResponse.data.data.summary;

    // Expected cash = Opening + Cash Sales ONLY - Expenses
    // M-Pesa is NOT included
    const expectedCash = openingCash + summary.totalCash - totalExpenses;
    const variance = actualCash - expectedCash;

    setPreview({
      openingCash,
      cashSales: summary.totalCash,
      mpesaSales: summary.totalMpesa,
      totalExpenses,
      expectedCash,
      actualCash,
      variance,
      salesCount: summary.salesCount,
      totalRevenue: summary.totalSales
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

    if (window.confirm('Are you sure you want to close business for today? This action will send the daily report via email.')) {
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

        const response = await dailyReportService.create(reportData);
        
        // Send email with progress
        setSendingEmail(true);
        setEmailProgress(0);

        // Simulate progress
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
          await api.post(`/daily-reports/${response.data._id}/send-email`);
          setEmailProgress(100);
          
          setTimeout(() => {
            alert('Business closed successfully! Daily report has been sent via email.');
            resetForm();
            onSuccess?.();
            onOpenChange(false);
          }, 500);
        } catch (emailError) {
          clearInterval(progressInterval);
          console.error('Error sending email:', emailError);
          alert('Report saved but email sending failed. Please check email settings.');
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
                    placeholder="0.00"
                    value={formData.openingCash}
                    onChange={(e) => setFormData({...formData, openingCash: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualCash">Actual Cash in Hand (KES) *</Label>
                  <Input
                    id="actualCash"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.actualCash}
                    onChange={(e) => setFormData({...formData, actualCash: e.target.value})}
                    required
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="totalExpenses">Total Expenses (KES)</Label>
                  <Input
                    id="totalExpenses"
                    type="number"
                    step="0.01"
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

                / Update the preview display to show M-Pesa separately
<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
  <div>
    <p className="text-sm text-gray-600">Opening Cash</p>
    <p className="text-lg font-semibold">{formatCurrency(preview.openingCash)}</p>
  </div>
  <div>
    <p className="text-sm text-gray-600">Cash Sales</p>
    <p className="text-lg font-semibold text-green-600">+{formatCurrency(preview.cashSales)}</p>
  </div>
  <div>
    <p className="text-sm text-gray-600">M-Pesa Sales (Not Cash)</p>
    <p className="text-lg font-semibold text-purple-600">+{formatCurrency(preview.mpesaSales)}</p>
  </div>
  <div>
    <p className="text-sm text-gray-600">Expenses</p>
    <p className="text-lg font-semibold text-red-600">-{formatCurrency(preview.totalExpenses)}</p>
  </div>
</div>

<div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
  <p className="text-xs text-gray-600 mb-2">Note: M-Pesa is not counted in expected cash as it's digital payment</p>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-sm text-gray-600">Expected Cash</p>
      <p className="text-xl font-bold">{formatCurrency(preview.expectedCash)}</p>
    </div>
    <div>
      <p className="text-sm text-gray-600">Actual Cash</p>
      <p className="text-xl font-bold">{formatCurrency(preview.actualCash)}</p>
    </div>
  </div>
</div>

                <div className={`p-4 rounded-lg border-2 ${preview.variance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Cash Variance</p>
                    <p className={`text-3xl font-bold ${preview.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {preview.variance >= 0 ? '+' : ''}{formatCurrency(preview.variance)}
                    </p>
                    <p className="text-sm mt-2">
                      {preview.variance >= 0 ? '✓ Surplus' : '⚠ Shortage'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-lg font-semibold">{preview.salesCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-lg font-semibold">{formatCurrency(preview.totalRevenue)}</p>
                  </div>
                </div>

                {sendingEmail && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Sending email report...</span>
                      <span>{emailProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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