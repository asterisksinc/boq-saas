import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import {
    integrationDefinitions,
    dashboardIntegrationDefinitions,
    emailIntegrationDefinition,
    getDefinition,
    categoryOrder,
    categoryLabels,
} from "../lib/integrations/definitions";

describe("User Dashboard → Integrations Figma Redesign", () => {
    const integrationsCss = readFileSync("app/integrations/integrations.css", "utf8");
    const integrationsPageCode = readFileSync("app/integrations/page.tsx", "utf8");
    const overviewCode = readFileSync("components/integrations/IntegrationOverview.tsx", "utf8");
    const summaryCardsCode = readFileSync("components/integrations/IntegrationSummaryCards.tsx", "utf8");
    const cardCode = readFileSync("components/integrations/IntegrationCard.tsx", "utf8");
    const disconnectModalCode = readFileSync("components/integrations/DisconnectModal.tsx", "utf8");
    const providerConnectDialogCode = readFileSync("components/integrations/ProviderConnectDialog.tsx", "utf8");

    describe("1. Integration Definitions & Figma Categorization", () => {
        it("verifies all 6 Figma integrations exist in dashboardIntegrationDefinitions", () => {
            expect(dashboardIntegrationDefinitions).toHaveLength(6);
            const providers = dashboardIntegrationDefinitions.map((d) => d.provider);
            expect(providers).toEqual([
                "meta_lead_ads",
                "google_ads",
                "custom_website",
                "whatsapp",
                "email",
                "razorpay",
            ]);
        });

        it("verifies exact category distribution matching Figma layout", () => {
            const leadSources = dashboardIntegrationDefinitions.filter((d) => d.category === "lead_source");
            expect(leadSources).toHaveLength(3);
            expect(leadSources.map((d) => d.provider)).toEqual([
                "meta_lead_ads",
                "google_ads",
                "custom_website",
            ]);

            const automations = dashboardIntegrationDefinitions.filter((d) => d.category === "automation");
            expect(automations).toHaveLength(2);
            expect(automations.map((d) => d.provider)).toEqual([
                "whatsapp",
                "email",
            ]);

            const payments = dashboardIntegrationDefinitions.filter((d) => d.category === "payment");
            expect(payments).toHaveLength(1);
            expect(payments.map((d) => d.provider)).toEqual([
                "razorpay",
            ]);
        });

        it("verifies exact titles and descriptions from Figma specifications", () => {
            const meta = getDefinition("meta_lead_ads");
            expect(meta?.title).toBe("Meta Lead Ads");
            expect(meta?.description).toBe(
                "Receive new leads from Facebook & Instagram Lead Ads to your BOQ SaaS Account"
            );

            const google = getDefinition("google_ads");
            expect(google?.title).toBe("Google Ads Lead Form Assets");
            expect(google?.description).toBe(
                "Receive new leads from Google Ads Lead Form Assets to your BOQ SaaS Account"
            );

            const custom = getDefinition("custom_website");
            expect(custom?.title).toBe("Custom Website");
            expect(custom?.description).toBe(
                "Receive new leads using webhooks from your custom website to your BOQ SaaS Account"
            );

            const whatsapp = getDefinition("whatsapp");
            expect(whatsapp?.title).toBe("WhatsApp Automation");
            expect(whatsapp?.description).toBe(
                "Send automated messages to your clients via WhatsApp from your BOQ SaaS Account"
            );

            const email = getDefinition("email");
            expect(email?.title).toBe("Email Integration");
            expect(email?.description).toBe(
                "Share files Proposal, Order Sheet & Invoice, etc., to your clients via Email from your BOQ SaaS Account"
            );

            const razorpay = getDefinition("razorpay");
            expect(razorpay?.title).toBe("RazorPay Integration");
            expect(razorpay?.description).toBe(
                "Start receiving payments from your clients on the invoices created."
            );
        });

        it("verifies authentic SVG icons exist on disk for all 6 providers", () => {
            for (const def of dashboardIntegrationDefinitions) {
                expect(existsSync("public" + def.iconPath)).toBe(true);
            }
        });

        it("verifies email SVG icon contains authentic Gmail/Email palette", () => {
            const emailSvg = readFileSync("public/assets/integrations/email.svg", "utf8");
            expect(emailSvg).toContain("#4285F4");
            expect(emailSvg).toContain("#34A853");
            expect(emailSvg).toContain("#EA4335");
        });

        it("preserves backward compatibility: settings integrationDefinitions remains length 5", () => {
            expect(integrationDefinitions).toHaveLength(5);
        });
    });

    describe("2. Parent Layout Compliance & Single Source of Truth", () => {
        it("verifies Integrations page renders inside DashboardRail and DashboardHeader without duplicating chrome", () => {
            expect(integrationsPageCode).toContain("<DashboardRail current=\"/integrations\"");
            expect(integrationsPageCode).toContain("<DashboardHeader title=\"Integrations\"");
            expect(integrationsPageCode).toContain("className=\"fig-dashboard\"");
            expect(integrationsPageCode).not.toContain("boq-dashboard");
            expect(integrationsPageCode).toContain("className=\"fig-dashboard-glow\"");
            expect(integrationsPageCode).toContain("className=\"fig-dashboard-main\"");
        });

        it("verifies global header search is wired to IntegrationOverview", () => {
            expect(integrationsPageCode).toContain("onSearch={setSearchQuery}");
            expect(integrationsPageCode).toContain("searchQuery={searchQuery}");
        });
    });

    describe("3. Figma Frame Specifications in CSS", () => {
        it("verifies main overview container (Frame 2147225065) sizing and gap tokens", () => {
            expect(integrationsCss).toContain(".intg-overview {");
            expect(integrationsCss).toContain("max-width: 100%;");
            expect(integrationsCss).toContain("gap: 16px;");
        });

        it("verifies summary metrics row (Frame 2147225138) grid and frosted card tokens", () => {
            expect(integrationsCss).toContain(".intg-summary-grid {");
            expect(integrationsCss).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
            expect(integrationsCss).toContain("gap: 8px;");

            expect(integrationsCss).toContain(".intg-kpi-card {");
            expect(integrationsCss).toContain("min-height: 116px;");
            expect(integrationsCss).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(integrationsCss).toContain("backdrop-filter: blur(20.4px);");
            expect(integrationsCss).toContain("border-radius: 6px;");
            expect(integrationsCss).toContain("padding: 20px;");
        });

        it("verifies exact metric value color tokens matching Figma reference", () => {
            expect(integrationsCss).toContain(".intg-val-active {");
            expect(integrationsCss).toContain("color: #0F172A;");

            expect(integrationsCss).toContain(".intg-val-captured {");
            expect(integrationsCss).toContain("color: #16A34A;");

            expect(integrationsCss).toContain(".intg-val-today {");
            expect(integrationsCss).toContain("color: #D97706;");

            expect(integrationsCss).toContain(".intg-val-failed {");
            expect(integrationsCss).toContain("color: #EF4444;");
        });

        it("verifies 3-column card grid (Frame 2147225430) and card proportions", () => {
            expect(integrationsCss).toContain(".intg-section-cards {");
            expect(integrationsCss).toContain("grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));");
            expect(integrationsCss).toContain("gap: 16px;");

            expect(integrationsCss).toContain(".intg-card {");
            expect(integrationsCss).toContain("min-height: 190px;");
            expect(integrationsCss).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(integrationsCss).toContain("border-radius: 6px;");
            expect(integrationsCss).toContain("padding: 20px;");
            expect(integrationsCss).toContain("gap: 12px;");
        });

        it("verifies 46x46px icon wrapper (Frame 2147225425) tokens", () => {
            expect(integrationsCss).toContain(".intg-icon-wrapper {");
            expect(integrationsCss).toContain("width: 46px;");
            expect(integrationsCss).toContain("height: 46px;");
            expect(integrationsCss).toContain("background: #FFFFFF;");
            expect(integrationsCss).toContain("border-radius: 8px;");
            expect(integrationsCss).toContain("padding: 10px;");
        });

        it("verifies 46px action button styling for connect and disconnect", () => {
            expect(integrationsCss).toContain(".intg-btn {");
            expect(integrationsCss).toContain("height: 46px;");
            expect(integrationsCss).toContain("border-radius: 6px;");
            expect(integrationsCss).toContain("font-size: 14px;");

            expect(integrationsCss).toContain(".intg-btn.intg-btn-connect {");
            expect(integrationsCss).toContain("background: #2563EB;");
            expect(integrationsCss).toContain("color: #FFFFFF;");

            expect(integrationsCss).toContain(".intg-btn.intg-btn-disconnect {");
            expect(integrationsCss).toContain("background: #FFFFFF;");
            expect(integrationsCss).toContain("border: 1px solid #EBEBEB;");
            expect(integrationsCss).toContain("color: #0F172A;");
        });

        it("verifies dropdown popover (Frame Sent Status more options) specifications", () => {
            expect(integrationsCss).toContain(".intg-more-popover {");
            expect(integrationsCss).toContain("width: 156px;");
            expect(integrationsCss).toContain("border-radius: 16px;");
            expect(integrationsCss).toContain("border: 1px solid #EBEBEB;");
            expect(integrationsCss).toContain("box-shadow: 0px 16px 32px -12px rgba(14, 18, 27, 0.1);");

            expect(integrationsCss).toContain(".intg-more-item {");
            expect(integrationsCss).toContain("width: 140px;");
            expect(integrationsCss).toContain("height: 40px;");
            expect(integrationsCss).toContain("border-radius: 8px;");
        });

        it("verifies responsive rules for tablet and mobile viewports", () => {
            expect(integrationsCss).toContain("@media (max-width: 1024px)");
            expect(integrationsCss).toContain("@media (max-width: 640px)");
        });
    });

    describe("4. Dynamic Data & Functional Workflows", () => {
        it("verifies dynamic KPI summary metrics derivation in IntegrationSummaryCards", () => {
            expect(summaryCardsCode).toContain("summary.activeIntegrations");
            expect(summaryCardsCode).toContain("summary.leadsCaptured");
            expect(summaryCardsCode).toContain("summary.leadsToday");
            expect(summaryCardsCode).toContain("summary.failedDeliveries");
            expect(summaryCardsCode).toContain("intg-val-active");
            expect(summaryCardsCode).toContain("intg-val-captured");
            expect(summaryCardsCode).toContain("intg-val-today");
            expect(summaryCardsCode).toContain("intg-val-failed");
        });

        it("verifies IntegrationOverview fetches dynamic data via integrationsApi", () => {
            expect(overviewCode).toContain("integrationsApi.summary()");
            expect(overviewCode).toContain("integrationsApi.list()");
        });

        it("verifies disconnect confirmation modal workflow", () => {
            expect(overviewCode).toContain("DisconnectModal");
            expect(overviewCode).toContain("integrationsApi.disconnect(");
            expect(disconnectModalCode).toContain("Disconnect {title}?");
            expect(disconnectModalCode).toContain("intg-btn-modal-danger");
        });

        it("verifies connect workflows for all supported providers", () => {
            expect(providerConnectDialogCode).toContain("meta_lead_ads");
            expect(providerConnectDialogCode).toContain("google_ads");
            expect(providerConnectDialogCode).toContain("whatsapp");
            expect(providerConnectDialogCode).toContain("email");
            expect(providerConnectDialogCode).toContain("razorpay");
        });

        it("verifies search filtering and empty state in IntegrationOverview", () => {
            expect(overviewCode).toContain("searchQuery.trim().toLowerCase()");
            expect(overviewCode).toContain("intg-empty-state");
            expect(overviewCode).toContain("No integrations found");
        });
    });
});
