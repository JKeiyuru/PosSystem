// client/src/utils/receivingInvoicePDF.js
// Generates a PDF for a single receiving invoice

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const fmt = (amount) => {
  if (amount == null || isNaN(amount)) return 'KSh 0.00';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount);
};

const fmtDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * generateReceivingInvoicePDF
 * @param {object} invoice  - The receiving invoice object from the API
 * @param {object} businessInfo - Business settings (businessName, businessAddress, etc.)
 * @returns jsPDF instance (caller calls .save())
 */
export const generateReceivingInvoicePDF = (invoice, businessInfo) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 15;

  // ── HEADER ────────────────────────────────────────────────────────
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageW, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessInfo?.businessName || 'Bekhal Animal Feeds', margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (businessInfo?.businessAddress) doc.text(businessInfo.businessAddress, margin, 21);
  const contact = [businessInfo?.businessPhone, businessInfo?.businessEmail]
    .filter(Boolean)
    .join('  |  ');
  if (contact) doc.text(contact, margin, 27);

  // Invoice label on the right
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIVING INVOICE', pageW - margin, 18, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber || '', pageW - margin, 26, { align: 'right' });

  y = 50;

  // ── INFO GRID ─────────────────────────────────────────────────────
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);

  const col1 = margin;
  const col2 = margin + contentW / 2;

  const info = [
    ['Supplier', invoice.supplier || '-'],
    ['Invoice Date', fmtDate(invoice.date)],
    ['Date Received', fmtDate(invoice.createdAt)],
    ['Received By', invoice.receivedByName || '-'],
    ['Payment Status', invoice.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'],
  ];

  info.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? col1 : col2;
    const rowY = y + Math.floor(i / 2) * 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, rowY);
    doc.setFont('helvetica', 'normal');
    // Color-code payment status
    if (label === 'Payment Status') {
      doc.setTextColor(invoice.paymentStatus === 'paid' ? 22 : 220, invoice.paymentStatus === 'paid' ? 163 : 38, invoice.paymentStatus === 'paid' ? 74 : 38);
    }
    doc.text(value, x + 32, rowY);
    doc.setTextColor(50, 50, 50);
  });

  y += Math.ceil(info.length / 2) * 7 + 6;

  // Divider
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  // ── ITEMS TABLE ───────────────────────────────────────────────────
  const tableHead = [['Product', 'Qty', 'Previous Price', 'Buying Price', 'Item Total', 'Price Change']];
  const tableBody = (invoice.items || []).map((item) => [
    item.productName || '-',
    item.quantity?.toString() ?? '0',
    fmt(item.previousBuyingPrice),
    fmt(item.buyingPrice),
    fmt(item.itemTotal),
    item.priceChanged ? '⚠ Changed' : 'No change',
  ]);

  doc.autoTable({
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 15, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        if (data.cell.raw === '⚠ Changed') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [100, 100, 100];
        }
      }
    },
  });

  y = doc.lastAutoTable.finalY + 6;

  // ── TOTALS SUMMARY ────────────────────────────────────────────────
  const summaryX = pageW - margin - 75;
  const summaryW = 75;

  const rows = [
    ['Calculated Total', fmt(invoice.calculatedTotal)],
    ['Actual Invoice Amount', fmt(invoice.actualInvoiceAmount)],
  ];
  const varianceColor = invoice.variance !== 0 ? [217, 119, 6] : [22, 163, 74];

  doc.setFontSize(9);
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(label, summaryX, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(value, pageW - margin, y, { align: 'right' });
    y += 6;
  });

  // Variance row with colour
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...varianceColor);
  doc.text('Variance', summaryX, y);
  doc.text(fmt(invoice.variance), pageW - margin, y, { align: 'right' });
  y += 3;

  // Variance reason
  if (invoice.varianceReason) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(130, 100, 0);
    doc.text(`Reason: ${invoice.varianceReason}`, margin, y + 5, { maxWidth: contentW });
    y += 10;
  }

  y += 8;

  // ── NOTES ─────────────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text('Notes:', margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(invoice.notes, margin + 18, y + 5, { maxWidth: contentW - 22 });
    y += 16;
  }

  // ── FOOTER ────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${businessInfo?.businessName || 'Bekhal Animal Feeds'} — Generated ${fmtDate(new Date())}`,
      margin,
      290
    );
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 290, { align: 'right' });
  }

  return doc;
};