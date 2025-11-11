/* eslint-disable no-unused-vars */
// client/src/pages/Production.jsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Plus, Trash2, Play, Square } from 'lucide-react';
import { productService } from '../services/product.service';
import { formatCurrency } from '../lib/utils';
import api from '../services/api';

export default function Production() {
  const [products, setProducts] = useState([]);
  const [teleProducts, setTeleProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productionActive, setProductionActive] = useState(false);
  const [finalProduct, setFinalProduct] = useState('');
  const [outputBags, setOutputBags] = useState('');
  const [outputKgs, setOutputKgs] = useState('');
  const [loading, setLoading] = useState(false);
  const [productionHistory, setProductionHistory] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchTeleProducts();
    fetchProductionHistory();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({ search: searchQuery });
      // Filter out TELE products from ingredients list
      const nonTeleProducts = response.data.filter(p => !p.name.toUpperCase().includes('TELE'));
      setProducts(nonTeleProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchTeleProducts = async () => {
    try {
      const response = await productService.getAll();
      // Filter only TELE products
      const teleOnly = response.data.filter(p => p.name.toUpperCase().includes('TELE'));
      setTeleProducts(teleOnly);
    } catch (error) {
      console.error('Error fetching TELE products:', error);
    }
  };

  const fetchProductionHistory = async () => {
    try {
      const response = await api.get('/production/history');
      setProductionHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching production history:', error);
    }
  };

  const addIngredient = (product) => {
    const existing = ingredients.find(i => i.product === product._id);
    if (existing) {
      alert('Product already added');
      return;
    }

    setIngredients([...ingredients, {
      product: product._id,
      name: product.name,
      quantity: '',
      unit: product.baseUnit,
      availableQuantity: product.quantity,
      baseUnit: product.baseUnit
    }]);
  };

  const updateIngredientQuantity = (productId, quantity) => {
    setIngredients(ingredients.map(ing =>
      ing.product === productId ? { ...ing, quantity: parseFloat(quantity) || '' } : ing
    ));
  };

  const removeIngredient = (productId) => {
    setIngredients(ingredients.filter(ing => ing.product !== productId));
  };

  const beginProduction = () => {
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    if (!ingredients.every(ing => ing.quantity > 0)) {
      alert('Please enter quantities for all ingredients');
      return;
    }

    // Validate stock availability
    for (const ing of ingredients) {
      if (ing.quantity > ing.availableQuantity) {
        alert(`Insufficient stock for ${ing.name}. Available: ${ing.availableQuantity} ${ing.unit}`);
        return;
      }
    }

    setProductionActive(true);
    alert('Production started. Stock will be deducted from ingredients.');
  };

  const endProduction = async () => {
    if (!finalProduct) {
      alert('Please select the final TELE product');
      return;
    }

    if (!outputBags && !outputKgs) {
      alert('Please enter the output quantity (bags and/or kgs)');
      return;
    }

    try {
      setLoading(true);

      const outputQuantity = parseFloat(outputBags || 0) + (parseFloat(outputKgs || 0) / 50); // Assuming 50kg per bag

      await api.post('/production/complete', {
        ingredients: ingredients.map(ing => ({
          product: ing.product,
          quantity: ing.quantity,
          unit: ing.unit
        })),
        finalProduct,
        outputQuantity,
        outputBags: parseFloat(outputBags || 0),
        outputKgs: parseFloat(outputKgs || 0)
      });

      alert('Production completed successfully!');
      
      // Reset form
      setIngredients([]);
      setFinalProduct('');
      setOutputBags('');
      setOutputKgs('');
      setProductionActive(false);
      
      // Refresh data
      fetchProducts();
      fetchTeleProducts();
      fetchProductionHistory();
    } catch (error) {
      console.error('Error completing production:', error);
      alert('Error completing production: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    return ingredients.reduce((sum, ing) => {
      const product = products.find(p => p._id === ing.product);
      if (product && ing.quantity) {
        return sum + (product.sellingPrice * ing.quantity);
      }
      return sum;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production</h1>
          <p className="text-gray-600">Create TELE FEEDS products from ingredients</p>
        </div>
        <div className="flex space-x-2">
          {!productionActive ? (
            <Button onClick={beginProduction} disabled={ingredients.length === 0}>
              <Play className="mr-2 h-4 w-4" />
              Begin Production
            </Button>
          ) : (
            <Button onClick={endProduction} disabled={loading} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              End Production
            </Button>
          )}
        </div>
      </div>

      {productionActive && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">🔄 Production in Progress</p>
                <p className="text-sm text-blue-700">Ingredients stock has been deducted</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Total Cost</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculateTotalCost())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Products */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={productionActive}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                {products.map((product) => (
                  <Card
                    key={product._id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${productionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !productionActive && addIngredient(product)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm truncate mb-2">{product.name}</h3>
                      <p className="text-xs text-gray-600">
                        Stock: {product.quantity} {product.baseUnit}
                      </p>
                      <p className="text-sm text-blue-600 font-semibold">
                        {formatCurrency(product.sellingPrice)}/{product.baseUnit}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Ingredients */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selected Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No ingredients selected</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {ingredients.map((ing) => (
                    <div key={ing.product} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm flex-1">{ing.name}</p>
                        {!productionActive && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeIngredient(ing.product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Quantity"
                          value={ing.quantity}
                          onChange={(e) => updateIngredientQuantity(ing.product, e.target.value)}
                          disabled={productionActive}
                        />
                        <p className="text-xs text-gray-600">
                          Available: {ing.availableQuantity} {ing.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {productionActive && (
                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Final TELE Product</Label>
                    <Select value={finalProduct} onValueChange={setFinalProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select TELE product" />
                      </SelectTrigger>
                      <SelectContent>
                        {teleProducts.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Output (Bags)</Label>
                      <Input
                        type="number"
                        step="1"
                        placeholder="0"
                        value={outputBags}
                        onChange={(e) => setOutputBags(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Output (Kgs)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={outputKgs}
                        onChange={(e) => setOutputKgs(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-semibold mb-1">Total Output:</p>
                    <p className="text-lg font-bold text-green-600">
                      {parseFloat(outputBags || 0)} bags + {parseFloat(outputKgs || 0)} kgs
                    </p>
                  </div>
                </div>
              )}

              {ingredients.length > 0 && !productionActive && (
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Cost:</span>
                    <span className="font-bold">{formatCurrency(calculateTotalCost())}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Production History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Production History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Final Product</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionHistory.map((prod) => (
                <TableRow key={prod._id}>
                  <TableCell>{new Date(prod.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{prod.finalProductName}</TableCell>
                  <TableCell>{prod.outputBags} bags + {prod.outputKgs} kgs</TableCell>
                  <TableCell>{formatCurrency(prod.totalCost)}</TableCell>
                  <TableCell>{prod.performedByName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {productionHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No production history yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}