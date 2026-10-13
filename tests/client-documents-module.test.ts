import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { formatSize, formatDate } from "../components/documents/types";

describe("Client Documents Module — Screen Architecture & Reusable Component Hierarchy", () => {
    it("ensures Client Documents page exists and reuses DocumentsView with ClientDashboardRail", () => {
        const clientDocPath = join(process.cwd(), "app", "client", "documents", "page.tsx");
        expect(existsSync(clientDocPath)).toBe(true);

        const content = readFileSync(clientDocPath, "utf-8");
        expect(content).toContain("ClientDashboardRail");
        expect(content).toContain('current="/client/documents"');
        expect(content).toContain("DocumentsView");
        expect(content).toContain("isClient={true}");
        expect(content).toContain("Suspense");
    });

    it("ensures User Documents page reuses the exact same DocumentsView component with DashboardRail", () => {
        const userDocPath = join(process.cwd(), "app", "documents", "page.tsx");
        expect(existsSync(userDocPath)).toBe(true);

        const content = readFileSync(userDocPath, "utf-8");
        expect(content).toContain("DashboardRail");
        expect(content).toContain("DocumentsView");
        expect(content).toContain("isClient={false}");
        expect(content).toContain("Suspense");
    });

    it("verifies DocumentsView provides toolbar, breadcrumbs, modals, and list/grid toggles", () => {
        const viewPath = join(process.cwd(), "components", "documents", "DocumentsView.tsx");
        expect(existsSync(viewPath)).toBe(true);

        const content = readFileSync(viewPath, "utf-8");
        expect(content).toContain("DashboardHeader");
        expect(content).toContain('placeholder="Search files..."');
        expect(content).toContain("documents-view-toggle");
        expect(content).toContain("All Folders");
        expect(content).toContain("documents-breadcrumb");
        expect(content).toContain("folder-banner");
        expect(content).toContain("<FolderList");
        expect(content).toContain("<DocumentList");
        expect(content).toContain("<FolderModal");
        expect(content).toContain("<UploadModal");
        expect(content).toContain("<DeleteModal");
    });
});

describe("Client Documents Module — Visual & Interaction Parity (Screenshots 1–5)", () => {
    it("verifies FolderFileIcon renders the exact 40x40 circular SVG with #E4ECFB and #2563EB", () => {
        const iconPath = join(process.cwd(), "components", "documents", "FolderFileIcon.tsx");
        expect(existsSync(iconPath)).toBe(true);

        const content = readFileSync(iconPath, "utf-8");
        expect(content).toContain('width="40"');
        expect(content).toContain('height="40"');
        expect(content).toContain('fill="#E4ECFB"');
        expect(content).toContain('fill="#2563EB"');
    });

    it("verifies FolderList contains table headers, grid view, and 3-dot menu matching design reference", () => {
        const folderListPath = join(process.cwd(), "components", "documents", "FolderList.tsx");
        expect(existsSync(folderListPath)).toBe(true);

        const content = readFileSync(folderListPath, "utf-8");
        // Desktop table headers
        expect(content).toContain("th-name");
        expect(content).toContain("NAME");
        expect(content).toContain("th-items");
        expect(content).toContain("ITEMS");
        expect(content).toContain("th-size");
        expect(content).toContain("SIZE");
        expect(content).toContain("th-date");
        expect(content).toContain("LAST MODIFIED");
        // Folder actions
        expect(content).toContain("Open Folder");
        expect(content).toContain("Delete Folder");
        // Grid view card
        expect(content).toContain("folder-grid-card");
        expect(content).toContain("folder-grid-view");
    });

    it("verifies DocumentList displays PROJECT column, View & Delete actions, and download trigger", () => {
        const docListPath = join(process.cwd(), "components", "documents", "DocumentList.tsx");
        expect(existsSync(docListPath)).toBe(true);

        const content = readFileSync(docListPath, "utf-8");
        // Document table columns: Screenshot 3
        expect(content).toContain("NAME");
        expect(content).toContain("PROJECT");
        expect(content).toContain("SIZE");
        expect(content).toContain("LAST MODIFIED");
        // Action popup
        expect(content).toContain("View");
        expect(content).toContain("Delete");
        // Download API endpoint
        expect(content).toContain("/api/v1/documents/");
        expect(content).toContain("/download");
    });

    it("verifies DeleteModal matches Screenshot 4 with red trash icon, target card, and required confirmation checkbox", () => {
        const deletePath = join(process.cwd(), "components", "documents", "DeleteModal.tsx");
        expect(existsSync(deletePath)).toBe(true);

        const content = readFileSync(deletePath, "utf-8");
        expect(content).toContain("delete-modal");
        expect(content).toContain("delete-icon");
        expect(content).toContain("delete-target");
        expect(content).toContain("I understand this action cannot be undone");
        expect(content).toContain("No, Keep It.");
        expect(content).toContain("Yes, Delete!");
        expect(content).toContain("disabled={!checked || busy}");
    });

    it("verifies UploadModal matches Screenshot 5 with folder selector and drag-and-drop dropzone", () => {
        const uploadPath = join(process.cwd(), "components", "documents", "UploadModal.tsx");
        expect(existsSync(uploadPath)).toBe(true);

        const content = readFileSync(uploadPath, "utf-8");
        expect(content).toContain("Upload to");
        expect(content).toContain("Drop files here");
        expect(content).toContain("or click to browse your computer");
        expect(content).toContain("Save & Upload");
        expect(content).toContain("/api/v1/documents/upload");
    });

    it("verifies formatSize and formatDate utility functions", () => {
        expect(formatSize(0)).toBe("0 KB");
        expect(formatSize(512)).toBe("512 B");
        expect(formatSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
        expect(formatSize(156.8 * 1024 * 1024)).toBe("156.8 MB");

        expect(formatDate("")).toBe("—");
        const formatted = formatDate("2026-02-14T10:00:00Z");
        expect(formatted).toContain("2026");
        expect(formatted).toContain("Feb");
    });
});

describe("Client Documents Module — Backend Security & Project Isolation", () => {
    const routePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");
    const routeCode = readFileSync(routePath, "utf-8");

    it("enforces workspaceAccess resolution for client role and accessible project discovery", () => {
        expect(routeCode).toContain('scoped.access.role === "client"');
        expect(routeCode).toContain("getClientAccessibleProjectIds");
    });

    it("auto-seeds the 6 default folders if root folders are empty", () => {
        const defaultFolders = ["Projects", "BOQ Files", "Proposals", "Invoices", "Vendor Quotes", "Drawings"];
        for (const name of defaultFolders) {
            expect(routeCode.toLowerCase()).toContain(name.toLowerCase());
        }
    });

    it("strictly scopes document queries by accessibleProjectIds for clients", () => {
        expect(routeCode).toContain('query.in("project_id", accessibleProjectIds)');
        expect(routeCode).toContain('"You do not have access to this project."');
    });

    it("enforces project access validation on client document upload", () => {
        expect(routeCode).toContain('"No accessible project found for upload."');
    });

    it("enforces download authorization for client users", () => {
        expect(routeCode).toContain('"You do not have permission to access this document."');
    });

    it("restricts client document and folder deletion permissions", () => {
        expect(routeCode).toContain('"You can only delete documents that you uploaded."');
        expect(routeCode).toContain('"You cannot delete this folder."');
    });
});
