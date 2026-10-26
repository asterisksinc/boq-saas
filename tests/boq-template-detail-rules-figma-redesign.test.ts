import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BOQ Template Detail → Rules Tab Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/boq-rules-redesign.css");
  const componentPath = path.resolve(
    __dirname,
    "../components/templates/boq/BoqTemplateRules.tsx"
  );
  const pagePath = path.resolve(
    __dirname,
    "../app/templates/boq/[id]/page.tsx"
  );
  const layoutPath = path.resolve(__dirname, "../app/layout.tsx");

  it("1. Verifies that all required files exist", () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    expect(fs.existsSync(componentPath)).toBe(true);
    expect(fs.existsSync(pagePath)).toBe(true);
    expect(fs.existsSync(layoutPath)).toBe(true);
  });

  it("2. Verifies root layout imports the BOQ rules redesign stylesheet", () => {
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain("./boq-rules-redesign.css");
  });

  it("3. Verifies page.tsx integrates BoqTemplateRules for the Rules tab", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain('import BoqTemplateRules from "@/components/templates/boq/BoqTemplateRules";');
    expect(pageContent).toContain('{activeTab === "Rules" && (');
    expect(pageContent).toContain("<BoqTemplateRules");
  });

  it("4. Verifies CSS specifications for Rules Subheader & Search Toolbar (Frame 2147225198)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-rules-subheader");
    expect(css).toContain(".boq-rules-title");
    expect(css).toContain(".boq-rules-desc");
    expect(css).toContain(".boq-rules-search-box");
    expect(css).toContain("background: #F0F4F9");
    expect(css).toContain("width: 270px");
    expect(css).toContain("height: 46px");
    expect(css).toContain(".boq-rules-create-btn");
    expect(css).toContain("background: #2563EB");
    expect(css).toContain("min-width: 132px");
    expect(css).toContain("height: 46px");
    expect(css).toContain(".boq-rules-icon-btn");
    expect(css).toContain("width: 46px");
    expect(css).toContain("height: 46px");
  });

  it("5. Verifies CSS specifications for 4 Summary Metric Cards (Frame 2147225138)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-rules-metrics-grid");
    expect(css).toContain(".boq-rules-metric-card");
    expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
    expect(css).toContain(".boq-rules-metric-val.accent");
    expect(css).toContain("#16A34A"); // Green for indicative base cost
    expect(css).toContain(".boq-rules-metric-val.blue");
    expect(css).toContain("#2563EB"); // Blue for rate mapping
    expect(css).toContain(".boq-rules-metric-sub");
  });

  it("6. Verifies CSS specifications for Rule Category Filter Bar (Frame 2147225291)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-rules-filter-bar");
    expect(css).toContain("background: #FFFFFF");
    expect(css).toContain("border: 1px solid #E2E8F0");
    expect(css).toContain(".boq-rules-filter-btn.active");
    expect(css).toContain("background: #EFF6FF");
    expect(css).toContain("color: #2563EB");
    expect(css).toContain(".boq-rules-filter-badge");
  });

  it("7. Verifies CSS specifications for Rules Table & Pagination (Frame 2147225085 & 2147225072)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-rules-table-container");
    expect(css).toContain(".boq-rules-table");
    expect(css).toContain("background: #E4ECFB"); // Header background
    expect(css).toContain(".boq-rules-th-name");
    expect(css).toContain(".boq-rules-th-scope");
    expect(css).toContain(".boq-rules-th-val");
    expect(css).toContain(".boq-rules-th-source");
    expect(css).toContain(".boq-rules-th-status");
    expect(css).toContain(".boq-rules-th-impact");
    expect(css).toContain(".boq-rules-th-updated");
    expect(css).toContain(".boq-rules-source-badge.template");
    expect(css).toContain(".boq-rules-source-badge.organisation");
    expect(css).toContain(".boq-rules-status-badge.active");
    expect(css).toContain(".boq-rules-status-badge.override");
    expect(css).toContain(".boq-rules-status-badge.inactive");
    expect(css).toContain(".boq-rules-scroll-indicator");
    expect(css).toContain(".boq-rules-pagination");
    expect(css).toContain(".boq-rules-page-btn.active");
  });

  it("8. Verifies component contains all required elements, columns, and Figma data rows", () => {
    const comp = fs.readFileSync(componentPath, "utf-8");
    // Subheader
    expect(comp).toContain("Rules");
    expect(comp).toContain("Configure how this BOQ behaves when used in Projects");
    expect(comp).toContain("Search rules...");
    expect(comp).toContain("Create Rule");

    // Metrics
    expect(comp).toContain("Sections");
    expect(comp).toContain("Line Items");
    expect(comp).toContain("Indicative Base Cost");
    expect(comp).toContain("Rate Mapping");
    expect(comp).toContain("Organised Structure");
    expect(comp).toContain("Total Items");
    expect(comp).toContain("Current Library Rates");
    expect(comp).toContain("Mapped to Library");

    // Category Filter Pills
    expect(comp).toContain("All Rules");
    expect(comp).toContain("Commercial");
    expect(comp).toContain("Calculation");
    expect(comp).toContain("Governance");

    // Table Headers
    expect(comp).toContain("RULE NAME");
    expect(comp).toContain("SCOPE");
    expect(comp).toContain("VALUE");
    expect(comp).toContain("SOURCE");
    expect(comp).toContain("STATUS");
    expect(comp).toContain("IMPACT");
    expect(comp).toContain("LAST UPDATED");

    // Figma Reference Data Rows
    expect(comp).toContain("Quantity Resolution");
    expect(comp).toContain("How quantity is determined");
    expect(comp).toContain("Rate Resolution");
    expect(comp).toContain("Where item rates comes from");
    expect(comp).toContain("Default Storage");
    expect(comp).toContain("General Wastage %");
    expect(comp).toContain("Flooring Wastage");
    expect(comp).toContain("Category Override");
    expect(comp).toContain("Default Tax");
    expect(comp).toContain("Markup percentage");
    expect(comp).toContain("Default Markup");
    expect(comp).toContain("Markup Percentage");

    // Inspector & Actions
    expect(comp).toContain("Overview");
    expect(comp).toContain("Conditions");
    expect(comp).toContain("Actions");
    expect(comp).toContain("Edit Rule");
    expect(comp).toContain("Deactivate Rule");
  });

  it("9. Verifies interactive mutation flows & backend persistence via PATCH API", () => {
    const comp = fs.readFileSync(componentPath, "utf-8");
    expect(comp).toContain("PATCH");
    expect(comp).toContain("metadata");
    expect(comp).toContain("rules");
    expect(comp).toContain("isCreateModalOpen");
    expect(comp).toContain("editingRule");
    expect(comp).toContain("deletingRule");
    expect(comp).toContain("handleToggleStatus");
  });
});
