import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";

describe("Custom Website Webhook & Form Setup Modal — Figma Redesign", () => {
    const webhookCode = readFileSync("components/integrations/WebhookSetupStep.tsx", "utf8");
    const formDetailsCode = readFileSync("components/integrations/FormDetailsStep.tsx", "utf8");
    const fieldEditorCode = readFileSync("components/integrations/FieldEditor.tsx", "utf8");
    const formFieldRowCode = readFileSync("components/integrations/FormFieldRow.tsx", "utf8");
    const successStepCode = readFileSync("components/integrations/IntegrationSuccessStep.tsx", "utf8");
    const modalCode = readFileSync("components/integrations/IntegrationModal.tsx", "utf8");
    const cssCode = readFileSync("app/integrations/integrations.css", "utf8");
    const detailCode = readFileSync("components/integrations/IntegrationDetail.tsx", "utf8");
    const overviewCode = readFileSync("components/integrations/IntegrationOverview.tsx", "utf8");

    describe("1. Modal Frame & Backdrop Token Compliance (Frame 2147225096)", () => {
        it("verifies modal outer container has 590px max-width, frosted glass rgba(255,255,255,0.6), blur 20.4px, and 16px radius", () => {
            expect(cssCode).toContain(".intg-custom-website-modal {");
            expect(cssCode).toContain("max-width: 590px;");
            expect(cssCode).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(cssCode).toContain("backdrop-filter: blur(20.4px);");
            expect(cssCode).toContain("border-radius: 16px;");
            expect(cssCode).toContain("padding: 16px;");
            expect(cssCode).toContain("gap: 16px;");
        });

        it("verifies inner card has #FFFFFF background, 14px border radius, and 16px padding (Frame 2147225027)", () => {
            expect(cssCode).toContain(".intg-custom-modal-card {");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("border-radius: 14px;");
            expect(cssCode).toContain("padding: 16px;");
            expect(cssCode).toContain("gap: 16px;");
        });
    });

    describe("2. Step 1: Webhook Setup (Frame 2147225096 & 2147225027)", () => {
        it("verifies Webhook Setup header with Urbanist 18px 600 title and 16px 500 subtitle", () => {
            expect(webhookCode).toContain("Webhook Setup");
            expect(webhookCode).toContain("Send POST requests to the following URL");
            expect(webhookCode).toContain("intg-custom-modal-title");
            expect(webhookCode).toContain("intg-custom-modal-subtitle");

            expect(cssCode).toContain(".intg-custom-modal-title {");
            expect(cssCode).toContain("font-size: 18px;");
            expect(cssCode).toContain("font-weight: 600;");
            expect(cssCode).toContain("color: #0F172A;");

            expect(cssCode).toContain(".intg-custom-modal-subtitle {");
            expect(cssCode).toContain("font-size: 16px;");
            expect(cssCode).toContain("font-weight: 500;");
            expect(cssCode).toContain("color: #64748B;");
        });

        it("verifies Webhook URL input box with 48px height, #FFFFFF, 1px solid #E2E8F0, and copy button", () => {
            expect(webhookCode).toContain("Webhook URL");
            expect(webhookCode).toContain("intg-webhook-input-box");
            expect(webhookCode).toContain("intg-webhook-copy-btn");
            expect(webhookCode).toContain("https://app.boqsaas.com/webhooks/custom-website/abc123");

            expect(cssCode).toContain(".intg-webhook-input-box {");
            expect(cssCode).toContain("height: 48px;");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("border: 1px solid #E2E8F0;");
            expect(cssCode).toContain("border-radius: 8px;");
            expect(cssCode).toContain("padding: 14px 16px;");
        });

        it("verifies How it works? helper card with 109px height, #F2F3F2 background, and 3-step instructions", () => {
            expect(webhookCode).toContain("How it works?");
            expect(webhookCode).toContain("1. Copy the Webhook URL above. 2. Add this URL to your website");
            expect(webhookCode).toContain("3. Send a POST request with lead data when a form is submitted.");

            expect(cssCode).toContain(".intg-how-it-works-box {");
            expect(cssCode).toContain("min-height: 109px;");
            expect(cssCode).toContain("background: #F2F3F2;");
            expect(cssCode).toContain("border: 1px solid #E2E8F0;");
            expect(cssCode).toContain("border-radius: 8px;");
            expect(cssCode).toContain("padding: 12px;");

            expect(cssCode).toContain(".intg-how-it-works-title {");
            expect(cssCode).toContain("font-family: 'Inter'");
            expect(cssCode).toContain("font-size: 14px;");
            expect(cssCode).toContain("font-weight: 500;");
            expect(cssCode).toContain("color: #0F172A;");

            expect(cssCode).toContain(".intg-how-it-works-text {");
            expect(cssCode).toContain("font-family: 'Inter'");
            expect(cssCode).toContain("font-size: 12px;");
            expect(cssCode).toContain("line-height: 160%;");
            expect(cssCode).toContain("color: #475569;");
        });

        it("verifies Webhook Setup footer actions (Frame 2147225069): Cancel (71x46px) and Next (58x46px #2563EB)", () => {
            expect(webhookCode).toContain("intg-custom-btn-cancel");
            expect(webhookCode).toContain("intg-custom-btn-primary");
            expect(webhookCode).toContain("Cancel");
            expect(webhookCode).toContain("Next");

            expect(cssCode).toContain(".intg-custom-btn-cancel {");
            expect(cssCode).toContain("min-width: 71px;");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("color: #0F172A;");

            expect(cssCode).toContain(".intg-custom-btn-primary {");
            expect(cssCode).toContain("min-width: 58px;");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("background: #2563EB;");
            expect(cssCode).toContain("color: #FFFFFF;");
        });
    });

    describe("2. Step 2: Form Details (Frame 2147225096 & 2147225027)", () => {
        it("verifies Form Details header with Urbanist 18px 600 title and 16px 500 subtitle", () => {
            expect(formDetailsCode).toContain("Form Details");
            expect(formDetailsCode).toContain("Add basic details for your form");
            expect(formDetailsCode).toContain("intg-custom-modal-title");
            expect(formDetailsCode).toContain("intg-custom-modal-subtitle");
        });

        it("verifies Form Name input with 48px height and placeholder 'Enter form name'", () => {
            expect(formDetailsCode).toContain("Form Name");
            expect(formDetailsCode).toContain("placeholder=\"Enter form name\"");
            expect(formDetailsCode).toContain("className=\"intg-custom-input\"");
        });

        it("verifies default 4 fields configured in IntegrationModal matching Figma design mockup", () => {
            expect(modalCode).toContain("Full Name");
            expect(modalCode).toContain("Email Address");
            expect(modalCode).toContain("Interested in");
            expect(modalCode).toContain("Subscribe to Newsletter");
            expect(modalCode).toContain("'Residential Construction'");
            expect(modalCode).toContain("'Commercial BOQ'");
            expect(modalCode).toContain("'Interior Estimation'");
        });

        it("verifies FormFieldRow with 48px height, #F2F3F2 background, drag handle, name, uppercase type pill, and edit/delete buttons", () => {
            expect(formFieldRowCode).toContain("intg-field-row");
            expect(formFieldRowCode).toContain("intg-field-drag-handle");
            expect(formFieldRowCode).toContain("intg-field-type-pill");
            expect(formFieldRowCode).toContain("SHORT ANSWER");
            expect(formFieldRowCode).toContain("DROP DOWN");
            expect(formFieldRowCode).toContain("CHECK BOX");
            expect(formFieldRowCode).toContain("intg-field-edit-btn");
            expect(formFieldRowCode).toContain("intg-field-delete-btn");

            expect(cssCode).toContain(".intg-field-row {");
            expect(cssCode).toContain("height: 48px;");
            expect(cssCode).toContain("background: #F2F3F2;");
            expect(cssCode).toContain("border: 1px solid #E2E8F0;");
            expect(cssCode).toContain("border-radius: 8px;");
            expect(cssCode).toContain("padding: 14px;");

            expect(cssCode).toContain(".intg-field-type-pill {");
            expect(cssCode).toContain("background: rgba(100, 116, 139, 0.12);");
            expect(cssCode).toContain("border-radius: 9999px;");
            expect(cssCode).toContain("padding: 2px 6px;");

            expect(cssCode).toContain(".intg-field-type-pill-text {");
            expect(cssCode).toContain("font-size: 12px;");
            expect(cssCode).toContain("color: #64748B;");
            expect(cssCode).toContain("text-transform: uppercase;");
        });

        it("verifies '+ Add New Field' button with 46px height, 1px solid #2563EB border, and #2563EB text", () => {
            expect(formDetailsCode).toContain("intg-add-new-field-btn");
            expect(formDetailsCode).toContain("Add New Field");

            expect(cssCode).toContain(".intg-add-new-field-btn {");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("border: 1px solid #2563EB;");
            expect(cssCode).toContain("color: #2563EB;");
            expect(cssCode).toContain("font-weight: 600;");
            expect(cssCode).toContain("border-radius: 6px;");
        });

        it("verifies Form Details footer actions (Frame 2147225094): Back (59x46px), Cancel (71x46px), and Next/Save (58x46px #2563EB)", () => {
            expect(formDetailsCode).toContain("intg-custom-btn-back");
            expect(formDetailsCode).toContain("intg-custom-btn-cancel");
            expect(formDetailsCode).toContain("intg-custom-btn-primary");
            expect(formDetailsCode).toContain("Back");
            expect(formDetailsCode).toContain("Cancel");
            expect(formDetailsCode).toContain("Next");

            expect(cssCode).toContain(".intg-custom-btn-back {");
            expect(cssCode).toContain("min-width: 59px;");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("background: #FFFFFF;");
        });
    });

    describe("3. Add New Field Inline Card (Frame 2147225130)", () => {
        it("verifies FieldEditor card with 1px solid #E2E8F0, 16px radius, and 14px padding", () => {
            expect(fieldEditorCode).toContain("intg-field-editor-box");

            expect(cssCode).toContain(".intg-field-editor-box {");
            expect(cssCode).toContain("border: 1px solid #E2E8F0;");
            expect(cssCode).toContain("border-radius: 16px;");
            expect(cssCode).toContain("padding: 14px;");
            expect(cssCode).toContain("gap: 14px;");
            expect(cssCode).toContain("background: #FFFFFF;");
        });

        it("verifies Field Name input and Field Type select with Short Answer, Long Answer, Dropdown, Checkbox, Link", () => {
            expect(fieldEditorCode).toContain("Field Name");
            expect(fieldEditorCode).toContain("placeholder=\"Enter field name\"");
            expect(fieldEditorCode).toContain("Field Type");
            expect(fieldEditorCode).toContain("Short Answer");
            expect(fieldEditorCode).toContain("Long Answer");
            expect(fieldEditorCode).toContain("Dropdown");
            expect(fieldEditorCode).toContain("Checkbox");
            expect(fieldEditorCode).toContain("Link");

            expect(cssCode).toContain(".intg-editor-input,");
            expect(cssCode).toContain(".intg-editor-select {");
            expect(cssCode).toContain("height: 48px;");
            expect(cssCode).toContain("border: 1px solid #E2E8F0;");
            expect(cssCode).toContain("border-radius: 8px;");
        });

        it("verifies Dropdown options configuration (Edit Fields - Drop Down)", () => {
            expect(fieldEditorCode).toContain("intg-dropdown-options-group");
            expect(fieldEditorCode).toContain("intg-dropdown-option-row");
            expect(fieldEditorCode).toContain("intg-editor-add-option-btn");
            expect(fieldEditorCode).toContain("Add Option");
        });

        it("verifies Required Field checkbox (Frame 249) and divider (Rectangle 4477)", () => {
            expect(fieldEditorCode).toContain("Required Field");
            expect(fieldEditorCode).toContain("intg-editor-checkbox");
            expect(fieldEditorCode).toContain("intg-editor-divider");

            expect(cssCode).toContain(".intg-editor-checkbox-text {");
            expect(cssCode).toContain("font-size: 14px;");
            expect(cssCode).toContain("color: #64748B;");

            expect(cssCode).toContain(".intg-editor-divider {");
            expect(cssCode).toContain("height: 1px;");
            expect(cssCode).toContain("background: #E2E8F0;");
        });

        it("verifies mini actions (Frame 2147225510): Cancel (75x34px) and Add Field (min-width 91px, 34px height, #2563EB)", () => {
            expect(fieldEditorCode).toContain("intg-editor-btn-cancel");
            expect(fieldEditorCode).toContain("intg-editor-btn-add");
            expect(fieldEditorCode).toContain("Cancel");
            expect(fieldEditorCode).toContain("Add Field");

            expect(cssCode).toContain(".intg-editor-actions {");
            expect(cssCode).toContain("height: 34px;");
            expect(cssCode).toContain("gap: 14px;");

            expect(cssCode).toContain(".intg-editor-btn-cancel {");
            expect(cssCode).toContain("width: 75px;");
            expect(cssCode).toContain("height: 34px;");
            expect(cssCode).toContain("background: #FFFFFF;");

            expect(cssCode).toContain(".intg-editor-btn-add {");
            expect(cssCode).toContain("min-width: 91px;");
            expect(cssCode).toContain("height: 34px;");
            expect(cssCode).toContain("background: #2563EB;");
            expect(cssCode).toContain("color: #FFFFFF;");
        });
    });

    describe("4. Integration Flow & Parent Dashboard Integration", () => {
        it("verifies IntegrationModal triggers form creation via integrationsApi.createForm", () => {
            expect(modalCode).toContain("integrationsApi.createForm");
            expect(modalCode).toContain("integrationId");
            expect(modalCode).toContain("name: formName.trim()");
            expect(modalCode).toContain("fieldType: f.type");
        });

        it("verifies IntegrationSuccessStep renders form link and embed html with copy actions", () => {
            expect(successStepCode).toContain("Share Form Link");
            expect(successStepCode).toContain("Embed Form Code");
            expect(successStepCode).toContain("View Leads");
            expect(successStepCode).toContain("Done");
        });

        it("verifies IntegrationDetail renders IntegrationModal when New Custom Form is triggered", () => {
            expect(detailCode).toContain("<IntegrationModal");
            expect(detailCode).toContain("provider={integration.provider}");
            expect(detailCode).toContain("setShowNewFormModal(true)");
        });

        it("verifies IntegrationOverview triggers connect modal for custom_website", () => {
            expect(overviewCode).toContain("handleConnect");
            expect(overviewCode).toContain("setSelectedProvider");
            expect(overviewCode).toContain("<IntegrationModal");
            expect(overviewCode).toContain("provider={selectedProvider}");
        });
    });
});
