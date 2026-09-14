/* eslint-disable no-unused-vars */
// client/src/pages/POS.jsx
// - Sale in progress is kept when you leave the page and come back
// - Product/customer lists are cached, search filters instantly on screen

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Search, Trash2, Plus, Minus, Package, Tag, AlertCircle, AlertTriangle,
  ShoppingCart, X, Truck, User, CheckCircle2, Layers, RotateCcw
} from 'lucide-react';
import { productService } from '../services/product.service';
import { customerService } from '../services/customer.service';
import { saleService } from '../services/sale.service';
import { formatCurrency, cn } from '../lib/utils';
import Receipt from '../components/pos/Receipt';
import ReceiptActions from '../components/pos/ReceiptActions';
import api from '../services/api';
import CloseOfBusinessDialog from '../components/reports/CloseOfBusinessDialog';
import { useAuth } from '../hooks/useAuth';
import { usePersistedState, clearPersistedState } from '../hooks/usePersistedState';

const CART_KEY = 'pos.draft.cart';
const CUSTOMER_KEY = 'pos.draft.customer';
const TRANSPORT_KEY = 'pos.draft.transport';
const PAYMENTS_KEY = 'pos.draft.payments';

const PAYMENT_LABELS = {
  cash: 'Cash',
  mpesa_paybill: 'M-Pesa (Paybill)',
  mpesa_till: 'M-Pesa (Till)',
  gdc_paybill: 'GDC Paybill',
  mpesa_beth: 'M-Pesa (Beth)',
  mpesa_martin: 'M-Pesa (Martin)',
  credit: 'Credit',
};

export default function POS() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ---- Draft sale (survives leaving the page) ----
  const [cart, setCart] = usePersistedState(CART_KEY, []);
  const [selectedCustomer, setSelectedCustomer] = usePersistedState(CUSTOMER_KEY, null);
  const [transport, setTransport] = usePersistedState(TRANSPORT_KEY, '');
  const [splitPayments, setSplitPayments] = usePersistedState(PAYMENTS_KEY, [{ method: 'cash', amount: '' }]);

  // ---- Screen state ----
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCloseBusinessDialog, setShowCloseBusinessDialog] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const receiptRef = useRef();
  const searchRef = useRef();

  // ---- Cached data ----
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['pos', 'products'],
    queryFn: async () => (await productService.getAll({ limit: 1000 })).data || [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['pos', 'customers'],
    queryFn: async () => (await customerService.getAll()).data || [],
  });

  const { data: businessInfo = null } = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data?.success ? response.data.data : null;
    },
    staleTime: 60 * 60 * 1000,
  });

  // Focus search with "/" like a proper till
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category));
    return ['all', ...Array.from(set).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, activeCategory]);

  const selectedCustomerObj = useMemo(
    () => customers.find((c) => c._id === selectedCustomer) || null,
    [customers, selectedCustomer]
  );

  // ---------------- Cart logic ----------------
  const handleProductClick = (product) => {
    if (product.hasMultipleUnits && product.subUnits?.length > 0) {
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
      alert('Please select a unit and enter a valid quantity');
      return;
    }
    addToCart(selectedProduct, selectedUnit, parseFloat(selectedQuantity));
    setShowUnitDialog(false);
    setSelectedProduct(null);
  };

  const addToCart = (product, unit, quantity) => {
    let availableQuantity;
    let unitPrice;

    if (unit === product.baseUnit) {
      availableQuantity = product.quantity;
      unitPrice = product.sellingPrice;
    } else {
      const subUnit = product.subUnits?.find((su) => su.name === unit);
      if (!subUnit) {
        alert('Invalid unit selected');
        return;
      }
      availableQuantity = Math.floor(product.quantity * subUnit.conversionRate);
      unitPrice = subUnit.pricePerUnit;
    }

    const existingItem = cart.find((item) => item.product === product._id && item.unit === unit);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableQuantity) {
        alert(`Insufficient stock. Available: ${availableQuantity} ${unit}`);
        return;
      }
      setCart(cart.map((item) =>
        item.product === product._id && item.unit === unit
          ? { ...item, quantity: newQuantity, maxQuantity: availableQuantity }
          : item
      ));
    } else {
      if (quantity > availableQuantity) {
        alert(`Insufficient stock. Available: ${availableQuantity} ${unit}`);
        return;
      }
      setCart([...cart, {
        product: product._id,
        name: product.name,
        unit,
        price: unitPrice,
        quantity,
        maxQuantity: availableQuantity,
        discount: 0,
      }]);
    }
  };

  const updateQuantity = (productId, unit, newQuantity) => {
    const item = cart.find((i) => i.product === productId && i.unit === unit);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(productId, unit);
    } else if (newQuantity <= item.maxQuantity) {
      setCart(cart.map((i) =>
        i.product === productId && i.unit === unit ? { ...i, quantity: newQuantity } : i
      ));
    } else {
      alert(`Insufficient stock. Available: ${item.maxQuantity} ${unit}`);
    }
  };

  const updateItemDiscount = (productId, unit, discount) => {
    setCart(cart.map((item) =>
      item.product === productId && item.unit === unit
        ? { ...item, discount: parseFloat(discount) || 0 }
        : item
    ));
  };

  const removeFromCart = (productId, unit) => {
    setCart(cart.filter((item) => !(item.product === productId && item.unit === unit)));
  };

  const clearSale = () => {
    if (cart.length > 0 && !window.confirm('Clear this sale and start again?')) return;
    setCart([]);
    setTransport('');
    setSelectedCustomer(null);
    setSplitPayments([{ method: 'cash', amount: '' }]);
  };

  // ---------------- Totals ----------------
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const transportAmount = parseFloat(transport) || 0;
  const total = subtotal - totalDiscount + transportAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Money actually received now (credit lines are NOT money received)
  const getTotalPaid = () =>
    splitPayments
      .filter((p) => p.method !== 'credit')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const totalPaid = getTotalPaid();
  const change = totalPaid - total;

  // ---------------- Payment ----------------
  const addPaymentMethod = () => setSplitPayments([...splitPayments, { method: 'cash', amount: '' }]);

  const removePaymentMethod = (index) => {
    if (splitPayments.length > 1) setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const updatePaymentMethod = (index, field, value) => {
    setSplitPayments(splitPayments.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleInitiateCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    setShowMobileCart(false);
    setShowPaymentDialog(true);
  };

  const handleCheckout = async () => {
    const validPayments = splitPayments.filter((p) => p.amount && parseFloat(p.amount) > 0);
    const hasCreditPayment = splitPayments.some((p) => p.method === 'credit');

    if (hasCreditPayment && (!selectedCustomer || selectedCustomer === 'none')) {
      alert('Credit sales require a customer. Please select a customer first.');
      return;
    }

    if (validPayments.length === 0 && !hasCreditPayment) {
      alert('Please enter payment amounts');
      return;
    }

    const balance = Math.round((total - totalPaid) * 100) / 100;
    if (balance > 0 && (!selectedCustomer || selectedCustomer === 'none')) {
      alert('This sale is not fully paid. Select a customer so the balance can be recorded as credit.');
      return;
    }

    try {
      setLoading(true);

      const nonCreditPayments = validPayments.filter((p) => p.method !== 'credit');
      let primaryPaymentMethod = 'credit';
      if (nonCreditPayments.length > 0) {
        const sorted = [...nonCreditPayments].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        primaryPaymentMethod = sorted[0].method;
      }

      const paymentStatus = balance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

      const saleData = {
        items: cart.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unit: item.unit,
          discount: item.discount || 0,
        })),
        paymentMethod: primaryPaymentMethod,
        splitPayments: validPayments.length > 1 ? validPayments : undefined,
        paymentStatus,
        amountPaid: totalPaid,
        transport: parseFloat(transport) || 0,
        customer: selectedCustomer && selectedCustomer !== 'none' ? selectedCustomer : null,
        notes: '',
      };

      const response = await saleService.create(saleData);
      setCompletedSale(response.data);
      setShowReceipt(true);
      setShowPaymentDialog(false);

      // Reset the draft sale
      setCart([]);
      setTransport('');
      setSelectedCustomer(null);
      setSplitPayments([{ method: 'cash', amount: '' }]);
      clearPersistedState(CART_KEY);

      // Stock changed - refresh product list in the background
      queryClient.invalidateQueries({ queryKey: ['pos', 'products'] });
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error processing sale: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Small pieces ----------------
  const stockLabel = (product) => {
    if (product.quantity <= 0) return { text: 'Out of stock', tone: 'bad' };
    if (product.reorderLevel && product.quantity <= product.reorderLevel) {
      return { text: `Low · ${Number(product.quantity).toFixed(2)} ${product.baseUnit}`, tone: 'warn' };
    }
    return { text: `${Number(product.quantity).toFixed(2)} ${product.baseUnit}`, tone: 'ok' };
  };

  // Rendered as a function (not a nested component) so React keeps the same
  // DOM between renders - otherwise the cart remounts, losing scroll & focus.
  const renderCartPanel = (mobile = false) => (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Scrollable cart items */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          mobile ? "p-3" : "p-3 sm:p-4"
        )}
      >
        {cart.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted">
              <ShoppingCart className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="mt-4 text-sm font-semibold">Your sale is empty</p>
            <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
              Select a product to add it to the current sale.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {cart.map((item, index) => {
              const lineTotal = item.price * item.quantity - (item.discount || 0);
              const product = products.find((p) => p._id === item.product);
              const stock = product ? stockLabel(product) : null;

              return (
                <div
                  key={`${item.product}-${item.unit}-${index}`}
                  className="group rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatCurrency(item.price)} / {item.unit}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product, item.unit)}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-70 transition-colors hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                          aria-label={`Remove ${item.name}`}
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-lg border border-border bg-background">
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-l-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => updateQuantity(item.product, item.unit, item.quantity - 1)}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <span className="min-w-[72px] px-1 text-center text-sm font-bold tabular-nums">
                            {item.quantity}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              {item.unit}
                            </span>
                          </span>

                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-r-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => updateQuantity(item.product, item.unit, item.quantity + 1)}
                            disabled={item.quantity >= item.maxQuantity}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-extrabold tabular-nums">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Line discount"
                          aria-label={`Discount for ${item.name}`}
                          className="h-8 text-xs"
                          value={item.discount || ''}
                          onChange={(e) =>
                            updateItemDiscount(item.product, item.unit, e.target.value)
                          }
                        />
                        {stock && (
                          <span
                            className={cn(
                              "hidden shrink-0 text-[10px] font-medium sm:inline",
                              stock.tone === "bad" && "text-destructive",
                              stock.tone === "warn" && "text-accent-foreground",
                              stock.tone === "ok" && "text-muted-foreground"
                            )}
                          >
                            {stock.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Always-visible checkout area */}
      <div className="shrink-0 space-y-3 border-t border-border bg-background p-3 sm:p-4">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <User className="h-3.5 w-3.5" />
              Customer
            </Label>
            <Select
              value={selectedCustomer || 'none'}
              onValueChange={(value) => setSelectedCustomer(value === 'none' ? null : value)}
            >
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="Walk-in customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Walk-in customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.name} — {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Truck className="h-3.5 w-3.5" />
              Transport
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="h-9 bg-card"
              placeholder="0.00"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
            />
          </div>
        </div>

        {selectedCustomerObj?.currentCredit > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-accent/15 px-3 py-2 text-xs text-accent-foreground">
            <span>Existing customer balance</span>
            <strong className="tabular-nums">
              {formatCurrency(selectedCustomerObj.currentCredit)}
            </strong>
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span>
                <span className="tabular-nums">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}

            {transportAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Transport</span>
                <span className="tabular-nums">+{formatCurrency(transportAmount)}</span>
              </div>
            )}

            <div className="mt-2 flex items-end justify-between border-t border-border pt-2.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total
                </p>
                <p className="text-xs text-muted-foreground">
                  {cart.length} {cart.length === 1 ? "line" : "lines"} · {itemCount} units
                </p>
              </div>
              <span className="text-2xl font-black tabular-nums text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        <Button
          className="h-12 w-full text-base font-bold shadow-sm"
          onClick={handleInitiateCheckout}
          disabled={loading || cart.length === 0}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Proceed to Payment
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">Point of Sale</h1>
            <p className="truncate text-sm text-muted-foreground">
              {user?.name ? `Serving as ${user.name}` : 'Process customer transactions'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {cart.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearSale} title="Clear the current sale">
                <RotateCcw className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Clear sale</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={() => setShowCloseBusinessDialog(true)}
            >
              <AlertCircle className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Close of Business</span>
              <span className="sm:hidden">Close</span>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Products */}
          <section className="lg:col-span-3 xl:col-span-3">
            <Card className="overflow-hidden lg:flex lg:min-h-0 lg:flex-col">
              <div className="space-y-3 border-b border-border bg-muted/40 p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    placeholder="Search products by name, category or barcode…  (press /)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 bg-background pl-10 pr-10 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {categories.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          activeCategory === cat
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {cat === 'all' ? 'All products' : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <CardContent className="p-4 lg:min-h-0 lg:flex-1">
                {productsLoading ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-16 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-2 text-sm font-medium">No products match your search</p>
                  </div>
                ) : (
                  <div className="grid max-h-[calc(100vh-330px)] grid-cols-2 gap-3 overflow-y-auto overscroll-contain md:grid-cols-3">
                    {filteredProducts.map((product) => {
                      const stock = stockLabel(product);
                      const disabled = product.quantity <= 0;
                      return (
                        <button
                          key={product._id}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleProductClick(product)}
                          className={cn(
                            'group flex min-h-[118px] flex-col justify-between rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all',
                            disabled
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:translate-y-0'
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
                            {product.hasMultipleUnits && (
                              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            )}
                          </div>
                          <div className="mt-3">
                            <p className="text-base font-extrabold tabular-nums text-primary">
                              {formatCurrency(product.sellingPrice)}
                            </p>
                            <span
                              className={cn(
                                'mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                                stock.tone === 'bad' && 'bg-destructive/10 text-destructive',
                                stock.tone === 'warn' && 'bg-accent/25 text-accent-foreground',
                                stock.tone === 'ok' && 'bg-secondary text-secondary-foreground'
                              )}
                            >
                              {stock.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Cart - desktop */}
          <aside className="hidden min-h-0 lg:col-span-2 lg:block">
            <Card className="sticky top-4 flex max-h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="font-semibold">Current Sale</span>
                </div>
                <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-bold">
                  {cart.length} {cart.length === 1 ? 'line' : 'lines'}
                </span>
              </div>
              {renderCartPanel()}
            </Card>
          </aside>
        </div>
      </div>

      {/* Cart - mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        <Button className="h-12 w-full justify-between text-base" onClick={() => setShowMobileCart(true)}>
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
          <span className="font-extrabold tabular-nums">{formatCurrency(total)}</span>
        </Button>
      </div>
      <div className="h-20 lg:hidden" />

      {/* Cart - mobile sheet */}
      <Dialog open={showMobileCart} onOpenChange={setShowMobileCart}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden p-0">
          <DialogHeader className="border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <DialogTitle className="text-primary-foreground">Current Sale</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[calc(90vh-58px)] min-h-0 flex-1 flex-col overflow-hidden">
            {renderCartPanel(true)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unit selection */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={selectedProduct?.baseUnit}>
                    {selectedProduct?.baseUnit} — {formatCurrency(selectedProduct?.sellingPrice)}
                  </SelectItem>
                  {selectedProduct?.subUnits?.map((subUnit) => {
                    const available = Math.floor((selectedProduct?.quantity || 0) * subUnit.conversionRate);
                    return (
                      <SelectItem key={subUnit.name} value={subUnit.name}>
                        {subUnit.name} — {formatCurrency(subUnit.pricePerUnit)} (available: {available})
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
                autoFocus
                placeholder="Enter quantity"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddToCartFromDialog()}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowUnitDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddToCartFromDialog}>
                Add to Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-baseline justify-between">
                <span className="text-sm uppercase tracking-wide opacity-80">Amount due</span>
                <span className="text-3xl font-extrabold tabular-nums">{formatCurrency(total)}</span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                {itemCount} unit(s) · {selectedCustomerObj ? selectedCustomerObj.name : 'Walk-in customer'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Payment methods</Label>
                <Button size="sm" variant="outline" onClick={addPaymentMethod}>
                  <Plus className="mr-1 h-4 w-4" />
                  Split payment
                </Button>
              </div>

              {splitPayments.map((payment, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label className="text-xs">Method {splitPayments.length > 1 ? index + 1 : ''}</Label>
                    <Select
                      value={payment.method}
                      onValueChange={(value) => updatePaymentMethod(index, 'method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label className="text-xs">Amount</Label>
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
                    <Button size="icon" variant="outline" onClick={() => removePaymentMethod(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {total - totalPaid > 0.01 && splitPayments.length === 1 && splitPayments[0].method !== 'credit' && (
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => updatePaymentMethod(0, 'amount', String(total))}
                >
                  Pay exact amount ({formatCurrency(total)})
                </button>
              )}
            </div>

            {splitPayments.some((p) => p.method === 'credit') && (!selectedCustomer || selectedCustomer === 'none') && (
              <Alert className="border-destructive/30 bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Credit sales require a customer. Close this and select one first.
                </AlertDescription>
              </Alert>
            )}

            {splitPayments.some((p) => p.method === 'credit') && (
              <Alert className="border-accent/40 bg-accent/15">
                <AlertTriangle className="h-4 w-4 text-accent-foreground" />
                <AlertDescription className="text-accent-foreground">
                  <strong>Credit sale</strong>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    <li>This amount is not counted as today&apos;s revenue</li>
                    <li>It becomes revenue when the customer pays</li>
                    <li>It is added to the customer&apos;s outstanding debt</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span>Received now</span>
                <span className="font-bold tabular-nums text-primary">{formatCurrency(totalPaid)}</span>
              </div>
              {change > 0.01 && (
                <div className="flex justify-between text-sm">
                  <span>Change to give</span>
                  <span className="font-bold tabular-nums">{formatCurrency(change)}</span>
                </div>
              )}
              {total - totalPaid > 0.01 && (
                <div className="flex justify-between text-sm">
                  <span>Balance (goes on credit)</span>
                  <span className="font-bold tabular-nums text-destructive">
                    {formatCurrency(total - totalPaid)}
                  </span>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 -mx-1 flex gap-2 border-t border-border bg-background/95 px-1 pb-1 pt-3 backdrop-blur">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaymentDialog(false)}>
                Back
              </Button>
              <Button className="h-11 flex-1 text-base font-semibold" onClick={handleCheckout} disabled={loading}>
                {loading ? 'Processing…' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sale completed</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="py-4 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-9 w-9 text-primary" />
              </div>
              <h3 className="mt-3 text-xl font-bold">Transaction successful</h3>
              <p className="text-sm text-muted-foreground">Receipt #{completedSale?.saleNumber}</p>
            </div>

            <div className="hidden">
              {completedSale && (
                <Receipt ref={receiptRef} sale={completedSale} businessInfo={businessInfo} />
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

      <CloseOfBusinessDialog
        open={showCloseBusinessDialog}
        onOpenChange={setShowCloseBusinessDialog}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['pos', 'products'] })}
      />
    </>
  );
}
