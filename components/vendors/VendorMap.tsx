"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Award, LocateFixed, MapPinOff, Minus, Plus, RotateCw, Search, X } from "lucide-react";
import { PLACES, type Vendor } from "@/lib/vendors/data";
import { Rating, TrustBadges, formatKm } from "./VendorUi";

export interface MapPin {
    vendor: Vendor;
    certified: boolean;
    saved: boolean;
    distanceKm: number | null;
}

interface LatLng { lat: number; lng: number }

export interface VendorMapProps {
    center: LatLng | null;
    radiusKm: number | null;
    pins: MapPin[];
    selectedId: string | null;
    hoveredId: string | null;
    focus: { id: string; n: number } | null;
    loading?: boolean;
    outage: boolean;
    onSelect: (id: string | null) => void;
    onOpen: (id: string) => void;
    onSearchArea: (center: LatLng) => void;
    onToggleOutage: () => void;
    onNotify: (message: string) => void;
}

const KM_PER_LAT = 110.57;
const ZOOMS = [0.6, 1, 1.6, 2.5, 4, 6, 9, 14, 20];
const CLUSTER_PX = 34;

function project(p: LatLng, c: LatLng, scale: number) {
    const kmPerLng = 111.32 * Math.cos((c.lat * Math.PI) / 180);
    return { x: (p.lng - c.lng) * kmPerLng * scale, y: -(p.lat - c.lat) * KM_PER_LAT * scale };
}

function unproject(dx: number, dy: number, c: LatLng, scale: number): LatLng {
    const kmPerLng = 111.32 * Math.cos((c.lat * Math.PI) / 180);
    return { lat: c.lat - dy / scale / KM_PER_LAT, lng: c.lng + dx / scale / kmPerLng };
}

function zoomFor(radiusKm: number | null, size: number) {
    if (!radiusKm) return 2;
    const want = (size * 0.42) / radiusKm;
    let best = 0;
    ZOOMS.forEach((z, i) => { if (z <= want) best = i; });
    return best;
}

/**
 * Lightweight in-app map (no tile provider yet): projected vendor pins, clustering at low zoom, radius ring,
 * pan/zoom, "Search this area", current location and a failure fallback. Swap the background for a real tile
 * layer (Mapbox / Google) without changing the props.
 */
export default function VendorMap({
    center, radiusKm, pins, selectedId, hoveredId, focus, loading, outage,
    onSelect, onOpen, onSearchArea, onToggleOutage, onNotify,
}: VendorMapProps) {
    const box = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: 640, h: 480 });
    const [view, setView] = useState<LatLng>(center ?? { lat: 17.385, lng: 78.4867 });
    const [zoom, setZoom] = useState(2);
    const [moved, setMoved] = useState(false);
    const drag = useRef<{ x: number; y: number; start: LatLng; moved: boolean } | null>(null);

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Re-centre whenever a new search lands.
    useEffect(() => {
        if (!center) return;
        setView(center);
        setZoom(zoomFor(radiusKm, Math.min(size.w, size.h)));
        setMoved(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center?.lat, center?.lng, radiusKm]);

    // Card "show on map" / pin selection from the list.
    useEffect(() => {
        if (!focus) return;
        const pin = pins.find((p) => p.vendor.id === focus.id);
        if (pin?.vendor.lat != null && pin.vendor.lng != null) {
            setView({ lat: pin.vendor.lat, lng: pin.vendor.lng });
            setZoom((z) => Math.max(z, 4));
            setMoved(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus?.n]);

    const scale = ZOOMS[zoom];
    const cx = size.w / 2;
    const cy = size.h / 2;

    const placed = useMemo(() => pins
        .filter((p) => p.vendor.lat !== null && p.vendor.lng !== null) // never draw an inaccurate pin
        .map((p) => ({ ...p, ...project({ lat: p.vendor.lat!, lng: p.vendor.lng! }, view, scale) })), [pins, view, scale]);

    const clusters = useMemo(() => {
        const groups: Array<{ x: number; y: number; members: typeof placed }> = [];
        for (const p of placed) {
            if (p.vendor.id === selectedId) {
                groups.push({ x: p.x, y: p.y, members: [p] });
                continue;
            }
            const g = groups.find((c) => c.members[0].vendor.id !== selectedId && Math.hypot(c.x - p.x, c.y - p.y) < CLUSTER_PX);
            if (g) {
                g.members.push(p);
                g.x = g.members.reduce((s, m) => s + m.x, 0) / g.members.length;
                g.y = g.members.reduce((s, m) => s + m.y, 0) / g.members.length;
            } else groups.push({ x: p.x, y: p.y, members: [p] });
        }
        return groups;
    }, [placed, selectedId]);

    // Cities always; localities only once zoomed in. Labels that would overlap an earlier one are skipped.
    const labels = useMemo(() => {
        const placedLabels: Array<{ id: string; text: string; city: boolean; x: number; y: number }> = [];
        const candidates = PLACES
            .filter((pl) => pl.kind === "city" || (pl.kind === "area" && scale >= 4))
            .sort((a, b) => Number(b.kind === "city") - Number(a.kind === "city"));
        for (const pl of candidates) {
            const label = { id: pl.id, text: pl.kind === "city" ? pl.city : pl.label.split(",")[0], city: pl.kind === "city", ...project(pl, view, scale) };
            if (Math.abs(label.x) > cx + 80 || Math.abs(label.y) > cy + 40) continue;
            if (placedLabels.some((o) => Math.abs(o.x - label.x) < 110 && Math.abs(o.y - label.y) < 22)) continue;
            placedLabels.push(label);
        }
        return placedLabels;
    }, [view, scale, cx, cy]);

    const ring = center && radiusKm ? { ...project(center, view, scale), r: radiusKm * scale } : null;
    const selected = placed.find((p) => p.vendor.id === selectedId) ?? null;
    const gridStep = Math.max(40, Math.min(160, scale * 5));
    const origin = project({ lat: 0, lng: 0 }, view, scale);

    const setZoomLevel = (next: number) => {
        setZoom(Math.max(0, Math.min(ZOOMS.length - 1, next)));
        setMoved(true);
    };

    const onPointerDown = (e: ReactPointerEvent) => {
        if ((e.target as HTMLElement).closest("button, a")) return;
        drag.current = { x: e.clientX, y: e.clientY, start: view, moved: false };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: ReactPointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 4) return;
        d.moved = true;
        setView(unproject(-dx, -dy, d.start, scale));
    };
    const onPointerUp = () => {
        if (drag.current?.moved) setMoved(true);
        else if (drag.current) onSelect(null);
        drag.current = null;
    };

    const locate = () => {
        if (!("geolocation" in navigator)) {
            onNotify("Current location isn't available in this browser. Enter a city instead.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setView({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setMoved(true);
            },
            () => onNotify("Location permission was denied. Enter a city, area or pincode instead."),
            { timeout: 8000 },
        );
    };

    if (outage) {
        return (
            <div className="vm-map vm-map--down" role="region" aria-label="Map">
                <div className="vm-map-down">
                    <MapPinOff size={28} aria-hidden="true" />
                    <strong>The map couldn&apos;t load</strong>
                    <p>You can keep searching and browsing vendors in the list. Locations will show again once the map is back.</p>
                    <button type="button" className="vm-btn" onClick={onToggleOutage}><RotateCw size={16} /> Retry map</button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={box}
            className={`vm-map${drag.current?.moved ? " is-dragging" : ""}`}
            role="region"
            aria-label="Vendor map"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={(e) => { if (Math.abs(e.deltaY) > 20) setZoomLevel(zoom + (e.deltaY < 0 ? 1 : -1)); }}
            style={{ backgroundSize: `${gridStep}px ${gridStep}px`, backgroundPosition: `${(cx + origin.x) % gridStep}px ${(cy + origin.y) % gridStep}px` }}
        >
            {loading ? <div className="vm-map-loading" aria-hidden="true" /> : null}

            {labels.map((l) => (
                <span key={l.id} className={`vm-map-label${l.city ? " is-city" : ""}`} style={{ left: cx + l.x, top: cy + l.y }}>{l.text}</span>
            ))}

            {ring ? <span className="vm-map-ring" style={{ left: cx + ring.x - ring.r, top: cy + ring.y - ring.r, width: ring.r * 2, height: ring.r * 2 }} aria-hidden="true" /> : null}
            {center ? (() => { const c = project(center, view, scale); return <span className="vm-map-origin" style={{ left: cx + c.x, top: cy + c.y }} aria-hidden="true" />; })() : null}

            {clusters.map((c) => {
                if (c.members.length > 1) {
                    return (
                        <button
                            key={c.members.map((m) => m.vendor.id).join("|")}
                            type="button"
                            className="vm-cluster"
                            style={{ left: cx + c.x, top: cy + c.y }}
                            aria-label={`${c.members.length} vendors here. Zoom in`}
                            onClick={() => {
                                setView(unproject(c.x, c.y, view, scale));
                                setZoomLevel(zoom + 2);
                            }}
                        >
                            {c.members.length}
                        </button>
                    );
                }
                const p = c.members[0];
                const state = p.vendor.id === selectedId ? "selected" : p.certified ? "certified" : "default";
                return (
                    <button
                        key={p.vendor.id}
                        type="button"
                        className={`vm-pin vm-pin--${state}${p.vendor.id === hoveredId ? " is-hovered" : ""}`}
                        style={{ left: cx + p.x, top: cy + p.y }}
                        aria-label={`${p.vendor.name}${p.certified ? ", RVYO Certified" : ""}`}
                        aria-pressed={p.vendor.id === selectedId}
                        onClick={() => onSelect(p.vendor.id)}
                    >
                        <span className="vm-pin-head">{p.certified ? <Award size={13} aria-hidden="true" /> : null}</span>
                        {p.saved ? <span className="vm-pin-saved" aria-hidden="true" /> : null}
                    </button>
                );
            })}

            {selected ? (
                <div className="vm-map-preview" style={{ left: cx + selected.x, top: cy + selected.y }} role="dialog" aria-label={`${selected.vendor.name} preview`}>
                    <button type="button" className="vm-map-preview-close" aria-label="Close preview" onClick={() => onSelect(null)}><X size={14} /></button>
                    <strong>{selected.vendor.name}</strong>
                    <TrustBadges certified={selected.certified} verified={!!selected.vendor.verifiedOn} small />
                    <span className="vm-map-preview-meta">
                        <Rating vendor={selected.vendor} />
                        {formatKm(selected.distanceKm) ? <span>{formatKm(selected.distanceKm)}</span> : null}
                    </span>
                    <button type="button" className="vm-btn vm-btn--primary vm-btn--block" onClick={() => onOpen(selected.vendor.id)}>View profile</button>
                </div>
            ) : null}

            {moved ? (
                <button type="button" className="vm-map-area" onClick={() => { setMoved(false); onSearchArea(view); }}>
                    <Search size={15} /> Search this area
                </button>
            ) : null}

            <div className="vm-map-controls">
                <button type="button" aria-label="Zoom in" onClick={() => setZoomLevel(zoom + 1)} disabled={zoom === ZOOMS.length - 1}><Plus size={17} /></button>
                <button type="button" aria-label="Zoom out" onClick={() => setZoomLevel(zoom - 1)} disabled={zoom === 0}><Minus size={17} /></button>
                <button type="button" aria-label="Use my current location" className="vm-map-locate" onClick={locate}><LocateFixed size={17} /></button>
            </div>

            <div className="vm-map-legend" aria-label="Map legend">
                <span><i className="vm-dot" /> Vendor</span>
                <span><i className="vm-dot vm-dot--certified" /> Certified</span>
                <span><i className="vm-dot vm-dot--selected" /> Selected</span>
                <span><i className="vm-dot vm-dot--saved" /> Saved</span>
            </div>
            <button type="button" className="vm-map-sim" onClick={onToggleOutage}>Simulate map outage</button>
        </div>
    );
}
