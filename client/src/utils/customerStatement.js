// client/src/utils/customerStatement.js

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return 'KSh 0.00';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const generateCustomerStatementPDF = (statementData, businessInfo) => {
  const {
    customer,
    transactions, // [{type:'sale'|'payment', date, reference, amount, balance, detail, items}]
    startDate,
    endDate,
    finalBalance,
    aging,
  } = statementData;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 15;

  // ─── COMPANY HEADER ───────────────────────────────────────────────
  doc.setFillColor(30, 58, 138); // dark blue
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessInfo?.businessName || 'Bekhal Animal Feeds', margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (businessInfo?.businessAddress) {
    doc.text(businessInfo.businessAddress, margin, 20);
  }
  const contactLine = [
    businessInfo?.businessPhone,
    businessInfo?.businessEmail,
  ]
    .filter(Boolean)
    .join('  |  ');
  if (contactLine) doc.text(contactLine, margin, 26);

  y = 46;

  // ─── STATEMENT TITLE ──────────────────────────────────────────────
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER STATEMENT', pageW / 2, y, { align: 'center' });
  y += 6;

  // thin divider
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ─── CUSTOMER INFO ────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);

  const col1 = margin;
  const col2 = margin + contentW / 2;

  doc.text('NAME:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(customer.name || '', col1 + 22, y);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(new Date()), col2 + 18, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('CONTACTS:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(customer.phone || '', col1 + 22, y);

  if (startDate && endDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('PERIOD:', col2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, col2 + 18, y);
  }
  y += 8;

  // ─── TRANSACTION TABLE ────────────────────────────────────────────
  const colWidths = [22, 60, 26, 26, 36]; // Date, Particulars, Amount, Balance, Detail
  const colX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
    margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
  ];

  // Header row
  doc.setFillColor(30, 58, 138);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  const headers = ['DATE', 'PARTICULARS', 'AMOUNT', 'BALANCE', 'DETAIL'];
  const headerAlign = ['left', 'left', 'right', 'right', 'left'];
  headers.forEach((h, i) => {
    const x =
      headerAlign[i] === 'right'
        ? colX[i] + colWidths[i] - 2
        : colX[i] + 2;
    doc.text(h, x, y + 5, { align: headerAlign[i] === 'right' ? 'right' : 'left' });
  });
  y += 9;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  let rowBg = false;
  for (const tx of transactions || []) {
    // Check page break
    if (y > 255) {
      doc.addPage();
      y = 15;
    }

    if (rowBg) {
      doc.setFillColor(245, 247, 255);
      doc.rect(margin, y - 1, contentW, 6.5, 'F');
    }
    rowBg = !rowBg;

    doc.setTextColor(50, 50, 50);

    // Date
    doc.text(formatDate(tx.date), colX[0] + 2, y + 4);

    // Particulars
    const particulars =
      tx.type === 'sale'
        ? `SALE INVOICE: ${tx.reference}`
        : `PAYMENT RECEIPT: ${tx.reference}`;
    doc.text(particulars, colX[1] + 2, y + 4, { maxWidth: colWidths[1] - 4 });

    // Amount (sales positive, payments negative)
    const amtColor = tx.type === 'payment' ? [220, 38, 38] : [30, 58, 138];
    doc.setTextColor(...amtColor);
    const amtStr =
      tx.type === 'payment'
        ? `-${formatCurrency(tx.amount)}`
        : formatCurrency(tx.amount);
    doc.text(amtStr, colX[2] + colWidths[2] - 2, y + 4, { align: 'right' });

    // Balance
    const balColor = tx.balance > 0 ? [220, 38, 38] : [22, 163, 74];
    doc.setTextColor(...balColor);
    doc.text(formatCurrency(tx.balance), colX[3] + colWidths[3] - 2, y + 4, {
      align: 'right',
    });

    // Detail
    doc.setTextColor(80, 80, 80);
    doc.text(tx.detail || '', colX[4] + 2, y + 4, { maxWidth: colWidths[4] - 4 });

    y += 6.5;

    // Product lines under sale invoices
    if (tx.type === 'sale' && tx.items && tx.items.length > 0) {
      for (const item of tx.items) {
        if (y > 255) {
          doc.addPage();
          y = 15;
        }
        doc.setFillColor(250, 251, 255);
        doc.rect(margin, y - 1, contentW, 5.5, 'F');
        doc.setTextColor(100, 100, 130);
        doc.setFontSize(7.5);
        // e.g. "  Dairy Meal Highyield 70kg  5 x 2900  14500"
        const itemLine = `    ${item.productName}  ${item.quantity} x ${formatCurrency(item.unitPrice)}  ${formatCurrency(item.totalPrice)}`;
        doc.text(itemLine, colX[1] + 2, y + 3.5, { maxWidth: colWidths[1] + colWidths[2] + colWidths[3] });
        y += 5.5;
        doc.setFontSize(8);
      }
    }

    // separator line
    doc.setDrawColor(220, 220, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 0.5, pageW - margin, y - 0.5);
  }

  y += 4;

  // ─── FINAL BALANCE ────────────────────────────────────────────────
  if (y > 255) { doc.addPage(); y = 15; }

  doc.setFillColor(30, 58, 138);
  doc.rect(margin, y, contentW, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BALANCE:', colX[2] + 2, y + 5.5);
  doc.text(formatCurrency(finalBalance || 0), colX[3] + colWidths[3] - 2, y + 5.5, {
    align: 'right',
  });
  y += 14;

  // ─── AGING SUMMARY ────────────────────────────────────────────────
  if (y > 255) { doc.addPage(); y = 15; }

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('AGING ANALYSIS', margin, y);
  y += 4;

  const agingCols = ['ABOVE 90 DAYS', '60-90 DAYS', '30-60 DAYS', '0-30 DAYS'];
  const agingW = contentW / 4;

  doc.setFillColor(240, 242, 255);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setDrawColor(200, 210, 240);
  doc.setLineWidth(0.3);

  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  agingCols.forEach((col, i) => {
    doc.text(col, margin + agingW * i + agingW / 2, y + 4, { align: 'center' });
  });
  y += 6;

  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);

  const agingValues = [
    aging?.above90 || 0,
    aging?.days60to90 || 0,
    aging?.days30to60 || 0,
    aging?.days0to30 || 0,
  ];
  agingValues.forEach((val, i) => {
    doc.text(formatCurrency(val), margin + agingW * i + agingW / 2, y + 5, {
      align: 'center',
    });
  });
  y += 11;

  // ─── FOOTER ───────────────────────────────────────────────────────
  if (y > 260) { doc.addPage(); y = 15; }

  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('NB: Complaints verified within 24 hours ONLY.', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Statement By: _______________________________', margin, y);
  doc.text(
    'Signature: _______________________________',
    pageW / 2 + 5,
    y
  );

  return doc;
};