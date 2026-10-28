import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Client Welcome Flow: Sign Document & Add Signature Modals Figma Verification", () => {
    const modalPath = join(process.cwd(), "components", "client", "DocumentSignModal.tsx");
    const docsPagePath = join(process.cwd(), "app", "client", "onboarding", "documents", "page.tsx");
    const cssPath = join(process.cwd(), "app", "globals.css");

    it("verifies required files exist", () => {
        expect(existsSync(modalPath), "components/client/DocumentSignModal.tsx must exist").toBe(true);
        expect(existsSync(docsPagePath), "app/client/onboarding/documents/page.tsx must exist").toBe(true);
        expect(existsSync(cssPath), "app/globals.css must exist").toBe(true);
    });

    const modalCode = readFileSync(modalPath, "utf-8");
    const docsPageCode = readFileSync(docsPagePath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    describe("Modal Backdrop & Container (Rectangle 69 & Frame 2147225093)", () => {
        it("Backdrop: rgba(0, 0, 0, 0.2) with 7px blur and fixed overlay", () => {
            expect(cssContent).toMatch(/\.client-sign-backdrop[^{]*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.2\);/i);
            expect(cssContent).toMatch(/\.client-sign-backdrop[^{]*\{[^}]*backdrop-filter:\s*blur\(7px\);/i);
            expect(cssContent).toMatch(/\.client-sign-backdrop[^{]*\{[^}]*position:\s*fixed;/);
            expect(cssContent).toMatch(/\.client-sign-backdrop[^{]*\{[^}]*inset:\s*0;/);
            expect(cssContent).toMatch(/\.client-sign-backdrop[^{]*\{[^}]*z-index:\s*1000;/);
        });

        it("Modal Card: width 400px, 16px radius, 16px padding, 16px gap", () => {
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*max-width:\s*400px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*border-radius:\s*16px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*padding:\s*16px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*gap:\s*16px;/);
        });

        it("Inner Card (Frame 2147225091): background #FFFFFF, radius 14px, padding 16px, gap 16px", () => {
            expect(cssContent).toMatch(/\.client-sign-inner-card[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-inner-card[^{]*\{[^}]*border-radius:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-inner-card[^{]*\{[^}]*padding:\s*16px;/);
            expect(cssContent).toMatch(/\.client-sign-inner-card[^{]*\{[^}]*gap:\s*16px;/);
        });
    });

    describe("Modal 1: Sign Document Confirmation Dialog", () => {
        it("Title: 'Sign Document' (Urbanist 600 18px #0F172A)", () => {
            expect(modalCode).toContain('"Sign Document"');
            expect(cssContent).toMatch(/\.client-sign-modal-title[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-modal-title[^{]*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.client-sign-modal-title[^{]*\{[^}]*font-size:\s*18px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-title[^{]*\{[^}]*color:\s*#0f172a;/i);
        });

        it("Document Table Cell: height 70px, background #FFFFFF, border 1px solid #EBEBEB, radius 12px, padding 14px", () => {
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*height:\s*70px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*border:\s*1px\s+solid\s+#ebebeb;/i);
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*border-radius:\s*12px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*padding:\s*14px;/);
        });

        it("Circular Icon Box (Frame 74): 40x40px, background #F2F3F2, radius 48px", () => {
            expect(cssContent).toMatch(/\.client-sign-doc-icon-circle[^{]*\{[^}]*width:\s*40px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-icon-circle[^{]*\{[^}]*height:\s*40px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-icon-circle[^{]*\{[^}]*background:\s*#f2f3f2;/i);
            expect(cssContent).toMatch(/\.client-sign-doc-icon-circle[^{]*\{[^}]*border-radius:\s*48px;/);
        });

        it("Document details: Title Urbanist 600 16px #0F172A, Reference Urbanist 500 14px #64748B", () => {
            expect(cssContent).toMatch(/\.client-sign-doc-name[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-doc-name[^{]*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.client-sign-doc-name[^{]*\{[^}]*font-size:\s*16px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-name[^{]*\{[^}]*color:\s*#0f172a;/i);

            expect(cssContent).toMatch(/\.client-sign-doc-ref[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-doc-ref[^{]*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.client-sign-doc-ref[^{]*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-ref[^{]*\{[^}]*color:\s*#64748b;/i);
        });

        it("Agreement disclaimer: 'By signing this document, you confirm that you have reviewed and agreed to its contents.' (Urbanist 400 14px #64748B)", () => {
            expect(modalCode).toContain(
                "By signing this document, you confirm that you have reviewed and agreed to its contents."
            );
            expect(cssContent).toMatch(/\.client-sign-disclaimer[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-disclaimer[^{]*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-disclaimer[^{]*\{[^}]*color:\s*#64748b;/i);
        });

        it("Checkbox row (Frame 249): 20x20px, radius 4px, label: 'I have reviewed this document and agree to sign it.'", () => {
            expect(modalCode).toContain("I have reviewed this document and agree to sign it.");
            expect(cssContent).toMatch(/\.client-sign-checkbox-input[^{]*\{[^}]*width:\s*20px;/);
            expect(cssContent).toMatch(/\.client-sign-checkbox-input[^{]*\{[^}]*height:\s*20px;/);
            expect(cssContent).toMatch(/\.client-sign-checkbox-input[^{]*\{[^}]*border-radius:\s*4px;/);
            expect(cssContent).toMatch(/\.client-sign-checkbox-label[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-checkbox-label[^{]*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-checkbox-label[^{]*\{[^}]*color:\s*#64748b;/i);
        });

        it("Actions (Frame 2147225069): Cancel (71x46px) and Add Signature (119x46px, disabled when not agreed)", () => {
            expect(modalCode).toContain('disabled={!acknowledged}');
            expect(modalCode).toContain('onClick={() => setStep("create-signature")}');

            expect(cssContent).toMatch(/\.client-sign-btn-cancel[^{]*\{[^}]*width:\s*71px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-cancel[^{]*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-cancel[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-btn-cancel[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-btn-cancel[^{]*\{[^}]*font-size:\s*14px;/);

            expect(cssContent).toMatch(/\.client-sign-btn-primary[^{]*\{[^}]*width:\s*119px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-primary[^{]*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-primary[^{]*\{[^}]*background:\s*#2563eb;/i);
            expect(cssContent).toMatch(/\.client-sign-btn-primary[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-btn-primary[^{]*\{[^}]*font-size:\s*14px;/);
        });
    });

    describe("Modal 2: Add Signature Dialog", () => {
        it("Title: 'Add Signature' (Urbanist 600 18px #0F172A)", () => {
            expect(modalCode).toContain('"Add Signature"');
        });

        it("Mode Tabs (Buttons container): 336x46px, border 1px solid #E2E8F0, radius 6px, padding 6px", () => {
            expect(cssContent).toMatch(/\.client-sign-tab-container[^{]*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.client-sign-tab-container[^{]*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
            expect(cssContent).toMatch(/\.client-sign-tab-container[^{]*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.client-sign-tab-container[^{]*\{[^}]*padding:\s*6px;/);
        });

        it("Draw and Type tabs: active #EFF6FF / #2563EB, inactive #64748B, Urbanist 600 14px", () => {
            expect(modalCode).toMatch(/>\s*Draw\s*</);
            expect(modalCode).toMatch(/>\s*Type\s*</);
            expect(modalCode).toContain('onClick={() => setMode("draw")}');
            expect(modalCode).toContain('onClick={() => setMode("type")}');

            expect(cssContent).toMatch(/\.client-sign-tab-btn[^{]*\{[^}]*height:\s*34px;/);
            expect(cssContent).toMatch(/\.client-sign-tab-btn[^{]*\{[^}]*border-radius:\s*4px;/);
            expect(cssContent).toMatch(/\.client-sign-tab-btn[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-tab-btn[^{]*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-tab-btn\.active[^{]*\{[^}]*background:\s*#eff6ff;/i);
            expect(cssContent).toMatch(/\.client-sign-tab-btn\.active[^{]*\{[^}]*color:\s*#2563eb;/i);
        });

        it("Draw Mode: Label 'Draw your signature below.' and Canvas container (height 142px, radius 8px, touch-action none)", () => {
            expect(modalCode).toContain("Draw your signature below.");
            expect(modalCode).toContain("<canvas");
            expect(modalCode).toContain("onPointerDown");
            expect(modalCode).toContain("onPointerMove");
            expect(modalCode).toContain("onPointerUp");

            expect(cssContent).toMatch(/\.client-sign-draw-label[^{]*\{[^}]*font-family:\s*'Inter'/);
            expect(cssContent).toMatch(/\.client-sign-draw-label[^{]*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-draw-label[^{]*\{[^}]*color:\s*#0f172a;/i);

            expect(cssContent).toMatch(/\.client-sign-canvas-frame[^{]*\{[^}]*height:\s*142px;/);
            expect(cssContent).toMatch(/\.client-sign-canvas-frame[^{]*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
            expect(cssContent).toMatch(/\.client-sign-canvas-frame[^{]*\{[^}]*border-radius:\s*8px;/);
            expect(cssContent).toMatch(/\.client-sign-canvas-frame\s+canvas[^{]*\{[^}]*touch-action:\s*none;/);
        });

        it("Type Mode: Text input with live cursive preview font and empty placeholder text", () => {
            expect(modalCode).toContain('placeholder="Type your name here"');
            expect(modalCode).toContain("Your signature preview will appear here");
            expect(cssContent).toMatch(/\.client-sign-cursive-text[^{]*\{[^}]*font-family:[^;]*cursive/);
        });

        it("Actions: Clear button (63x46px), Cancel button (71x46px), and Add Signature submit button (119x46px)", () => {
            expect(modalCode).toMatch(/>\s*Clear\s*</);
            expect(modalCode).toMatch(/>\s*Cancel\s*</);
            expect(modalCode).toContain('"Add Signature"');
            expect(modalCode).toContain("handleConfirmAndSign");

            expect(cssContent).toMatch(/\.client-sign-btn-clear[^{]*\{[^}]*width:\s*63px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-clear[^{]*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-clear[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-btn-clear[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-btn-clear[^{]*\{[^}]*font-size:\s*14px;/);
        });
    });

    describe("Backend Integration & Signature Validation", () => {
        it("Submits signature via real API `signClientDocument`", () => {
            expect(modalCode).toContain("signClientDocument(");
            expect(modalCode).toContain("signerName:");
            expect(modalCode).toContain("consent: true");
            expect(modalCode).toContain("signatureType: mode");
            expect(modalCode).toContain("signatureData:");
        });

        it("Disables submit when canvas is empty or typed name is empty", () => {
            expect(modalCode).toContain("isSubmitDisabled");
            expect(modalCode).toContain("isCanvasEmpty");
            expect(modalCode).toContain("!typedName.trim()");
            expect(modalCode).toContain("disabled={isSubmitDisabled}");
        });

        it("Protects against duplicate submissions and renders loading indicator", () => {
            expect(modalCode).toContain("isSubmitting");
            expect(modalCode).toContain("Signing...");
            expect(modalCode).toContain("Loader2");
        });

        it("Displays server error message when signing fails", () => {
            expect(modalCode).toContain("client-sign-error-banner");
            expect(modalCode).toContain("AlertCircle");
        });

        it("Success State: displays 'Document Signed', 'Your signature has been added successfully.', and 'Done' button", () => {
            expect(modalCode).toContain("Document Signed");
            expect(modalCode).toContain("Your signature has been added successfully.");
            expect(modalCode).toContain("Done");
            expect(modalCode).toContain("onSigned(document.id)");
        });

        it("Documents step: handles list refresh gracefully with non-blocking warning and retry option", () => {
            expect(docsPageCode).toContain("refreshWarning");
            expect(docsPageCode).toContain("Your document was signed successfully, but we could not refresh the list");
            expect(docsPageCode).toContain("Retry");
        });
    });
});
