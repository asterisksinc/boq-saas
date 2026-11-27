"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { initials } from "@/lib/api/leads";

export type PillTone = "blue" | "green" | "amber" | "red" | "gray" | "purple";

export function Pill({ tone = "blue", children }: { tone?: PillTone; children: ReactNode }) {
    return <span className={`ld-pill ld-pill--${tone}`}>{children}</span>;
}

const STAGE_TONES: Record<string, PillTone> = {
    new: "green", contacted: "blue", interested: "blue", qualified: "blue",
    unqualified: "gray", lost: "red", won: "green", churned: "amber",
};

export function stageTone(stage: string): PillTone {
    return STAGE_TONES[stage] ?? "blue";
}

export function statusTone(status: string | null | undefined): PillTone {
    const s = String(status ?? "").toLowerCase();
    if (["active", "paid", "approved", "won", "connected", "completed", "accepted"].includes(s)) return "green";
    if (["in_review", "pending", "sent", "partial", "in_progress", "revisions", "scheduled"].includes(s)) return "amber";
    if (["rejected", "lost", "void", "blocked", "cancelled", "no_answer", "busy", "voicemail", "changes_required"].includes(s)) return "red";
    if (["completed_archive"].includes(s)) return "purple";
    return "gray";
}

export function humanize(value: string | null | undefined) {
    if (!value) return "—";
    return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Avatar({ name, src, size = 32 }: { name: string | null | undefined; src?: string | null; size?: number }) {
    return (
        <span className="ld-avatar" style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.375)) }}>
            {src ? <img src={src} alt="" /> : initials(name)}
        </span>
    );
}

export function PersonCell({ name, role, src }: { name: string | null | undefined; role?: string | null; src?: string | null }) {
    if (!name) return <span className="ld-muted">Unassigned</span>;
    return (
        <span className="ld-person">
            <Avatar name={name} src={src} />
            <span>
                <span className="ld-person-name">{name}</span>
                {role ? <span className="ld-person-role">{role}</span> : null}
            </span>
        </span>
    );
}

export interface MenuAction {
    label: string;
    onSelect: () => void;
    danger?: boolean;
}

/** The "⋯" menu used on rows and cards. */
export function RowMenu({ actions, label = "More actions" }: { actions: MenuAction[]; label?: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);
    return (
        <div className="ld-menu" ref={ref} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ld-menu-trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
                <MoreHorizontal size={18} />
            </button>
            {open ? (
                <div className="ld-menu-list" role="menu">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            role="menuitem"
                            className={action.danger ? "is-danger" : ""}
                            onClick={() => {
                                setOpen(false);
                                action.onSelect();
                            }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export function Pagination({
    page, pageSize, total, label, onPage, onPageSize,
}: {
    page: number; pageSize: number; total: number; label: string;
    onPage: (page: number) => void; onPageSize: (size: number) => void;
}) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    const visible = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
    return (
        <div className="ld-pagination">
            <span className="ld-pagination-total">{label}: {total}</span>
            <div className="ld-pagination-pages">
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                    <ChevronLeft size={16} />
                </button>
                {visible.map((n) => (
                    <button key={n} type="button" className={n === page ? "is-current" : ""} aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}>
                        {n}
                    </button>
                ))}
                <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}>
                    <ChevronRight size={16} />
                </button>
            </div>
            <label className="ld-pagination-size">
                <span>Show per Page:</span>
                <span className="ld-select-wrap ld-select-wrap--small">
                    <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
                        {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <ChevronDown size={16} aria-hidden="true" />
                </span>
            </label>
        </div>
    );
}

/** Right-hand slide-over panel used by Add Lead, Call Log and Note forms. */
export function Drawer({
    title, open, onClose, children, footer, className,
}: {
    title: string; open: boolean; onClose: () => void; children: ReactNode; footer?: ReactNode; className?: string;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="ld-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <aside className={`ld-drawer${className ? ` ${className}` : ""}`} role="dialog" aria-modal="true" aria-label={title}>
                <header className="ld-drawer-head">
                    <h2>{title}</h2>
                    <button type="button" aria-label="Close" onClick={onClose}><X size={20} /></button>
                </header>
                <div className="ld-drawer-body">{children}</div>
                {footer ? <footer className="ld-drawer-foot">{footer}</footer> : null}
            </aside>
        </div>
    );
}

export function Field({
    label, required, error, children, className, group,
}: {
    label: string; required?: boolean; error?: string | null; children: ReactNode; className?: string;
    /** Render as a <div> when the content is not a single form control (e.g. a dropzone). */
    group?: boolean;
}) {
    const Tag = group ? "div" : "label";
    return (
        <Tag className={`ld-field${className ? ` ${className}` : ""}`}>
            <span className="ld-field-label">
                {label}
                {required ? <em aria-hidden="true"> *</em> : null}
            </span>
            {children}
            {error ? <span className="ld-field-error">{error}</span> : null}
        </Tag>
    );
}

export function SelectInput({
    value, onChange, placeholder, options, disabled,
}: {
    value: string; onChange: (value: string) => void; placeholder?: string;
    options: ReadonlyArray<{ value: string; label: string }>; disabled?: boolean;
}) {
    return (
        <span className="ld-select-wrap">
            <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={value ? "" : "is-placeholder"}>
                {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
        </span>
    );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
    return (
        <div className="ld-empty">
            <strong>{title}</strong>
            {text ? <p>{text}</p> : null}
            {action}
        </div>
    );
}

export function Toast({ message, tone = "success", onDone }: { message: string | null; tone?: "success" | "error"; onDone: () => void }) {
    useEffect(() => {
        if (!message) return;
        const timer = window.setTimeout(onDone, 3500);
        return () => window.clearTimeout(timer);
    }, [message, onDone]);
    if (!message) return null;
    return <div className={`ld-toast ld-toast--${tone}`} role="status">{message}</div>;
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
