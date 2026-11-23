import { MoodBoard, MoodBoardCategory, MoodBoardItem } from "./types";
import { formatCurrency } from "./helpers";

export interface PdfExportResult {
  filename: string;
  pdfBytes: Uint8Array;
  pdfString: string;
  pageCount: number;
  size: number;
}

/**
 * Sanitizes mood board title to generate a clean, safe filename.
 * Example: "Modern Minimalist Living" -> "Modern-Minimalist-Living-Moodboard.pdf"
 */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const base = cleaned || "Moodboard";
  return `${base}-Moodboard.pdf`;
}

/**
 * Escapes characters for PDF literal strings (parens and backslashes).
 * Strips non-ASCII to prevent PDF encoding issues in Type 1 fonts.
 */
function escapePdfString(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

/**
 * Clean, lightweight, self-contained PDF 1.4 Generator for BOQ SaaS Mood Boards.
 * Generates standards-compliant, multi-page vector PDFs with zero external dependencies.
 */
class MoodBoardPdfDocument {
  private objects: string[] = [];
  private pageStreams: string[][] = [];
  private currentPageIndex: number = -1;
  private currentY: number = 800;
  private readonly pageWidth: number = 595.28; // Standard A4 width in points
  private readonly pageHeight: number = 841.89; // Standard A4 height in points
  private readonly margin: number = 40;
  private readonly contentWidth: number = 595.28 - 80; // 515.28 pt

  constructor() {
    this.addPage();
  }

  public addPage() {
    this.currentPageIndex++;
    this.pageStreams.push([]);
    this.currentY = 800;
  }

  public getCurrentY(): number {
    return this.currentY;
  }

  public checkPageBreak(requiredHeight: number) {
    if (this.currentY - requiredHeight < 60) {
      this.addPage();
      this.drawRunningHeader();
    }
  }

  private appendOp(op: string) {
    if (this.currentPageIndex >= 0 && this.pageStreams[this.currentPageIndex]) {
      this.pageStreams[this.currentPageIndex].push(op);
    }
  }

  public drawRunningHeader() {
    const stream: string[] = [];
    // Running header text
    stream.push("BT");
    stream.push("/F1 8 Tf");
    stream.push("0.39 0.45 0.55 rg"); // #64748B
    stream.push(`40 ${this.pageHeight - 28} Td`);
    stream.push("(BOQ SAAS USER DASHBOARD  |  MOOD BOARD SPECIFICATION) Tj");
    stream.push("ET");

    // Divider line
    stream.push("q");
    stream.push("0.89 0.91 0.94 RG"); // #E2E8F0
    stream.push("0.75 w");
    stream.push(`40 ${this.pageHeight - 34} m ${this.pageWidth - 40} ${this.pageHeight - 34} l S`);
    stream.push("Q");

    this.appendOp(stream.join("\n"));
    this.currentY = this.pageHeight - 55;
  }

  public drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    fillRgb?: [number, number, number],
    strokeRgb?: [number, number, number],
    lineWidth: number = 1
  ) {
    const ops: string[] = ["q"];
    if (fillRgb) {
      ops.push(`${fillRgb[0].toFixed(3)} ${fillRgb[1].toFixed(3)} ${fillRgb[2].toFixed(3)} rg`);
    }
    if (strokeRgb) {
      ops.push(`${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG`);
      ops.push(`${lineWidth} w`);
    }

    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);

    if (fillRgb && strokeRgb) {
      ops.push("B");
    } else if (fillRgb) {
      ops.push("f");
    } else if (strokeRgb) {
      ops.push("S");
    }
    ops.push("Q");

    this.appendOp(ops.join("\n"));
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    font: "F1" | "F2" = "F2",
    size: number = 10,
    rgb: [number, number, number] = [0.059, 0.09, 0.165] // #0F172A
  ) {
    const safe = escapePdfString(text);
    const op = `BT /${font} ${size} Tf ${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${safe}) Tj ET`;
    this.appendOp(op);
  }

  public advanceY(amount: number) {
    this.currentY -= amount;
  }

  public setY(y: number) {
    this.currentY = y;
  }

  public getPageCount(): number {
    return this.pageStreams.length;
  }

  /**
   * Builds the finalized PDF 1.4 byte payload.
   */
  public buildPdf(): { bytes: Uint8Array; str: string } {
    const totalPages = this.pageStreams.length;

    // Stamp footers on each page
    for (let p = 0; p < totalPages; p++) {
      const footerOps: string[] = [
        "q",
        "0.89 0.91 0.94 RG 0.75 w",
        `40 38 m ${this.pageWidth - 40} 38 l S`,
        "Q",
        "BT",
        "/F2 8 Tf 0.39 0.45 0.55 rg",
        `40 24 Td (Generated via BOQ SaaS Dashboard  |  Confidential) Tj`,
        "ET",
        "BT",
        "/F1 8 Tf 0.39 0.45 0.55 rg",
        `${this.pageWidth - 95} 24 Td`,
        `(${escapePdfString(`Page ${p + 1} of ${totalPages}`)}) Tj`,
        "ET",
      ];
      this.pageStreams[p].push(footerOps.join("\n"));
    }

    const objects: string[] = [];
    const offsets: number[] = [];

    let body = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";

    // 1: Catalog
    const catalogObj = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    objects.push(catalogObj);

    // 2: Pages container (kids populated later)
    // 3, 4: Standard fonts (F1=Helvetica-Bold, F2=Helvetica)
    const font1Obj = "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
    const font2Obj = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

    // We will allocate object IDs:
    // 1: Catalog
    // 2: Pages
    // 3: Font F1
    // 4: Font F2
    // For each page:
    // Page Obj ID = 5 + pageIdx * 2
    // Content Stream Obj ID = 6 + pageIdx * 2

    const kids: string[] = [];
    const pageObjects: string[] = [];
    const contentObjects: string[] = [];

    for (let i = 0; i < totalPages; i++) {
      const pageObjId = 5 + i * 2;
      const contentObjId = 6 + i * 2;
      kids.push(`${pageObjId} 0 R`);

      const pageObj = `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth.toFixed(2)} ${this.pageHeight.toFixed(2)}] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>\nendobj\n`;
      pageObjects.push(pageObj);

      const streamContent = this.pageStreams[i].join("\n");
      const streamLen = Buffer.byteLength ? Buffer.byteLength(streamContent, "utf8") : new TextEncoder().encode(streamContent).length;
      const contentObj = `${contentObjId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
      contentObjects.push(contentObj);
    }

    const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${totalPages} >>\nendobj\n`;

    const allObjects = [
      catalogObj,
      pagesObj,
      font1Obj,
      font2Obj,
      ...pageObjects.flatMap((p, idx) => [p, contentObjects[idx]]),
    ];

    let currentOffset = body.length;
    for (const obj of allObjects) {
      offsets.push(currentOffset);
      body += obj;
      currentOffset += obj.length;
    }

    const xrefOffset = body.length;
    let xref = `xref\n0 ${allObjects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      const padded = off.toString().padStart(10, "0");
      xref += `${padded} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    body += xref + trailer;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(body);
    return { bytes, str: body };
  }
}

/**
 * Builds a comprehensive, professional Mood Board PDF document.
 */
export function exportMoodBoardToPdf(moodBoard: MoodBoard): PdfExportResult {
  const doc = new MoodBoardPdfDocument();
  const filename = sanitizeFilename(moodBoard.name || "Moodboard");

  // Colors
  const COLOR_BLUE: [number, number, number] = [0.145, 0.388, 0.922]; // #2563EB
  const COLOR_DARK: [number, number, number] = [0.059, 0.09, 0.165]; // #0F172A
  const COLOR_MUTED: [number, number, number] = [0.278, 0.333, 0.412]; // #475569
  const COLOR_GRAY_BG: [number, number, number] = [0.945, 0.961, 0.976]; // #F1F5F9
  const COLOR_BORDER: [number, number, number] = [0.886, 0.91, 0.941]; // #E2E8F0
  const COLOR_WHITE: [number, number, number] = [1, 1, 1];
  const COLOR_GREEN: [number, number, number] = [0.133, 0.773, 0.369]; // #22C55E

  // 1. Header Banner
  doc.drawRect(40, doc.getCurrentY() - 70, 515.28, 70, COLOR_BLUE, undefined);
  doc.drawText("BOQ SAAS USER DASHBOARD", 56, doc.getCurrentY() - 24, "F1", 9, [0.8, 0.9, 1]);
  doc.drawText(moodBoard.name || "Untitled Mood Board", 56, doc.getCurrentY() - 48, "F1", 18, COLOR_WHITE);

  const statusLabel = `STATUS: ${(moodBoard.status || "DRAFT").toUpperCase()}`;
  doc.drawText(statusLabel, 440, doc.getCurrentY() - 24, "F1", 8, [0.85, 0.93, 1]);
  doc.drawText(new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }), 440, doc.getCurrentY() - 48, "F2", 9, COLOR_WHITE);
  doc.advanceY(85);

  // 2. Metadata Information Box (matching Figma Success card row fields)
  const infoBoxHeight = 72;
  doc.drawRect(40, doc.getCurrentY() - infoBoxHeight, 515.28, infoBoxHeight, COLOR_GRAY_BG, COLOR_BORDER, 1);

  // Row 1: Client Name & BOQ Reference
  doc.drawText("Client Name:", 56, doc.getCurrentY() - 22, "F1", 9, COLOR_MUTED);
  doc.drawText(moodBoard.clientName || "General Client", 125, doc.getCurrentY() - 22, "F2", 9, COLOR_DARK);

  doc.drawText("BOQ Reference:", 310, doc.getCurrentY() - 22, "F1", 9, COLOR_MUTED);
  doc.drawText(moodBoard.boqReference || "BOQ-0029", 395, doc.getCurrentY() - 22, "F2", 9, COLOR_DARK);

  // Divider
  doc.drawRect(56, doc.getCurrentY() - 32, 483.28, 0.5, undefined, COLOR_BORDER, 0.5);

  // Row 2: Project & Categories & Images
  doc.drawText("Project:", 56, doc.getCurrentY() - 48, "F1", 9, COLOR_MUTED);
  doc.drawText(moodBoard.projectName || "Project", 105, doc.getCurrentY() - 48, "F2", 9, COLOR_DARK);

  const categories = moodBoard.categories || [];
  const catCount = categories.length;
  doc.drawText("Categories:", 220, doc.getCurrentY() - 48, "F1", 9, COLOR_MUTED);
  doc.drawText(String(catCount), 280, doc.getCurrentY() - 48, "F2", 9, COLOR_DARK);

  const allImages = categories.reduce<any[]>((acc, c) => acc.concat(c.images || []), moodBoard.images || []);
  const uniqueImages = Array.from(new Set(allImages.map((img) => img.id || img.previewUrl)));
  const imgCount = Math.max(uniqueImages.length, moodBoard.images?.length || 0);

  doc.drawText("Images:", 330, doc.getCurrentY() - 48, "F1", 9, COLOR_MUTED);
  doc.drawText(String(imgCount), 380, doc.getCurrentY() - 48, "F2", 9, COLOR_DARK);

  doc.drawText("Created By:", 425, doc.getCurrentY() - 48, "F1", 9, COLOR_MUTED);
  doc.drawText(moodBoard.createdBy || "Jenny Wilson", 480, doc.getCurrentY() - 48, "F2", 9, COLOR_DARK);

  doc.advanceY(infoBoxHeight + 16);

  // 3. Description (if present)
  if (moodBoard.description && moodBoard.description.trim()) {
    doc.checkPageBreak(50);
    doc.drawText("PROJECT VISION & CONCEPT DESCRIPTION", 40, doc.getCurrentY(), "F1", 10, COLOR_DARK);
    doc.advanceY(14);
    doc.drawText(moodBoard.description.trim(), 40, doc.getCurrentY(), "F2", 9, COLOR_MUTED);
    doc.advanceY(22);
  }

  // 4. Financial Scope Overview
  let totalSubtotal = 0;
  categories.forEach((cat) => {
    (cat.itemGroups || []).forEach((grp) => {
      (grp.items || []).forEach((item) => {
        totalSubtotal += Number(item.amount || item.quantity * item.rate || 0);
      });
    });
  });
  const gstAmount = Math.round(totalSubtotal * 0.18);
  const grandTotal = totalSubtotal + gstAmount;

  doc.checkPageBreak(55);
  doc.drawRect(40, doc.getCurrentY() - 42, 515.28, 42, [0.97, 0.98, 1], COLOR_BORDER, 1);
  doc.drawText("FINANCIAL ESTIMATE SUMMARY", 56, doc.getCurrentY() - 16, "F1", 8, COLOR_BLUE);
  doc.drawText(`Subtotal: ${formatCurrency(totalSubtotal)}`, 56, doc.getCurrentY() - 32, "F2", 9, COLOR_DARK);
  doc.drawText(`GST (18%): ${formatCurrency(gstAmount)}`, 230, doc.getCurrentY() - 32, "F2", 9, COLOR_DARK);
  doc.drawText(`Estimated Total: ${formatCurrency(grandTotal)}`, 380, doc.getCurrentY() - 32, "F1", 10, COLOR_BLUE);
  doc.advanceY(56);

  // 5. Category Details and Specifications
  doc.checkPageBreak(30);
  doc.drawText("ROOM CATEGORIES & SPECIFICATION BREAKDOWN", 40, doc.getCurrentY(), "F1", 11, COLOR_DARK);
  doc.drawRect(40, doc.getCurrentY() - 4, 515.28, 1.5, COLOR_BLUE, undefined);
  doc.advanceY(20);

  if (categories.length === 0) {
    doc.drawText("No specific categories configured yet.", 40, doc.getCurrentY(), "F2", 9, COLOR_MUTED);
    doc.advanceY(20);
  } else {
    categories.forEach((cat, catIdx) => {
      doc.checkPageBreak(90);

      // Category Header Bar
      const catImagesCount = cat.images?.length || 0;
      let catItemsCount = 0;
      let catSubtotal = 0;
      (cat.itemGroups || []).forEach((grp) => {
        (grp.items || []).forEach((item) => {
          catItemsCount++;
          catSubtotal += Number(item.amount || item.quantity * item.rate || 0);
        });
      });

      doc.drawRect(40, doc.getCurrentY() - 24, 515.28, 24, COLOR_GRAY_BG, COLOR_BORDER, 1);
      doc.drawText(
        `${catIdx + 1}. ${cat.name || "Room Category"}`,
        48,
        doc.getCurrentY() - 16,
        "F1",
        10,
        COLOR_DARK
      );
      doc.drawText(
        `${catItemsCount} items  |  ${catImagesCount} images  |  Total: ${formatCurrency(catSubtotal)}`,
        330,
        doc.getCurrentY() - 16,
        "F2",
        8.5,
        COLOR_MUTED
      );
      doc.advanceY(30);

      // Render Item Groups & Items Table
      const itemGroups = cat.itemGroups || [];
      if (itemGroups.length > 0) {
        itemGroups.forEach((grp) => {
          if (!grp.items || grp.items.length === 0) return;

          doc.checkPageBreak(50);
          doc.drawText(`Group: ${grp.name || "Items"}`, 48, doc.getCurrentY(), "F1", 9, COLOR_BLUE);
          doc.advanceY(12);

          // Table Header
          doc.drawRect(48, doc.getCurrentY() - 16, 507.28, 16, [0.93, 0.95, 0.97], COLOR_BORDER, 0.5);
          doc.drawText("Description", 56, doc.getCurrentY() - 11, "F1", 7.5, COLOR_MUTED);
          doc.drawText("QTY", 300, doc.getCurrentY() - 11, "F1", 7.5, COLOR_MUTED);
          doc.drawText("RATE", 370, doc.getCurrentY() - 11, "F1", 7.5, COLOR_MUTED);
          doc.drawText("AMOUNT", 460, doc.getCurrentY() - 11, "F1", 7.5, COLOR_MUTED);
          doc.advanceY(18);

          // Table Rows
          grp.items.forEach((item, itemIdx) => {
            doc.checkPageBreak(18);
            const rowBg: [number, number, number] | undefined =
              itemIdx % 2 === 1 ? [0.985, 0.99, 1] : undefined;
            if (rowBg) {
              doc.drawRect(48, doc.getCurrentY() - 14, 507.28, 14, rowBg, undefined);
            }

            doc.drawText(item.description || "Custom Item", 56, doc.getCurrentY() - 10, "F2", 8, COLOR_DARK);
            doc.drawText(String(item.quantity || 1), 300, doc.getCurrentY() - 10, "F2", 8, COLOR_DARK);
            doc.drawText(formatCurrency(item.rate || 0), 370, doc.getCurrentY() - 10, "F2", 8, COLOR_DARK);
            doc.drawText(formatCurrency(item.amount || (item.quantity * item.rate)), 460, doc.getCurrentY() - 10, "F1", 8, COLOR_DARK);
            doc.advanceY(15);
          });
          doc.advanceY(8);
        });
      }

      // Render Category Images / Palette references
      if (cat.images && cat.images.length > 0) {
        doc.checkPageBreak(40);
        doc.drawText(`Visual References & Color Palette (${cat.images.length} assets):`, 48, doc.getCurrentY(), "F1", 8.5, COLOR_MUTED);
        doc.advanceY(12);

        // Display image tags/swatches
        let curX = 48;
        cat.images.forEach((img, imgIdx) => {
          if (curX + 115 > 555) {
            curX = 48;
            doc.advanceY(22);
            doc.checkPageBreak(25);
          }
          doc.drawRect(curX, doc.getCurrentY() - 18, 110, 18, [0.95, 0.97, 1], COLOR_BORDER, 0.75);
          // Green indicator dot
          doc.drawRect(curX + 6, doc.getCurrentY() - 12, 6, 6, COLOR_GREEN, undefined);
          const truncatedName = (img.name || `Reference #${imgIdx + 1}`).slice(0, 15);
          doc.drawText(truncatedName, curX + 18, doc.getCurrentY() - 13, "F2", 7.5, COLOR_DARK);
          curX += 118;
        });
        doc.advanceY(24);
      } else {
        doc.advanceY(10);
      }
    });
  }

  const { bytes, str } = doc.buildPdf();
  return {
    filename,
    pdfBytes: bytes,
    pdfString: str,
    pageCount: doc.getPageCount(),
    size: bytes.length,
  };
}

/**
 * Triggers the browser download of the generated Mood Board PDF.
 */
export async function downloadMoodBoardPdf(moodBoard: MoodBoard): Promise<{
  success: boolean;
  filename: string;
  size: number;
  pageCount: number;
}> {
  // Simulate minor asynchronous generation time for loading spinner feedback
  await new Promise((resolve) => setTimeout(resolve, 350));

  const result = exportMoodBoardToPdf(moodBoard);

  if (typeof window !== "undefined") {
    try {
      const blob = new Blob([result.pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL after brief delay
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err) {
      console.error("PDF download execution failed:", err);
      throw err;
    }
  }

  return {
    success: true,
    filename: result.filename,
    size: result.size,
    pageCount: result.pageCount,
  };
}
