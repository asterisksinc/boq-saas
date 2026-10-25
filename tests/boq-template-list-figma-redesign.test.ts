import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function parseEnv(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  }
  return env;
}

describe("BOQ Templates → List View & Filter Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const tableComponentPath = path.resolve(__dirname, "../components/templates/boq/BoqTemplateTable.tsx");
  const filterComponentPath = path.resolve(__dirname, "../components/templates/boq/BoqTemplateFilterDrawer.tsx");
  const pagePath = path.resolve(__dirname, "../app/templates/page.tsx");
  const env = parseEnv(path.resolve(__dirname, "../.env.local"));

  it("1. Verifies CSS contains all Figma design tokens for BOQ Template List View and Filter Panel", () => {
    const css = fs.readFileSync(cssPath, "utf8");

    // Table container and layout
    expect(css).toContain(".boq-list-layout-wrap");
    expect(css).toContain(".boq-table-card");
    expect(css).toContain("rgba(255, 255, 255, 0.6)");
    expect(css).toContain("backdrop-filter: blur(8px)");

    // Table headers & row styling
    expect(css).toContain(".boq-list-table");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain("height: 78px");
    expect(css).toContain("border-bottom: 1px solid #EBEBEB");

    // Category pills & colors
    expect(css).toContain(".cat-interior");
    expect(css).toContain(".cat-kitchen");
    expect(css).toContain(".cat-flooring");
    expect(css).toContain(".cat-painting");
    expect(css).toContain(".cat-commercial");
    expect(css).toContain("#FAB000");
    expect(css).toContain("#DC2626");
    expect(css).toContain("#533AFD");

    // Cost Mapping progress bar
    expect(css).toContain(".boq-cell-mapping-track");
    expect(css).toContain("width: 158px");
    expect(css).toContain("height: 8px");
    expect(css).toContain("#E2E8F0");
    expect(css).toContain("#16A34A");

    // Pagination row
    expect(css).toContain(".boq-pagination-bar");
    expect(css).toContain(".boq-page-num-btn");
    expect(css).toContain("width: 34px");
    expect(css).toContain("height: 34px");
    expect(css).toContain(".boq-pagination-size");

    // Filter sidebar panel
    expect(css).toContain(".boq-filter-sidebar");
    expect(css).toContain("width: 310px");
    expect(css).toContain("border-radius: 12px");
    expect(css).toContain(".boq-filter-sidebar-btn-clear");
    expect(css).toContain(".boq-filter-sidebar-btn-apply");
  });

  it("2. Verifies BoqTemplateTable component implements exact Figma column structure and row markup", () => {
    const tableSource = fs.readFileSync(tableComponentPath, "utf8");

    // Headers
    expect(tableSource).toContain("TEMPLATE NAME");
    expect(tableSource).toContain("CATEGORY");
    expect(tableSource).toContain("SECTIONS");
    expect(tableSource).toContain("ITEMS");
    expect(tableSource).toContain("COST MAPPING");
    expect(tableSource).toContain("USED IN");
    expect(tableSource).toContain("VERSION");
    expect(tableSource).toContain("STATUS");
    expect(tableSource).toContain("LAST MODIFIED");

    // Thumbnail & name info
    expect(tableSource).toContain("boq-cell-thumb");
    expect(tableSource).toContain("boq-cell-title");
    expect(tableSource).toContain("boq-cell-code");
    expect(tableSource).toContain("boq-cell-subtags");
    expect(tableSource).toContain("boq-cell-subtag-pill");

    // Category pill
    expect(tableSource).toContain("boq-category-pill");
    expect(tableSource).toContain("getCategoryClass");

    // Cost mapping progress bar
    expect(tableSource).toContain("boq-cell-mapping-track");
    expect(tableSource).toContain("boq-cell-mapping-fill");
    expect(tableSource).toContain("boq-cell-mapping-pct");

    // Used in & Version & Status
    expect(tableSource).toContain("boq-cell-used-num");
    expect(tableSource).toContain("boq-cell-used-label");
    expect(tableSource).toContain("boq-cell-version-text");
    expect(tableSource).toContain("boq-cell-status-pill");

    // Last modified & Actions
    expect(tableSource).toContain("boq-cell-modified-date");
    expect(tableSource).toContain("boq-cell-modified-time");
    expect(tableSource).toContain("boq-row-menu-btn");
    expect(tableSource).toContain("Use Template");
    expect(tableSource).toContain("View Details");
    expect(tableSource).toContain("Edit Template");
    expect(tableSource).toContain("Duplicate");
    expect(tableSource).toContain("Archive");
  });

  it("3. Verifies BoqTemplateTable component implements Figma pagination bar", () => {
    const tableSource = fs.readFileSync(tableComponentPath, "utf8");

    expect(tableSource).toContain("boq-pagination-bar");
    expect(tableSource).toContain("Total BOQ Templates:");
    expect(tableSource).toContain("boq-pagination-nav");
    expect(tableSource).toContain("boq-page-num-btn");
    expect(tableSource).toContain("boq-pagination-size");
    expect(tableSource).toContain("Show per Page:");
    expect(tableSource).toContain("boq-pagination-size-select");
  });

  it("4. Verifies BoqTemplateFilterDrawer implements Figma-exact 310px sidebar layout and controls", () => {
    const filterSource = fs.readFileSync(filterComponentPath, "utf8");

    expect(filterSource).toContain("boq-filter-sidebar");
    expect(filterSource).toContain("boq-filter-sidebar-header");
    expect(filterSource).toContain("FILTER");
    expect(filterSource).toContain("boq-filter-sidebar-close");

    // Sections
    expect(filterSource).toContain("Template Status");
    expect(filterSource).toContain("Project Type");
    expect(filterSource).toContain("Category");
    expect(filterSource).toContain("Cost Mapping");
    expect(filterSource).toContain("Used In");

    // Footer actions
    expect(filterSource).toContain("boq-filter-sidebar-btn-clear");
    expect(filterSource).toContain("boq-filter-sidebar-btn-apply");
    expect(filterSource).toContain("Clear All");
    expect(filterSource).toContain("Apply Filters");
    expect(filterSource).toContain("appliedCount");
  });

  it("5. Verifies app/templates/page.tsx supports list view and filter drawer toggle", () => {
    const pageSource = fs.readFileSync(pagePath, "utf8");

    expect(pageSource).toContain("boq-list-layout-wrap");
    expect(pageSource).toContain("BoqTemplateTable");
    expect(pageSource).toContain("BoqTemplateFilterDrawer");
    expect(pageSource).toContain("view === \"grid\"");
    expect(pageSource).toContain("viewParam === \"list\"");
    expect(pageSource).toContain("isBoqFilterOpen");
  });

  it("6. Verifies redirect routes pass query parameters to /templates?tab=boqs", () => {
    const boqRedirectPath = path.resolve(__dirname, "../app/templates/boq/page.tsx");
    const projectBoqRedirectPath = path.resolve(__dirname, "../app/templates/project-templates/boq/page.tsx");

    const boqRedirectSource = fs.readFileSync(boqRedirectPath, "utf8");
    const projectBoqRedirectSource = fs.readFileSync(projectBoqRedirectPath, "utf8");

    expect(boqRedirectSource).toContain('"tab", "boqs"');
    expect(projectBoqRedirectSource).toContain('"tab", "boqs"');
    expect(boqRedirectSource).toContain("searchParams");
    expect(projectBoqRedirectSource).toContain("searchParams");
  });

  it("7. Verifies live database templates contract for BOQ list view", async () => {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseKey).toBeDefined();

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data, error } = await supabase
      .from("boq_templates")
      .select("id, name, use_count, created_at, updated_at, snapshot, tags")
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data!.length).toBeGreaterThan(0);

    const first = data![0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(typeof first.name).toBe("string");
    expect(first.name.length).toBeGreaterThan(0);

    console.log(`Live DB verified BOQ template: "${first.name}" (ID: ${first.id}, use_count: ${first.use_count})`);
  }, 10000);
});
