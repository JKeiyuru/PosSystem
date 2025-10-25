// client/src/pages/Stock.jsx

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
import { Plus, PackagePlus, History } from 'lucide-react';
import { productService } from '../services/product.service';
import { stockService } from '../services/stock.service';
import { formatCurrency, formatDateTime } from '../lib/utils';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [stockValue, setStockValue] = useState(null);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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

    // Auto-fill prices when product is selected
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
      damaged: { label: 'Damaged', color: 'bg-red-100 text-red-800' }
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

      {/* Stock Value Cards */}
      {stockValue && (
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
                      {product.quantity} {product.unit}
                    </span>
                  </TableCell>
                  <TableCell>{product.reorderLevel} {product.unit}</TableCell>
                  <TableCell>{formatCurrency(product.buyingPrice)}</TableCell>
                  <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                  <TableCell>{formatCurrency(product.quantity * product.buyingPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Stock Movements */}
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