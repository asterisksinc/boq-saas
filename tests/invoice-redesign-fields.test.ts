import { describe, expect, it } from "vitest";
import { amountInWords } from "../lib/invoices/amount-words";
import { buildUpiUri, encodeQr } from "../lib/invoices/qr-generator";

describe("Invoice Redesign Fields & Calculations", () => {
  it("formats Indian currency amounts in words with paise correctly", () => {
    expect(amountInWords(0)).toBe("INR Zero Rupees Only");
    expect(amountInWords(25000)).toBe("INR Twenty Five Thousand Rupees Only");
    expect(amountInWords(1250000)).toBe("INR Twelve Lakh Fifty Thousand Rupees Only");
    expect(amountInWords(10000000)).toBe("INR One Crore Rupees Only");
    expect(amountInWords(23500.5)).toBe("INR Twenty Three Thousand Five Hundred Rupees and Fifty Paise Only");
  });

  it("builds a valid UPI payment URI when upiId is present", () => {
    const uri = buildUpiUri({
      payeeName: "Apex Fitouts Pvt Ltd",
      upiId: "apexfitouts@okaxis",
      amount: 147500,
      invoiceNumber: "INV-2026-001",
    });
    expect(uri).not.toBeNull();
    expect(uri).toContain("upi://pay?");
    expect(uri).toContain("pa=apexfitouts%40okaxis");
    expect(uri).toContain("am=147500.00");
    expect(uri).toContain("cu=INR");
  });

  it("returns null for buildUpiUri when upiId is invalid or missing", () => {
    expect(buildUpiUri({ payeeName: "Test", upiId: "", amount: 100 })).toBeNull();
    expect(buildUpiUri({ payeeName: "Test", upiId: "invalid-id-without-at", amount: 100 })).toBeNull();
    expect(buildUpiUri({ payeeName: "Test", upiId: undefined, amount: 100 })).toBeNull();
  });

  it("encodes valid QR module matrix from UPI URI", () => {
    const uri = buildUpiUri({
      payeeName: "Apex Fitouts",
      upiId: "apex@upi",
      amount: 5000,
    });
    expect(uri).toBeTruthy();
    const qr = encodeQr(uri!);
    expect(qr).not.toBeNull();
    if (!qr) return;

    expect(qr.size).toBeGreaterThan(20);
    expect(qr.modules.length).toBe(qr.size);
    expect(qr.modules[0].length).toBe(qr.size);
    // Finders check (top-left 7x7 corner has true outer ring)
    expect(qr.modules[0][0]).toBe(true);
    expect(qr.modules[0][6]).toBe(true);
    expect(qr.modules[6][0]).toBe(true);
  });

  it("calculates item-level taxable amounts and tax with proper decimal rounding", () => {
    const items = [
      { quantity: 2, rate: 50000, taxRate: 18 },
      { quantity: 10, rate: 1250.5, taxRate: 12 },
      { quantity: 5, rate: 450, taxRate: 5 },
    ];

    const results = items.map((it) => {
      const taxable = Math.round(it.quantity * it.rate * 100) / 100;
      const tax = Math.round((taxable * it.taxRate) / 100 * 100) / 100;
      return { taxable, tax, total: Math.round((taxable + tax) * 100) / 100 };
    });

    expect(results[0]).toEqual({ taxable: 100000, tax: 18000, total: 118000 });
    expect(results[1]).toEqual({ taxable: 12505, tax: 1500.6, total: 14005.6 });
    expect(results[2]).toEqual({ taxable: 2250, tax: 112.5, total: 2362.5 });

    const subtotal = results.reduce((acc, r) => acc + r.taxable, 0);
    const totalTax = results.reduce((acc, r) => acc + r.tax, 0);
    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

    expect(subtotal).toBe(114755);
    expect(totalTax).toBe(19613.1);
    expect(grandTotal).toBe(134368.1);
  });
});
