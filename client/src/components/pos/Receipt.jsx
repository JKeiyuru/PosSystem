// client/src/components/pos/Receipt.jsx

import { forwardRef } from 'react';
import { formatCurrency, formatDateTime } from '../../lib/utils';

const Receipt = forwardRef(({ sale, businessInfo }, ref) => {
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
    <div ref={ref} className="receipt-container" style={{ 
      width: '80mm', 
      padding: '10mm',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: 'white'
    }}>
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
          }
          .receipt-container {
            width: 80mm;
            padding: 5mm;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          margin: '0 0 5px 0',
          fontFamily: 'Georgia, serif',
          letterSpacing: '1px'
        }}>
          {businessInfo?.businessName || 'Bekhal Animal Feeds'}
        </h1>
        <p style={{ margin: '2px 0', fontSize: '11px' }}>{businessInfo?.businessAddress || 'Nairobi, Kenya'}</p>
        <p style={{ margin: '2px 0', fontSize: '11px' }}>{businessInfo?.businessPhone || 'Tel: +254 700 000 000'}</p>
        <p style={{ margin: '2px 0', fontSize: '11px' }}>{businessInfo?.businessEmail || 'info@bekhal.co.ke'}</p>
      </div>

      {/* Receipt Info */}
      <div style={{ marginBottom: '10px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span>Receipt #:</span>
          <span style={{ fontWeight: 'bold' }}>{sale.saleNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span>Date:</span>
          <span>{formatDateTime(sale.saleDate)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span>Cashier:</span>
          <span>{sale.cashierName}</span>
        </div>
        {sale.customerName && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
            <span>Customer:</span>
            <span>{sale.customerName}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '10px 0', marginBottom: '10px' }}>
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '5px 0', color: '#000' }}>Item</th>
              <th style={{ textAlign: 'center', padding: '5px 0', color: '#000' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '5px 0', color: '#000' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '5px 0', color: '#000' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: '5px 0', wordBreak: 'break-word', color: '#000' }}>
                  {item.productName}
                </td>
                <td style={{ textAlign: 'center', padding: '5px 0', color: '#000' }}>
                  {item.quantity} {item.unit}
                </td>
                <td style={{ textAlign: 'right', padding: '5px 0', color: '#000' }}>
                  {formatCurrency(item.unitPrice)}/{item.unit}
                </td>
                <td style={{ textAlign: 'right', padding: '5px 0', fontWeight: 'bold', color: '#000' }}>
                  {formatCurrency(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ marginBottom: '10px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', color: '#16a34a' }}>
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        {sale.transport > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', color: '#2563eb' }}>
            <span>Transport:</span>
            <span>+{formatCurrency(sale.transport)}</span>
          </div>
        )}
        {sale.tax > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
            <span>Tax:</span>
            <span>{formatCurrency(sale.tax)}</span>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          margin: '8px 0', 
          padding: '8px 0',
          borderTop: '2px solid #000',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ marginBottom: '10px', fontSize: '11px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
          <span>Payment Method:</span>
          <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
            {getPaymentMethodDisplay(sale.paymentMethod)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
          <span>Amount Paid:</span>
          <span>{formatCurrency(sale.amountPaid)}</span>
        </div>
        {sale.paymentMethod !== 'credit' && sale.amountPaid >= sale.total && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
            <span>Change:</span>
            <span>{formatCurrency(sale.amountPaid - sale.total)}</span>
          </div>
        )}
        {sale.amountDue > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            margin: '5px 0',
            color: '#ef4444',
            fontWeight: 'bold'
          }}>
            <span>Amount Due:</span>
            <span>{formatCurrency(sale.amountDue)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '15px', 
        paddingTop: '10px',
        borderTop: '1px dashed #000',
        fontSize: '10px'
      }}>
        <p style={{ margin: '5px 0', fontStyle: 'italic' }}>
          {businessInfo?.receiptFooter || 'Thank you for your business!'}
        </p>
        <p style={{ margin: '5px 0' }}>Visit us again!</p>
        <p style={{ margin: '10px 0 0 0', fontSize: '9px' }}>
          Powered by Bekhal POS System
        </p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;