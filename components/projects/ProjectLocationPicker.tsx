"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/** Address parts the project form stores. `lat`/`lng` locate the pin on the map. */
export interface PickedAddress {
    address?: string;
    addressLine2?: string;
    city?: string;
    town?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    lat: number;
    lng: number;
}

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const NOMINATIM = "https://nominatim.openstreetmap.org";
const INDIA_CENTER: [number, number] = [78.9629, 20.5937];

type NominatimAddress = Record<string, string | undefined>;

/** Turns an OpenStreetMap (Nominatim) address into the project's address fields. */
export function toProjectAddress(a: NominatimAddress, lat: number, lng: number): PickedAddress {
    const line1 = [a.house_number, a.building, a.road].filter(Boolean).join(" ").trim();
    const line2 = [a.neighbourhood, a.suburb].filter(Boolean).join(", ");
    const city = a.city || a.state_district || a.county || "";
    const town = a.town || a.village || a.suburb || "";
    return {
        address: line1 || undefined,
        addressLine2: line2 || undefined,
        city: city || undefined,
        town: town && town !== city ? town : undefined,
        state: a.state || undefined,
        postalCode: a.postcode || undefined,
        country: a.country || undefined,
        lat,
        lng,
    };
}

async function reverseGeocode(lat: number, lng: number): Promise<PickedAddress> {
    const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("lookup failed");
    const body = await r.json();
    return toProjectAddress(body.address || {}, lat, lng);
}

/**
 * Project location: a MapLibre map (OpenFreeMap tiles, no key) with a draggable pin.
 * "Use current location" asks the browser for the position; searching or moving the pin
 * looks up the address and hands it to the form, where every field stays editable.
 */
export default function ProjectLocationPicker({
    value,
    onPick,
}: {
    value: { lat: number; lng: number } | null;
    onPick: (address: PickedAddress) => void;
}) {
    const container = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const onPickRef = useRef(onPick);
    onPickRef.current = onPick;
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState<"locate" | "search" | "lookup" | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const lookup = async (lat: number, lng: number) => {
        setBusy("lookup");
        setStatus(null);
        try {
            onPickRef.current(await reverseGeocode(lat, lng));
        } catch {
            onPickRef.current({ lat, lng });
            setStatus("Pin placed. We couldn't look up the address, so fill it in below.");
        } finally {
            setBusy(null);
        }
    };

    const placePin = (lat: number, lng: number, zoom = 15) => {
        const map = mapRef.current;
        if (!map) return;
        import("maplibre-gl").then(({ default: maplibregl }) => {
            if (!markerRef.current) {
                markerRef.current = new maplibregl.Marker({ color: "#2563eb", draggable: true }).setLngLat([lng, lat]).addTo(map);
                markerRef.current.on("dragend", () => {
                    const p = markerRef.current!.getLngLat();
                    void lookup(p.lat, p.lng);
                });
            } else {
                markerRef.current.setLngLat([lng, lat]);
            }
            map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), zoom), duration: 600 });
        });
    };

    useEffect(() => {
        if (!container.current) return;
        let cancelled = false;
        let map: MapLibreMap | null = null;
        const timer = window.setTimeout(() => { if (!map?.isStyleLoaded()) setFailed(true); }, 25000);
        import("maplibre-gl").then(({ default: maplibregl }) => {
            if (cancelled || !container.current) return;
            try {
                map = new maplibregl.Map({
                    container: container.current,
                    style: MAP_STYLE_URL,
                    center: value ? [value.lng, value.lat] : INDIA_CENTER,
                    zoom: value ? 15 : 4,
                    attributionControl: { compact: true },
                    dragRotate: false,
                });
            } catch {
                setFailed(true);
                return;
            }
            map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
            mapRef.current = map;
            map.on("load", () => {
                window.clearTimeout(timer);
                setReady(true);
                if (value) placePin(value.lat, value.lng);
            });
            map.on("click", (e) => {
                placePin(e.lngLat.lat, e.lngLat.lng, map!.getZoom());
                void lookup(e.lngLat.lat, e.lngLat.lng);
            });
        });
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            markerRef.current = null;
            map?.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const useCurrentLocation = () => {
        if (!("geolocation" in navigator)) {
            setStatus("This browser can't share its location. Search for the address or fill it in below.");
            return;
        }
        setBusy("locate");
        setStatus(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                placePin(latitude, longitude, 16);
                void lookup(latitude, longitude);
            },
            (err) => {
                setBusy(null);
                setStatus(err.code === err.PERMISSION_DENIED
                    ? "Location access was blocked. Allow it in the browser, or search for the address instead."
                    : "We couldn't get your location. Search for the address or fill it in below.");
            },
            { enableHighAccuracy: true, timeout: 15000 },
        );
    };

    const search = async () => {
        const q = query.trim();
        if (!q) return;
        setBusy("search");
        setStatus(null);
        try {
            const r = await fetch(`${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
            const hits = r.ok ? await r.json() : [];
            if (!hits.length) {
                setStatus("No match for that address. Try a nearby landmark, area or PIN code.");
                return;
            }
            const lat = Number(hits[0].lat);
            const lng = Number(hits[0].lon);
            placePin(lat, lng, 16);
            onPickRef.current(toProjectAddress(hits[0].address || {}, lat, lng));
        } catch {
            setStatus("Address search isn't available right now. Fill in the address below.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="project-location-picker">
            <div className="project-location-toolbar">
                <form
                    className="project-location-search"
                    onSubmit={(e) => { e.preventDefault(); void search(); }}
                    role="search"
                >
                    <Search size={16} aria-hidden="true" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search address, area or PIN code"
                        aria-label="Search for the project address"
                        disabled={failed}
                    />
                    <button type="submit" disabled={!query.trim() || busy !== null || failed}>
                        {busy === "search" ? <Loader2 size={14} className="spin" /> : "Find"}
                    </button>
                </form>
                <button type="button" className="project-location-locate" onClick={useCurrentLocation} disabled={busy !== null || failed}>
                    {busy === "locate" ? <Loader2 size={16} className="spin" /> : <Crosshair size={16} />}
                    Use current location
                </button>
            </div>
            <div className="project-location-map">
                <div ref={container} className="project-location-canvas" />
                {failed ? (
                    <div className="project-location-fallback">
                        <MapPin size={20} aria-hidden="true" />
                        <span>The map couldn&apos;t load. Fill in the address below.</span>
                    </div>
                ) : !ready ? (
                    <div className="project-location-fallback"><Loader2 size={20} className="spin" /> <span>Loading map…</span></div>
                ) : null}
            </div>
            <p className="project-field-helper" role="status">
                {busy === "lookup" ? "Looking up the address…" : status ?? "Click the map or drag the pin to set the site. Address fields below fill in automatically and stay editable."}
            </p>
        </div>
    );
}
