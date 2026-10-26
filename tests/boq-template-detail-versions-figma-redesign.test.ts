import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BOQ Template Detail → Versions Tab Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/boq-versions-redesign.css");
  const componentPath = path.resolve(
    __dirname,
    "../components/templates/boq/BoqTemplateVersions.tsx"
  );
  const pagePath = path.resolve(
    __dirname,
    "../app/templates/boq/[id]/page.tsx"
  );
  const layoutPath = path.resolve(__dirname, "../app/layout.tsx");
  const apiRoutePath = path.resolve(
    __dirname,
    "../app/api/v1/[...path]/route.ts"
  );
  const apiClientPath = path.resolve(__dirname, "../lib/api/boqs.ts");

  it("1. Verifies that all required files exist", () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    expect(fs.existsSync(componentPath)).toBe(true);
    expect(fs.existsSync(pagePath)).toBe(true);
    expect(fs.existsSync(layoutPath)).toBe(true);
    expect(fs.existsSync(apiRoutePath)).toBe(true);
    expect(fs.existsSync(apiClientPath)).toBe(true);
  });

  it("2. Verifies root layout imports the BOQ versions redesign stylesheet", () => {
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain("./boq-versions-redesign.css");
  });

  it("3. Verifies page.tsx integrates BoqTemplateVersions for the Versions tab", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain('import BoqTemplateVersions from "@/components/templates/boq/BoqTemplateVersions";');
    expect(pageContent).toContain('{activeTab === "Versions" && (');
    expect(pageContent).toContain("<BoqTemplateVersions");
  });

  it("4. Verifies CSS specifications for Versions Subheader & Search Toolbar (Frame 2147225198 & Frame 76)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-versions-subheader");
    expect(css).toContain(".boq-versions-title");
    expect(css).toContain(".boq-versions-desc");
    expect(css).toContain(".boq-versions-search-box");
    expect(css).toContain("rgba(255, 255, 255, 0.36)");
    expect(css).toContain("backdrop-filter: blur(20.4px)");
    expect(css).toContain("width: 260px");
    expect(css).toContain("height: 46px");
    expect(css).toContain(".boq-versions-search-icon-box");
    expect(css).toContain("width: 36px");
    expect(css).toContain("height: 36px");
    expect(css).toContain(".boq-versions-filter-btn");
    expect(css).toContain("width: 102px");
    expect(css).toContain(".boq-versions-new-btn");
    expect(css).toContain("width: 132px");
    expect(css).toContain("background: #2563EB");
    expect(css).toContain(".boq-versions-icon-btn");
    expect(css).toContain("width: 48px");
  });

  it("5. Verifies CSS specifications for 4 Summary Metric KPI Cards (Frame 2147225138)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-versions-kpi-grid");
    expect(css).toContain(".boq-versions-kpi-card");
    expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
    expect(css).toContain("height: 116px");
    expect(css).toContain("padding: 20px");
    expect(css).toContain("gap: 8px");
    expect(css).toContain(".boq-versions-kpi-label");
    expect(css).toContain(".boq-versions-kpi-val");
    expect(css).toContain(".boq-versions-kpi-sub");
  });

  it("6. Verifies CSS specifications for Filter Tabs Bar & My Changes (Frame 2147225239)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-versions-nav-row");
    expect(css).toContain(".boq-versions-tabs");
    expect(css).toContain("width: 567px");
    expect(css).toContain("height: 46px");
    expect(css).toContain(".boq-versions-tab-pill");
    expect(css).toContain(".boq-versions-tab-pill.active");
    expect(css).toContain("background: #EFF6FF");
    expect(css).toContain("color: #2563EB");
    expect(css).toContain(".boq-versions-mychanges-toggle");
  });

  it("7. Verifies CSS specifications for Full-Width Table Card & Inner Table Surface (Frame 2147225085 / 2147225072)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-versions-history-card");
    expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
    expect(css).toContain("max-width: 1326px");
    expect(css).toContain("min-height: 548px");
    expect(css).toContain("padding: 20px");
    expect(css).toContain("border-radius: 6px");
    expect(css).toContain("background: #F9FBFD"); // Inner table surface
  });

  it("8. Verifies CSS specifications for Table Header (Frame 57: #E4ECFB, 36px high, radius 8px, 10 columns)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-versions-thead");
    expect(css).toContain("height: 36px");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain("border-radius: 8px");
    expect(css).toContain(".boq-vcol-version { width: 86px; }");
    expect(css).toContain(".boq-vcol-status { width: 162px; }");
    expect(css).toContain(".boq-vcol-summary { width: 259px; }");
    expect(css).toContain(".boq-vcol-createdby { width: 150px; }");
    expect(css).toContain(".boq-vcol-publishedby { width: 150px; }");
    expect(css).toContain(".boq-vcol-created { width: 108px; }");
    expect(css).toContain(".boq-vcol-published { width: 108px; }");
    expect(css).toContain(".boq-vcol-projects { width: 94px; }");
    expect(css).toContain(".boq-vcol-changes { width: 108px; }");
    expect(css).toContain(".boq-vcol-actions { width: 64px;");
  });

  it("9. Verifies CSS specifications for Table Rows, 9999px Badges, and Current Row Highlight (Frame 59, 60, 61)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-versions-row");
    expect(css).toContain("height: 56px");
    expect(css).toContain("border-bottom: 1px solid #EBEBEB");
    expect(css).toContain("background: rgba(37, 99, 235, 0.05)");
    expect(css).toContain(".boq-ver-badge");
    expect(css).toContain("border-radius: 9999px");
    expect(css).toContain(".boq-ver-badge.published");
    expect(css).toContain("rgba(22, 163, 74, 0.12)");
    expect(css).toContain(".boq-ver-badge.draft");
    expect(css).toContain("rgba(37, 99, 235, 0.12)");
    expect(css).toContain(".boq-ver-badge.superseded");
    expect(css).toContain("rgba(250, 176, 0, 0.1)");
    expect(css).toContain(".boq-ver-badge.archived");
    expect(css).toContain("rgba(100, 116, 139, 0.12)");
    expect(css).toContain(".boq-ver-changes-pill.high");
    expect(css).toContain("rgba(220, 38, 38, 0.1)");
    expect(css).toContain(".boq-ver-changes-pill.medium");
    expect(css).toContain("rgba(250, 176, 0, 0.1)");
  });

  it("10. Verifies CSS specifications for Footer & Pagination (Frame 2147225166)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-versions-pagination");
    expect(css).toContain(".boq-versions-total-text");
    expect(css).toContain(".boq-versions-page-controls");
    expect(css).toContain(".boq-versions-page-btn");
    expect(css).toContain("width: 34px");
    expect(css).toContain("height: 34px");
    expect(css).toContain("border: 1px solid #EBEBEB");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain("border: 1px solid #2563EB");
    expect(css).toContain("color: #2563EB");
    expect(css).toContain(".boq-versions-per-page");
    expect(css).toContain(".boq-versions-select");
    expect(css).toContain("width: 83px");
    expect(css).toContain("height: 34px");
  });

  it("11. Verifies CSS specifications for Slide-Over Drawer & Side Panel (Frame 2147225086, 2147225028)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-versions-drawer-content");
    expect(css).toContain(".boq-versions-about-header");
    expect(css).toContain(".boq-versions-card");
    expect(css).toContain(".boq-versions-kv-list");
    expect(css).toContain(".boq-versions-timeline-dot");
    expect(css).toContain("background: #16A34A");
    expect(css).toContain(".boq-versions-timeline-dot.purple");
    expect(css).toContain("background: #533AFD");
    expect(css).toContain(".boq-versions-detail-btn");
  });

  it("12. Verifies API client and route support for versions", () => {
    const apiRoute = fs.readFileSync(apiRoutePath, "utf-8");
    expect(apiRoute).toContain("boqTemplateVersionsMatch");
    expect(apiRoute).toContain("getBoqTemplateVersions");

    const apiClient = fs.readFileSync(apiClientPath, "utf-8");
    expect(apiClient).toContain("export async function getBoqTemplateVersions");
  });

  it("13. Verifies BoqVersionInfoModal component existence and structure", () => {
    const modalPath = path.resolve(__dirname, "../components/templates/boq/BoqVersionInfoModal.tsx");
    expect(fs.existsSync(modalPath)).toBe(true);
    const content = fs.readFileSync(modalPath, "utf-8");
    expect(content).toContain("export default function BoqVersionInfoModal");
    expect(content).toContain("getBoqTemplateVersionDetail");
    expect(content).toContain("Snapshot Summary");
    expect(content).toContain("Usage");
    expect(content).toContain("Status & Approval History");
    expect(content).toContain("Metadata & Attribution");
    expect(content).toContain("handleExportJson");
    expect(content).toContain("handleExportCsv");
  });

  it("14. Verifies CSS specifications for View Version Info experience (.boq-verinfo-*)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-verinfo-overlay");
    expect(css).toContain("backdrop-filter: blur(6px)");
    expect(css).toContain(".boq-verinfo-card");
    expect(css).toContain("max-width: 980px");
    expect(css).toContain(".boq-verinfo-header");
    expect(css).toContain(".boq-verinfo-ver-tag");
    expect(css).toContain(".boq-verinfo-toolbar");
    expect(css).toContain(".boq-verinfo-tool-btn");
    expect(css).toContain(".boq-verinfo-meta-grid");
    expect(css).toContain(".boq-verinfo-timeline");
    expect(css).toContain(".boq-verinfo-timeline-dot");
    expect(css).toContain(".boq-verinfo-card-shadow");
    expect(css).toContain(".boq-verinfo-footer");
  });

  it("15. Verifies API endpoint and client support for single version details", () => {
    const apiRoute = fs.readFileSync(apiRoutePath, "utf-8");
    expect(apiRoute).toContain("boqTemplateVersionDetailMatch");
    expect(apiRoute).toContain("getBoqTemplateVersionDetail");

    const apiClient = fs.readFileSync(apiClientPath, "utf-8");
    expect(apiClient).toContain("export async function getBoqTemplateVersionDetail");
  });

  it("16. Verifies that all 10 configuration snapshot metrics are dynamically handled", () => {
    const modalContent = fs.readFileSync(
      path.resolve(__dirname, "../components/templates/boq/BoqVersionInfoModal.tsx"),
      "utf-8"
    );
    expect(modalContent).toContain("snap.areas");
    expect(modalContent).toContain("snap.rooms");
    expect(modalContent).toContain("snap.sections");
    expect(modalContent).toContain("snap.items");
    expect(modalContent).toContain("snap.stages");
    expect(modalContent).toContain("snap.tasks");
    expect(modalContent).toContain("snap.milestones");
    expect(modalContent).toContain("snap.approvals");
    expect(modalContent).toContain("snap.rules");
    expect(modalContent).toContain("snap.documents");
  });

  it("17. Verifies integration of BoqVersionInfoModal and URL version sync in BoqTemplateVersions", () => {
    const verComponent = fs.readFileSync(componentPath, "utf-8");
    expect(verComponent).toContain('import BoqVersionInfoModal from "./BoqVersionInfoModal";');
    expect(verComponent).toContain("<BoqVersionInfoModal");
    expect(verComponent).toContain("getVersionSnapshot");
    expect(verComponent).toContain("getVersionTimeline");
    expect(verComponent).toContain("onDoubleClick");
  });
});
