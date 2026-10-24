import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { integrationDefinitions, getDefinition } from "../lib/integrations/definitions";
import {
    NOTIFICATION_ROWS,
    NOTIFICATION_CHANNELS,
    DEFAULT_NOTIFICATION_MATRIX,
    adaptNotificationSettings,
    serializeNotificationSettings,
} from "../lib/settings/adapter";

describe("Figma CSS Redesign - Settings Integrations & Notifications", () => {
    const globalsCss = readFileSync("app/globals.css", "utf8");
    const integrationCardCode = readFileSync("components/integrations/IntegrationCard.tsx", "utf8");
    const settingsIntegrationsCode = readFileSync("components/settings/SettingsIntegrations.tsx", "utf8");
    const settingsNotificationsCode = readFileSync("components/settings/SettingsNotifications.tsx", "utf8");

    describe("Integrations (Frame 2147225430) Specifications", () => {
        it("verifies exactly 5 providers matching Figma specifications", () => {
            expect(integrationDefinitions).toHaveLength(5);
            expect(integrationDefinitions.map((d) => d.provider)).toEqual([
                "meta_lead_ads",
                "google_ads",
                "custom_website",
                "whatsapp",
                "razorpay",
            ]);
            expect(integrationDefinitions.map((d) => d.title)).toEqual([
                "Meta Lead Ads",
                "Google Ads Lead Form Assets",
                "Custom Website",
                "WhatsApp Automation",
                "RazorPay Integration",
            ]);
        });

        it("verifies exact descriptions and svg asset paths", () => {
            const meta = getDefinition("meta_lead_ads");
            expect(meta?.description).toBe(
                "Receive new leads from Facebook & Instagram Lead Ads to your BOQ SaaS Account"
            );
            expect(meta?.iconPath).toBe("/assets/integrations/meta.svg");

            const google = getDefinition("google_ads");
            expect(google?.description).toBe(
                "Receive new leads from Google Ads Lead Form Assets to your BOQ SaaS Account"
            );
            expect(google?.iconPath).toBe("/assets/integrations/google-ads.svg");

            const custom = getDefinition("custom_website");
            expect(custom?.description).toBe(
                "Receive new leads using webhooks from your custom website to your BOQ SaaS Account"
            );
            expect(custom?.iconPath).toBe("/assets/integrations/custom-website.svg");

            const whatsapp = getDefinition("whatsapp");
            expect(whatsapp?.description).toBe(
                "Send automated messages to your clients via WhatsApp from your BOQ SaaS Account"
            );
            expect(whatsapp?.iconPath).toBe("/assets/integrations/whatsapp.svg");

            const razorpay = getDefinition("razorpay");
            expect(razorpay?.description).toBe(
                "Start receiving payments from your clients on the invoices created."
            );
            expect(razorpay?.iconPath).toBe("/assets/integrations/razorpay.svg");
        });

        it("verifies container and card math in globals.css", () => {
            // Master container: width 1326px, gap 8px
            expect(globalsCss).toContain(".settings-integrations-wrap");
            expect(globalsCss).toContain("max-width: 1326px;");

            // Grid: gap 8px, wrap
            expect(globalsCss).toContain(".intg-grid");
            expect(globalsCss).toContain("gap: 8px;");

            // Card: width calc((100% - 16px) / 3), max-width 436.67px, height 190px, padding 20px, gap 12px
            expect(globalsCss).toContain(".intg-card {");
            expect(globalsCss).toContain("max-width: 436.67px;");
            expect(globalsCss).toContain("height: 190px;");
            expect(globalsCss).toContain("padding: 20px;");
            expect(globalsCss).toContain("gap: 12px;");
            expect(globalsCss).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(globalsCss).toContain("border-radius: 6px;");

            // Icon container: 46px x 46px, radius 8px, padding 10px, background #FFFFFF
            expect(globalsCss).toContain(".intg-icon-wrapper {");
            expect(globalsCss).toContain("width: 46px;");
            expect(globalsCss).toContain("height: 46px;");
            expect(globalsCss).toContain("background: #FFFFFF;");
            expect(globalsCss).toContain("border-radius: 8px;");
            expect(globalsCss).toContain("padding: 10px;");

            // Button: height 46px, background #FFFFFF, border 1px solid #EBEBEB, radius 6px
            expect(globalsCss).toContain(".intg-btn {");
            expect(globalsCss).toContain("height: 46px;");
            expect(globalsCss).toContain("border: 1px solid #EBEBEB;");
            expect(globalsCss).toContain("border-radius: 6px;");
            expect(globalsCss).toContain("font-size: 14px;");
            expect(globalsCss).toContain("color: #0F172A;");
        });

        it("verifies IntegrationCard component structure matches Figma layout", () => {
            expect(integrationCardCode).toContain("className=\"intg-card\"");
            expect(integrationCardCode).toContain("className=\"intg-card-top\"");
            expect(integrationCardCode).toContain("className=\"intg-card-header\"");
            expect(integrationCardCode).toContain("className=\"intg-card-header-left\"");
            expect(integrationCardCode).toContain("className=\"intg-icon-wrapper\"");
            expect(integrationCardCode).toContain("className=\"intg-card-title\"");
            expect(integrationCardCode).toContain("intg-status-indicator");
            expect(integrationCardCode).toContain("className=\"intg-card-desc\"");
            expect(integrationCardCode).toContain("className=\"intg-card-footer\"");
            expect(integrationCardCode).toContain("className={`intg-btn");
        });
    });

    describe("Notifications (Frame 2147225146) Specifications", () => {
        it("verifies 7 notification event rows and 4 channels in exact order", () => {
            expect(NOTIFICATION_ROWS.map((r) => r.id)).toEqual([
                "boq_approval",
                "payment_alert",
                "document_shared",
                "new_comment",
                "task_due",
                "weekly_digest",
                "marketing",
            ]);
            expect(NOTIFICATION_ROWS.map((r) => r.label)).toEqual([
                "BOQ Approval",
                "Payment Alert",
                "Document Shared",
                "New Comment",
                "Task Due",
                "Weekly Digest",
                "Marketing",
            ]);

            expect(NOTIFICATION_CHANNELS.map((c) => c.id)).toEqual([
                "email",
                "in_app",
                "push",
                "whatsapp",
            ]);
            expect(NOTIFICATION_CHANNELS.map((c) => c.label)).toEqual([
                "EMAIL",
                "IN-APP",
                "PUSH",
                "WHATSAPP",
            ]);
        });

        it("verifies panel, table, and column arithmetic in globals.css", () => {
            // Container card: 1326px width, 561px min-height, 20px padding, 6px radius, background rgba(255, 255, 255, 0.6)
            expect(globalsCss).toContain(".notif-matrix-card {");
            expect(globalsCss).toContain("max-width: 1326px;");
            expect(globalsCss).toContain("min-height: 561px;");
            expect(globalsCss).toContain("padding: 20px;");
            expect(globalsCss).toContain("gap: 20px;");
            expect(globalsCss).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(globalsCss).toContain("border-radius: 6px;");

            // Inner table: 1286px width (1326 - 40)
            expect(globalsCss).toContain(".notif-matrix-table {");
            expect(globalsCss).toContain("width: 1286px;");

            // Header row: 36px height, background #E4ECFB, radius 8px
            expect(globalsCss).toContain(".notif-matrix-header-row {");
            expect(globalsCss).toContain("background: #E4ECFB;");
            expect(globalsCss).toContain("height: 36px;");

            // Col 1 (Notification): width 460px
            expect(globalsCss).toContain(".notif-col-name {");
            expect(globalsCss).toContain("width: 460px;");
            expect(globalsCss).toContain("color: #64748B;");

            // Col 2-5 (Channels): width 206.5px
            expect(globalsCss).toContain(".notif-col-channel {");
            expect(globalsCss).toContain("width: 206.5px;");
            expect(globalsCss).toContain("color: #64748B;");

            // Row height 56px and divider #EBEBEB
            expect(globalsCss).toContain(".notif-matrix-row {");
            expect(globalsCss).toContain("height: 56px;");
            expect(globalsCss).toContain("border-bottom: 1px solid #EBEBEB;");

            // Column width summation check: 460 + 4 * 206.5 = 1286 exact
            const col1 = 460;
            const colChannels = 206.5 * 4;
            expect(col1 + colChannels).toBe(1286);
        });

        it("verifies switch toggle dimensions and thumb translation in globals.css", () => {
            // Track: 40px width x 22px height, radius 77.5px, padding 3px, active #2563EB, inactive #CBD5E1
            expect(globalsCss).toContain(".notif-switch-track {");
            expect(globalsCss).toContain("width: 40px;");
            expect(globalsCss).toContain("height: 22px;");
            expect(globalsCss).toContain("border-radius: 77.5px;");
            expect(globalsCss).toContain("background-color: #CBD5E1;");
            expect(globalsCss).toContain("padding: 3px;");
            expect(globalsCss).toContain("background-color: #2563EB;");

            // Thumb: 16px x 16px, radius 77.5px, translateX(18px) when checked
            expect(globalsCss).toContain(".notif-switch-thumb {");
            expect(globalsCss).toContain("width: 16px;");
            expect(globalsCss).toContain("height: 16px;");
            expect(globalsCss).toContain("background-color: #FFFFFF;");
            expect(globalsCss).toContain("border-radius: 77.5px;");
            expect(globalsCss).toContain("transform: translateX(18px);");
        });

        it("verifies SettingsNotifications component matches Figma table structure", () => {
            expect(settingsNotificationsCode).toContain("col style={{ width: \"460px\" }}");
            expect(settingsNotificationsCode).toContain("col style={{ width: \"206.5px\" }}");
            expect(settingsNotificationsCode).toContain("className=\"notif-matrix-table\"");
            expect(settingsNotificationsCode).toContain("className=\"notif-matrix-header-row\"");
            expect(settingsNotificationsCode).toContain("className=\"notif-col-name\"");
            expect(settingsNotificationsCode).toContain("className=\"notif-col-channel\"");
            expect(settingsNotificationsCode).toContain("className=\"notif-matrix-row\"");
            expect(settingsNotificationsCode).toContain("className=\"notif-row-label\"");
            expect(settingsNotificationsCode).toContain("className=\"notif-row-cell\"");
            expect(settingsNotificationsCode).toContain("className=\"notif-switch-track\"");
            expect(settingsNotificationsCode).toContain("className=\"notif-switch-thumb\"");
        });

        it("verifies persistence adapter and schema compatibility", () => {
            const defaults = DEFAULT_NOTIFICATION_MATRIX;
            expect(defaults.boq_approval.email).toBe(true);

            const updated = {
                ...defaults,
                marketing: { email: false, in_app: false, push: false, whatsapp: false },
            };
            const serialized = serializeNotificationSettings(updated);
            expect(serialized.matrix.marketing.whatsapp).toBe(false);

            const reAdapted = adaptNotificationSettings(serialized);
            expect(reAdapted.marketing.whatsapp).toBe(false);
            expect(reAdapted.boq_approval.email).toBe(true);
        });
    });
});
