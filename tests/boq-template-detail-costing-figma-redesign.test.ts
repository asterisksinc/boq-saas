import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BOQ Template Detail → Costing Tab Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/boq-costing-redesign.css");
  const componentPath = path.resolve(
    __dirname,
    "../components/templates/boq/BoqTemplateCosting.tsx"
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

  it("2. Verifies root layout imports the BOQ costing redesign stylesheet", () => {
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain("./boq-costing-redesign.css");
  });

  it("3. Verifies page.tsx integrates BoqTemplateCosting for the Costing tab", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain('import BoqTemplateCosting from "@/components/templates/boq/BoqTemplateCosting";');
    expect(pageContent).toContain('{activeTab === "Costing" && (');
    expect(pageContent).toContain("<BoqTemplateCosting");
  });

  it("4. Verifies CSS specifications for Costing Subheader (Frame 2147225198)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-costing-subheader");
    expect(css).toContain(".boq-costing-subheader-title");
    expect(css).toContain(".boq-costing-subheader-desc");
    expect(css).toContain(".boq-costing-refresh-btn");
  });

  it("5. Verifies CSS specifications for 4 Summary Metric Cards (Frame 2147225138)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-costing-metrics-row");
    expect(css).toContain(".boq-costing-metric-card");
    expect(css).toContain(".boq-costing-metric-val.green");
    expect(css).toContain("#16A34A"); // Green for indicative base cost
    expect(css).toContain(".boq-costing-metric-val.blue");
    expect(css).toContain("#2563EB"); // Blue for rate mapping
  });

  it("6. Verifies CSS specifications for Costing Table Panel and 12-column Table", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-costing-table-panel");
    expect(css).toContain(".boq-costing-table");
    expect(css).toContain(".boq-costing-thead-tr");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain(".boq-costing-tbody-tr");
    expect(css).toContain("height: 56px");
    expect(css).toContain(".boq-costing-status-pill.mapped");
    expect(css).toContain(".boq-costing-status-pill.review");
    expect(css).toContain(".boq-costing-status-pill.unmapped");
    expect(css).toContain(".boq-costing-fresh-dot.current");
    expect(css).toContain(".boq-costing-fresh-dot.review");
    expect(css).toContain(".boq-costing-fresh-dot.outdated");
    expect(css).toContain(".boq-costing-fresh-dot.unmapped");
  });

  it("7. Verifies CSS specifications for Costing Item Inspector Panel (Frame 2147225215)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-costing-inspector-panel");
    expect(css).toContain("width: 325.5px");
    expect(css).toContain(".boq-costing-inspector-title");
    expect(css).toContain(".boq-costing-accordion-item");
    expect(css).toContain(".boq-costing-duplicate-btn");
    expect(css).toContain(".boq-costing-remove-btn");
    expect(css).toContain(".boq-costing-save-btn");
    expect(css).toContain("background: #2563EB");
  });

  it("8. Verifies component contains all required elements from Figma spec", () => {
    const comp = fs.readFileSync(componentPath, "utf-8");
    expect(comp).toContain("Costing");
    expect(comp).toContain("Monitor rate coverage, costing references, cost composition and rate changes across this BOQ template.");
    expect(comp).toContain("Costing as of:");
    expect(comp).toContain("Sections");
    expect(comp).toContain("Line Items");
    expect(comp).toContain("Indicative Base Cost");
    expect(comp).toContain("Rate Mapping");
    expect(comp).toContain("COSTING ITEMS");
    expect(comp).toContain("Search costing items...");
    expect(comp).toContain("RATE SOURCE");
    expect(comp).toContain("CURRENT RATE (₹)");
    expect(comp).toContain("SNAPSHOT");
    expect(comp).toContain("VARIANCE");
    expect(comp).toContain("FRESHNESS");
    expect(comp).toContain("RATE STATUS");
    // Accordion titles
    expect(comp).toContain("General");
    expect(comp).toContain("Measurement & Quantity");
    expect(comp).toContain("Rate Source");
    expect(comp).toContain("Tax");
    expect(comp).toContain("Rate History & Audit");
    // Action buttons
    expect(comp).toContain("Duplicate");
    expect(comp).toContain("Remove Item");
    expect(comp).toContain("Update Rate");
  });

  it("9. Verifies fallback data matches Figma Costing items FUR-001 through FUR-005", () => {
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
  });
});
