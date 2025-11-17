// client/src/pages/Production.jsx - FULLY UPDATED

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Search, Plus, Trash2, Play, Square, Save, Zap, Package } from 'lucide-react';
import { productService } from '../services/product.service';
import { productionService } from '../services/production.service';
import { formatCurrency } from '../lib/utils';
import api from '../services/api';

export default function Production() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Include TELE products
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [productionActive, setProductionActive] = useState(false);
  const [productionType, setProductionType] = useState('standard'); // 'standard' or 'custom'
  const [finalProduct, setFinalProduct] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customOutputName, setCustomOutputName] = useState('');
  const [outputBags, setOutputBags] = useState('');
  const [outputKgs, setOutputKgs] = useState('');
  const [loading, setLoading] = useState(false);
  const [productionHistory, setProductionHistory] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [showSaveFormulaDialog, setShowSaveFormulaDialog] = useState(false);
  const [formulaName, setFormulaName] = useState('');
  const [showExecuteFormulaDialog, setShowExecuteFormulaDialog] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [activeTab, setActiveTab] = useState('manual');

  useEffect(() => {
    fetchProducts();
    fetchAllProducts();
    fetchProductionHistory();
    fetchFormulas();
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
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await productService.getAll();
      setAllProducts(response.data);
    } catch (error) {
      console.error('Error fetching all products:', error);
    }
  };

  const fetchProductionHistory = async () => {
    try {
      const response = await productionService.getHistory({ limit: 20 });
      setProductionHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching production history:', error);
    }
  };

  const fetchFormulas = async () => {
    try {
      const response = await api.get('/production-formulas');
      setFormulas(response.data.data || []);
    } catch (error) {
      console.error('Error fetching formulas:', error);
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
      baseUnit: product.baseUnit,
      sellingPrice: product.sellingPrice,
      buyingPrice: product.buyingPrice,
      useBuyingPrice: false
    }]);
  };

  const updateIngredientQuantity = (productId, quantity) => {
    setIngredients(ingredients.map(ing =>
      ing.product === productId ? { ...ing, quantity: parseFloat(quantity) || '' } : ing
    ));
  };

  const updateIngredientPriceType = (productId, useBuyingPrice) => {
    setIngredients(ingredients.map(ing =>
      ing.product === productId ? { ...ing, useBuyingPrice } : ing
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

    // Validate stock
    for (const ing of ingredients) {
      if (ing.quantity > ing.availableQuantity) {
        alert(`Insufficient stock for ${ing.name}. Available: ${ing.availableQuantity} ${ing.unit}`);
        return;
      }
    }

    setProductionActive(true);
    alert('Production started! Ingredient stock will be deducted when you complete production.');
  };

  const endProduction = async () => {
    if (productionType === 'standard' && !finalProduct) {
      alert('Please select the final TELE product');
      return;
    }

    if (productionType === 'custom') {
      if (!customerName || !customOutputName) {
        alert('Please enter customer name and output product name');
        return;
      }
    }

    if (!outputBags && !outputKgs) {
      alert('Please enter the output quantity (bags and/or kgs)');
      return;
    }

    try {
      setLoading(true);

      const outputQuantity = parseFloat(outputBags || 0) + (parseFloat(outputKgs || 0) / 50);

      const productionData = {
        type: productionType,
        ingredients: ingredients.map(ing => ({
          product: ing.product,
          quantity: ing.quantity,
          unit: ing.unit,
          useBuyingPrice: ing.useBuyingPrice
        })),
        outputQuantity,
        outputBags: parseFloat(outputBags || 0),
        outputKgs: parseFloat(outputKgs || 0)
      };

      if (productionType === 'standard') {
        productionData.finalProduct = finalProduct;
      } else {
        productionData.customerName = customerName;
        productionData.customOutputName = customOutputName;
      }

      await productionService.complete(productionData);

      alert('Production completed successfully!');
      
      // Reset form
      resetProduction();
      
      // Refresh data
      fetchProducts();
      fetchAllProducts();
      fetchProductionHistory();
    } catch (error) {
      console.error('Error completing production:', error);
      alert('Error completing production: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const saveFormula = async () => {
    if (!formulaName) {
      alert('Please enter a formula name');
      return;
    }

    if (ingredients.length === 0) {
      alert('Please add ingredients first');
      return;
    }

    try {
      setLoading(true);

      const formulaData = {
        name: formulaName,
        type: productionType,
        ingredients: ingredients.map(ing => ({
          product: ing.product,
          quantity: ing.quantity,
          unit: ing.unit,
          useBuyingPrice: ing.useBuyingPrice
        })),
        defaultOutputBags: parseFloat(outputBags || 0),
        defaultOutputKgs: parseFloat(outputKgs || 0)
      };

      if (productionType === 'standard') {
        formulaData.finalProduct = finalProduct;
      } else {
        formulaData.customerName = customerName;
        formulaData.customOutputName = customOutputName;
      }

      await api.post('/production-formulas', formulaData);

      alert('Formula saved successfully!');
      setShowSaveFormulaDialog(false);
      setFormulaName('');
      fetchFormulas();
    } catch (error) {
      console.error('Error saving formula:', error);
      alert('Error saving formula: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const executeFormula = async () => {
    if (!selectedFormula) return;

    try {
      setLoading(true);

      await api.post(`/production-formulas/${selectedFormula._id}/execute`, {
        outputBags: outputBags || selectedFormula.defaultOutputBags,
        outputKgs: outputKgs || selectedFormula.defaultOutputKgs
      });

      alert('Formula executed successfully!');
      setShowExecuteFormulaDialog(false);
      setSelectedFormula(null);
      
      fetchProducts();
      fetchAllProducts();
      fetchProductionHistory();
    } catch (error) {
      console.error('Error executing formula:', error);
      alert('Error executing formula: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadFormula = (formula) => {
    setSelectedFormula(formula);
    setShowExecuteFormulaDialog(true);
    setOutputBags(formula.defaultOutputBags?.toString() || '');
    setOutputKgs(formula.defaultOutputKgs?.toString() || '');
  };

  const resetProduction = () => {
    setIngredients([]);
    setFinalProduct('');
    setCustomerName('');
    setCustomOutputName('');
    setOutputBags('');
    setOutputKgs('');
    setProductionActive(false);
    setProductionType('standard');
  };

  const calculateTotalCost = () => {
    return ingredients.reduce((sum, ing) => {
      if (ing.quantity) {
        const price = ing.useBuyingPrice ? ing.buyingPrice : ing.sellingPrice;
        return sum + (price * ing.quantity);
      }
      return sum;
    }, 0);
  };

  const getTeleProducts = () => {
    return allProducts.filter(p => p.name.toUpperCase().includes('TELE'));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production</h1>
          <p className="text-gray-600">Create TELE FEEDS products or custom combinations</p>
        </div>
        <div className="flex space-x-2">
          {!productionActive ? (
            <>
              <Button 
                onClick={() => setShowSaveFormulaDialog(true)} 
                disabled={ingredients.length === 0}
                variant="outline"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Formula
              </Button>
              <Button onClick={beginProduction} disabled={ingredients.length === 0}>
                <Play className="mr-2 h-4 w-4" />
                Begin Production
              </Button>
            </>
          ) : (
            <Button onClick={endProduction} disabled={loading} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              End Production
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Production</TabsTrigger>
          <TabsTrigger value="formulas">Saved Formulas</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          {/* Production Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Production Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button
                  variant={productionType === 'standard' ? 'default' : 'outline'}
                  onClick={() => setProductionType('standard')}
                  disabled={productionActive}
                  className="flex-1"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Standard (TELE Feeds)
                </Button>
                <Button
                  variant={productionType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setProductionType('custom')}
                  disabled={productionActive}
                  className="flex-1"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Custom Combination
                </Button>
              </div>
            </CardContent>
          </Card>

          {productionActive && (
            <Card className="border-2 border-blue-500 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">
                      🔄 Production in Progress ({productionType === 'standard' ? 'Standard' : 'Custom'})
                    </p>
                    <p className="text-sm text-blue-700">
                      {productionType === 'standard' 
                        ? 'Select final product and enter output quantity below' 
                        : 'Enter customer details and output quantity below'}
                    </p>
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
                    {allProducts.map((product) => (
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
                            S: {formatCurrency(product.sellingPrice)}
                          </p>
                          <p className="text-sm text-green-600 font-semibold">
                            B: {formatCurrency(product.buyingPrice)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Ingredients & Output */}
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
                            
                            {/* Price Type Selector */}
                            <Select 
                              value={ing.useBuyingPrice ? 'buying' : 'selling'}
                              onValueChange={(value) => updateIngredientPriceType(ing.product, value === 'buying')}
                              disabled={productionActive}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="selling">
                                  Selling: {formatCurrency(ing.sellingPrice)}
                                </SelectItem>
                                <SelectItem value="buying">
                                  Buying: {formatCurrency(ing.buyingPrice)}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {ing.quantity && (
                              <p className="text-xs text-blue-600 font-semibold">
                                Cost: {formatCurrency((ing.useBuyingPrice ? ing.buyingPrice : ing.sellingPrice) * ing.quantity)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {productionActive && (
                    <div className="border-t pt-4 space-y-4">
                      {productionType === 'standard' ? (
                        <div className="space-y-2">
                          <Label>Final TELE Product</Label>
                          <Select value={finalProduct} onValueChange={setFinalProduct}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select TELE product" />
                            </SelectTrigger>
                            <SelectContent>
                              {getTeleProducts().map((product) => (
                                <SelectItem key={product._id} value={product._id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>Customer Name</Label>
                            <Input
                              placeholder="Enter customer name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Product Name</Label>
                            <Input
                              placeholder="e.g., John's Custom Mix"
                              value={customOutputName}
                              onChange={(e) => setCustomOutputName(e.target.value)}
                            />
                          </div>
                        </>
                      )}

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
        </TabsContent>

        <TabsContent value="formulas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Production Formulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {formulas.map((formula) => (
                  <Card key={formula._id} className="border-2 hover:border-blue-500 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{formula.name}</h3>
                          <p className="text-sm text-gray-600">
                            Type: {formula.type === 'standard' ? 'Standard (TELE)' : 'Custom Combination'}
                          </p>
                          {formula.type === 'standard' && formula.finalProductName && (
                            <p className="text-sm text-blue-600">
                              Final Product: {formula.finalProductName}
                            </p>
                          )}
                          {formula.type === 'custom' && formula.customerName && (
                            <p className="text-sm text-purple-600">
                              Customer: {formula.customerName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Ingredients: {formula.ingredients?.length || 0} | 
                            Used: {formula.usageCount || 0} times
                          </p>
                        </div>
                        <Button onClick={() => loadFormula(formula)}>
                          <Play className="mr-2 h-4 w-4" />
                          Execute
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {formulas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No saved formulas yet. Create a production and save it as a formula!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Production History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Production History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Production #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Final Product</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionHistory.map((prod) => (
                <TableRow key={prod._id}>
                  <TableCell className="font-medium">{prod.productionNumber}</TableCell>
                  <TableCell>{new Date(prod.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {prod.type === 'standard' ? 'Standard' : 'Custom'}
                  </TableCell>
                  <TableCell>
                    {prod.type === 'standard' 
                      ? prod.finalProductName 
                      : `${prod.customerName} - ${prod.customOutputName}`}
                  </TableCell>
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

      {/* Save Formula Dialog */}
      <Dialog open={showSaveFormulaDialog} onOpenChange={setShowSaveFormulaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Production Formula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Formula Name</Label>
              <Input
                placeholder="e.g., TELE Kienyeji Standard"
                value={formulaName}
                onChange={(e) => setFormulaName(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-600">
              This will save the current ingredients and quantities for quick reuse.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveFormulaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveFormula} disabled={loading}>
              {loading ? 'Saving...' : 'Save Formula'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute Formula Dialog */}
      <Dialog open={showExecuteFormulaDialog} onOpenChange={setShowExecuteFormulaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Formula: {selectedFormula?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Ingredients:</h4>
              {selectedFormula?.ingredients.map((ing, idx) => (
                <div key={idx} className="text-sm">
                  • {ing.productName}: {ing.quantity} {ing.unit}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Output Bags</Label>
                <Input
                  type="number"
                  value={outputBags}
                  onChange={(e) => setOutputBags(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Output Kgs</Label>
                <Input
                  type="number"
                  value={outputKgs}
                  onChange={(e) => setOutputKgs(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExecuteFormulaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeFormula} disabled={loading}>
              {loading ? 'Executing...' : 'Execute Production'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}