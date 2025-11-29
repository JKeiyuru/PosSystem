// client/src/pages/Stock.jsx - UPDATED with Role-Based Visibility

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Plus, PackagePlus, History, Download } from 'lucide-react';
import { productService } from '../services/product.service';
import { stockService } from '../services/stock.service';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import * as XLSX from 'xlsx';

export default function Stock() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [stockValue, setStockValue] = useState(null);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductMovements, setSelectedProductMovements] = useState(null);
  const [showMovementsDialog, setShowMovementsDialog] = useState(false);

  // Check if user can see stock cards (admin and manager only)
  const canViewStockCards = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchProducts();
    fetchStockValue();
    fetchMovements();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchStockValue = async () => {
    try {
      const response = await stockService.getStockValue();
      setStockValue(response.data);
    } catch (error) {
      console.error('Error fetching stock value:', error);
    }
  };

  const fetchMovements = async () => {
    try {
      const response = await stockService.getMovements();
      setMovements(response.data);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const fetchProductMovements = async (productId, productName) => {
    try {
      const response = await stockService.getMovements({ productId });
      setSelectedProductMovements({
        productName,
        movements: response.data
      });
      setShowMovementsDialog(true);
    } catch (error) {
      console.error('Error fetching product movements:', error);
    }
  };

  const exportProductMovements = (productName, movements) => {
    const exportData = movements.map(movement => ({
      'Date': formatDateTime(movement.createdAt),
      'Type': movement.movementType,
      'Quantity': movement.quantity,
      'Previous Quantity': movement.previousQuantity,
      'New Quantity': movement.newQuantity,
      'Reference': movement.reference || '',
      'Notes': movement.notes || '',
      'Performed By': movement.performedBy?.name || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Movement');
    XLSX.writeFile(wb, `Stock_Movement_${productName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleAddProduct = () => {
    setSelectedProducts([...selectedProducts, {
      productId: '',
      quantity: '',
      buyingPrice: '',
      sellingPrice: '',
      notes: ''
    }]);
  };

  const handleRemoveProduct = (index) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...selectedProducts];
    updated[index][field] = value;

    if (field === 'productId' && value) {
      const product = products.find(p => p._id === value);
      if (product) {
        updated[index].buyingPrice = product.buyingPrice;
        updated[index].sellingPrice = product.sellingPrice;
      }
    }

    setSelectedProducts(updated);
  };

  const handleBulkRestock = async () => {
    try {
      const items = selectedProducts.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        buyingPrice: parseFloat(item.buyingPrice),
        sellingPrice: parseFloat(item.sellingPrice),
        notes: item.notes
      }));

      await stockService.bulkRestock(items);
      alert('Products restocked successfully!');
      
      setIsRestockDialogOpen(false);
      setSelectedProducts([]);
      fetchProducts();
      fetchStockValue();
      fetchMovements();
    } catch (error) {
      console.error('Error restocking:', error);
      alert('Error restocking products: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMovementTypeBadge = (type) => {
    const types = {
      restock: { label: 'Restock', color: 'bg-green-100 text-green-800' },
      sale: { label: 'Sale', color: 'bg-blue-100 text-blue-800' },
      adjustment: { label: 'Adjustment', color: 'bg-yellow-100 text-yellow-800' },
      return: { label: 'Return', color: 'bg-purple-100 text-purple-800' },
      damaged: { label: 'Damaged', color: 'bg-red-100 text-red-800' },
      production: { label: 'Production', color: 'bg-indigo-100 text-indigo-800' }
    };
    const typeInfo = types[type] || types.adjustment;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-gray-600">Manage inventory and stock movements</p>
        </div>
        <Button onClick={() => { setSelectedProducts([{ productId: '', quantity: '', buyingPrice: '', sellingPrice: '', notes: '' }]); setIsRestockDialogOpen(true); }}>
          <PackagePlus className="mr-2 h-4 w-4" />
          Bulk Restock
        </Button>
      </div>

      {/* Stock Value Cards - Only for Admin/Manager */}
      {canViewStockCards && stockValue && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stockValue.stockValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stockValue.potentialRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stockValue.potentialProfit)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockValue.totalItems}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Stock Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Buying Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Stock Value</TableHead>
                {canViewStockCards && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <span className={
                      product.quantity === 0 ? 'text-red-600 font-semibold' :
                      product.quantity <= product.reorderLevel ? 'text-yellow-600 font-semibold' :
                      'text-green-600'
                    }>
                      {product.quantity} {product.baseUnit}
                    </span>
                  </TableCell>
                  <TableCell>{product.reorderLevel} {product.baseUnit}</TableCell>
                  <TableCell>{formatCurrency(product.buyingPrice)}</TableCell>
                  <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                  <TableCell>{formatCurrency(product.quantity * product.buyingPrice)}</TableCell>
                  {canViewStockCards && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchProductMovements(product._id, product.name)}
                      >
                        <History className="h-4 w-4 mr-1" />
                        View History
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Stock Movements - Only for Admin/Manager */}
      {canViewStockCards && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Recent Stock Movements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 10).map((movement) => (
                  <TableRow key={movement._id}>
                    <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell>{movement.product?.name}</TableCell>
                    <TableCell>{getMovementTypeBadge(movement.movementType)}</TableCell>
                    <TableCell>
                      <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{movement.previousQuantity}</TableCell>
                    <TableCell>{movement.newQuantity}</TableCell>
                    <TableCell>{movement.performedBy?.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Product Movement History Dialog */}
      <Dialog open={showMovementsDialog} onOpenChange={setShowMovementsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Stock Movement History - {selectedProductMovements?.productName}
            </DialogTitle>
          </DialogHeader>

          {selectedProductMovements && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => exportProductMovements(
                    selectedProductMovements.productName,
                    selectedProductMovements.movements
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity Change</TableHead>
                    <TableHead>Previous Qty</TableHead>
                    <TableHead>New Qty</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProductMovements.movements.map((movement) => (
                    <TableRow key={movement._id}>
                      <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                      <TableCell>{getMovementTypeBadge(movement.movementType)}</TableCell>
                      <TableCell>
                        <span className={movement.quantity > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{movement.previousQuantity}</TableCell>
                      <TableCell>{movement.newQuantity}</TableCell>
                      <TableCell>{movement.reference || movement.notes || '-'}</TableCell>
                      <TableCell>{movement.performedBy?.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Restock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Restock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProducts.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Product</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} (Current: {product.quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Buying Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.buyingPrice}
                        onChange={(e) => handleProductChange(index, 'buyingPrice', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.sellingPrice}
                        onChange={(e) => handleProductChange(index, 'sellingPrice', e.target.value)}
                      />
                    </div>

                    <div className="col-span-4 space-y-2">
                      <Label>Notes</Label>
                      <Input
                        value={item.notes}
                        onChange={(e) => handleProductChange(index, 'notes', e.target.value)}
                        placeholder="Optional notes..."
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Add Another Product
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsRestockDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleBulkRestock}>
              Restock Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
