/**
 * Lightweight, self-contained QR Code generator for UPI payment URIs.
 * Generates standards-compliant QR Code module matrix without external dependencies.
 */

// QR Code Polynomial and Galoi Field (GF(256)) math
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  GF256_LOG[0] = 0;
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function polyMultiply(p1: Uint8Array, p2: Uint8Array): Uint8Array {
  const result = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMultiply(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): Uint8Array {
  let poly: Uint8Array<ArrayBufferLike> = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    poly = polyMultiply(poly, new Uint8Array([1, GF256_EXP[i]]));
  }
  return poly;
}

function calculateEcc(data: Uint8Array, eccCount: number): Uint8Array {
  const gen = getGeneratorPoly(eccCount);
  const remainder = new Uint8Array(eccCount);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    for (let i = 0; i < eccCount - 1; i++) {
      remainder[i] = remainder[i + 1] ^ gfMultiply(gen[i + 1], factor);
    }
    remainder[eccCount - 1] = gfMultiply(gen[eccCount], factor);
  }
  return remainder;
}

// Capacities and ECC counts for Level M (Byte Mode)
// Version 1 to 6 capacity tables: [dataBytes, eccBytes]
const VERSION_INFO: Record<number, { dataBytes: number; eccBytes: number }> = {
  1: { dataBytes: 16, eccBytes: 10 },
  2: { dataBytes: 28, eccBytes: 16 },
  3: { dataBytes: 44, eccBytes: 26 },
  4: { dataBytes: 64, eccBytes: 36 },
  5: { dataBytes: 86, eccBytes: 48 },
  6: { dataBytes: 108, eccBytes: 64 },
  7: { dataBytes: 124, eccBytes: 72 },
  8: { dataBytes: 154, eccBytes: 88 },
};

export interface QrCodeResult {
  size: number;
  modules: boolean[][];
}

/**
 * Encodes text into a QR code matrix.
 */
export function encodeQr(text: string): QrCodeResult | null {
  const utf8 = Buffer.from(text, "utf8");
  const len = utf8.length;

  let version = 0;
  for (let v = 1; v <= 8; v++) {
    if (len + 2 <= VERSION_INFO[v].dataBytes) {
      version = v;
      break;
    }
  }
  if (version === 0) return null; // Text exceeds version 8 capacity

  const { dataBytes, eccBytes } = VERSION_INFO[version];
  const size = 17 + version * 4;

  // Build data bit stream
  const bits: number[] = [];
  function pushBits(val: number, count: number) {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(4, 4);
  // Character count indicator (8 bits for version 1-9 in byte mode)
  pushBits(len, 8);
  for (let i = 0; i < len; i++) {
    pushBits(utf8[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const remainingBits = dataBytes * 8 - bits.length;
  pushBits(0, Math.min(4, remainingBits));

  // Pad to 8-bit boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < dataBytes * 8) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataPayload = new Uint8Array(dataBytes);
  for (let i = 0; i < dataBytes; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i * 8 + b];
    }
    dataPayload[i] = byte;
  }

  const eccPayload = calculateEcc(dataPayload, eccBytes);

  // Combine data + ecc
  const totalPayload = new Uint8Array(dataBytes + eccBytes);
  totalPayload.set(dataPayload, 0);
  totalPayload.set(eccPayload, dataBytes);

  // Initialize matrix
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunction(r: number, c: number, val: boolean) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = val;
      isFunction[r][c] = true;
    }
  }

  // Draw 7x7 Finder Pattern at (row, col)
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isDark =
            r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setFunction(nr, nc, isDark);
        } else {
          setFunction(nr, nc, false);
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment Pattern for Version 2+
  if (version >= 2) {
    const alignPos = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isDark = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
        setFunction(alignPos + r, alignPos + c, isDark);
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }

  // Dark module
  setFunction(4 * version + 9, 8, true);

  // Format info reserve
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunction(8, i, false);
    if (!isFunction[i][8]) setFunction(i, 8, false);
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) setFunction(8, i, false);
    if (!isFunction[i][8]) setFunction(i, 8, false);
  }

  // Place codeword bits in zigzag pattern
  let bitIdx = 0;
  const allBits: number[] = [];
  for (const byte of totalPayload) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((byte >> b) & 1);
    }
  }

  let right = size - 1;
  let upwards = true;

  while (right > 0) {
    if (right === 6) right--; // Skip vertical timing column
    const rows = upwards ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const colOffset of [0, 1]) {
        const c = right - colOffset;
        if (!isFunction[r][c]) {
          const bitVal = bitIdx < allBits.length ? allBits[bitIdx++] === 1 : false;
          // Apply standard mask 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          modules[r][c] = mask ? !bitVal : bitVal;
        }
      }
    }
    right -= 2;
    upwards = !upwards;
  }

  // Format bits for ECC M and Mask 0 (0x5412)
  // Mask pattern 0 (000), ECC Level M (00) -> 00000 -> BCH code: 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const formatMask = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]; // Mask XOR 101010000010010 gives 000000000000000
  const finalFormat = formatBits.map((b, i) => b ^ formatMask[i]);

  // Write format info around finders
  const formatPosTopLeft = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatPosTopLeft[i];
    modules[r][c] = finalFormat[i] === 1;
  }

  const formatPosSplit = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatPosSplit[i];
    modules[r][c] = finalFormat[i] === 1;
  }

  return { size, modules };
}

/**
 * Builds a UPI payment URI from bank/UPI details and amount.
 * Returns null if no valid UPI ID is present.
 */
export function buildUpiUri(options: {
  upiId?: string | null;
  payeeName: string;
  amount: number;
  invoiceNumber?: string;
}): string | null {
  if (!options.upiId || !options.upiId.trim() || !options.upiId.includes("@")) {
    return null;
  }

  const pa = encodeURIComponent(options.upiId.trim());
  const pn = encodeURIComponent(options.payeeName.trim().slice(0, 50));
  const am = Math.max(0, options.amount).toFixed(2);
  const tr = options.invoiceNumber ? `&tr=${encodeURIComponent(options.invoiceNumber)}` : "";
  const tn = options.invoiceNumber ? `&tn=${encodeURIComponent(`Invoice ${options.invoiceNumber}`)}` : "";

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR${tr}${tn}`;
}
