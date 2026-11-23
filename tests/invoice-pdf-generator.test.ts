import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { generateInvoicePdf, type InvoicePdfData } from "../lib/invoices/invoice-pdf-generator";
import { amountInWords } from "../lib/invoices/amount-words";
import { buildUpiUri, encodeQr } from "../lib/invoices/qr-generator";

describe("Amount in Words (Indian Currency Formatter)", () => {
  it("formats zero rupees correctly", () => {
    expect(amountInWords(0)).toBe("INR Zero Rupees Only");
  });

  it("formats exact thousands and ten thousands matching reference", () => {
    expect(amountInWords(10000)).toBe("INR Ten Thousand Rupees Only");
    expect(amountInWords(50000)).toBe("INR Fifty Thousand Rupees Only");
  });

  it("formats lakhs and crores correctly", () => {
    expect(amountInWords(100000)).toBe("INR One Lakh Rupees Only");
    expect(amountInWords(2500000)).toBe("INR Twenty Five Lakh Rupees Only");
    expect(amountInWords(10000000)).toBe("INR One Crore Rupees Only");
    expect(amountInWords(12500000)).toBe("INR One Crore Twenty Five Lakh Rupees Only");
  });

  it("formats rupees and paise correctly", () => {
    expect(amountInWords(12345.50)).toBe("INR Twelve Thousand Three Hundred Forty Five Rupees and Fifty Paise Only");
    expect(amountInWords(100.05)).toBe("INR One Hundred Rupees and Five Paise Only");
  });
});

describe("UPI QR Code Generator", () => {
  it("builds valid UPI URI and generates QR matrix when valid UPI ID exists", () => {
    const uri = buildUpiUri({
      upiId: "merchant@okhdfcbank",
      payeeName: "Your Company",
      amount: 10000,
      invoiceNumber: "INV-0001",
    });
    expect(uri).toBeTruthy();
    expect(uri).toContain("upi://pay");
    expect(uri).toContain("pa=merchant%40okhdfcbank");

    const qr = encodeQr(uri!);
    expect(qr).not.toBeNull();
    expect(qr?.size).toBeGreaterThan(20);
    expect(qr?.modules.length).toBe(qr?.size);
  });

  it("returns null if UPI ID is missing or invalid", () => {
    expect(buildUpiUri({ upiId: "", payeeName: "Co", amount: 100 })).toBeNull();
    expect(buildUpiUri({ upiId: "invalid-no-at", payeeName: "Co", amount: 100 })).toBeNull();
  });
});

describe("Invoice PDF Generation (Reference Redesign Parity)", () => {
  const sampleInvoice: InvoicePdfData = {
    invoiceNumber: "AST-28-INV",
    type: "invoice",
    issueDate: "2026-11-21",
    dueDate: "2026-11-28",
    milestone: "Execution Milestone",
    ewayBillNumber: "EB-9876543210",
    placeOfSupply: "Telangana",
    placeOfSupplyCode: "36",
    clientName: "DataCircles Technology",
    billingAddress: {
      line1: "Sujeets Cricket Academy Rd",
      line2: "C-507, Shwetha Shubham, K.V.Rangareddy",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500100",
      country: "India",
    },
    buyerGstin: "36AAACD1234F1Z5",
    shipToName: "DataCircles Technology",
    shipToAddress: {
      line1: "Sujeets Cricket Academy Rd",
      line2: "C-507, Shwetha Shubham",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500100",
      country: "India",
    },
    items: [
      {
        position: 1,
        description: "Ui/Ux Design - Landing Page Design\nAdditional information goes here",
        hsnSacCode: "998314",
        unit: "OTHERS",
        quantity: 1,
        rate: 10000,
        amount: 10000,
        taxRate: 18,
        taxAmount: 1800,
        taxableAmount: 10000,
      },
    ],
    subtotal: 10000,
    taxRate: 18,
    taxAmount: 1800,
    totalAmount: 11800,
    currency: "INR",
    additionalNotes: "Thank you for your business!\nThe user can add notes to the invoice here",
    termsAndConditions: "1. Payment is due within 7 days.\n2. Goods once sold will not be taken back.\n3. Subject to Armoor jurisdiction.",
    bankDetails: {
      bankName: "State Bank of India",
      accountHolder: "Your Company",
      accountNumber: "43707583434",
      ifscCode: "SBIN0020100",
      branch: "SIDDIPET",
    },
    organizationSnapshot: {
      name: "Your Company",
      tradeName: "Your Company",
      legalName: "Your Company Private Limited",
      gstin: "36AAAAA0000A1Z5",
      address: {
        line1: "H No 3-2-83, Opp MM Court",
        city: "Armoor",
        state: "Telangana",
        pincode: "503224",
        country: "India",
      },
      bankDetails: {
        bankName: "State Bank of India",
        accountHolder: "Your Company",
        accountNumber: "43707583434",
        ifscCode: "SBIN0020100",
        branch: "SIDDIPET",
      },
    },
  };

  it("generates a valid, standards-compliant PDF 1.4 document", async () => {
    const pdfBytes = await generateInvoicePdf(sampleInvoice);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    const pdfString = Buffer.from(pdfBytes).toString("latin1");
    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString).toContain("%%EOF");
    expect(pdfString).toContain("/Type /Catalog");
    expect(pdfString).toContain("/Type /Pages");
    expect(pdfString).toContain("AST-28-INV");
    expect(pdfString).toContain("DataCircles Technology");
    expect(pdfString).toContain("ORIGINAL FOR RECIPIENT");
    expect(pdfString).toContain("PLACE OF SUPPLY");
    expect(pdfString).toContain("Telangana \\(36\\)");
    expect(pdfString).toContain("Authorised Signatory");
    expect(pdfString).toContain("This is a digitally signed document.");
  });

  it("handles missing optional fields without throwing errors", async () => {
    const minimalInvoice: InvoicePdfData = {
      invoiceNumber: "INV-0001",
      issueDate: "2026-11-23",
      dueDate: "2026-12-08",
      clientName: "Minimal Client",
      items: [{ description: "Basic Item", quantity: 1, rate: 500 }],
      subtotal: 500,
      taxRate: 18,
      taxAmount: 90,
      totalAmount: 590,
    };

    const pdfBytes = await generateInvoicePdf(minimalInvoice);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const pdfString = Buffer.from(pdfBytes).toString("latin1");
    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString).toContain("INV-0001");
    expect(pdfString).toContain("Minimal Client");
  });

  it("handles multi-page overflow cleanly when many items are present", async () => {
    const manyItems = Array.from({ length: 30 }, (_, i) => ({
      position: i + 1,
      description: `Custom Fit-Out Item Number ${i + 1} with extensive detail description text`,
      quantity: i + 1,
      rate: 100 * (i + 1),
      amount: 100 * (i + 1) * (i + 1),
    }));

    const bigInvoice: InvoicePdfData = {
      ...sampleInvoice,
      items: manyItems,
      totalAmount: 100000,
    };

    const pdfBytes = await generateInvoicePdf(bigInvoice);
    const pdfString = Buffer.from(pdfBytes).toString("latin1");
    expect(pdfString).toContain("/Count 2"); // At least 2 pages
    expect(pdfString).toContain("Page 1 / 2");
    expect(pdfString).toContain("Page 2 / 2");
  });

  it("faithfully renders INV-0022 regression case with tax-inclusive item amounts, metadata, payment mode, and horizontal signature", async () => {
    // Read actual signature.jpg with EXIF orientation 8
    const sigPath = fs.existsSync(path.resolve(__dirname, "fixtures/signature.jpg"))
      ? path.resolve(__dirname, "fixtures/signature.jpg")
      : path.resolve(__dirname, "../signature.jpg");
    const realSigBuf = fs.readFileSync(sigPath);
    const sigDataUrl = `data:image/jpeg;base64,${realSigBuf.toString("base64")}`;

    const inv22: InvoicePdfData = {
      invoiceNumber: "INV-0022",
      type: "invoice",
      issueDate: "2026-11-23",
      dueDate: "2026-12-08",
      milestone: "BOQ #BOQ-0001 Execution",
      reference: "PO-1234",
      ewayBillNumber: "EB-241289012345",
      placeOfSupply: "Telangana",
      placeOfSupplyCode: "36",
      clientName: "ABC Constructions",
      billingAddress: {
        line1: "HYDERABAD,TELENGANA",
        city: "HYDERABAD",
        state: "TELENGANA",
        pincode: "696969",
        country: "India",
      },
      buyerGstin: "36AAACB1234F1Z5",
      shipToName: "ABC Constructions",
      shipToAddress: {
        line1: "HYDERABAD,TELENGANA",
        city: "HYDERABAD",
        state: "TELENGANA",
        pincode: "696969",
        country: "India",
        gstin: "36AAACB1234F1Z5",
      },
      items: [
        {
          position: 1,
          description: "Normal Bedroom - NORMAL BED",
          quantity: 1,
          rate: 10000,
          amount: 11800,
          taxableAmount: 10000,
          taxRate: 18,
          taxAmount: 1800,
          unit: "NOS",
          hsnSacCode: null,
        },
        {
          position: 2,
          description: "Normal Bedroom - STUDY TABLE",
          quantity: 1,
          rate: 1000,
          amount: 1180,
          taxableAmount: 1000,
          taxRate: 18,
          taxAmount: 180,
          unit: "NOS",
          hsnSacCode: null,
        },
        {
          position: 3,
          description: "LIVING ROOM",
          quantity: 1,
          rate: 10000,
          amount: 11800,
          taxableAmount: 10000,
          taxRate: 18,
          taxAmount: 1800,
          unit: "NOS",
          hsnSacCode: null,
        },
      ],
      subtotal: 21000,
      taxRate: 18,
      taxAmount: 3780,
      totalAmount: 24780,
      currency: "INR",
      additionalNotes: "THANKS FOR THE BUSSINESS",
      termsAndConditions: "1. Payment is due within 15 days of invoice issue date.\n2. Interest @ 18% p.a. will be charged on overdue payments.\n3. Goods once sold will not be taken back or exchanged.",
      bankDetails: {
        bankName: "BANKNAMESBI",
        accountHolder: "Chandu's E-sports",
        accountNumber: "AC123456789",
        ifscCode: "IFSC1234567",
        branch: "BRANCHABC",
      },
      organizationSnapshot: {
        name: "TSM Entity Gaming",
        tradeName: "TSM Entity Gaming",
        gstin: "36AAAAA0000A1Z5",
        address: {
          line1: "Road No 36, Jubilee Hills",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500033",
          country: "India",
        },
        signatureUrl: sigDataUrl,
      },
    };

    const pdfBytes = await generateInvoicePdf(inv22);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const pdfStr = Buffer.from(pdfBytes).toString("latin1");

    // 1. Metadata checks
    expect(pdfStr).toContain("INV-0022");
    expect(pdfStr).toContain("PO-1234");
    expect(pdfStr).toContain("REF / PO NO.");
    expect(pdfStr).toContain("EB-241289012345");
    expect(pdfStr).toContain("Telangana \\(36\\)");
    expect(pdfStr).toContain("ABC Constructions");
    expect(pdfStr).toContain("36AAACB1234F1Z5");
    expect(pdfStr).toContain("HYDERABAD,TELENGANA");

    // 2. Line item amount checks: tax-inclusive line amounts
    expect(pdfStr).toContain("11,800.00");
    expect(pdfStr).toContain("1,180.00");
    expect(pdfStr).toContain("21,000.00");
    expect(pdfStr).toContain("3,780.00");
    expect(pdfStr).toContain("24,780.00");

    // 3. Amount in words
    expect(pdfStr).toContain("Twenty Four Thousand Seven Hundred Eighty Rupees Only");

    // 4. Payment mode & Bank details
    expect(pdfStr).toContain("Payment mode: Bank Transfer \\(NEFT / RTGS / IMPS\\)");
    expect(pdfStr).toContain("BANKNAMESBI");
    expect(pdfStr).toContain("AC123456789");
    expect(pdfStr).toContain("IFSC1234567");

    // 5. Notes and Terms
    expect(pdfStr).toContain("THANKS FOR THE BUSSINESS");
    expect(pdfStr).toContain("TERMS & CONDITIONS");
    expect(pdfStr).toContain("Payment is due within 15 days");

    // 6. Signature horizontal matrix rendering
    expect(pdfStr).toContain("/SigIm Do");
    // Matrix for orientation 8: "0 <height> -<width> 0 <x+width> <y> cm"
    expect(pdfStr).toMatch(/0 \d+\.\d+ -\d+\.\d+ 0 \d+\.\d+ \d+\.\d+ cm\n\/SigIm Do/);
  });
});
