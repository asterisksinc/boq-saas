import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BOQ Template Detail → BOQ Structure Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/boq-structure-redesign.css");
  const componentPath = path.resolve(
    __dirname,
    "../components/templates/boq/BoqTemplateStructure.tsx"
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

  it("2. Verifies root layout imports the BOQ structure redesign stylesheet", () => {
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain("./boq-structure-redesign.css");
  });

  it("3. Verifies page.tsx integrates BoqTemplateStructure for the BOQ Structure tab", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain('import BoqTemplateStructure from "@/components/templates/boq/BoqTemplateStructure";');
    expect(pageContent).toContain('{activeTab === "BOQ Structure" && (');
    expect(pageContent).toContain("<BoqTemplateStructure");
  });

  it("4. Verifies CSS specifications for Subheader (Frame 2147225198)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-struct-subheader");
    expect(css).toContain(".boq-struct-subheader-title");
    expect(css).toContain(".boq-struct-subheader-desc");
    expect(css).toContain(".boq-struct-refresh-btn");
  });

  it("5. Verifies CSS specifications for 5 Summary Metric Cards (Frame 2147225138)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-struct-metrics-row");
    expect(css).toContain(".boq-struct-metric-card");
    expect(css).toContain(".boq-struct-metric-val.green");
    expect(css).toContain("#16A34A"); // Green for indicative base cost
    expect(css).toContain(".boq-struct-metric-val.blue");
    expect(css).toContain("#2563EB"); // Blue for rate mapping
  });

  it("6. Verifies CSS specifications for Left Sidebar (Frame 2147225071)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-struct-sidebar");
    expect(css).toContain("width: 310px");
    expect(css).toContain(".boq-struct-search-box");
    expect(css).toContain("height: 46px");
    expect(css).toContain(".boq-struct-add-section-btn");
    expect(css).toContain("background: #2563EB");
  });

  it("7. Verifies CSS specifications for Right Items Panel and Table (Frame 2147225085 & 57)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-struct-items-panel");
    expect(css).toContain(".boq-struct-table");
    expect(css).toContain(".boq-struct-thead-tr");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain(".boq-struct-tbody-tr");
    expect(css).toContain("height: 56px");
    expect(css).toContain(".boq-struct-total-tr");
    expect(css).toContain(".boq-struct-status-badge.mapped");
    expect(css).toContain(".boq-struct-status-badge.outdated");
    expect(css).toContain(".boq-struct-status-badge.missing");
  });

  it("8. Verifies component contains all required sections from Figma spec", () => {
    const comp = fs.readFileSync(componentPath, "utf-8");
    expect(comp).toContain("BOQ Structure");
    expect(comp).toContain("Monitor line items, categories, base cost across this BOQ template.");
    expect(comp).toContain("Structure as of:");
    expect(comp).toContain("Sections");
    expect(comp).toContain("Line Items");
    expect(comp).toContain("Indicative Base Cost");
    expect(comp).toContain("Rate Mapping");
    expect(comp).toContain("Project Templates");
    expect(comp).toContain("BOQ STRUCTURE");
    expect(comp).toContain("Search sections...");
    expect(comp).toContain("Add BOQ Section");
    expect(comp).toContain("Add Item");
    expect(comp).toContain("RATE STATUS");
    expect(comp).toContain("TOTAL (");
    expect(comp).toContain("Show per Page:");
  });

  it("9. Verifies fallback data matches Figma Master Bedroom > Furniture items", () => {
    const comp = fs.readFileSync(componentPath, "utf-8");
    expect(comp).toContain("FUR-001");
    expect(comp).toContain("Full Height Wardrobe");
    expect(comp).toContain("FUR-002");
    expect(comp).toContain("Kind Size Bed");
    expect(comp).toContain("FUR-003");
    expect(comp).toContain("Side Table");
    expect(comp).toContain("FUR-004");
    expect(comp).toContain("Dressing Table");
    expect(comp).toContain("FUR-005");
    expect(comp).toContain("Study Table");
    expect(comp).toContain("FUR-006");
    expect(comp).toContain("TV Unit");
    expect(comp).toContain("FUR-007");
    expect(comp).toContain("Chest of Drawers");
    expect(comp).toContain("FUR-008");
    expect(comp).toContain("Mirror with Frame");
  });

  it("10. Verifies CSS specifications for In-Flow Item Inspector Panel (Frame 2147225086)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-struct-inspector-panel");
    expect(css).toContain("width: 310px");
    expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
    expect(css).toContain(".boq-struct-inspector-panel-header");
    expect(css).toContain(".boq-struct-inspector-identity");
    expect(css).toContain(".boq-struct-inspector-tabs-wrap");
    expect(css).toContain(".boq-struct-inspector-tab-btn");
    expect(css).toContain(".boq-struct-inspector-duplicate-btn");
    expect(css).toContain("width: 127px");
    expect(css).toContain(".boq-struct-inspector-remove-btn");
    expect(css).toContain("color: #DC2626");
    expect(css).toContain(".boq-struct-inspector-save-btn");
    expect(css).toContain("background: #2563EB");
  });

  it("11. Verifies Item Inspector contains all 5 tabs and specification fields from Figma spec", () => {
    const comp = fs.readFileSync(componentPath, "utf-8");
    // Inspector header & identity
    expect(comp).toContain("ITEM INSPECTOR");
    expect(comp).toContain("boq-struct-inspector-identity");
    // 5 Tabs
    expect(comp).toContain('"General"');
    expect(comp).toContain('"Measurement"');
    expect(comp).toContain('"Costing"');
    expect(comp).toContain('"Tasks"');
    expect(comp).toContain('"Approvals"');
    // General Tab Fields
    expect(comp).toContain("Item Name");
    expect(comp).toContain("Item Code");
    expect(comp).toContain("Item Specification");
    expect(comp).toContain("19mm BWP Plywood Laminate Finish Soft-close Hardware");
    expect(comp).toContain("ACTIVE");
    expect(comp).toContain("Created by");
    expect(comp).toContain("Admin User");
    expect(comp).toContain("Created On");
    expect(comp).toContain("12 Jul 2026");
    expect(comp).toContain("Last Modified");
    expect(comp).toContain("08 Aug 2026");
    // Action buttons
    expect(comp).toContain("Duplicate");
    expect(comp).toContain("Remove Item");
    expect(comp).toContain("Save Changes");
  });
});
