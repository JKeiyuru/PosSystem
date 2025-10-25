// client/src/components/pos/ReceiptActions.jsx

import { Button } from '../ui/button';
import { Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReceiptActions({ receiptRef, sale, onClose }) {
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${sale?.saleNumber}`,
  });

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Get the receipt element
      const receiptElement = receiptRef.current;
      
      // Create canvas from the receipt
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculate dimensions for PDF (80mm width)
      const imgWidth = 80; // 80mm receipt width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, imgHeight + 10] // Width x Height with padding
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight);

      // Download PDF
      pdf.save(`Receipt-${sale?.saleNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
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
  );
}