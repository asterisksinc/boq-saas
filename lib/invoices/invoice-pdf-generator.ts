import { deflateSync, inflateSync } from "node:zlib";
import { amountInWords } from "./amount-words";
import { buildUpiUri, encodeQr } from "./qr-generator";

export interface InvoicePdfItem {
  position?: number;
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
  hsnSacCode?: string | null;
  unit?: string | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  taxableAmount?: number | null;
}

export interface InvoicePdfData {
  id?: string;
  invoiceNumber: string;
  type?: string;
  issueDate: string;
  dueDate: string;
  milestone?: string | null;
  reference?: string | null;
  ewayBillNumber?: string | null;
  placeOfSupply?: string | null;
  placeOfSupplyCode?: string | null;
  clientName: string;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  } | null;
  buyerGstin?: string | null;
  shipToName?: string | null;
  shipToAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    gstin?: string;
  } | null;
  items: InvoicePdfItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  totalPaid?: number;
  outstanding?: number;
  currency?: string;
  additionalNotes?: string | null;
  termsAndConditions?: string | null;
  bankDetails?: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
    upiId?: string;
  } | null;
  organizationSnapshot?: {
    name?: string;
    legalName?: string;
    tradeName?: string;
    gstin?: string;
    pan?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
    bankDetails?: {
      bankName?: string;
      accountHolder?: string;
      accountNumber?: string;
      ifscCode?: string;
      branch?: string;
      upiId?: string;
    };
    logoUrl?: string | null;
    signatureUrl?: string | null;
  } | null;
}

/**
 * Escapes characters for PDF literal strings (parens and backslashes).
 */
function escapePdf(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

/**
 * Approximate character widths for Helvetica Type 1 font.
 */
function estimateTextWidth(text: string, fontSize: number, isBold: boolean = false): number {
  if (!text) return 0;
  let units = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 32) units += 278; // space
    else if (".,:;!|iIl1'`".includes(text[i])) units += 278;
    else if ("frt[]-()".includes(text[i])) units += 333;
    else if ("abcdeghknopquvxyz".includes(text[i])) units += 556;
    else if ("mwMW@#%&".includes(text[i])) units += 850;
    else if ("ABCDEFGHJKLMNOPQRSTUVXYZ".includes(text[i])) units += 667;
    else units += 556;
  }
  const factor = isBold ? 1.08 : 1.0;
  return (units / 1000) * fontSize * factor;
}

function wrapText(text: string, maxWidth: number, fontSize: number, isBold: boolean = false): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (estimateTextWidth(testLine, fontSize, isBold) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatDateDisplay(val: string | null | undefined): string {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatCurrencyAmount(num: number): string {
  const rounded = Math.round((Number(num) || 0) * 100) / 100;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

interface LoadedImage {
  name: string; // e.g. "Im1"
  width: number;
  height: number;
  objIndex: number;
  pdfObject: string;
  smaskObjIndex?: number;
  smaskObject?: string;
  orientation?: number;
}

/**
 * Parses EXIF Orientation tag (0x0112) from JPEG APP1 marker if present.
 */
function getJpegExifOrientation(buf: Buffer): number {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset + 4 < buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    const len = buf.readUInt16BE(offset + 2);
    if (marker === 0xe1) {
      if (
        offset + 14 < buf.length &&
        buf.toString("ascii", offset + 4, offset + 8) === "Exif" &&
        buf[offset + 8] === 0 &&
        buf[offset + 9] === 0
      ) {
        const tiffOffset = offset + 10;
        if (tiffOffset + 8 < buf.length) {
          const endianness = buf.toString("ascii", tiffOffset, tiffOffset + 2);
          const isLittle = endianness === "II";
          const read16 = (o: number) => (isLittle ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
          const read32 = (o: number) => (isLittle ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
          const firstIfdOffset = read32(tiffOffset + 4);
          const ifdStart = tiffOffset + firstIfdOffset;
          if (ifdStart + 2 < buf.length) {
            const numEntries = read16(ifdStart);
            for (let i = 0; i < numEntries; i++) {
              const entryOffset = ifdStart + 2 + i * 12;
              if (entryOffset + 12 > buf.length) break;
              const tag = read16(entryOffset);
              if (tag === 0x0112) {
                const orientation = read16(entryOffset + 8);
                if (orientation >= 1 && orientation <= 8) {
                  return orientation;
                }
              }
            }
          }
        }
      }
    }
    offset += 2 + len;
  }
  return 1;
}

/**
 * Downloads image bytes from URL or parses data URL.
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:image/")) {
    const parts = trimmed.split(",");
    if (parts.length >= 2) {
      return Buffer.from(parts[1], "base64");
    }
    return null;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const res = await fetch(trimmed, { headers: { Accept: "image/*" } });
      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Parses and processes a JPEG or PNG buffer into a PDF XObject.
 */
function processImageToPdfObject(
  imageName: string,
  buf: Buffer,
  startObjId: number
): LoadedImage | null {
  try {
    // Check if JPEG (starts with 0xFF 0xD8)
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let width = 0;
      let height = 0;
      let offset = 2;
      while (offset < buf.length) {
        if (buf[offset] !== 0xff) break;
        const marker = buf[offset + 1];
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          height = buf.readUInt16BE(offset + 5);
          width = buf.readUInt16BE(offset + 7);
          break;
        }
        const len = buf.readUInt16BE(offset + 2);
        offset += 2 + len;
      }
      if (width > 0 && height > 0) {
        const orientation = getJpegExifOrientation(buf);
        const isRotated90 = orientation === 6 || orientation === 8;
        const visualWidth = isRotated90 ? height : width;
        const visualHeight = isRotated90 ? width : height;

        const streamHeader = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${buf.length} >>\nstream\n`;
        const streamFooter = `\nendstream\nendobj\n`;
        const pdfObject = `${startObjId} 0 obj\n${streamHeader}${buf.toString("binary")}${streamFooter}`;
        return {
          name: imageName,
          width: visualWidth,
          height: visualHeight,
          objIndex: startObjId,
          pdfObject,
          orientation,
        };
      }
    }

    // Check if PNG (starts with 0x89 'P' 'N' 'G')
    if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      const bitDepth = buf[24];
      const colorType = buf[25]; // 2 = RGB, 6 = RGBA

      if (width > 0 && height > 0 && bitDepth === 8) {
        // Collect IDAT chunks
        const idatParts: Buffer[] = [];
        let offset = 8;
        while (offset < buf.length) {
          const chunkLen = buf.readUInt32BE(offset);
          const chunkType = buf.toString("ascii", offset + 4, offset + 8);
          if (chunkType === "IDAT") {
            idatParts.push(buf.subarray(offset + 8, offset + 8 + chunkLen));
          } else if (chunkType === "IEND") {
            break;
          }
          offset += 12 + chunkLen;
        }

        if (idatParts.length > 0) {
          const rawIdat = Buffer.concat(idatParts);
          const uncompressed = inflateSync(rawIdat);

          if (colorType === 6) {
            // RGBA: 4 channels per pixel, 1 filter byte per row
            const stride = width * 4 + 1;
            const rgbData = Buffer.alloc(width * height * 3);
            const alphaData = Buffer.alloc(width * height);
            let rgbIdx = 0;
            let alphaIdx = 0;

            for (let row = 0; row < height; row++) {
              const rowStart = row * stride + 1; // skip filter byte (assumed 0 or standard)
              for (let col = 0; col < width; col++) {
                const px = rowStart + col * 4;
                if (px + 3 < uncompressed.length) {
                  rgbData[rgbIdx++] = uncompressed[px];
                  rgbData[rgbIdx++] = uncompressed[px + 1];
                  rgbData[rgbIdx++] = uncompressed[px + 2];
                  alphaData[alphaIdx++] = uncompressed[px + 3];
                }
              }
            }

            const deflatedRgb = deflateSync(rgbData);
            const deflatedAlpha = deflateSync(alphaData);

            const smaskObjId = startObjId + 1;
            const smaskHeader = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${deflatedAlpha.length} >>\nstream\n`;
            const smaskObject = `${smaskObjId} 0 obj\n${smaskHeader}${deflatedAlpha.toString("binary")}\nendstream\nendobj\n`;

            const imgHeader = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask ${smaskObjId} 0 R /Length ${deflatedRgb.length} >>\nstream\n`;
            const imgObject = `${startObjId} 0 obj\n${imgHeader}${deflatedRgb.toString("binary")}\nendstream\nendobj\n`;

            return {
              name: imageName,
              width,
              height,
              objIndex: startObjId,
              pdfObject: imgObject,
              smaskObjIndex: smaskObjId,
              smaskObject,
            };
          } else if (colorType === 2) {
            // RGB: 3 channels per pixel
            const stride = width * 3 + 1;
            const rgbData = Buffer.alloc(width * height * 3);
            let rgbIdx = 0;
            for (let row = 0; row < height; row++) {
              const rowStart = row * stride + 1;
              for (let col = 0; col < width; col++) {
                const px = rowStart + col * 3;
                if (px + 2 < uncompressed.length) {
                  rgbData[rgbIdx++] = uncompressed[px];
                  rgbData[rgbIdx++] = uncompressed[px + 1];
                  rgbData[rgbIdx++] = uncompressed[px + 2];
                }
              }
            }
            const deflatedRgb = deflateSync(rgbData);
            const imgHeader = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${deflatedRgb.length} >>\nstream\n`;
            const imgObject = `${startObjId} 0 obj\n${imgHeader}${deflatedRgb.toString("binary")}\nendstream\nendobj\n`;
            return {
              name: imageName,
              width,
              height,
              objIndex: startObjId,
              pdfObject: imgObject,
            };
          }
        }
      }
    }
  } catch {
    // If decoding fails, return null
  }
  return null;
}

/**
 * Builds the complete redesigned Invoice PDF matching reference_2 invoice.pdf.
 */
export async function generateInvoicePdf(invoice: InvoicePdfData): Promise<Uint8Array> {
  const pageWidth = 595.28; // A4 pt
  const pageHeight = 841.89; // A4 pt
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // 523.28 pt

  const pageStreams: string[][] = [[]];
  let currentPage = 0;

  function appendOp(op: string) {
    pageStreams[currentPage].push(op);
  }

  function addPage() {
    pageStreams.push([]);
    currentPage++;
  }

  function drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    fillRgb?: [number, number, number],
    strokeRgb?: [number, number, number],
    lineWidth: number = 0.75
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
    if (fillRgb && strokeRgb) ops.push("B");
    else if (fillRgb) ops.push("f");
    else if (strokeRgb) ops.push("S");
    ops.push("Q");
    appendOp(ops.join("\n"));
  }

  function drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeRgb: [number, number, number] = [0.8, 0.8, 0.8],
    lineWidth: number = 0.5
  ) {
    const ops = [
      "q",
      `${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG`,
      `${lineWidth} w`,
      `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
      "Q",
    ];
    appendOp(ops.join("\n"));
  }

  function drawText(
    text: string,
    x: number,
    y: number,
    font: "F1" | "F2" | "F3" = "F1",
    fontSize: number = 9,
    rgb: [number, number, number] = [0.06, 0.09, 0.16],
    align: "left" | "right" | "center" = "left",
    maxWidth?: number
  ) {
    if (!text) return;
    let actualText = text;
    const isBold = font === "F2";
    let width = estimateTextWidth(actualText, fontSize, isBold);

    if (maxWidth && width > maxWidth) {
      while (actualText.length > 3 && estimateTextWidth(actualText + "...", fontSize, isBold) > maxWidth) {
        actualText = actualText.slice(0, -1);
      }
      actualText += "...";
      width = estimateTextWidth(actualText, fontSize, isBold);
    }

    let actualX = x;
    if (align === "right") actualX = x - width;
    else if (align === "center") actualX = x - width / 2;

    const safe = escapePdf(actualText);
    const op = `BT /${font} ${fontSize} Tf ${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg ${actualX.toFixed(2)} ${y.toFixed(2)} Td (${safe}) Tj ET`;
    appendOp(op);
  }

  // Pre-fetch images
  const org = invoice.organizationSnapshot || {};
  const logoUrl = org.logoUrl || null;
  const signatureUrl = org.signatureUrl || null;

  const [logoBuf, sigBuf] = await Promise.all([
    logoUrl ? fetchImageBuffer(logoUrl) : Promise.resolve(null),
    signatureUrl ? fetchImageBuffer(signatureUrl) : Promise.resolve(null),
  ]);

  const images: LoadedImage[] = [];
  let nextObjId = 6; // Catalog(1), Pages(2), Font F1(3), Font F2(4), Font F3(5)

  let logoImage: LoadedImage | null = null;
  if (logoBuf) {
    logoImage = processImageToPdfObject("LogoIm", logoBuf, nextObjId);
    if (logoImage) {
      images.push(logoImage);
      nextObjId += logoImage.smaskObjIndex ? 2 : 1;
    }
  }

  let sigImage: LoadedImage | null = null;
  if (sigBuf) {
    sigImage = processImageToPdfObject("SigIm", sigBuf, nextObjId);
    if (sigImage) {
      images.push(sigImage);
      nextObjId += sigImage.smaskObjIndex ? 2 : 1;
    }
  }

  function drawEmbeddedImage(image: LoadedImage, x: number, y: number, w: number, h: number) {
    let cmStr = `${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm`;
    if (image.orientation === 3) {
      cmStr = `${(-w).toFixed(2)} 0 0 ${(-h).toFixed(2)} ${(x + w).toFixed(2)} ${(y + h).toFixed(2)} cm`;
    } else if (image.orientation === 6) {
      cmStr = `0 ${(-h).toFixed(2)} ${w.toFixed(2)} 0 ${x.toFixed(2)} ${(y + h).toFixed(2)} cm`;
    } else if (image.orientation === 8) {
      cmStr = `0 ${h.toFixed(2)} ${(-w).toFixed(2)} 0 ${(x + w).toFixed(2)} ${y.toFixed(2)} cm`;
    }
    const ops = [
      "q",
      cmStr,
      `/${image.name} Do`,
      "Q",
    ];
    appendOp(ops.join("\n"));
  }

  // Start Page 1
  let curY = pageHeight - margin;

  // 1. TOP HEADER
  const companyName = org.tradeName || org.legalName || org.name || "Your Company";
  const orgAddress = [org.address?.line1, org.address?.line2, org.address?.city, org.address?.state, org.address?.pincode, org.address?.country]
    .filter(Boolean)
    .join(", ");
  const orgGstin = org.gstin ? `GSTIN: ${org.gstin}` : "";

  let headerTextLeft = margin;
  if (logoImage) {
    const maxLogoW = 90;
    const maxLogoH = 40;
    const scale = Math.min(maxLogoW / logoImage.width, maxLogoH / logoImage.height, 1);
    const logoW = logoImage.width * scale;
    const logoH = logoImage.height * scale;
    drawEmbeddedImage(logoImage, margin, curY - logoH, logoW, logoH);
    headerTextLeft = margin + logoW + 12;
  }

  // Company Name & Address (left aligned)
  drawText(companyName, headerTextLeft, curY - 14, "F2", 14, [0.06, 0.09, 0.16]);
  if (orgAddress) {
    drawText(orgAddress.slice(0, 80), headerTextLeft, curY - 26, "F1", 7.5, [0.28, 0.33, 0.41]);
  }
  drawText(orgGstin, headerTextLeft, curY - 36, "F1", 7.5, [0.28, 0.33, 0.41]);

  // Invoice Title & Label (top right)
  drawText("INVOICE", pageWidth - margin, curY - 14, "F2", 16, [0.06, 0.09, 0.16], "right");
  drawText("ORIGINAL FOR RECIPIENT", pageWidth - margin, curY - 26, "F1", 7, [0.4, 0.45, 0.55], "right");

  curY -= 50;

  // 2. METADATA INFORMATION GRID (Bordered 4-Column Box matching reference)
  const gridX = margin;
  const gridW = contentWidth;
  const col1W = 155;
  const col2W = 108;
  const col3W = 110;
  const col4W = gridW - (col1W + col2W + col3W); // ~150.28

  // Outer border & background
  const gridH = 88;
  drawRect(gridX, curY - gridH, gridW, gridH, undefined, [0.75, 0.8, 0.86], 0.75);

  // Vertical column dividers
  drawLine(gridX + col1W, curY, gridX + col1W, curY - gridH, [0.82, 0.85, 0.9], 0.5);
  drawLine(gridX + col1W + col2W, curY, gridX + col1W + col2W, curY - gridH, [0.82, 0.85, 0.9], 0.5);
  drawLine(gridX + col1W + col2W + col3W, curY, gridX + col1W + col2W + col3W, curY - gridH, [0.82, 0.85, 0.9], 0.5);

  // Column 1: BILL TO
  const c1X = gridX + 6;
  drawText("BILL TO", c1X, curY - 10, "F2", 6.5, [0.35, 0.4, 0.48]);
  drawText(invoice.clientName || "Client Name", c1X, curY - 21, "F2", 8.5, [0.06, 0.09, 0.16], "left", col1W - 12);
  const billLines: string[] = [];
  if (invoice.billingAddress) {
    const a = invoice.billingAddress;
    const l1 = [a.line1, a.line2].filter(Boolean).join(", ");
    const l2 = [a.city, a.state, a.pincode].filter(Boolean).join(", ");
    if (l1) billLines.push(...wrapText(l1, col1W - 12, 7));
    if (l2) billLines.push(...wrapText(l2, col1W - 12, 7));
    if (a.country && !l2.includes(a.country)) billLines.push(a.country);
  }
  if (invoice.buyerGstin) {
    billLines.push(`GSTIN: ${invoice.buyerGstin}`);
  }
  let billY = curY - 31;
  for (const bl of billLines.slice(0, 4)) {
    drawText(bl, c1X, billY, "F1", 7, [0.2, 0.25, 0.32], "left", col1W - 12);
    billY -= 9;
  }

  // Column 2: INVOICE NO., DATE & REF / PO NO.
  const c2X = gridX + col1W + 6;
  drawText("INVOICE NO.", c2X, curY - 10, "F2", 6.5, [0.35, 0.4, 0.48]);
  drawText(invoice.invoiceNumber, c2X, curY - 21, "F2", 9, [0.06, 0.09, 0.16], "left", col2W - 12);

  drawText("DATE", c2X, curY - 38, "F2", 6.5, [0.35, 0.4, 0.48]);
  drawText(formatDateDisplay(invoice.issueDate), c2X, curY - 48, "F1", 8, [0.1, 0.15, 0.22]);

  if (invoice.reference) {
    drawText("REF / PO NO.", c2X, curY - 62, "F2", 6.5, [0.35, 0.4, 0.48]);
    drawText(invoice.reference, c2X, curY - 72, "F1", 8, [0.1, 0.15, 0.22], "left", col2W - 12);
  }

  // Column 3: DUE DATE & PLACE OF SUPPLY
  const c3X = gridX + col1W + col2W + 6;
  drawText("DUE DATE", c3X, curY - 10, "F2", 6.5, [0.35, 0.4, 0.48]);
  drawText(formatDateDisplay(invoice.dueDate), c3X, curY - 21, "F1", 8, [0.1, 0.15, 0.22]);

  drawText("PLACE OF SUPPLY", c3X, curY - 38, "F2", 6.5, [0.35, 0.4, 0.48]);
  const posDisplay = invoice.placeOfSupply
    ? invoice.placeOfSupplyCode
      ? `${invoice.placeOfSupply} (${invoice.placeOfSupplyCode})`
      : invoice.placeOfSupply
    : (invoice.billingAddress?.state || "-");
  drawText(posDisplay, c3X, curY - 48, "F1", 8, [0.1, 0.15, 0.22], "left", col3W - 12);

  // Column 4: EWAY BILL & SHIP TO
  const c4X = gridX + col1W + col2W + col3W + 6;
  drawText("E-WAY BILL NO.", c4X, curY - 10, "F2", 6.5, [0.35, 0.4, 0.48]);
  drawText(invoice.ewayBillNumber || "-", c4X, curY - 21, "F1", 8, [0.1, 0.15, 0.22], "left", col4W - 12);

  drawText("SHIP TO", c4X, curY - 35, "F2", 6.5, [0.35, 0.4, 0.48]);
  const shipLines: string[] = [];
  if (invoice.shipToName) shipLines.push(invoice.shipToName);
  if (invoice.shipToAddress) {
    const s = invoice.shipToAddress;
    const l1 = [s.line1, s.line2].filter(Boolean).join(", ");
    const l2 = [s.city, s.state, s.pincode].filter(Boolean).join(", ");
    if (l1) shipLines.push(...wrapText(l1, col4W - 12, 6.5));
    if (l2) shipLines.push(...wrapText(l2, col4W - 12, 6.5));
    if (s.gstin) shipLines.push(`GSTIN: ${s.gstin}`);
  }
  let shipY = curY - 45;
  if (shipLines.length === 0) {
    drawText("-", c4X, shipY, "F1", 7, [0.4, 0.45, 0.55]);
  } else {
    for (const sl of shipLines.slice(0, 4)) {
      drawText(sl, c4X, shipY, "F1", 6.5, [0.2, 0.25, 0.32], "left", col4W - 12);
      shipY -= 8;
    }
  }

  curY -= gridH + 12;

  // 3. TABLE LAYOUT
  // Columns:
  // 1: # (22)
  // 2: ITEM (195)
  // 3: HSN (45)
  // 4: RATE (60)
  // 5: QTY (60)
  // 6: TAXABLE (65)
  // 7: AMOUNT (76.28)
  const tblX = margin;
  const colW_num = 24;
  const colW_item = 195;
  const colW_hsn = 44;
  const colW_rate = 62;
  const colW_qty = 62;
  const colW_taxable = 65;
  const colW_amount = contentWidth - (colW_num + colW_item + colW_hsn + colW_rate + colW_qty + colW_taxable); // ~71.28

  const x_num = tblX;
  const x_item = x_num + colW_num;
  const x_hsn = x_item + colW_item;
  const x_rate = x_hsn + colW_hsn;
  const x_qty = x_rate + colW_rate;
  const x_taxable = x_qty + colW_qty;
  const x_amount = x_taxable + colW_taxable;

  function drawTableHeader(y: number) {
    const hH = 18;
    // Dark navy header
    drawRect(tblX, y - hH, contentWidth, hH, [0.12, 0.16, 0.23]);
    const textY = y - 12;
    drawText("#", x_num + colW_num / 2, textY, "F2", 7.5, [1, 1, 1], "center");
    drawText("ITEM", x_item + 4, textY, "F2", 7.5, [1, 1, 1]);
    drawText("HSN", x_hsn + colW_hsn / 2, textY, "F2", 7.5, [1, 1, 1], "center");
    drawText("RATE", x_rate + colW_rate - 4, textY, "F2", 7.5, [1, 1, 1], "right");
    drawText("QTY", x_qty + colW_qty - 4, textY, "F2", 7.5, [1, 1, 1], "right");
    drawText("TAXABLE", x_taxable + colW_taxable - 4, textY, "F2", 7.5, [1, 1, 1], "right");
    drawText("AMOUNT", x_amount + colW_amount - 4, textY, "F2", 7.5, [1, 1, 1], "right");
  }

  drawTableHeader(curY);
  curY -= 18;

  // Line items
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    { description: "Services as agreed", quantity: 1, rate: invoice.totalAmount, amount: invoice.totalAmount }
  ];

  let totalQuantity = 0;

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const qty = Number(it.quantity) || 1;
    totalQuantity += qty;
    const rate = Number(it.rate) || 0;
    const taxable = it.taxableAmount !== undefined && it.taxableAmount !== null ? Number(it.taxableAmount) : Math.round(qty * rate * 100) / 100;
    const itemTaxRate = it.taxRate !== undefined && it.taxRate !== null ? Number(it.taxRate) : (invoice.taxRate ?? 18);
    const itemTax = it.taxAmount !== undefined && it.taxAmount !== null
      ? Number(it.taxAmount)
      : Math.round((taxable * itemTaxRate) / 100 * 100) / 100;
    const lineAmt = it.amount !== undefined && it.amount !== null && it.amount > taxable
      ? Number(it.amount)
      : Math.round((taxable + itemTax) * 100) / 100;

    // Check pagination
    if (curY < 180) {
      addPage();
      curY = pageHeight - margin - 20;
      drawTableHeader(curY);
      curY -= 18;
    }

    const descLines = wrapText(it.description, colW_item - 8, 8, true);
    const rowHeight = Math.max(22, descLines.length * 11 + 6);

    // Row divider
    drawLine(tblX, curY - rowHeight, tblX + contentWidth, curY - rowHeight, [0.88, 0.9, 0.94], 0.5);

    // Render cells
    const cellTextY = curY - 13;
    drawText(String(it.position || idx + 1), x_num + colW_num / 2, cellTextY, "F1", 8, [0.2, 0.25, 0.32], "center");

    let dy = cellTextY;
    for (let li = 0; li < descLines.length; li++) {
      const isFirst = li === 0;
      drawText(descLines[li], x_item + 4, dy, isFirst ? "F2" : "F1", isFirst ? 8 : 7.5, isFirst ? [0.06, 0.09, 0.16] : [0.35, 0.4, 0.48]);
      dy -= 10;
    }

    drawText(it.hsnSacCode || "-", x_hsn + colW_hsn / 2, cellTextY, "F1", 7.5, [0.28, 0.33, 0.41], "center");
    drawText(formatCurrencyAmount(rate), x_rate + colW_rate - 4, cellTextY, "F1", 8, [0.1, 0.15, 0.22], "right");

    const unitStr = it.unit ? ` ${it.unit.toUpperCase()}` : "";
    drawText(`${qty}${unitStr}`, x_qty + colW_qty - 4, cellTextY, "F1", 7.5, [0.1, 0.15, 0.22], "right");

    drawText(formatCurrencyAmount(taxable), x_taxable + colW_taxable - 4, cellTextY, "F1", 8, [0.1, 0.15, 0.22], "right");
    drawText(formatCurrencyAmount(lineAmt), x_amount + colW_amount - 4, cellTextY, "F2", 8, [0.06, 0.09, 0.16], "right");

    curY -= rowHeight;
  }

  curY -= 10;

  // 4. TOTALS & SUMMARY SECTION (Left: bank/words/QR, Right: Totals)
  const leftSummaryW = 310;
  const rightTotalsW = contentWidth - leftSummaryW; // ~213.28

  const bank = invoice.bankDetails || org.bankDetails || null;
  const upiId = bank?.upiId || null;
  const qrUri = upiId ? buildUpiUri({ upiId, payeeName: bank?.accountHolder || companyName, amount: invoice.totalAmount, invoiceNumber: invoice.invoiceNumber }) : null;
  const qrData = qrUri ? encodeQr(qrUri) : null;

  // Check if enough space on current page for Totals & Footer, else add page
  if (curY < 210) {
    addPage();
    curY = pageHeight - margin - 20;
  }

  const totalsStartY = curY;

  // LEFT SUMMARY
  // Item count & qty
  const qtyFormatted = totalQuantity % 1 === 0 ? totalQuantity.toFixed(0) : totalQuantity.toFixed(2);
  drawText(`${items.length} items · ${qtyFormatted} qty`, margin, totalsStartY - 6, "F2", 8, [0.06, 0.09, 0.16]);

  // Amount in words
  const words = amountInWords(invoice.totalAmount, invoice.currency || "INR");
  drawText(`In words: ${words}`, margin, totalsStartY - 18, "F1", 7.5, [0.18, 0.22, 0.3], "left", leftSummaryW);

  // Bank Info Line
  let bankStr = "";
  if (bank) {
    const parts = [
      bank.bankName ? `BANK: ${bank.bankName}` : "",
      bank.accountNumber ? `A/c ${bank.accountNumber}` : "",
      bank.ifscCode ? `IFSC ${bank.ifscCode}` : "",
      bank.branch ? bank.branch : "",
    ].filter(Boolean);
    bankStr = parts.join(" · ");
  }
  if (bankStr) {
    drawText(bankStr, margin, totalsStartY - 30, "F1", 7.5, [0.2, 0.25, 0.32], "left", leftSummaryW);
  }

  // QR Code Box (only when valid UPI configured)
  let qrBottomY = totalsStartY - 36;
  if (qrData) {
    const qrBoxSize = 52;
    const qrX = margin + leftSummaryW - qrBoxSize - 10;
    const qrY = totalsStartY - 34 - qrBoxSize;
    const modSize = qrBoxSize / qrData.size;

    // Draw QR modules
    for (let r = 0; r < qrData.size; r++) {
      for (let c = 0; c < qrData.size; c++) {
        if (qrData.modules[r][c]) {
          drawRect(qrX + c * modSize, qrY + (qrData.size - 1 - r) * modSize, modSize, modSize, [0.06, 0.09, 0.16]);
        }
      }
    }
    drawText("Scan to pay via UPI", qrX + qrBoxSize / 2, qrY - 8, "F1", 6.5, [0.35, 0.4, 0.48], "center");
    qrBottomY = qrY - 12;
  } else {
    // Standard Payment Mode block matching live preview
    const paymentModeText = "Payment mode: Bank Transfer (NEFT / RTGS / IMPS)";
    const pmtBoxW = leftSummaryW - 20;
    const pmtBoxH = 16;
    const pmtY = totalsStartY - 52;
    drawRect(margin, pmtY, pmtBoxW, pmtBoxH, [0.97, 0.98, 0.99], [0.8, 0.84, 0.88], 0.5);
    drawText(paymentModeText, margin + 6, pmtY + 4.5, "F1", 7, [0.35, 0.4, 0.48]);
    qrBottomY = pmtY - 6;
  }

  // RIGHT TOTALS
  const rX = margin + leftSummaryW;
  let tY = totalsStartY - 8;

  // Taxable Amount
  drawText("Taxable Amount", rX, tY, "F1", 8.5, [0.3, 0.35, 0.42]);
  drawText(formatCurrencyAmount(invoice.subtotal), margin + contentWidth, tY, "F1", 8.5, [0.06, 0.09, 0.16], "right");
  tY -= 14;

  // Tax Breakdown if taxAmount > 0
  if (invoice.taxAmount > 0) {
    const taxLabel = `GST (${invoice.taxRate || 18}%)`;
    drawText(taxLabel, rX, tY, "F1", 8, [0.3, 0.35, 0.42]);
    drawText(formatCurrencyAmount(invoice.taxAmount), margin + contentWidth, tY, "F1", 8, [0.06, 0.09, 0.16], "right");
    tY -= 14;
  }

  // Total Box (Bordered rectangular box with bold total)
  const totalBoxH = 22;
  drawRect(rX, tY - totalBoxH + 4, rightTotalsW, totalBoxH, undefined, [0.06, 0.09, 0.16], 1);
  drawText("Total", rX + 6, tY - 9, "F2", 9.5, [0.06, 0.09, 0.16]);
  drawText(`INR ${formatCurrencyAmount(invoice.totalAmount)}`, margin + contentWidth - 6, tY - 9, "F2", 9.5, [0.06, 0.09, 0.16], "right");

  curY = Math.min(qrBottomY, tY - totalBoxH) - 16;

  // 5. FOOTER SECTION: NOTES, TERMS & CONDITIONS, SIGNATURE
  const notesLeftW = 320;

  // Notes
  if (invoice.additionalNotes && invoice.additionalNotes.trim()) {
    drawText("NOTES", margin, curY, "F2", 7, [0.4, 0.45, 0.55]);
    curY -= 10;
    const nLines = wrapText(invoice.additionalNotes.trim(), notesLeftW, 7.5);
    for (const nl of nLines.slice(0, 4)) {
      drawText(nl, margin, curY, "F1", 7.5, [0.2, 0.25, 0.32]);
      curY -= 9.5;
    }
    curY -= 6;
  }

  // Terms & Conditions
  if (invoice.termsAndConditions && invoice.termsAndConditions.trim()) {
    drawText("TERMS & CONDITIONS", margin, curY, "F2", 7, [0.4, 0.45, 0.55]);
    curY -= 10;
    const rawTerms = invoice.termsAndConditions.trim().split(/\r?\n/).filter(Boolean);
    let termCount = 1;
    for (const rawTerm of rawTerms) {
      const termClean = rawTerm.replace(/^\d+[\.\)]\s*/, "");
      const wrapped = wrapText(`${termCount}. ${termClean}`, notesLeftW, 7);
      for (const wl of wrapped) {
        drawText(wl, margin, curY, "F1", 7, [0.25, 0.3, 0.38]);
        curY -= 8.5;
      }
      termCount++;
      if (termCount > 8) break;
    }
  }

  // Right Signatory Box
  const sigBoxW = 160;
  const sigRightX = pageWidth - margin;
  const sigLeftX = sigRightX - sigBoxW;
  const sigBaselineY = 80;

  drawText(`For ${companyName}`, sigRightX, sigBaselineY + 54, "F2", 8, [0.06, 0.09, 0.16], "right");

  if (sigImage) {
    const maxSigW = 120;
    const maxSigH = 38;
    const scale = Math.min(maxSigW / sigImage.width, maxSigH / sigImage.height, 1);
    const sW = sigImage.width * scale;
    const sH = sigImage.height * scale;
    drawEmbeddedImage(sigImage, sigRightX - sW, sigBaselineY + 12, sW, sH);
  }

  drawLine(sigLeftX + 20, sigBaselineY + 10, sigRightX, sigBaselineY + 10, [0.2, 0.25, 0.32], 0.75);
  drawText("Authorised Signatory", sigRightX, sigBaselineY - 1, "F1", 7.5, [0.35, 0.4, 0.48], "right");

  // 6. BUILD FINAL PDF 1.4 DOCUMENT STREAM
  const totalPages = pageStreams.length;

  // Add Page X / Y footer on each page
  for (let p = 0; p < totalPages; p++) {
    const footerText = `Page ${p + 1} / ${totalPages}  This is a digitally signed document.`;
    const safeFooter = escapePdf(footerText);
    const fWidth = estimateTextWidth(footerText, 7);
    const fX = (pageWidth - fWidth) / 2;
    const fOp = `BT /F1 7 Tf 0.45 0.5 0.58 rg ${fX.toFixed(2)} 26 Td (${safeFooter}) Tj ET`;
    pageStreams[p].push(fOp);
  }

  // Assemble Objects
  const objects: string[] = [];
  const offsets: number[] = [];

  let body = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";

  // Obj 1: Catalog
  const catalogObj = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objects.push(catalogObj);

  // Obj 3, 4, 5: Fonts
  const font1Obj = "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  const font2Obj = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  const font3Obj = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n";

  // Build XObject dictionary string
  let xobjDict = "";
  if (images.length > 0) {
    xobjDict = " /XObject << " + images.map((im) => `/${im.name} ${im.objIndex} 0 R`).join(" ") + " >>";
  }

  // Pages & Content Objects
  const kids: string[] = [];
  const pageObjs: string[] = [];
  const contentObjs: string[] = [];

  // Page objects start after images
  let pageBaseObjId = nextObjId;
  for (let p = 0; p < totalPages; p++) {
    const pId = pageBaseObjId + p * 2;
    const cId = pageBaseObjId + p * 2 + 1;
    kids.push(`${pId} 0 R`);

    const pObj = `${pId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Contents ${cId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >>${xobjDict} >> >>\nendobj\n`;
    pageObjs.push(pObj);

    const streamBody = pageStreams[p].join("\n");
    const streamLen = Buffer.byteLength(streamBody, "latin1");
    const cObj = `${cId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamBody}\nendstream\nendobj\n`;
    contentObjs.push(cObj);
  }

  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${totalPages} >>\nendobj\n`;

  // Image objects
  const imgObjs: string[] = [];
  for (const im of images) {
    imgObjs.push(im.pdfObject);
    if (im.smaskObject) {
      imgObjs.push(im.smaskObject);
    }
  }

  const allObjects = [
    catalogObj,
    pagesObj,
    font1Obj,
    font2Obj,
    font3Obj,
    ...imgObjs,
    ...pageObjs.flatMap((po, idx) => [po, contentObjs[idx]]),
  ];

  let currentOffset = Buffer.byteLength(body, "latin1");
  const binaryChunks: Buffer[] = [Buffer.from(body, "latin1")];

  for (const obj of allObjects) {
    offsets.push(currentOffset);
    const objBuf = Buffer.from(obj, "latin1");
    binaryChunks.push(objBuf);
    currentOffset += objBuf.length;
  }

  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${allObjects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  binaryChunks.push(Buffer.from(xref + trailer, "latin1"));

  const finalBuf = Buffer.concat(binaryChunks);
  return new Uint8Array(finalBuf);
}
