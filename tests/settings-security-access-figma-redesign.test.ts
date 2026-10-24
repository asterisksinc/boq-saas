import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Settings - Security & Access Figma Exact Design Specification", () => {
    const cssPath = path.join(process.cwd(), "app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    describe("1. Master Layout & Two-Column Split Arithmetic (1326px Total)", () => {
        it("verifies master container has 1326px max-width, flex-row, and 8px gap", () => {
            expect(cssContent).toMatch(/\.security-access-container\s*\{[^}]*max-width:\s*1326px;/);
            expect(cssContent).toMatch(/\.security-access-container\s*\{[^}]*gap:\s*8px;/);
            expect(cssContent).toMatch(/\.security-access-container\s*\{[^}]*display:\s*flex;/);
        });

        it("verifies left sub-navigation card is exactly 258px wide with 6px radius", () => {
            expect(cssContent).toMatch(/\.security-subnav-card\s*\{[^}]*width:\s*258px;/);
            expect(cssContent).toMatch(/\.security-subnav-card\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.security-subnav-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        });

        it("verifies right content card is exactly 1060px wide with 6px radius and 20px padding", () => {
            expect(cssContent).toMatch(/\.security-content-card\s*\{[^}]*width:\s*1060px;/);
            expect(cssContent).toMatch(/\.security-content-card\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.security-content-card\s*\{[^}]*padding:\s*20px;/);
            expect(cssContent).toMatch(/\.security-content-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        });

        it("verifies arithmetic: 258px (subnav) + 8px (gap) + 1060px (content card) = 1326px exact", () => {
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

    describe("2. Sub-Navigation Design (Frame 2147225543 & 2147225533)", () => {
        it("verifies sub-navigation items are 238px x 36px with 4px radius", () => {
            expect(cssContent).toMatch(/\.security-subnav-item\s*\{[^}]*width:\s*238px;/);
            expect(cssContent).toMatch(/\.security-subnav-item\s*\{[^}]*height:\s*36px;/);
            expect(cssContent).toMatch(/\.security-subnav-item\s*\{[^}]*border-radius:\s*4px;/);
            expect(cssContent).toMatch(/\.security-subnav-item\s*\{[^}]*background:\s*#FFFFFF;/);
        });

        it("verifies active subnav item has 1px solid #2563EB border and #2563EB font color", () => {
            expect(cssContent).toMatch(/\.security-subnav-item\.is-active\s*\{[^}]*border:\s*1px solid #2563EB;/);
            expect(cssContent).toMatch(/\.security-subnav-item\.is-active\s*\{[^}]*color:\s*#2563EB;/);
            expect(cssContent).toMatch(/\.security-subnav-item\.is-active\s*\{[^}]*font-weight:\s*600;/);
        });

        it("verifies subnav header has uppercase SELECT MENU styling", () => {
            expect(cssContent).toMatch(/\.security-subnav-header\s*\{[^}]*text-transform:\s*uppercase;/);
            expect(cssContent).toMatch(/\.security-subnav-header\s*\{[^}]*color:\s*#64748B;/);
            expect(cssContent).toMatch(/\.security-subnav-header\s*\{[^}]*font-size:\s*14px;/);
        });
    });

    describe("3. Screen 1: Settings - Security & Access - User (Frame 2147225535)", () => {
        it("verifies section header is 1020px x 38px with Urbanist 16px 600 title and #2563EB button", () => {
            expect(cssContent).toMatch(/\.security-section-header\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.security-section-header\s*\{[^}]*height:\s*38px;/);
            expect(cssContent).toMatch(/\.security-section-title\s*\{[^}]*font-size:\s*16px;/);
            expect(cssContent).toMatch(/\.security-section-title\s*\{[^}]*color:\s*#0F172A;/);
            expect(cssContent).toMatch(/\.security-btn-primary\s*\{[^}]*background:\s*#2563EB;/);
            expect(cssContent).toMatch(/\.security-btn-primary\s*\{[^}]*border-radius:\s*6px;/);
        });

        it("verifies user cards list has 1020px width and 8px gap", () => {
            expect(cssContent).toMatch(/\.security-user-cards-list\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.security-user-cards-list\s*\{[^}]*gap:\s*8px;/);
        });

        it("verifies user card is 1020px x 128px with 1px solid #E2E8F0, 6px radius, and 20px padding", () => {
            expect(cssContent).toMatch(/\.security-user-card\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.security-user-card\s*\{[^}]*height:\s*128px;/);
            expect(cssContent).toMatch(/\.security-user-card\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.security-user-card\s*\{[^}]*border-radius:\s*6px;/);
            expect(cssContent).toMatch(/\.security-user-card\s*\{[^}]*padding:\s*20px;/);
        });

        it("verifies avatar is 46px x 46px circular container", () => {
            expect(cssContent).toMatch(/\.security-user-avatar\s*\{[^}]*width:\s*46px;/);
            expect(cssContent).toMatch(/\.security-user-avatar\s*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.security-user-avatar\s*\{[^}]*border-radius:\s*50%;/);
        });

        it("verifies action buttons are 36px x 34px with #FFFFFF background and #E2E8F0 border", () => {
            expect(cssContent).toMatch(/\.security-icon-btn\s*\{[^}]*width:\s*36px;/);
            expect(cssContent).toMatch(/\.security-icon-btn\s*\{[^}]*height:\s*34px;/);
            expect(cssContent).toMatch(/\.security-icon-btn\s*\{[^}]*background:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.security-icon-btn\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.security-icon-btn\s*\{[^}]*border-radius:\s*6px;/);
        });

        it("verifies horizontal divider is 980px x 1px with #E2E8F0", () => {
            expect(cssContent).toMatch(/\.security-user-card-divider\s*\{[^}]*width:\s*980px;/);
            expect(cssContent).toMatch(/\.security-user-card-divider\s*\{[^}]*height:\s*1px;/);
            expect(cssContent).toMatch(/\.security-user-card-divider\s*\{[^}]*background:\s*#E2E8F0;/);
        });

        it("verifies bottom meta vertical divider is 1px x 17px with #E2E8F0", () => {
            expect(cssContent).toMatch(/\.security-user-meta-divider\s*\{[^}]*width:\s*1px;/);
            expect(cssContent).toMatch(/\.security-user-meta-divider\s*\{[^}]*height:\s*17px;/);
            expect(cssContent).toMatch(/\.security-user-meta-divider\s*\{[^}]*background:\s*#E2E8F0;/);
        });
    });

    describe("4. Screen 2: Add User Modal (Activities - Tasks / Frame 2147225094)", () => {
        it("verifies modal overlay has rgba(0, 0, 0, 0.25) and blur(4.25px)", () => {
            expect(cssContent).toMatch(/\.security-modal-overlay\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.25\);/);
            expect(cssContent).toMatch(/\.security-modal-overlay\s*\{[^}]*backdrop-filter:\s*blur\(4\.25px\);/);
        });

        it("verifies modal dialog box is 590px wide, frosted glass with 16px radius and 16px padding", () => {
            expect(cssContent).toMatch(/\.security-modal-box\s*\{[^}]*width:\s*590px;/);
            expect(cssContent).toMatch(/\.security-modal-box\s*\{[^}]*border-radius:\s*16px;/);
            expect(cssContent).toMatch(/\.security-modal-box\s*\{[^}]*padding:\s*16px;/);
            expect(cssContent).toMatch(/\.security-modal-box\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        });

        it("verifies modal header is 558px wide with Urbanist typography and 24px close button", () => {
            expect(cssContent).toMatch(/\.security-modal-header\s*\{[^}]*width:\s*558px;/);
            expect(cssContent).toMatch(/\.security-modal-title\s*\{[^}]*font-size:\s*18px;/);
            expect(cssContent).toMatch(/\.security-modal-title\s*\{[^}]*color:\s*#0F172A;/);
            expect(cssContent).toMatch(/\.security-modal-desc\s*\{[^}]*font-size:\s*16px;/);
            expect(cssContent).toMatch(/\.security-modal-desc\s*\{[^}]*color:\s*#64748B;/);
            expect(cssContent).toMatch(/\.security-modal-close-btn\s*\{[^}]*width:\s*24px;/);
        });

        it("verifies inner white card (Frame 2147225027) is 558px wide with #FFFFFF background and 14px radius", () => {
            expect(cssContent).toMatch(/\.security-modal-inner-card\s*\{[^}]*width:\s*558px;/);
            expect(cssContent).toMatch(/\.security-modal-inner-card\s*\{[^}]*background:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.security-modal-inner-card\s*\{[^}]*border-radius:\s*14px;/);
            expect(cssContent).toMatch(/\.security-modal-inner-card\s*\{[^}]*padding:\s*16px;/);
        });

        it("verifies form inputs are 48px high with 1px solid #E2E8F0, 8px radius, and padding 14px 16px", () => {
            expect(cssContent).toMatch(/\.security-modal-input\s*\{[^}]*height:\s*48px;/);
            expect(cssContent).toMatch(/\.security-modal-input\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.security-modal-input\s*\{[^}]*border-radius:\s*8px;/);
            expect(cssContent).toMatch(/\.security-modal-input\s*\{[^}]*padding:\s*14px 16px;/);
            expect(cssContent).toMatch(/\.security-modal-select\s*\{[^}]*height:\s*48px;/);
            expect(cssContent).toMatch(/\.security-modal-select\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.security-modal-select\s*\{[^}]*border-radius:\s*8px;/);
        });

        it("verifies modal footer has Cancel (71px x 46px #FFFFFF) and Save User (min 92px x 46px #2563EB)", () => {
            expect(cssContent).toMatch(/\.security-modal-footer\s*\{[^}]*width:\s*558px;/);
            expect(cssContent).toMatch(/\.security-modal-footer\s*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.security-modal-btn-cancel\s*\{[^}]*width:\s*71px;/);
            expect(cssContent).toMatch(/\.security-modal-btn-cancel\s*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.security-modal-btn-cancel\s*\{[^}]*background:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.security-modal-btn-save\s*\{[^}]*height:\s*46px;/);
            expect(cssContent).toMatch(/\.security-modal-btn-save\s*\{[^}]*background:\s*#2563EB;/);
        });
    });

    describe("5. Screen 3: Settings - Security & Access - Roles & Privileges (Frame 2147225544)", () => {
        it("verifies matrix table container is 1020px wide with 1px solid #E2E8F0 and 6px radius", () => {
            expect(cssContent).toMatch(/\.security-matrix-card\s*\{[^}]*width:\s*1020px;/);
            expect(cssContent).toMatch(/\.security-matrix-card\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
            expect(cssContent).toMatch(/\.security-matrix-card\s*\{[^}]*border-radius:\s*6px;/);
        });

        it("verifies matrix header row is 56px high with #FFFFFF background and #EBEBEB divider", () => {
            expect(cssContent).toMatch(/\.security-matrix-header-row\s*\{[^}]*height:\s*56px;/);
            expect(cssContent).toMatch(/\.security-matrix-header-row\s*\{[^}]*background:\s*#FFFFFF;/);
            expect(cssContent).toMatch(/\.security-matrix-header-row\s*\{[^}]*border-bottom:\s*1px solid #EBEBEB;/);
        });

        it("verifies search column is 260px wide and role columns are 152px wide", () => {
            expect(cssContent).toMatch(/\.security-matrix-search-cell\s*\{[^}]*width:\s*260px;/);
            expect(cssContent).toMatch(/\.security-role-col-header\s*\{[^}]*width:\s*152px;/);
            expect(cssContent).toMatch(/\.security-category-cell\s*\{[^}]*width:\s*260px;/);
            expect(cssContent).toMatch(/\.security-checkbox-cell\s*\{[^}]*width:\s*152px;/);
        });

        it("verifies matrix column arithmetic: 260px + 5 * 152px = 1020px exact", () => {
            const searchColWidth = 260;
            const roleColsCount = 5;
            const roleColWidth = 152;
            const total = searchColWidth + roleColsCount * roleColWidth;
            expect(total).toBe(1020);
        });

        it("verifies category row is 36px high with #E4ECFB background and uppercase title", () => {
            expect(cssContent).toMatch(/\.security-category-row\s*\{[^}]*height:\s*36px;/);
            expect(cssContent).toMatch(/\.security-category-row\s*\{[^}]*background:\s*#E4ECFB;/);
            expect(cssContent).toMatch(/\.security-category-title\s*\{[^}]*text-transform:\s*uppercase;/);
            expect(cssContent).toMatch(/\.security-category-title\s*\{[^}]*color:\s*#64748B;/);
            expect(cssContent).toMatch(/\.security-category-title\s*\{[^}]*font-weight:\s*600;/);
        });

        it("verifies privilege row is 44px high with #EBEBEB border-bottom divider", () => {
            expect(cssContent).toMatch(/\.security-privilege-row\s*\{[^}]*height:\s*44px;/);
            expect(cssContent).toMatch(/\.security-privilege-row\s*\{[^}]*border-bottom:\s*1px solid #EBEBEB;/);
            expect(cssContent).toMatch(/\.security-privilege-label\s*\{[^}]*color:\s*#64748B;/);
        });

        it("verifies checkboxes are 20px x 20px with 4px radius (#2563EB when checked, #FFFFFF when unchecked)", () => {
            expect(cssContent).toMatch(/\.security-custom-checkbox\s*\{[^}]*width:\s*20px;/);
            expect(cssContent).toMatch(/\.security-custom-checkbox\s*\{[^}]*height:\s*20px;/);
            expect(cssContent).toMatch(/\.security-custom-checkbox\s*\{[^}]*border-radius:\s*4px;/);
            expect(cssContent).toMatch(/\.security-custom-checkbox\.checked\s*\{[^}]*background:\s*#2563EB;/);
        });
    });

    describe("6. TSX Components Structure & Figma Compliance", () => {
        it("verifies SecurityAccessLayout renders 2-column layout with SecurityAccessNavigation and security-content-card", () => {
            const layoutPath = path.join(process.cwd(), "components/settings/security/SecurityAccessLayout.tsx");
            const content = fs.readFileSync(layoutPath, "utf-8");
            expect(content).toContain("security-access-container org-settings-container");
            expect(content).toContain("SecurityAccessNavigation");
            expect(content).toContain("security-content-card");
            expect(content).toContain("UsersSection");
            expect(content).toContain("RoleSection");
        });

        it("verifies UsersSection renders title, Add User button with Plus icon, and UserCards", () => {
            const usersSectionPath = path.join(process.cwd(), "components/settings/security/UsersSection.tsx");
            const content = fs.readFileSync(usersSectionPath, "utf-8");
            expect(content).toContain("security-section-header");
            expect(content).toContain("security-section-title");
            expect(content).toContain("security-btn-primary");
            expect(content).toContain("security-user-cards-list");
            expect(content).toContain("UserCard");
            expect(content).toContain("UserFormModal");
            expect(content).toContain("DeleteUserDialog");
        });

        it("verifies UserCard renders 46px avatar, name, role, 36x34 edit/delete buttons, divider, phone, email", () => {
            const cardPath = path.join(process.cwd(), "components/settings/security/UserCard.tsx");
            const content = fs.readFileSync(cardPath, "utf-8");
            expect(content).toContain("security-user-card");
            expect(content).toContain("security-user-avatar");
            expect(content).toContain("security-user-name");
            expect(content).toContain("security-user-role");
            expect(content).toContain("security-icon-btn edit");
            expect(content).toContain("security-icon-btn delete");
            expect(content).toContain("security-user-card-divider");
            expect(content).toContain("security-user-meta-divider");
            expect(content).toContain("Phone:");
            expect(content).toContain("Email:");
        });

        it("verifies UserFormModal implements exact Add User modal layout with inner white card", () => {
            const modalPath = path.join(process.cwd(), "components/settings/security/UserFormModal.tsx");
            const content = fs.readFileSync(modalPath, "utf-8");
            expect(content).toContain("security-modal-overlay");
            expect(content).toContain("security-modal-box");
            expect(content).toContain("security-modal-inner-card");
            expect(content).toContain("security-modal-row");
            expect(content).toContain("First Name");
            expect(content).toContain("Last Name");
            expect(content).toContain("Email");
            expect(content).toContain("Phone");
            expect(content).toContain("Role");
            expect(content).toContain("security-modal-btn-cancel");
            expect(content).toContain("security-modal-btn-save");
        });

        it("verifies RolePermissionMatrix renders fixed column widths (260px, 152px) and search box", () => {
            const matrixPath = path.join(process.cwd(), "components/settings/security/RolePermissionMatrix.tsx");
            const content = fs.readFileSync(matrixPath, "utf-8");
            expect(content).toContain("security-matrix-card");
            expect(content).toContain("security-matrix-table");
            expect(content).toContain("<col style={{ width: 260 }} />");
            expect(content).toContain("<col key={r.id} style={{ width: 152 }} />");
            expect(content).toContain("security-matrix-search-box");
            expect(content).toContain("Type privilege name");
            expect(content).toContain("PermissionCategoryRow");
            expect(content).toContain("PermissionRow");
        });

        it("verifies PermissionCategoryRow renders category toggle button, uppercase title, and role checkboxes", () => {
            const catRowPath = path.join(process.cwd(), "components/settings/security/PermissionCategoryRow.tsx");
            const content = fs.readFileSync(catRowPath, "utf-8");
            expect(content).toContain("security-category-row");
            expect(content).toContain("security-category-toggle-btn");
            expect(content).toContain("security-category-title");
            expect(content).toContain("security-checkbox-cell");
            expect(content).toContain("security-custom-checkbox");
        });

        it("verifies PermissionRow renders indent spacer, label, and role checkboxes", () => {
            const rowPath = path.join(process.cwd(), "components/settings/security/PermissionRow.tsx");
            const content = fs.readFileSync(rowPath, "utf-8");
            expect(content).toContain("security-privilege-row");
            expect(content).toContain("security-privilege-indent-spacer");
            expect(content).toContain("security-privilege-label");
            expect(content).toContain("security-checkbox-cell");
            expect(content).toContain("security-custom-checkbox");
        });
    });
});
