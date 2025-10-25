// server/utils/excelParser.js

import xlsx from 'xlsx';

export const parseExcelFile = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    return data;
  } catch (error) {
    throw new Error('Error parsing Excel file: ' + error.message);
  }
};

export const mapExcelColumns = (data, columnMapping) => {
  return data.map(row => {
    const mappedRow = {};
    
    Object.keys(columnMapping).forEach(key => {
      const excelColumn = columnMapping[key];
      mappedRow[key] = row[excelColumn];
    });
    
    return mappedRow;
  });
};

export const validateProductData = (products) => {
  const errors = [];
  
  products.forEach((product, index) => {
    if (!product.name) {
      errors.push(`Row ${index + 1}: Product name is required`);
    }
    if (!product.category) {
      errors.push(`Row ${index + 1}: Category is required`);
    }
    if (!product.buyingPrice || product.buyingPrice <= 0) {
      errors.push(`Row ${index + 1}: Valid buying price is required`);
    }
    if (!product.sellingPrice || product.sellingPrice <= 0) {
      errors.push(`Row ${index + 1}: Valid selling price is required`);
    }
    if (product.quantity === undefined || product.quantity < 0) {
      errors.push(`Row ${index + 1}: Valid quantity is required`);
    }
  });
  
  return errors;
};