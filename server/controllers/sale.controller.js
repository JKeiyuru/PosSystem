// server/controllers/sale.controller.js

import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Customer from '../models/Customer.model.js';
import StockMovement from '../models/StockMovement.model.js';
import mongoose from 'mongoose';

export const createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod, paymentStatus, amountPaid, customer, notes } = req.body;

    if (!items || items.length === 0) {
      throw new Error('Sale must have at least one item');
    }

    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }

      // Determine unit and price
      let unitPrice, unit, baseUnitQuantity;
      
      if (item.unit && item.unit !== product.baseUnit) {
        // Selling in sub-unit
        const subUnit = product.subUnits.find(su => su.name === item.unit);
        
        if (!subUnit) {
          throw new Error(`Unit ${item.unit} not available for ${product.name}`);
        }

        unitPrice = subUnit.pricePerUnit;
        unit = item.unit;
        
        // Convert to base unit for inventory
        baseUnitQuantity = product.convertToBaseUnit(item.unit, item.quantity);
        
        // Check stock
        if (!product.hasEnoughStock(item.unit, item.quantity)) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${Math.floor(product.quantity * subUnit.conversionRate)} ${unit}`);
        }

        // Mark bag as opened if selling sub-unit
        if (unit !== product.baseUnit) {
          product.openedBags += Math.ceil(baseUnitQuantity);
        }
      } else {
        // Selling in base unit (bag)
        unitPrice = product.sellingPrice;
        unit = product.baseUnit;
        baseUnitQuantity = item.quantity;
        
        if (product.quantity < baseUnitQuantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity} ${unit}`);
        }
      }

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unit,
        unitPrice,
        totalPrice,
        baseUnitQuantity
      });

      // Update product quantity (always in base unit)
      product.quantity -= baseUnitQuantity;
      
      // Ensure opened bags doesn't exceed total
      if (product.openedBags > Math.ceil(product.quantity)) {
        product.openedBags = Math.ceil(product.quantity);
      }
      
      await product.save({ session });

      // Record stock movement
      await StockMovement.create([{
        product: product._id,
        movementType: 'sale',
        quantity: -baseUnitQuantity,
        previousQuantity: product.quantity + baseUnitQuantity,
        newQuantity: product.quantity,
        reference: `Sold ${item.quantity} ${unit}`,
        performedBy: req.user.id
      }], { session });
    }

    const total = subtotal;
    const paidAmount = parseFloat(amountPaid) || 0;
    let calculatedAmountDue = total - paidAmount;
    if (calculatedAmountDue < 0) calculatedAmountDue = 0;

    let finalPaymentStatus;
    if (paymentMethod === 'credit') {
      finalPaymentStatus = paidAmount >= total ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid');
    } else {
      finalPaymentStatus = paidAmount >= total ? 'paid' : 'partial';
    }

    const cashierName = req.user.name;
    let customerName = null;
    
    if (customer) {
      const customerDoc = await Customer.findById(customer).session(session);
      if (customerDoc) {
        customerName = customerDoc.name;
      }
    }

    const sale = await Sale.create([{
      items: saleItems,
      subtotal,
      total,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      amountPaid: paidAmount,
      amountDue: calculatedAmountDue,
      customer: customer || null,
      customerName,
      cashier: req.user.id,
      cashierName,
      notes: notes || ''
    }], { session });

    if (customer) {
      const customerDoc = await Customer.findById(customer).session(session);
      if (customerDoc) {
        customerDoc.totalPurchases += total;
        if (calculatedAmountDue > 0) {
          customerDoc.currentCredit += calculatedAmountDue;
        }
        await customerDoc.save({ session });
      }
    }

    await session.commitTransaction();

    const populatedSale = await Sale.findById(sale[0]._id)
      .populate('items.product')
      .populate('customer')
      .populate('cashier');

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: populatedSale
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

// Keep all other existing functions...
export const getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, paymentStatus } = req.query;
    
    let query = {};

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const sales = await Sale.find(query)
      .populate('customer')
      .populate('cashier', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product')
      .populate('customer')
      .populate('cashier', 'name email');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateSalePayment = async (req, res) => {
  try {
    const { amountPaid } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    sale.amountPaid += parseFloat(amountPaid);
    sale.amountDue = Math.max(0, sale.total - sale.amountPaid);
    
    if (sale.amountDue <= 0) {
      sale.paymentStatus = 'paid';
      sale.amountDue = 0;
    } else if (sale.amountPaid > 0) {
      sale.paymentStatus = 'partial';
    }

    await sale.save();

    if (sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        customer.currentCredit = Math.max(0, customer.currentCredit - parseFloat(amountPaid));
        await customer.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      saleDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('customer').populate('cashier', 'name');

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCash = sales.filter(s => s.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.total, 0);
    const totalMpesa = sales.filter(s => s.paymentMethod === 'mpesa')
      .reduce((sum, sale) => sum + sale.total, 0);
    const totalCredit = sales.filter(s => s.paymentMethod === 'credit')
      .reduce((sum, sale) => sum + sale.total, 0);

    res.json({
      success: true,
      data: {
        sales,
        summary: {
          totalSales,
          totalCash,
          totalMpesa,
          totalCredit,
          salesCount: sales.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Restore product quantities
    for (const item of sale.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        // Restore using base unit quantity
        product.quantity += item.baseUnitQuantity || item.quantity;
        await product.save({ session });

        await StockMovement.create([{
          product: product._id,
          movementType: 'adjustment',
          quantity: item.baseUnitQuantity || item.quantity,
          previousQuantity: product.quantity - (item.baseUnitQuantity || item.quantity),
          newQuantity: product.quantity,
          notes: `Sale ${sale.saleNumber} deleted`,
          performedBy: req.user.id
        }], { session });
      }
    }

    if (sale.customer) {
      const customer = await Customer.findById(sale.customer).session(session);
      if (customer) {
        customer.totalPurchases = Math.max(0, customer.totalPurchases - sale.total);
        customer.currentCredit = Math.max(0, customer.currentCredit - sale.amountDue);
        await customer.save({ session });
      }
    }

    await Sale.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};