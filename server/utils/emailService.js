// server/utils/emailService.js - COMPREHENSIVE BUSINESS SUMMARY

import { Resend } from 'resend';
import Sale from '../models/Sale.model.js';
import Product from '../models/Product.model.js';
import Settings from '../models/Settings.model.js';
import DailyReport from '../models/DailyReport.model.js';
import ReceivingInvoice from '../models/ReceivingInvoice.model.js';
import Customer from '../models/Customer.model.js';
import Production from '../models/Production.model.js';

// Initialize Resend
let resend;
try {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not set - emails will not be sent');
  } else {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend email service initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Resend:', error.message);
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
};

// COMPREHENSIVE DAILY BUSINESS REPORT
export const sendComprehensiveDailyReport = async (dailyReportId) => {
  try {
    if (!resend) {
      throw new Error('Email service not configured - RESEND_API_KEY missing');
    }

    const settings = await Settings.findOne();
    
    if (!settings || !settings.enableEmailAlerts || settings.reportRecipients.length === 0) {
      console.log('📧 Email alerts disabled or no recipients configured');
      return { success: false, message: 'Email alerts disabled' };
    }

    if (!process.env.BUSINESS_EMAIL) {
      throw new Error('BUSINESS_EMAIL environment variable is missing');
    }

    // Get the daily report
    const dailyReport = await DailyReport.findById(dailyReportId).populate('closedBy', 'name');
    
    if (!dailyReport) {
      throw new Error('Daily report not found');
    }

    const today = new Date(dailyReport.reportDate);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 1. GET SALES DATA
    const sales = await Sale.find({
      saleDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('customer');

    const topSales = sales
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 2. GET RECEIVING INVOICES (GOODS RECEIVED TODAY)
    const receivingInvoices = await ReceivingInvoice.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('items.product');

    const totalPurchases = receivingInvoices.reduce((sum, inv) => sum + inv.actualInvoiceAmount, 0);
    const unpaidInvoices = receivingInvoices.filter(inv => inv.paymentStatus === 'unpaid');

    // 3. GET LOW STOCK PRODUCTS
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    }).sort({ quantity: 1 }).limit(10);

    // 4. GET TOP CUSTOMERS BY SPENDING
    const customerSpending = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startOfDay, $lte: endOfDay },
          customer: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$customer',
          customerName: { $first: '$customerName' },
          totalSpent: { $sum: '$total' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]);

    // 5. GET CUSTOMERS WITH HIGH DEBT
    const customersWithDebt = await Customer.find({
      isActive: true,
      currentCredit: { $gt: 0 }
    }).sort({ currentCredit: -1 }).limit(5);

    // 6. GET PRODUCTION RECORDS FOR TODAY
    const productions = await Production.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('finalProduct');

    const totalProduction = productions.length;
    const productionCost = productions.reduce((sum, p) => sum + p.totalCost, 0);
    const productionRevenue = productions.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);

    // 7. CALCULATE PROFIT
    const totalProfit = sales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);

    console.log('📊 Generating comprehensive daily report email...');

    // CREATE COMPREHENSIVE EMAIL HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 900px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 5px 0; opacity: 0.9; }
          .content { padding: 20px; }
          .section { background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #667eea; }
          .section h2 { color: #667eea; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
          .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-card.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
          .stat-card.red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          .stat-card.orange { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
          .stat-label { font-size: 12px; opacity: 0.9; margin-bottom: 5px; }
          .stat-value { font-size: 24px; font-weight: bold; }
          .variance-box { background: ${dailyReport.variance >= 0 ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'}; 
                         border: 3px solid ${dailyReport.variance >= 0 ? '#10b981' : '#ef4444'};
                         padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .variance-amount { font-size: 36px; font-weight: bold; 
                            color: ${dailyReport.variance >= 0 ? '#10b981' : '#ef4444'}; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
          th, td { padding: 12px 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f9fafb; font-weight: 600; color: #374151; }
          tr:hover { background-color: #f9fafb; }
          .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .alert h3 { margin-top: 0; color: #dc2626; }
          .success { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .info { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${settings.businessName}</h1>
            <h2>Comprehensive Daily Business Report</h2>
            <p>${new Date(dailyReport.reportDate).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div class="content">
            
            <!-- FINANCIAL OVERVIEW -->
            <div class="section">
              <h2>💰 Financial Overview</h2>
              <div class="grid">
                <div class="stat-card green">
                  <div class="stat-label">Total Revenue</div>
                  <div class="stat-value">${formatCurrency(dailyReport.totalRevenue)}</div>
                </div>
                <div class="stat-card green">
                  <div class="stat-label">Gross Profit</div>
                  <div class="stat-value">${formatCurrency(totalProfit)}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Sales</div>
                  <div class="stat-value">${dailyReport.salesCount}</div>
                </div>
                <div class="stat-card red">
                  <div class="stat-label">Expenses</div>
                  <div class="stat-value">${formatCurrency(dailyReport.totalExpenses)}</div>
                </div>
              </div>
            </div>

            <!-- CASH CHECKS & BALANCES -->
            <div class="section">
              <h2>💵 Daily Cash Checks & Balances</h2>
              
              <table>
                <tr>
                  <td><strong>Opening Cash:</strong></td>
                  <td style="text-align: right;">${formatCurrency(dailyReport.openingCash)}</td>
                </tr>
                <tr>
                  <td><strong>Cash Sales (Including Credit Payments):</strong></td>
                  <td style="text-align: right; color: #10b981; font-weight: bold;">+${formatCurrency(dailyReport.cashSales)}</td>
                </tr>
                <tr>
                  <td><strong>Total Expenses:</strong></td>
                  <td style="text-align: right; color: #ef4444; font-weight: bold;">-${formatCurrency(dailyReport.totalExpenses)}</td>
                </tr>
                <tr style="background-color: #f9fafb; font-weight: bold;">
                  <td><strong>Expected Cash in Hand:</strong></td>
                  <td style="text-align: right;">${formatCurrency(dailyReport.expectedCash)}</td>
                </tr>
                <tr style="font-weight: bold;">
                  <td><strong>Actual Cash Counted:</strong></td>
                  <td style="text-align: right;">${formatCurrency(dailyReport.actualCash)}</td>
                </tr>
              </table>

              <div class="variance-box">
                <div style="font-size: 16px; font-weight: 600;">💵 Cash Variance</div>
                <div class="variance-amount">
                  ${dailyReport.variance >= 0 ? '+' : ''}${formatCurrency(dailyReport.variance)}
                </div>
                <div style="font-size: 14px; font-weight: 600;">
                  ${dailyReport.variance >= 0 ? '✅ Surplus' : '⚠️ Shortage'}
                </div>
              </div>

              ${dailyReport.expensesNotes ? `
                <div class="info">
                  <strong>💳 Expenses Notes:</strong><br>
                  ${dailyReport.expensesNotes}
                </div>
              ` : ''}

              <div class="info" style="margin-top: 15px;">
                <strong>ℹ️ Note:</strong> Expected Cash = Opening Cash + Cash Sales - Expenses<br>
                <small>M-Pesa sales (${formatCurrency(dailyReport.mpesaSales)}) are tracked separately as digital payments.</small>
              </div>
            </div>

            <!-- PAYMENT BREAKDOWN -->
            <div class="section">
              <h2>💳 Payment Method Breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th style="text-align: right;">Amount</th>
                    <th style="text-align: right;">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>💵 Cash</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(dailyReport.cashSales)}</td>
                    <td style="text-align: right;">${((dailyReport.cashSales / dailyReport.totalRevenue) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>📱 M-Pesa</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(dailyReport.mpesaSales)}</td>
                    <td style="text-align: right;">${((dailyReport.mpesaSales / dailyReport.totalRevenue) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>🔖 Credit</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(dailyReport.creditSales)}</td>
                    <td style="text-align: right;">${((dailyReport.creditSales / dailyReport.totalRevenue) * 100).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
              ${dailyReport.creditPaymentsCollected > 0 ? `
                <div class="success">
                  <strong>✅ Credit Payments Collected Today:</strong> ${formatCurrency(dailyReport.creditPaymentsCollected)}
                  <br><small>This amount is already included in the cash/M-Pesa figures above.</small>
                </div>
              ` : ''}
            </div>

            ${topSales.length > 0 ? `
              <div class="section">
                <h2>🏆 Top 5 Sales Today</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Sale #</th>
                      <th>Customer</th>
                      <th style="text-align: right;">Amount</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topSales.map(sale => `
                      <tr>
                        <td>${sale.saleNumber}</td>
                        <td>${sale.customerName || 'Walk-in'}</td>
                        <td style="text-align: right; font-weight: bold;">${formatCurrency(sale.total)}</td>
                        <td>${sale.paymentMethod.replace(/_/g, ' ').toUpperCase()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${receivingInvoices.length > 0 ? `
              <div class="section">
                <h2>📦 Goods Received Today</h2>
                <div class="grid">
                  <div class="stat-card orange">
                    <div class="stat-label">Total Invoices</div>
                    <div class="stat-value">${receivingInvoices.length}</div>
                  </div>
                  <div class="stat-card orange">
                    <div class="stat-label">Total Value</div>
                    <div class="stat-value">${formatCurrency(totalPurchases)}</div>
                  </div>
                  <div class="stat-card red">
                    <div class="stat-label">Unpaid</div>
                    <div class="stat-value">${unpaidInvoices.length}</div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Supplier</th>
                      <th style="text-align: right;">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${receivingInvoices.map(inv => `
                      <tr>
                        <td>${inv.invoiceNumber}</td>
                        <td>${inv.supplier}</td>
                        <td style="text-align: right; font-weight: bold;">${formatCurrency(inv.actualInvoiceAmount)}</td>
                        <td>
                          <span class="highlight" style="background-color: ${inv.paymentStatus === 'paid' ? '#d1fae5' : '#fef3c7'};">
                            ${inv.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                ${unpaidInvoices.length > 0 ? `
                  <div class="alert">
                    <strong>⚠️ ${unpaidInvoices.length} Unpaid Invoice(s)</strong><br>
                    Total amount due: ${formatCurrency(unpaidInvoices.reduce((sum, inv) => sum + inv.actualInvoiceAmount, 0))}
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${productions.length > 0 ? `
              <div class="section">
                <h2>🏭 Production Summary</h2>
                <div class="grid">
                  <div class="stat-card">
                    <div class="stat-label">Productions</div>
                    <div class="stat-value">${totalProduction}</div>
                  </div>
                  <div class="stat-card red">
                    <div class="stat-label">Production Cost</div>
                    <div class="stat-value">${formatCurrency(productionCost)}</div>
                  </div>
                  <div class="stat-card green">
                    <div class="stat-label">Production Revenue</div>
                    <div class="stat-value">${formatCurrency(productionRevenue)}</div>
                  </div>
                </div>
                
                <table>
                  <thead>
                    <tr>
                      <th>Production #</th>
                      <th>Type</th>
                      <th>Output</th>
                      <th style="text-align: right;">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productions.slice(0, 5).map(prod => `
                      <tr>
                        <td>${prod.productionNumber}</td>
                        <td>${prod.type === 'custom' ? `Custom - ${prod.customerName}` : prod.finalProductName}</td>
                        <td>${prod.outputBags} bags ${prod.outputKgs > 0 ? `+ ${prod.outputKgs}kg` : ''}</td>
                        <td style="text-align: right;">${formatCurrency(prod.totalCost)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${customerSpending.length > 0 ? `
              <div class="section">
                <h2>👥 Top Customers Today</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th style="text-align: center;">Sales</th>
                      <th style="text-align: right;">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${customerSpending.map(customer => `
                      <tr>
                        <td>${customer.customerName}</td>
                        <td style="text-align: center;">${customer.salesCount}</td>
                        <td style="text-align: right; font-weight: bold;">${formatCurrency(customer.totalSpent)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${customersWithDebt.length > 0 ? `
              <div class="section">
                <h2>⚠️ Customers with Outstanding Debt</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th style="text-align: right;">Amount Owed</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${customersWithDebt.map(customer => `
                      <tr>
                        <td>${customer.name}</td>
                        <td>${customer.phone}</td>
                        <td style="text-align: right; font-weight: bold; color: #ef4444;">${formatCurrency(customer.currentCredit)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="alert">
                  <strong>Total Outstanding Debt:</strong> ${formatCurrency(customersWithDebt.reduce((sum, c) => sum + c.currentCredit, 0))}
                </div>
              </div>
            ` : ''}

            ${lowStockProducts.length > 0 ? `
              <div class="section">
                <h2>📉 Low Stock Alert</h2>
                <div class="alert">
                  <h3 style="margin-top: 0;">⚠️ ${lowStockProducts.length} Product(s) Running Low</h3>
                  <p>The following products need restocking:</p>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: center;">Current Stock</th>
                      <th style="text-align: center;">Reorder Level</th>
                      <th style="text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lowStockProducts.map(product => `
                      <tr>
                        <td><strong>${product.name}</strong></td>
                        <td style="text-align: center; color: ${product.quantity === 0 ? '#ef4444' : '#f59e0b'}; font-weight: bold;">
                          ${product.quantity} ${product.baseUnit}
                        </td>
                        <td style="text-align: center;">${product.reorderLevel} ${product.baseUnit}</td>
                        <td style="text-align: center;">
                          <span class="highlight" style="background-color: ${product.quantity === 0 ? '#fecaca' : '#fed7aa'};">
                            ${product.quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- REPORT DETAILS -->
            <div class="section">
              <h2>📋 Report Details</h2>
              <p><strong>Closed By:</strong> ${dailyReport.closedByName}</p>
              <p><strong>Report Generated:</strong> ${new Date(dailyReport.createdAt).toLocaleString('en-KE')}</p>
              ${dailyReport.notes ? `<p><strong>Additional Notes:</strong> ${dailyReport.notes}</p>` : ''}
            </div>

          </div>

          <div class="footer">
            <p><strong>${settings.businessName}</strong> - Daily Business Summary</p>
            <p>This is an automated report generated by your POS system</p>
            <p style="margin-top: 10px; color: #9ca3af;">
              &copy; ${new Date().getFullYear()} ${settings.businessName}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all recipients
    console.log(`📧 Sending email to ${settings.reportRecipients.length} recipient(s)...`);
    
    const emailPromises = settings.reportRecipients.map(recipient => 
      resend.emails.send({
        from: process.env.BUSINESS_EMAIL,
        to: recipient,
        subject: `📊 Daily Business Report - ${new Date(dailyReport.reportDate).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        html: emailHTML
      })
    );

    const results = await Promise.all(emailPromises);
    
    console.log('✅ Comprehensive daily report sent successfully to all recipients');
    console.log('Email IDs:', results.map(r => r.data?.id || r.id).join(', '));

    return { success: true, message: 'Email sent successfully', emailIds: results };
  } catch (error) {
    console.error('❌ Error sending comprehensive daily report:', error);
    return { success: false, message: error.message };
  }
};

// Send low stock alert
export const sendLowStockAlert = async (product) => {
  try {
    if (!resend) {
      throw new Error('Email service not configured');
    }

    const settings = await Settings.findOne();
    
    if (!settings || !settings.enableEmailAlerts || settings.reportRecipients.length === 0) {
      return { success: false, message: 'Email alerts disabled' };
    }

    if (!process.env.BUSINESS_EMAIL) {
      throw new Error('BUSINESS_EMAIL not set');
    }

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert-box { background-color: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; }
          .product-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert-box">
            <h2 style="color: #dc2626;">⚠️ Low Stock Alert</h2>
            <p>The following product is running low on stock:</p>
            
            <div class="product-info">
              <div class="info-row">
                <strong>Product:</strong>
                <span>${product.name}</span>
              </div>
              <div class="info-row">
                <strong>Current Stock:</strong>
                <span style="color: #ef4444; font-weight: bold;">${product.quantity} ${product.baseUnit}</span>
              </div>
              <div class="info-row">
                <strong>Reorder Level:</strong>
                <span>${product.reorderLevel} ${product.baseUnit}</span>
              </div>
              <div class="info-row">
                <strong>Category:</strong>
                <span>${product.category}</span>
              </div>
            </div>

            <p style="margin-top: 20px;"><strong>⚡ Action Required:</strong> Please restock this item as soon as possible to avoid stockouts.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const results = await Promise.all(
      settings.reportRecipients.map(recipient =>
        resend.emails.send({
          from: process.env.BUSINESS_EMAIL,
          to: recipient,
          subject: `⚠️ Low Stock Alert - ${product.name}`,
          html: emailHTML
        })
      )
    );

    console.log('✅ Low stock alert sent successfully');
    return { success: true, message: 'Alert sent' };
  } catch (error) {
    console.error('❌ Error sending low stock alert:', error);
    return { success: false, message: error.message };
  }
};

// Legacy function - redirect to new comprehensive report
export const sendDailyReportWithBalance = sendComprehensiveDailyReport;
export const sendDailyReport = sendComprehensiveDailyReport;