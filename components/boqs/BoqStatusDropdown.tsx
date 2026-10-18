"use client";

import { ChevronDown, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { BoqStatusUi } from "@/lib/domain/boq-data";

const STATUS_OPTIONS: BoqStatusUi[] = ["DRAFT", "IN REVIEW", "APPROVED", "ARCHIVED"];
const MENU_WIDTH = 160;
const MENU_HEIGHT = 164;
const VIEWPORT_GUTTER = 12;

interface BoqStatusDropdownProps {
    value: BoqStatusUi;
    onChange: (status: BoqStatusUi) => void | Promise<void>;
}

export default function BoqStatusDropdown({ value, onChange }: BoqStatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GUTTER;
        const top = spaceBelow >= MENU_HEIGHT
            ? rect.bottom + 6
            : Math.max(VIEWPORT_GUTTER, rect.top - MENU_HEIGHT - 6);
        const left = Math.min(
            Math.max(VIEWPORT_GUTTER, rect.left),
            Math.max(VIEWPORT_GUTTER, window.innerWidth - MENU_WIDTH - VIEWPORT_GUTTER)
        );

        setPosition({ top, left });
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        const handleViewportChange = () => updatePosition();

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("scroll", handleViewportChange, true);
        window.addEventListener("resize", handleViewportChange);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("scroll", handleViewportChange, true);
            window.removeEventListener("resize", handleViewportChange);
        };
    }, [isOpen]);

    const toggle = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            return;
        }
        updatePosition();
        setIsOpen(true);
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className={`boq-status-badge-redesign ${value.toLowerCase().replace(/\s/g, "-")}`}
                onClick={toggle}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                title="Change status"
            >
                <span>{value}</span>
                <ChevronDown size={14} color="#64748B" />
            </button>
            {isOpen && position && typeof document !== "undefined" && createPortal(
                <div
                    ref={menuRef}
                    className="boq-status-dropdown-portal"
                    role="menu"
                    style={{
                        position: "fixed",
                        top: position.top,
                        left: position.left,
                        width: MENU_WIDTH,
                    }}
                    onClick={(event) => event.stopPropagation()}
                >
                    {STATUS_OPTIONS.map((status) => (
                        <button
                            key={status}
                            type="button"
                            role="menuitemradio"
                            aria-checked={status === value}
                            onClick={() => {
                                setIsOpen(false);
                                void onChange(status);
                            }}
                        >
                            <span>{status}</span>
                            {status === value && <Check size={14} aria-hidden="true" />}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}
