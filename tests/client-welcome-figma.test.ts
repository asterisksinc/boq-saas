import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Client Welcome Flow Figma Visual & Layout Verification", () => {
    const pagePath = join(process.cwd(), "app", "client", "onboarding", "page.tsx");
    const layoutPath = join(process.cwd(), "components", "client", "ClientOnboardingLayout.tsx");
    const cssPath = join(process.cwd(), "app", "globals.css");

    it("verifies required files exist", () => {
        expect(existsSync(pagePath), "app/client/onboarding/page.tsx must exist").toBe(true);
        expect(existsSync(layoutPath), "components/client/ClientOnboardingLayout.tsx must exist").toBe(true);
        expect(existsSync(cssPath), "app/globals.css must exist").toBe(true);
    });

    const pageContent = readFileSync(pagePath, "utf-8").replace(/\s+/g, " ");
    const layoutContent = readFileSync(layoutPath, "utf-8").replace(/\s+/g, " ");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("Frame 45: Header specification matches Figma (88px height, 1px dashed #E2E8F0, padding 24px 44px)", () => {
        expect(cssContent).toMatch(/\.client-onboarding-header\s*\{[^}]*height:\s*88px;/);
        expect(cssContent).toMatch(/\.client-onboarding-header\s*\{[^}]*padding:\s*24px\s+44px;/);
        expect(cssContent).toMatch(/\.client-onboarding-header\s*\{[^}]*border-bottom:\s*1px\s+dashed\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-onboarding-header\s*\{[^}]*background:\s*#ffffff;/i);
    });

    it("Header Logo: 40x40px BOQ logo with link to home", () => {
        expect(layoutContent).toContain('className="client-onboarding-logo-frame"');
        expect(layoutContent).toContain('src="/assets/boq-logo-small.svg"');
        expect(layoutContent).toContain("width: 40, height: 40");
    });

    it("Header Language Selector: Frame 12 (102x36px, 1px solid #E2E8F0, radius 4px, globe and chevron)", () => {
        expect(cssContent).toMatch(/\.client-onboarding-header\s+\.lang-pill\s*\{[^}]*width:\s*102px;/);
        expect(cssContent).toMatch(/\.client-onboarding-header\s+\.lang-pill\s*\{[^}]*height:\s*36px;/);
        expect(cssContent).toMatch(/\.client-onboarding-header\s+\.lang-pill\s*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-onboarding-header\s+\.lang-pill\s*\{[^}]*border-radius:\s*4px;/);
        expect(layoutContent).toContain('className="lang-globe"');
        expect(layoutContent).toContain('className="lang-arrow"');
    });

    it("Frame 2147225024: Stepper Sidebar matches Figma (300px width, 1px dashed #E2E8F0, padding 64px 30px, gap 24px)", () => {
        expect(cssContent).toMatch(/\.client-onboarding-sidebar\s*\{[^}]*width:\s*300px;/);
        expect(cssContent).toMatch(/\.client-onboarding-sidebar\s*\{[^}]*padding:\s*64px\s+30px;/);
        expect(cssContent).toMatch(/\.client-onboarding-sidebar\s*\{[^}]*border-right:\s*1px\s+dashed\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-onboarding-sidebar\s*\{[^}]*gap:\s*24px;/);
    });

    it("Stepper Indicators & Connectors: 20x20px circles with 2x36px #94A3B8 connectors (Rectangles 60 & 61)", () => {
        expect(cssContent).toMatch(/\.client-step-circle\s*\{[^}]*width:\s*20px;/);
        expect(cssContent).toMatch(/\.client-step-circle\s*\{[^}]*height:\s*20px;/);
        expect(cssContent).toMatch(/\.client-step-circle\.active\s*\{[^}]*background:\s*#22c55e;/i);
        expect(cssContent).toMatch(/\.client-step-circle\.pending\s*\{[^}]*background:\s*#94a3b8;/i);
        expect(cssContent).toMatch(/\.client-step-line\s*\{[^}]*width:\s*2px;/);
        expect(cssContent).toMatch(/\.client-step-line\s*\{[^}]*height:\s*36px;/);
        expect(cssContent).toMatch(/\.client-step-line\s*\{[^}]*background:\s*#94a3b8;/i);
        expect(cssContent).toMatch(/\.client-step-line\s*\{[^}]*border-radius:\s*51px;/);
    });

    it("Stepper step titles & descriptions: Step 1 Welcome, Step 2 Documents, Step 3 Dashboard", () => {
        expect(layoutContent).toContain('{ id: "welcome", title: "Welcome", desc: "Tell us about your business" }');
        expect(layoutContent).toContain('{ id: "documents", title: "Documents", desc: "Configure a few basics." }');
        expect(layoutContent).toContain('{ id: "dashboard", title: "Dashboard", desc: "Start with new or Existing" }');
        // Excludes non-existent or hidden Step 4 "Create First Project"
        expect(layoutContent).not.toContain("Create First Project");
    });

    it("Frame 27: Main Content Area desktop padding (64px 334px 64px 160px) and column max-width 596px", () => {
        expect(cssContent).toMatch(/padding:\s*64px\s+334px\s+64px\s+160px;/);
        expect(cssContent).toMatch(/\.client-welcome-header-block\s*\{[^}]*max-width:\s*596px;/);
        expect(cssContent).toMatch(/\.client-welcome-project-card\s*\{[^}]*max-width:\s*596px;/);
        expect(cssContent).toMatch(/\.client-welcome-actions-row\s*\{[^}]*max-width:\s*596px;/);
    });

    it("Header Block: Company eyebrow (Inter 500 16px/20px #2563EB), Welcome title (Inter 600 28px/36px #0F172A), description (Inter 500 16px/140% #475569)", () => {
        expect(cssContent).toMatch(/\.client-welcome-company-eyebrow\s*\{[^}]*font-size:\s*16px;/);
        expect(cssContent).toMatch(/\.client-welcome-company-eyebrow\s*\{[^}]*font-weight:\s*500;/);
        expect(cssContent).toMatch(/\.client-welcome-company-eyebrow\s*\{[^}]*color:\s*#2563eb;/i);

        expect(cssContent).toMatch(/\.client-welcome-title\s*\{[^}]*font-size:\s*28px;/);
        expect(cssContent).toMatch(/\.client-welcome-title\s*\{[^}]*font-weight:\s*600;/);
        expect(cssContent).toMatch(/\.client-welcome-title\s*\{[^}]*line-height:\s*36px;/);
        expect(cssContent).toMatch(/\.client-welcome-title\s*\{[^}]*letter-spacing:\s*-0\.005em;/);
        expect(cssContent).toMatch(/\.client-welcome-title\s*\{[^}]*color:\s*#0f172a;/i);

        expect(cssContent).toMatch(/\.client-welcome-subtitle\s*\{[^}]*font-size:\s*16px;/);
        expect(cssContent).toMatch(/\.client-welcome-subtitle\s*\{[^}]*font-weight:\s*500;/);
        expect(cssContent).toMatch(/\.client-welcome-subtitle\s*\{[^}]*line-height:\s*140%;/);
        expect(cssContent).toMatch(/\.client-welcome-subtitle\s*\{[^}]*color:\s*#475569;/i);
    });

    it("Introductory description text matches exact Figma reference copy", () => {
        expect(pageContent).toContain(
            "Welcome to your project portal. This is your central place to stay updated, review project information, approve BOQs, manage invoices, and access important documents."
        );
    });

    it("Frame 2147225027: YOUR PROJECT Card styling (background #F2F3F2, border 1px solid #E2E8F0, radius 20px, padding 24px)", () => {
        expect(cssContent).toMatch(/\.client-welcome-project-card\s*\{[^}]*background:\s*#f2f3f2;/i);
        expect(cssContent).toMatch(/\.client-welcome-project-card\s*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-welcome-project-card\s*\{[^}]*border-radius:\s*20px;/);
        expect(cssContent).toMatch(/\.client-welcome-project-card\s*\{[^}]*padding:\s*24px;/);
    });

    it("Project Card content: Label 'YOUR PROJECT', Project Name (Urbanist 600 18px #0F172A)", () => {
        expect(pageContent).toContain('className="client-welcome-project-label">YOUR PROJECT</div>');
        expect(cssContent).toMatch(/\.client-welcome-project-label\s*\{[^}]*font-size:\s*14px;/);
        expect(cssContent).toMatch(/\.client-welcome-project-label\s*\{[^}]*color:\s*#2563eb;/i);
        expect(cssContent).toMatch(/\.client-welcome-project-name\s*\{[^}]*font-family:\s*'Urbanist'/);
        expect(cssContent).toMatch(/\.client-welcome-project-name\s*\{[^}]*font-size:\s*18px;/);
        expect(cssContent).toMatch(/\.client-welcome-project-name\s*\{[^}]*font-weight:\s*600;/);
    });

    it("Project details rows: 3 white rows (height ~51px, radius 6px, padding 16px) for Project Manager, Company, Project Status", () => {
        expect(pageContent).toContain("Project Manager");
        expect(pageContent).toContain("Company");
        expect(pageContent).toContain("Project Status");
        expect(cssContent).toMatch(/\.client-welcome-detail-row\s*\{[^}]*background:\s*#ffffff;/i);
        expect(cssContent).toMatch(/\.client-welcome-detail-row\s*\{[^}]*border-radius:\s*6px;/);
        expect(cssContent).toMatch(/\.client-welcome-detail-row\s*\{[^}]*padding:\s*16px;/);
        expect(cssContent).toMatch(/\.client-welcome-detail-row\s*\{[^}]*min-height:\s*51px;/);
    });

    it("Project detail typography: Label Urbanist 500 14px #64748B, Value Urbanist 600 16px #0F172A", () => {
        expect(cssContent).toMatch(/\.client-welcome-row-label\s*\{[^}]*font-family:\s*'Urbanist'/);
        expect(cssContent).toMatch(/\.client-welcome-row-label\s*\{[^}]*font-size:\s*14px;/);
        expect(cssContent).toMatch(/\.client-welcome-row-label\s*\{[^}]*font-weight:\s*500;/);
        expect(cssContent).toMatch(/\.client-welcome-row-label\s*\{[^}]*color:\s*#64748b;/i);

        expect(cssContent).toMatch(/\.client-welcome-row-value\s*\{[^}]*font-family:\s*'Urbanist'/);
        expect(cssContent).toMatch(/\.client-welcome-row-value\s*\{[^}]*font-size:\s*16px;/);
        expect(cssContent).toMatch(/\.client-welcome-row-value\s*\{[^}]*font-weight:\s*600;/);
        expect(cssContent).toMatch(/\.client-welcome-row-value\s*\{[^}]*color:\s*#0f172a;/i);
    });

    it("Project Status Badge: Urbanist 500 12px, padding 2px 6px, radius 9999px, green background for Active", () => {
        expect(cssContent).toMatch(/\.client-welcome-status-badge\s*\{[^}]*padding:\s*2px\s+6px;/);
        expect(cssContent).toMatch(/\.client-welcome-status-badge\s*\{[^}]*border-radius:\s*9999px;/);
        expect(cssContent).toMatch(/\.client-welcome-status-badge\s*\{[^}]*font-family:\s*'Urbanist'/);
        expect(cssContent).toMatch(/\.client-welcome-status-badge\s*\{[^}]*font-size:\s*12px;/);
        expect(cssContent).toMatch(/\.client-welcome-status-badge\.status-active\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\);/i);
        expect(cssContent).toMatch(/\.client-welcome-status-badge\.status-active\s*\{[^}]*color:\s*#16a34a;/i);
    });

    it("Frame 2147225506: HERE'S WHAT YOU CAN DO label (Inter 500 14px/20px #94A3B8)", () => {
        expect(pageContent).toContain("HERE&apos;S WHAT YOU CAN DO");
        expect(cssContent).toMatch(/\.client-welcome-features-label\s*\{[^}]*font-size:\s*14px;/);
        expect(cssContent).toMatch(/\.client-welcome-features-label\s*\{[^}]*font-weight:\s*500;/);
        expect(cssContent).toMatch(/\.client-welcome-features-label\s*\{[^}]*color:\s*#94a3b8;/i);
    });

    it("Feature Cards: All 5 cards defined with 34x34px #F1F5F9 icon box and Urbanist 500 14px text", () => {
        const expectedCards = [
            "Review Project Updates",
            "Review and Approve BOQs",
            "Access Invoices and Payment Information",
            "Review and Sign Documents",
            "Stay Connected With Your Project Team",
        ];
        for (const card of expectedCards) {
            expect(pageContent).toContain(card);
        }

        expect(cssContent).toMatch(/\.client-welcome-feature-card\s*\{[^}]*border:\s*1px\s+solid\s+#e2e8f0;/i);
        expect(cssContent).toMatch(/\.client-welcome-feature-card\s*\{[^}]*border-radius:\s*6px;/);
        expect(cssContent).toMatch(/\.client-welcome-feature-card\s*\{[^}]*min-height:\s*51px;/);
        expect(cssContent).toMatch(/\.client-welcome-feature-icon-box\s*\{[^}]*width:\s*34px;/);
        expect(cssContent).toMatch(/\.client-welcome-feature-icon-box\s*\{[^}]*height:\s*34px;/);
        expect(cssContent).toMatch(/\.client-welcome-feature-icon-box\s*\{[^}]*background:\s*#f1f5f9;/i);
        expect(cssContent).toMatch(/\.client-welcome-feature-text\s*\{[^}]*font-family:\s*'Urbanist'/);
        expect(cssContent).toMatch(/\.client-welcome-feature-text\s*\{[^}]*font-size:\s*14px;/);
        expect(cssContent).toMatch(/\.client-welcome-feature-text\s*\{[^}]*color:\s*#0f172a;/i);
    });

    it("Frame 2147225031: Bottom Action Row with hidden Back spacer and Get Started button (118x48px, #2563EB, radius 6px, Inter 500 14px)", () => {
        expect(pageContent).toContain('className="client-welcome-btn-back-spacer"');
        expect(pageContent).toContain('className="client-welcome-btn-get-started"');
        expect(pageContent).toContain("Get Started");

        expect(cssContent).toMatch(/\.client-welcome-btn-back-spacer\s*\{[^}]*width:\s*73px;/);
        expect(cssContent).toMatch(/\.client-welcome-btn-back-spacer\s*\{[^}]*height:\s*48px;/);
        expect(cssContent).toMatch(/\.client-welcome-btn-back-spacer\s*\{[^}]*opacity:\s*0;/);

        expect(cssContent).toMatch(/\.client-welcome-btn-get-started\s*\{[^}]*width:\s*118px;/);
        expect(cssContent).toMatch(/\.client-welcome-btn-get-started\s*\{[^}]*height:\s*48px;/);
        expect(cssContent).toMatch(/\.client-welcome-btn-get-started\s*\{[^}]*background:\s*#2563eb;/i);
        expect(cssContent).toMatch(/\.client-welcome-btn-get-started\s*\{[^}]*border-radius:\s*6px;/);
        expect(cssContent).toMatch(/\.client-welcome-btn-get-started\s*\{[^}]*font-size:\s*14px;/);
        expect(cssContent).toMatch(/\.client-welcome-btn-get-started\s*\{[^}]*color:\s*#ffffff;/i);
    });

    it("Handles Get Started action: updates onboarding step to 'documents' and redirects", () => {
        expect(pageContent).toContain('updateClientOnboarding(project.id, "documents")');
        expect(pageContent).toContain('router.push(`/client/onboarding/documents?projectId=${encodeURIComponent(project.id)}`)');
    });

    it("Redirects clients who already completed onboarding to client dashboard", () => {
        expect(pageContent).toContain("getClientOnboarding(activeProject.id)");
        expect(pageContent).toContain('onboardingRes?.onboarding?.status === "completed"');
        expect(pageContent).toContain('onboardingRes?.onboarding?.currentStep === "dashboard"');
        expect(pageContent).toContain('router.push(`/client/dashboard?projectId=${encodeURIComponent(activeProject.id)}`)');
    });

    it("Provides responsive rules for desktop, tablet, and mobile", () => {
        expect(cssContent).toContain("@media (min-width: 1440px)");
        expect(cssContent).toContain("@media (max-width: 1200px)");
        expect(cssContent).toContain("@media (max-width: 860px)");
        expect(cssContent).toContain("@media (max-width: 768px)");
        expect(cssContent).toContain("@media (max-width: 600px)");
    });
});
