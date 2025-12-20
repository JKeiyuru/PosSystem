// client/src/utils/reportDownload.js - Download utilities for reports

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Download daily sales report as PDF
export const downloadDailySalesReportPDF = (reportData) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Daily Sales Report', 14, 22);
  
  // Report period
  doc.setFontSize(10);
  doc.text(`Period: ${formatDate(reportData.period.start)} to ${formatDate(reportData.period.end)}`, 14, 32);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 38);
  
  // Summary section
  doc.setFontSize(12);
  doc.text('Summary', 14, 50);
  
  const summaryData = [
    ['Total Sales', reportData.summary.totalSales.toString()],
    ['Total Revenue', formatCurrency(reportData.summary.totalRevenue)],
    ['Total Cost', formatCurrency(reportData.summary.totalCost)],
    ['Gross Profit', formatCurrency(reportData.summary.grossProfit)],
    ['Profit Margin', reportData.summary.profitMargin]
  ];
  
  doc.autoTable({
    startY: 55,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  // Payment breakdown
  doc.setFontSize(12);
  const paymentY = doc.lastAutoTable.finalY + 10;
  doc.text('Payment Breakdown', 14, paymentY);
  
  const paymentData = [
    ['Cash', formatCurrency(reportData.paymentBreakdown.cash)],
    ['M-Pesa', formatCurrency(reportData.paymentBreakdown.mpesa)],
    ['Credit', formatCurrency(reportData.paymentBreakdown.credit)]
  ];
  
  doc.autoTable({
    startY: paymentY + 5,
    head: [['Payment Method', 'Amount']],
    body: paymentData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  // Sales list
  doc.setFontSize(12);
  const salesY = doc.lastAutoTable.finalY + 10;
  doc.text('Sales Transactions', 14, salesY);
  
  const salesData = reportData.sales.map(sale => [
    sale.saleNumber,
    sale.customerName || 'Walk-in',
    sale.paymentMethod.replace('_', ' '),
    formatCurrency(sale.total),
    sale.paymentStatus
  ]);
  
  doc.autoTable({
    startY: salesY + 5,
    head: [['Sale #', 'Customer', 'Payment', 'Amount', 'Status']],
    body: salesData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 }
  });
  
  doc.save(`Daily-Sales-Report-${formatDate(reportData.period.start)}.pdf`);
};

// Download sales as CSV
export const downloadSalesCSV = (sales) => {
  const headers = ['Sale Number', 'Date', 'Customer', 'Payment Method', 'Amount', 'Profit', 'Status'];
  
  const rows = sales.map(sale => [
    sale.saleNumber,
    formatDate(sale.saleDate),
    sale.customerName || 'Walk-in',
    sale.paymentMethod.replace('_', ' '),
    sale.total,
    sale.grossProfit || 0,
    sale.paymentStatus
  ]);
  
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Sales-Export-${formatDate(new Date())}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

// Download product performance as PDF
export const downloadProductPerformancePDF = (data) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Product Performance Report', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Period: ${formatDate(data.period.start)} to ${formatDate(data.period.end)}`, 14, 32);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 38);
  
  doc.setFontSize(12);
  doc.text('Top Products', 14, 50);
  
  const productData = data.topProducts.map(product => [
    product.productName,
    product.quantitySold.toString(),
    formatCurrency(product.revenue)
  ]);
  
  doc.autoTable({
    startY: 55,
    head: [['Product', 'Quantity Sold', 'Revenue']],
    body: productData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  doc.save(`Product-Performance-${formatDate(new Date())}.pdf`);
};

// Download cash flow as PDF
export const downloadCashFlowPDF = (data) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Cash Flow Report', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Period: ${formatDate(data.period.start)} to ${formatDate(data.period.end)}`, 14, 32);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 38);
  
  doc.setFontSize(12);
  doc.text('Cash Flow Summary', 14, 50);
  
  const cashFlowData = [
    ['Cash In', formatCurrency(data.cashIn)],
    ['M-Pesa In', formatCurrency(data.mpesaIn)],
    ['Total Inflow', formatCurrency(data.totalInflow)],
    ['Cash Out', formatCurrency(data.cashOut)],
    ['Net Cash Flow', formatCurrency(data.netCashFlow)]
  ];
  
  doc.autoTable({
    startY: 55,
    head: [['Item', 'Amount']],
    body: cashFlowData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  doc.save(`Cash-Flow-Report-${formatDate(new Date())}.pdf`);
};

// Download balance sheet as PDF
export const downloadBalanceSheetPDF = (data) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Balance Sheet', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 32);
  
  // Assets
  doc.setFontSize(12);
  doc.text('Assets', 14, 44);
  
  const assetsData = [
    ['Cash in Hand', formatCurrency(data.assets.currentAssets.cashInHand)],
    ['Accounts Receivable', formatCurrency(data.assets.currentAssets.accountsReceivable)],
    ['Inventory', formatCurrency(data.assets.currentAssets.inventory)],
    ['Total Assets', formatCurrency(data.assets.totalAssets)]
  ];
  
  doc.autoTable({
    startY: 49,
    head: [['Item', 'Amount']],
    body: assetsData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  // Liabilities & Equity
  doc.setFontSize(12);
  const liabilitiesY = doc.lastAutoTable.finalY + 10;
  doc.text('Liabilities & Equity', 14, liabilitiesY);
  
  const liabilitiesData = [
    ['Accounts Payable', formatCurrency(data.liabilities.currentLiabilities.accountsPayable)],
    ['Total Liabilities', formatCurrency(data.liabilities.totalLiabilities)],
    ['Owner\'s Equity', formatCurrency(data.equity.ownersEquity)],
    ['Total Liabilities & Equity', formatCurrency(data.totalLiabilitiesAndEquity)]
  ];
  
  doc.autoTable({
    startY: liabilitiesY + 5,
    head: [['Item', 'Amount']],
    body: liabilitiesData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  doc.save(`Balance-Sheet-${formatDate(new Date())}.pdf`);
};