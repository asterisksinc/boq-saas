import { describe, expect, it } from "vitest";
import { organizationPatchSchema } from "../lib/api/validation";

describe("Settings Organization validation and contracts", () => {
    it("validates organization patch schema with valid inputs", () => {
        const validData = {
            companyName: "Acme Constructions",
            legalEntityName: "Acme Constructions LLP",
            website: "https://acme.example.com",
            primaryEmail: "contact@acme.example.com",
            phone: "+91 22 1234 5678",
            address: "101 High Street",
            country: "India",
            state: "Maharashtra",
            postalCode: "400001",
            currency: "INR",
            timezone: "Asia/Kolkata",
            fiscalYearStart: "April",
            taxId: "27AAAAA0000A1Z5",
        };

        const parsed = organizationPatchSchema.parse(validData);
        expect(parsed.companyName).toBe("Acme Constructions");
        expect(parsed.primaryEmail).toBe("contact@acme.example.com");
        expect(parsed.currency).toBe("INR");
        expect(parsed.timezone).toBe("Asia/Kolkata");
    });

    it("rejects invalid email and invalid currency formats", () => {
        expect(() =>
            organizationPatchSchema.parse({
                primaryEmail: "not-an-email",
            })
        ).toThrow();

        expect(() =>
            organizationPatchSchema.parse({
                currency: "inr-invalid",
            })
        ).toThrow();
    });

    it("rejects arbitrary unknown fields (strict schema enforcement)", () => {
        expect(() =>
            organizationPatchSchema.parse({
                companyName: "Test Co",
                unknownHackedField: "injected",
            })
        ).toThrow();
    });

    it("supports partial updates where only specific fields are supplied", () => {
        const partialData = {
            companyName: "New Workspace Name",
            currency: "USD",
        };

        const parsed = organizationPatchSchema.parse(partialData);
        expect(parsed.companyName).toBe("New Workspace Name");
        expect(parsed.currency).toBe("USD");
        expect(parsed.primaryEmail).toBeUndefined();
    });

    it("verifies the redesigned components and styles are present", async () => {
        const fs = await import("node:fs");
        const settingsPage = fs.readFileSync("app/settings/page.tsx", "utf8");
        const subNav = fs.readFileSync("components/settings/OrganizationSubNavigation.tsx", "utf8");
        const companyProfile = fs.readFileSync("components/settings/OrganizationCompanyProfile.tsx", "utf8");
        const orgSettings = fs.readFileSync("components/settings/OrganizationSettings.tsx", "utf8");
        const globalsCss = fs.readFileSync("app/globals.css", "utf8");
        const routeCode = fs.readFileSync("app/api/v1/[...path]/route.ts", "utf8");

        // Component imports and linkage
        expect(settingsPage).toContain("<OrganizationSettings");
        expect(orgSettings).toContain("<OrganizationSubNavigation");
        expect(orgSettings).toContain("<OrganizationCompanyProfile");

        // Sub-navigation labels
        expect(subNav).toContain("SELECT MENU");
        expect(subNav).toContain("Company Profile");
        expect(subNav).toContain("Business Info");
        expect(subNav).toContain("GST & Tax");
        expect(subNav).toContain("Locations");

        // Form fields in Company Profile
        expect(companyProfile).toContain("Company Name");
        expect(companyProfile).toContain("Legal Entity Name");
        expect(companyProfile).toContain("Website");
        expect(companyProfile).toContain("Primary Email");
        expect(companyProfile).toContain("Phone");
        expect(companyProfile).toContain("Address");
        expect(companyProfile).toContain("Country");
        expect(companyProfile).toContain("State");
        expect(companyProfile).toContain("Postal Code");
        expect(companyProfile).toContain("Default Currency");
        expect(companyProfile).toContain("Timezone");
        expect(companyProfile).toContain("Fiscal Year Start");
        expect(companyProfile).toContain("Save Changes");

        // CSS classes
        expect(globalsCss).toContain(".org-settings-container");
        expect(globalsCss).toContain(".org-subnav-card");
        expect(globalsCss).toContain(".org-subnav-item.is-active");
        expect(globalsCss).toContain(".org-content-card");
        expect(globalsCss).toContain(".org-form-grid");
        expect(globalsCss).toContain(".org-btn-save");
        expect(globalsCss).toContain(".org-toggle-switch");
        expect(globalsCss).toContain(".org-setting-row");

        // Route integration
        expect(routeCode).toContain('route === "settings/organization"');
        expect(routeCode).toContain("organizationSettingsApi");
    });

    it("validates Business Info patch payload", () => {
        const bizData = {
            legalName: "Arvin Interiors LLP",
            tradeName: "Arvin Interiors",
            businessType: "Interior Design Studio",
            registrationNumber: "AAF-1234",
            gstNumber: "22AAAAA0000A1Z5",
            pan: "AAAAA0000A",
            bankName: "HDFC Bank",
            accountNumber: "50200012345678",
            ifscCode: "HDFC0001234",
            paymentTerms: "Net 30",
        };

        const parsed = organizationPatchSchema.parse(bizData);
        expect(parsed.legalName).toBe("Arvin Interiors LLP");
        expect(parsed.tradeName).toBe("Arvin Interiors");
        expect(parsed.businessType).toBe("Interior Design Studio");
        expect(parsed.registrationNumber).toBe("AAF-1234");
        expect(parsed.gstNumber).toBe("22AAAAA0000A1Z5");
        expect(parsed.pan).toBe("AAAAA0000A");
        expect(parsed.bankName).toBe("HDFC Bank");
        expect(parsed.accountNumber).toBe("50200012345678");
        expect(parsed.ifscCode).toBe("HDFC0001234");
        expect(parsed.paymentTerms).toBe("Net 30");
    });

    it("validates GST & Tax patch payload", () => {
        const taxData = {
            registeredUnderGst: true,
            gstin: "22AAAAA0000A1Z5",
            taxJurisdiction: "Maharashtra",
            taxRegime: "Regular",
            cgstRate: 9,
            sgstRate: 9,
            igstRate: 18,
            cessRate: 0,
            taxDisplay: "exclusive",
            reverseCharge: true,
        };

        const parsed = organizationPatchSchema.parse(taxData);
        expect(parsed.registeredUnderGst).toBe(true);
        expect(parsed.gstin).toBe("22AAAAA0000A1Z5");
        expect(parsed.taxJurisdiction).toBe("Maharashtra");
        expect(parsed.taxRegime).toBe("Regular");
        expect(parsed.cgstRate).toBe(9);
        expect(parsed.sgstRate).toBe(9);
        expect(parsed.igstRate).toBe(18);
        expect(parsed.cessRate).toBe(0);
        expect(parsed.taxDisplay).toBe("exclusive");
        expect(parsed.reverseCharge).toBe(true);
    });

    it("verifies OrganizationBusinessInfo component contains all Screenshot 2 fields", async () => {
        const fs = await import("node:fs");
        const bizComponent = fs.readFileSync("components/settings/OrganizationBusinessInfo.tsx", "utf8");

        expect(bizComponent).toContain("Legal Name");
        expect(bizComponent).toContain("Trade Name");
        expect(bizComponent).toContain("Business Type");
        expect(bizComponent).toContain("Registration Number");
        expect(bizComponent).toContain("GST Number");
        expect(bizComponent).toContain("PAN");
        expect(bizComponent).toContain("Bank Name");
        expect(bizComponent).toContain("Account Number");
        expect(bizComponent).toContain("IFSC Code");
        expect(bizComponent).toContain("Payment Terms");
        expect(bizComponent).toContain("Save Changes");
    });

    it("verifies OrganizationGstTax component contains all Screenshot 4 fields & cards", async () => {
        const fs = await import("node:fs");
        const gstComponent = fs.readFileSync("components/settings/OrganizationGstTax.tsx", "utf8");

        // Section 1: Registration
        expect(gstComponent).toContain("Registered under GST");
        expect(gstComponent).toContain("Organisation is a registered GST taxpayer");
        expect(gstComponent).toContain("GSTIN");
        expect(gstComponent).toContain("State / Jurisdiction");
        expect(gstComponent).toContain("Default Tax Regime");

        // Section 2: Tax Rates
        expect(gstComponent).toContain("CGST Rate (%)");
        expect(gstComponent).toContain("SGST Rate (%)");
        expect(gstComponent).toContain("IGST Rate (%)");
        expect(gstComponent).toContain("Cess (%)");

        // Section 3: Tax Behavior
        expect(gstComponent).toContain("Tax Display:");
        expect(gstComponent).toContain("Tax shown separately on documents");
        expect(gstComponent).toContain("Reverse Charge Applicable");

        // Save button and toggles
        expect(gstComponent).toContain("org-toggle-switch");
        expect(gstComponent).toContain("Save Changes");
    });

    it("verifies OrganizationSettings mounts Business Info, GST & Tax, and Locations components", async () => {
        const fs = await import("node:fs");
        const orgSettings = fs.readFileSync("components/settings/OrganizationSettings.tsx", "utf8");

        expect(orgSettings).toContain("<OrganizationBusinessInfo");
        expect(orgSettings).toContain("<OrganizationGstTax");
        expect(orgSettings).toContain("<OrganizationLocations");
    });

    it("validates locationCreateSchema and locationPatchSchema", async () => {
        const { locationCreateSchema, locationPatchSchema } = await import("../lib/api/validation");

        const validLoc = {
            name: "Head Office",
            city: "Mumbai",
            state: "Maharashtra",
            address: "12 Turner Road, Bandra West",
            isDefault: true,
        };

        const parsedCreate = locationCreateSchema.parse(validLoc);
        expect(parsedCreate.name).toBe("Head Office");
        expect(parsedCreate.city).toBe("Mumbai");
        expect(parsedCreate.state).toBe("Maharashtra");
        expect(parsedCreate.isDefault).toBe(true);

        // Required fields
        expect(() => locationCreateSchema.parse({ ...validLoc, name: "" })).toThrow();
        expect(() => locationCreateSchema.parse({ ...validLoc, city: "" })).toThrow();
        expect(() => locationCreateSchema.parse({ ...validLoc, state: "" })).toThrow();
        expect(() => locationCreateSchema.parse({ ...validLoc, address: "" })).toThrow();

        // Patch schema allows partial but rejects empty
        const parsedPatch = locationPatchSchema.parse({ name: "Branch Office" });
        expect(parsedPatch.name).toBe("Branch Office");
        expect(() => locationPatchSchema.parse({})).toThrow();
    });

    it("verifies OrganizationLocations component structure and target elements", async () => {
        const fs = await import("node:fs");
        const locComponent = fs.readFileSync("components/settings/OrganizationLocations.tsx", "utf8");
        const locModal = fs.readFileSync("components/settings/OrganizationLocationModal.tsx", "utf8");
        const delModal = fs.readFileSync("components/settings/DeleteLocationModal.tsx", "utf8");

        // Locations list view
        expect(locComponent).toContain("Locations");
        expect(locComponent).toContain("Add Location");
        expect(locComponent).toContain("DEFAULT");
        expect(locComponent).toContain("Set Default");
        expect(locComponent).toContain("Delete");
        expect(locComponent).toContain("Edit");

        // Add/Edit Location modal
        expect(locModal).toContain("Add Location");
        expect(locModal).toContain("Edit Location");
        expect(locModal).toContain("Location Name");
        expect(locModal).toContain("City");
        expect(locModal).toContain("State");
        expect(locModal).toContain("Address");
        expect(locModal).toContain("Cancel");
        expect(locModal).toContain("Save Changes");

        // Delete Location modal
        expect(delModal).toContain("Delete Location?");
        expect(delModal).toContain("This location will be permanently deleted from");
        expect(delModal).toContain("Archive");
        expect(delModal).toContain("Cancel");
        expect(delModal).toContain("org-delete-icon-wrapper");
    });

    it("verifies backend migration and API endpoints for locations", async () => {
        const fs = await import("node:fs");
        const migration = fs.readFileSync("supabase/migrations/20260924190000_workspace_locations.sql", "utf8");
        const route = fs.readFileSync("app/api/v1/[...path]/route.ts", "utf8");

        // Migration schema and policies
        expect(migration).toContain("create table if not exists public.workspace_locations");
        expect(migration).toContain("workspace_id uuid not null references public.workspaces");
        expect(migration).toContain("is_default boolean not null default false");
        expect(migration).toContain("archived_at timestamptz");
        expect(migration).toContain("workspace_locations_select_member");
        expect(migration).toContain("workspace_locations_insert_admin");
        expect(migration).toContain("workspace_locations_update_admin");
        expect(migration).toContain("workspace_locations_delete_admin");

        // API routing
        expect(route).toContain('route === "settings/organization/locations"');
        expect(route).toContain("organizationLocationsApi");
        expect(route).toContain("organizationLocationItemApi");
        expect(route).toContain("organizationLocationDefaultApi");
    });
});
