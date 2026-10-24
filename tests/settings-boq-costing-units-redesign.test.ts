import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Settings -> BOQ & Costing -> Units Redesign (Figma CSS Verification)", () => {
    const globalsCssPath = path.resolve("E:/boq-saas-chandu/boq-saas/app/globals.css");
    const unitsTablePath = path.resolve("E:/boq-saas-chandu/boq-saas/components/settings/boq-costing/Units/UnitsTable.tsx");
    const unitModalPath = path.resolve("E:/boq-saas-chandu/boq-saas/components/settings/boq-costing/Units/UnitModal.tsx");
    const boqNavPath = path.resolve("E:/boq-saas-chandu/boq-saas/components/settings/boq-costing/BoqCostingNavigation.tsx");
    const boqLayoutPath = path.resolve("E:/boq-saas-chandu/boq-saas/components/settings/boq-costing/BoqCostingLayout.tsx");

    const globalsCss = fs.readFileSync(globalsCssPath, "utf8");
    const unitsTableCode = fs.readFileSync(unitsTablePath, "utf8");
    const unitModalCode = fs.readFileSync(unitModalPath, "utf8");
    const boqNavCode = fs.readFileSync(boqNavPath, "utf8");
    const boqLayoutCode = fs.readFileSync(boqLayoutPath, "utf8");

    it("verifies container gap arithmetic and elimination of the right-side gap (Frame 2147225534)", () => {
        // Parent container must have gap: 8px to match 258px + 8px + 1060px = 1326px math
        expect(globalsCss).toContain(".boq-costing-container");
        expect(globalsCss).toMatch(/\.boq-costing-container\s*\{[^}]*gap:\s*8px/);
        expect(globalsCss).toMatch(/\.boq-costing-container\s*\{[^}]*max-width:\s*1326px/);

        // Content area must stretch freely via flex: 1 1 0% without hardcoded restricted width
        expect(globalsCss).toMatch(/\.boq-content-area\s*\{[^}]*flex:\s*1\s+1\s+0%/);
        expect(globalsCss).toMatch(/\.boq-content-area\s*\{[^}]*min-width:\s*0/);
    });

    it("verifies BOQ & Costing submenu design tokens (Frame 93)", () => {
        // Submenu card must be 258px wide with rgba(255, 255, 255, 0.6) and radius 6px
        expect(globalsCss).toMatch(/\.boq-subnav-card\s*\{[^}]*width:\s*258px/);
        expect(globalsCss).toMatch(/\.boq-subnav-card\s*\{[^}]*padding:\s*10px/);
        expect(globalsCss).toMatch(/\.boq-subnav-card\s*\{[^}]*gap:\s*12px/);
        expect(globalsCss).toMatch(/\.boq-subnav-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
        expect(globalsCss).toMatch(/\.boq-subnav-card\s*\{[^}]*border-radius:\s*6px/);

        // Submenu items: 36px height, 4px border-radius, Urbanist font
        expect(globalsCss).toMatch(/\.boq-subnav-item\s*\{[^}]*height:\s*36px/);
        expect(globalsCss).toMatch(/\.boq-subnav-item\s*\{[^}]*border-radius:\s*4px/);
        expect(globalsCss).toMatch(/\.boq-subnav-item\.is-active\s*\{[^}]*border:\s*1px\s+solid\s+#2563EB/i);

        // Navigation component markup
        expect(boqNavCode).toContain("SELECT MENU");
        expect(boqNavCode).toContain("boq-subnav-card");
        expect(boqNavCode).toContain("boq-subnav-item");
        expect(boqNavCode).toContain("ChevronRight");
    });

    it("verifies Units panel container and header tokens (Frame 2147225146 & Frame 2147225545)", () => {
        // Outer panel card: padding 20px, gap 20px, rgba(255, 255, 255, 0.6), radius 6px
        expect(globalsCss).toMatch(/\.boq-content-card,\s*\.boq-units-panel\s*\{[^}]*padding:\s*20px/);
        expect(globalsCss).toMatch(/\.boq-content-card,\s*\.boq-units-panel\s*\{[^}]*gap:\s*20px/);
        expect(globalsCss).toMatch(/\.boq-content-card,\s*\.boq-units-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
        expect(globalsCss).toMatch(/\.boq-content-card,\s*\.boq-units-panel\s*\{[^}]*border-radius:\s*6px/);

        // Header: title BOQ & Costing (16px 600 #0F172A)
        expect(globalsCss).toMatch(/\.boq-card-title\s*\{[^}]*font-size:\s*16px/);
        expect(globalsCss).toMatch(/\.boq-card-title\s*\{[^}]*font-weight:\s*600/);
        expect(globalsCss).toMatch(/\.boq-card-title\s*\{[^}]*color:\s*#0F172A/i);

        // Add Custom Unit button: 38px height, 157px min-width, #2563EB, radius 6px
        expect(globalsCss).toMatch(/\.boq-btn-add-unit[^{]*\{[^}]*min-width:\s*157px/);
        expect(globalsCss).toMatch(/\.boq-btn-add-unit[^{]*\{[^}]*height:\s*38px/);
        expect(globalsCss).toMatch(/\.boq-btn-add-unit[^{]*\{[^}]*background:\s*#2563EB/i);
        expect(globalsCss).toMatch(/\.boq-btn-add-unit[^{]*\{[^}]*border-radius:\s*6px/);
    });

    it("verifies Units table header and row specifications (Frame 57 & Frame 61)", () => {
        // Table header row: 36px height, background #E4ECFB, radius 8px
        expect(globalsCss).toMatch(/\.boq-table-header-row\s*\{[^}]*height:\s*36px/);
        expect(globalsCss).toMatch(/\.boq-table-header-row\s*\{[^}]*background:\s*#E4ECFB/i);
        expect(globalsCss).toMatch(/\.boq-table\s+th\s*\{[^}]*text-transform:\s*uppercase/);
        expect(globalsCss).toMatch(/\.boq-table\s+th\s*\{[^}]*color:\s*#64748B/i);

        // Table body rows: 56px height, divider 1px #EBEBEB
        expect(globalsCss).toMatch(/\.boq-table-row\s*\{[^}]*height:\s*56px/);
        expect(globalsCss).toMatch(/\.boq-table-row\s*\{[^}]*border-bottom:\s*1px\s+solid\s+#EBEBEB/i);

        // Toggle switch: 40px x 22px, pill radius 77.5px, #2563EB active, 16px thumb
        expect(globalsCss).toMatch(/\.boq-toggle\s*\{[^}]*width:\s*40px/);
        expect(globalsCss).toMatch(/\.boq-toggle\s*\{[^}]*height:\s*22px/);
        expect(globalsCss).toMatch(/\.boq-toggle\s*\{[^}]*border-radius:\s*77\.5px/);
        expect(globalsCss).toMatch(/\.boq-toggle\.is-active\s*\{[^}]*background:\s*#2563EB/i);
        expect(globalsCss).toMatch(/\.boq-toggle-thumb\s*\{[^}]*width:\s*16px/);
        expect(globalsCss).toMatch(/\.boq-toggle-thumb\s*\{[^}]*height:\s*16px/);
        expect(globalsCss).toMatch(/\.boq-toggle\.is-active\s+\.boq-toggle-thumb\s*\{[^}]*transform:\s*translateX\(18px\)/);

        // Table component markup
        expect(unitsTableCode).toContain("UNIT NAME");
        expect(unitsTableCode).toContain("CODE");
        expect(unitsTableCode).toContain("TYPE");
        expect(unitsTableCode).toContain("DECIMALS");
        expect(unitsTableCode).toContain("ACTIVE");
        expect(unitsTableCode).toContain("boq-toggle");
        expect(unitsTableCode).toContain("MoreHorizontal");
    });

    it("verifies Add Custom Unit Modal specifications (Frame 2147225094, 2147225093, 2147225027, 2147225095)", () => {
        // Modal backdrop: rgba(0, 0, 0, 0.25), blur 4.25px
        expect(globalsCss).toMatch(/\.boq-modal-backdrop\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.25\)/);
        expect(globalsCss).toMatch(/\.boq-modal-backdrop\s*\{[^}]*backdrop-filter:\s*blur\(4\.25px\)/);

        // Modal container: width 590px, radius 16px, rgba(255, 255, 255, 0.6)
        expect(globalsCss).toMatch(/\.boq-modal-container\s*\{[^}]*width:\s*590px/);
        expect(globalsCss).toMatch(/\.boq-modal-container\s*\{[^}]*border-radius:\s*16px/);
        expect(globalsCss).toMatch(/\.boq-modal-container\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);

        // Inner white card: #FFFFFF, radius 14px, padding 16px, gap 16px
        expect(globalsCss).toMatch(/\.boq-modal-inner-card\s*\{[^}]*background:\s*#FFFFFF/i);
        expect(globalsCss).toMatch(/\.boq-modal-inner-card\s*\{[^}]*border-radius:\s*14px/);
        expect(globalsCss).toMatch(/\.boq-modal-inner-card\s*\{[^}]*padding:\s*16px/);
        expect(globalsCss).toMatch(/\.boq-modal-inner-card\s*\{[^}]*gap:\s*16px/);

        // Type pills: height 42px, radius 8px, selected rgba(37, 99, 235, 0.1) & 1px solid #2563EB
        expect(globalsCss).toMatch(/\.boq-type-pill\s*\{[^}]*height:\s*42px/);
        expect(globalsCss).toMatch(/\.boq-type-pill\s*\{[^}]*border-radius:\s*8px/);
        expect(globalsCss).toMatch(/\.boq-type-pill\.is-selected\s*\{[^}]*background:\s*rgba\(37,\s*99,\s*235,\s*0\.1\)/);
        expect(globalsCss).toMatch(/\.boq-type-pill\.is-selected\s*\{[^}]*border:\s*1px\s+solid\s+#2563EB/i);

        // Footer buttons: Cancel 71px x 46px (#FFFFFF, 14px 600 #0F172A), Add Unit 83px x 46px (#2563EB, 14px 600 #FFFFFF)
        expect(globalsCss).toMatch(/\.boq-modal-btn-cancel\s*\{[^}]*min-width:\s*71px/);
        expect(globalsCss).toMatch(/\.boq-modal-btn-cancel\s*\{[^}]*height:\s*46px/);
        expect(globalsCss).toMatch(/\.boq-modal-btn-cancel\s*\{[^}]*background:\s*#FFFFFF/i);
        expect(globalsCss).toMatch(/\.boq-modal-btn-cancel\s*\{[^}]*color:\s*#0F172A/i);

        expect(globalsCss).toMatch(/\.boq-modal-btn-submit\s*\{[^}]*min-width:\s*83px/);
        expect(globalsCss).toMatch(/\.boq-modal-btn-submit\s*\{[^}]*height:\s*46px/);
        expect(globalsCss).toMatch(/\.boq-modal-btn-submit\s*\{[^}]*background:\s*#2563EB/i);
        expect(globalsCss).toMatch(/\.boq-modal-btn-submit\s*\{[^}]*color:\s*#FFFFFF/i);

        // Modal component markup
        expect(unitModalCode).toContain("Add Custom Unit");
        expect(unitModalCode).toContain("Unit Name");
        expect(unitModalCode).toContain("e.g. Bundle");
        expect(unitModalCode).toContain("Short Code");
        expect(unitModalCode).toContain("e.g. Bndl");
        expect(unitModalCode).toContain("Decimal Places");
        expect(unitModalCode).toContain("ChevronDown");
        expect(unitModalCode).toContain("Type");
        expect(unitModalCode).toContain("Cancel");
        expect(unitModalCode).toContain("Add Unit");
        expect(unitModalCode).toContain("role=\"dialog\"");
        expect(unitModalCode).toContain("aria-modal=\"true\"");
    });

    it("verifies full functional wiring between Layout, Table, and Modal", () => {
        expect(boqLayoutCode).toContain("handleSaveUnit");
        expect(boqLayoutCode).toContain("handleToggleUnitActive");
        expect(boqLayoutCode).toContain("handleDeleteUnit");
        expect(boqLayoutCode).toContain("getBoqCostingSettings");
        expect(boqLayoutCode).toContain("updateBoqCostingSettings");

        expect(unitsTableCode).toContain("onSaveUnit");
        expect(unitsTableCode).toContain("onToggleActive");
        expect(unitsTableCode).toContain("onDeleteUnit");

        expect(unitModalCode).toContain("validateForm");
        expect(unitModalCode).toContain("A unit with this short code already exists");
    });
});
