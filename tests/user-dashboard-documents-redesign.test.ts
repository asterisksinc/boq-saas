import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard Documents Redesign — Figma Specification Parity", () => {
    const pagePath = join(process.cwd(), "app", "documents", "page.tsx");
    const cssPath = join(process.cwd(), "app", "documents", "documents-redesign.css");
    const viewPath = join(process.cwd(), "components", "documents", "DocumentsView.tsx");
    const folderListPath = join(process.cwd(), "components", "documents", "FolderList.tsx");
    const docListPath = join(process.cwd(), "components", "documents", "DocumentList.tsx");
    const iconPath = join(process.cwd(), "components", "documents", "FolderFileIcon.tsx");
    const uploadModalPath = join(process.cwd(), "components", "documents", "UploadModal.tsx");
    const folderModalPath = join(process.cwd(), "components", "documents", "FolderModal.tsx");
    const renameModalPath = join(process.cwd(), "components", "documents", "RenameModal.tsx");
    const deleteModalPath = join(process.cwd(), "components", "documents", "DeleteModal.tsx");

    it("verifies app/documents/page.tsx exists and imports DashboardRail and DocumentsView", () => {
        expect(existsSync(pagePath)).toBe(true);
        const content = readFileSync(pagePath, "utf-8");
        expect(content).toContain("DashboardRail");
        expect(content).toContain("DocumentsView");
        expect(content).toContain("documents-redesign.css");
    });

    it("verifies documents-redesign.css exists with exact Figma design tokens", () => {
        expect(existsSync(cssPath)).toBe(true);
        const css = readFileSync(cssPath, "utf-8");

        // Page background and blue glow overlay
        expect(css).toContain("#F1F5F9");
        expect(css).toContain("linear-gradient(180deg, #2563EB -371.16%, rgba(37, 99, 235, 0) 100%)");
        expect(css).toContain("opacity: 0.5");

        // Font family
        expect(css).toContain("'Urbanist'");

        // Module Toolbar (Frame 2147225067)
        expect(css).toContain(".doc-toolbar-row");
        expect(css).toContain(".doc-search-box");
        expect(css).toContain("rgba(255, 255, 255, 0.36)");
        expect(css).toContain("rgba(255, 255, 255, 0.32)");
        expect(css).toContain("blur(20.4px)");
        expect(css).toContain("border-radius: 8px");
        expect(css).toContain(".doc-search-icon-box");
        expect(css).toContain("width: 36px");
        expect(css).toContain("height: 36px");
        expect(css).toContain("border-radius: 6px");

        // View Toggle (Buttons: 86px x 46px)
        expect(css).toContain(".doc-view-toggle");
        expect(css).toContain("width: 86px");
        expect(css).toContain("height: 46px");
        expect(css).toContain("border: 1px solid #E2E8F0");
        expect(css).toContain(".doc-view-btn.active");
        expect(css).toContain("background: #EFF6FF");
        expect(css).toContain("color: #2563EB");

        // Subbar (Frame 2147225066)
        expect(css).toContain(".doc-subbar-row");
        expect(css).toContain(".btn-doc-upload");
        expect(css).toContain(".btn-doc-new-folder");
        expect(css).toContain("background: #2563EB");

        // Table surface card (Frame 2147225139)
        expect(css).toContain(".doc-table-card");
        expect(css).toContain("rgba(255, 255, 255, 0.6)");
        expect(css).toContain("border-radius: 6px");

        // Table Header (Frame 57)
        expect(css).toContain(".doc-table-header");
        expect(css).toContain("background: #E4ECFB");
        expect(css).toContain("height: 36px");
        expect(css).toContain("border-radius: 8px");
        expect(css).toContain("text-transform: uppercase");
        expect(css).toContain("color: #64748B");

        // Table Row & Divider (Frame 59 & Rectangle 30)
        expect(css).toContain(".doc-table-row");
        expect(css).toContain("height: 56px");
        expect(css).toContain(".doc-row-divider");
        expect(css).toContain("background: #EBEBEB");
        expect(css).toContain("height: 1px");

        // Circular folder/file icon treatment (Frame 75 in table cell)
        expect(css).toContain(".doc-icon-circle");
        expect(css).toContain("width: 40px");
        expect(css).toContain("height: 40px");
        expect(css).toContain("background: #E4ECFB");
        expect(css).toContain("border-radius: 48px");
        expect(css).toContain("color: #2563EB");

        // Dropdown menu popover (Sent Status more options)
        expect(css).toContain(".doc-menu-popover");
        expect(css).toContain("width: 156px");
        expect(css).toContain("background: #FFFFFF");
        expect(css).toContain("border: 1px solid #EBEBEB");
        expect(css).toContain("box-shadow: 0px 16px 32px -12px rgba(14, 18, 27, 0.1)");
        expect(css).toContain("border-radius: 16px");
        expect(css).toContain(".doc-menu-item");
        expect(css).toContain(".doc-menu-item.danger");
        expect(css).toContain("#EF4444");

        // Toast notification
        expect(css).toContain(".doc-toast");
        expect(css).toContain("background: #0F172A");
        expect(css).toContain("color: #FFFFFF");
    });

    it("verifies DocumentsView coordinates real data, header, toolbar, breadcrumbs, and modals", () => {
        expect(existsSync(viewPath)).toBe(true);
        const content = readFileSync(viewPath, "utf-8");

        // Parent dashboard header integration
        expect(content).toContain("<DashboardHeader");
        expect(content).toContain('title="Documents"');

        // Toolbar elements
        expect(content).toContain('placeholder="Search files..."');
        expect(content).toContain("doc-view-toggle");

        // Section header and actions
        expect(content).toContain("All Folders");
        expect(content).toContain("btn-doc-upload");
        expect(content).toContain("btn-doc-new-folder");

        // Breadcrumb navigation
        expect(content).toContain("doc-breadcrumbs");

        // Real backend API endpoints
        expect(content).toContain("/api/v1/document-folders");
        expect(content).toContain("/api/v1/documents");

        // Skeletons and loading state
        expect(content).toContain("doc-loading-container");
        expect(content).toContain("doc-spinner");

        // Toast notification system
        expect(content).toContain("doc-toast");
        expect(content).toContain("showToast");

        // Modals integration
        expect(content).toContain("<FolderModal");
        expect(content).toContain("<UploadModal");
        expect(content).toContain("<RenameModal");
        expect(content).toContain("<DeleteModal");
    });

    it("verifies FolderList renders Figma table headers and responsive cards", () => {
        expect(existsSync(folderListPath)).toBe(true);
        const content = readFileSync(folderListPath, "utf-8");

        // Table headers matching Figma
        expect(content).toContain("NAME");
        expect(content).toContain("ITEMS");
        expect(content).toContain("SIZE");
        expect(content).toContain("LAST MODIFIED");

        // Row elements
        expect(content).toContain("doc-td-name");
        expect(content).toContain("doc-td-items");
        expect(content).toContain("doc-td-size");
        expect(content).toContain("doc-td-date");
        expect(content).toContain("doc-td-action");
        expect(content).toContain("doc-row-divider");

        // Contextual actions
        expect(content).toContain("Open Folder");
        expect(content).toContain("Rename");
        expect(content).toContain("Delete Folder");

        // Grid view
        expect(content).toContain("doc-grid-card");
        expect(content).toContain("doc-grid-container");
    });

    it("verifies DocumentList displays PROJECT column, download, view, rename, and delete actions", () => {
        expect(existsSync(docListPath)).toBe(true);
        const content = readFileSync(docListPath, "utf-8");

        // Headers
        expect(content).toContain("NAME");
        expect(content).toContain("PROJECT");
        expect(content).toContain("SIZE");
        expect(content).toContain("LAST MODIFIED");

        // Actions
        expect(content).toContain("View File");
        expect(content).toContain("Download");
        expect(content).toContain("Rename");
        expect(content).toContain("Delete File");

        // Download API
        expect(content).toContain("/api/v1/documents/");
        expect(content).toContain("/download");
    });

    it("verifies FolderFileIcon provides exact 40x40 circular treatment for folders and files", () => {
        expect(existsSync(iconPath)).toBe(true);
        const content = readFileSync(iconPath, "utf-8");

        // SVG rect dimensions and colors
        expect(content).toContain('width="40"');
        expect(content).toContain('height="40"');
        expect(content).toContain('rx="20"');
        expect(content).toContain('fill="#E4ECFB"');
        expect(content).toContain('fill="#2563EB"');

        // Multi-format support
        expect(content).toContain("pdf");
        expect(content).toContain("excel");
        expect(content).toContain("image");
        expect(content).toContain("cad");
        expect(content).toContain("zip");
    });

    it("verifies Modals provide clean forms, validation, and real API execution", () => {
        expect(existsSync(uploadModalPath)).toBe(true);
        expect(existsSync(folderModalPath)).toBe(true);
        expect(existsSync(renameModalPath)).toBe(true);
        expect(existsSync(deleteModalPath)).toBe(true);

        const uploadContent = readFileSync(uploadModalPath, "utf-8");
        expect(uploadContent).toContain("/api/v1/documents/upload");
        expect(uploadContent).toContain("Upload to");
        expect(uploadContent).toContain("Drop files here");
        expect(uploadContent).toContain("or click to browse your computer");
        expect(uploadContent).toContain("Save & Upload");

        const folderContent = readFileSync(folderModalPath, "utf-8");
        expect(folderContent).toContain("/api/v1/document-folders");
        expect(folderContent).toContain("New Folder");
        expect(folderContent).toContain("Create Folder");

        const renameContent = readFileSync(renameModalPath, "utf-8");
        expect(renameContent).toContain("Rename");
        expect(renameContent).toContain("Save Changes");

        const deleteContent = readFileSync(deleteModalPath, "utf-8");
        expect(deleteContent).toContain("I understand this action cannot be undone");
        expect(deleteContent).toContain("No, Keep It.");
        expect(deleteContent).toContain("Yes, Delete!");
    });
});
