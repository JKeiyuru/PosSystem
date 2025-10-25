/* eslint-disable react-hooks/exhaustive-deps */
// client/src/pages/Products.jsx - Update the form to include sub-units

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
import { Plus, Edit, Trash2, Barcode, Upload, Search, X } from 'lucide-react';
import { productService } from '../services/product.service';
import { formatCurrency } from '../lib/utils';
import * as XLSX from 'xlsx';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    baseUnit: 'bag',
    buyingPrice: '',
    sellingPrice: '',
    quantity: '',
    reorderLevel: '10',
    supplier: '',
    hasMultipleUnits: false,
    subUnits: []
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await productService.update(editingProduct._id, formData);
      } else {
        await productService.create(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      baseUnit: product.baseUnit || 'bag',
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      reorderLevel: product.reorderLevel,
      supplier: product.supplier || '',
      hasMultipleUnits: product.hasMultipleUnits || false,
      subUnits: product.subUnits || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(id);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
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
      buyingPrice: '',
      sellingPrice: '',
      quantity: '',
      reorderLevel: '10',
      supplier: '',
      hasMultipleUnits: false,
      subUnits: []
    });
    setEditingProduct(null);
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
          profitMargin: 0
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
    setFormData({ ...formData, subUnits: newSubUnits });
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

        const products = jsonData.map(row => ({
          name: row.Name || row.name,
          category: row.Category || row.category,
          description: row.Description || row.description || '',
          baseUnit: row['Base Unit'] || row.baseUnit || 'bag',
          buyingPrice: parseFloat(row['Buying Price'] || row.buyingPrice || 0),
          sellingPrice: parseFloat(row['Selling Price'] || row.sellingPrice || 0),
          quantity: parseInt(row.Quantity || row.quantity || 0),
          reorderLevel: parseInt(row['Reorder Level'] || row.reorderLevel || 10),
          supplier: row.Supplier || row.supplier || '',
          hasMultipleUnits: false,
          subUnits: []
        }));

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
      </div>

      {/* Filters */}
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

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Buying Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    {product.barcode || (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateBarcode(product._id)}
                      >
                        <Barcode className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUnit">Base Unit *</Label>
                <Select 
                  value={formData.baseUnit} 
                  onValueChange={(value) => setFormData({...formData, baseUnit: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bag">Bag</SelectItem>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyingPrice">Buying Price (per {formData.baseUnit}) *</Label>
                <Input
                  id="buyingPrice"
                  type="number"
                  step="0.01"
                  value={formData.buyingPrice}
                  onChange={(e) => setFormData({...formData, buyingPrice: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (per {formData.baseUnit}) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity ({formData.baseUnit}s) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                />
              </div>

              {/* Multiple Units Toggle */}
              <div className="col-span-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasMultipleUnits"
                  checked={formData.hasMultipleUnits}
                  onChange={(e) => setFormData({...formData, hasMultipleUnits: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="hasMultipleUnits">This product can be sold in multiple units</Label>
              </div>

              {/* Sub-Units Section */}
              {formData.hasMultipleUnits && (
                <div className="col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Sub-Units</h3>
                    <Button type="button" onClick={addSubUnit} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Sub-Unit
                    </Button>
                  </div>

                  {formData.subUnits.map((subUnit, index) => (
                    <Card key={index} className="p-4">
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
                          <Label>Units per {formData.baseUnit}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 70"
                            value={subUnit.conversionRate}
                            onChange={(e) => updateSubUnit(index, 'conversionRate', e.target.value)}
                          />
                          <p className="text-xs text-gray-500">
                            How many {subUnit.name}s in 1 {formData.baseUnit}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Price per {subUnit.name}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={subUnit.pricePerUnit}
                            onChange={(e) => updateSubUnit(index, 'pricePerUnit', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Profit Margin (KES)</Label>
                          <Input
                            type="number"
                            step="1"
                            placeholder="0"
                            value={subUnit.profitMargin}
                            onChange={(e) => updateSubUnit(index, 'profitMargin', e.target.value)}
                          />
                          <p className="text-xs text-gray-500">
                            Extra profit if full {formData.baseUnit} sold in this unit
                          </p>
                        </div>

                        <div className="col-span-4 flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSubUnit(index)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {formData.subUnits.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No sub-units added. Click "Add Sub-Unit" to add selling units.
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog - Keep as is */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Excel File Format</Label>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Your Excel file should have the following columns:</p>
                <ul className="list-disc list-inside pl-4">
                  <li>Name (required)</li>
                  <li>Category (required)</li>
                  <li>Description</li>
                  <li>Base Unit</li>
                  <li>Buying Price (required)</li>
                  <li>Selling Price (required)</li>
                  <li>Quantity (required)</li>
                  <li>Reorder Level</li>
                  <li>Supplier</li>
                </ul>
                <p className="text-xs text-orange-600 mt-2">
                  Note: Sub-units must be added manually after import
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Select Excel File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}