import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Settings - Organization Redesign (Figma Pixel-Perfect Specifications)", () => {
    const globalsCss = fs.readFileSync(path.resolve("app/globals.css"), "utf8");
    const subNavCode = fs.readFileSync(path.resolve("components/settings/OrganizationSubNavigation.tsx"), "utf8");
    const companyProfileCode = fs.readFileSync(path.resolve("components/settings/OrganizationCompanyProfile.tsx"), "utf8");
    const businessInfoCode = fs.readFileSync(path.resolve("components/settings/OrganizationBusinessInfo.tsx"), "utf8");
    const gstTaxCode = fs.readFileSync(path.resolve("components/settings/OrganizationGstTax.tsx"), "utf8");
    const locationsCode = fs.readFileSync(path.resolve("components/settings/OrganizationLocations.tsx"), "utf8");
    const locModalCode = fs.readFileSync(path.resolve("components/settings/OrganizationLocationModal.tsx"), "utf8");
    const delModalCode = fs.readFileSync(path.resolve("components/settings/DeleteLocationModal.tsx"), "utf8");
    const orgSettingsCode = fs.readFileSync(path.resolve("components/settings/OrganizationSettings.tsx"), "utf8");

    it("verifies Sub-Navigation Card matches Figma Frame 93 specifications", () => {
        // Sub-navigation container (258px width, rgba(255,255,255,0.6), border-radius: 6px)
        expect(globalsCss).toContain(".org-subnav-card");
        expect(globalsCss).toMatch(/\.org-subnav-card\s*\{[^}]*width:\s*258px/);
        expect(globalsCss).toMatch(/\.org-subnav-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
        expect(globalsCss).toMatch(/\.org-subnav-card\s*\{[^}]*border-radius:\s*6px/);

        // Header: SELECT MENU
        expect(subNavCode).toContain("SELECT MENU");
        expect(globalsCss).toMatch(/\.org-subnav-header\s*\{[^}]*color:\s*#64748B/);
        expect(globalsCss).toMatch(/\.org-subnav-header\s*\{[^}]*text-transform:\s*uppercase/);

        // 4 sub-nav items
        expect(subNavCode).toContain("Company Profile");
        expect(subNavCode).toContain("Business Info");
        expect(subNavCode).toContain("GST & Tax");
        expect(subNavCode).toContain("Locations");

        // Sub-nav item dimensions & active state
        expect(globalsCss).toMatch(/\.org-subnav-item\s*\{[^}]*height:\s*36px/);
        expect(globalsCss).toMatch(/\.org-subnav-item\.is-active\s*\{[^}]*border:\s*1px solid #2563EB/);
        expect(globalsCss).toMatch(/\.org-subnav-item\.is-active\s*\{[^}]*color:\s*#2563EB/);

        // Chevron icon is 18px
        expect(subNavCode).toContain("<ChevronRight size={18}");
    });

    it("verifies Right Content Area and Form Card match Figma Frame 2147225541 / 2147225143", () => {
        // Content area width (1060px)
        expect(globalsCss).toMatch(/\.org-content-area\s*\{[^}]*max-width:\s*1060px/);

        // Content card: rgba(255,255,255,0.6), border-radius: 6px, padding: 20px
        expect(globalsCss).toMatch(/\.org-content-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
        expect(globalsCss).toMatch(/\.org-content-card\s*\{[^}]*border-radius:\s*6px/);
        expect(globalsCss).toMatch(/\.org-content-card\s*\{[^}]*padding:\s*20px/);

        // 2-column form grid with 20px gap
        expect(globalsCss).toMatch(/\.org-form-grid\s*\{[^}]*column-gap:\s*20px/);
        expect(globalsCss).toMatch(/\.org-form-grid\s*\{[^}]*row-gap:\s*20px/);

        // Input & Select dimensions (48px height, #E2E8F0 border, 8px radius, #0F172A text)
        expect(globalsCss).toMatch(/\.org-input,\s*\.org-select\s*\{[^}]*height:\s*48px/);
        expect(globalsCss).toMatch(/\.org-input,\s*\.org-select\s*\{[^}]*border:\s*1px solid #E2E8F0/);
        expect(globalsCss).toMatch(/\.org-input,\s*\.org-select\s*\{[^}]*border-radius:\s*8px/);
        expect(globalsCss).toMatch(/\.org-input,\s*\.org-select\s*\{[^}]*color:\s*#0F172A/);

        // Save Changes button (119px width, 46px height, #2563EB, 6px radius)
        expect(globalsCss).toMatch(/\.org-btn-save\s*\{[^}]*width:\s*119px/);
        expect(globalsCss).toMatch(/\.org-btn-save\s*\{[^}]*height:\s*46px/);
        expect(globalsCss).toMatch(/\.org-btn-save\s*\{[^}]*background:\s*#2563EB/);
        expect(globalsCss).toMatch(/\.org-btn-save\s*\{[^}]*border-radius:\s*6px/);
    });

    it("verifies Sub-View 1: Company Profile (Personal Info) contains all 12 Figma fields", () => {
        // Row 1
        expect(companyProfileCode).toContain("Company Name");
        expect(companyProfileCode).toContain("Legal Entity Name");

        // Row 2
        expect(companyProfileCode).toContain("Website");
        expect(companyProfileCode).toContain("Primary Email");

        // Row 3
        expect(companyProfileCode).toContain("Phone");
        expect(companyProfileCode).toContain("Address");

        // Row 4
        expect(companyProfileCode).toContain("Country");
        expect(companyProfileCode).toContain("State");

        // Row 5
        expect(companyProfileCode).toContain("Postal Code");
        expect(companyProfileCode).toContain("Default Currency");

        // Row 6
        expect(companyProfileCode).toContain("Timezone");
        expect(companyProfileCode).toContain("Fiscal Year Start");

        // Action button
        expect(companyProfileCode).toContain("Save Changes");
    });

    it("verifies Sub-View 2: Business Info contains all 10 Figma fields", () => {
        // Row 1
        expect(businessInfoCode).toContain("Legal Name");
        expect(businessInfoCode).toContain("Trade Name");

        // Row 2
        expect(businessInfoCode).toContain("Business Type");
        expect(businessInfoCode).toContain("Registration Number");

        // Row 3
        expect(businessInfoCode).toContain("GST Number");
        expect(businessInfoCode).toContain("PAN");

        // Row 4
        expect(businessInfoCode).toContain("Bank Name");
        expect(businessInfoCode).toContain("Account Number");

        // Row 5
        expect(businessInfoCode).toContain("IFSC Code");
        expect(businessInfoCode).toContain("Payment Terms");

        // Action button
        expect(businessInfoCode).toContain("Save Changes");
    });

    it("verifies Sub-View 3: GST & Tax separates into 4 distinct Figma cards with toggle switches", () => {
        // Card 1: Registered under GST
        expect(gstTaxCode).toContain("Registered under GST");
        expect(gstTaxCode).toContain("Organisation is a registered GST taxpayer");

        // Card 2: Tax Registration Details
        expect(gstTaxCode).toContain("GSTIN");
        expect(gstTaxCode).toContain("State / Jurisdiction");
        expect(gstTaxCode).toContain("Default Tax Regime");
        expect(gstTaxCode).toContain("org-field-empty");

        // Card 3: Tax Rates
        expect(gstTaxCode).toContain("CGST Rate (%)");
        expect(gstTaxCode).toContain("SGST Rate (%)");
        expect(gstTaxCode).toContain("IGST Rate (%)");
        expect(gstTaxCode).toContain("Cess (%)");

        // Card 4: Additional Tax Settings
        expect(gstTaxCode).toContain("Tax Display:");
        expect(gstTaxCode).toContain("Tax shown separately on documents");
        expect(gstTaxCode).toContain("Reverse Charge Applicable");

        // Toggle Switch specifications (40x22px, #2563EB, 16px thumb, radius 9999px)
        expect(globalsCss).toMatch(/\.org-toggle-switch\s*\{[^}]*width:\s*40px/);
        expect(globalsCss).toMatch(/\.org-toggle-switch\s*\{[^}]*height:\s*22px/);
        expect(globalsCss).toMatch(/\.org-toggle-switch\.is-checked\s*\{[^}]*background-color:\s*#2563EB/);
        expect(globalsCss).toMatch(/\.org-toggle-thumb\s*\{[^}]*width:\s*16px/);
        expect(globalsCss).toMatch(/\.org-toggle-thumb\s*\{[^}]*height:\s*16px/);
    });

    it("verifies Sub-View 4: Locations adheres to Figma Frame 2147225145/2147225146 specifications", () => {
        // Header
        expect(locationsCode).toContain("Locations");
        expect(locationsCode).toContain("Add Location");
        expect(globalsCss).toMatch(/\.org-btn-add-location\s*\{[^}]*width:\s*133px/);
        expect(globalsCss).toMatch(/\.org-btn-add-location\s*\{[^}]*height:\s*38px/);
        expect(globalsCss).toMatch(/\.org-btn-add-location\s*\{[^}]*background:\s*#2563EB/);

        // Location card row (min-height: 82px, rgba(255,255,255,0.6), border 1px #E2E8F0, radius 6px)
        expect(globalsCss).toMatch(/\.org-location-row\s*\{[^}]*min-height:\s*82px/);
        expect(globalsCss).toMatch(/\.org-location-row\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
        expect(globalsCss).toMatch(/\.org-location-row\s*\{[^}]*border:\s*1px solid #E2E8F0/);
        expect(globalsCss).toMatch(/\.org-location-row\s*\{[^}]*border-radius:\s*6px/);

        // DEFAULT badge
        expect(locationsCode).toContain("DEFAULT");
        expect(globalsCss).toMatch(/\.org-loc-default-badge\s*\{[^}]*background:\s*rgba\(37,\s*99,\s*235,\s*0\.12\)/);
        expect(globalsCss).toMatch(/\.org-loc-default-badge\s*\{[^}]*color:\s*#2563EB/);
        expect(globalsCss).toMatch(/\.org-loc-default-badge\s*\{[^}]*border-radius:\s*9999px/);

        // Action Buttons: Edit (56x34px), Set Default (103x34px), Delete (73x34px, #DC2626)
        expect(globalsCss).toMatch(/\.org-loc-btn-neutral\s*\{[^}]*width:\s*56px/);
        expect(globalsCss).toMatch(/\.org-loc-btn-neutral\s*\{[^}]*height:\s*34px/);
        expect(globalsCss).toMatch(/\.org-loc-btn-default\s*\{[^}]*width:\s*103px/);
        expect(globalsCss).toMatch(/\.org-loc-btn-delete\s*\{[^}]*width:\s*73px/);
        expect(globalsCss).toMatch(/\.org-loc-btn-delete\s*\{[^}]*color:\s*#DC2626/);

        // Modals
        expect(locModalCode).toContain("Add Location");
        expect(locModalCode).toContain("Edit Location");
        expect(delModalCode).toContain("Delete Location?");
        expect(delModalCode).toContain("Archive");
    });

    it("verifies OrganizationSettings integrates dynamically and handles role permissions cleanly", () => {
        expect(orgSettingsCode).toContain("canEdit");
        expect(orgSettingsCode).toContain("org-permission-banner");
        expect(orgSettingsCode).toContain("activeSubTab");
        expect(orgSettingsCode).toContain("<OrganizationSubNavigation");
        expect(orgSettingsCode).toContain("<OrganizationCompanyProfile");
        expect(orgSettingsCode).toContain("<OrganizationBusinessInfo");
        expect(orgSettingsCode).toContain("<OrganizationGstTax");
        expect(orgSettingsCode).toContain("<OrganizationLocations");
    });
});
