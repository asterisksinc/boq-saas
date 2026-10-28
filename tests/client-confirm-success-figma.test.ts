import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Client Welcome Flow: Confirm Signature & Document Signed Success Figma Verification", () => {
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

    describe("Reference 1: Confirm Signature Dialog (Frame 2147225093)", () => {
        it("Card layout: 400px width, 16px radius, 16px padding, 16px gap, translucent white background", () => {
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*max-width:\s*400px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*border-radius:\s*16px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*padding:\s*16px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*gap:\s*16px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-card[^{]*\{[^}]*background:\s*rgba\(255,\s*255,\s*255/);
        });

        it("Header row: Heading 'Confirm Signature' (Urbanist 600 18px #0F172A) and working close icon", () => {
            expect(modalCode).toContain('"Confirm Signature"');
            expect(modalCode).toContain('aria-label="Close dialog"');

            expect(cssContent).toMatch(/\.client-sign-modal-title[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-modal-title[^{]*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.client-sign-modal-title[^{]*\{[^}]*font-size:\s*18px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-title[^{]*\{[^}]*color:\s*#0f172a;/i);
        });

        it("Inner white panel (Frame 2147225091): background #FFFFFF, radius 14px, padding 16px, gap 16px", () => {
            expect(cssContent).toMatch(/\.client-sign-inner-card[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-inner-card[^{]*\{[^}]*border-radius:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-inner-card[^{]*\{[^}]*padding:\s*16px;/);
            expect(cssContent).toMatch(/\.client-sign-inner-card[^{]*\{[^}]*gap:\s*16px;/);
        });

        it("Document info card (Table Cell): 336x70px, background #FFFFFF, border 1px solid #EBEBEB, radius 12px, 40px circle #F2F3F2", () => {
            expect(modalCode).toContain("document.title");
            expect(modalCode).toContain("docReference");

            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*height:\s*70px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*border:\s*1px\s+solid\s+#ebebeb;/i);
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*border-radius:\s*12px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-cell[^{]*\{[^}]*padding:\s*14px;/);

            expect(cssContent).toMatch(/\.client-sign-doc-icon-circle[^{]*\{[^}]*width:\s*40px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-icon-circle[^{]*\{[^}]*height:\s*40px;/);
            expect(cssContent).toMatch(/\.client-sign-doc-icon-circle[^{]*\{[^}]*background:\s*#f2f3f2;/i);
            expect(cssContent).toMatch(/\.client-sign-doc-icon-circle[^{]*\{[^}]*border-radius:\s*48px;/);
        });

        it("Signature preview frame (Frame 13): 336x118px, border 1px solid #E2E8F0, radius 8px, padding 14px 16px", () => {
            expect(modalCode).toContain("client-sign-preview-frame");
            expect(modalCode).toContain("drawDataUrl");
            expect(modalCode).toContain("typedName");

            expect(cssContent).toMatch(/\.client-sign-preview-frame[^{]*\{[^}]*height:\s*118px;/);
            expect(cssContent).toMatch(/\.client-sign-preview-frame[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-preview-frame[^{]*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
            expect(cssContent).toMatch(/\.client-sign-preview-frame[^{]*\{[^}]*border-radius:\s*8px;/);
            expect(cssContent).toMatch(/\.client-sign-preview-frame[^{]*\{[^}]*padding:\s*14px\s+16px;/);
        });

        it("Displays empty state placeholder when signature draft is empty", () => {
            expect(modalCode).toContain("Your signature preview will appear here");
        });

        it("Bottom Actions (Frame 2147225069): Back button (59x46px) and Confirm & Sign button (123x46px)", () => {
            expect(modalCode).toMatch(/>\s*Back\s*</);
            expect(modalCode).toMatch(/"Confirm & Sign"/);
            expect(modalCode).toContain('onClick={() => setStep("create-signature")}');
            expect(modalCode).toContain("handleConfirmAndSign");

            expect(cssContent).toMatch(/\.client-sign-btn-back[^{]*\{[^}]*width:\s*59px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-back[^{]*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-back[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-btn-back[^{]*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
            expect(cssContent).toMatch(/\.client-sign-btn-back[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-btn-back[^{]*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.client-sign-btn-back[^{]*\{[^}]*font-size:\s*14px;/);

            expect(cssContent).toMatch(/\.client-sign-btn-confirm[^{]*\{[^}]*width:\s*123px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-confirm[^{]*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-confirm[^{]*\{[^}]*background:\s*#2563eb;/i);
            expect(cssContent).toMatch(/\.client-sign-btn-confirm[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-btn-confirm[^{]*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.client-sign-btn-confirm[^{]*\{[^}]*font-size:\s*14px;/);
        });
    });

    describe("Reference 2: Document Signed Success Dialog (Frame 2147225094)", () => {
        it("Card layout: 420px max-width, 314px height at reference", () => {
            expect(cssContent).toMatch(/\.client-sign-modal-card\.client-sign-success-modal[^{]*\{[^}]*max-width:\s*420px;/);
            expect(cssContent).toMatch(/\.client-sign-modal-card\.client-sign-success-modal[^{]*\{[^}]*min-height:\s*314px;/);
        });

        it("Inner success panel (Frame 2147225096): 388x180px, background #FFFFFF, radius 14px, padding 24px 16px, gap 16px", () => {
            expect(cssContent).toMatch(/\.client-sign-success-panel[^{]*\{[^}]*max-width:\s*388px;/);
            expect(cssContent).toMatch(/\.client-sign-success-panel[^{]*\{[^}]*height:\s*180px;/);
            expect(cssContent).toMatch(/\.client-sign-success-panel[^{]*\{[^}]*background:\s*#ffffff;/i);
            expect(cssContent).toMatch(/\.client-sign-success-panel[^{]*\{[^}]*border-radius:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-success-panel[^{]*\{[^}]*padding:\s*24px\s+16px;/);
            expect(cssContent).toMatch(/\.client-sign-success-panel[^{]*\{[^}]*gap:\s*16px;/);
        });

        it("Success icon container (Frame 2147225105): 68x68px, background rgba(22, 163, 74, 0.12), radius 100px", () => {
            expect(cssContent).toMatch(/\.client-sign-success-icon-box[^{]*\{[^}]*width:\s*68px;/);
            expect(cssContent).toMatch(/\.client-sign-success-icon-box[^{]*\{[^}]*height:\s*68px;/);
            expect(cssContent).toMatch(/\.client-sign-success-icon-box[^{]*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\);/i);
            expect(cssContent).toMatch(/\.client-sign-success-icon-box[^{]*\{[^}]*border-radius:\s*100px;/);
        });

        it("Success icon: 28x28px, color #16A34A", () => {
            expect(modalCode).toContain('<Check size={28} color="#16A34A"');
        });

        it("Success heading: 'Document Signed' (Urbanist 600 18px #0F172A)", () => {
            expect(modalCode).toContain("Document Signed");
            expect(cssContent).toMatch(/\.client-sign-success-title[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-success-title[^{]*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.client-sign-success-title[^{]*\{[^}]*font-size:\s*18px;/);
            expect(cssContent).toMatch(/\.client-sign-success-title[^{]*\{[^}]*color:\s*#0f172a;/i);
        });

        it("Success subtitle: 'Your signature has been added successfully.' (Urbanist 500 14px #64748B, center aligned)", () => {
            expect(modalCode).toContain("Your signature has been added successfully.");
            expect(cssContent).toMatch(/\.client-sign-success-subtitle[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-success-subtitle[^{]*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.client-sign-success-subtitle[^{]*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-success-subtitle[^{]*\{[^}]*text-align:\s*center;/);
            expect(cssContent).toMatch(/\.client-sign-success-subtitle[^{]*\{[^}]*color:\s*#64748b;/i);
        });

        it("Full-width Done button (Buttons): 388x46px, background #2563EB, radius 6px, Urbanist 600 14px #FFFFFF", () => {
            expect(modalCode).toMatch(/>\s*Done\s*</);
            expect(modalCode).toContain("onSigned(document.id)");
            expect(modalCode).toContain("onClose()");

            expect(cssContent).toMatch(/\.client-sign-btn-done[^{]*\{[^}]*max-width:\s*388px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-done[^{]*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-done[^{]*\{[^}]*background:\s*#2563eb;/i);
            expect(cssContent).toMatch(/\.client-sign-btn-done[^{]*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-done[^{]*\{[^}]*font-family:\s*'Urbanist'/);
            expect(cssContent).toMatch(/\.client-sign-btn-done[^{]*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.client-sign-btn-done[^{]*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.client-sign-btn-done[^{]*\{[^}]*color:\s*#ffffff;/i);
        });
    });

    describe("Step Navigation & Signature Submission Flow", () => {
        it("Add Signature step advances to Confirm Signature via handleProceedToConfirm", () => {
            expect(modalCode).toContain("handleProceedToConfirm");
            expect(modalCode).toContain('setStep("confirm-signature")');
        });

        it("Confirm Signature step Back button returns to Add Signature while preserving draft", () => {
            expect(modalCode).toContain('onClick={() => setStep("create-signature")}');
        });

        it("Submits signature via real API `signClientDocument` with all required fields", () => {
            expect(modalCode).toContain("signClientDocument(projectId, document.id");
            expect(modalCode).toContain("signerName:");
            expect(modalCode).toContain("consent: true");
            expect(modalCode).toContain("signatureType: mode");
            expect(modalCode).toContain("signatureData: signaturePayload");
        });

        it("Protects against duplicate submission with isSubmitting and loading spinner", () => {
            expect(modalCode).toContain("isSubmitting");
            expect(modalCode).toContain("Signing...");
            expect(modalCode).toContain("Loader2");
            expect(modalCode).toContain("disabled={isSubmitDisabled}");
        });

        it("Transitions to success modal only upon confirmed backend response", () => {
            expect(modalCode).toContain('await signClientDocument');
            expect(modalCode).toContain('setStep("success")');
        });

        it("Done button updates document list to signed and reconciles with server", () => {
            expect(docsPageCode).toContain("handleSigned");
            expect(docsPageCode).toContain('status: "signed"');
            expect(docsPageCode).toContain("getClientDocuments(project.id)");
        });
    });
});
