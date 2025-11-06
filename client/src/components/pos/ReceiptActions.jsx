// client/src/components/pos/ReceiptActions.jsx

import { useState } from 'react';
import { Button } from '../ui/button';
import { Printer, Download, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { formatCurrency } from '../../lib/utils';

export default function ReceiptActions({ receiptRef, sale, businessInfo, onClose }) {
  const [showReceiptView, setShowReceiptView] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${sale?.saleNumber}`,
  });

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      setShowReceiptView(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const receiptElement = receiptRef.current;
      
      const canvas = await html2canvas(receiptElement, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 302,
        windowHeight: receiptElement.scrollHeight
      });

      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, imgHeight + 10]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight);
      pdf.save(`Receipt-${sale?.saleNumber}.pdf`);
      
      setShowReceiptView(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
      setShowReceiptView(false);
    }
  };

  const handleViewReceipt = () => {
    setShowReceiptView(true);
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      'cash': 'Cash',
      'mpesa_paybill': 'M-Pesa (Paybill)',
      'mpesa_beth': 'M-Pesa (Beth)',
      'mpesa_martin': 'M-Pesa (Martin)',
      'credit': 'Credit'
    };
    return methods[method] || method;
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onClose}
        >
          Close
        </Button>
        <Button 
          variant="outline"
          className="flex-1"
          onClick={handleViewReceipt}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Receipt
        </Button>
        <Button 
          className="flex-1"
          onClick={handlePrint}
        >
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
          
          <div className="border rounded-lg p-4 bg-white">
            <div style={{ 
              width: '100%', 
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#000'
            }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                  {businessInfo?.businessName || 'Bekhal Animal Feeds'}
                </h1>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>{businessInfo?.businessAddress || 'Nairobi, Kenya'}</p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>{businessInfo?.businessPhone || 'Tel: +254 700 000 000'}</p>
              </div>

              {/* Receipt Info */}
              <div style={{ fontSize: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Receipt #:</span>
                  <span style={{ fontWeight: 'bold' }}>{sale?.saleNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Cashier:</span>
                  <span>{sale?.cashierName}</span>
                </div>
                {sale?.customerName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>Customer:</span>
                    <span>{sale.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', fontSize: '10px', marginBottom: '10px', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '5px 0' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale?.items.map((item, index) => (
                    <tr key={index}>
                      <td style={{ paddingTop: '3px' }}>{item.productName}</td>
                      <td style={{ textAlign: 'center', paddingTop: '3px' }}>{item.quantity} {item.unit}</td>
                      <td style={{ textAlign: 'right', paddingTop: '3px' }}>{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ fontSize: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sale?.subtotal)}</span>
                </div>
                {sale?.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#16a34a' }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(sale.discount)}</span>
                  </div>
                )}
                {sale?.transport > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#2563eb' }}>
                    <span>Transport:</span>
                    <span>+{formatCurrency(sale.transport)}</span>
                  </div>
                )}
              </div>

              {/* Final Total */}
              <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: '5px', marginTop: '5px' }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(sale?.total)}</span>
              </div>

              {/* Payment Info */}
              <div style={{ fontSize: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Payment:</span>
                  <span style={{ fontWeight: 'bold' }}>{getPaymentMethodDisplay(sale?.paymentMethod)}</span>
                </div>
                {sale?.amountDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#ef4444', fontWeight: 'bold' }}>
                    <span>Amount Due:</span>
                    <span>{formatCurrency(sale.amountDue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => setShowReceiptView(false)}
            >
              Close
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button 
              className="flex-1"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}