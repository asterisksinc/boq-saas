import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Templates Overview Figma Redesign Specs", () => {
  const css = readFileSync("app/templates-overview.css", "utf8");
  const pageTsx = readFileSync("app/templates/page.tsx", "utf8");

  it("verifies fluid content layout without hardcoded fixed canvas width on shell", () => {
    expect(css).toContain(".templates-content-shell");
    expect(css).toMatch(/width:\s*100%/);
    expect(css).toMatch(/min-width:\s*0/);
    expect(css).not.toMatch(/\.templates-content-shell\s*\{[^}]*width:\s*1326px/);
    expect(css).not.toMatch(/\.templates-content-shell\s*\{[^}]*position:\s*absolute/);
  });

  it("verifies template library header and section toolbar match Figma specifications", () => {
    expect(css).toContain(".template-library-header-row");
    expect(css).toContain(".template-library-title");
    expect(css).toContain(".template-library-subtitle");
    // Search box: Frame 76
    expect(css).toContain(".template-search-box");
    expect(css).toMatch(/width:\s*296px/);
    expect(css).toMatch(/height:\s*46px/);
    expect(css).toMatch(/backdrop-filter:\s*blur\(20\.4px\)/);
    expect(css).toMatch(/border-radius:\s*8px/);
    // New Template button
    expect(css).toContain(".template-new-btn");
    expect(css).toMatch(/background:\s*#2563EB/);
    expect(css).toMatch(/height:\s*46px/);
    // Import Excel button
    expect(css).toContain(".template-import-btn");
    expect(css).toMatch(/background:\s*#FFFFFF/);
    expect(css).toMatch(/border:\s*1px solid #E2E8F0/);
  });

  it("verifies horizontal category navigation tabs match Figma specifications", () => {
    expect(css).toContain(".template-category-tabs-bar");
    expect(css).toContain(".template-category-tab");
    expect(css).toMatch(/\.template-category-tab\.active\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.template-category-tab\.active\s*\{[^}]*color:\s*#2563EB/);
    // Check all 5 tabs exist in page.tsx
    for (const tabName of ["Overview", "Project Templates", "BOQ Templates", "Document Templates", "Archived"]) {
      expect(pageTsx).toContain(tabName);
    }
  });

  it("verifies Recently Used Templates container and card grid match Figma Frame 2147225128", () => {
    expect(css).toContain(".templates-recent-section");
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/padding:\s*20px/);
    expect(css).toMatch(/border-radius:\s*6px/);

    expect(css).toContain(".templates-recent-grid");
    expect(css).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/gap:\s*24px/);

    expect(css).toContain(".template-fig-card");
    expect(css).toContain(".template-fig-card-img-wrap");
    expect(css).toMatch(/height:\s*204px/);
    expect(css).toMatch(/border-radius:\s*2px/);

    expect(css).toContain(".template-fig-badge.badge-project");
    expect(css).toMatch(/background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\)/);
    expect(css).toMatch(/color:\s*#16A34A/);

    expect(css).toContain(".template-fig-badge.badge-boq");
    expect(css).toMatch(/background:\s*rgba\(83,\s*58,\s*253,\s*0\.1\)/);
    expect(css).toMatch(/color:\s*#533AFD/);

    expect(css).toContain(".template-fig-divider");
    expect(css).toMatch(/background:\s*#EBEBEB/);
  });

  it("verifies Templates by Type section and summary cards match Figma Frame 2147225071", () => {
    expect(css).toContain(".templates-by-type-section");
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);

    expect(css).toContain(".templates-summary-grid");
    expect(css).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/gap:\s*20px/);

    expect(css).toContain(".template-summary-card");
    expect(css).toMatch(/box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);
    expect(css).toMatch(/border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/min-height:\s*132px/);
    expect(css).toMatch(/padding:\s*16px/);

    expect(css).toContain(".template-summary-count");
    expect(css).toMatch(/font-size:\s*32px/);
    expect(css).toMatch(/color:\s*#0F172A/);
  });

  it("verifies page.tsx sets default tab to overview and exposes dynamic data bindings", () => {
    expect(pageTsx).toContain('initialTab = (tabParam && ["overview", "projects", "boqs", "documents", "archived"].includes(tabParam))');
    expect(pageTsx).toContain(': "overview";');
    expect(pageTsx).toContain("displayRecentlyUsed");
    expect(pageTsx).toContain("overview?.projectTemplatesCount");
    expect(pageTsx).toContain("overview?.boqTemplatesCount");
    expect(pageTsx).toContain("overview?.documentTemplatesCount");
    expect(pageTsx).toContain("overview?.recentlyUpdatedCount");
    expect(pageTsx).toContain("overview?.mostUsedProject");
    expect(pageTsx).toContain("overview?.mostUsedBoq");
    expect(pageTsx).toContain("overview?.mostUsedDoc");
    expect(pageTsx).toContain("overview?.lastUpdatedName");
  });
});
