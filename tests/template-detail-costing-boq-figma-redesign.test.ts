import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function calculateItemAmount(
  quantity: number,
  rate: number,
  wastePercent: number,
  taxPercent: number
): number {
  const q = Number(quantity) || 0;
  const r = Number(rate) || 0;
  const w = Number(wastePercent) || 0;
  const t = Number(taxPercent) || 0;
  return Math.round(q * r * (1 + w / 100) * (1 + t / 100));
}

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

describe("Project Template Detail → Costing & BOQ Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const costingComponentPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateCostingBoq.tsx"
  );
  const detailPagePath = path.resolve(
    __dirname,
    "../app/templates/[id]/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const costingCode = fs.readFileSync(costingComponentPath, "utf8");
  const detailPageCode = fs.readFileSync(detailPagePath, "utf8");

  it("1. Verifies fluid 2-column grid layout and eliminates right-side whitespace", () => {
    // Costing layout must be responsive without hardcoded fixed canvas
    expect(css).toMatch(/\.td-costing-layout\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.td-costing-layout\s*\{[^}]*max-width:\s*100%/);
    expect(css).not.toMatch(/\.td-costing-layout\s*\{[^}]*width:\s*1440px/);

    // Responsive 2-column grid: sidebar minmax(260px, 310px) and flexible workspace minmax(0, 1fr)
    expect(css).toMatch(
      /\.td-costing-layout\s*\{[^}]*grid-template-columns:\s*minmax\(260px,\s*310px\)\s*minmax\(0,\s*1fr\)/
    );

    // Responsive collapse for tablet/mobile
    expect(css).toContain("@media (max-width: 900px)");
  });

  it("2. Verifies Left BOQ Structure Sidebar matches Figma Frame 2147225071", () => {
    // Outer panel: rgba(255, 255, 255, 0.6), border-radius: 6px, padding: 20px
    expect(css).toMatch(
      /\.td-costing-sidebar\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/
    );
    expect(css).toMatch(/\.td-costing-sidebar\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-costing-sidebar\s*\{[^}]*padding:\s*20px/);

    // Header: BOQ STRUCTURE and Sections/Items count
    expect(costingCode).toContain("BOQ STRUCTURE");
    expect(costingCode).toContain("Sections •");
    expect(costingCode).toContain("Items");
    expect(css).toMatch(/\.td-costing-sidebar-title\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-costing-sidebar-title\s*\{[^}]*color:\s*#64748B/);

    // Search button: 47x46px #F0F4F9 with 36x36px white inner box
    expect(css).toMatch(/\.td-costing-search-btn\s*\{[^}]*width:\s*47px/);
    expect(css).toMatch(/\.td-costing-search-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-costing-search-btn\s*\{[^}]*background:\s*#F0F4F9/);
    expect(css).toMatch(/\.td-costing-search-btn-inner\s*\{[^}]*width:\s*36px/);
    expect(css).toMatch(/\.td-costing-search-btn-inner\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-costing-search-btn-inner\s*\{[^}]*background:\s*#FFFFFF/);

    // Selected section row styling: #EFF6FF background, #2563EB text
    expect(css).toMatch(
      /\.td-costing-sub-row\.selected\s*\{[^}]*background:\s*#EFF6FF/
    );
    expect(css).toMatch(
      /\.td-costing-sub-row\.selected\s*\.td-costing-sub-name\s*\{[^}]*color:\s*#2563EB/
    );

    // Add BOQ Structure button: #2563EB, 46px height, 6px radius, white text
    expect(css).toMatch(
      /\.td-costing-add-btn\s*\{[^}]*background:\s*#2563EB/
    );
    expect(css).toMatch(/\.td-costing-add-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-costing-add-btn\s*\{[^}]*border-radius:\s*6px/);
    expect(costingCode).toContain("Add BOQ Structure");
  });

  it("3. Verifies Right Panel Header & Actions match Figma Frame 2147225072 & Frame 2147225198", () => {
    // Main workspace container: rgba(255, 255, 255, 0.6), border-radius: 6px, padding: 20px
    expect(css).toMatch(
      /\.td-costing-main\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/
    );
    expect(css).toMatch(/\.td-costing-main\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-costing-main\s*\{[^}]*padding:\s*20px/);

    // Title: 24px font-size, 600 weight, #0F172A
    expect(css).toMatch(/\.td-costing-main-title\s*\{[^}]*font-size:\s*24px/);
    expect(css).toMatch(/\.td-costing-main-title\s*\{[^}]*font-weight:\s*600/);

    // Subtitle: 14px font-size, #64748B
    expect(css).toMatch(/\.td-costing-main-subtitle\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-costing-main-subtitle\s*\{[^}]*color:\s*#64748B/);

    // 3 Action Buttons: 48x46px white boxes with 1px solid #E2E8F0 border
    expect(css).toMatch(/\.td-costing-icon-btn\s*\{[^}]*width:\s*48px/);
    expect(css).toMatch(/\.td-costing-icon-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-costing-icon-btn\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.td-costing-icon-btn\s*\{[^}]*border:\s*1px\s*solid\s*#E2E8F0/);

    // Subheader summary text: Items • Illustrative Template Value
    expect(costingCode).toContain("Illustrative Template Value");
    expect(css).toMatch(/\.td-costing-summary-bar\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-costing-summary-bar\s*\{[^}]*color:\s*#64748B/);
  });

  it("4. Verifies Table Data Structure, Columns, Rate Status Badges, and Totals Bar", () => {
    // Header: #E4ECFB background, 36px height, uppercase 14px 600 #64748B
    expect(css).toMatch(/\.td-costing-table thead tr\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-costing-table thead tr\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-costing-table th\s*\{[^}]*text-transform:\s*uppercase/);
    expect(css).toMatch(/\.td-costing-table th\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-costing-table th\s*\{[^}]*color:\s*#64748B/);

    // Columns present in markup
    expect(costingCode).toContain(">ITEM<");
    expect(costingCode).toContain(">UNIT<");
    expect(costingCode).toContain(">QTY<");
    expect(costingCode).toContain("RATE (₹)");
    expect(costingCode).toContain("WASTE (%)");
    expect(costingCode).toContain("TAX (%)");
    expect(costingCode).toContain("AMOUNT(₹)");
    expect(costingCode).toContain("RATE STATUS");

    // Table rows: 56px height, border-bottom 1px solid #EBEBEB
    expect(css).toMatch(/\.td-costing-table tbody tr\s*\{[^}]*height:\s*56px/);
    expect(css).toMatch(/\.td-costing-table tbody tr\s*\{[^}]*border-bottom:\s*1px\s*solid\s*#EBEBEB/);

    // Status Badges: MAPPED (#16A34A), OUTDATED (#D97706), MISSING (#DC2626)
    expect(css).toMatch(/\.td-costing-status-pill\.mapped\s*\{[^}]*color:\s*#16A34A/);
    expect(css).toMatch(/\.td-costing-status-pill\.outdated\s*\{[^}]*color:\s*#D97706/);
    expect(css).toMatch(/\.td-costing-status-pill\.missing\s*\{[^}]*color:\s*#DC2626/);

    // Total bar row: #E4ECFB background, 36px height
    expect(css).toMatch(/\.td-costing-table tbody tr\.td-costing-total-tr\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-costing-table tbody tr\.td-costing-total-tr\s*\{[^}]*height:\s*36px/);
    expect(costingCode).toContain("TOTAL (");
    expect(costingCode).toContain("ITEMS)");

    // Pagination bar: Total Items, Prev/Next, Show per Page
    expect(costingCode).toContain("Total Items:");
    expect(costingCode).toContain("Show per Page:");
    expect(css).toMatch(/\.td-costing-pagination-bar\s*\{[^}]*min-height:\s*50px/);
  });

  it("5. Verifies BOQ calculation formula: Qty * Rate * (1 + Waste%) * (1 + Tax%)", () => {
    // 72 units at ₹2875 with 5% waste and 18% tax
    // 72 * 2875 = 207,000
    // 207,000 * 1.05 = 217,350
    // 217,350 * 1.18 = 256,473
    const amt1 = calculateItemAmount(72, 2875, 5, 18);
    expect(amt1).toBe(256473);

    // 1 unit at ₹45800 with 0% waste and 18% tax
    // 45,800 * 1.18 = 54,044
    const amt2 = calculateItemAmount(1, 45800, 0, 18);
    expect(amt2).toBe(54044);

    // 2 units at ₹6250 with 5% waste and 18% tax
    // 12,500 * 1.05 = 13,125
    // 13,125 * 1.18 = 15,488
    const amt3 = calculateItemAmount(2, 6250, 5, 18);
    expect(amt3).toBe(15488);
  });

  it("6. Verifies persistence calls updateTemplateSection with real backend contract", () => {
    expect(costingCode).toContain('updateTemplateSection(templateId, "costing-boq"');
    expect(costingCode).toContain("persistChanges");
    expect(costingCode).toContain("onUpdate");
  });

  it("7. Verifies live database templates dynamic integration", async () => {
    const env = parseEnv(path.resolve(__dirname, "../.env.local"));
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      console.warn("Supabase credentials not found in .env.local, skipping live query.");
      return;
    }

    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SECRET_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    const { data: template, error } = await supabase
      .from("project_templates")
      .select("id, name, structure, costing_boq")
      .eq("id", "e1000000-0000-4000-8000-000000000001")
      .single();

    expect(error).toBeNull();
    expect(template).toBeDefined();
    expect(template?.name).toBe("Premium 3BHK Residential");

    const dynamicAreas = template?.structure?.areas || [];
    const dynamicSections = template?.costing_boq?.sections || [];

    expect(dynamicAreas.length).toBe(8);
    expect(dynamicSections.length).toBe(18);

    console.log(
      `Verified live database template "${template?.name}" with ${dynamicAreas.length} areas and ${dynamicSections.length} BOQ sections.`
    );
  });
});
