// =============================================================================
// CivicConnect TN — Professional Government PDF Report Exporter
// =============================================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportResult, ReportDataPayload } from '../types';

export function exportReportToPdf(payload: ReportDataPayload): ExportResult {
  // Use Landscape for wide multi-column reports, Portrait for narrow ones
  const isLandscape = payload.columns.length > 6;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ---------------------------------------------------------------------------
  // 1. OFFICIAL TAMIL NADU GOVERNMENT HEADER BANNER
  // ---------------------------------------------------------------------------
  // Emerald Top Stripe
  doc.setFillColor(15, 81, 50); // #0F5132 - TN Official Green
  doc.rect(0, 0, pageWidth, 18, 'F');

  // Gold Accent Stripe
  doc.setFillColor(217, 119, 6); // #D97706 - TN Gold Accent
  doc.rect(0, 18, pageWidth, 2, 'F');

  // Header Title in White
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GOVERNMENT OF TAMIL NADU', 14, 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('MUNICIPAL ADMINISTRATION & WATER SUPPLY DEPARTMENT • CIVICCONNECT TN', 14, 14);

  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL ADMINISTRATIVE REPORT', pageWidth - 14, 11, { align: 'right' });

  // ---------------------------------------------------------------------------
  // 2. REPORT TITLE & METADATA SECTION
  // ---------------------------------------------------------------------------
  let cursorY = 28;

  doc.setTextColor(27, 67, 50); // Dark Green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(payload.metadata.title, 14, cursorY);
  cursorY += 6;

  doc.setTextColor(100, 116, 139); // Slate Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(payload.metadata.subtitle, 14, cursorY);
  cursorY += 7;

  // Metadata Box (Light gray background)
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cursorY, pageWidth - 28, 14, 1.5, 1.5, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);

  const colW = (pageWidth - 28) / 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Generated At:', 18, cursorY + 5);
  doc.text('Department:', 18 + colW, cursorY + 5);
  doc.text('District / Scope:', 18 + colW * 2, cursorY + 5);
  doc.text('Date Range:', 18 + colW * 3, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.text(payload.metadata.generatedAt.slice(0, 16).replace('T', ' '), 18, cursorY + 10);
  doc.text(payload.metadata.departmentScope.slice(0, 24), 18 + colW, cursorY + 10);
  doc.text(payload.metadata.districtScope, 18 + colW * 2, cursorY + 10);
  doc.text(payload.metadata.dateScope, 18 + colW * 3, cursorY + 10);

  cursorY += 19;

  // ---------------------------------------------------------------------------
  // 3. EXECUTIVE KPI CARDS (Summary Statistics)
  // ---------------------------------------------------------------------------
  const kpiCount = Math.min(payload.kpis.length, 5);
  if (kpiCount > 0) {
    const cardGap = 3;
    const totalGap = (kpiCount - 1) * cardGap;
    const cardWidth = (pageWidth - 28 - totalGap) / kpiCount;
    const cardHeight = 16;

    payload.kpis.slice(0, kpiCount).forEach((kpi, idx) => {
      const cardX = 14 + idx * (cardWidth + cardGap);

      // Card background
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(cardX, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Left Accent Color Bar
      let accentR = 15,
        accentG = 81,
        accentB = 50; // Default green
      if (kpi.tone === 'danger') {
        accentR = 220;
        accentG = 53;
        accentB = 69;
      } else if (kpi.tone === 'warning') {
        accentR = 217;
        accentG = 119;
        accentB = 6;
      } else if (kpi.tone === 'info') {
        accentR = 13;
        accentG = 110;
        accentB = 253;
      }

      doc.setFillColor(accentR, accentG, accentB);
      doc.rect(cardX, cursorY, 2, cardHeight, 'F');

      // Card Label
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(kpi.label.toUpperCase().slice(0, 24), cardX + 5, cursorY + 4.5);

      // Card Value
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(String(kpi.value), cardX + 5, cursorY + 10.5);

      // Card Subtext / Unit
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`${kpi.unit || ''} ${kpi.subtext ? `(${kpi.subtext})` : ''}`.slice(0, 28), cardX + 5, cursorY + 14);
    });

    cursorY += cardHeight + 6;
  }

  // ---------------------------------------------------------------------------
  // 4. STRUCTURED DATA TABLE (AutoTable)
  // ---------------------------------------------------------------------------
  const tableHeaders = payload.columns.map((c) => c.label);
  const tableRows = payload.rows.map((r) => payload.columns.map((c) => r[c.key] ?? '—'));

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: cursorY,
    margin: { left: 14, right: 14, top: 22, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 81, 50], // Emerald Header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Top banner on subsequent pages
      if (data.pageNumber > 1) {
        doc.setFillColor(15, 81, 50);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`CIVICCONNECT TN — ${payload.metadata.title.toUpperCase()} (Contd.)`, 14, 8);
      }

      // Footer on all pages
      doc.setFillColor(241, 245, 249);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(
        `CivicConnect TN • Official Document • Generated: ${payload.metadata.generatedAt.slice(0, 10)} • Confidential Administrative Record`,
        14,
        pageHeight - 5
      );

      doc.setFont('helvetica', 'bold');
      doc.text(`Page ${data.pageNumber}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
    },
  });

  const arrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${payload.metadata.reportType}_${new Date().toISOString().slice(0, 10)}.pdf`;

  return {
    buffer,
    mimeType: 'application/pdf',
    filename,
    format: 'pdf',
    sizeBytes: buffer.length,
  };
}
