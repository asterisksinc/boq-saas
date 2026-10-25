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

describe("BOQ Template Detail → Overview Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const componentPath = path.resolve(__dirname, "../components/templates/boq/BoqTemplateOverview.tsx");
  const pagePath = path.resolve(__dirname, "../app/templates/boq/[id]/page.tsx");
  const env = parseEnv(path.resolve(__dirname, "../.env.local"));

  it("1. Verifies CSS contains all exact Figma design tokens for BOQ Template Detail Overview", () => {
    const css = fs.readFileSync(cssPath, "utf8");

    // Fluid page shell
    expect(css).toContain(".boq-detail-page-shell");
    expect(css).toContain("padding: 24px 32px");
    expect(css).toContain("'Urbanist'");

    // Header & breadcrumb
    expect(css).toContain(".boq-detail-back-link");
    expect(css).toContain("color: #475569");
    expect(css).toContain(".boq-detail-title");
    expect(css).toContain("font-size: 24px");
    expect(css).toContain("font-weight: 600");
    expect(css).toContain(".boq-detail-meta-line");
    expect(css).toContain(".boq-detail-code");
    expect(css).toContain(".boq-detail-action-icon-btn");
    expect(css).toContain("width: 48px");
    expect(css).toContain("height: 46px");
    expect(css).toContain(".boq-detail-use-btn");
    expect(css).toContain("width: 115px");
    expect(css).toContain("height: 46px");
    expect(css).toContain("background: #2563EB");

    // Tabs bar
    expect(css).toContain(".boq-detail-tabs-bar");
    expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
    expect(css).toContain("backdrop-filter: blur(8px)");
    expect(css).toContain(".boq-detail-tab-pill");
    expect(css).toContain(".boq-detail-tab-pill.active");
    expect(css).toContain("background: #EFF6FF");
    expect(css).toContain("color: #2563EB");

    // Base card token
    expect(css).toContain(".boq-overview-card");
    expect(css).toContain(".boq-overview-card-head");
    expect(css).toContain(".boq-overview-card-title");
    expect(css).toContain(".boq-overview-card-link");

    // Row 1: KPI grid
    expect(css).toContain(".boq-overview-kpi-grid");
    expect(css).toContain(".boq-overview-kpi-card");
    expect(css).toContain(".boq-overview-kpi-value.green");
    expect(css).toContain(".boq-overview-kpi-value.blue");

    // 3-Column rows
    expect(css).toContain(".boq-overview-row-3col");

    // Row 2: Readiness, Commercial Summary, Defaults
    expect(css).toContain(".boq-readiness-gauge-wrap");
    expect(css).toContain(".boq-readiness-gauge-score");
    expect(css).toContain(".boq-readiness-checks-col");
    expect(css).toContain(".boq-readiness-check-item");

    expect(css).toContain(".boq-commercial-summary-body");
    expect(css).toContain(".boq-commercial-breakdown");
    expect(css).toContain(".boq-commercial-base-label");
    expect(css).toContain(".boq-commercial-base-val");
    expect(css).toContain(".boq-commercial-row");
    expect(css).toContain(".boq-commercial-donut-col");

    expect(css).toContain(".boq-defaults-grid");
    expect(css).toContain(".boq-default-pill-icon.blue");
    expect(css).toContain(".boq-default-pill-icon.purple");
    expect(css).toContain(".boq-default-pill-icon.green");
    expect(css).toContain(".boq-default-pill-icon.amber");

    // Row 3: Structure & Coverage, Costing Health, Usage & Dependencies
    expect(css).toContain(".boq-coverage-stats-row");
    expect(css).toContain(".boq-coverage-vdivider");
    expect(css).toContain(".boq-coverage-bars-list");
    expect(css).toContain(".boq-coverage-progress-track");
    expect(css).toContain(".boq-coverage-progress-fill");

    expect(css).toContain(".boq-health-columns");
    expect(css).toContain(".boq-health-sq.blue");
    expect(css).toContain(".boq-health-sq.amber");
    expect(css).toContain(".boq-health-sq.red");

    expect(css).toContain(".boq-usage-dep-split");
    expect(css).toContain(".boq-usage-warning-banner");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain("color: #1E40AF");

    // Row 4: Attention Required, Version Governance, Recent Activity
    expect(css).toContain(".boq-attention-badge");
    expect(css).toContain(".boq-attention-cols");
    expect(css).toContain(".boq-attention-col-label.critical");
    expect(css).toContain(".boq-attention-col-label.warning");
    expect(css).toContain(".boq-attention-col-label.info");

    expect(css).toContain(".boq-version-gov-body");
    expect(css).toContain(".boq-version-number");
    expect(css).toContain(".boq-version-vdivider");
    expect(css).toContain(".boq-version-changes-list");

    expect(css).toContain(".boq-activity-timeline");
    expect(css).toContain(".boq-activity-indicator");
    expect(css).toContain(".boq-activity-ring.green");
    expect(css).toContain(".boq-activity-ring.purple");
    expect(css).toContain(".boq-activity-dot.green");
    expect(css).toContain(".boq-activity-dot.purple");
  });

  it("2. Verifies BoqTemplateOverview component implements all 4 rows and dynamic elements", () => {
    const compSource = fs.readFileSync(componentPath, "utf8");

    // Row 1 KPI metrics
    expect(compSource).toContain("Sections");
    expect(compSource).toContain("Organised Structure");
    expect(compSource).toContain("Line Items");
    expect(compSource).toContain("Total Items");
    expect(compSource).toContain("Indicative Base Cost");
    expect(compSource).toContain("Current Library Rates");
    expect(compSource).toContain("Rate Mapping");
    expect(compSource).toContain("Mapped to Library");

    // Row 2 Card 1: BOQ Readiness
    expect(compSource).toContain("BOQ Readiness");
    expect(compSource).toContain("View Validation →");
    expect(compSource).toContain("boq-readiness-gauge-wrap");
    expect(compSource).toContain("Structure Complete");
    expect(compSource).toContain("Sections Configured");
    expect(compSource).toContain("Units Configured");
    expect(compSource).toContain("Commercial Defaults Configured");
    expect(compSource).toContain("Automated Role references");
    expect(compSource).toContain("items require review");

    // Row 2 Card 2: Commercial Summary
    expect(compSource).toContain("Commercial Summary");
    expect(compSource).toContain("View Costing →");
    expect(compSource).toContain("Base Cost");
    expect(compSource).toContain("Material");
    expect(compSource).toContain("Labour");
    expect(compSource).toContain("Transport");
    expect(compSource).toContain("Other");
    expect(compSource).toContain("Indicative Cost");

    // Row 2 Card 3: Commercial Defaults
    expect(compSource).toContain("Commercial Defaults");
    expect(compSource).toContain("View Rules →");
    expect(compSource).toContain("Currency");
    expect(compSource).toContain("Default Wastage");
    expect(compSource).toContain("Tax Profile");
    expect(compSource).toContain("Default Markup");
    expect(compSource).toContain("Tax");
    expect(compSource).toContain("Rounding");

    // Row 3 Card 1: BOQ Structure & Coverage
    expect(compSource).toContain("BOQ Structure & Coverage");
    expect(compSource).toContain("View Structure →");
    expect(compSource).toContain("boq-coverage-vdivider");
    expect(compSource).toContain("Sections Configured");
    expect(compSource).toContain("Items with valid units");
    expect(compSource).toContain("Items with quantity rules");

    // Row 3 Card 2: Costing Health
    expect(compSource).toContain("Costing Health");
    expect(compSource).toContain("Review Costing →");
    expect(compSource).toContain("Mapped");
    expect(compSource).toContain("Outdated");
    expect(compSource).toContain("Review Required");
    expect(compSource).toContain("Missing");
    expect(compSource).toContain("Rate Freshness");
    expect(compSource).toContain("Current");
    expect(compSource).toContain("Review Soon");

    // Row 3 Card 3: Usage & Dependencies
    expect(compSource).toContain("Usage & Dependencies");
    expect(compSource).toContain("View Usage →");
    expect(compSource).toContain("Project Templates");
    expect(compSource).toContain("Active Projects");
    expect(compSource).toContain("Draft Templates");
    expect(compSource).toContain("Dependencies");
    expect(compSource).toContain("boq-usage-warning-banner");
    expect(compSource).toContain("Changes will create a new version");

    // Row 4 Card 1: Attention Required
    expect(compSource).toContain("Attention Required");
    expect(compSource).toContain("CRITICAL");
    expect(compSource).toContain("Missing Cost References");
    expect(compSource).toContain("WARNING");
    expect(compSource).toContain("Outdated rate References");
    expect(compSource).toContain("INFO");
    expect(compSource).toContain("Deprecated Item");
    expect(compSource).toContain("Review All Issues →");

    // Row 4 Card 2: Version Governance
    expect(compSource).toContain("Version Governance");
    expect(compSource).toContain("View Versions →");
    expect(compSource).toContain("Changes since v2.3");

    // Row 4 Card 3: Recent Activity
    expect(compSource).toContain("Recent Activity");
    expect(compSource).toContain("View Activity →");
    expect(compSource).toContain("Published");
    expect(compSource).toContain("Approved");
  });

  it("3. Verifies page.tsx integrates BoqTemplateOverview with proper header, actions, and tabs", () => {
    const pageSource = fs.readFileSync(pagePath, "utf8");

    // Back link to BOQ Templates tab
    expect(pageSource).toContain("router.push(\"/templates?tab=boqs\")");
    expect(pageSource).toContain("BOQ Templates");

    // Header actions
    expect(pageSource).toContain("boq-detail-action-icon-btn");
    expect(pageSource).toContain("boq-detail-use-btn");
    expect(pageSource).toContain("Use Template");

    // Tabs bar with all 7 tabs
    expect(pageSource).toContain("boq-detail-tabs-bar");
    expect(pageSource).toContain("boq-detail-tab-pill");
    expect(pageSource).toContain("BoqTemplateOverview");
    expect(pageSource).toContain('activeTab === "Overview"');
  });

  it("4. Connects to real Supabase database and verifies boq_templates records can back the Overview DTO", async () => {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SECRET_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not found in .env.local, skipping live query");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("boq_templates")
      .select("id, name, use_count, created_at, updated_at, snapshot, tags")
      .limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data!.length).toBeGreaterThan(0);

    const firstRow = data![0];
    expect(firstRow).toHaveProperty("id");
    expect(firstRow).toHaveProperty("name");
    expect(typeof firstRow.name).toBe("string");
    expect(firstRow.name.length).toBeGreaterThan(0);
  });
});
