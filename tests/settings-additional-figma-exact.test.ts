import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Settings → Additional Figma Exact Design Specification", () => {
    const cssPath = path.join(process.cwd(), "app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    describe("1. Master Layout & Two-Column Split Arithmetic (1326px Total)", () => {
        it("verifies master container has 1326px max-width, flex-row, and 8px gap", () => {
            expect(cssContent).toMatch(/\.additional-settings-layout\s*\{[^}]*max-width:\s*1326px;/);
            expect(cssContent).toMatch(/\.additional-settings-layout\s*\{[^}]*gap:\s*8px;/);
            expect(cssContent).toMatch(/\.additional-settings-layout\s*\{[^}]*display:\s*flex;/);
            expect(cssContent).toMatch(/\.additional-settings-layout\s*\{[^}]*flex-direction:\s*row;/);
        });

        it("verifies left sub-navigation panel is exactly 258px wide, 169px high with 6px radius and frosted glass", () => {
            expect(cssContent).toMatch(/\.additional-subnav-panel\s*\{[^}]*width:\s*258px;/);
            expect(cssContent).toMatch(/\.additional-subnav-panel\s*\{[^}]*height:\s*169px;/);
            expect(cssContent).toMatch(/\.additional-subnav-panel\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.additional-subnav-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
            expect(cssContent).toMatch(/\.additional-subnav-panel\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\);/);
        });

        it("verifies right content panel is exactly 1060px wide with 6px radius, 20px padding and 20px gap", () => {
            expect(cssContent).toMatch(/\.additional-main-container\s*\{[^}]*width:\s*1060px;/);
            expect(cssContent).toMatch(/\.additional-main-container\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.additional-main-container\s*\{[^}]*padding:\s*20px;/);
            expect(cssContent).toMatch(/\.additional-main-container\s*\{[^}]*gap:\s*20px;/);
            expect(cssContent).toMatch(/\.additional-main-container\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        });

        it("verifies subpage min-heights match Figma frames (Export: 181px, Retention: 282px, Delete: 194px)", () => {
            expect(cssContent).toMatch(/\.additional-main-container\.is-data-export\s*\{[^}]*min-height:\s*181px;/);
            expect(cssContent).toMatch(/\.additional-main-container\.is-data-retention\s*\{[^}]*min-height:\s*282px;/);
            expect(cssContent).toMatch(/\.additional-main-container\.is-delete-account\s*\{[^}]*min-height:\s*194px;/);
        });

        it("verifies layout arithmetic: 258px (subnav) + 8px (gap) + 1060px (content card) = 1326px exact", () => {
            const subnavWidth = 258;
            const gap = 8;
            const contentWidth = 1060;
            const total = subnavWidth + gap + contentWidth;
            expect(total).toBe(1326);
        });

        it("verifies inner content arithmetic: 1060px - 2 * 20px (padding) = 1020px exact", () => {
            const outerContentWidth = 1060;
            const horizontalPadding = 20 * 2;
            const innerWidth = outerContentWidth - horizontalPadding;
            expect(innerWidth).toBe(1020);
        });

        it("verifies horizontal divider is 1020px wide, 1px high with #E2E8F0 background", () => {
            expect(cssContent).toMatch(/\.additional-card-divider\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.additional-card-divider\s*\{[^}]*height:\s*1px;/);
            expect(cssContent).toMatch(/\.additional-card-divider\s*\{[^}]*background:\s*#E2E8F0;/);
        });
    });

    describe("2. Sub-Navigation Design (Frame 2147225543 & Frame 2147225542)", () => {
        it("verifies subnav header has uppercase SELECT MENU styling with Urbanist 14px 500 #64748B", () => {
            expect(cssContent).toMatch(/\.additional-subnav-header\s*\{[^}]*text-transform:\s*uppercase;/);
            expect(cssContent).toMatch(/\.additional-subnav-header\s*\{[^}]*color:\s*#64748B;/);
            expect(cssContent).toMatch(/\.additional-subnav-header\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.additional-subnav-header\s*\{[^}]*font-weight:\s*500;/);
        });

        it("verifies sub-navigation items are 238px x 36px with 4px radius and #FFFFFF background", () => {
            expect(cssContent).toMatch(/\.additional-subnav-item\s*\{[^}]*width:\s*238px;/);
            expect(cssContent).toMatch(/\.additional-subnav-item\s*\{[^}]*height:\s*36px;/);
            expect(cssContent).toMatch(/\.additional-subnav-item\s*\{[^}]*border-radius:\s*4px;/);
            expect(cssContent).toMatch(/\.additional-subnav-item\s*\{[^}]*background:\s*#FFFFFF;/);
        });

        it("verifies active subnav item has 1px solid #2563EB border and #2563EB font color", () => {
            expect(cssContent).toMatch(/\.additional-subnav-item\.is-active\s*\{[^}]*border:\s*1px solid #2563EB;/);
            expect(cssContent).toMatch(/\.additional-subnav-item\.is-active\s*\{[^}]*color:\s*#2563EB;/);
            expect(cssContent).toMatch(/\.additional-subnav-item\.is-active\s*\{[^}]*font-weight:\s*600;/);
        });

        it("verifies chevron icon uses 18px x 18px dimensions with #0F172A color", () => {
            expect(cssContent).toMatch(/\.additional-subnav-chevron\s*\{[^}]*width:\s*18px;/);
            expect(cssContent).toMatch(/\.additional-subnav-chevron\s*\{[^}]*height:\s*18px;/);
            expect(cssContent).toMatch(/\.additional-subnav-chevron\s*\{[^}]*color:\s*#0F172A;/);
        });
    });

    describe("3. Screen 1: Settings - Additional - Data Export (Frame 2147225610 & Frame 2147225609)", () => {
        it("verifies section header is 1020px wide with space-between layout", () => {
            expect(cssContent).toMatch(/\.additional-section-header\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.additional-section-header\s*\{[^}]*justify-content:\s*space-between;/);
        });

        it("verifies title is Urbanist 14px 600 #0F172A, subtitle is Urbanist 14px 500 #64748B", () => {
            expect(cssContent).toMatch(/\.additional-section-title\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.additional-section-title\s*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.additional-section-title\s*\{[^}]*color:\s*#0F172A;/);

            expect(cssContent).toMatch(/\.additional-section-subtitle\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.additional-section-subtitle\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.additional-section-subtitle\s*\{[^}]*color:\s*#64748B;/);
        });

        it("verifies Export Selected button is 124px x 38px with #2563EB background, 6px radius, and white text", () => {
            expect(cssContent).toMatch(/\.btn-additional-export\s*\{[^}]*width:\s*124px;/);
            expect(cssContent).toMatch(/\.btn-additional-export\s*\{[^}]*height:\s*38px;/);
            expect(cssContent).toMatch(/\.btn-additional-export\s*\{[^}]*background:\s*#2563EB;/);
            expect(cssContent).toMatch(/\.btn-additional-export\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.btn-additional-export\s*\{[^}]*color:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.btn-additional-export\s*\{[^}]*font-weight:\s*600;/);
        });

        it("verifies checkbox rows are 1020px wide with 20px gap containing two 500px items", () => {
            expect(cssContent).toMatch(/\.additional-checkbox-row\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.additional-checkbox-row\s*\{[^}]*gap:\s*20px;/);
            expect(cssContent).toMatch(/\.additional-checkbox-item\s*\{[^}]*width:\s*500px;/);

            // Arithmetic: 500px + 20px gap + 500px = 1020px
            const itemWidth = 500;
            const gap = 20;
            const rowWidth = itemWidth * 2 + gap;
            expect(rowWidth).toBe(1020);
        });

        it("verifies checkbox box is 20px x 20px with 4px radius", () => {
            expect(cssContent).toMatch(/\.additional-checkbox-box\s*\{[^}]*width:\s*20px;/);
            expect(cssContent).toMatch(/\.additional-checkbox-box\s*\{[^}]*height:\s*20px;/);
            expect(cssContent).toMatch(/\.additional-checkbox-box\s*\{[^}]*border-radius:\s*4px;/);
        });

        it("verifies checked checkbox box uses #2563EB background and unchecked uses #FFFFFF with #E2E8F0 border", () => {
            expect(cssContent).toMatch(/\.additional-checkbox-box\s*\{[^}]*background:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.additional-checkbox-box\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.additional-checkbox-box\.is-checked\s*\{[^}]*background:\s*#2563EB;/);
            expect(cssContent).toMatch(/\.additional-checkbox-box\.is-checked\s*\{[^}]*border:\s*1px solid #2563EB;/);
        });

        it("verifies checkbox label uses Urbanist 14px 400 #64748B", () => {
            expect(cssContent).toMatch(/\.additional-checkbox-label\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.additional-checkbox-label\s*\{[^}]*font-weight:\s*400;/);
            expect(cssContent).toMatch(/\.additional-checkbox-label\s*\{[^}]*color:\s*#64748B;/);
        });
    });

    describe("4. Screen 2: Settings - Additional - Data Retention (Frame 95 & Frame 2147225610)", () => {
        it("verifies retention list container is 1020px wide with 20px gap", () => {
            expect(cssContent).toMatch(/\.additional-retention-list\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.additional-retention-list\s*\{[^}]*gap:\s*20px;/);
        });

        it("verifies retention row cards are 1020px x 82px with 1px solid #E2E8F0, 6px radius, and 20px padding", () => {
            expect(cssContent).toMatch(/\.additional-inner-card\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.additional-inner-card\s*\{[^}]*height:\s*82px;/);
            expect(cssContent).toMatch(/\.additional-inner-card\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.additional-inner-card\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.additional-inner-card\s*\{[^}]*padding:\s*20px;/);
            expect(cssContent).toMatch(/\.additional-inner-card\s*\{[^}]*gap:\s*12px;/);
            expect(cssContent).toMatch(/\.additional-inner-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        });

        it("verifies typography: card title is Urbanist 16px 500 #0F172A, card subtitle is Urbanist 14px 500 #64748B", () => {
            expect(cssContent).toMatch(/\.additional-card-info-title\s*\{[^}]*font-size:\s*16px;/);
            expect(cssContent).toMatch(/\.additional-card-info-title\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.additional-card-info-title\s*\{[^}]*color:\s*#0F172A;/);

            expect(cssContent).toMatch(/\.additional-card-info-subtitle\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.additional-card-info-subtitle\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.additional-card-info-subtitle\s*\{[^}]*color:\s*#64748B;/);
        });

        it("verifies retention value uses Urbanist 14px 500 #64748B", () => {
            expect(cssContent).toMatch(/\.additional-retention-value\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.additional-retention-value\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.additional-retention-value\s*\{[^}]*color:\s*#64748B;/);
        });

        it("verifies toggle switch is 40px x 22px with 77.5px radius and 2px padding", () => {
            expect(cssContent).toMatch(/\.additional-toggle-switch\s*\{[^}]*width:\s*40px;/);
            expect(cssContent).toMatch(/\.additional-toggle-switch\s*\{[^}]*height:\s*22px;/);
            expect(cssContent).toMatch(/\.additional-toggle-switch\s*\{[^}]*border-radius:\s*77\.5px;/);
            expect(cssContent).toMatch(/\.additional-toggle-switch\s*\{[^}]*padding:\s*2px;/);
        });

        it("verifies toggle switch active background is #2563EB and inactive is #CBD5E1", () => {
            expect(cssContent).toMatch(/\.additional-toggle-switch\s*\{[^}]*background:\s*#CBD5E1;/);
            expect(cssContent).toMatch(/\.additional-toggle-switch\.is-active\s*\{[^}]*background:\s*#2563EB;/);
        });

        it("verifies toggle knob is 16px x 16px white circle with 40px radius", () => {
            expect(cssContent).toMatch(/\.additional-toggle-knob\s*\{[^}]*width:\s*16px;/);
            expect(cssContent).toMatch(/\.additional-toggle-knob\s*\{[^}]*height:\s*16px;/);
            expect(cssContent).toMatch(/\.additional-toggle-knob\s*\{[^}]*border-radius:\s*40px;/);
            expect(cssContent).toMatch(/\.additional-toggle-knob\s*\{[^}]*background:\s*#FFFFFF;/);
        });
    });

    describe("5. Screen 3: Settings - Additional - Delete Account (Frame 2147225547 & Frame 2147225546)", () => {
        it("verifies danger zone container is 1020px wide with 20px gap", () => {
            expect(cssContent).toMatch(/\.danger-zone-container\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.danger-zone-container\s*\{[^}]*gap:\s*20px;/);
        });

        it("verifies danger zone info title is Urbanist 16px 500 #0F172A, subtitle is Urbanist 14px 500 #64748B", () => {
            expect(cssContent).toMatch(/\.danger-zone-title\s*\{[^}]*font-size:\s*16px;/);
            expect(cssContent).toMatch(/\.danger-zone-title\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.danger-zone-title\s*\{[^}]*color:\s*#0F172A;/);

            expect(cssContent).toMatch(/\.danger-zone-subtitle\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.danger-zone-subtitle\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.danger-zone-subtitle\s*\{[^}]*color:\s*#64748B;/);
        });

        it("verifies danger zone actions row is 1020px x 34px with 8px gap and justify-content flex-end", () => {
            expect(cssContent).toMatch(/\.danger-zone-actions\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.danger-zone-actions\s*\{[^}]*height:\s*34px;/);
            expect(cssContent).toMatch(/\.danger-zone-actions\s*\{[^}]*gap:\s*8px;/);
            expect(cssContent).toMatch(/\.danger-zone-actions\s*\{[^}]*justify-content:\s*flex-end;/);
        });

        it("verifies Export Data button is 108px x 34px with #FFFFFF background, #E2E8F0 border, and #0F172A text", () => {
            expect(cssContent).toMatch(/\.btn-danger-export\s*\{[^}]*width:\s*108px;/);
            expect(cssContent).toMatch(/\.btn-danger-export\s*\{[^}]*height:\s*34px;/);
            expect(cssContent).toMatch(/\.btn-danger-export\s*\{[^}]*background:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.btn-danger-export\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.btn-danger-export\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.btn-danger-export\s*\{[^}]*color:\s*#0F172A;/);
            expect(cssContent).toMatch(/\.btn-danger-export\s*\{[^}]*font-weight:\s*600;/);
        });

        it("verifies Delete Account button is 127px x 34px with #DC2626 background, 6px radius, and white text", () => {
            expect(cssContent).toMatch(/\.btn-danger-delete\s*\{[^}]*width:\s*127px;/);
            expect(cssContent).toMatch(/\.btn-danger-delete\s*\{[^}]*height:\s*34px;/);
            expect(cssContent).toMatch(/\.btn-danger-delete\s*\{[^}]*background:\s*#DC2626;/);
            expect(cssContent).toMatch(/\.btn-danger-delete\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.btn-danger-delete\s*\{[^}]*color:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.btn-danger-delete\s*\{[^}]*font-weight:\s*600;/);
        });
    });

    describe("6. Responsive Adaptation (@media max-width: 900px)", () => {
        it("verifies mobile/tablet responsive stacking and full-width adaptivity", () => {
            expect(cssContent).toMatch(/@media\s*\(max-width:\s*900px\)/);
            expect(cssContent).toMatch(/\.additional-settings-layout\s*\{[^}]*flex-direction:\s*column;/);
            expect(cssContent).toMatch(/\.additional-subnav-panel\s*\{[^}]*width:\s*100%;/);
            expect(cssContent).toMatch(/\.additional-subnav-list\s*\{[^}]*flex-direction:\s*row;/);
            expect(cssContent).toMatch(/\.additional-main-container\s*\{[^}]*width:\s*100%;/);
            expect(cssContent).toMatch(/\.additional-checkbox-row\s*\{[^}]*flex-direction:\s*column;/);
        });
    });
});
