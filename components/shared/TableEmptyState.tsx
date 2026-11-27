"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import BoqEmptyIllustration from "@/components/boqs/BoqEmptyIllustration";

/**
 * The one empty state for every list and table (Figma "No BOQs found"): illustration, "No … found" title, a line of
 * help text and an optional primary "+ New …" button. Pass `action` for anything other than a simple create button.
 */
export default function TableEmptyState({
    title, text, actionLabel, onAction, action, compact,
}: {
    title: string;
    text?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    action?: ReactNode;
    /** Shorter version for panels inside a page (tabs, drawers). */
    compact?: boolean;
}) {
    return (
        <div className={`tes${compact ? " tes--compact" : ""}`} role="status">
            <BoqEmptyIllustration />
            <div className="tes-text">
                <h3 className="tes-title">{title}</h3>
                {text ? <p className="tes-sub">{text}</p> : null}
            </div>
            {action ?? (actionLabel && onAction ? (
                <button type="button" className="tes-btn" onClick={onAction}>
                    <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
                    <span>{actionLabel}</span>
                </button>
            ) : null)}
        </div>
    );
}
