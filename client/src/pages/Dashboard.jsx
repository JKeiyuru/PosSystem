// client/src/pages/Dashboard.jsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertTriangle 
} from 'lucide-react';
import { saleService } from '../services/sale.service';
import { productService } from '../services/product.service';
import { stockService } from '../services/stock.service';
import { formatCurrency } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CloseOfBusinessDialog from '../components/reports/CloseOfBusinessDialog';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    lowStockCount: 0,
    stockValue: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCloseBusinessDialog, setShowCloseBusinessDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's sales
      const dailySalesRes = await saleService.getDailySales();
      const todaySales = dailySalesRes.data.summary;
      
      // Fetch low stock products
      const lowStockRes = await productService.getLowStock();
      
      // Fetch stock value
      const stockValueRes = await stockService.getStockValue();

      setStats({
        todaySales: todaySales.salesCount,
        todayRevenue: todaySales.totalSales,
        lowStockCount: lowStockRes.data.length,
        stockValue: stockValueRes.data.stockValue
      });

      setLowStockProducts(lowStockRes.data.slice(0, 5));

      // Mock sales chart data (you can replace with actual API call)
      setSalesData([
        { name: 'Mon', sales: 12000 },
        { name: 'Tue', sales: 19000 },
        { name: 'Wed', sales: 15000 },
        { name: 'Thu', sales: 25000 },
        { name: 'Fri', sales: 22000 },
        { name: 'Sat', sales: 30000 },
        { name: 'Sun', sales: 28000 },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to Bekhal Animal Feeds POS</p>
        <div className="flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p className="text-gray-600">Welcome to Bekhal Animal Feeds POS</p>
  </div>
  <Button 
    onClick={() => setShowCloseBusinessDialog(true)}
    className="bg-red-600 hover:bg-red-700"
  >
    <AlertCircle className="mr-2 h-4 w-4" />
    Close of Business
  </Button>
</div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySales}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions today
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Low Stock Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Current: {product.quantity} {product.unit} | Reorder: {product.reorderLevel} {product.unit}
                    </p>
                  </div>
                  <span className="text-yellow-600 font-semibold">Low Stock</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <CloseOfBusinessDialog 
  open={showCloseBusinessDialog}
  onOpenChange={setShowCloseBusinessDialog}
  onSuccess={fetchDashboardData}
/>
    </div>
  );
}