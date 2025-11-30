// client/src/pages/Dashboard.jsx - CONSOLIDATED WITH ALL FEATURES (RESPONSIVE + FIXED API)
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
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
  BarChart3
} from 'lucide-react';
import { saleService } from '../services/sale.service';
import { productService } from '../services/product.service';
import { stockService } from '../services/stock.service';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '../components/ui/badge';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    todayDebtPayments: 0,
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
  const [lastResetDate, setLastResetDate] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Get last reset date from localStorage
    const savedResetDate = localStorage.getItem('analytics_reset_date');
    if (savedResetDate) {
      setLastResetDate(new Date(savedResetDate));
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch core dashboard data
      const [dailySalesRes, lowStockRes, stockValueRes, topProductsRes, topCustomersRes] = await Promise.all([
        saleService.getDailySales(),
        productService.getLowStock(),
        stockService.getStockValue(),
        api.get('/sales/analytics/top-products', { params: { limit: 5 } }),
        api.get('/sales/analytics/top-customers', { params: { limit: 5 } })
      ]);

      const todaySales = dailySalesRes.data.summary;
      const salesList = dailySalesRes.data.sales;

      // NEW: Fetch additional data with error handling
      let todayDebtPayments = 0;
      let monthlyProfitData = [];

      try {
        // Fetch today's debt payments
        const debtPaymentsRes = await api.get('/api/debts/payments/today');
        todayDebtPayments = debtPaymentsRes.data.totalPayments || 0;
      } catch (error) {
        console.warn('Could not fetch debt payments:', error);
        // Continue without debt payments data
      }

      try {
        // Fetch monthly revenue and profit data
        const monthlyRes = await api.get('/api/reports/monthly-profit');
        monthlyProfitData = monthlyRes.data.months || [];
      } catch (error) {
        console.warn('Could not fetch monthly profit data:', error);
        // Continue without monthly data
      }

      setStats({
        todaySales: todaySales.salesCount,
        todayRevenue: todaySales.totalSales,
        todayDebtPayments,
        lowStockCount: lowStockRes.data.length,
        stockValue: stockValueRes.data.stockValue
      });

      setLowStockProducts(lowStockRes.data);
      setTodaysSales(salesList);
      setTopProducts(topProductsRes.data.data || []);
      setTopCustomers(topCustomersRes.data.data || []);
      setMonthlyData(monthlyProfitData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Reset analytics functionality
  const handleResetAnalytics = async () => {
    if (window.confirm('Are you sure you want to reset the analytics data? This will clear Top Products and Top Customers data and start fresh.')) {
      try {
        // Reset the analytics data via API
        await api.post('/api/analytics/reset', { 
          types: ['products', 'customers'] 
        });
        
        // Clear local state
        setTopProducts([]);
        setTopCustomers([]);
        
        // Save reset date
        const resetDate = new Date();
        setLastResetDate(resetDate);
        localStorage.setItem('analytics_reset_date', resetDate.toISOString());
        
        alert('Analytics data has been reset. New data will start accumulating from now.');
        
        // Refetch dashboard data to get updated state
        fetchDashboardData();
      } catch (error) {
        console.error('Error resetting analytics:', error);
        alert('Error resetting analytics data');
      }
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
      {/* Header - Responsive layout */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Welcome to Bekhal Animal Feeds POS</p>
        </div>
        
        {/* Reset Analytics Button - Responsive */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {lastResetDate && (
            <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Last Reset: {formatDateTime(lastResetDate)}
            </span>
          )}
          <Button 
            variant="outline" 
            onClick={handleResetAnalytics}
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Reset Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards - Responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        {/* Today's Sales Card */}
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

        {/* Today's Revenue Card */}
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total revenue today
            </p>
          </CardContent>
        </Card>

        {/* NEW: Today's Debt Payments Card - Hidden on smallest screens */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 col-span-2 md:col-span-1 hidden sm:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Debt Payments</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-700">
              {formatCurrency(stats.todayDebtPayments)}
            </div>
            <p className="text-xs text-green-600">
              Credit collections
            </p>
          </CardContent>
        </Card>

        {/* Stock Value Card */}
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

        {/* Low Stock Items Card */}
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

      {/* NEW: Monthly Revenue & Profit Chart - Responsive container */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Monthly Revenue & Net Profit</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {monthlyData.length > 0 ? (
            <div className="h-64 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => `KES ${(value / 1000000).toFixed(1)}M`}
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
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
              Profit is calculated as Revenue minus Cost of Goods Sold.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts - Responsive grid */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Top Products Chart */}
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
                  <BarChart data={topProducts} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="productName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
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

        {/* Top Customers Chart */}
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
                  <BarChart data={topCustomers} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="customerName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
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

      {/* Low Stock Alert - Responsive layout */}
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

      {/* Low Stock Dialog - Responsive */}
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

      {/* Today's Sales Dialog - Responsive */}
      <Dialog open={showTodaysSalesDialog} onOpenChange={setShowTodaysSalesDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Today's Sales ({todaysSales.length})</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Summary Cards - Responsive */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
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
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xs sm:text-sm text-gray-600">Average Sale</div>
                  <div className="text-lg sm:text-2xl font-bold">
                    {formatCurrency(todaysSales.length > 0 ? stats.todayRevenue / todaysSales.length : 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Table - Responsive */}
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
