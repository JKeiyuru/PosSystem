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

const GREEN = [21, 94, 57];       // emerald-800
const GREEN_LIGHT = [236, 253, 245];
const GOLD = [180, 83, 9];        // amber-700
const GOLD_LIGHT = [254, 249, 231];
const INK = [40, 45, 40];

export const generateCustomerStatementPDF = (statementData, businessInfo) => {
  const {
    customer,
    transactions = [],
    startDate,
    endDate,
    openingBalance = 0,
    closingBalance,
    finalBalance,
    totals = {},
    aging,
  } = statementData;

  const closing = closingBalance ?? finalBalance ?? 0;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 12;
  const contentW = pageW - margin * 2;
  let y = 15;

  // ─── COMPANY HEADER ───────────────────────────────────────────────
  doc.setFillColor(...GREEN);
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
  const contactLine = [businessInfo?.businessPhone, businessInfo?.businessEmail]
    .filter(Boolean)
    .join('  |  ');
  if (contactLine) doc.text(contactLine, margin, 26);

  y = 46;

  // ─── STATEMENT TITLE ──────────────────────────────────────────────
  doc.setTextColor(...GREEN);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER STATEMENT', pageW / 2, y, { align: 'center' });
  y += 6;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ─── CUSTOMER INFO ────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INK);

  const col1 = margin;
  const col2 = margin + contentW / 2;

  doc.text('NAME:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(customer?.name || '', col1 + 22, y);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(new Date()), col2 + 22, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('CONTACTS:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(customer?.phone || '', col1 + 22, y);

  if (startDate && endDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('PERIOD:', col2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, col2 + 22, y);
  }
  y += 8;

  // ─── TRANSACTION TABLE ────────────────────────────────────────────
  // Date, Particulars, Debit, Credit, Balance, Detail
  const colWidths = [20, 62, 25, 25, 26, 28];
  const colX = [];
  colWidths.reduce((acc, w, i) => {
    colX[i] = acc;
    return acc + w;
  }, margin);

  const drawHeader = () => {
    doc.setFillColor(...GREEN);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const headers = ['DATE', 'PARTICULARS', 'DEBIT', 'CREDIT', 'BALANCE', 'DETAIL'];
    const align = ['left', 'left', 'right', 'right', 'right', 'left'];
    headers.forEach((h, i) => {
      const x = align[i] === 'right' ? colX[i] + colWidths[i] - 2 : colX[i] + 2;
      doc.text(h, x, y + 5, { align: align[i] });
    });
    y += 9;
  };

  const pageBreak = () => {
    if (y > 255) {
      doc.addPage();
      y = 15;
      drawHeader();
    }
  };

  drawHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Opening balance row
  doc.setFillColor(...GOLD_LIGHT);
  doc.rect(margin, y - 1, contentW, 6.5, 'F');
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(startDate), colX[0] + 2, y + 4);
  doc.text('Balance brought forward', colX[1] + 2, y + 4);
  doc.text(formatCurrency(openingBalance), colX[4] + colWidths[4] - 2, y + 4, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  y += 6.5;

  let rowBg = false;
  for (const tx of transactions) {
    pageBreak();

    if (rowBg) {
      doc.setFillColor(...GREEN_LIGHT);
      doc.rect(margin, y - 1, contentW, 6.5, 'F');
    }
    rowBg = !rowBg;

    doc.setTextColor(...INK);
    doc.text(formatDate(tx.date), colX[0] + 2, y + 4);

    const particulars =
      tx.description ||
      (tx.type === 'sale'
        ? `SALE INVOICE: ${tx.reference}`
        : `PAYMENT: ${tx.reference}`);
    doc.text(particulars, colX[1] + 2, y + 4, { maxWidth: colWidths[1] - 4 });

    if (tx.debit) {
      doc.setTextColor(...GREEN);
      doc.text(formatCurrency(tx.debit), colX[2] + colWidths[2] - 2, y + 4, {
        align: 'right',
      });
    }
    if (tx.credit) {
      doc.setTextColor(...GOLD);
      doc.text(formatCurrency(tx.credit), colX[3] + colWidths[3] - 2, y + 4, {
        align: 'right',
      });
    }

    doc.setTextColor(...(tx.balance > 0 ? [185, 28, 28] : GREEN));
    doc.text(formatCurrency(tx.balance), colX[4] + colWidths[4] - 2, y + 4, {
      align: 'right',
    });

    doc.setTextColor(90, 95, 90);
    doc.text(tx.detail || '', colX[5] + 2, y + 4, { maxWidth: colWidths[5] - 4 });

    y += 6.5;

    if (tx.type === 'sale' && tx.items && tx.items.length > 0) {
      for (const item of tx.items) {
        pageBreak();
        doc.setFillColor(250, 252, 250);
        doc.rect(margin, y - 1, contentW, 5.5, 'F');
        doc.setTextColor(110, 118, 110);
        doc.setFontSize(7.5);
        const itemLine = `    ${item.productName}  ${item.quantity} x ${formatCurrency(item.unitPrice)}  =  ${formatCurrency(item.totalPrice)}`;
        doc.text(itemLine, colX[1] + 2, y + 3.5, {
          maxWidth: colWidths[1] + colWidths[2] + colWidths[3],
        });
        y += 5.5;
        doc.setFontSize(8);
      }
    }

    doc.setDrawColor(222, 235, 226);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 0.5, pageW - margin, y - 0.5);
  }

  // ─── PERIOD TOTALS ────────────────────────────────────────────────
  if (y > 250) { doc.addPage(); y = 15; }

  doc.setFillColor(209, 250, 229);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setTextColor(...GREEN);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PERIOD TOTALS', colX[0] + 2, y + 5);
  doc.text(formatCurrency(totals.debits || 0), colX[2] + colWidths[2] - 2, y + 5, {
    align: 'right',
  });
  doc.text(formatCurrency(totals.credits || 0), colX[3] + colWidths[3] - 2, y + 5, {
    align: 'right',
  });
  doc.text(formatCurrency(closing), colX[4] + colWidths[4] - 2, y + 5, {
    align: 'right',
  });
  y += 11;

  // ─── CLOSING BALANCE ──────────────────────────────────────────────
  if (y > 255) { doc.addPage(); y = 15; }

  doc.setFillColor(...GREEN);
  doc.rect(margin, y, contentW, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLOSING BALANCE:', margin + 2, y + 5.5);
  doc.text(formatCurrency(closing), pageW - margin - 2, y + 5.5, {
    align: 'right',
  });
  y += 14;

  // ─── AGING SUMMARY ────────────────────────────────────────────────
  if (y > 250) { doc.addPage(); y = 15; }

  doc.setTextColor(...INK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('AGING ANALYSIS', margin, y);
  y += 4;

  const agingCols = ['ABOVE 90 DAYS', '60-90 DAYS', '30-60 DAYS', '0-30 DAYS'];
  const agingW = contentW / 4;

  doc.setFillColor(209, 250, 229);
  doc.rect(margin, y, contentW, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREEN);
  agingCols.forEach((col, i) => {
    doc.text(col, margin + agingW * i + agingW / 2, y + 4, { align: 'center' });
  });
  y += 6;

  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INK);

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

  doc.setDrawColor(200, 210, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(110, 115, 110);
  doc.text('NB: Complaints verified within 24 hours ONLY.', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Statement By: _______________________________', margin, y);
  doc.text('Signature: _______________________________', pageW / 2 + 5, y);

  return doc;
};
