// client/src/components/pos/ReceiptActions.jsx
// FIXED: PDF download now uses jsPDF directly (no html2canvas) to avoid
// blank-PDF issues caused by capturing hidden DOM elements.

import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Printer, Download, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { formatCurrency } from '../../lib/utils';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const methodLabel = (method) => {
  const m = {
    cash: 'Cash',
    mpesa_paybill: 'M-Pesa (Paybill)',
    mpesa_till: 'M-Pesa (Till)',
    gdc_paybill: 'GDC Paybill',
    mpesa_beth: 'M-Pesa (Beth)',
    mpesa_martin: 'M-Pesa (Martin)',
    credit: 'Credit',
  };
  return m[method] || method || '';
};

// ─── PDF builder (pure jsPDF, no html2canvas) ─────────────────────────────────

const buildReceiptPDF = (sale, businessInfo) => {
  const W = 80;          // receipt width in mm
  const margin = 4;
  const contentW = W - margin * 2;

  // estimate total height so we can set exact page size
  // (prevents blank space at bottom)
  const lineH = 5;
  const itemCount = sale?.items?.length || 0;
  const splitCount = sale?.splitPayments?.length || 1;
  const estimatedH = 90 + itemCount * 14 + splitCount * 6 + 30;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [W, Math.max(estimatedH, 120)],
  });

  let y = 5;

  const centerText = (text, yPos, size = 10, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.text(String(text), W / 2, yPos, { align: 'center' });
  };

  const leftRight = (left, right, yPos, size = 8) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    doc.text(String(left), margin, yPos);
    doc.text(String(right), W - margin, yPos, { align: 'right' });
  };

  const dashedLine = (yPos) => {
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, W - margin, yPos);
    doc.setLineDashPattern([], 0);
  };

  const solidLine = (yPos) => {
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(margin, yPos, W - margin, yPos);
  };

  // ── Header ──────────────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  centerText(businessInfo?.businessName || 'Bekhal Animal Feeds', y, 14, 'bold');
  y += 6;
  if (businessInfo?.businessAddress) {
    centerText(businessInfo.businessAddress, y, 8);
    y += 5;
  }
  if (businessInfo?.businessPhone) {
    centerText(businessInfo.businessPhone, y, 8);
    y += 5;
  }
  if (businessInfo?.businessEmail) {
    centerText(businessInfo.businessEmail, y, 7);
    y += 4;
  }

  solidLine(y); y += 4;

  // ── Receipt meta ────────────────────────────────────────────────────
  doc.setFontSize(8);
  leftRight('Receipt #:', sale?.saleNumber || '', y);     y += 5;
  leftRight('Date:', fmtDate(sale?.saleDate), y);          y += 5;
  leftRight('Cashier:', sale?.cashierName || '', y);       y += 5;
  if (sale?.customerName) {
    leftRight('Customer:', sale.customerName, y);          y += 5;
  }

  dashedLine(y); y += 4;

  // ── Items ───────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Item', margin, y);
  doc.text('Qty', margin + 36, y, { align: 'center' });
  doc.text('Price', W - margin - 18, y, { align: 'right' });
  doc.text('Total', W - margin, y, { align: 'right' });
  y += 2;
  solidLine(y); y += 4;

  doc.setFont('helvetica', 'normal');
  for (const item of sale?.items || []) {
    // product name (may wrap)
    const nameLines = doc.splitTextToSize(item.productName || '', contentW - 20);
    doc.text(nameLines, margin, y);
    const nameH = nameLines.length * lineH;

    doc.text(
      `${item.quantity} ${item.unit || ''}`,
      margin + 36, y, { align: 'center' }
    );
    doc.text(
      formatCurrency(item.unitPrice),
      W - margin - 18, y, { align: 'right' }
    );
    doc.text(
      formatCurrency(item.totalPrice),
      W - margin, y, { align: 'right' }
    );

    if (item.discount > 0) {
      y += lineH - 1;
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(7);
      doc.text(`  Discount: -${formatCurrency(item.discount)}`, margin, y);
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
    }
    y += nameH;
  }

  dashedLine(y); y += 4;

  // ── Totals ──────────────────────────────────────────────────────────
  doc.setFontSize(8);
  leftRight('Subtotal:', formatCurrency(sale?.subtotal), y);    y += 5;

  if ((sale?.discount || 0) > 0) {
    doc.setTextColor(22, 163, 74);
    leftRight('Total Discount:', `-${formatCurrency(sale.discount)}`, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  if ((sale?.transport || 0) > 0) {
    doc.setTextColor(37, 99, 235);
    leftRight('Transport:', `+${formatCurrency(sale.transport)}`, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  solidLine(y); y += 2;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  leftRight('TOTAL:', formatCurrency(sale?.total), y, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  y += 7;

  dashedLine(y); y += 4;

  // ── Payment breakdown ────────────────────────────────────────────────
  if (sale?.splitPayments && sale.splitPayments.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Breakdown:', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    for (const p of sale.splitPayments) {
      leftRight(`  ${methodLabel(p.method)}:`, formatCurrency(p.amount), y);
      y += 5;
    }
  } else {
    leftRight(
      'Payment Method:',
      methodLabel(sale?.paymentMethod).toUpperCase(),
      y
    );
    y += 5;
  }

  solidLine(y); y += 3;

  leftRight('Total Paid:', formatCurrency(sale?.amountPaid), y);
  y += 5;

  if ((sale?.amountPaid || 0) > (sale?.total || 0) && sale?.paymentMethod !== 'credit') {
    leftRight('Change:', formatCurrency((sale.amountPaid - sale.total)), y);
    y += 5;
  }

  if ((sale?.amountDue || 0) > 0) {
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    leftRight('Amount Due:', formatCurrency(sale.amountDue), y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  dashedLine(y); y += 5;

  // ── Footer ──────────────────────────────────────────────────────────
  centerText(
    businessInfo?.receiptFooter || 'Thank you for your business!',
    y, 8, 'italic'
  );
  y += 5;
  centerText('Visit us again!', y, 8);
  y += 5;
  centerText('Powered by Bekhal POS System', y, 7);

  return doc;
};

// ─── component ────────────────────────────────────────────────────────────────

export default function ReceiptActions({ receiptRef, sale, businessInfo, onClose }) {
  const [showReceiptView, setShowReceiptView] = useState(false);

  // react-to-print still uses the DOM ref for printing (works fine)
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${sale?.saleNumber}`,
  });

  const handleDownloadPDF = () => {
    if (!sale) {
      alert('No sale data available.');
      return;
    }
    try {
      const doc = buildReceiptPDF(sale, businessInfo);
      doc.save(`Receipt-${sale.saleNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF: ' + err.message);
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowReceiptView(true)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Receipt
        </Button>
        <Button className="flex-1" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* View Receipt Dialog */}
      <Dialog open={showReceiptView} onOpenChange={setShowReceiptView}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>

          <div className="border rounded-lg p-4 bg-white font-mono text-xs text-black">
            {/* Header */}
            <div className="text-center mb-3 border-b-2 border-black pb-3">
              <p className="text-base font-bold">
                {businessInfo?.businessName || 'Bekhal Animal Feeds'}
              </p>
              {businessInfo?.businessAddress && (
                <p className="text-[10px]">{businessInfo.businessAddress}</p>
              )}
              {businessInfo?.businessPhone && (
                <p className="text-[10px]">{businessInfo.businessPhone}</p>
              )}
            </div>

            {/* Meta */}
            <div className="mb-2 text-[10px]">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{sale?.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{fmtDate(sale?.saleDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale?.cashierName}</span>
              </div>
              {sale?.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border-t border-b border-black py-2 mb-2 text-[10px]">
              <div className="flex justify-between font-bold mb-1">
                <span className="flex-1">Item</span>
                <span className="w-8 text-center">Qty</span>
                <span className="w-16 text-right">Total</span>
              </div>
              {sale?.items?.map((item, idx) => (
                <div key={idx} className="mb-1">
                  <div className="flex justify-between">
                    <span className="flex-1 pr-1 truncate">{item.productName}</span>
                    <span className="w-8 text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="w-16 text-right">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                  {item.discount > 0 && (
                    <div className="text-green-600 pl-2">
                      Discount: -{formatCurrency(item.discount)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="text-[10px] mb-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale?.subtotal)}</span>
              </div>
              {(sale?.discount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              {(sale?.transport || 0) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Transport:</span>
                  <span>+{formatCurrency(sale.transport)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-bold text-sm border-t-2 border-black pt-1 mb-3">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale?.total)}</span>
            </div>

            {/* Payment */}
            <div className="text-[10px] border-t border-dashed border-gray-400 pt-2">
              {sale?.splitPayments && sale.splitPayments.length > 0 ? (
                <>
                  <p className="font-bold mb-1">Payment Breakdown:</p>
                  {sale.splitPayments.map((p, i) => (
                    <div key={i} className="flex justify-between pl-2">
                      <span>{methodLabel(p.method)}:</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="uppercase font-bold">
                    {methodLabel(sale?.paymentMethod)}
                  </span>
                </div>
              )}
              <div className="flex justify-between mt-1 border-t border-gray-300 pt-1">
                <span>Total Paid:</span>
                <span className="font-bold">{formatCurrency(sale?.amountPaid)}</span>
              </div>
              {(sale?.amountPaid || 0) > (sale?.total || 0) &&
                sale?.paymentMethod !== 'credit' && (
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>{formatCurrency(sale.amountPaid - sale.total)}</span>
                  </div>
                )}
              {(sale?.amountDue || 0) > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Amount Due:</span>
                  <span>{formatCurrency(sale.amountDue)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-3 border-t border-dashed border-gray-400 pt-2 text-[10px]">
              <p className="italic">
                {businessInfo?.receiptFooter || 'Thank you for your business!'}
              </p>
              <p>Visit us again!</p>
            </div>
          </div>

          <div className="flex space-x-2 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowReceiptView(false)}
            >
              Close
            </Button>
            <Button className="flex-1" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button className="flex-1" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}