import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Archived Templates Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const viewPath = path.resolve(__dirname, "../components/templates/archived/ArchivedTemplatesView.tsx");
  const popoverPath = path.resolve(__dirname, "../components/templates/archived/ArchivedFilterPopover.tsx");
  const modalPath = path.resolve(__dirname, "../components/templates/archived/ArchivedDeleteModal.tsx");
  const pagePath = path.resolve(__dirname, "../app/templates/page.tsx");
  const apiPath = path.resolve(__dirname, "../lib/api/templates.ts");
  const boqApiPath = path.resolve(__dirname, "../lib/api/boqs.ts");

  it("1. Verifies CSS contains all Figma design tokens for Archived Templates page", () => {
    const css = fs.readFileSync(cssPath, "utf8");

    // Frame 2147225069 - Surface container
    expect(css).toContain(".archived-content-card");
    expect(css).toContain("rgba(255, 255, 255, 0.6)");
    expect(css).toContain("backdrop-filter: blur(8px)");
    expect(css).toContain("border-radius: 6px");

    // Frame 57 - Table header
    expect(css).toContain(".archived-table-header-row");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain("height: 36px");
    expect(css).toContain("border-radius: 8px");
    expect(css).toContain("text-transform: uppercase");

    // Frame 59, 60 - Table rows
    expect(css).toContain(".archived-table-row");
    expect(css).toContain("border-bottom: 1px solid #EBEBEB");

    // Column dimensions from Figma
    expect(css).toContain(".col-name");
    expect(css).toContain("width: 349px");
    expect(css).toContain(".col-cat");
    expect(css).toContain("width: 167px");
    expect(css).toContain(".col-type");
    expect(css).toContain("width: 171px");
    expect(css).toContain(".col-ver");
    expect(css).toContain("width: 99px");
    expect(css).toContain(".col-user");
    expect(css).toContain("width: 181px");
    expect(css).toContain(".col-date");
    expect(css).toContain("width: 154px");
    expect(css).toContain(".col-used");
    expect(css).toContain("width: 106px");
    expect(css).toContain(".col-act");
    expect(css).toContain("width: 64px");

    // Type pills: Frame 2147225014 in Figma
    expect(css).toContain(".archived-type-pill.type-boq");
    expect(css).toContain("rgba(37, 99, 235, 0.12)");
    expect(css).toContain("#0085FF");

    expect(css).toContain(".archived-type-pill.type-project");
    expect(css).toContain("rgba(83, 58, 253, 0.1)");
    expect(css).toContain("#533AFD");

    // Frame 76 - Toolbar Search Box (324px x 46px, glassmorphic)
    expect(css).toContain(".archived-search-box");
    expect(css).toContain("width: 324px");
    expect(css).toContain("height: 46px");
    expect(css).toContain("rgba(255, 255, 255, 0.36)");
    expect(css).toContain("backdrop-filter: blur(20.4px)");
    expect(css).toContain("border-radius: 8px");

    // Search icon badge: Frame 70 (36px x 36px white radius 6px)
    expect(css).toContain(".archived-search-icon-badge");
    expect(css).toContain("width: 36px");
    expect(css).toContain("height: 36px");
    expect(css).toContain("border-radius: 6px");

    // Filter button: Buttons (102px x 46px)
    expect(css).toContain(".archived-filter-btn");
    expect(css).toContain("width: 102px");
    expect(css).toContain("height: 46px");
    expect(css).toContain("border: 1px solid #E2E8F0");
    expect(css).toContain("border-radius: 6px");

    // View toggle: Buttons (86px x 46px)
    expect(css).toContain(".archived-view-toggle-wrap");
    expect(css).toContain("width: 86px");
    expect(css).toContain("height: 46px");
    expect(css).toContain("border: 1px solid #E2E8F0");
    expect(css).toContain(".archived-view-btn.active");
    expect(css).toContain("background: #EFF6FF");
    expect(css).toContain("color: #2563EB");

    // Pagination bar: Frame 2147225166 in Figma
    expect(css).toContain(".archived-pagination-bar");
    expect(css).toContain("height: 50px");
    expect(css).toContain(".archived-pagination-total");
    expect(css).toContain(".archived-page-num-btn");
    expect(css).toContain("width: 34px");
    expect(css).toContain("height: 34px");
    expect(css).toContain(".archived-page-num-btn.active");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain("border: 1px solid #2563EB");
  });

  it("2. Verifies ArchivedTemplatesView implements all 8 Figma table columns and row details", () => {
    const viewSource = fs.readFileSync(viewPath, "utf8");

    // All 8 columns in order
    expect(viewSource).toContain("TEMPLATE NAME");
    expect(viewSource).toContain("CATEGORY");
    expect(viewSource).toContain("TEMPLATE TYPE");
    expect(viewSource).toContain("VERSION");
    expect(viewSource).toContain("ARCHIVED BY");
    expect(viewSource).toContain("ARCHIVED ON");
    expect(viewSource).toContain("USED IN");
    expect(viewSource).toContain("ACTIONS");

    // Cells markup
    expect(viewSource).toContain("archived-thumb-wrap");
    expect(viewSource).toContain("archived-item-title");
    expect(viewSource).toContain("archived-item-desc");
    expect(viewSource).toContain("archived-cat-primary");
    expect(viewSource).toContain("archived-cat-secondary");
    expect(viewSource).toContain("archived-type-pill");
    expect(viewSource).toContain("archived-ver-text");
    expect(viewSource).toContain("archived-user-avatar");
    expect(viewSource).toContain("archived-user-name");
    expect(viewSource).toContain("archived-user-role");
    expect(viewSource).toContain("archived-date-primary");
    expect(viewSource).toContain("archived-date-secondary");
    expect(viewSource).toContain("archived-used-count");
    expect(viewSource).toContain("Projects");

    // Action menu items
    expect(viewSource).toContain("Restore to Library");
    expect(viewSource).toContain("View Details");
    expect(viewSource).toContain("Delete Permanently");

    // Pagination text
    expect(viewSource).toContain("Total Archived Templates:");
    expect(viewSource).toContain("Show per Page:");
  });

  it("3. Verifies Filter Popover supports category, type, and sort filters with reset and apply", () => {
    const popoverSource = fs.readFileSync(popoverPath, "utf8");

    expect(popoverSource).toContain("Filter Archived");
    expect(popoverSource).toContain("Template Type");
    expect(popoverSource).toContain("Category");
    expect(popoverSource).toContain("Sort By");
    expect(popoverSource).toContain("archived-filter-btn-reset");
    expect(popoverSource).toContain("archived-filter-btn-apply");
  });

  it("4. Verifies Delete Modal provides clear confirmation before permanent deletion", () => {
    const modalSource = fs.readFileSync(modalPath, "utf8");

    expect(modalSource).toContain("Delete Template Permanently");
    expect(modalSource).toContain("This action is permanent and cannot be reversed.");
    expect(modalSource).toContain("archived-modal-btn-cancel");
    expect(modalSource).toContain("archived-modal-btn-danger");
  });

  it("5. Verifies app/templates/page.tsx integrates ArchivedTemplatesView with real APIs and route syncing", () => {
    const pageSource = fs.readFileSync(pagePath, "utf8");

    expect(pageSource).toContain("ArchivedTemplatesView");
    expect(pageSource).toContain("ArchivedFilterPopover");
    expect(pageSource).toContain("listArchivedTemplates");
    expect(pageSource).toContain("restoreProjectTemplate");
    expect(pageSource).toContain("restoreBoqTemplate");
    expect(pageSource).toContain("deleteProjectTemplatePermanently");
    expect(pageSource).toContain("deleteBoqTemplate");
    expect(pageSource).toContain("router.push(\"/templates?tab=archived\")");
    expect(pageSource).toContain("Search Archived template by name…");
  });

  it("6. Verifies API functions exist in lib/api/templates.ts and lib/api/boqs.ts", () => {
    const apiSource = fs.readFileSync(apiPath, "utf8");
    const boqApiSource = fs.readFileSync(boqApiPath, "utf8");

    expect(apiSource).toContain("export async function listArchivedTemplates");
    expect(apiSource).toContain("export async function restoreProjectTemplate");
    expect(apiSource).toContain("export async function deleteProjectTemplatePermanently");

    expect(boqApiSource).toContain("export async function restoreBoqTemplate");
    expect(boqApiSource).toContain("export async function deleteBoqTemplate");
  });

  it("7. Verifies redirect pages exist for direct URL navigation", () => {
    const directArchived = fs.existsSync(path.resolve(__dirname, "../app/templates/archived/page.tsx"));
    const directProjectArchived = fs.existsSync(path.resolve(__dirname, "../app/templates/project-templates/archived/page.tsx"));

    expect(directArchived).toBe(true);
    expect(directProjectArchived).toBe(true);
  });
});
