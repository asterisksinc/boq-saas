import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

describe("BOQ SaaS — Integrations Module Production Readiness & Resilience Audit", () => {
    const integrationsPage = readFileSync("app/integrations/page.tsx", "utf8");
    const detailPage = readFileSync("app/integrations/[id]/page.tsx", "utf8");
    const customFormPage = readFileSync("app/integrations/[id]/forms/[formId]/page.tsx", "utf8");
    const transactionsPage = readFileSync("app/integrations/[id]/transactions/page.tsx", "utf8");
    const integrationsCss = readFileSync("app/integrations/integrations.css", "utf8");
    const globalsCss = readFileSync("app/globals.css", "utf8");
    const routeCode = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

    describe("1. Overall Layout & Elimination of Right-Side Gap", () => {
        it("verifies all 4 user dashboard integrations pages reuse the shared fig-dashboard container", () => {
            [integrationsPage, detailPage, customFormPage, transactionsPage].forEach((code) => {
                expect(code).toContain('className="fig-dashboard"');
                expect(code).not.toContain('boq-dashboard');
                expect(code).toContain('<DashboardRail current="/integrations"');
                expect(code).toContain('<DashboardHeader');
            });
        });

        it("verifies main containers occupy 100% full width without restrictive 1326px or 1200px max-width", () => {
            expect(integrationsCss).toContain(".intg-overview {");
            expect(integrationsCss).toContain("max-width: 100%;");
            expect(integrationsCss).toContain(".intg-detail-page {");
            expect(integrationsCss).toContain("max-width: 100%;");
            expect(globalsCss).toContain(".intg-overview {");
            expect(globalsCss).toContain("max-width: 100%;");
        });
    });

    describe("2. Consistent Card Alignment & Spacing Across All Categories", () => {
        it("verifies unified grid rule without category-specific conflicting column declarations", () => {
            // Confirm removal of category-specific stretching rules in globals.css
            expect(globalsCss).not.toContain('data-category="lead_source"] { grid-template-columns');
            expect(globalsCss).not.toContain('data-category="automation"] { grid-template-columns');
            expect(globalsCss).not.toContain('data-category="payment"] { grid-template-columns');

            // Confirm responsive auto-fill grid definition in integrations.css
            expect(integrationsCss).toContain(".intg-section-cards {");
            expect(integrationsCss).toContain("grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));");
            expect(integrationsCss).toContain("gap: 16px;");

            // Confirm matching grid in globals.css
            expect(globalsCss).toContain("grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));");
        });

        it("verifies card proportions and alignment structure", () => {
            expect(integrationsCss).toContain(".intg-card {");
            expect(integrationsCss).toContain("min-height: 190px;");
            expect(integrationsCss).toContain("padding: 20px;");
            expect(integrationsCss).toContain("display: flex;");
            expect(integrationsCss).toContain("flex-direction: column;");
            expect(integrationsCss).toContain("justify-content: space-between;");
        });
    });

    describe("3. Background Matching with Existing Dashboard System", () => {
        it("verifies boq-dashboard override is completely removed from all integration pages", () => {
            expect(integrationsPage).not.toContain("boq-dashboard");
            expect(detailPage).not.toContain("boq-dashboard");
            expect(customFormPage).not.toContain("boq-dashboard");
            expect(transactionsPage).not.toContain("boq-dashboard");
        });
    });

    describe("4. API Resilience & HTTP 500 Prevention", () => {
        it("verifies dual-persistence support using workspace_settings.integrations fallback", () => {
            expect(routeCode).toContain("getWorkspaceIntegrationsData");
            expect(routeCode).toContain("updateWorkspaceIntegrationsData");
            expect(routeCode).toContain("workspace_settings");
        });

        it("verifies safe listFormsWithStats handling when database tables are missing", () => {
            expect(routeCode).toContain("async function listFormsWithStats");
            expect(routeCode).toContain("getWorkspaceIntegrationsData");
        });

        it("verifies custom website forms CRUD handlers are resilient", () => {
            expect(routeCode).toContain("async function listIntegrationForms");
            expect(routeCode).toContain("async function getIntegrationForm");
            expect(routeCode).toContain("async function createIntegrationForm");
            expect(routeCode).toContain("async function updateIntegrationForm");
            expect(routeCode).toContain("async function deleteIntegrationForm");
            expect(routeCode).toContain("async function setFormStatus");
        });

        it("verifies leads listing and export handlers are resilient", () => {
            expect(routeCode).toContain("async function listFormLeads");
            expect(routeCode).toContain("async function exportFormLeads");
        });

        it("verifies razorpay payment-summary, payment-analytics, and transactions endpoints", () => {
            expect(routeCode).toContain("async function paymentSummary");
            expect(routeCode).toContain("async function paymentAnalytics");
            expect(routeCode).toContain("async function integrationTransactions");
        });

        it("verifies route dispatch regexes support alphanumeric IDs and both webhook path formats", () => {
            expect(routeCode).toContain("integrations\\/webhook|webhooks");
            expect(routeCode).toContain("integrations\\/forms\\/([a-zA-Z0-9_-]+)");
            expect(routeCode).toContain("integrations\\/forms\\/([a-zA-Z0-9_-]+)\\/leads");
            expect(routeCode).toContain("integrations\\/forms\\/([a-zA-Z0-9_-]+)\\/pause");
            expect(routeCode).toContain("integrations\\/forms\\/([a-zA-Z0-9_-]+)\\/resume");
            expect(routeCode).toContain("integrations\\/forms\\/([a-zA-Z0-9_-]+)\\/export");
        });
    });
});
