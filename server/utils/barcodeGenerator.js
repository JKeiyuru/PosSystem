// server/utils/emailService.js

import nodemailer from 'nodemailer';
import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Settings from '../models/Settings.model.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send daily report
export const sendDailyReport = async () => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings || !settings.enableEmailAlerts || settings.reportRecipients.length === 0) {
      console.log('Email alerts disabled or no recipients configured');
      return;
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get sales data
    const sales = await Sale.find({
      saleDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = sales.length;

    const cashSales = sales.filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.total, 0);
    const mpesaSales = sales.filter(s => s.paymentMethod === 'mpesa')
      .reduce((sum, s) => sum + s.total, 0);
    const creditSales = sales.filter(s => s.paymentMethod === 'credit')
      .reduce((sum, s) => sum + s.total, 0);

    // Get low stock products
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    });

    // Create email content
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .summary-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .summary-item:last-child { border-bottom: none; }
          .label { font-weight: bold; }
          .value { color: #2563eb; font-weight: bold; }
          .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f3f4f6; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Daily Sales Report - ${settings.businessName}</h1>
            <p>${new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div class="content">
            <div class="summary-box">
              <h2>Sales Summary</h2>
              <div class="summary-item">
                <span class="label">Total Sales:</span>
                <span class="value">${totalSales}</span>
              </div>
              <div class="summary-item">
                <span class="label">Total Revenue:</span>
                <span class="value">${settings.currency} ${totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div class="summary-box">
              <h2>Payment Breakdown</h2>
              <div class="summary-item">
                <span class="label">Cash:</span>
                <span class="value">${settings.currency} ${cashSales.toLocaleString()}</span>
              </div>
              <div class="summary-item">
                <span class="label">M-Pesa:</span>
                <span class="value">${settings.currency} ${mpesaSales.toLocaleString()}</span>
              </div>
              <div class="summary-item">
                <span class="label">Credit:</span>
                <span class="value">${settings.currency} ${creditSales.toLocaleString()}</span>
              </div>
            </div>

            ${lowStockProducts.length > 0 ? `
              <div class="alert">
                <h3 style="margin-top: 0;">⚠️ Low Stock Alert</h3>
                <p>The following products are running low on stock:</p>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lowStockProducts.map(product => `
                      <tr>
                        <td>${product.name}</td>
                        <td>${product.quantity}</td>
                        <td>${product.reorderLevel}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>This is an automated report from ${settings.businessName} POS System</p>
            <p>Generated on ${new Date().toLocaleString('en-KE')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();

    // Send email to all recipients
    for (const recipient of settings.reportRecipients) {
      await transporter.sendMail({
        from: `"${settings.businessName}" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `Daily Sales Report - ${new Date().toLocaleDateString('en-KE')}`,
        html: emailHTML
      });
    }

    console.log('Daily report sent successfully');
  } catch (error) {
    console.error('Error sending daily report:', error);
    throw error;
  }
};

// Send low stock alert
export const sendLowStockAlert = async (product) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings || !settings.enableEmailAlerts || settings.reportRecipients.length === 0) {
      return;
    }

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert-box { background-color: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 5px; }
          .product-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert-box">
            <h2>⚠️ Low Stock Alert</h2>
            <p>The following product is running low on stock:</p>
            
            <div class="product-info">
              <div class="info-row">
                <strong>Product:</strong>
                <span>${product.name}</span>
              </div>
              <div class="info-row">
                <strong>Current Stock:</strong>
                <span>${product.quantity} ${product.unit}</span>
              </div>
              <div class="info-row">
                <strong>Reorder Level:</strong>
                <span>${product.reorderLevel} ${product.unit}</span>
              </div>
              <div class="info-row">
                <strong>Category:</strong>
                <span>${product.category}</span>
              </div>
            </div>

            <p><strong>Action Required:</strong> Please restock this item as soon as possible.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();

    for (const recipient of settings.reportRecipients) {
      await transporter.sendMail({
        from: `"${settings.businessName}" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `⚠️ Low Stock Alert - ${product.name}`,
        html: emailHTML
      });
    }
  } catch (error) {
    console.error('Error sending low stock alert:', error);
  }
};

// Send invoice email
export const sendInvoiceEmail = async (invoice, customerEmail) => {
  try {
    const settings = await Settings.findOne();
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px; border-bottom: 2px solid #2563eb; }
          .invoice-details { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f3f4f6; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${settings.businessName}</h1>
            <p>${settings.businessAddress || ''}</p>
            <p>Phone: ${settings.businessPhone || ''} | Email: ${settings.businessEmail}</p>
          </div>

          <div class="invoice-details">
            <h2>Invoice #${invoice.invoiceNumber}</h2>
            <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-KE')}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-KE') : 'N/A'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${settings.currency} ${item.unitPrice.toLocaleString()}</td>
                  <td>${settings.currency} ${item.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>Subtotal: ${settings.currency} ${invoice.subtotal.toLocaleString()}</p>
            ${invoice.tax > 0 ? `<p>Tax: ${settings.currency} ${invoice.tax.toLocaleString()}</p>` : ''}
            <p>Total: ${settings.currency} ${invoice.total.toLocaleString()}</p>
          </div>

          ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"${settings.businessName}" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Invoice #${invoice.invoiceNumber} from ${settings.businessName}`,
      html: emailHTML
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};