import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard Documents — Folder Grid View & Card Open Folder View (Figma Parity)", () => {
    const cssPath = join(process.cwd(), "app", "documents", "documents-redesign.css");
    const viewPath = join(process.cwd(), "components", "documents", "DocumentsView.tsx");
    const folderListPath = join(process.cwd(), "components", "documents", "FolderList.tsx");
    const docListPath = join(process.cwd(), "components", "documents", "DocumentList.tsx");
    const iconPath = join(process.cwd(), "components", "documents", "FolderFileIcon.tsx");

    it("verifies documents-redesign.css exists and defines card grid tokens matching Figma", () => {
        expect(existsSync(cssPath)).toBe(true);
        const css = readFileSync(cssPath, "utf-8");

        // Container alignment & zero left gap
        expect(css).toContain(".doc-main-container");
        expect(css).toContain("margin: 0 !important;");
        expect(css).toContain("width: 100% !important;");

        // 4-column responsive grid matching Frame 2147225174
        expect(css).toContain(".doc-grid-container");
        expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
        expect(css).toContain("gap: 12px;");

        // Card surface matching Frame 93 (20px padding, 16px gap, 6px radius, rgba background)
        expect(css).toContain(".doc-grid-card");
        expect(css).toContain(".folder-grid-card");
        expect(css).toContain("background: rgba(255, 255, 255, 0.6);");
        expect(css).toContain("border-radius: 6px;");
        expect(css).toContain("padding: 20px;");
        expect(css).toContain("gap: 16px;");
        expect(css).toContain("min-height: 138px;");

        // Card hover state
        expect(css).toContain(".doc-grid-card:hover");
        expect(css).toContain("background: #FFFFFF;");
        expect(css).toContain("border-color: rgba(37, 99, 235, 0.3);");

        // Card top with 40px height for icon badge & 3-dot action
        expect(css).toContain(".doc-grid-card-top");
        expect(css).toContain("height: 40px;");

        // Row 1 & Row 2 layout in cards
        expect(css).toContain(".doc-grid-row-1");
        expect(css).toContain(".doc-grid-row-2");
        expect(css).toContain(".doc-grid-name");
        expect(css).toContain(".doc-grid-date");
        expect(css).toContain(".doc-grid-meta");
        expect(css).toContain(".doc-grid-size");
        expect(css).toContain(".doc-grid-date-size");

        // Transparent container in grid mode to avoid nested card background
        expect(css).toContain(".doc-table-card.grid-mode");

        // Responsive breakpoints
        expect(css).toContain("@media (max-width: 1200px)");
        expect(css).toContain("@media (max-width: 860px)");
        expect(css).toContain("@media (max-width: 540px)");
    });

    it("verifies FolderList card view renders Frame 93 structure with Name, Date, Items, and Size", () => {
        expect(existsSync(folderListPath)).toBe(true);
        const content = readFileSync(folderListPath, "utf-8");

        // Grid container and card classes
        expect(content).toContain("doc-grid-container");
        expect(content).toContain("folder-grid-view");
        expect(content).toContain("doc-grid-card");
        expect(content).toContain("folder-grid-card");

        // Interaction: click anywhere on card opens folder
        expect(content).toContain("onClick={() => onOpen(folder)}");

        // Icon badge & actions
        expect(content).toContain('<FolderFileIcon type="folder"');
        expect(content).toContain("doc-action-btn");
        expect(content).toContain("doc-menu-popover");

        // Row 1: Name + Date
        expect(content).toContain("doc-grid-row-1");
        expect(content).toContain("doc-grid-name");
        expect(content).toContain("doc-grid-date");
        expect(content).toContain("formatDate(folder.updatedAt)");

        // Row 2: Items + Size
        expect(content).toContain("doc-grid-row-2");
        expect(content).toContain("doc-grid-meta");
        expect(content).toContain("doc-grid-size");
        expect(content).toContain("formatSize(folder.sizeBytes)");
    });

    it("verifies DocumentList card view renders Frame 93 structure with Name, Project, and Date | Size", () => {
        expect(existsSync(docListPath)).toBe(true);
        const content = readFileSync(docListPath, "utf-8");

        // Grid container and card classes
        expect(content).toContain("doc-grid-container");
        expect(content).toContain("folder-grid-card");

        // Interaction: click on card views document
        expect(content).toContain("onClick={() => void viewDocument(doc)}");

        // File icon badge & actions
        expect(content).toContain('<FolderFileIcon');
        expect(content).toContain('type="file"');
        expect(content).toContain("doc-action-btn");
        expect(content).toContain("doc-menu-popover");

        // Row 1: File name
        expect(content).toContain("doc-grid-name");

        // Row 2: Project + Date | Size
        expect(content).toContain("doc-grid-row-2");
        expect(content).toContain("doc-grid-meta");
        expect(content).toContain("doc-grid-date-size");
        expect(content).toContain("formatDate(doc.updatedAt)");
        expect(content).toContain("formatSize(doc.sizeBytes)");
    });

    it("verifies DocumentsView provides view toggling, card-mode container, and folder summary card", () => {
        expect(existsSync(viewPath)).toBe(true);
        const content = readFileSync(viewPath, "utf-8");

        // View toggle buttons
        expect(content).toContain("doc-view-toggle");
        expect(content).toContain('onClick={() => setView("list")}');
        expect(content).toContain('onClick={() => setView("grid")}');

        // Card mode container class
        expect(content).toContain('grid-mode');

        // Selected folder summary card (Table Cell 82px)
        expect(content).toContain("doc-folder-summary-card");
        expect(content).toContain("doc-folder-summary-badge");
        expect(content).toContain("doc-folder-summary-info");
        expect(content).toContain("doc-folder-summary-name");
        expect(content).toContain("doc-folder-summary-meta");
        expect(content).toContain("doc-folder-summary-date");

        // Breadcrumbs hierarchy
        expect(content).toContain("All Folders");
        expect(content).toContain("doc-breadcrumbs");
    });
});
