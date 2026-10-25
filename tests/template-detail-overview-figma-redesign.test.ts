import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Project Template Detail → Overview Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const globalsCssPath = path.resolve(__dirname, "../app/globals.css");
  const infoCardPath = path.resolve(__dirname, "../components/templates/detail/TemplateInfoCard.tsx");
  const tabsPath = path.resolve(__dirname, "../components/templates/detail/TemplateDetailTabs.tsx");
  const overviewPath = path.resolve(__dirname, "../components/templates/detail/TemplateOverview.tsx");
  const detailPagePath = path.resolve(__dirname, "../app/templates/[id]/page.tsx");

  const css = fs.readFileSync(cssPath, "utf8");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf8");
  const infoCardCode = fs.readFileSync(infoCardPath, "utf8");
  const tabsCode = fs.readFileSync(tabsPath, "utf8");
  const overviewCode = fs.readFileSync(overviewPath, "utf8");
  const detailPageCode = fs.readFileSync(detailPagePath, "utf8");

  it("1. Verifies fluid container layout and eliminates right-side whitespace", () => {
    // Shell should be 100% responsive without hardcoded fixed canvas
    expect(css).toMatch(/\.td-page-shell\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.td-page-shell\s*\{[^}]*max-width:\s*100%/);
    expect(css).not.toMatch(/\.td-page-shell\s*\{[^}]*width:\s*1440px/);

    // Page shell should exist in page.tsx
    expect(detailPageCode).toContain('className="td-page-shell"');
  });

  it("2. Verifies Back Navigation link matches Figma Frame 2147225070", () => {
    // Frame 2147225070: Urbanist 16px 500 #475569 with back arrow
    expect(css).toMatch(/\.td-back-link\s*\{[^}]*font-size:\s*16px/);
    expect(css).toMatch(/\.td-back-link\s*\{[^}]*color:\s*#475569/);
    expect(css).toMatch(/\.td-back-link\s*\{[^}]*display:\s*inline-flex/);

    expect(detailPageCode).toContain('className="td-back-link"');
    expect(detailPageCode).toContain("Project Templates");
  });

  it("3. Verifies Outer Translucent Panel and Inner White Card tokens", () => {
    // Outer panel: rgba(255, 255, 255, 0.6), border-radius: 6px, padding: 20px, gap: 20px
    expect(css).toMatch(/\.td-outer-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-outer-panel\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-outer-panel\s*\{[^}]*padding:\s*20px/);

    // Inner card: #FFFFFF, box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06), border-radius: 14px, padding: 16px
    expect(css).toMatch(/\.td-inner-card\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.td-inner-card\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);
    expect(css).toMatch(/\.td-inner-card\s*\{[^}]*border-radius:\s*14px/);
    expect(css).toMatch(/\.td-inner-card\s*\{[^}]*padding:\s*16px/);
  });

  it("4. Verifies Template Information panel structure and metadata hierarchy", () => {
    // Section header
    expect(infoCardCode).toContain("TEMPLATE INFORMATION");
    expect(infoCardCode).toContain("td-outer-panel");
    expect(infoCardCode).toContain("td-inner-card");

    // 155px x 155px cover image with radius 4px
    expect(css).toMatch(/\.td-info-image-wrap\s*\{[^}]*width:\s*155px/);
    expect(css).toMatch(/\.td-info-image-wrap\s*\{[^}]*height:\s*155px/);
    expect(css).toMatch(/\.td-info-image-wrap\s*\{[^}]*border-radius:\s*4px/);

    // Metadata Row 1: Template Name, Template ID, Template Type
    expect(infoCardCode).toContain("Template Name");
    expect(infoCardCode).toContain("Template ID");
    expect(infoCardCode).toContain("Template Type");
    expect(infoCardCode).toContain("Project Template");

    // Metadata Row 2: Tag, Status, Type
    expect(infoCardCode).toContain("Tag");
    expect(infoCardCode).toContain("Status");
    expect(infoCardCode).toContain("Type");

    // Tag chip styling
    expect(css).toMatch(/\.td-tag-chip\s*\{[^}]*background:\s*rgba\(100,\s*116,\s*139,\s*0\.12\)/);
    expect(css).toMatch(/\.td-tag-chip\s*\{[^}]*border-radius:\s*9999px/);

    // Metadata Row 3: Description
    expect(infoCardCode).toContain("Description");
    expect(infoCardCode).toContain("td-info-desc");
  });

  it("5. Verifies Template Detail Tabs and Action controls (Tabbing)", () => {
    // Left pill nav: #FFFFFF, border: 1px solid #E2E8F0, border-radius: 6px, padding: 6px
    expect(css).toMatch(/\.td-tabs-pill-nav\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.td-tabs-pill-nav\s*\{[^}]*border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/\.td-tabs-pill-nav\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-tabs-pill-nav\s*\{[^}]*min-height:\s*46px/);

    // Active tab styling: #EFF6FF background, #2563EB text
    expect(css).toMatch(/\.td-tab-pill-btn\.active\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.td-tab-pill-btn\.active\s*\{[^}]*color:\s*#2563EB/);

    // Inactive tab styling: #475569
    expect(css).toMatch(/\.td-tab-pill-btn\s*\{[^}]*color:\s*#475569/);

    // Action buttons: Duplicate, Edit (48x46), Use Template (115x46 #2563EB)
    expect(css).toMatch(/\.td-action-icon-btn\s*\{[^}]*width:\s*48px/);
    expect(css).toMatch(/\.td-action-icon-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-primary-use-btn\s*\{[^}]*background:\s*#2563EB/);
    expect(css).toMatch(/\.td-primary-use-btn\s*\{[^}]*height:\s*46px/);

    expect(tabsCode).toContain("Use Template");
    expect(tabsCode).toContain("onDuplicate");
    expect(tabsCode).toContain("onEdit");
    expect(tabsCode).toContain("onUseTemplate");
  });

  it("6. Verifies Template Summary and Template Composition middle grid (Frame 2147225128)", () => {
    // Grid ratio: minmax(0, 3fr) minmax(280px, 1fr) with gap 16px
    expect(css).toMatch(/\.td-overview-top-row\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.td-overview-top-row\s*\{[^}]*gap:\s*16px/);

    // Template Summary contents
    expect(overviewCode).toContain("TEMPLATE SUMMARY");
    expect(overviewCode).toContain("Business Type");
    expect(overviewCode).toContain("Team");
    expect(overviewCode).toContain("Visibility");
    expect(overviewCode).toContain("Region");
    expect(overviewCode).toContain("Created On");
    expect(overviewCode).toContain("Last Updated");
    expect(overviewCode).toContain("Tags");
    expect(overviewCode).toContain("Last Viewed");

    // Template Composition contents (9 metrics)
    expect(overviewCode).toContain("TEMPLATE COMPOSITION");
    expect(overviewCode).toContain("Rooms");
    expect(overviewCode).toContain("BOQ Sections");
    expect(overviewCode).toContain("Items");
    expect(overviewCode).toContain("Milestones");
    expect(overviewCode).toContain("Documents");
    expect(overviewCode).toContain("Approval Stages");
    expect(overviewCode).toContain("Categories");
    expect(overviewCode).toContain("Payment Stages");
    expect(overviewCode).toContain("Teams Using");
  });

  it("7. Verifies Bottom Grid: Included Project Structure, Status & Governance, Usage Summary (Frame 2147225129)", () => {
    // Bottom 3-column grid
    expect(css).toMatch(/\.td-overview-bottom-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.td-overview-bottom-grid\s*\{[^}]*gap:\s*16px/);

    // Card 1: Included Project Structure
    expect(overviewCode).toContain("INCLUDED PROJECT STRUCTURE");
    expect(overviewCode).toContain("ROOMS (");
    expect(overviewCode).toContain("BOQ SECTIONS");
    expect(overviewCode).toContain("ITEMS");
    expect(css).toMatch(/\.td-structure-table-header\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-structure-table-header\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-structure-table-row\s*\{[^}]*height:\s*56px/);
    expect(css).toMatch(/\.td-structure-table-row\s*\{[^}]*border-bottom:\s*1px solid #EBEBEB/);

    // Card 2: Status & Governance
    expect(overviewCode).toContain("STATUS &amp; GOVERNANCE");
    expect(overviewCode).toContain("Published On");
    expect(overviewCode).toContain("Published by");
    expect(overviewCode).toContain("Next Review");
    expect(overviewCode).toContain("Template Health");
    expect(overviewCode).toContain("HEALTHY");
    expect(css).toMatch(/\.td-health-pill\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\)/);
    expect(css).toMatch(/\.td-health-pill\s*\{[^}]*color:\s*#16A34A/);

    // Card 3: Usage Summary
    expect(overviewCode).toContain("USAGE SUMMARY");
    expect(overviewCode).toContain("Total Uses");
    expect(overviewCode).toContain("Projects Created");
    expect(overviewCode).toContain("Last Used");
    expect(overviewCode).toContain("View Usage Analytics");
    expect(css).toMatch(/\.td-view-analytics-btn\s*\{[^}]*color:\s*#2563EB/);
  });

  it("8. Verifies Dynamic Binding and Responsive Breakpoints", () => {
    // Dynamic binding in overview
    expect(overviewCode).toContain("template.businessType");
    expect(overviewCode).toContain("template.team");
    expect(overviewCode).toContain("template.region");
    expect(overviewCode).toContain("template.visibility");
    expect(overviewCode).toContain("roomsCount");
    expect(overviewCode).toContain("boqSectionsCount");
    expect(overviewCode).toContain("itemsCount");

    // Responsive media queries
    expect(css).toContain("@media (max-width: 960px)");
    expect(css).toContain("@media (max-width: 768px)");
  });
});
