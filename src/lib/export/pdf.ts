import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateListPdf(title: string, columns: string[], rows: string[][]): Buffer {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 21);
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 26,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 76, 58] },
  });
  return Buffer.from(doc.output('arraybuffer'));
}

export function generateOpinionPdf(opts: {
  requestNumber: string;
  subject: string;
  requestingDepartment: string;
  category: string;
  content: string; // HTML
  signedBy?: string | null;
  signedAt?: Date | string | null;
  referenceNumber?: string | null;
}): Buffer {
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(16);
  doc.text('Legal Opinion', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Reference: ${opts.referenceNumber ?? '-'}`, 14, y);
  y += 6;
  doc.text(`Request No: ${opts.requestNumber}`, 14, y);
  y += 6;
  doc.text(`Subject: ${opts.subject}`, 14, y);
  y += 6;
  doc.text(`Department: ${opts.requestingDepartment}`, 14, y);
  y += 6;
  doc.text(`Category: ${opts.category}`, 14, y);
  y += 10;

  const plainText = opts.content
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const lines = doc.splitTextToSize(plainText, 180);
  doc.setFontSize(11);
  doc.text(lines, 14, y);
  y += lines.length * 5 + 10;

  if (opts.signedBy) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.text(
      `Digitally signed by ${opts.signedBy} on ${opts.signedAt ? new Date(opts.signedAt).toLocaleString() : ''}`,
      14,
      y,
    );
  }

  return Buffer.from(doc.output('arraybuffer'));
}
