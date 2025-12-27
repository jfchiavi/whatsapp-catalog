import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { Sale } from '../types/sales';


export const generateSalePDF = async (sale: Sale): Promise<Blob> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 760;

    page.drawText('Comprobante de Venta', { x: 50, y, size: 18, font });
    y -= 40;

    page.drawText(`Venta ID: ${sale.id}`, { x: 50, y, size: 10, font });
    y -= 20;

    sale.items.forEach(item => {
        page.drawText(`${item.name} x${item.quantity} - $${item.price}`, {
            x: 50,
            y,
            size: 10,
            font,
        });
        y -= 16;
    });

    y -= 20;
    page.drawText(`Total: $${sale.total}`, { x: 50, y, size: 12, font });

    const bytes = await pdfDoc.save();
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
};