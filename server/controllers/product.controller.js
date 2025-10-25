// server/controllers/product.controller.js

import Product from '../models/Product.model.js';
import StockMovement from '../models/StockMovement.model.js';
import xlsx from 'xlsx';

export const getAllProducts = async (req, res) => {
  try {
    const { search, category, stockStatus } = req.query;
    
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ name: 1 });

    // Filter by stock status if provided
    let filteredProducts = products;
    if (stockStatus) {
      filteredProducts = products.filter(p => p.stockStatus === stockStatus);
    }

    res.json({
      success: true,
      data: filteredProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const generateBarcode = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Generate barcode if not exists
    if (!product.barcode) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      product.barcode = `BAF${timestamp}${random}`;
      await product.save();
    }

    res.json({
      success: true,
      data: {
        barcode: product.barcode,
        product
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const bulkImport = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid products data'
      });
    }

    const createdProducts = await Product.insertMany(products, { ordered: false });

    res.status(201).json({
      success: true,
      message: `${createdProducts.length} products imported successfully`,
      data: createdProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// New endpoint to get product with sub-unit pricing
export const getProductPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Return product with all pricing options
    const pricingOptions = [
      {
        unit: product.baseUnit,
        displayName: `Per ${product.baseUnit}`,
        price: product.sellingPrice,
        available: Math.floor(product.quantity)
      }
    ];

    // Add sub-unit pricing options
    product.subUnits.forEach(subUnit => {
      const availableUnits = Math.floor(product.quantity * subUnit.conversionRate);
      pricingOptions.push({
        unit: subUnit.name,
        displayName: `Per ${subUnit.name}`,
        price: subUnit.pricePerUnit,
        available: availableUnits,
        conversionRate: subUnit.conversionRate
      });
    });

    res.json({
      success: true,
      data: {
        product,
        pricingOptions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};