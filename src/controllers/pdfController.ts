import { Response } from 'express';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { format } from 'date-fns';

// Extend jsPDF type to include lastAutoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export const generatePdf = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        items: true,
        organization: true
      }
    });

    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.organizationId !== organizationId) return res.status(403).json({ error: 'Forbidden' });

    const doc = new jsPDF() as jsPDFWithAutoTable;

    // Header
    doc.setFontSize(20);
    doc.text(form.organization.name, 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(), 'MMM d, yyyy')}`, 14, 30);
    doc.text(`Client: ${form.clientName}`, 14, 35);
    if (form.email) {
        doc.text(`Email: ${form.email}`, 14, 40);
    }
    doc.text(`Status: ${form.status}`, 14, 45);

    // Items Table
    const tableData = form.items.map(item => [
      item.insuranceType,
      item.package,
      item.requestType,
      item.price ? `€${item.price}` : 'Pending'
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Insurance Type', 'Package', 'Request Type', 'Price']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
    });

    // Total Price
    const totalPrice = form.items.reduce((sum, item) => {
        return sum + (item.price ? parseFloat(item.price) : 0);
    }, 0);

    const finalY = doc.lastAutoTable?.finalY || 100;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Monthly Premium: €${totalPrice.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Total Annual Premium: €${(totalPrice * 12).toFixed(2)}`, 14, finalY + 16);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This document is a summary of the requested insurance policies.', 14, 280);

    // Output
    const pdfBuffer = doc.output('arraybuffer');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=summary-${form.clientName.replace(/\s+/g, '-')}.pdf`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
