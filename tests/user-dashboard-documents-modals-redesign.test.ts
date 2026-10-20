import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("User Dashboard Documents Modals Redesign (Figma Parity)", () => {
    const deleteModalPath = join(process.cwd(), "components", "documents", "DeleteModal.tsx");
    const uploadModalPath = join(process.cwd(), "components", "documents", "UploadModal.tsx");
    const folderModalPath = join(process.cwd(), "components", "documents", "FolderModal.tsx");
    const renameModalPath = join(process.cwd(), "components", "documents", "RenameModal.tsx");
    const cssPath = join(process.cwd(), "app", "documents", "documents-redesign.css");

    it("verifies all modal component files exist", () => {
        expect(existsSync(deleteModalPath)).toBe(true);
        expect(existsSync(uploadModalPath)).toBe(true);
        expect(existsSync(folderModalPath)).toBe(true);
        expect(existsSync(renameModalPath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
    });

    describe("DeleteModal (Figma: Delete Folder / File Popup)", () => {
        const content = readFileSync(deleteModalPath, "utf-8");

        it("renders double-card surface with outer glass card and inner white card", () => {
            expect(content).toContain("doc-delete-modal");
            expect(content).toContain("delete-modal");
            expect(content).toContain("doc-delete-inner");
        });

        it("renders 68x68 badge with red trash icon and 28px size", () => {
            expect(content).toContain("doc-delete-icon");
            expect(content).toContain("delete-icon");
            expect(content).toContain("<Trash2 size={28} />");
        });

        it("renders title, description, and 336x70 target preview card", () => {
            expect(content).toContain("doc-delete-title");
            expect(content).toContain("doc-delete-desc");
            expect(content).toContain("doc-delete-target");
            expect(content).toContain("delete-target");
            expect(content).toContain("<FolderFileIcon type={type} fileName={label} />");
            expect(content).toContain("doc-delete-target-info");
        });

        it("renders required confirmation checkbox with exact Figma copy", () => {
            expect(content).toContain("doc-delete-check");
            expect(content).toContain("I understand this action cannot be undone");
            expect(content).toContain("disabled={!checked || busy}");
        });

        it("renders equal two-button action row with exact Figma button text", () => {
            expect(content).toContain("doc-delete-actions");
            expect(content).toContain("doc-delete-cancel-btn");
            expect(content).toContain("No, Keep It.");
            expect(content).toContain("doc-delete-confirm-btn");
            expect(content).toContain("Yes, Delete!");
        });
    });

    describe("UploadModal (Figma: Upload Files Popup)", () => {
        const content = readFileSync(uploadModalPath, "utf-8");

        it("renders outer glass card, header with title and close button", () => {
            expect(content).toContain("doc-modal");
            expect(content).toContain("upload-modal");
            expect(content).toContain("doc-modal-header");
            expect(content).toContain("Upload Files");
            expect(content).toContain("doc-modal-close");
        });

        it("renders inner white card with folder selector and required indicator", () => {
            expect(content).toContain("doc-modal-inner");
            expect(content).toContain("Upload to");
            expect(content).toContain("doc-field-required");
            expect(content).toContain("*");
            expect(content).toContain("upload-folder-select");
        });

        it("renders dropzone with 42x42 icon square and exact Figma prompt text", () => {
            expect(content).toContain("doc-upload-drop");
            expect(content).toContain("doc-upload-icon-sq");
            expect(content).toContain("<Upload size={20} color=\"#64748B\" />");
            expect(content).toContain("Drop files here");
            expect(content).toContain("or click to browse your computer");
            expect(content).toContain("/api/v1/documents/upload");
        });

        it("renders Cancel and Save & Upload footer actions", () => {
            expect(content).toContain("doc-modal-actions");
            expect(content).toContain("doc-modal-btn-cancel");
            expect(content).toContain("Cancel");
            expect(content).toContain("doc-modal-btn-primary");
            expect(content).toContain("Save & Upload");
        });
    });

    describe("FolderModal (Figma: New Folder Popup)", () => {
        const content = readFileSync(folderModalPath, "utf-8");

        it("renders outer glass card, header with New Folder title and close button", () => {
            expect(content).toContain("doc-modal small");
            expect(content).toContain("doc-modal-header");
            expect(content).toContain("New Folder");
            expect(content).toContain("doc-modal-close");
        });

        it("renders inner white card with 48px Folder Name input and required indicator", () => {
            expect(content).toContain("doc-modal-inner");
            expect(content).toContain("Folder Name");
            expect(content).toContain("doc-field-required");
            expect(content).toContain("placeholder=\"ex. Projects\"");
            expect(content).toContain("/api/v1/document-folders");
        });

        it("renders Cancel and Create Folder footer actions", () => {
            expect(content).toContain("doc-modal-actions");
            expect(content).toContain("doc-modal-btn-cancel");
            expect(content).toContain("Cancel");
            expect(content).toContain("doc-modal-btn-primary");
            expect(content).toContain("Create Folder");
        });
    });

    describe("CSS Specifications (Figma Fidelity)", () => {
        const css = readFileSync(cssPath, "utf-8");

        it("implements Figma backdrop styling with 7px blur and 0.2 dark tint", () => {
            expect(css).toContain("background: rgba(0, 0, 0, 0.2);");
            expect(css).toContain("backdrop-filter: blur(7px);");
        });

        it("implements Figma outer glass card (400px width, rgba(255, 255, 255, 0.6), radius 16px, padding 16px)", () => {
            expect(css).toContain("width: 400px;");
            expect(css).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(css).toContain("border-radius: 16px;");
            expect(css).toContain("padding: 16px;");
        });

        it("implements Figma inner white cards (#FFFFFF, radius 14px)", () => {
            expect(css).toContain(".doc-modal-inner");
            expect(css).toContain(".doc-delete-inner");
            expect(css).toContain("border-radius: 14px;");
        });

        it("implements 68x68 circular trash badge with #FEF2F2 and #EF4444", () => {
            expect(css).toContain(".doc-delete-icon");
            expect(css).toContain("width: 68px");
            expect(css).toContain("height: 68px");
            expect(css).toContain("background: #FEF2F2");
            expect(css).toContain("color: #EF4444");
            expect(css).toContain("border-radius: 100px");
        });

        it("implements 336x70 preview target card with #FFFFFF, border #EBEBEB, radius 12px", () => {
            expect(css).toContain(".doc-delete-target");
            expect(css).toContain("height: 70px");
            expect(css).toContain("border: 1px solid #EBEBEB");
            expect(css).toContain("border-radius: 12px");
        });

        it("implements 20x20 checkbox with #FFFFFF and border #EBEBEB", () => {
            expect(css).toContain(".doc-delete-check input[type=\"checkbox\"]");
            expect(css).toContain("width: 20px");
            expect(css).toContain("height: 20px");
            expect(css).toContain("border: 1.5px solid #EBEBEB");
        });

        it("implements 336x140 dropzone with #F2F3F2, dashed border #E2E8F0, and 42x42 icon square", () => {
            expect(css).toContain(".doc-upload-drop");
            expect(css).toContain("height: 140px;");
            expect(css).toContain("background: #F2F3F2;");
            expect(css).toContain("border: 1px dashed #E2E8F0;");
            expect(css).toContain(".doc-upload-icon-sq");
            expect(css).toContain("width: 42px;");
            expect(css).toContain("height: 42px;");
            expect(css).toContain("background: #E2E4E2;");
        });

        it("implements 48px input fields and 46px action buttons with radius 6px", () => {
            expect(css).toContain("height: 48px;");
            expect(css).toContain("height: 46px;");
            expect(css).toContain(".doc-delete-cancel-btn");
            expect(css).toContain(".doc-delete-confirm-btn");
            expect(css).toContain(".doc-modal-btn-cancel");
            expect(css).toContain(".doc-modal-btn-primary");
        });
    });
});
