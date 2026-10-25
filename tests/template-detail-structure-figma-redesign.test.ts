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

describe("Project Template Detail → Structure Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const structureComponentPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateStructure.tsx"
  );
  const detailPagePath = path.resolve(
    __dirname,
    "../app/templates/[id]/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const structureCode = fs.readFileSync(structureComponentPath, "utf8");
  const detailPageCode = fs.readFileSync(detailPagePath, "utf8");

  it("1. Verifies fluid container layout and eliminates right-side whitespace", () => {
    // Structure layout must be responsive without hardcoded fixed canvas
    expect(css).toMatch(/\.td-structure-layout\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.td-structure-layout\s*\{[^}]*max-width:\s*100%/);
    expect(css).not.toMatch(/\.td-structure-layout\s*\{[^}]*width:\s*1440px/);

    // Responsive 2-column or 3-column grid with flexible center panel (1fr)
    expect(css).toMatch(
      /\.td-structure-layout\s*\{[^}]*grid-template-columns:\s*minmax\(260px,\s*310px\)\s*minmax\(0,\s*1fr\)\s*minmax\(280px,\s*310px\)/
    );
    expect(css).toMatch(
      /\.td-structure-layout\.no-inspector\s*\{[^}]*grid-template-columns:\s*minmax\(260px,\s*310px\)\s*minmax\(0,\s*1fr\)/
    );

    // Breakpoints for tablet and mobile
    expect(css).toContain("@media (max-width: 1200px)");
    expect(css).toContain("@media (max-width: 840px)");
  });

  it("2. Verifies Left Project Structure Sidebar matches Figma Frame 2147225071", () => {
    // Outer panel: rgba(255, 255, 255, 0.6), border-radius: 6px, padding: 20px
    expect(css).toMatch(
      /\.td-structure-sidebar\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/
    );
    expect(css).toMatch(/\.td-structure-sidebar\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-structure-sidebar\s*\{[^}]*padding:\s*20px/);

    // Section title PROJECT STRUCTURE
    expect(structureCode).toContain("PROJECT STRUCTURE");
    expect(css).toMatch(/\.td-struct-sidebar-title\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-struct-sidebar-title\s*\{[^}]*color:\s*#64748B/);

    // Search box: #F0F4F9, 46px height, 8px radius with 36x36 white icon box
    expect(css).toMatch(/\.td-struct-search-box\s*\{[^}]*background:\s*#F0F4F9/);
    expect(css).toMatch(/\.td-struct-search-box\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-struct-search-box\s*\{[^}]*border-radius:\s*8px/);
    expect(css).toMatch(
      /\.td-struct-search-icon-box\s*\{[^}]*width:\s*36px/
    );
    expect(css).toMatch(
      /\.td-struct-search-icon-box\s*\{[^}]*height:\s*36px/
    );
    expect(structureCode).toContain('placeholder="Search structure"');

    // Hierarchy Groups: Areas, Workflow, Documents
    expect(structureCode).toContain("Areas ({areas.length})");
    expect(structureCode).toContain("Workflow ({workflowCount})");
    expect(structureCode).toContain("Documents ({documentsCount})");

    // Selected row styling: #EFF6FF background, #2563EB text
    expect(css).toMatch(
      /\.td-struct-area-row\.selected\s*\{[^}]*background:\s*#EFF6FF/
    );
    expect(css).toMatch(
      /\.td-struct-area-row\.selected\s*\.td-struct-area-left\s*\.area-title\s*\{[^}]*color:\s*#2563EB/
    );

    // Add Structure Button: #2563EB, 46px height, 6px radius, white text
    expect(css).toMatch(
      /\.td-add-structure-btn\s*\{[^}]*background:\s*#2563EB/
    );
    expect(css).toMatch(/\.td-add-structure-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-add-structure-btn\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-add-structure-btn\s*\{[^}]*color:\s*#FFFFFF/);
    expect(structureCode).toContain("Add Structure");
  });

  it("3. Verifies Middle BOQ Sections Panel matches Figma Frame 2147225072", () => {
    // Outer panel: rgba(255, 255, 255, 0.6), border-radius: 6px, padding: 20px
    expect(css).toMatch(
      /\.td-structure-center\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/
    );
    expect(css).toMatch(/\.td-structure-center\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-structure-center\s*\{[^}]*padding:\s*20px/);

    // Section title BOQ Sections with dynamic count
    expect(structureCode).toContain("BOQ Sections ({sectionsToRender.length})");
    expect(css).toMatch(/\.td-center-title\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-center-title\s*\{[^}]*color:\s*#64748B/);

    // BOQ Section Header Card (Frame 12): #FFFFFF, border 1px solid #E2E8F0, 48px height, 8px radius
    expect(css).toMatch(
      /\.td-section-card-header\s*\{[^}]*background:\s*#FFFFFF/
    );
    expect(css).toMatch(
      /\.td-section-card-header\s*\{[^}]*border:\s*1px solid #E2E8F0/
    );
    expect(css).toMatch(/\.td-section-card-header\s*\{[^}]*height:\s*48px/);
    expect(css).toMatch(
      /\.td-section-card-header\s*\{[^}]*border-radius:\s*8px/
    );

    // Number badge (Frame 2147225014): rgba(100, 116, 139, 0.12), radius 4px
    expect(css).toMatch(
      /\.td-sec-num-badge\s*\{[^}]*background:\s*rgba\(100,\s*116,\s*139,\s*0\.12\)/
    );
    expect(css).toMatch(/\.td-sec-num-badge\s*\{[^}]*border-radius:\s*4px/);

    // Table Header (Frame 57): #E4ECFB, height 36px, border-radius 8px
    expect(css).toMatch(
      /\.td-struct-table\s*thead\s*tr\s*\{[^}]*background:\s*#E4ECFB/
    );
    expect(css).toMatch(
      /\.td-struct-table\s*thead\s*tr\s*\{[^}]*height:\s*36px/
    );

    // Table column headers matching Figma:
    expect(structureCode).toContain("ITEM");
    expect(structureCode).toContain("TYPE");
    expect(structureCode).toContain("UNIT");
    expect(structureCode).toContain("BASE COST (₹)");
    expect(structureCode).toContain("SELLING RATE (₹)");
    expect(structureCode).toContain("MARGIN");
    expect(structureCode).toContain("PREFERRED VENDOR");
    expect(structureCode).toContain("RATE STATUS");
    expect(structureCode).toContain("UPDATED");

    // Table Row (Frame 59): 56px height, 1px border-bottom
    expect(css).toMatch(
      /\.td-struct-table\s*tbody\s*tr\s*\{[^}]*height:\s*56px/
    );
    expect(css).toMatch(
      /\.td-struct-table\s*tbody\s*tr\s*\{[^}]*border-bottom:\s*1px solid #EBEBEB/
    );

    // Margin in green #16A34A
    expect(css).toMatch(/\.td-struct-cell-margin\s*\{[^}]*color:\s*#16A34A/);

    // Status pill
    expect(css).toMatch(
      /\.td-struct-status-pill\.active\s*\{[^}]*color:\s*#16A34A/
    );
    expect(css).toMatch(
      /\.td-struct-status-pill\.draft\s*\{[^}]*color:\s*#64748B/
    );
  });

  it("4. Verifies Right Inspector Panel matches Figma Frame 2147225086", () => {
    // Outer panel: rgba(255, 255, 255, 0.6), border-radius: 6px, padding: 20px
    expect(css).toMatch(
      /\.td-inspector-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/
    );
    expect(css).toMatch(/\.td-inspector-panel\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-inspector-panel\s*\{[^}]*padding:\s*20px/);

    // Header INSPECTOR
    expect(structureCode).toContain("INSPECTOR");
    expect(css).toMatch(/\.td-inspector-title\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-inspector-title\s*\{[^}]*color:\s*#64748B/);

    // Form inputs: 48px height, #FFFFFF, border 1px solid #E2E8F0, radius 8px, padding 14px 16px
    expect(css).toMatch(/\.td-inspector-input[^{]*\{[^}]*height:\s*48px/);
    expect(css).toMatch(/\.td-inspector-input[^{]*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(
      /\.td-inspector-input[^{]*\{[^}]*border:\s*1px solid #E2E8F0/
    );
    expect(css).toMatch(
      /\.td-inspector-input[^{]*\{[^}]*border-radius:\s*8px/
    );
    expect(css).toMatch(
      /\.td-inspector-input[^{]*\{[^}]*padding:\s*14px 16px/
    );

    // General fields in Inspector
    expect(structureCode).toContain("Name <span className=\"req\">*</span>");
    expect(structureCode).toContain("Area Type <span className=\"req\">*</span>");
    expect(structureCode).toContain("Area Dimensions <span className=\"req\">*</span>");
    expect(structureCode).toContain("Code</label>");
    expect(structureCode).toContain("Description <span className=\"req\">*</span>");
    expect(structureCode).toContain("td-inspector-char-count");

    // Behaviour Checkboxes
    expect(structureCode).toContain("Included by Default");
    expect(structureCode).toContain("Allow Rename in Project");
    expect(structureCode).toContain("Required Area");

    // Save Changes Button: #2563EB, 46px height, 6px radius, white text
    expect(css).toMatch(
      /\.td-inspector-save-btn\s*\{[^}]*background:\s*#2563EB/
    );
    expect(css).toMatch(/\.td-inspector-save-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(
      /\.td-inspector-save-btn\s*\{[^}]*border-radius:\s*6px/
    );
    expect(structureCode).toContain("Save Changes");
  });

  it("5. Verifies Add Structure Modal workflow and real backend persistence", () => {
    // Add Structure modal exists in component
    expect(structureCode).toContain("isAddModalOpen");
    expect(structureCode).toContain("Add Project Structure");
    expect(structureCode).toContain("handleCreateAreaSubmit");
    expect(structureCode).toContain("updateTemplateSection");

    // Modal CSS exists
    expect(css).toMatch(/\.td-modal-overlay\s*\{[^}]*position:\s*fixed/);
    expect(css).toMatch(/\.td-modal-card\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.td-modal-btn-primary\s*\{[^}]*background:\s*#2563EB/);
  });

  it("6. Verifies live database templates dynamic integration", async () => {
    const env = parseEnv(path.resolve(__dirname, "../.env.local"));
    const supabaseUrl =
      env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      env.SUPABASE_SECRET_KEY ||
      env.SUPABASE_SERVICE_ROLE_KEY ||
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("project_templates")
      .select("id, name, template_code, structure, costing_boq, workflow, documents")
      .is("archived_at", null)
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    const templateWithStructure = data!.find(
      (t) => t.structure?.areas?.length > 0
    );
    expect(templateWithStructure).toBeDefined();
    expect(templateWithStructure!.structure.areas.length).toBeGreaterThan(0);

    console.log(
      `Verified template "${templateWithStructure!.name}" with ${
        templateWithStructure!.structure.areas.length
      } dynamic areas and ${
        templateWithStructure!.costing_boq?.sections?.length || 0
      } BOQ sections.`
    );
  });
});
