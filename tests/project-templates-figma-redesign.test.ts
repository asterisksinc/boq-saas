import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Project Templates Figma Redesign Specs (Grid View & List View)", () => {
  const css = readFileSync("app/templates-overview.css", "utf8");
  const pageTsx = readFileSync("app/templates/page.tsx", "utf8");

  it("verifies Grid View container and responsive columns match Figma Frame 2147225083", () => {
    expect(css).toContain(".project-templates-grid");
    expect(css).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/gap:\s*24px/);
    expect(css).toMatch(/width:\s*100%/);

    // Responsive breakpoints
    expect(css).toMatch(/@media\s*\(max-width:\s*1280px\)[^{]*\{\s*\.project-templates-grid\s*\{[^}]*repeat\(3/);
    expect(css).toMatch(/@media\s*\(max-width:\s*960px\)[^{]*\{\s*\.project-templates-grid\s*\{[^}]*repeat\(2/);
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^{]*\{\s*\.project-templates-grid\s*\{[^}]*1fr/);
  });

  it("verifies Grid View card structure, image wrap, and tokens match Figma Frame 2147225078", () => {
    // Card surface
    expect(css).toContain(".template-fig-card");
    expect(css).toMatch(/padding:\s*12px/);
    expect(css).toMatch(/gap:\s*16px/);
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.6(5)?\)/);
    expect(css).toMatch(/border-radius:\s*6px/);

    // Image wrapper: Rectangle 78
    expect(css).toContain(".template-fig-card-img-wrap");
    expect(css).toMatch(/height:\s*204px/);
    expect(css).toMatch(/border-radius:\s*2px/);

    // Divider: Rectangle 40
    expect(css).toContain(".template-fig-divider");
    expect(css).toMatch(/background:\s*#EBEBEB/);
  });

  it("verifies Category badges match exact Figma color tokens (Residential, Villa, Commercial, Retail, Hospitality)", () => {
    // Residential: blue
    expect(css).toContain(".template-fig-badge.badge-residential");
    expect(css).toMatch(/background:\s*rgba\(37,\s*99,\s*235,\s*0\.12\)/);
    expect(css).toMatch(/color:\s*#0085FF/);

    // Villa: green
    expect(css).toContain(".template-fig-badge.badge-villa");
    expect(css).toMatch(/background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\)/);
    expect(css).toMatch(/color:\s*#16A34A/);

    // Commercial: purple
    expect(css).toContain(".template-fig-badge.badge-commercial");
    expect(css).toMatch(/background:\s*rgba\(83,\s*58,\s*253,\s*0\.1\)/);
    expect(css).toMatch(/color:\s*#533AFD/);

    // Retail: yellow/amber
    expect(css).toContain(".template-fig-badge.badge-retail");
    expect(css).toMatch(/background:\s*rgba\(250,\s*176,\s*0,\s*0\.1\)/);
    expect(css).toMatch(/color:\s*#FAB000/);

    // Hospitality: green
    expect(css).toContain(".template-fig-badge.badge-hospitality");

    // Subtype pill (e.g. 3BHK, 2BHK, Office)
    expect(css).toContain(".template-subtype-pill");
    expect(css).toMatch(/background:\s*rgba\(71,\s*85,\s*105,\s*0\.1\)/);
    expect(css).toMatch(/color:\s*#475569/);
    expect(css).toMatch(/border-radius:\s*9999px/);

    // Status pills (ACTIVE, DRAFT, Needs Review)
    expect(css).toContain(".template-status-pill.status-active");
    expect(css).toContain(".template-status-pill.status-draft");
    expect(css).toContain(".template-status-pill.status-review");
  });

  it("verifies List/Table View container, header, rows, and cells match Figma Frame 2147225069 and Frame 57", () => {
    // Container: Frame 2147225069
    expect(css).toContain(".project-templates-table-container");
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/backdrop-filter:\s*blur\(20\.4px\)/);
    expect(css).toMatch(/border-radius:\s*6px/);
    expect(css).toMatch(/padding:\s*20px/);

    // Header: Frame 57
    expect(css).toContain(".project-templates-table thead tr");
    expect(css).toMatch(/background:\s*#E4ECFB/);
    expect(css).toMatch(/height:\s*36px/);
    expect(css).toMatch(/border-radius:\s*8px/);

    // Header columns in page.tsx
    const expectedHeaders = [
      "TEMPLATE NAME",
      "TYPE",
      "PROJECT TYPE",
      "ROOMS",
      "SECTIONS",
      "ITEMS",
      "STATUS",
      "VERSION",
      "UPDATED",
    ];
    for (const h of expectedHeaders) {
      expect(pageTsx).toContain(h);
    }

    // Row: Frame 59, 60, etc.
    expect(css).toContain(".project-templates-table-row");
    expect(css).toMatch(/height:\s*56px/);
    expect(css).toMatch(/border-bottom:\s*1px solid #EBEBEB/);

    // 32px thumbnail
    expect(css).toContain(".project-templates-thumb-wrap");
    expect(css).toMatch(/width:\s*32px/);
    expect(css).toMatch(/height:\s*32px/);
    expect(css).toMatch(/border-radius:\s*2px/);

    // 2-line updated date & time
    expect(css).toContain(".template-table-updated-cell");
    expect(css).toContain(".updated-date");
    expect(css).toContain(".updated-time");
  });

  it("verifies Pagination Bar matches Figma Frame 2147225166 tokens", () => {
    expect(css).toContain(".template-pagination-bar");
    expect(css).toContain(".template-pagination-total");
    expect(css).toMatch(/color:\s*#0F172A/);

    // 34px buttons
    expect(css).toContain(".template-pagination-page-btn");
    expect(css).toMatch(/min-width:\s*34px/);
    expect(css).toMatch(/height:\s*34px/);
    expect(css).toMatch(/border:\s*1px solid #EBEBEB/);
    expect(css).toMatch(/border-radius:\s*6px/);

    // Active button: #E4ECFB + border #2563EB + text #2563EB
    expect(css).toMatch(/\.template-pagination-page-btn\.active[^{]*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.template-pagination-page-btn\.active[^{]*\{[^}]*border:\s*1px solid #2563EB/);
    expect(css).toMatch(/\.template-pagination-page-btn\.active[^{]*\{[^}]*color:\s*#2563EB/);

    // Show per page select: 34px height
    expect(css).toContain(".template-pagination-size-select");
    expect(css).toMatch(/height:\s*34px/);
  });

  it("verifies Toolbar controls match Figma Frame 76, Frame 73, and Frame 77", () => {
    // Search projects or clients placeholder
    expect(pageTsx).toContain('placeholder="Search projects or clients…"');

    // Filter button with label (Frame 73: 102px x 46px)
    expect(css).toContain(".template-filter-labeled-btn");
    expect(css).toMatch(/width:\s*102px/);
    expect(css).toMatch(/height:\s*46px/);
    expect(css).toMatch(/background:\s*#FFFFFF/);
    expect(css).toMatch(/border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/border-radius:\s*6px/);
    expect(pageTsx).toContain("<span>Filter</span>");

    // View toggle: Frame 77 (86px x 46px)
    expect(css).toContain(".template-view-toggle-wrap");
    expect(css).toMatch(/height:\s*46px/);
    expect(css).toMatch(/border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/border-radius:\s*6px/);

    // List view button first, Grid view button second
    expect(pageTsx).toContain('aria-label="List view"');
    expect(pageTsx).toContain('aria-label="Grid view"');
  });

  it("verifies dynamic backend data binding in both Grid View and List View", () => {
    // Both views share projectTemplates dataset, query, filters, page
    expect(pageTsx).toContain("renderProjectCategoryBadge");
    expect(pageTsx).toContain("renderProjectSubtypeBadge");
    expect(pageTsx).toContain("getTemplateRooms");
    expect(pageTsx).toContain("getTemplateSections");
    expect(pageTsx).toContain("getTemplateItems");
    expect(pageTsx).toContain("getTemplateVersion");
    expect(pageTsx).toContain("renderStatusPill");
    expect(pageTsx).toContain("renderPaginationBar");

    // Seamless toggle without duplicate fetches
    expect(pageTsx).toContain('view === "grid" ?');
  });
});
