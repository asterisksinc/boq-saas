"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Award, LocateFixed, MapPinOff, Minus, Plus, RotateCw, Search, X } from "lucide-react";
import type { Vendor } from "@/lib/vendors/data";
import { boundsOf, circlePolygon } from "@/lib/vendors/geo";
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

/** OpenFreeMap: free OpenStreetMap vector tiles, no API key and no request limits. Its attribution must stay visible. */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT_CENTER: LatLng = { lat: 17.385, lng: 78.4867 };
const CLUSTER_PX = 34;
const RADIUS_SOURCE = "vm-radius";
const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * Vendor map on MapLibre GL + OpenFreeMap tiles, with mapcn-style React markers drawn over the canvas:
 * custom pins (default / certified / selected / saved), screen-space clustering, a geodesic radius ring,
 * fly-to from the list, "Search this area", current location and a failure fallback (PRD §06).
 */
export default function VendorMap({
    center, radiusKm, pins, selectedId, hoveredId, focus, loading, outage,
    onSelect, onOpen, onSearchArea, onToggleOutage, onNotify,
}: VendorMapProps) {
    const container = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [, setFrame] = useState(0); // bumps on every camera move so the overlay markers follow the map
    const [moved, setMoved] = useState(false);
    const [zoomBounds, setZoomBounds] = useState({ atMin: false, atMax: false });
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    // Create the map once per attempt; "Retry map" after a failure builds a fresh one.
    useEffect(() => {
        if (outage || !container.current) return;
        let cancelled = false;
        let map: MapLibreMap | null = null;
        let loadTimer = 0;
        setReady(false);
        setFailed(false);

        import("maplibre-gl").then(({ default: maplibregl }) => {
            if (cancelled || !container.current) return;
            const start = center ?? DEFAULT_CENTER;
            try {
                map = new maplibregl.Map({
                    container: container.current,
                    style: MAP_STYLE_URL,
                    center: [start.lng, start.lat],
                    zoom: 10,
                    minZoom: 3,
                    maxZoom: 18,
                    attributionControl: { compact: true },
                    dragRotate: false,
                    pitchWithRotate: false,
                    renderWorldCopies: false,
                });
            } catch (error) {
                console.warn("[VendorMap] could not start the map", error); // e.g. WebGL unavailable
                setFailed(true);
                return;
            }
            map.touchZoomRotate.disableRotation();
            mapRef.current = map;

            loadTimer = window.setTimeout(() => { if (!map?.loaded()) setFailed(true); }, 15000);
            const sync = () => {
                if (!map) return;
                setFrame((n) => n + 1);
                setZoomBounds({ atMin: map.getZoom() <= map.getMinZoom() + 0.01, atMax: map.getZoom() >= map.getMaxZoom() - 0.01 });
            };

            map.on("load", () => {
                window.clearTimeout(loadTimer);
                if (!map) return;
                map.addSource(RADIUS_SOURCE, { type: "geojson", data: EMPTY_FC });
                map.addLayer({ id: "vm-radius-fill", type: "fill", source: RADIUS_SOURCE, paint: { "fill-color": "#2563eb", "fill-opacity": 0.14 } });
                map.addLayer({ id: "vm-radius-line", type: "line", source: RADIUS_SOURCE, paint: { "line-color": "#2563eb", "line-width": 2.5, "line-opacity": 0.95 } });
                setReady(true);
                sync();
            });
            map.on("error", (e) => {
                // A missing tile is recoverable; a style that never loads is an outage.
                if (map && !map.loaded()) {
                    console.warn("[VendorMap] map failed to load", e.error);
                    window.clearTimeout(loadTimer);
                    setFailed(true);
                }
            });
            map.on("move", sync);
            map.on("dragstart", () => setMoved(true));
            map.on("zoomend", (e) => { if ((e as { originalEvent?: Event }).originalEvent) setMoved(true); });
            map.on("click", () => onSelectRef.current(null)); // markers live in the overlay, so canvas clicks are "empty map"
        });

        return () => {
            cancelled = true;
            window.clearTimeout(loadTimer);
            map?.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [outage, attempt]);

    // New search: draw the radius ring and frame it (or frame the pins for entire city / state).
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !ready) return;
        const ring = center && radiusKm ? circlePolygon(center, radiusKm) : null;
        (map.getSource(RADIUS_SOURCE) as GeoJSONSource | undefined)?.setData(ring ? { type: "FeatureCollection", features: [ring] } : EMPTY_FC);
        if (ring) {
            map.fitBounds(boundsOf(ring.geometry.coordinates[0] as Array<[number, number]>), { padding: 48, duration: 600 });
        } else if (center) {
            const located = pins.filter((p) => p.vendor.lat != null && p.vendor.lng != null).map((p) => [p.vendor.lng!, p.vendor.lat!] as [number, number]);
            if (located.length > 1) map.fitBounds(boundsOf(located), { padding: 72, maxZoom: 13, duration: 600 });
            else map.flyTo({ center: [center.lng, center.lat], zoom: 11, duration: 600 });
        }
        setMoved(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, center?.lat, center?.lng, radiusKm]);

    // "Show on map" from a vendor card.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !ready || !focus) return;
        const pin = pins.find((p) => p.vendor.id === focus.id);
        if (pin?.vendor.lat != null && pin.vendor.lng != null) {
            map.flyTo({ center: [pin.vendor.lng, pin.vendor.lat], zoom: Math.max(map.getZoom(), 13), duration: 700 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, focus?.n]);

    const locate = useCallback(() => {
        if (!("geolocation" in navigator)) {
            onNotify("Current location isn't available in this browser. Enter a city instead.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13, duration: 700 });
                setMoved(true);
            },
            () => onNotify("Location permission was denied. Enter a city, area or pincode instead."),
            { timeout: 8000 },
        );
    }, [onNotify]);

    if (outage || failed) {
        return (
            <div className="vm-map vm-map--down" role="region" aria-label="Map">
                <div className="vm-map-down">
                    <MapPinOff size={28} aria-hidden="true" />
                    <strong>The map couldn&apos;t load</strong>
                    <p>You can keep searching and browsing vendors in the list. Locations will show again once the map is back.</p>
                    <button type="button" className="vm-btn" onClick={() => { if (outage) onToggleOutage(); else setAttempt((n) => n + 1); }}>
                        <RotateCw size={16} /> Retry map
                    </button>
                </div>
            </div>
        );
    }

    // Project markers to screen space on every render (the frame counter re-renders us as the camera moves).
    const map = ready ? mapRef.current : null;
    const placed = map
        ? pins
            .filter((p) => p.vendor.lat !== null && p.vendor.lng !== null) // never draw an inaccurate pin
            .map((p) => ({ ...p, ...map.project([p.vendor.lng!, p.vendor.lat!]) }))
        : [];
    const clusters: Array<{ x: number; y: number; members: typeof placed }> = [];
    for (const p of placed) {
        const g = p.vendor.id === selectedId ? undefined
            : clusters.find((c) => c.members[0].vendor.id !== selectedId && Math.hypot(c.x - p.x, c.y - p.y) < CLUSTER_PX);
        if (g) {
            g.members.push(p);
            g.x = g.members.reduce((s, m) => s + m.x, 0) / g.members.length;
            g.y = g.members.reduce((s, m) => s + m.y, 0) / g.members.length;
        } else clusters.push({ x: p.x, y: p.y, members: [p] });
    }
    const origin = map && center ? map.project([center.lng, center.lat]) : null;
    const selected = placed.find((p) => p.vendor.id === selectedId) ?? null;
    const zoomBy = (delta: number) => {
        const m = mapRef.current;
        if (!m) return;
        m.easeTo({ zoom: m.getZoom() + delta, duration: 250 });
        setMoved(true);
    };

    return (
        <div className="vm-map" role="region" aria-label="Vendor map">
            <div ref={container} className="vm-map-canvas" />
            {loading || !ready ? <div className="vm-map-loading" aria-hidden="true" /> : null}

            <div className="vm-map-overlay">
                {origin ? <span className="vm-map-origin" style={{ left: origin.x, top: origin.y }} aria-hidden="true" /> : null}

                {clusters.map((c) => {
                    if (c.members.length > 1) {
                        return (
                            <button
                                key={c.members.map((m) => m.vendor.id).join("|")}
                                type="button"
                                className="vm-cluster"
                                style={{ left: c.x, top: c.y }}
                                aria-label={`${c.members.length} vendors here. Zoom in`}
                                onClick={() => {
                                    const m = mapRef.current;
                                    if (!m) return;
                                    m.easeTo({ center: m.unproject([c.x, c.y]), zoom: m.getZoom() + 2, duration: 400 });
                                    setMoved(true);
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
                            style={{ left: p.x, top: p.y }}
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
                    <div className="vm-map-preview" style={{ left: selected.x, top: selected.y }} role="dialog" aria-label={`${selected.vendor.name} preview`}>
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
            </div>

            {moved && ready ? (
                <button
                    type="button"
                    className="vm-map-area"
                    onClick={() => {
                        const c = mapRef.current?.getCenter();
                        if (!c) return;
                        setMoved(false);
                        onSearchArea({ lat: c.lat, lng: c.lng });
                    }}
                >
                    <Search size={15} /> Search this area
                </button>
            ) : null}

            <div className="vm-map-controls">
                <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1)} disabled={!ready || zoomBounds.atMax}><Plus size={17} /></button>
                <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-1)} disabled={!ready || zoomBounds.atMin}><Minus size={17} /></button>
                <button type="button" aria-label="Use my current location" className="vm-map-locate" onClick={locate} disabled={!ready}><LocateFixed size={17} /></button>
            </div>

            <div className="vm-map-legend" aria-label="Map legend">
                <span><i className="vm-dot" /> Vendors</span>
                <span><i className="vm-dot vm-dot--certified" /> Certified</span>
                <span><i className="vm-dot vm-dot--selected" /> Selected</span>
                <span><i className="vm-dot vm-dot--saved" /> Saved</span>
            </div>
        </div>
    );
}
