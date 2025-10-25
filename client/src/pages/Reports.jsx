// client/src/pages/Reports.jsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { FileText, Download, Calendar } from 'lucide-react';
import { reportService } from '../services/report.service';
import { formatCurrency, formatDate } from '../lib/utils';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CloseOfBusinessDialog from '../components/reports/CloseOfBusinessDialog';
import { dailyReportService } from '../services/dailyReport.service';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [salesReport, setSalesReport] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [productPerformance, setProductPerformance] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyReports, setDailyReports] = useState([]);
const [showCloseBusinessDialog, setShowCloseBusinessDialog] = useState(false);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getDailySales(dateRange.startDate, dateRange.endDate);
      setSalesReport(response.data);
    } catch (error) {
      console.error('Error fetching sales report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add fetch function
const fetchDailyReports = async () => {
  try {
    setLoading(true);
    const response = await dailyReportService.getAll({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    setDailyReports(response.data);
  } catch (error) {
    console.error('Error fetching daily reports:', error);
  } finally {
    setLoading(false);
  }
};

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      const response = await reportService.getBalanceSheet();
      setBalanceSheet(response.data);
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductPerformance = async () => {
    try {
      setLoading(true);
      const response = await reportService.getProductPerformance(dateRange.startDate, dateRange.endDate);
      setProductPerformance(response.data);
    } catch (error) {
      console.error('Error fetching product performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const response = await reportService.getCashFlow(dateRange.startDate, dateRange.endDate);
      setCashFlow(response.data);
    } catch (error) {
      console.error('Error fetching cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">View detailed business reports and analytics</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => {
                fetchSalesReport();
                fetchProductPerformance();
                fetchCashFlow();
              }}>
                <Calendar className="mr-2 h-4 w-4" />
                Generate Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
        </TabsList>

        {/* Sales Report Tab */}
        <TabsContent value="sales" className="space-y-4">
          {salesReport ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesReport.summary.totalSales}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(salesReport.summary.totalRevenue)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(salesReport.summary.grossProfit)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesReport.summary.profitMargin}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cash', value: salesReport.paymentBreakdown.cash },
                          { name: 'M-Pesa', value: salesReport.paymentBreakdown.mpesa },
                          { name: 'Credit', value: salesReport.paymentBreakdown.credit }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales List */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sale #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReport.sales.map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell>{sale.saleNumber}</TableCell>
                          <TableCell>{formatDate(sale.saleDate)}</TableCell>
                          <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                          <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                          <TableCell>{formatCurrency(sale.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Click "Generate Reports" to view sales data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value="products" className="space-y-4">
          {productPerformance ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productPerformance.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="productName" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Revenue' : 'Quantity'
                      ]} />
                      <Legend />
                      <Bar dataKey="quantitySold" fill="#2563eb" name="Quantity Sold" />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Performance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity Sold</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productPerformance.topProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell>{product.quantitySold}</TableCell>
                          <TableCell>{formatCurrency(product.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Click "Generate Reports" to view product performance</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-4">
          {cashFlow ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cash Inflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(cashFlow.totalInflow)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cash</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(cashFlow.cashIn)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">M-Pesa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(cashFlow.mpesaIn)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cash Outflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(cashFlow.cashOut)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Net Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Period: {formatDate(cashFlow.period.start)} - {formatDate(cashFlow.period.end)}</p>
                    <div className={`text-4xl font-bold ${cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cashFlow.netCashFlow)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Click "Generate Reports" to view cash flow</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Balance Sheet Tab */}
        <TabsContent value="balance" className="space-y-4">
          <Button onClick={fetchBalanceSheet} disabled={loading}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Balance Sheet
          </Button>

          {balanceSheet && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Assets */}
              <Card>
                <CardHeader>
                  <CardTitle>Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Current Assets</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Cash in Hand:</span>
                        <span className="font-medium">{formatCurrency(balanceSheet.assets.currentAssets.cashInHand)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accounts Receivable:</span>
                        <span className="font-medium">{formatCurrency(balanceSheet.assets.currentAssets.accountsReceivable)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inventory:</span>
                        <span className="font-medium">{formatCurrency(balanceSheet.assets.currentAssets.inventory)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Assets:</span>
                      <span>{formatCurrency(balanceSheet.assets.totalAssets)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liabilities & Equity */}
              <Card>
                <CardHeader>
                  <CardTitle>Liabilities & Equity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Current Liabilities</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Accounts Payable:</span>
                        <span className="font-medium">{formatCurrency(balanceSheet.liabilities.currentLiabilities.accountsPayable)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Liabilities:</span>
                      <span className="font-medium">{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Owner's Equity:</span>
                      <span className="font-medium">{formatCurrency(balanceSheet.equity.ownersEquity)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Liabilities & Equity:</span>
                      <span>{formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        {/* Daily Reports tab */}
        <TabsContent value="daily" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Daily Checks & Balances Reports</h3>
              <p className="text-sm text-gray-600">View historical daily reports</p>
            </div>
            <Button onClick={() => setShowCloseBusinessDialog(true)} className="bg-red-600 hover:bg-red-700">
              <AlertCircle className="mr-2 h-4 w-4" />
              Close of Business
            </Button>
          </div>

          <Button onClick={fetchDailyReports} disabled={loading}>
            Load Daily Reports
          </Button>

          {dailyReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Reports History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Opening Cash</TableHead>
                      <TableHead>Expected Cash</TableHead>
                      <TableHead>Actual Cash</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Expenses</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Closed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyReports.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell>{formatDate(report.reportDate)}</TableCell>
                        <TableCell>{formatCurrency(report.openingCash)}</TableCell>
                        <TableCell>{formatCurrency(report.expectedCash)}</TableCell>
                        <TableCell>{formatCurrency(report.actualCash)}</TableCell>
                        <TableCell>
                          <span className={report.variance >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {report.variance >= 0 ? '+' : ''}{formatCurrency(report.variance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-red-600">{formatCurrency(report.totalExpenses)}</TableCell>
                        <TableCell>{formatCurrency(report.totalRevenue)}</TableCell>
                        <TableCell>{report.closedByName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add the dialog at the end before closing tag */}
      <CloseOfBusinessDialog 
        open={showCloseBusinessDialog}
        onOpenChange={setShowCloseBusinessDialog}
        onSuccess={() => {
          fetchDailyReports();
        }}
      />
    </div>
  );
}