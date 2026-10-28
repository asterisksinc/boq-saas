import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Client Welcome Flow: Documents Step Figma Visual & Layout Verification", () => {
    const pagePath = join(process.cwd(), "app", "client", "onboarding", "documents", "page.tsx");
    const layoutPath = join(process.cwd(), "components", "client", "ClientOnboardingLayout.tsx");
    const cssPath = join(process.cwd(), "app", "globals.css");

    it("verifies required files exist", () => {
        expect(existsSync(pagePath), "app/client/onboarding/documents/page.tsx must exist").toBe(true);
        expect(existsSync(layoutPath), "components/client/ClientOnboardingLayout.tsx must exist").toBe(true);
        expect(existsSync(cssPath), "app/globals.css must exist").toBe(true);
    });

    const pageContent = readFileSync(pagePath, "utf-8").replace(/\s+/g, " ");
    const layoutContent = readFileSync(layoutPath, "utf-8").replace(/\s+/g, " ");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("Stepper active state: Documents is active, Welcome is completed, Dashboard is upcoming", () => {
        expect(pageContent).toContain('activeStep="documents"');
        expect(pageContent).toContain('completedSteps={["welcome"]}');
        expect(layoutContent).toContain('{ id: "documents", title: "Documents", desc: "Configure a few basics." }');
    });

    it("Frame 2147225026: Heading Block matches Figma ('Review & Sign Documents' and description)", () => {
        expect(pageContent).toContain("Review &amp; Sign Documents");
        expect(pageContent).toContain(
            "Your project team has shared the following documents with you. Please review and sign them to complete your onboarding."
        );

        expect(cssContent).toMatch(/\.client-docs-title\s*\{[^}]*font-size:\s*28px;/);
        expect(cssContent).toMatch(/\.client-docs-title\s*\{[^}]*font-weight:\s*600;/);
        expect(cssContent).toMatch(/\.client-docs-title\s*\{[^}]*line-height:\s*36px;/);
        expect(cssContent).toMatch(/\.client-docs-title\s*\{[^}]*letter-spacing:\s*-0\.005em;/);
        expect(cssContent).toMatch(/\.client-docs-title\s*\{[^}]*color:\s*#0f172a;/i);

        expect(cssContent).toMatch(/\.client-docs-subtitle\s*\{[^}]*font-size:\s*16px;/);
        expect(cssContent).toMatch(/\.client-docs-subtitle\s*\{[^}]*font-weight:\s*500;/);
        expect(cssContent).toMatch(/\.client-docs-subtitle\s*\{[^}]*line-height:\s*140%;/);
        expect(cssContent).toMatch(/\.client-docs-subtitle\s*\{[^}]*color:\s*#475569;/i);
    });

    it("Frame 2147225027: Outer Document Container styling (background #F2F3F2, border 1px solid #E2E8F0, radius 20px, padding 24px, gap 18px)", () => {
        expect(cssContent).toMatch(/\.client-docs-container[^{]*\{[^}]*background:\s*#f2f3f2;/i);
        expect(cssContent).toMatch(/\.client-docs-container[^{]*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-docs-container[^{]*\{[^}]*border-radius:\s*20px;/);
        expect(cssContent).toMatch(/\.client-docs-container[^{]*\{[^}]*padding:\s*24px;/);
        expect(cssContent).toMatch(/\.client-docs-container[^{]*\{[^}]*gap:\s*18px;/);
    });

    it("Inner Document Card (Frame 2147225027 / Frame 2147225503): background #FFFFFF, border 1px solid #E2E8F0, radius 20px, padding 24px, gap 18px", () => {
        expect(cssContent).toMatch(/\.client-doc-card-figma[^{]*\{[^}]*background:\s*#ffffff;/i);
        expect(cssContent).toMatch(/\.client-doc-card-figma[^{]*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-doc-card-figma[^{]*\{[^}]*border-radius:\s*20px;/);
        expect(cssContent).toMatch(/\.client-doc-card-figma[^{]*\{[^}]*padding:\s*24px;/);
        expect(cssContent).toMatch(/\.client-doc-card-figma[^{]*\{[^}]*gap:\s*18px;/);
    });

    it("Frame 26: Document Icon Box (56x56px, background #F1F5F9, radius 8px, inner icon #2563EB)", () => {
        expect(cssContent).toMatch(/\.client-doc-icon-box[^{]*\{[^}]*width:\s*56px;/);
        expect(cssContent).toMatch(/\.client-doc-icon-box[^{]*\{[^}]*height:\s*56px;/);
        expect(cssContent).toMatch(/\.client-doc-icon-box[^{]*\{[^}]*background:\s*#f1f5f9;/i);
        expect(cssContent).toMatch(/\.client-doc-icon-box[^{]*\{[^}]*border-radius:\s*8px;/);
    });

    it("Document metadata typography: Title Inter 600 18px #0F172A, Reference Inter 500 16px #475569", () => {
        expect(cssContent).toMatch(/\.client-doc-title-text[^{]*\{[^}]*font-size:\s*18px;/);
        expect(cssContent).toMatch(/\.client-doc-title-text[^{]*\{[^}]*font-weight:\s*600;/);
        expect(cssContent).toMatch(/\.client-doc-title-text[^{]*\{[^}]*letter-spacing:\s*-0\.005em;/);
        expect(cssContent).toMatch(/\.client-doc-title-text[^{]*\{[^}]*color:\s*#0f172a;/i);

        expect(cssContent).toMatch(/\.client-doc-ref-text[^{]*\{[^}]*font-size:\s*16px;/);
        expect(cssContent).toMatch(/\.client-doc-ref-text[^{]*\{[^}]*font-weight:\s*500;/);
        expect(cssContent).toMatch(/\.client-doc-ref-text[^{]*\{[^}]*line-height:\s*140%;/);
        expect(cssContent).toMatch(/\.client-doc-ref-text[^{]*\{[^}]*color:\s*#475569;/i);
    });

    it("Frame 2147225014: Status Badges (Urbanist 500 14px, height 25px, radius 9999px)", () => {
        expect(cssContent).toMatch(/\.client-doc-status-badge[^{]*\{[^}]*font-family:\s*'Urbanist'/);
        expect(cssContent).toMatch(/\.client-doc-status-badge[^{]*\{[^}]*font-size:\s*14px;/);
        expect(cssContent).toMatch(/\.client-doc-status-badge[^{]*\{[^}]*font-weight:\s*500;/);
        expect(cssContent).toMatch(/\.client-doc-status-badge[^{]*\{[^}]*border-radius:\s*9999px;/);
        expect(cssContent).toMatch(/\.client-doc-status-badge\.status-awaiting[^{]*\{[^}]*background:\s*rgba\(245,\s*158,\s*11,\s*0\.12\);/i);
        expect(cssContent).toMatch(/\.client-doc-status-badge\.status-awaiting[^{]*\{[^}]*color:\s*#f59e0b;/i);
        expect(cssContent).toMatch(/\.client-doc-status-badge\.status-signed[^{]*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\);/i);
        expect(cssContent).toMatch(/\.client-doc-status-badge\.status-signed[^{]*\{[^}]*color:\s*#16a34a;/i);
    });

    it("Document Action Buttons (Frame 2147225509): View Document (white, 1px solid #E2E8F0, Inter 500 14px) and Sign Document (blue #2563EB, Inter 500 14px)", () => {
        expect(pageContent).toContain('className="client-doc-btn-view"');
        expect(pageContent).toContain("View Document");
        expect(pageContent).toContain("Sign Document");

        expect(cssContent).toMatch(/\.client-doc-btn-view[^{]*\{[^}]*height:\s*48px;/);
        expect(cssContent).toMatch(/\.client-doc-btn-view[^{]*\{[^}]*background:\s*#ffffff;/i);
        expect(cssContent).toMatch(/\.client-doc-btn-view[^{]*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-doc-btn-view[^{]*\{[^}]*border-radius:\s*6px;/);
        expect(cssContent).toMatch(/\.client-doc-btn-view[^{]*\{[^}]*color:\s*#0f172a;/i);

        expect(cssContent).toMatch(/\.client-doc-btn-sign[^{]*\{[^}]*height:\s*48px;/);
        expect(cssContent).toMatch(/\.client-doc-btn-sign[^{]*\{[^}]*background:\s*#2563eb;/i);
        expect(cssContent).toMatch(/\.client-doc-btn-sign[^{]*\{[^}]*border-radius:\s*6px;/);
        expect(cssContent).toMatch(/\.client-doc-btn-sign[^{]*\{[^}]*color:\s*#ffffff;/i);
    });

    it("Frame 2147225509: Signed document card displays View Document and Download buttons (239x48px, #FFFFFF, border 1px solid #E2E8F0, Inter 500 14px)", () => {
        expect(pageContent).toContain('className="client-doc-btn-download"');
        expect(pageContent).toContain("Download");
        expect(pageContent).toContain("handleDownload(doc)");

        expect(cssContent).toMatch(/\.client-doc-btn-download[^{]*\{[^}]*height:\s*48px;/);
        expect(cssContent).toMatch(/\.client-doc-btn-download[^{]*\{[^}]*background:\s*#ffffff;/i);
        expect(cssContent).toMatch(/\.client-doc-btn-download[^{]*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-doc-btn-download[^{]*\{[^}]*border-radius:\s*6px;/);
        expect(cssContent).toMatch(/\.client-doc-btn-download[^{]*\{[^}]*color:\s*#0f172a;/i);
    });

    it("Frame 2147225031: Bottom Action Row with hidden Back spacer and Continue to Dashboard button (195x48px, #2563EB, radius 6px, Inter 500 14px)", () => {
        expect(pageContent).toContain('className="client-docs-btn-back-spacer"');
        expect(pageContent).toContain('className="client-docs-btn-continue"');
        expect(pageContent).toContain("Continue to Dashboard");

        expect(cssContent).toMatch(/\.client-docs-btn-back-spacer\s*\{[^}]*width:\s*73px;/);
        expect(cssContent).toMatch(/\.client-docs-btn-back-spacer\s*\{[^}]*height:\s*48px;/);
        expect(cssContent).toMatch(/\.client-docs-btn-back-spacer\s*\{[^}]*opacity:\s*0;/);

        expect(cssContent).toMatch(/\.client-docs-btn-continue\s*\{[^}]*width:\s*195px;/);
        expect(cssContent).toMatch(/\.client-docs-btn-continue\s*\{[^}]*height:\s*48px;/);
        expect(cssContent).toMatch(/\.client-docs-btn-continue\s*\{[^}]*background:\s*#2563eb;/i);
        expect(cssContent).toMatch(/\.client-docs-btn-continue\s*\{[^}]*border-radius:\s*6px;/);
        expect(cssContent).toMatch(/\.client-docs-btn-continue\s*\{[^}]*color:\s*#ffffff;/i);
    });

    it("Integrates DocumentViewerModal and DocumentSignModal for authorized preview and signing", () => {
        expect(pageContent).toContain("<DocumentViewerModal");
        expect(pageContent).toContain("<DocumentSignModal");
        expect(pageContent).toContain("onSigned={handleSigned}");
    });

    it("Updates onboarding status to 'dashboard' when clicking Continue to Dashboard", () => {
        expect(pageContent).toContain('updateClientOnboarding(project.id, "dashboard")');
        expect(pageContent).toContain('router.push(`/client/dashboard?projectId=${encodeURIComponent(project.id)}`)');
    });

    it("Provides empty state when project has no documents", () => {
        expect(pageContent).toContain("No Documents Pending");
        expect(pageContent).toContain("There are currently no documents requiring your signature or review for this project.");
        expect(cssContent).toMatch(/\.client-docs-empty-card\s*\{[^}]*border-radius:\s*20px;/);
    });

    it("Provides responsive rules for mobile screens", () => {
        expect(cssContent).toContain(".client-doc-top-row");
        expect(cssContent).toContain(".client-doc-buttons-row");
        expect(cssContent).toContain(".client-docs-btn-continue");
    });
});
