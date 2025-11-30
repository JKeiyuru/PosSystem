// client/src/pages/Dashboard.jsx - CONSOLIDATED WITH ALL FEATURES
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
      
      const dailySalesRes = await saleService.getDailySales();
      const todaySales = dailySalesRes.data.summary;
      const salesList = dailySalesRes.data.sales;
      
      const lowStockRes = await productService.getLowStock();
      const stockValueRes = await stockService.getStockValue();

      // Fetch analytics data
      const topProductsRes = await api.get('/sales/analytics/top-products', {
        params: { limit: 5 }
      });
      const topCustomersRes = await api.get('/sales/analytics/top-customers', {
        params: { limit: 5 }
      });

      // NEW: Fetch monthly revenue and profit data
      const monthlyRes = await api.get('/sales/analytics/monthly-revenue-profit');
      
      // NEW: Fetch today's debt payments
      const debtPaymentsRes = await api.get('/sales/daily-debt-payments');

      setStats({
        todaySales: todaySales.salesCount,
        todayRevenue: todaySales.totalSales,
        todayDebtPayments: debtPaymentsRes.data.totalDebtPayments || 0,
        lowStockCount: lowStockRes.data.length,
        stockValue: stockValueRes.data.stockValue
      });

      setLowStockProducts(lowStockRes.data);
      setTodaysSales(salesList);
      setTopProducts(topProductsRes.data.data || []);
      setTopCustomers(topCustomersRes.data.data || []);
      setMonthlyData(monthlyRes.data.data || []);

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
        await api.post('/analytics/reset');
        
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
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome to Bekhal Animal Feeds POS</p>
        </div>
        {/* NEW: Reset Analytics Button */}
        <div className="flex items-center space-x-2">
          {lastResetDate && (
            <span className="text-sm text-gray-600">
              Last Reset: {formatDateTime(lastResetDate)}
            </span>
          )}
          <Button variant="outline" onClick={handleResetAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards - Enhanced with 5 columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowTodaysSalesDialog(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySales}</div>
            <p className="text-xs text-muted-foreground">
              Click to view details
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue today
            </p>
          </CardContent>
        </Card>

        {/* NEW: Today's Debt Payments Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debt Payments Today</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.todayDebtPayments)}</div>
            <p className="text-xs text-green-600">
              Credit collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.stockValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total inventory value
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowLowStockDialog(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Click to view items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Monthly Revenue & Profit Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Monthly Revenue & Net Profit</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `KES ${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#2563eb" name="Total Revenue" />
                <Bar dataKey="profit" fill="#16a34a" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No monthly data available yet
            </div>
          )}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> This chart shows total revenue and net profit for each month. 
              Profit is calculated as Revenue minus Cost of Goods Sold.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts - Enhanced with reset indicators */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Top 5 Best Selling Products</span>
              </div>
              {lastResetDate && (
                <Badge variant="secondary" className="text-xs">
                  Since {new Date(lastResetDate).toLocaleDateString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="productName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Product: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#2563eb" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No sales data available yet. Data will accumulate after reset.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Top 5 Customers by Purchases</span>
              </div>
              {lastResetDate && (
                <Badge variant="secondary" className="text-xs">
                  Since {new Date(lastResetDate).toLocaleDateString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCustomers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="customerName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Customer: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="totalPurchases" fill="#16a34a" name="Total Purchases" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No customer data available yet. Data will accumulate after reset.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && lowStockProducts.slice(0, 5).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Low Stock Alert (Top 5)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Current: {product.quantity} {product.baseUnit} | Reorder: {product.reorderLevel} {product.baseUnit}
                    </p>
                  </div>
                  {product.quantity === 0 ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : (
                    <Badge variant="warning">Low Stock</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Dialog */}
      <Dialog open={showLowStockDialog} onOpenChange={setShowLowStockDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Low Stock Items ({lowStockProducts.length})</DialogTitle>
          </DialogHeader>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.quantity} {product.baseUnit}</TableCell>
                  <TableCell>{product.reorderLevel} {product.baseUnit}</TableCell>
                  <TableCell>
                    {product.quantity === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : (
                      <Badge variant="warning">Low Stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Today's Sales Dialog */}
      <Dialog open={showTodaysSalesDialog} onOpenChange={setShowTodaysSalesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Today's Sales ({todaysSales.length})</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Total Sales</div>
                  <div className="text-2xl font-bold">{todaysSales.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Average Sale</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(todaysSales.length > 0 ? stats.todayRevenue / todaysSales.length : 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysSales.map((sale) => (
                  <TableRow key={sale._id}>
                    <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                    <TableCell>{formatDateTime(sale.saleDate)}</TableCell>
                    <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                    <TableCell className="capitalize">{sale.paymentMethod.replace('_', ' ')}</TableCell>
                    <TableCell>{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {sale.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
