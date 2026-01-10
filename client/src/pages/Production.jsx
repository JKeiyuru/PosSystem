// client/src/pages/Production.jsx - COMPLETE WITH EDITABLE QUANTITIES
import { useState, useEffect, useRef } from 'react';
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
import { Alert, AlertDescription } from '../components/ui/alert';
import { Search, Plus, Trash2, Play, Square, Save, Zap, Package, DollarSign, ShoppingCart, AlertCircle, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { productService } from '../services/product.service';
import { productionService } from '../services/production.service';
import { formatCurrency, formatDateTime } from '../lib/utils';
import api from '../services/api';
import Receipt from '../components/pos/Receipt';
import ReceiptActions from '../components/pos/ReceiptActions';

const CACHE_KEY = 'production_cache';

export default function Production() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [productionActive, setProductionActive] = useState(false);
  const [productionType, setProductionType] = useState('standard');
  const [finalProduct, setFinalProduct] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customOutputName, setCustomOutputName] = useState('');
  const [outputBags, setOutputBags] = useState('');
  const [outputKgs, setOutputKgs] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [sellImmediately, setSellImmediately] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productionHistory, setProductionHistory] = useState([]);
  const [formulas, setFormulas] = useState([]);
  
  // Formula dialogs
  const [showSaveFormulaDialog, setShowSaveFormulaDialog] = useState(false);
  const [showConfirmSaveDialog, setShowConfirmSaveDialog] = useState(false);
  const [formulaName, setFormulaName] = useState('');
  
  // Formula execution with scale
  const [showExecuteFormulaDialog, setShowExecuteFormulaDialog] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [formulaScale, setFormulaScale] = useState('full');
  const [customOutput, setCustomOutput] = useState({ bags: '', kgs: '' });

  // Payment and sales
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [splitPayments, setSplitPayments] = useState([{ method: 'cash', amount: '' }]);
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  
  const [activeTab, setActiveTab] = useState('manual');
  
  // New substitution state variables
  const [formulaIngredients, setFormulaIngredients] = useState([]); // Working copy
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [substitutionIndex, setSubstitutionIndex] = useState(null);
  const [substitutionSearch, setSubstitutionSearch] = useState('');
  const [substitutionProducts, setSubstitutionProducts] = useState([]);
  
  const receiptRef = useRef();

  // Auto-save production state
  useEffect(() => {
    const saveState = () => {
      const state = {
        ingredients,
        productionActive,
        productionType,
        finalProduct,
        customerName,
        customOutputName,
        outputBags,
        outputKgs,
        sellingPrice,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    };

    if (ingredients.length > 0 || productionActive) {
      saveState();
    }
  }, [ingredients, productionActive, productionType, finalProduct, customerName, customOutputName, outputBags, outputKgs, sellingPrice]);

  // Restore production state on mount
  useEffect(() => {
    const restoreState = () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const state = JSON.parse(cached);
          const timeDiff = Date.now() - state.timestamp;
          
          if (timeDiff < 24 * 60 * 60 * 1000) {
            setIngredients(state.ingredients || []);
            setProductionActive(state.productionActive || false);
            setProductionType(state.productionType || 'standard');
            setFinalProduct(state.finalProduct || '');
            setCustomerName(state.customerName || '');
            setCustomOutputName(state.customOutputName || '');
            setOutputBags(state.outputBags || '');
            setOutputKgs(state.outputKgs || '');
            setSellingPrice(state.sellingPrice || '');
            
            if (state.ingredients?.length > 0 || state.productionActive) {
              alert('Previous production session restored!');
            }
          } else {
            localStorage.removeItem(CACHE_KEY);
          }
        } catch (error) {
          console.error('Error restoring state:', error);
          localStorage.removeItem(CACHE_KEY);
        }
      }
    };

    restoreState();
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchAllProducts();
    fetchProductionHistory();
    fetchFormulas();
    fetchBusinessInfo();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        fetchProducts();
      } else {
        fetchAllProducts();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (substitutionSearch) {
        fetchSubstitutionProducts();
      } else {
        setSubstitutionProducts(allProducts);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [substitutionSearch, allProducts]);

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
      if (!searchQuery) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching all products:', error);
    }
  };

  const fetchSubstitutionProducts = async () => {
    try {
      const response = await productService.getAll({ search: substitutionSearch });
      setSubstitutionProducts(response.data);
    } catch (error) {
      console.error('Error fetching substitution products:', error);
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

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
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
      currentSellingPrice: product.sellingPrice,
      currentBuyingPrice: product.buyingPrice,
      useBuyingPrice: false,
      hasMultipleUnits: product.hasMultipleUnits,
      subUnits: product.subUnits || []
    }]);
  };

  const updateIngredientQuantity = (productId, quantity) => {
    setIngredients(ingredients.map(ing =>
      ing.product === productId ? { ...ing, quantity: parseFloat(quantity) || '' } : ing
    ));
  };

  const updateIngredientUnit = (productId, unit) => {
    setIngredients(ingredients.map(ing => {
      if (ing.product === productId) {
        let availableInUnit = ing.availableQuantity;
        let unitSellingPrice = ing.sellingPrice;
        let unitBuyingPrice = ing.buyingPrice;
        
        if (unit !== ing.baseUnit) {
          const subUnit = ing.subUnits.find(su => su.name === unit);
          if (subUnit) {
            availableInUnit = Math.floor(ing.availableQuantity * subUnit.conversionRate);
            unitSellingPrice = subUnit.pricePerUnit;
            unitBuyingPrice = (ing.buyingPrice * subUnit.conversionRate);
          }
        }
        return { 
          ...ing, 
          unit, 
          availableInUnit,
          currentSellingPrice: unitSellingPrice,
          currentBuyingPrice: unitBuyingPrice,
          useBuyingPrice: unit === ing.baseUnit ? ing.useBuyingPrice : false
        };
      }
      return ing;
    }));
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

    for (const ing of ingredients) {
      const availableInUnit = ing.availableInUnit || ing.availableQuantity;
      if (ing.quantity > availableInUnit) {
        alert(`Insufficient stock for ${ing.name}. Available: ${availableInUnit} ${ing.unit}`);
        return;
      }
    }

    setProductionActive(true);
    alert('Production started! Ingredient stock will be deducted when you complete production.');
  };

  const handleInitiateCompletion = () => {
    if (productionType === 'standard') {
      if (!finalProduct) {
        alert('Please select the final TELE product');
        return;
      }
      if (!outputBags && !outputKgs) {
        alert('Please enter the output quantity (bags and/or kgs) for inventory');
        return;
      }
    } else {
      if (!customerName || !customOutputName) {
        alert('Please enter customer name and product name for the custom combination');
        return;
      }
      if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
        alert('Please enter a valid selling price for the custom combination');
        return;
      }
      
      const minPrice = calculateTotalCost();
      if (parseFloat(sellingPrice) < minPrice) {
        alert(`Selling price cannot be less than production cost (${formatCurrency(minPrice)})`);
        return;
      }
    }

    setShowConfirmSaveDialog(true);
  };

  const handleChooseSaveFormula = () => {
    setShowConfirmSaveDialog(false);
    setShowSaveFormulaDialog(true);
  };

  const handleSkipSaveFormula = () => {
    setShowConfirmSaveDialog(false);
    proceedToCompletion();
  };

  const proceedToCompletion = () => {
    if (productionType === 'custom') {
      setShowPaymentDialog(true);
    } else {
      endProduction();
    }
  };

  const endProduction = async (saleData = null) => {
    try {
      setLoading(true);

      const productionData = {
        type: productionType,
        ingredients: ingredients.map(ing => ({
          product: ing.product,
          quantity: ing.quantity,
          unit: ing.unit,
          useBuyingPrice: ing.useBuyingPrice
        }))
      };

      if (productionType === 'standard') {
        const outputQuantity = parseFloat(outputBags || 0) + (parseFloat(outputKgs || 0) / 50);
        productionData.finalProduct = finalProduct;
        productionData.outputQuantity = outputQuantity;
        productionData.outputBags = parseFloat(outputBags || 0);
        productionData.outputKgs = parseFloat(outputKgs || 0);
      } else {
        productionData.customerName = customerName;
        productionData.customOutputName = customOutputName;
        productionData.sellingPrice = parseFloat(sellingPrice);
        productionData.outputQuantity = 1;
        productionData.outputBags = 0;
        productionData.outputKgs = 0;
        productionData.sellImmediately = true;
        
        if (saleData) {
          productionData.saleData = saleData;
        }
      }

      const response = await productionService.complete(productionData);

      if (productionType === 'custom' && response.data.sale) {
        setCompletedSale(response.data.sale);
        setShowReceipt(true);
        alert('Custom production completed and sold successfully!');
      } else {
        alert('Production completed successfully! Product added to inventory.');
      }
      
      resetProduction();
      clearCache();
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

  const handleCompleteSale = () => {
    const total = parseFloat(sellingPrice);
    const totalPaid = getTotalPaid();

    const validPayments = splitPayments.filter(p => p.amount && parseFloat(p.amount) > 0);
    
    if (validPayments.length === 0) {
      const hasCredit = splitPayments.some(p => p.method === 'credit');
      if (!hasCredit) {
        alert('Please enter payment amounts');
        return;
      }
    }

    const hasOnlyCredit = validPayments.length === 0 || validPayments.every(p => p.method === 'credit');
    if (!hasOnlyCredit && totalPaid < total) {
      alert('Insufficient payment amount');
      return;
    }

    let primaryPaymentMethod = 'cash';
    let paymentStatus = 'paid';
    
    if (validPayments.length === 1) {
      primaryPaymentMethod = validPayments[0].method;
      if (primaryPaymentMethod === 'credit') {
        paymentStatus = totalPaid >= total ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
      }
    } else if (validPayments.length > 1) {
      const sortedPayments = [...validPayments].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      primaryPaymentMethod = sortedPayments[0].method;
    }

    const saleData = {
      paymentMethod: primaryPaymentMethod,
      splitPayments: validPayments.length > 1 ? validPayments : undefined,
      paymentStatus,
      amountPaid: totalPaid
    };

    setShowPaymentDialog(false);
    endProduction(saleData);
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

  const handleSaveFormula = async () => {
    if (!formulaName.trim()) {
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
      
      proceedToCompletion();
    } catch (error) {
      console.error('Error saving formula:', error);
      alert('Error saving formula: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadFormula = (formula) => {
    setSelectedFormula(formula);
    
    const workingIngredients = formula.ingredients.map(ing => ({
      ...ing,
      originalProduct: ing.product,
      originalProductName: ing.productName,
      originalQuantity: ing.quantity,
      isSubstituted: false,
      currentSellingPrice: ing.currentSellingPrice || ing.sellingPrice,
      currentBuyingPrice: ing.currentBuyingPrice || ing.buyingPrice,
      availableInUnit: ing.availableQuantity
    }));
    
    setFormulaIngredients(workingIngredients);
    setShowExecuteFormulaDialog(true);
    setFormulaScale('full');
    setCustomOutput({ bags: '', kgs: '' });
    
    if (formula.type === 'standard') {
      setOutputBags(formula.defaultOutputBags?.toString() || '');
      setOutputKgs(formula.defaultOutputKgs?.toString() || '');
    } else {
      setCustomerName(formula.customerName || '');
      setCustomOutputName(formula.customOutputName || '');
      setSellingPrice('');
    }
  };

  const openSubstitutionDialog = (index) => {
    setSubstitutionIndex(index);
    setSubstitutionSearch('');
    setSubstitutionProducts(allProducts);
    setShowSubstitutionDialog(true);
  };

  const substituteIngredient = async (newProduct) => {
    if (substitutionIndex === null) return;
    
    try {
      const response = await productService.getById(newProduct._id);
      const fullProduct = response.data;
      
      const updatedIngredients = [...formulaIngredients];
      const originalIng = updatedIngredients[substitutionIndex];
      
      updatedIngredients[substitutionIndex] = {
        ...originalIng,
        product: fullProduct._id,
        productName: fullProduct.name,
        unit: fullProduct.baseUnit,
        isSubstituted: true,
        originalProduct: originalIng.originalProduct,
        originalProductName: originalIng.originalProductName,
        originalQuantity: originalIng.quantity,
        availableQuantity: fullProduct.quantity,
        baseUnit: fullProduct.baseUnit,
        sellingPrice: fullProduct.sellingPrice,
        buyingPrice: fullProduct.buyingPrice,
        currentSellingPrice: fullProduct.sellingPrice,
        currentBuyingPrice: fullProduct.buyingPrice,
        hasMultipleUnits: fullProduct.hasMultipleUnits,
        subUnits: fullProduct.subUnits || []
      };
      
      setFormulaIngredients(updatedIngredients);
      setShowSubstitutionDialog(false);
      setSubstitutionIndex(null);
      
      alert(`Substituted: ${originalIng.originalProductName} → ${fullProduct.name}`);
    } catch (error) {
      console.error('Error substituting ingredient:', error);
      alert('Error loading product details');
    }
  };

  const updateFormulaIngredientQuantity = (index, newQuantity) => {
    const updatedIngredients = [...formulaIngredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      quantity: parseFloat(newQuantity) || ''
    };
    setFormulaIngredients(updatedIngredients);
  };

  const updateFormulaIngredientUnit = (index, newUnit) => {
    const updatedIngredients = [...formulaIngredients];
    const ing = updatedIngredients[index];
    
    let availableInUnit = ing.availableQuantity;
    let unitSellingPrice = ing.sellingPrice;
    let unitBuyingPrice = ing.buyingPrice;
    
    if (newUnit !== ing.baseUnit) {
      const subUnit = ing.subUnits.find(su => su.name === newUnit);
      if (subUnit) {
        availableInUnit = Math.floor(ing.availableQuantity * subUnit.conversionRate);
        unitSellingPrice = subUnit.pricePerUnit;
        unitBuyingPrice = (ing.buyingPrice * subUnit.conversionRate);
      }
    }
    
    updatedIngredients[index] = {
      ...ing,
      unit: newUnit,
      availableInUnit,
      currentSellingPrice: unitSellingPrice,
      currentBuyingPrice: unitBuyingPrice
    };
    
    setFormulaIngredients(updatedIngredients);
  };

  const resetIngredientToOriginal = async (index) => {
    try {
      const ingredient = formulaIngredients[index];
      const response = await productService.getById(ingredient.originalProduct);
      const originalProduct = response.data;
      
      const updatedIngredients = [...formulaIngredients];
      updatedIngredients[index] = {
        ...ingredient,
        product: originalProduct._id,
        productName: originalProduct.name,
        unit: originalProduct.baseUnit,
        quantity: ingredient.originalQuantity || ingredient.quantity,
        isSubstituted: false,
        availableQuantity: originalProduct.quantity,
        baseUnit: originalProduct.baseUnit,
        sellingPrice: originalProduct.sellingPrice,
        buyingPrice: originalProduct.buyingPrice,
        currentSellingPrice: originalProduct.sellingPrice,
        currentBuyingPrice: originalProduct.buyingPrice,
        hasMultipleUnits: originalProduct.hasMultipleUnits,
        subUnits: originalProduct.subUnits || []
      };
      
      setFormulaIngredients(updatedIngredients);
      alert(`Reset to original: ${ingredient.originalProductName}`);
    } catch (error) {
      console.error('Error resetting ingredient:', error);
      alert('Error loading original product details');
    }
  };

  const executeFormula = async () => {
    if (!selectedFormula) return;

    const invalidIngredients = formulaIngredients.filter(ing => !ing.quantity || ing.quantity <= 0);
    if (invalidIngredients.length > 0) {
      alert('Please enter valid quantities for all ingredients');
      return;
    }

    for (const ing of formulaIngredients) {
      const availableInUnit = ing.availableInUnit || ing.availableQuantity;
      if (ing.quantity > availableInUnit) {
        alert(`Insufficient stock for ${ing.productName}. Available: ${availableInUnit} ${ing.unit}`);
        return;
      }
    }

    if (selectedFormula.type === 'custom') {
      if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
        alert('Please enter a valid selling price for the custom combination');
        return;
      }
      
      setShowPaymentDialog(true);
    } else {
      const finalOutputBags = customOutput.bags ? parseFloat(customOutput.bags) : (selectedFormula.defaultOutputBags || 0) * getScaleMultiplier();
      const finalOutputKgs = customOutput.kgs ? parseFloat(customOutput.kgs) : (selectedFormula.defaultOutputKgs || 0) * getScaleMultiplier();
      
      if (!finalOutputBags && !finalOutputKgs) {
        alert('Please enter output quantity for inventory');
        return;
      }
      
      setOutputBags(finalOutputBags.toString());
      setOutputKgs(finalOutputKgs.toString());
      await executeFormulaProduction();
    }
  };

  const getScaleMultiplier = () => {
    return formulaScale === 'full' ? 1 : formulaScale === 'half' ? 0.5 : 0.25;
  };

  const executeFormulaProduction = async (saleData = null) => {
    try {
      setLoading(true);
      
      const scaledIngredients = formulaIngredients.map(ing => ({
        product: ing.product,
        quantity: ing.quantity,
        unit: ing.unit,
        useBuyingPrice: ing.useBuyingPrice
      }));

      const payload = {
        scale: formulaScale,
        scaledIngredients,
        hasSubstitutions: formulaIngredients.some(ing => ing.isSubstituted),
        substitutionDetails: formulaIngredients
          .filter(ing => ing.isSubstituted)
          .map(ing => ({
            original: ing.originalProductName,
            substituted: ing.productName,
            originalQuantity: ing.originalQuantity,
            newQuantity: ing.quantity
          }))
      };

      if (selectedFormula.type === 'standard') {
        const finalOutputBags = customOutput.bags ? parseFloat(customOutput.bags) : (selectedFormula.defaultOutputBags || 0) * getScaleMultiplier();
        const finalOutputKgs = customOutput.kgs ? parseFloat(customOutput.kgs) : (selectedFormula.defaultOutputKgs || 0) * getScaleMultiplier();
        
        payload.outputBags = finalOutputBags;
        payload.outputKgs = finalOutputKgs;
      } else {
        payload.sellingPrice = parseFloat(sellingPrice);
        payload.sellImmediately = true;
        
        if (saleData) {
          payload.saleData = saleData;
        }
      }

      const response = await api.post(`/production-formulas/${selectedFormula._id}/execute`, payload);

      if (selectedFormula.type === 'custom' && response.data.sale) {
        setCompletedSale(response.data.sale);
        setShowReceipt(true);
        alert('Formula executed and sale completed successfully!');
      } else {
        alert('Formula executed successfully! Product added to inventory.');
      }
      
      setShowExecuteFormulaDialog(false);
      setShowPaymentDialog(false);
      setSelectedFormula(null);
      setSplitPayments([{ method: 'cash', amount: '' }]);
      setFormulaScale('full');
      setCustomOutput({ bags: '', kgs: '' });
      setFormulaIngredients([]);
      
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

  const handleCompleteFormulaSale = () => {
    const total = parseFloat(sellingPrice);
    const totalPaid = getTotalPaid();

    const validPayments = splitPayments.filter(p => p.amount && parseFloat(p.amount) > 0);
    
    if (validPayments.length === 0) {
      const hasCredit = splitPayments.some(p => p.method === 'credit');
      if (!hasCredit) {
        alert('Please enter payment amounts');
        return;
      }
    }

    const hasOnlyCredit = validPayments.length === 0 || validPayments.every(p => p.method === 'credit');
    if (!hasOnlyCredit && totalPaid < total) {
      alert('Insufficient payment amount');
      return;
    }

    let primaryPaymentMethod = 'cash';
    let paymentStatus = 'paid';
    
    if (validPayments.length === 1) {
      primaryPaymentMethod = validPayments[0].method;
      if (primaryPaymentMethod === 'credit') {
        paymentStatus = totalPaid >= total ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
      }
    } else if (validPayments.length > 1) {
      const sortedPayments = [...validPayments].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      primaryPaymentMethod = sortedPayments[0].method;
    }

    const saleData = {
      paymentMethod: primaryPaymentMethod,
      splitPayments: validPayments.length > 1 ? validPayments : undefined,
      paymentStatus,
      amountPaid: totalPaid
    };

    executeFormulaProduction(saleData);
  };

  const resetProduction = () => {
    setIngredients([]);
    setFinalProduct('');
    setCustomerName('');
    setCustomOutputName('');
    setOutputBags('');
    setOutputKgs('');
    setSellingPrice('');
    setSellImmediately(false);
    setProductionActive(false);
    setProductionType('standard');
    setSplitPayments([{ method: 'cash', amount: '' }]);
    setFormulaScale('full');
    setCustomOutput({ bags: '', kgs: '' });
    setFormulaIngredients([]);
  };

  const getCurrentPrice = (ing) => {
    if (ing.unit === ing.baseUnit) {
      return ing.useBuyingPrice ? ing.buyingPrice : ing.sellingPrice;
    }
    return ing.currentSellingPrice || ing.sellingPrice;
  };

  const calculateTotalCost = () => {
    return ingredients.reduce((sum, ing) => {
      if (ing.quantity) {
        const price = getCurrentPrice(ing);
        return sum + (price * ing.quantity);
      }
      return sum;
    }, 0);
  };

  const calculateTotalRevenue = () => {
    if (productionType === 'custom' && sellingPrice) {
      return parseFloat(sellingPrice);
    }
    return 0;
  };

  const calculateProfit = () => {
    return calculateTotalRevenue() - calculateTotalCost();
  };

  const getTeleProducts = () => {
    return allProducts.filter(p => p.name.toUpperCase().includes('TELE'));
  };

  const getAvailableInUnit = (ingredient) => {
    if (ingredient.unit === ingredient.baseUnit) {
      return ingredient.availableQuantity;
    }
    const subUnit = ingredient.subUnits.find(su => su.name === ingredient.unit);
    if (subUnit) {
      return Math.floor(ingredient.availableQuantity * subUnit.conversionRate);
    }
    return ingredient.availableQuantity;
  };

  const totalPaid = getTotalPaid();
  const totalRevenue = calculateTotalRevenue();
  const change = totalPaid - totalRevenue;

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
            <Button onClick={handleInitiateCompletion} disabled={loading} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Complete Production
            </Button>
          )}
        </div>
      </div>

      {(ingredients.length > 0 || productionActive) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your progress is being saved automatically. You can safely leave and return to this page.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Production</TabsTrigger>
          <TabsTrigger value="formulas">Saved Formulas</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
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
                        : 'Enter customer details, output quantity, and pricing below'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Total Cost</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculateTotalCost())}</p>
                    {productionType === 'custom' && sellingPrice && (
                      <>
                        <p className="text-sm text-green-700 mt-2">Expected Revenue</p>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(calculateTotalRevenue())}</p>
                        <p className="text-sm text-purple-700 mt-1">Profit</p>
                        <p className="text-lg font-bold text-purple-900">{formatCurrency(calculateProfit())}</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            S: {formatCurrency(product.sellingPrice)}
                          </p>
                          <p className="text-sm text-green-600 font-semibold">
                            B: {formatCurrency(product.buyingPrice)}
                          </p>
                          {product.hasMultipleUnits && (
                            <p className="text-xs text-purple-600 mt-1">Multi-unit</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

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
                            {ing.hasMultipleUnits && ing.subUnits.length > 0 ? (
                              <Select 
                                value={ing.unit}
                                onValueChange={(value) => updateIngredientUnit(ing.product, value)}
                                disabled={productionActive}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={ing.baseUnit}>
                                    {ing.baseUnit} (Avail: {ing.availableQuantity})
                                  </SelectItem>
                                  {ing.subUnits.map((subUnit) => {
                                    const available = Math.floor(ing.availableQuantity * subUnit.conversionRate);
                                    return (
                                      <SelectItem key={subUnit.name} value={subUnit.name}>
                                        {subUnit.name} (Avail: {available})
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-xs text-gray-600">Unit: {ing.unit}</p>
                            )}

                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Quantity"
                              value={ing.quantity}
                              onChange={(e) => updateIngredientQuantity(ing.product, e.target.value)}
                              disabled={productionActive}
                            />
                            <p className="text-xs text-gray-600">
                              Available: {getAvailableInUnit(ing)} {ing.unit}
                            </p>
                            
                            {ing.unit === ing.baseUnit ? (
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
                                    Selling: {formatCurrency(ing.currentSellingPrice || ing.sellingPrice)}
                                  </SelectItem>
                                  <SelectItem value="buying">
                                    Buying: {formatCurrency(ing.currentBuyingPrice || ing.buyingPrice)}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="p-2 bg-gray-100 rounded">
                                <p className="text-xs text-gray-600">Unit Price (Selling)</p>
                                <p className="text-sm font-semibold">
                                  {formatCurrency(ing.currentSellingPrice || ing.sellingPrice)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Sub-units use selling price only
                                </p>
                              </div>
                            )}
                            
                            {ing.quantity && (
                              <p className="text-xs text-blue-600 font-semibold">
                                Cost: {formatCurrency(getCurrentPrice(ing) * ing.quantity)}
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
                          
                          <div className="grid grid-cols-2 gap-2 mt-4">
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
                          
                          <div className="p-3 bg-blue-50 rounded-lg mt-2">
                            <p className="text-sm font-semibold mb-1">Total Output for Inventory:</p>
                            <p className="text-lg font-bold text-blue-600">
                              {parseFloat(outputBags || 0)} bags + {parseFloat(outputKgs || 0)} kgs
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                              This will be added to the product's stock. Sell from POS later.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>Customer Name *</Label>
                            <Input
                              placeholder="Enter customer name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Custom Product Name *</Label>
                            <Input
                              placeholder="e.g., John's Custom Mix"
                              value={customOutputName}
                              onChange={(e) => setCustomOutputName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Selling Price (Total) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter total selling price"
                              value={sellingPrice}
                              onChange={(e) => setSellingPrice(e.target.value)}
                            />
                            <p className="text-xs text-gray-600">
                              Minimum: {formatCurrency(calculateTotalCost())} (production cost)
                            </p>
                          </div>
                          
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center mb-2">
                              <ShoppingCart className="h-4 w-4 mr-2 text-green-600" />
                              <p className="text-sm font-semibold text-green-800">Direct Sale</p>
                            </div>
                            <p className="text-xs text-gray-700">
                              Custom combinations are sold immediately and won't be added to inventory.
                            </p>
                          </div>

                          {sellingPrice && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Production Cost:</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {formatCurrency(calculateTotalCost())}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Selling Price:</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {formatCurrency(parseFloat(sellingPrice))}
                                  </p>
                                </div>
                              </div>
                              <div className="border-t mt-2 pt-2">
                                <p className="text-sm text-gray-600">Profit:</p>
                                <p className="text-xl font-bold text-purple-600">
                                  {formatCurrency(calculateProfit())}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
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
                <TableHead>Revenue</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionHistory.map((prod) => (
                <TableRow key={prod._id}>
                  <TableCell className="font-medium">{prod.productionNumber}</TableCell>
                  <TableCell>{formatDateTime(prod.createdAt)}</TableCell>
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
                  <TableCell className="text-green-600">
                    {prod.totalRevenue ? formatCurrency(prod.totalRevenue) : '-'}
                  </TableCell>
                  <TableCell className="text-purple-600 font-semibold">
                    {prod.profit ? formatCurrency(prod.profit) : '-'}
                  </TableCell>
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

      {/* Confirm Save Dialog */}
      <Dialog open={showConfirmSaveDialog} onOpenChange={setShowConfirmSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Formula?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Would you like to save this production as a formula for future use?</p>
            <p className="text-sm text-gray-600 mt-2">
              You can skip this and proceed directly to completing the production.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSkipSaveFormula}>
              No, Just Complete
            </Button>
            <Button onClick={handleChooseSaveFormula}>
              <Save className="mr-2 h-4 w-4" />
              Yes, Save Formula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveFormulaDialog} onOpenChange={setShowSaveFormulaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Production Formula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Formula Name *</Label>
              <Input
                placeholder="e.g., TELE Kienyeji Standard"
                value={formulaName}
                onChange={(e) => setFormulaName(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-600">
              This will save the current ingredients, quantities, and output for quick reuse.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveFormulaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFormula} disabled={loading}>
              {loading ? 'Saving...' : 'Save & Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Execute Formula Dialog with Scale Selection and Substitution */}
      <Dialog open={showExecuteFormulaDialog} onOpenChange={setShowExecuteFormulaDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Execute Formula: {selectedFormula?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Formula Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <h4 className="font-semibold">Type:</h4>
                <span className="text-sm">
                  {selectedFormula?.type === 'standard' ? 'Standard (TELE)' : 'Custom Combination'}
                </span>
              </div>
              {selectedFormula?.type === 'custom' && (
                <>
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold">Customer:</h4>
                    <span className="text-sm">{selectedFormula?.customerName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold">Product:</h4>
                    <span className="text-sm">{selectedFormula?.customOutputName}</span>
                  </div>
                </>
              )}
            </div>

            {/* Ingredients with Substitution and Editable Quantities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Ingredients</Label>
                {formulaIngredients.some(ing => ing.isSubstituted) && (
                  <span className="text-xs text-amber-600 font-medium">
                    ⚠️ Contains substitutions
                  </span>
                )}
              </div>
              
              <div className="border rounded-lg divide-y">
                {formulaIngredients.map((ing, index) => (
                  <div key={index} className={`p-3 ${ing.isSubstituted ? 'bg-amber-50' : 'bg-white'}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {ing.isSubstituted && (
                            <ArrowRightLeft className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          )}
                          <p className="font-medium truncate">{ing.productName}</p>
                          {ing.isSubstituted && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                              Substituted
                            </span>
                          )}
                        </div>
                        
                        {ing.isSubstituted && (
                          <p className="text-amber-700 text-xs mb-2">
                            Original: {ing.originalProductName} ({ing.originalQuantity || ing.quantity} {ing.unit})
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {!ing.isSubstituted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSubstitutionDialog(index)}
                            className="whitespace-nowrap"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Substitute
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetIngredientToOriginal(index)}
                            className="whitespace-nowrap"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Editable Quantity Section */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={ing.quantity}
                          onChange={(e) => updateFormulaIngredientQuantity(index, e.target.value)}
                          className="h-8"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Unit</Label>
                        {ing.hasMultipleUnits && ing.subUnits.length > 0 ? (
                          <Select 
                            value={ing.unit}
                            onValueChange={(value) => updateFormulaIngredientUnit(index, value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ing.baseUnit}>
                                {ing.baseUnit}
                              </SelectItem>
                              {ing.subUnits.map((subUnit) => (
                                <SelectItem key={subUnit.name} value={subUnit.name}>
                                  {subUnit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-8 px-3 py-2 bg-gray-50 border rounded text-sm">
                            {ing.unit}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      <p>Available: {ing.availableInUnit || ing.availableQuantity} {ing.unit}</p>
                      {ing.quantity && (
                        <p className="text-blue-600 font-semibold">
                          Cost: {formatCurrency((ing.currentSellingPrice || ing.sellingPrice) * ing.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scale Selection */}
            <div className="space-y-2">
              <Label>Formula Scale</Label>
              <Select value={formulaScale} onValueChange={setFormulaScale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Formula (100%)</SelectItem>
                  <SelectItem value="half">Half Formula (50%)</SelectItem>
                  <SelectItem value="quarter">Quarter Formula (25%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {formulaIngredients.some(ing => ing.isSubstituted) ? (
                  <span className="text-amber-700">
                    ⚠️ You've made substitutions. You can adjust quantities for any ingredient. The original formula will remain unchanged.
                  </span>
                ) : (
                  <span>
                    You can edit ingredient quantities and units. Stock will be checked before execution.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {selectedFormula?.type === 'standard' ? (
              <>
                <div className="space-y-2">
                  <Label>Custom Output (Optional - Override scaled default)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Bags"
                      value={customOutput.bags}
                      onChange={(e) => setCustomOutput({...customOutput, bags: e.target.value})}
                    />
                    <Input
                      type="number"
                      placeholder="Kgs"
                      value={customOutput.kgs}
                      onChange={(e) => setCustomOutput({...customOutput, kgs: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Leave blank to use scaled default output
                  </p>
                </div>

                {selectedFormula && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold mb-1">Expected Scaled Output:</p>
                    <p className="text-sm">
                      {formulaScale === 'full' ? 'Full' : formulaScale === 'half' ? 'Half' : 'Quarter'} formula will produce approximately:
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {((selectedFormula.defaultOutputBags || 0) * getScaleMultiplier()).toFixed(1)} bags + 
                      {((selectedFormula.defaultOutputKgs || 0) * getScaleMultiplier()).toFixed(1)} kgs
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Selling Price (Total) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter total selling price"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <ShoppingCart className="h-4 w-4 mr-2 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">Direct Sale</p>
                  </div>
                  <p className="text-xs text-gray-700">
                    Custom combinations are sold immediately and won't be added to inventory.
                  </p>
                </div>

                {sellingPrice && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold mb-1">Selling Price:</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(parseFloat(sellingPrice))}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExecuteFormulaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeFormula} disabled={loading}>
              {loading ? 'Executing...' : selectedFormula?.type === 'standard' ? 'Add to Inventory' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Substitution Dialog */}
      <Dialog open={showSubstitutionDialog} onOpenChange={setShowSubstitutionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Substitute Ingredient</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {substitutionIndex !== null && formulaIngredients[substitutionIndex] && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Replacing:</p>
                <p className="font-semibold">{formulaIngredients[substitutionIndex].productName}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Current quantity: {formulaIngredients[substitutionIndex].quantity} {formulaIngredients[substitutionIndex].unit}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  You can change the quantity after substituting
                </p>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for replacement product..."
                value={substitutionSearch}
                onChange={(e) => setSubstitutionSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-1 gap-2 p-2">
                {substitutionProducts.map((product) => (
                  <Card
                    key={product._id}
                    className="cursor-pointer hover:shadow-md hover:border-blue-500 transition-all"
                    onClick={() => substituteIngredient(product)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{product.name}</h3>
                          <p className="text-xs text-gray-600 mt-1">
                            Stock: {product.quantity} {product.baseUnit}
                          </p>
                          <div className="flex gap-3 mt-1">
                            <p className="text-xs text-blue-600">
                              Sell: {formatCurrency(product.sellingPrice)}
                            </p>
                            <p className="text-xs text-green-600">
                              Buy: {formatCurrency(product.buyingPrice)}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {substitutionProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products found
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedFormula ? (
                  <>{selectedFormula.name} - {customerName || selectedFormula.customerName}</>
                ) : (
                  <>{customerName} - {customOutputName}</>
                )}
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
              {totalPaid > totalRevenue && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(change)}</span>
                </div>
              )}
              {totalPaid < totalRevenue && (
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalRevenue - totalPaid)}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={selectedFormula ? handleCompleteFormulaSale : handleCompleteSale} 
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}