"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Award, Bookmark, BookmarkCheck, ChevronRight, ListPlus, MapPin, ShieldCheck, Star, X } from "lucide-react";
import { BUSINESS_TYPE_LABEL, type Vendor } from "@/lib/vendors/data";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/vendors/store";

export function useVendorStore() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function CertifiedBadge({ small }: { small?: boolean }) {
    return (
        <span className={`vm-badge vm-badge--certified${small ? " vm-badge--sm" : ""}`} title="Met RVYO's additional certification criteria">
            <Award size={small ? 11 : 12} aria-hidden="true" /> RVYO Certified
        </span>
    );
}

export function VerifiedBadge({ label = "Verified", small }: { label?: string; small?: boolean }) {
    return (
        <span className={`vm-badge vm-badge--verified${small ? " vm-badge--sm" : ""}`} title="RVYO checked the business identity and documents">
            <ShieldCheck size={small ? 11 : 12} aria-hidden="true" /> {label}
        </span>
    );
}

export function TrustBadges({ certified, verified, small, verifiedLabel }: { certified: boolean; verified: boolean; small?: boolean; verifiedLabel?: string }) {
    if (!certified && !verified) return null;
    return (
        <span className="vm-badges">
            {certified ? <CertifiedBadge small={small} /> : null}
            {verified ? <VerifiedBadge small={small} label={verifiedLabel} /> : null}
        </span>
    );
}

export function Rating({ vendor }: { vendor: Vendor }) {
    if (vendor.rating === null) return <span className="vm-rating vm-rating--none">No reviews yet</span>;
    return (
        <span className="vm-rating">
            <Star size={14} aria-hidden="true" className="vm-star" />
            <strong>{vendor.rating.toFixed(1)}</strong>
            <span>({vendor.reviewCount} review{vendor.reviewCount === 1 ? "" : "s"})</span>
        </span>
    );
}

export function VendorLogo({ vendor, size = 46 }: { vendor: Pick<Vendor, "initials">; size?: number }) {
    return <span className="vm-logo" style={{ width: size, height: size, fontSize: size * 0.32 }} aria-hidden="true">{vendor.initials}</span>;
}

export function formatKm(km: number | null) {
    if (km === null) return null;
    return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function businessTypes(vendor: Vendor) {
    return vendor.businessTypes.map((t) => BUSINESS_TYPE_LABEL[t]).join(" · ");
}

export function timeAgo(iso: string, now = Date.now()) {
    const diff = Math.max(0, now - new Date(iso).getTime());
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.floor(h / 24);
    return `${d} d ago`;
}

export interface VendorCardProps {
    vendor: Vendor;
    certified: boolean;
    distanceKm: number | null;
    saved: boolean;
    active?: boolean;
    highlighted?: boolean;
    compact?: boolean;
    footerNote?: ReactNode;
    selectable?: { checked: boolean; disabled?: boolean; onChange: () => void };
    onOpen: () => void;
    onToggleSave: () => void;
    onAddToList: () => void;
    onLocate?: () => void;
    onHover?: (hovered: boolean) => void;
}

/** PRD §06 listing card: logo, name, trust badges, rating, distance, categories, type, description, save, view details. */
export function VendorCard({
    vendor, certified, distanceKm, saved, active, highlighted, compact, footerNote, selectable,
    onOpen, onToggleSave, onAddToList, onLocate, onHover,
}: VendorCardProps) {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        if (active) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [active]);
    const distance = formatKm(distanceKm);
    const extra = vendor.materials.length - 3;

    return (
        <article
            ref={ref}
            className={`vm-card${active ? " is-active" : ""}${highlighted ? " is-highlighted" : ""}${compact ? " vm-card--compact" : ""}`}
            onClick={onOpen}
            onMouseEnter={() => onHover?.(true)}
            onMouseLeave={() => onHover?.(false)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) onOpen(); }}
            tabIndex={0}
            aria-label={`${vendor.name}${certified ? ", RVYO Certified" : ""}`}
            data-vendor-id={vendor.id}
        >
            <div className="vm-card-top">
                {selectable ? (
                    <input
                        type="checkbox"
                        className="vm-check"
                        checked={selectable.checked}
                        disabled={selectable.disabled}
                        aria-label={`Select ${vendor.name} to compare`}
                        onClick={(e) => e.stopPropagation()}
                        onChange={selectable.onChange}
                    />
                ) : null}
                <VendorLogo vendor={vendor} />
                <div className="vm-card-id">
                    <h3>{vendor.name}</h3>
                    <TrustBadges certified={certified} verified={!!vendor.verifiedOn} />
                    <Rating vendor={vendor} />
                    <button
                        type="button"
                        className="vm-card-loc"
                        onClick={(e) => { e.stopPropagation(); onLocate?.(); }}
                        disabled={!onLocate || vendor.lat === null}
                        title={vendor.lat === null ? "Location not confirmed" : onLocate ? "Show on map" : undefined}
                    >
                        <MapPin size={12} aria-hidden="true" />
                        {vendor.area}{distance ? ` · ${distance} away` : vendor.lat === null ? " · location pending" : `, ${vendor.city}`}
                    </button>
                </div>
                <div className="vm-card-icons">
                    <button type="button" className="vm-icon-btn" aria-label={`Add ${vendor.name} to a sourcing list`} title="Add to sourcing list" onClick={(e) => { e.stopPropagation(); onAddToList(); }}>
                        <ListPlus size={17} />
                    </button>
                    <button
                        type="button"
                        className={`vm-icon-btn${saved ? " is-on" : ""}`}
                        aria-label={saved ? `Remove ${vendor.name} from saved vendors` : `Save ${vendor.name}`}
                        aria-pressed={saved}
                        title={saved ? "Saved" : "Save vendor"}
                        onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                    >
                        {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                    </button>
                </div>
            </div>
            {!compact ? (
                <>
                    <div className="vm-chips" aria-label="Materials and services">
                        {vendor.materials.slice(0, 3).map((m) => <span key={m} className="vm-chip">{m}</span>)}
                        {extra > 0 ? <span className="vm-chip vm-chip--more">+{extra}</span> : null}
                    </div>
                    <p className="vm-card-desc">{vendor.description}</p>
                </>
            ) : null}
            <div className="vm-card-foot">
                <span>{businessTypes(vendor)} · {vendor.years} yrs</span>
                <span className="vm-card-foot-end">
                    {footerNote}
                    <button type="button" className="vm-link" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                        View Details <ChevronRight size={14} aria-hidden="true" />
                    </button>
                </span>
            </div>
        </article>
    );
}

export function Modal({ open, onClose, labelledBy, wide, children }: { open: boolean; onClose: () => void; labelledBy: string; wide?: boolean; children: ReactNode }) {
    const panel = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        window.setTimeout(() => panel.current?.querySelector<HTMLElement>("input, button:not(.vm-modal-close), select, textarea")?.focus(), 0);
        return () => {
            document.removeEventListener("keydown", onKey);
            previous?.focus?.();
        };
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="vm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={panel} className={`vm-modal${wide ? " vm-modal--wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
                <button type="button" className="vm-modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
                {children}
            </div>
        </div>
    );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
    useEffect(() => {
        if (!message) return;
        const timer = window.setTimeout(onDone, 3200);
        return () => window.clearTimeout(timer);
    }, [message, onDone]);
    if (!message) return null;
    return <div className="vm-toast" role="status">{message}</div>;
}
