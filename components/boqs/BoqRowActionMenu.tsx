"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Edit2, Copy, FileDown, FileSpreadsheet, History, Plus } from "lucide-react";

interface BoqRowActionMenuProps {
    boqId: string;
    onOpenEditor: () => void;
    onDuplicate: () => void;
    onExportPdf: () => void;
    onExportExcel: () => void;
    onCreateRevision?: () => void;
    onViewHistory?: () => void;
}

export default function BoqRowActionMenu({
    boqId,
    onOpenEditor,
    onDuplicate,
    onExportPdf,
    onExportExcel,
    onCreateRevision,
    onViewHistory,
}: BoqRowActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 166;
        const extraItems = (onCreateRevision ? 1 : 0) + (onViewHistory ? 1 : 0);
        const menuHeight = 188 + extraItems * 44;

        let left = rect.right - menuWidth;
        if (left + menuWidth > window.innerWidth - 12) {
            left = window.innerWidth - menuWidth - 12;
        }
        if (left < 12) {
            left = 12;
        }

        let top = rect.bottom + 6;
        if (top + menuHeight > window.innerHeight - 12) {
            top = Math.max(12, rect.top - menuHeight - 6);
        }

        setCoords({ top, left });
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen) {
            updatePosition();
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        const handleScrollOrResize = () => {
            setIsOpen(false);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, [isOpen]);

    return (
        <div className="boq-cell-dropdown-anchor" onClick={(e) => e.stopPropagation()}>
            <button
                ref={buttonRef}
                type="button"
                className="boq-row-action-trigger"
                aria-label={`More actions for BOQ ${boqId}`}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={handleToggle}
            >
                <MoreHorizontal size={20} color="#64748B" />
            </button>

            {isOpen &&
                coords &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        className="boq-action-dropdown-menu"
                        style={{
                            position: "fixed",
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            width: "166px",
                            height: "188px",
                            zIndex: 99999,
                            background: "#FFFFFF",
                            border: "1px solid #EBEBEB",
                            boxShadow: "0px 16px 32px -12px rgba(14, 18, 27, 0.1)",
                            borderRadius: "16px",
                            padding: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            boxSizing: "border-box",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            role="menuitem"
                            className="boq-action-dropdown-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onOpenEditor();
                            }}
                        >
                            <Edit2 size={16} color="#64748B" />
                            <span>Open Editor</span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="boq-action-dropdown-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onDuplicate();
                            }}
                        >
                            <Copy size={16} color="#64748B" />
                            <span>Duplicate BOQ</span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="boq-action-dropdown-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onExportPdf();
                            }}
                        >
                            <FileDown size={16} color="#64748B" />
                            <span>Export as PDF</span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="boq-action-dropdown-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onExportExcel();
                            }}
                        >
                            <FileSpreadsheet size={16} color="#64748B" />
                            <span>Export as Excel</span>
                        </button>
                        {onCreateRevision && (
                            <button
                                type="button"
                                role="menuitem"
                                className="boq-action-dropdown-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    onCreateRevision();
                                }}
                            >
                                <Plus size={16} color="#64748B" />
                                <span>Create Revision</span>
                            </button>
                        )}
                        {onViewHistory && (
                            <button
                                type="button"
                                role="menuitem"
                                className="boq-action-dropdown-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    onViewHistory();
                                }}
                            >
                                <History size={16} color="#64748B" />
                                <span>Version History</span>
                            </button>
                        )}
                    </div>,
                    document.body
                )}
        </div>
    );
}
