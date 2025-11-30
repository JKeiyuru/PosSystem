// client/src/pages/Products.jsx - COMPLETE WITH ALL FEATURES

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
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Plus, Edit, Trash2, Barcode, Upload, Search, X, History, AlertCircle } from 'lucide-react';
import { productService } from '../services/product.service';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import * as XLSX from 'xlsx';

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showQuantityLog, setShowQuantityLog] = useState(false);
  const [quantityChangeInfo, setQuantityChangeInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    baseUnit: 'bag',
    baseUnitSize: '50',
    buyingPrice: '',
    sellingPrice: '',
    quantity: '',
    reorderLevel: '10',
    supplier: '',
    hasMultipleUnits: false,
    subUnits: []
  });

  const canEditProducts = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchQuery, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const params = { search: searchQuery };
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const response = await productService.getAll(params);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const calculateConversionRate = (unitType, sellingPrice, unitPrice, manualRate = null) => {
    if (manualRate) return manualRate;
    
    const baseSelling = parseFloat(sellingPrice) || 0;
    const perUnitPrice = parseFloat(unitPrice) || 0;
    
    if (perUnitPrice <= 0) return '';

    let totalIfSoldInUnits;
    
    if (unitType === 'kasuku') {
      totalIfSoldInUnits = baseSelling + 60;
    } else if (unitType === 'bucket') {
      totalIfSoldInUnits = baseSelling + 100;
    } else if (unitType === 'kg') {
      totalIfSoldInUnits = baseSelling;
    } else {
      return '';
    }
    
    const conversionRate = totalIfSoldInUnits / perUnitPrice;
    return conversionRate.toFixed(2);
  };

  const handleQuantityChange = (newQuantity) => {
    if (editingProduct) {
      const previousQty = parseFloat(editingProduct.quantity);
      const newQty = parseFloat(newQuantity);
      const difference = newQty - previousQty;
      
      setQuantityChangeInfo({
        previousQuantity: previousQty,
        quantityAdded: difference,
        newQuantity: newQty
      });
    }
    
    setFormData({ ...formData, quantity: newQuantity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEditProducts) {
      alert('You do not have permission to edit products');
      return;
    }

    try {
      const updatedSubUnits = formData.subUnits.map(subUnit => ({
        ...subUnit,
        conversionRate: parseFloat(subUnit.conversionRate) || 0,
        pricePerUnit: parseFloat(subUnit.pricePerUnit) || 0,
        profitMargin: subUnit.name === 'kasuku' ? 60 : subUnit.name === 'bucket' ? 100 : 0,
        manualConversionRate: subUnit.manualConversionRate || false
      }));

      const dataToSubmit = {
        ...formData,
        baseUnitSize: parseFloat(formData.baseUnitSize),
        subUnits: updatedSubUnits
      };

      if (editingProduct) {
        await productService.update(editingProduct._id, dataToSubmit);
        
        if (quantityChangeInfo) {
          console.log('Quantity Change Log:', {
            product: editingProduct.name,
            ...quantityChangeInfo,
            timestamp: new Date(),
            user: user.name
          });
        }
      } else {
        await productService.create(dataToSubmit);
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
      fetchCategories();
      setQuantityChangeInfo(null);
      alert('Product saved successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (product) => {
    if (!canEditProducts) {
      alert('You do not have permission to edit products');
      return;
    }

    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      baseUnit: product.baseUnit || 'bag',
      baseUnitSize: product.baseUnitSize?.toString() || '50',
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      reorderLevel: product.reorderLevel,
      supplier: product.supplier || '',
      hasMultipleUnits: product.hasMultipleUnits || false,
      subUnits: product.subUnits || []
    });
    setQuantityChangeInfo(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!canEditProducts) {
      alert('You do not have permission to delete products');
      return;
    }

    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(id);
        fetchProducts();
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  const handleGenerateBarcode = async (id) => {
    try {
      const response = await productService.generateBarcode(id);
      alert(`Barcode generated: ${response.data.barcode}`);
      fetchProducts();
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      baseUnit: 'bag',
      baseUnitSize: '50',
      buyingPrice: '',
      sellingPrice: '',
      quantity: '',
      reorderLevel: '10',
      supplier: '',
      hasMultipleUnits: false,
      subUnits: []
    });
    setEditingProduct(null);
    setQuantityChangeInfo(null);
  };

  const addSubUnit = () => {
    setFormData({
      ...formData,
      subUnits: [
        ...formData.subUnits,
        {
          name: 'kg',
          conversionRate: '',
          pricePerUnit: '',
          profitMargin: 0,
          manualConversionRate: false
        }
      ]
    });
  };

  const removeSubUnit = (index) => {
    const newSubUnits = formData.subUnits.filter((_, i) => i !== index);
    setFormData({ ...formData, subUnits: newSubUnits });
  };

  const updateSubUnit = (index, field, value) => {
    const newSubUnits = [...formData.subUnits];
    newSubUnits[index][field] = value;
    
    if (field === 'pricePerUnit' && !newSubUnits[index].manualConversionRate) {
      const conversionRate = calculateConversionRate(
        newSubUnits[index].name,
        formData.sellingPrice,
        value
      );
      newSubUnits[index].conversionRate = conversionRate;
    }
    
    if (field === 'name') {
      newSubUnits[index].profitMargin = value === 'kasuku' ? 60 : value === 'bucket' ? 100 : 0;
      if (!newSubUnits[index].manualConversionRate) {
        newSubUnits[index].conversionRate = calculateConversionRate(
          value,
          formData.sellingPrice,
          newSubUnits[index].pricePerUnit
        );
      }
    }

    if (field === 'manualConversionRate') {
      newSubUnits[index][field] = value;
      if (!value && newSubUnits[index].pricePerUnit) {
        newSubUnits[index].conversionRate = calculateConversionRate(
          newSubUnits[index].name,
          formData.sellingPrice,
          newSubUnits[index].pricePerUnit
        );
      }
    }

    if (field === 'conversionRate') {
      newSubUnits[index].manualConversionRate = true;
    }
    
    setFormData({ ...formData, subUnits: newSubUnits });
  };

  const handleSellingPriceChange = (value) => {
    const updatedSubUnits = formData.subUnits.map(subUnit => {
      if (subUnit.manualConversionRate) return subUnit;
      
      return {
        ...subUnit,
        conversionRate: calculateConversionRate(
          subUnit.name,
          value,
          subUnit.pricePerUnit
        )
      };
    });
    
    setFormData({
      ...formData,
      sellingPrice: value,
      subUnits: updatedSubUnits
    });
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const products = jsonData.map(row => {
          const sellingPrice = parseFloat(row['Selling Price'] || row.sellingPrice || 0);
          const bagSize = parseFloat(row['Bag Size (kg)'] || row.bagSize || 50);
          const kgPrice = parseFloat(row['Price Per Kg'] || row.pricePerKg || 0);
          const kasukuPrice = parseFloat(row['Price Per Kasuku'] || row.pricePerKasuku || 0);
          const bucketPrice = parseFloat(row['Price Per Bucket'] || row.pricePerBucket || 0);

          const subUnits = [];

          if (kgPrice > 0) {
            const conversionRate = sellingPrice / kgPrice;
            subUnits.push({
              name: 'kg',
              conversionRate: parseFloat(conversionRate.toFixed(2)),
              pricePerUnit: kgPrice,
              profitMargin: 0
            });
          }

          if (kasukuPrice > 0) {
            const conversionRate = (sellingPrice + 60) / kasukuPrice;
            subUnits.push({
              name: 'kasuku',
              conversionRate: parseFloat(conversionRate.toFixed(2)),
              pricePerUnit: kasukuPrice,
              profitMargin: 60
            });
          }

          if (bucketPrice > 0) {
            const conversionRate = (sellingPrice + 100) / bucketPrice;
            subUnits.push({
              name: 'bucket',
              conversionRate: parseFloat(conversionRate.toFixed(2)),
              pricePerUnit: bucketPrice,
              profitMargin: 100
            });
          }

          return {
            name: row.Name || row.name,
            category: row.Category || row.category,
            description: row.Description || row.description || '',
            baseUnit: row['Base Unit'] || row.baseUnit || 'bag',
            baseUnitSize: bagSize,
            buyingPrice: parseFloat(row['Buying Price'] || row.buyingPrice || 0),
            sellingPrice: sellingPrice,
            quantity: parseInt(row.Quantity || row.quantity || 0),
            reorderLevel: parseInt(row['Reorder Level'] || row.reorderLevel || 10),
            supplier: row.Supplier || row.supplier || '',
            hasMultipleUnits: subUnits.length > 0,
            subUnits: subUnits
          };
        });

        await productService.bulkImport(products);
        alert(`${products.length} products imported successfully!`);
        setIsImportDialogOpen(false);
        fetchProducts();
        fetchCategories();

      } catch (error) {
        console.error('Error importing products:', error);
        alert('Error importing products: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getStockBadge = (product) => {
    if (product.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.quantity <= product.reorderLevel) {
      return <Badge variant="warning">Low Stock</Badge>;
    }
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        {canEditProducts && (
          <div className="flex space-x-2">
            <Button onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Bag Size (kg)</TableHead>
                  <TableHead>Buying Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Status</TableHead>
                  {canEditProducts && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      {product.barcode || (
                        canEditProducts && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateBarcode(product._id)}
                          >
                            <Barcode className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </TableCell>
                    <TableCell>{product.baseUnitSize || 50} kg</TableCell>
                    <TableCell>{formatCurrency(product.buyingPrice)}</TableCell>
                    <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                    <TableCell>
                      {product.quantity} {product.baseUnit}
                      {product.openedBags > 0 && (
                        <span className="text-xs text-orange-600 block">
                          ({product.openedBags} opened)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.hasMultipleUnits ? (
                        <Badge variant="default">Multi-Unit</Badge>
                      ) : (
                        <Badge variant="secondary">Single</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStockBadge(product)}</TableCell>
                    {canEditProducts && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Base Unit</Label>
                <Select 
                  value={formData.baseUnit} 
                  onValueChange={(value) => setFormData({ ...formData, baseUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bag">Bag</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bag Weight (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.baseUnitSize}
                  onChange={(e) => setFormData({ ...formData, baseUnitSize: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-600">Weight per bag (e.g., 50kg or 70kg)</p>
              </div>

              <div className="space-y-2">
                <Label>Buying Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.buyingPrice}
                  onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Selling Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={( e) => handleSellingPriceChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  required
                />
                {quantityChangeInfo && (
                  <Alert className="mt-2">
                    <History className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Quantity Change:</strong><br/>
                      Previous: {quantityChangeInfo.previousQuantity} {formData.baseUnit}<br/>
                      Added: {quantityChangeInfo.quantityAdded > 0 ? '+' : ''}{quantityChangeInfo.quantityAdded} {formData.baseUnit}<br/>
                      New Total: {quantityChangeInfo.newQuantity} {formData.baseUnit}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Supplier</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Multiple Units Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-lg">Multiple Sales Units</Label>
                  <p className="text-sm text-gray-600">Allow selling in kg, kasuku, buckets, etc.</p>
                </div>
                <Button
                  type="button"
                  variant={formData.hasMultipleUnits ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, hasMultipleUnits: !formData.hasMultipleUnits })}
                >
                  {formData.hasMultipleUnits ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {formData.hasMultipleUnits && (
                <div className="space-y-4">
                  {formData.subUnits.map((subUnit, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Unit Type</Label>
                            <Select 
                              value={subUnit.name}
                              onValueChange={(value) => updateSubUnit(index, 'name', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                <SelectItem value="kasuku">Kasuku</SelectItem>
                                <SelectItem value="bucket">Bucket</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Price Per Unit</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={subUnit.pricePerUnit}
                              onChange={(e) => updateSubUnit(index, 'pricePerUnit', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Conversion Rate
                              {subUnit.manualConversionRate && (
                                <Badge variant="secondary" className="ml-2 text-xs">Manual</Badge>
                              )}
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={subUnit.conversionRate}
                              onChange={(e) => updateSubUnit(index, 'conversionRate', e.target.value)}
                            />
                            <p className="text-xs text-gray-600">
                              {subUnit.name}s per {formData.baseUnit}
                            </p>
                          </div>

                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => removeSubUnit(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {subUnit.profitMargin > 0 && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Profit margin: {formatCurrency(subUnit.profitMargin)} added to base price
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  <Button type="button" variant="outline" onClick={addSubUnit} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Sales Unit
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload an Excel file with product data. Required columns: Name, Category, Buying Price, Selling Price, Quantity
            </p>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
