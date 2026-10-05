"use client";

import { useRouter, usePathname } from "next/navigation";
import { Folder, FileText, Receipt, CheckSquare, Bookmark, Box } from "lucide-react";

interface NewMenuPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onNew?: () => void;
}

export default function NewMenuPopover({ isOpen, onClose, onNew }: NewMenuPopoverProps) {
    const router = useRouter();
    const pathname = usePathname();

    if (!isOpen) return null;

    const handleAction = (type: "project" | "boq" | "invoice" | "task" | "approval" | "item") => {
        onClose();

        switch (type) {
            case "project":
                if (pathname === "/projects" && onNew) {
                    onNew();
                } else {
                    router.push("/projects?create=true");
                }
                break;
            case "boq":
                if (pathname === "/boqs" && onNew) {
                    onNew();
                } else {
                    router.push("/boqs?create=true");
                }
                break;
            case "invoice":
                if (pathname === "/invoices" && onNew) {
                    onNew();
                } else {
                    router.push("/invoices?create=true");
                }
                break;
            case "task":
                router.push("/activities?tab=tasks&create=true");
                break;
            case "approval":
                router.push("/activities?tab=approvals&create=true");
                break;
            case "item":
                router.push("/costs?create=true");
                break;
        }
    };

    return (
        <div
            className="fig-dashboard-new-menu"
            role="menu"
            aria-label="New creation actions"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                role="menuitem"
                className="fig-new-menu-item"
                onClick={() => handleAction("project")}
            >
                <Folder size={18} className="fig-new-menu-icon" />
                <span className="fig-new-menu-label">Create Project</span>
            </button>

            <button
                type="button"
                role="menuitem"
                className="fig-new-menu-item"
                onClick={() => handleAction("boq")}
            >
                <FileText size={18} className="fig-new-menu-icon" />
                <span className="fig-new-menu-label">Create BOQ</span>
            </button>

            <button
                type="button"
                role="menuitem"
                className="fig-new-menu-item"
                onClick={() => handleAction("invoice")}
            >
                <Receipt size={18} className="fig-new-menu-icon" />
                <span className="fig-new-menu-label">Create Invoice</span>
            </button>

            <button
                type="button"
                role="menuitem"
                className="fig-new-menu-item"
                onClick={() => handleAction("task")}
            >
                <CheckSquare size={18} className="fig-new-menu-icon" />
                <span className="fig-new-menu-label">Create Task</span>
            </button>

            <button
                type="button"
                role="menuitem"
                className="fig-new-menu-item"
                onClick={() => handleAction("approval")}
            >
                <Bookmark size={18} className="fig-new-menu-icon" />
                <span className="fig-new-menu-label">Request Approval</span>
            </button>

            <button
                type="button"
                role="menuitem"
                className="fig-new-menu-item"
                onClick={() => handleAction("item")}
            >
                <Box size={18} className="fig-new-menu-icon" />
                <span className="fig-new-menu-label">Create Item</span>
            </button>
        </div>
    );
}
