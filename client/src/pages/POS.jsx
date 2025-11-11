/* eslint-disable no-unused-vars */
// client/src/pages/POS_Updated.jsx

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Search, Trash2, Plus, Minus, Package, Tag } from 'lucide-react';
import { productService } from '../services/product.service';
import { customerService } from '../services/customer.service';
import { saleService } from '../services/sale.service';
import { formatCurrency } from '../lib/utils';
import Receipt from '../components/pos/Receipt';
import ReceiptActions from '../components/pos/ReceiptActions';
import api from '../services/api';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transport, setTransport] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [splitPayments, setSplitPayments] = useState([{ method: 'cash', amount: '' }]);
  const receiptRef = useRef();

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchBusinessInfo();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({ search: searchQuery });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchBusinessInfo = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.success) {
        setBusinessInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleProductClick = (product) => {
    if (product.hasMultipleUnits && product.subUnits.length > 0) {
      setSelectedProduct(product);
      setSelectedUnit(product.baseUnit);
      setSelectedQuantity('1');
      setShowUnitDialog(true);
    } else {
      addToCart(product, product.baseUnit, 1);
    }
  };

  const handleAddToCartFromDialog = () => {
    if (!selectedUnit || !selectedQuantity || parseFloat(selectedQuantity) <= 0) {
      alert('Please select unit and enter valid quantity');
      return;
    }

    addToCart(selectedProduct, selectedUnit, parseFloat(selectedQuantity));
    setShowUnitDialog(false);
    setSelectedProduct(null);
  };

  const addToCart = (product, unit, quantity) => {
    const existingItem = cart.find(item => item.product === product._id && item.unit === unit);
    
    let availableQuantity;
    let unitPrice;
    
    if (unit === product.baseUnit) {
      availableQuantity = product.quantity;
      unitPrice = product.sellingPrice;
    } else {
      const subUnit = product.subUnits.find(su => su.name === unit);
      if (!subUnit) {
        alert('Invalid unit selected');
        return;
      }
      availableQuantity = Math.floor(product.quantity * subUnit.conversionRate);
      unitPrice = subUnit.pricePerUnit;
    }

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity <= availableQuantity) {
        setCart(cart.map(item =>
          item.product === product._id && item.unit === unit
            ? { ...item, quantity: newQuantity }
            : item
        ));
      } else {
        alert(`Insufficient stock. Available: ${availableQuantity} ${unit}`);
      }
    } else {
      if (quantity <= availableQuantity) {
        setCart([...cart, {
          product: product._id,
          name: product.name,
          unit,
          price: unitPrice,
          quantity,
          maxQuantity: availableQuantity,
          discount: 0
        }]);
      } else {
        alert(`Insufficient stock. Available: ${availableQuantity} ${unit}`);
      }
    }
  };

  const updateQuantity = (productId, unit, newQuantity) => {
    const item = cart.find(i => i.product === productId && i.unit === unit);
    
    if (newQuantity <= 0) {
      removeFromCart(productId, unit);
    } else if (newQuantity <= item.maxQuantity) {
      setCart(cart.map(item =>
        item.product === productId && item.unit === unit
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      alert(`Insufficient stock. Available: ${item.maxQuantity} ${unit}`);
    }
  };

  const updateItemDiscount = (productId, unit, discount) => {
    setCart(cart.map(item =>
      item.product === productId && item.unit === unit
        ? { ...item, discount: parseFloat(discount) || 0 }
        : item
    ));
  };

  const removeFromCart = (productId, unit) => {
    setCart(cart.filter(item => !(item.product === productId && item.unit === unit)));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotalDiscount = () => {
    return cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();
    const transportAmount = parseFloat(transport) || 0;
    return subtotal - totalDiscount + transportAmount;
  };

  const addPaymentMethod = () => {
    setSplitPayments([...splitPayments, { method: 'cash', amount: '' }]);
  };

  const removePaymentMethod = (index) => {
    if (splitPayments.length > 1) {
      setSplitPayments(splitPayments.filter((_, i) => i !== index));
    }
  };

  const updatePaymentMethod = (index, field, value) => {
    setSplitPayments(splitPayments.map((payment, i) =>
      i === index ? { ...payment, [field]: value } : payment
    ));
  };

  const getTotalPaid = () => {
    return splitPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  };

  const handleInitiateCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const total = calculateTotal();
    
    // For credit sales, open payment dialog
    setShowPaymentDialog(true);
  };

  const handleCheckout = async () => {
    const total = calculateTotal();
    const totalPaid = getTotalPaid();

    // Validate payments
    const validPayments = splitPayments.filter(p => p.amount && parseFloat(p.amount) > 0);
    
    if (validPayments.length === 0) {
      // Check if any payment method is credit
      const hasCredit = splitPayments.some(p => p.method === 'credit');
      if (!hasCredit) {
        alert('Please enter payment amounts');
        return;
      }
    }

    // For non-credit payments, validate sufficient payment
    const hasOnlyCredit = validPayments.length === 0 || validPayments.every(p => p.method === 'credit');
    if (!hasOnlyCredit && totalPaid < total) {
      alert('Insufficient payment amount');
      return;
    }

    try {
      setLoading(true);

      // Determine primary payment method and status
      let primaryPaymentMethod = 'cash';
      let paymentStatus = 'paid';
      
      if (validPayments.length === 1) {
        primaryPaymentMethod = validPayments[0].method;
        if (primaryPaymentMethod === 'credit') {
          paymentStatus = totalPaid >= total ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
        }
      } else if (validPayments.length > 1) {
        // Multiple payments - use the largest one as primary
        const sortedPayments = [...validPayments].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        primaryPaymentMethod = sortedPayments[0].method;
      }

      const saleData = {
        items: cart.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit: item.unit,
          discount: item.discount || 0
        })),
        paymentMethod: primaryPaymentMethod,
        splitPayments: validPayments.length > 1 ? validPayments : undefined,
        paymentStatus,
        amountPaid: totalPaid,
        transport: parseFloat(transport) || 0,
        customer: selectedCustomer && selectedCustomer !== 'none' ? selectedCustomer : null,
        notes: ''
      };

      const response = await saleService.create(saleData);
      setCompletedSale(response.data);
      setShowReceipt(true);
      setShowPaymentDialog(false);

      // Reset form
      setCart([]);
      setTransport('');
      setSelectedCustomer(null);
      setSplitPayments([{ method: 'cash', amount: '' }]);
      fetchProducts();

    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error processing sale: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getUnitDisplay = (product) => {
    if (!product.hasMultipleUnits) {
      return `${product.quantity} ${product.baseUnit}`;
    }
    return (
      <div className="text-xs">
        <div>{product.quantity.toFixed(2)} {product.baseUnit}s</div>
        {product.openedBags > 0 && (
          <div className="text-orange-600">({product.openedBags} opened)</div>
        )}
      </div>
    );
  };

  const subtotal = calculateSubtotal();
  const totalDiscount = calculateTotalDiscount();
  const total = calculateTotal();
  const totalPaid = getTotalPaid();
  const change = totalPaid - total;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                {products.map((product) => (
                  <Card
                    key={product._id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleProductClick(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm truncate flex-1">{product.name}</h3>
                        {product.hasMultipleUnits && (
                          <Package className="h-4 w-4 text-blue-500 ml-1" title="Multiple units available" />
                        )}
                      </div>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(product.sellingPrice)}</p>
                      <div className="text-xs text-gray-500">
                        Stock: {getUnitDisplay(product)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Cart is empty</p>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.product}-${item.unit}-${index}`} className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            {formatCurrency(item.price)} per {item.unit}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-6 w-6"
                          onClick={() => removeFromCart(item.product, item.unit)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product, item.unit, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-16 text-center text-sm">
                            {item.quantity} {item.unit}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product, item.unit, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-semibold text-sm">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Item Discount */}
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Tag className="h-3 w-3 text-green-600" />
                        <Input
                          type="number"
                          placeholder="Discount"
                          className="h-7 text-xs"
                          value={item.discount || ''}
                          onChange={(e) => updateItemDiscount(item.product, item.unit, e.target.value)}
                        />
                        {item.discount > 0 && (
                          <span className="text-xs text-green-600 whitespace-nowrap">
                            -{formatCurrency(item.discount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Selection */}
              <div className="space-y-2">
                <Label>Customer (Optional)</Label>
                <Select 
                  value={selectedCustomer || 'none'} 
                  onValueChange={(value) => setSelectedCustomer(value === 'none' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transport */}
              <div className="space-y-2">
                <Label>Transport (Optional)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                />
              </div>

              {/* Total Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Total Discount:</span>
                    <span>-{formatCurrency(totalDiscount)}</span>
                  </div>
                )}

                {transport && parseFloat(transport) > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Transport:</span>
                    <span>+{formatCurrency(parseFloat(transport))}</span>
                  </div>
                )}

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 border-t pt-2">
                    <span>Price before discount:</span>
                    <span>{formatCurrency(subtotal + (parseFloat(transport) || 0))}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleInitiateCheckout}
                disabled={loading || cart.length === 0}
              >
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unit Selection Dialog */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Unit for {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={selectedProduct?.baseUnit}>
                    {selectedProduct?.baseUnit} - {formatCurrency(selectedProduct?.sellingPrice)}
                  </SelectItem>
                  {selectedProduct?.subUnits.map((subUnit) => {
                    const available = Math.floor((selectedProduct?.quantity || 0) * subUnit.conversionRate);
                    return (
                      <SelectItem key={subUnit.name} value={subUnit.name}>
                        {subUnit.name} - {formatCurrency(subUnit.pricePerUnit)} (Available: {available})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter quantity"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(e.target.value)}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUnitDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddToCartFromDialog}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Payment Methods</Label>
                <Button size="sm" variant="outline" onClick={addPaymentMethod}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Method
                </Button>
              </div>

              {splitPayments.map((payment, index) => (
                <div key={index} className="flex items-end space-x-2">
                  <div className="flex-1 space-y-2">
                    <Label>Method {splitPayments.length > 1 ? index + 1 : ''}</Label>
                    <Select 
                      value={payment.method} 
                      onValueChange={(value) => updatePaymentMethod(index, 'method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa_paybill">M-Pesa (Paybill)</SelectItem>
                        <SelectItem value="mpesa_beth">M-Pesa (Beth)</SelectItem>
                        <SelectItem value="mpesa_martin">M-Pesa (Martin)</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={payment.amount}
                      onChange={(e) => updatePaymentMethod(index, 'amount', e.target.value)}
                      disabled={payment.method === 'credit'}
                    />
                  </div>

                  {splitPayments.length > 1 && (
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => removePaymentMethod(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Total Paid:</span>
                <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              {totalPaid > total && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(change)}</span>
                </div>
              )}
              {totalPaid < total && (
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className="font-bold text-red-600">{formatCurrency(total - totalPaid)}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCheckout} disabled={loading}>
                {loading ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Completed!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-xl font-bold mb-2">Transaction Successful</h3>
              <p className="text-gray-600">Receipt #{completedSale?.saleNumber}</p>
            </div>

            <div className="hidden">
              {completedSale && (
                <Receipt 
                  ref={receiptRef} 
                  sale={completedSale} 
                  businessInfo={businessInfo}
                />
              )}
            </div>

            <ReceiptActions 
              receiptRef={receiptRef}
              sale={completedSale}
              businessInfo={businessInfo}
              onClose={() => {
                setShowReceipt(false);
                setCompletedSale(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}