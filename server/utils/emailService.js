// server/utils/emailService.js

import nodemailer from 'nodemailer';
import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Settings from '../models/Settings.model.js';
import DailyReport from '../models/DailyReport.model.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send daily report with checks and balances
export const sendDailyReportWithBalance = async (dailyReportId) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings || !settings.enableEmailAlerts || settings.reportRecipients.length === 0) {
      console.log('Email alerts disabled or no recipients configured');
      return { success: false, message: 'Email alerts disabled' };
    }

    // Get the daily report
    const dailyReport = await DailyReport.findById(dailyReportId).populate('closedBy', 'name');
    
    if (!dailyReport) {
      throw new Error('Daily report not found');
    }

    const today = new Date(dailyReport.reportDate);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get sales data
    const sales = await Sale.find({
      saleDate: { $gte: startOfDay, $lte: endOfDay }
    });

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
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background-color: #f9fafb; }
          .section { background-color: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .summary-item:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #2563eb; font-weight: bold; font-size: 1.1em; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .variance-box { background-color: ${dailyReport.variance >= 0 ? '#d1fae5' : '#fee2e2'}; 
                         border: 2px solid ${dailyReport.variance >= 0 ? '#10b981' : '#ef4444'};
                         padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }
          .variance-amount { font-size: 2em; font-weight: bold; 
                            color: ${dailyReport.variance >= 0 ? '#10b981' : '#ef4444'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${settings.businessName}</h1>
            <h2>Daily Business Report</h2>
            <p>${new Date(dailyReport.reportDate).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div class="content">
            <!-- Daily Checks & Balances -->
            <div class="section">
              <h2>📊 Daily Checks & Balances</h2>
              // server/utils/emailService.js - Update sendDailyReportWithBalance

// In the email HTML, update the expected cash calculation section:

<div class="summary-item">
  <span class="label">Opening Cash:</span>
  <span class="value">${settings.currency} ${dailyReport.openingCash.toLocaleString()}</span>
</div>
<div class="summary-item">
  <span class="label">Cash Sales:</span>
  <span class="value positive">+${settings.currency} ${dailyReport.cashSales.toLocaleString()}</span>
</div>
<div class="summary-item">
  <span class="label">M-Pesa Sales (Not Cash):</span>
  <span class="value" style="color: #8b5cf6;">+${settings.currency} ${dailyReport.mpesaSales.toLocaleString()}</span>
</div>
<div class="summary-item">
  <span class="label">Total Expenses:</span>
  <span class="value negative">-${settings.currency} ${dailyReport.totalExpenses.toLocaleString()}</span>
</div>
<div class="summary-item">
  <span class="label">Expected Cash:</span>
  <span class="value">${settings.currency} ${dailyReport.expectedCash.toLocaleString()}</span>
</div>
<div class="summary-item">
  <span class="label">Actual Cash:</span>
  <span class="value">${settings.currency} ${dailyReport.actualCash.toLocaleString()}</span>
</div>
              
              <div class="variance-box">
                <div style="font-size: 1.2em; margin-bottom: 5px;">Cash Variance</div>
                <div class="variance-amount">
                  ${dailyReport.variance >= 0 ? '+' : ''}${settings.currency} ${dailyReport.variance.toLocaleString()}
                </div>
                <div style="margin-top: 5px; font-size: 0.9em;">
                  ${dailyReport.variance >= 0 ? '✓ Surplus' : '⚠ Shortage'}
                </div>
              </div>

              ${dailyReport.expensesNotes ? `
                <div style="margin-top: 15px; padding: 10px; background-color: #f3f4f6; border-radius: 5px;">
                  <strong>Expenses Notes:</strong> ${dailyReport.expensesNotes}
                </div>
              ` : ''}
            </div>

            <!-- Sales Summary -->
            <div class="section">
              <h2>💰 Sales Summary</h2>
              <div class="summary-item">
                <span class="label">Total Sales:</span>
                <span class="value">${dailyReport.salesCount}</span>
              </div>
              <div class="summary-item">
                <span class="label">Total Revenue:</span>
                <span class="value">${settings.currency} ${dailyReport.totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <!-- Payment Breakdown -->
            <div class="section">
              <h2>💳 Payment Method Breakdown</h2>
              <div class="summary-item">
                <span class="label">Cash:</span>
                <span class="value">${settings.currency} ${dailyReport.cashSales.toLocaleString()}</span>
              </div>
              <div class="summary-item">
                <span class="label">M-Pesa:</span>
                <span class="value">${settings.currency} ${dailyReport.mpesaSales.toLocaleString()}</span>
              </div>
              <div class="summary-item">
                <span class="label">Credit:</span>
                <span class="value">${settings.currency} ${dailyReport.creditSales.toLocaleString()}</span>
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

            <div class="section">
              <p><strong>Report Closed By:</strong> ${dailyReport.closedByName}</p>
              <p><strong>Report Generated:</strong> ${new Date(dailyReport.createdAt).toLocaleString('en-KE')}</p>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated report from ${settings.businessName} POS System</p>
            <p>&copy; ${new Date().getFullYear()} ${settings.businessName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();

    // Send email to all recipients
    const emailPromises = settings.reportRecipients.map(recipient => 
      transporter.sendMail({
        from: `"${settings.businessName}" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `Daily Business Report - ${new Date(dailyReport.reportDate).toLocaleDateString('en-KE')}`,
        html: emailHTML
      })
    );

    await Promise.all(emailPromises);

    console.log('Daily report with checks & balances sent successfully');
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending daily report:', error);
    return { success: false, message: error.message };
  }
};

// Keep the old function for backward compatibility
export const sendDailyReport = async () => {
  // This can be removed or kept for scheduled reports without checks & balances
  console.log('Use sendDailyReportWithBalance instead');
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