import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard Global Search UI & Figma Specifications", () => {
    const popoverPath = join(process.cwd(), "components", "header", "SearchPopover.tsx");
    const headerPath = join(process.cwd(), "components", "DashboardHeader.tsx");
    const cssPath = join(process.cwd(), "app", "globals.css");
    const svgPath = join(process.cwd(), "public", "assets", "dashboard", "dashboard-search.svg");

    it("verifies search components and assets exist", () => {
        expect(existsSync(popoverPath)).toBe(true);
        expect(existsSync(headerPath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
        expect(existsSync(svgPath)).toBe(true);
    });

    it("verifies Header Search Input matches Figma Frame 76 and Frame 70 specifications", () => {
        const cssContent = readFileSync(cssPath, "utf-8");
        const svgContent = readFileSync(svgPath, "utf-8");
        const headerContent = readFileSync(headerPath, "utf-8");

        // Frame 76 Search Field container
        expect(cssContent).toContain(".fig-dashboard-search {");
        expect(cssContent).toContain("width: 260px;");
        expect(cssContent).toContain("height: 46px;");
        expect(cssContent).toContain("border: 1px solid rgba(255, 255, 255, .32);");
        expect(cssContent).toContain("border-radius: 8px;");
        expect(cssContent).toContain("background: rgba(255, 255, 255, .36);");
        expect(cssContent).toContain("backdrop-filter: blur(20.4px);");
        expect(cssContent).toContain("padding: 5px 12px 5px 5px;");
        expect(cssContent).toContain("gap: 8px;");

        // Frame 70 Search Icon Container
        expect(svgContent).toContain('<rect width="36" height="36" rx="6" fill="white"/>');
        expect(svgContent).toContain('fill="#475569"');
        expect(cssContent).toContain(".fig-dashboard-search img {");
        expect(cssContent).toContain("width: 36px;");
        expect(cssContent).toContain("height: 36px;");

        // Search Input Placeholder Typography
        expect(cssContent).toContain(".fig-dashboard-search input {");
        expect(cssContent).toContain("font-size: 14px;");
        expect(cssContent).toContain("font-weight: 400;");
        expect(cssContent).toContain(".fig-dashboard-search input::placeholder {");
        expect(cssContent).toContain("color: #64748b;");

        // Header JSX contains input and asset
        expect(headerContent).toContain('className="fig-dashboard-search"');
        expect(headerContent).toContain('src="/assets/dashboard/dashboard-search.svg"');
        expect(headerContent).toContain('placeholder="Search..."');
    });

    it("verifies Global Search Popover matches Figma Frame 2147225093 specifications", () => {
        const cssContent = readFileSync(cssPath, "utf-8");
        const popoverContent = readFileSync(popoverPath, "utf-8");

        expect(cssContent).toContain(".fig-dashboard-search-popover {");
        expect(cssContent).toContain("width: 440px;");
        expect(cssContent).toContain("height: 315px;");
        expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
        expect(cssContent).toContain("backdrop-filter: blur(5.5px);");
        expect(cssContent).toContain("border-radius: 16px;");
        expect(cssContent).toContain("padding: 16px;");
        expect(cssContent).toContain("gap: 16px;");
        expect(cssContent).toContain("border: 1px solid rgba(255, 255, 255, 0.5);");

        expect(popoverContent).toContain('className="fig-dashboard-search-popover"');
    });

    it("verifies Global Search Popover Header matches Figma Frame 2147225549", () => {
        const cssContent = readFileSync(cssPath, "utf-8");
        const popoverContent = readFileSync(popoverPath, "utf-8");

        expect(cssContent).toContain(".fig-search-popover-header {");
        expect(cssContent).toContain("height: 22px;");
        expect(cssContent).toContain("justify-content: space-between;");

        // RECENT / RESULTS title
        expect(cssContent).toContain(".fig-search-heading {");
        expect(cssContent).toContain("font-size: 18px;");
        expect(cssContent).toContain("font-weight: 600;");
        expect(cssContent).toContain("color: #0F172A;");
        expect(cssContent).toContain("text-transform: uppercase;");

        // CLEAR action button
        expect(cssContent).toContain(".fig-search-clear-btn {");
        expect(cssContent).toContain("font-size: 12px;");
        expect(cssContent).toContain("font-weight: 600;");
        expect(cssContent).toContain("color: #2563EB;");
        expect(cssContent).toContain("text-transform: uppercase;");

        // JSX structure
        expect(popoverContent).toContain('className="fig-search-popover-header"');
        expect(popoverContent).toContain('className="fig-search-heading"');
        expect(popoverContent).toContain('className="fig-search-clear-btn"');
    });

    it("verifies Results White Card matches Figma Frame 2147225027 specifications", () => {
        const cssContent = readFileSync(cssPath, "utf-8");
        const popoverContent = readFileSync(popoverPath, "utf-8");

        expect(cssContent).toContain(".fig-search-card {");
        expect(cssContent).toContain("height: 245px;");
        expect(cssContent).toContain("background: #FFFFFF;");
        expect(cssContent).toContain("border-radius: 14px;");
        expect(cssContent).toContain("padding: 16px;");
        expect(cssContent).toContain("overflow-y: auto;");

        expect(popoverContent).toContain('className="fig-search-card"');
    });

    it("verifies Search Items match Figma Frame 2147225546, Frame 2147225552, and Line 1", () => {
        const cssContent = readFileSync(cssPath, "utf-8");
        const popoverContent = readFileSync(popoverPath, "utf-8");

        // Dashed separator Line 1
        expect(cssContent).toContain(".fig-search-item {");
        expect(cssContent).toContain("border-bottom: 1px dashed rgba(100, 116, 139, 0.2);");
        expect(cssContent).toContain(".fig-search-item:last-child {");
        expect(cssContent).toContain("border-bottom: none;");

        // Item text typography
        expect(cssContent).toContain(".fig-search-item-text {");
        expect(cssContent).toContain("font-size: 14px;");
        expect(cssContent).toContain("font-weight: 500;");
        expect(cssContent).toContain("color: #0F172A;");

        // Icons Frame 16x16
        expect(cssContent).toContain(".fig-search-item-icon {");
        expect(cssContent).toContain("width: 16px;");
        expect(cssContent).toContain("height: 16px;");
        expect(cssContent).toContain("color: #64748B;");

        expect(cssContent).toContain(".fig-search-item-arrow {");
        expect(cssContent).toContain("width: 16px;");
        expect(cssContent).toContain("height: 16px;");
        expect(cssContent).toContain("color: #64748B;");

        // Active / Hover State
        expect(cssContent).toContain(".fig-search-item.is-selected {");
        expect(cssContent).toContain("background: #EFF6FF;");
        expect(cssContent).toContain("color: #2563EB;");

        // JSX elements
        expect(popoverContent).toContain('className="fig-search-item-left"');
        expect(popoverContent).toContain('className="fig-search-item-right"');
    });

    it("verifies search functionality, real API integration, and keyboard interactions are preserved", () => {
        const popoverContent = readFileSync(popoverPath, "utf-8");
        const headerContent = readFileSync(headerPath, "utf-8");

        // Real API call
        expect(popoverContent).toContain("searchDashboard(trimmed)");
        expect(popoverContent).toContain("saveRecent");
        expect(popoverContent).toContain("handleClearRecents");

        // Keyboard interactions
        expect(popoverContent).toContain('e.key === "ArrowDown"');
        expect(popoverContent).toContain('e.key === "ArrowUp"');
        expect(popoverContent).toContain('e.key === "Enter"');
        expect(headerContent).toContain('e.key === "Escape"');

        // Outside click handling
        expect(headerContent).toContain("handleClickOutside");

        // Route navigation
        expect(popoverContent).toContain("onNavigate(item.url)");
        expect(popoverContent).toContain("onSelectQuery(item)");

        // Status badges for live items
        expect(popoverContent).toContain("fig-search-badge");

        // Loading, empty, and error states
        expect(popoverContent).toContain("No recent searches yet.");
        expect(popoverContent).toContain("No results found for");
        expect(popoverContent).toContain("searchError");
        expect(popoverContent).toContain("fig-search-spinner");
    });
});
