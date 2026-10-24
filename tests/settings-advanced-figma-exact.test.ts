import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Settings → Advanced Figma Exact Design Specification", () => {
    const cssPath = path.join(process.cwd(), "app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    describe("1. Master Layout & Two-Column Split Arithmetic (1326px Total)", () => {
        it("verifies master container has 1326px max-width, flex-row, and 8px gap", () => {
            expect(cssContent).toMatch(/\.advanced-settings-layout\s*\{[^}]*max-width:\s*1326px;/);
            expect(cssContent).toMatch(/\.advanced-settings-layout\s*\{[^}]*gap:\s*8px;/);
            expect(cssContent).toMatch(/\.advanced-settings-layout\s*\{[^}]*display:\s*flex;/);
            expect(cssContent).toMatch(/\.advanced-settings-layout\s*\{[^}]*flex-direction:\s*row;/);
        });

        it("verifies left sub-navigation panel is exactly 258px wide, 169px high with 6px radius and frosted glass", () => {
            expect(cssContent).toMatch(/\.advanced-subnav-panel\s*\{[^}]*width:\s*258px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-panel\s*\{[^}]*height:\s*169px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-panel\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
            expect(cssContent).toMatch(/\.advanced-subnav-panel\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\);/);
        });

        it("verifies right content panel is exactly 1060px wide with 6px radius, 20px padding and 16px gap", () => {
            expect(cssContent).toMatch(/\.advanced-main-content\s*\{[^}]*width:\s*1060px;/);
            expect(cssContent).toMatch(/\.advanced-main-content\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.advanced-main-content\s*\{[^}]*padding:\s*20px;/);
            expect(cssContent).toMatch(/\.advanced-main-content\s*\{[^}]*gap:\s*16px;/);
            expect(cssContent).toMatch(/\.advanced-main-content\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        });

        it("verifies login history panel uses the taller 514px reference layout", () => {
            expect(cssContent).toMatch(/\.advanced-main-content\.is-login-history\s*\{[^}]*min-height:\s*514px;/);
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
    });

    describe("2. Sub-Navigation Design (Frame 2147225543 & Frame 2147225533)", () => {
        it("verifies subnav header has uppercase SELECT MENU styling with Urbanist 14px 500 #64748B", () => {
            expect(cssContent).toMatch(/\.advanced-subnav-header\s*\{[^}]*text-transform:\s*uppercase;/);
            expect(cssContent).toMatch(/\.advanced-subnav-header\s*\{[^}]*color:\s*#64748B;/);
            expect(cssContent).toMatch(/\.advanced-subnav-header\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-header\s*\{[^}]*font-weight:\s*500;/);
        });

        it("verifies sub-navigation items are 238px x 36px with 4px radius and #FFFFFF background", () => {
            expect(cssContent).toMatch(/\.advanced-subnav-item\s*\{[^}]*width:\s*238px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-item\s*\{[^}]*height:\s*36px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-item\s*\{[^}]*border-radius:\s*4px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-item\s*\{[^}]*background:\s*#FFFFFF;/);
        });

        it("verifies active subnav item has 1px solid #2563EB border and #2563EB font color", () => {
            expect(cssContent).toMatch(/\.advanced-subnav-item\.is-active\s*\{[^}]*border:\s*1px solid #2563EB;/);
            expect(cssContent).toMatch(/\.advanced-subnav-item\.is-active\s*\{[^}]*color:\s*#2563EB;/);
            expect(cssContent).toMatch(/\.advanced-subnav-item\.is-active\s*\{[^}]*font-weight:\s*600;/);
        });

        it("verifies chevron icon uses 18px x 18px dimensions with #0F172A color", () => {
            expect(cssContent).toMatch(/\.advanced-subnav-chevron\s*\{[^}]*width:\s*18px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-chevron\s*\{[^}]*height:\s*18px;/);
            expect(cssContent).toMatch(/\.advanced-subnav-chevron\s*\{[^}]*color:\s*#0F172A;/);
        });
    });

    describe("3. Screen 1: Settings - Advanced - Password & 2FA (Frame 95 & Frame 96)", () => {
        it("verifies setting row cards are 1020px x 82px with 1px solid #E2E8F0, 6px radius, and 20px padding", () => {
            expect(cssContent).toMatch(/\.advanced-card\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.advanced-card\s*\{[^}]*height:\s*82px;/);
            expect(cssContent).toMatch(/\.advanced-card\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.advanced-card\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.advanced-card\s*\{[^}]*padding:\s*20px;/);
            expect(cssContent).toMatch(/\.advanced-card\s*\{[^}]*gap:\s*12px;/);
            expect(cssContent).toMatch(/\.advanced-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        });

        it("verifies typography: title is Urbanist 16px 500 #0F172A, subtitle is Urbanist 14px 500 #64748B", () => {
            expect(cssContent).toMatch(/\.advanced-card-title\s*\{[^}]*font-size:\s*16px;/);
            expect(cssContent).toMatch(/\.advanced-card-title\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.advanced-card-title\s*\{[^}]*color:\s*#0F172A;/);

            expect(cssContent).toMatch(/\.advanced-card-subtitle\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.advanced-card-subtitle\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.advanced-card-subtitle\s*\{[^}]*color:\s*#64748B;/);
        });

        it("verifies Change button is 82px x 34px with #FFFFFF background and #E2E8F0 border", () => {
            expect(cssContent).toMatch(/\.btn-advanced-action\s*\{[^}]*width:\s*82px;/);
            expect(cssContent).toMatch(/\.btn-advanced-action\s*\{[^}]*height:\s*34px;/);
            expect(cssContent).toMatch(/\.btn-advanced-action\s*\{[^}]*background:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.btn-advanced-action\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.btn-advanced-action\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.btn-advanced-action\s*\{[^}]*color:\s*#0F172A;/);
        });

        it("verifies Manage button is 85px wide", () => {
            expect(cssContent).toMatch(/\.btn-advanced-action\.btn-manage-2fa\s*\{[^}]*width:\s*85px;/);
        });
    });

    describe("4. Screen 2: Settings - Advanced - Login History (Frame 2147225566 & Ellipse 44)", () => {
        it("verifies status dot is 10px x 10px circular indicator", () => {
            expect(cssContent).toMatch(/\.login-status-dot\s*\{[^}]*width:\s*10px;/);
            expect(cssContent).toMatch(/\.login-status-dot\s*\{[^}]*height:\s*10px;/);
            expect(cssContent).toMatch(/\.login-status-dot\s*\{[^}]*border-radius:\s*50%;/);
        });

        it("verifies success status dot uses #16A34A green and warning uses #D97706", () => {
            expect(cssContent).toMatch(/\.login-status-dot\.is-success\s*\{[^}]*background:\s*#16A34A;/);
            expect(cssContent).toMatch(/\.login-status-dot\.is-warning\s*\{[^}]*background:\s*#D97706;/);
        });

        it("verifies timestamp uses Urbanist 14px 500 #64748B", () => {
            expect(cssContent).toMatch(/\.advanced-timestamp\s*\{[^}]*font-size:\s*14px;/);
            expect(cssContent).toMatch(/\.advanced-timestamp\s*\{[^}]*font-weight:\s*500;/);
            expect(cssContent).toMatch(/\.advanced-timestamp\s*\{[^}]*color:\s*#64748B;/);
        });
    });

    describe("5. Screen 3: Settings - Advanced - Active Sessions (Frame 2147225015 CURRENT badge & Revoke)", () => {
        it("verifies CURRENT badge is 65px x 18px with 9999px radius and rgba(22, 163, 74, 0.12) background", () => {
            expect(cssContent).toMatch(/\.advanced-badge-current\s*\{[^}]*width:\s*65px;/);
            expect(cssContent).toMatch(/\.advanced-badge-current\s*\{[^}]*height:\s*18px;/);
            expect(cssContent).toMatch(/\.advanced-badge-current\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\);/);
            expect(cssContent).toMatch(/\.advanced-badge-current\s*\{[^}]*border-radius:\s*9999px;/);
            expect(cssContent).toMatch(/\.advanced-badge-current\s*\{[^}]*color:\s*#16A34A;/);
            expect(cssContent).toMatch(/\.advanced-badge-current\s*\{[^}]*font-size:\s*12px;/);
            expect(cssContent).toMatch(/\.advanced-badge-current\s*\{[^}]*font-weight:\s*500;/);
        });

        it("verifies Revoke button is 77px x 34px with #FFFFFF background, #E2E8F0 border and #DC2626 text", () => {
            expect(cssContent).toMatch(/\.btn-advanced-revoke\s*\{[^}]*width:\s*77px;/);
            expect(cssContent).toMatch(/\.btn-advanced-revoke\s*\{[^}]*height:\s*34px;/);
            expect(cssContent).toMatch(/\.btn-advanced-revoke\s*\{[^}]*background:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.btn-advanced-revoke\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.btn-advanced-revoke\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.btn-advanced-revoke\s*\{[^}]*color:\s*#DC2626;/);
            expect(cssContent).toMatch(/\.btn-advanced-revoke\s*\{[^}]*font-weight:\s*600;/);
            expect(cssContent).toMatch(/\.btn-advanced-revoke\s*\{[^}]*font-size:\s*14px;/);
        });
    });

    describe("6. Responsive Adaptation (@media max-width: 900px)", () => {
        it("verifies mobile/tablet responsive stacking and full-width adaptivity", () => {
            expect(cssContent).toMatch(/@media\s*\(max-width:\s*900px\)/);
            expect(cssContent).toMatch(/\.advanced-settings-layout\s*\{[^}]*flex-direction:\s*column;/);
            expect(cssContent).toMatch(/\.advanced-subnav-panel\s*\{[^}]*width:\s*100%;/);
            expect(cssContent).toMatch(/\.advanced-subnav-list\s*\{[^}]*flex-direction:\s*row;/);
            expect(cssContent).toMatch(/\.advanced-main-content\s*\{[^}]*width:\s*100%;/);
        });
    });
});
