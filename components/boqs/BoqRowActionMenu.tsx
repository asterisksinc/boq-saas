"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Edit2, Copy, FileDown, FileSpreadsheet } from "lucide-react";

interface BoqRowActionMenuProps {
    boqId: string;
    onOpenEditor: () => void;
    onDuplicate: () => void;
    onExportPdf: () => void;
    onExportExcel: () => void;
}

export default function BoqRowActionMenu({
    boqId,
    onOpenEditor,
    onDuplicate,
    onExportPdf,
    onExportExcel,
}: BoqRowActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 160;
        const menuHeight = 162;

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
                className="boq-row-menu"
                aria-label={`More actions for BOQ ${boqId}`}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={handleToggle}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen &&
                coords &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        className="boq-floating-action-menu"
                        style={{
                            position: "fixed",
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            width: "160px",
                            zIndex: 99999,
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                            padding: "6px 0",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            role="menuitem"
                            className="boq-floating-action-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onOpenEditor();
                            }}
                        >
                            <Edit2 size={14} color="#6b7280" />
                            <span>Open Editor</span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="boq-floating-action-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onDuplicate();
                            }}
                        >
                            <Copy size={14} color="#6b7280" />
                            <span>Duplicate BOQ</span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="boq-floating-action-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onExportPdf();
                            }}
                        >
                            <FileDown size={14} color="#6b7280" />
                            <span>Export as PDF</span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="boq-floating-action-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onExportExcel();
                            }}
                        >
                            <FileSpreadsheet size={14} color="#6b7280" />
                            <span>Export Excel</span>
                        </button>
                    </div>,
                    document.body
                )}
        </div>
    );
}
