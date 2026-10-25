import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Templates - Project Templates - BOQ Template - Grid View Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const boqGridPath = path.resolve(
    __dirname,
    "../components/templates/boq/BoqTemplateGrid.tsx"
  );
  const pagePath = path.resolve(__dirname, "../app/templates/page.tsx");
  const redirectRoute1Path = path.resolve(
    __dirname,
    "../app/templates/boq/page.tsx"
  );
  const redirectRoute2Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/boq/page.tsx"
  );
  const apiRoutePath = path.resolve(
    __dirname,
    "../app/api/v1/[...path]/route.ts"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const boqGridCode = fs.readFileSync(boqGridPath, "utf8");
  const pageCode = fs.readFileSync(pagePath, "utf8");
  const redirectRoute1Code = fs.readFileSync(redirectRoute1Path, "utf8");
  const redirectRoute2Code = fs.readFileSync(redirectRoute2Path, "utf8");
  const apiRouteCode = fs.readFileSync(apiRoutePath, "utf8");

  it("1. Verifies Template Library Heading & Primary Actions (Figma Frame 2147225065 & 110)", () => {
    // Heading & subtitle typography
    expect(css).toMatch(/\.template-library-title\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.template-library-title\s*\{[^}]*font-size:\s*18px/);
    expect(css).toMatch(/\.template-library-title\s*\{[^}]*color:\s*#0F172A/);

    expect(css).toMatch(/\.template-library-subtitle\s*\{[^}]*font-size:\s*15px/);
    expect(css).toMatch(/\.template-library-subtitle\s*\{[^}]*color:\s*#64748B/);

    // Primary action: New BOQ Template (blue action button)
    expect(pageCode).toContain("tab === \"boqs\" ? \"New BOQ Template\" : \"New Template\"");
    expect(pageCode).toContain("Import Excel");
  });

  it("2. Verifies Segmented Navigation Tabs Bar (Figma Frame 2147225076)", () => {
    // Tab bar container styling
    expect(css).toMatch(/\.template-category-tabs-bar\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.template-category-tabs-bar\s*\{[^}]*border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/\.template-category-tabs-bar\s*\{[^}]*border-radius:\s*6px/);

    // Active tab styling (light blue background & blue text)
    expect(css).toMatch(/\.template-category-tab\.active\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.template-category-tab\.active\s*\{[^}]*color:\s*#2563EB/);

    // Navigation Tabs in JSX
    expect(pageCode).toContain("Overview");
    expect(pageCode).toContain("Project Templates");
    expect(pageCode).toContain("BOQ Templates");
    expect(pageCode).toContain("Archived");
  });

  it("3. Verifies BOQ Templates Search, Filter & View Controls (Figma Frame 2147225169)", () => {
    // Search Box styling
    expect(css).toMatch(/\.template-search-box\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
    expect(css).toMatch(/\.template-search-icon-badge\s*\{[^}]*width:\s*36px/);
    expect(css).toMatch(/\.template-search-icon-badge\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.template-search-icon-badge\s*\{[^}]*background:\s*#FFFFFF/);

    // Search input placeholder
    expect(pageCode).toContain("placeholder=\"Search BOQ template by name…\"");
    expect(pageCode).toContain("aria-label=\"Search BOQ template by name\"");

    // Labeled filter button with icon & text
    expect(pageCode).toContain("template-filter-labeled-btn");
    expect(pageCode).toContain("<span>Filter</span>");

    // View toggle: grid vs list
    expect(css).toMatch(/\.template-view-toggle-wrap\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.template-view-toggle-btn\.active\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.template-view-toggle-btn\.active\s*\{[^}]*color:\s*#2563EB/);
  });

  it("4. Verifies Responsive Grid Layout (Figma Frame 2147225083)", () => {
    // Fluid CSS Grid filling full width without fixed 1326px constraint
    expect(css).toMatch(/\.boq-templates-grid[^{]*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.boq-templates-grid[^{]*\{[^}]*gap:\s*24px/);
    expect(css).toMatch(/\.boq-templates-grid[^{]*\{[^}]*width:\s*100%/);

    // Responsive breakpoints
    expect(css).toMatch(/@media\s*\(max-width:\s*1380px\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*980px\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*640px\)/);
  });

  it("5. Verifies BOQ Template Card Design & Elements (Figma Frame 2147225078)", () => {
    // Card outer container
    expect(css).toMatch(/\.boq-template-card[^{]*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.boq-template-card[^{]*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.boq-template-card[^{]*\{[^}]*padding:\s*12px/);
    expect(css).toMatch(/\.boq-template-card[^{]*\{[^}]*gap:\s*16px/);

    // Preview image (Rectangle 78: 204px height, 2px radius)
    expect(css).toMatch(/\.boq-card-img-wrap[^{]*\{[^}]*height:\s*204px/);
    expect(css).toMatch(/\.boq-card-img-wrap[^{]*\{[^}]*border-radius:\s*2px/);
    expect(css).toMatch(/\.boq-card-img[^{]*\{[^}]*object-fit:\s*cover/);

    // Title & subtitle typography
    expect(css).toMatch(/\.boq-card-title[^{]*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.boq-card-title[^{]*\{[^}]*font-size:\s*16px/);
    expect(css).toMatch(/\.boq-card-title[^{]*\{[^}]*color:\s*#0F172A/);

    expect(css).toMatch(/\.boq-card-meta[^{]*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.boq-card-meta[^{]*\{[^}]*color:\s*#64748B/);

    // Badges: category pill & status pill
    expect(css).toMatch(/\.boq-tag-pill\s*\{[^}]*background:\s*rgba\(71,\s*85,\s*105,\s*0\.1\)/);
    expect(css).toMatch(/\.boq-tag-pill\s*\{[^}]*border-radius:\s*9999px/);
    expect(css).toMatch(/\.boq-tag-pill\s*\{[^}]*color:\s*#475569/);

    expect(css).toMatch(/\.boq-status-pill\.status-active[^{]*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\)/);
    expect(css).toMatch(/\.boq-status-pill\.status-active[^{]*\{[^}]*color:\s*#16A34A/);

    // Cost Mapping progress bar (8px track, 100px radius, 118px fill radius)
    expect(css).toMatch(/\.boq-progress-bar-bg[^{]*\{[^}]*height:\s*8px/);
    expect(css).toMatch(/\.boq-progress-bar-bg[^{]*\{[^}]*background:\s*#E2E8F0/);
    expect(css).toMatch(/\.boq-progress-bar-bg[^{]*\{[^}]*border-radius:\s*100px/);
    expect(css).toMatch(/\.boq-progress-bar-fill[^{]*\{[^}]*background:\s*#16A34A/);
    expect(css).toMatch(/\.boq-progress-text[^{]*\{[^}]*font-size:\s*14px/);

    // Separator line
    expect(css).toMatch(/\.boq-card-divider\s*\{[^}]*background:\s*#EBEBEB/);

    // Footer row: version, usage, and action button
    expect(css).toMatch(/\.boq-card-used[^{]*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.boq-card-used[^{]*\{[^}]*color:\s*#64748B/);
  });

  it("6. Verifies BOQ Template Card Dynamic Data Binding", () => {
    // Dynamic fields in Card JSX
    expect(boqGridCode).toContain("{template.name}");
    expect(boqGridCode).toContain("{template.sections || 18} Sections • {template.items || 186} Items");
    expect(boqGridCode).toContain("{categoryTag}");
    expect(boqGridCode).toContain("{subCategoryTag && <span className=\"boq-tag-pill\">{subCategoryTag}</span>}");
    expect(boqGridCode).toContain("{template.status ? template.status.toUpperCase() : \"ACTIVE\"}");
    expect(boqGridCode).toContain("{mappingPercent}% Mapped");
    expect(boqGridCode).toContain("{template.version || \"v3.2\"} • Used {template.useCount ?? 42} Times");

    // Action menu options
    expect(boqGridCode).toContain("Use Template");
    expect(boqGridCode).toContain("View Details");
    expect(boqGridCode).toContain("Edit Template");
    expect(boqGridCode).toContain("Duplicate");
    expect(boqGridCode).toContain("Archive");
  });

  it("7. Verifies Backend API Integration with boq_templates Table", () => {
    expect(apiRouteCode).toContain("boqTemplates");
    expect(apiRouteCode).toContain("supabase.from(\"boq_templates\")");
    expect(apiRouteCode).toContain("boqTemplateDto");
    expect(apiRouteCode).toContain("defaultBoqTemplateFixtures");
  });

  it("8. Verifies Direct Route Redirects to ?tab=boqs", () => {
    expect(redirectRoute1Code).toContain("redirect(\"/templates?tab=boqs\")");
    expect(redirectRoute2Code).toContain("redirect(\"/templates?tab=boqs\")");
  });

  it("9. Verifies Pagination and Empty State Handlers", () => {
    expect(boqGridCode).toContain("Total BOQ Templates: {total}");
    expect(boqGridCode).toContain("Show per Page:");
    expect(boqGridCode).toContain("No BOQ templates found");
    expect(boqGridCode).toContain("empty-create-boq-btn");
  });
});
