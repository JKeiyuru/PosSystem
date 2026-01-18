// client/src/pages/Dashboard.jsx - UPDATED with clickable Credit Sales card and all existing dialogs

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  TrendingUp,
  Users,
  CreditCard,
  RefreshCw,
  BarChart3,
  Wallet
} from 'lucide-react';
import { saleService } from '../services/sale.service';
import { productService } from '../services/product.service';
import { stockService } from '../services/stock.service';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '../components/ui/badge';
import api from '../services/api';
import CreditSalesSheet from '../components/dashboard/CreditSalesSheet';
import CreditCollectionsSheet from '../components/dashboard/CreditCollectionsSheet';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    todayDebtPayments: 0,
    todayCreditSales: 0,
    lowStockCount: 0,
    stockValue: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [todaysSales, setTodaysSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockDialog, setShowLowStockDialog] = useState(false);
  const [showTodaysSalesDialog, setShowTodaysSalesDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCreditSalesSheet, setShowCreditSalesSheet] = useState(false);
  const [lastResetDate, setLastResetDate] = useState(null);
  const [showCreditCollectionsSheet, setShowCreditCollectionsSheet] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    const savedResetDate = localStorage.getItem('analytics_reset_date');
    if (savedResetDate) {
      setLastResetDate(new Date(savedResetDate));
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dailySalesRes, lowStockRes, stockValueRes] = await Promise.all([
        saleService.getDailySales(),
        productService.getLowStock(),
        stockService.getStockValue()
      ]);

      const todaySales = dailySalesRes.data.summary;
      const salesList = dailySalesRes.data.sales;

      let todayDebtPayments = 0;
      let monthlyProfitData = [];
      let topProductsData = [];
      let topCustomersData = [];

      try {
        const topProductsRes = await api.get('/sales/analytics/top-products', { params: { limit: 5 } });
        topProductsData = topProductsRes.data.data || [];
      } catch (error) {
        console.warn('Could not fetch top products:', error);
      }

      try {
        const topCustomersRes = await api.get('/sales/analytics/top-customers', { params: { limit: 5 } });
        topCustomersData = topCustomersRes.data.data || [];
      } catch (error) {
        console.warn('Could not fetch top customers:', error);
      }

      try {
        const debtPaymentsRes = await api.get('/debts/payments/today');
        todayDebtPayments = debtPaymentsRes.data.data?.totalPayments || 0;
      } catch (error) {
        console.warn('Could not fetch debt payments:', error);
      }

      try {
        const monthlyRes = await api.get('/reports/monthly-profit');
        monthlyProfitData = monthlyRes.data.data?.months || [];
      } catch (error) {
        console.warn('Could not fetch monthly profit data:', error);
      }

      setStats({
        todaySales: todaySales.salesCount,
        todayRevenue: todaySales.totalSales, // This is actual revenue (cash + mpesa + credit payments)
        todayDebtPayments: todaySales.creditPaymentsToday || 0,
        todayCreditSales: todaySales.totalCredit || 0, // Credit given today (NOT revenue)
        lowStockCount: lowStockRes.data.length,
        stockValue: stockValueRes.data.stockValue
      });

      setLowStockProducts(lowStockRes.data);
      setTodaysSales(salesList);
      setTopProducts(topProductsData);
      setTopCustomers(topCustomersData);
      setMonthlyData(monthlyProfitData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAnalyticsClick = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = async () => {
    try {
      await api.post('/analytics/reset', { 
        types: ['products', 'customers'] 
      });
      
      setTopProducts([]);
      setTopCustomers([]);
      
      const resetDate = new Date();
      setLastResetDate(resetDate);
      localStorage.setItem('analytics_reset_date', resetDate.toISOString());
      
      setShowResetDialog(false);
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error resetting analytics:', error);
      alert('Error resetting analytics data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Welcome to Bekhal Animal Feeds POS</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {lastResetDate && (
            <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Last Reset: {formatDateTime(lastResetDate)}
            </span>
          )}
          <Button 
            variant="outline" 
            onClick={handleResetAnalyticsClick}
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Reset Analytics
          </Button>
        </div>
      </div>

{/* Stats Cards - FIXED with proper Credit Sales and Clickable Collections */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
  <Card 
    className="cursor-pointer hover:shadow-lg transition-shadow col-span-2 md:col-span-1"
    onClick={() => setShowTodaysSalesDialog(true)}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
      <CardTitle className="text-xs sm:text-sm font-medium">Today's Sales</CardTitle>
      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent className="p-3 sm:p-6 pt-0">
      <div className="text-lg sm:text-2xl font-bold">{stats.todaySales}</div>
      <p className="text-xs text-muted-foreground">
        Click to view details
      </p>
    </CardContent>
  </Card>

  <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
      <CardTitle className="text-xs sm:text-sm font-medium">Today's Revenue</CardTitle>
      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
    </CardHeader>
    <CardContent className="p-3 sm:p-6 pt-0">
      <div className="text-lg sm:text-2xl font-bold text-green-700">
        {formatCurrency(stats.todayRevenue)}
      </div>
      <p className="text-xs text-green-600">
        Cash + M-Pesa + Collections
      </p>
    </CardContent>
  </Card>

  {/* Credit Collections Card - CLICKABLE */}
  <Card 
    className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 col-span-2 md:col-span-1 cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => setShowCreditCollectionsSheet(true)}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
      <CardTitle className="text-xs sm:text-sm font-medium">Credit Collections</CardTitle>
      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
    </CardHeader>
    <CardContent className="p-3 sm:p-6 pt-0">
      <div className="text-lg sm:text-2xl font-bold text-blue-700">
        {formatCurrency(stats.todayDebtPayments)}
      </div>
      <p className="text-xs text-blue-600">
        Click to view history
      </p>
    </CardContent>
  </Card>

  {/* Credit Sales Card - CLICKABLE */}
  <Card 
    className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 col-span-2 md:col-span-1 cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => setShowCreditSalesSheet(true)}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
      <CardTitle className="text-xs sm:text-sm font-medium">Credit Sales Today</CardTitle>
      <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
    </CardHeader>
    <CardContent className="p-3 sm:p-6 pt-0">
      <div className="text-lg sm:text-2xl font-bold text-orange-700">
        {formatCurrency(stats.todayCreditSales)}
      </div>
      <p className="text-xs text-orange-600">
        Click to view history
      </p>
    </CardContent>
  </Card>

  <Card className="col-span-2 md:col-span-1">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
      <CardTitle className="text-xs sm:text-sm font-medium">Stock Value</CardTitle>
      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent className="p-3 sm:p-6 pt-0">
      <div className="text-lg sm:text-2xl font-bold">
        {formatCurrency(stats.stockValue)}
      </div>
      <p className="text-xs text-muted-foreground">
        Total inventory
      </p>
    </CardContent>
  </Card>

  <Card 
    className="cursor-pointer hover:shadow-lg transition-shadow col-span-2 md:col-span-1"
    onClick={() => setShowLowStockDialog(true)}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
      <CardTitle className="text-xs sm:text-sm font-medium">Low Stock</CardTitle>
      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
    </CardHeader>
    <CardContent className="p-3 sm:p-6 pt-0">
      <div className="text-lg sm:text-2xl font-bold">{stats.lowStockCount}</div>
      <p className="text-xs text-muted-foreground">
        Click to view items
      </p>
    </CardContent>
  </Card>
</div>

      {/* Info Alert - UPDATED explanation */}
<Alert className="bg-blue-50 border-blue-200">
  <AlertTitle className="flex items-center text-blue-800">
    <DollarSign className="h-4 w-4 mr-2" />
    Revenue Calculation Explained
  </AlertTitle>
  <AlertDescription className="text-blue-700 text-sm">
    <strong>Today's Revenue</strong> = Cash sales + M-Pesa sales + Credit payments collected today. 
    <br />
    <strong className="mt-1 inline-block">Credit Sales Today</strong> shows money given on credit (NOT revenue yet - becomes revenue when paid).
    <br />
    <strong className="mt-1 inline-block">Credit Collections</strong> shows debt payments received today (IS counted as revenue).
  </AlertDescription>
</Alert>



      {/* Monthly Revenue & Net Profit Chart */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Monthly Revenue & Net Profit (Last 12 Months)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {monthlyData.length > 0 ? (
            <div className="h-64 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    fontSize={11}
                  />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value;
                    }}
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="revenue" fill="#2563eb" name="Total Revenue" />
                  <Bar dataKey="profit" fill="#16a34a" name="Net Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No monthly data available yet
            </div>
          )}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="text-gray-700">
              <strong>Note:</strong> This chart shows total revenue and net profit for each month. 
              Profit is calculated from each sale's gross profit (selling prices - buying prices). Data shows the last 12 months.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Top 5 Products</span>
              </div>
              {lastResetDate && (
                <Badge variant="secondary" className="text-xs w-fit">
                  Since {new Date(lastResetDate).toLocaleDateString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {topProducts.length > 0 ? (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} margin={{ top: 10, right: 10, left: 10, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="productName" 
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      interval={0}
                      fontSize={10}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Product: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="totalRevenue" fill="#2563eb" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No sales data available yet. Data will accumulate after reset.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Top 5 Customers</span>
              </div>
              {lastResetDate && (
                <Badge variant="secondary" className="text-xs w-fit">
                  Since {new Date(lastResetDate).toLocaleDateString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {topCustomers.length > 0 ? (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} margin={{ top: 10, right: 10, left: 10, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="customerName" 
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      interval={0}
                      fontSize={10}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Customer: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="totalPurchases" fill="#16a34a" name="Total Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No customer data available yet. Data will accumulate after reset.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && lowStockProducts.slice(0, 3).length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              <span>Low Stock Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      Stock: {product.quantity} {product.baseUnit}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {product.quantity === 0 ? (
                      <Badge variant="destructive" className="text-xs">Out</Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">Low</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Sales Sheet */}
      <CreditSalesSheet 
        open={showCreditSalesSheet}
        onOpenChange={setShowCreditSalesSheet}
      />

{/* Credit collections Sheet */}
      <CreditCollectionsSheet 
  open={showCreditCollectionsSheet}
  onOpenChange={setShowCreditCollectionsSheet}
/>

      {/* Reset Analytics Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Analytics Data?</DialogTitle>
          </DialogHeader>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">This will reset:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Top Products data</li>
                <li>Top Customers data</li>
              </ul>
              <p className="mt-3 text-sm">
                The data will start accumulating fresh from today. This action cannot be undone.
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-600">
                Note: Monthly Revenue & Net Profit chart will NOT be affected.
              </p>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReset} variant="destructive">
              Yes, Reset Analytics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Low Stock Dialog */}
      <Dialog open={showLowStockDialog} onOpenChange={setShowLowStockDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Low Stock Items ({lowStockProducts.length})</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Product</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-xs sm:text-sm">Current Stock</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Reorder Level</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell className="font-medium text-xs sm:text-sm">{product.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{product.category}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{product.quantity} {product.baseUnit}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs sm:text-sm">{product.reorderLevel} {product.baseUnit}</TableCell>
                    <TableCell>
                      {product.quantity === 0 ? (
                        <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">Low Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Today's Sales Dialog */}
      <Dialog open={showTodaysSalesDialog} onOpenChange={setShowTodaysSalesDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Today's Sales ({todaysSales.length})</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xs sm:text-sm text-gray-600">Total Sales</div>
                  <div className="text-lg sm:text-2xl font-bold">{todaysSales.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xs sm:text-sm text-gray-600">Total Revenue</div>
                  <div className="text-lg sm:text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50">
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xs sm:text-sm text-gray-600">Credit Given</div>
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">{formatCurrency(stats.todayCreditSales)}</div>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xs sm:text-sm text-gray-600">Average Sale</div>
                  <div className="text-lg sm:text-2xl font-bold">
                    {formatCurrency(todaysSales.length > 0 ? stats.todayRevenue / todaysSales.length : 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Sale #</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Time</TableHead>
                    <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Payment</TableHead>
                    <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysSales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium text-xs sm:text-sm">{sale.saleNumber}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{formatDateTime(sale.saleDate)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{sale.customerName || 'Walk-in'}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm capitalize">{sale.paymentMethod.replace('_', ' ')}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'} className="text-xs">
                          {sale.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}