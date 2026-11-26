"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    AlertCircle, ArrowLeft, Bookmark, ChevronDown, Crosshair, FileText, GitCompare, History, List as ListIcon, Lock, MapPin,
    Plus, Search, Share2, SlidersHorizontal, Trash2, X,
} from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import VendorMap, { type MapPin as Pin } from "@/components/vendors/VendorMap";
import { AddToListModal, BoqModal, CompareModal, ContactDetails, FilterDrawer, NewListModal } from "@/components/vendors/VendorDialogs";
import { Modal, Toast, VendorCard, VendorLogo, TrustBadges, timeAgo, useVendorStore } from "@/components/vendors/VendorUi";
import {
    CATEGORIES, CATEGORY_LABEL, PLACES, POPULAR_CITIES, RADIUS_OPTIONS, SAMPLE_PROJECTS, getPlace, getVendor, isCertified, isDiscoverable,
    type Place, type RadiusOption, type Vendor,
} from "@/lib/vendors/data";
import {
    EMPTY_ADVANCED, QUICK_FILTERS, SORT_OPTIONS, countAdvanced, distanceKm, searchVendors, suggestMaterials, suggestPlaces,
    type AdvancedFilters, type QuickFilter, type SearchHit, type SortKey,
} from "@/lib/vendors/search";
import { deleteList, getUnlockedContact, removeFromList, setListNotes, setListShared, toggleSaved, toggleShortlist } from "@/lib/vendors/store";
import "./vendors.css";

export type MarketTab = "discover" | "saved" | "recent" | "requests" | "lists";

/** PRD §02 internal navigation. Vendor Details is its own route (/vendors/[id]). */
const TABS: Array<{ id: MarketTab; label: string; icon: typeof Search; title: string; subtitle: string }> = [
    { id: "discover", label: "Discover Vendors", icon: Search, title: "Find the Right Vendors", subtitle: "Discover verified suppliers and specialists for your projects, wherever they are." },
    { id: "saved", label: "Saved Vendors", icon: Bookmark, title: "Saved Vendors", subtitle: "Vendors you have bookmarked, ready to compare." },
    { id: "recent", label: "Recently Viewed", icon: History, title: "Recently Viewed", subtitle: "Pick up where you left off." },
    { id: "requests", label: "Contact Requests", icon: Lock, title: "Contact Requests", subtitle: "History of OTP-verified contact disclosures." },
    { id: "lists", label: "My Sourcing Lists", icon: ListIcon, title: "My Sourcing Lists", subtitle: "Organised collections of vendors by project and material." },
];

const SEARCH_KEY = "boq.vendors.search";

interface Submitted {
    query: string;
    place: Place | null;
    center: { lat: number; lng: number } | null;
    radius: RadiusOption;
    areaSearch: boolean;
}

function VendorMarketplaceInner() {
    const router = useRouter();
    const params = useSearchParams();
    const store = useVendorStore();
    const tab = (TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "discover") as MarketTab;
    const meta = TABS.find((t) => t.id === tab)!;

    const [toast, setToast] = useState<string | null>(null);
    const notify = useCallback((m: string) => setToast(m), []);
    const [boqOpen, setBoqOpen] = useState(false);
    const [listFor, setListFor] = useState<Vendor | null>(null);
    const [listProject, setListProject] = useState<string | null>(null);

    // Discover state
    const [query, setQuery] = useState("");
    const [locText, setLocText] = useState("");
    const [place, setPlace] = useState<Place | null>(null);
    const [radius, setRadius] = useState<RadiusOption>(25);
    const [quick, setQuick] = useState<QuickFilter[]>([]);
    const [advanced, setAdvanced] = useState<AdvancedFilters>(EMPTY_ADVANCED);
    const [sort, setSort] = useState<SortKey>("relevance");
    const [submitted, setSubmitted] = useState<Submitted | null>(null);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
    const [outage, setOutage] = useState(false);
    const [mobileView, setMobileView] = useState<"list" | "map">("list");
    const restored = useRef(false);

    const setTab = (next: MarketTab, extra?: Record<string, string>) => {
        const sp = new URLSearchParams({ tab: next, ...extra });
        router.push(`/vendors?${sp.toString()}`);
    };

    const run = useCallback((s: Submitted) => {
        setSubmitted(s);
        setSelectedId(null);
        setLoading(true);
        window.setTimeout(() => setLoading(false), 380);
    }, []);

    // Deep links (?q=&loc=&radius=) from BOQs and other modules, else restore the last search for this session.
    useEffect(() => {
        if (restored.current) return;
        restored.current = true;
        const q = params.get("q");
        const loc = params.get("loc");
        if (q || loc) {
            const p = loc ? getPlace(loc) : null;
            const r = params.get("radius");
            const rad = (r === "city" || r === "state" ? r : r ? Number(r) : 25) as RadiusOption;
            setQuery(q ?? "");
            setPlace(p);
            setLocText(p?.label ?? "");
            setRadius(rad);
            run({ query: q ?? "", place: p, center: p ? { lat: p.lat, lng: p.lng } : null, radius: rad, areaSearch: false });
            return;
        }
        try {
            const saved = sessionStorage.getItem(SEARCH_KEY);
            if (!saved) return;
            const s = JSON.parse(saved) as Submitted & { quick: QuickFilter[]; advanced: AdvancedFilters; sort: SortKey };
            setQuery(s.query);
            setPlace(s.place);
            setLocText(s.areaSearch ? "Map area" : s.place?.label ?? "");
            setRadius(s.radius);
            setQuick(s.quick ?? []);
            setAdvanced({ ...EMPTY_ADVANCED, ...s.advanced });
            setSort(s.sort ?? "relevance");
            setSubmitted({ query: s.query, place: s.place, center: s.center, radius: s.radius, areaSearch: s.areaSearch });
        } catch {
            // ignore malformed session state
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!submitted) return;
        try {
            sessionStorage.setItem(SEARCH_KEY, JSON.stringify({ ...submitted, quick, advanced, sort }));
        } catch {
            // ignore
        }
    }, [submitted, quick, advanced, sort]);

    const result = useMemo(() => (submitted ? searchVendors({ ...submitted, quick, advanced, sort }) : null), [submitted, quick, advanced, sort]);
    const hits = useMemo(() => (result ? [...result.exact, ...result.related] : []), [result]);

    const submit = (override?: Partial<Submitted>) => {
        const q = (override?.query ?? query).trim();
        let p = override && "place" in override ? override.place ?? null : place;
        if (!p && locText.trim() && !override) {
            const guess = suggestPlaces(locText, PLACES)[0];
            if (!guess) {
                setFormError("We couldn't find that location. Pick a city, area or pincode from the suggestions.");
                return;
            }
            p = guess;
            setPlace(guess);
            setLocText(guess.label);
        }
        if (!q && !p) {
            setFormError("Enter a material or vendor, or a location to search.");
            return;
        }
        setFormError(null);
        const r = override?.radius ?? radius;
        const center = override?.center ?? (p ? { lat: p.lat, lng: p.lng } : null);
        const rad = (!p || !p.city) && (r === "city" || r === "state") ? 25 : r;
        if (rad !== r) setRadius(rad);
        run({ query: q, place: p, center, radius: rad, areaSearch: false });
        notify(`Searching “${q || "all vendors"}”${p ? ` near ${p.city || p.label}` : " in all cities"}`);
    };

    const toggleQuick = (f: QuickFilter) => setQuick((qs) => (qs.includes(f) ? qs.filter((x) => x !== f) : [...qs, f]));
    const clearAll = () => { setQuick([]); setAdvanced(EMPTY_ADVANCED); };
    const filterCount = quick.length + countAdvanced(advanced);

    const save = (v: Vendor) => notify(toggleSaved(v.id) ? `${v.name} saved.` : `${v.name} removed from saved vendors.`);
    const openVendor = (id: string) => router.push(`/vendors/${id}`);
    const addToListFor = (v: Vendor, projectId?: string | null) => { setListFor(v); setListProject(projectId ?? null); };

    const savedIds = useMemo(() => new Set(store.saved.map((s) => s.vendorId)), [store.saved]);
    const pins: Pin[] = hits.map((h) => ({ vendor: h.vendor, certified: h.certified, saved: savedIds.has(h.vendor.id), distanceKm: h.distanceKm }));
    const radiusKm = submitted && typeof submitted.radius === "number" ? submitted.radius : null;

    const findFromBoq = (q: string, placeId: string, projectId: string) => {
        const p = getPlace(placeId);
        setBoqOpen(false);
        setQuery(q);
        setPlace(p);
        setLocText(p?.label ?? "");
        setListProject(projectId);
        if (tab !== "discover") router.push("/vendors?tab=discover");
        run({ query: q, place: p, center: p ? { lat: p.lat, lng: p.lng } : null, radius, areaSearch: false });
        notify(`Showing vendors for ${q} near ${p?.city}.`);
    };

    return (
        <main className={`fig-dashboard vm-page${tab === "discover" ? " vm-page--fit" : ""}`}>
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/vendors" />
            <div className="fig-dashboard-main">
                <DashboardHeader title={meta.title} hideNew />

                <div className="vm-tabbar">
                <nav className="vm-tabs" aria-label="Vendor Marketplace">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} type="button" className={tab === t.id ? "is-current" : ""} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
                                <Icon size={16} aria-hidden="true" /> {t.label}
                                {t.id === "saved" && store.saved.length ? <span className="vm-tab-count">{store.saved.length}</span> : null}
                            </button>
                        );
                    })}
                </nav>
                    <span className="vm-tabbar-end">
                        <span className="vm-tabbar-sub">{meta.subtitle}</span>
                        <button type="button" className="vm-btn" onClick={() => setBoqOpen(true)}><FileText size={17} /> Find from BOQ</button>
                    </span>
                </div>

                {tab === "discover" ? (
                    <>
                        <SearchPanel
                            query={query} setQuery={setQuery} locText={locText} setLocText={(t) => { setLocText(t); setPlace(null); }}
                            place={place} onPickPlace={(p) => { setPlace(p); setLocText(p.label); setFormError(null); }}
                            radius={radius} setRadius={(r) => { setRadius(r); if (submitted) run({ ...submitted, radius: r }); }}
                            quick={quick} toggleQuick={toggleQuick} filterCount={filterCount} onClear={clearAll}
                            onSubmit={() => submit()} onOpenFilters={() => setFiltersOpen(true)} error={formError} onNotify={notify}
                            onCurrentLocation={(p) => { setPlace(p); setLocText(p.label); }}
                        />

                        <div className="vm-mobile-toggle" role="group" aria-label="Results view">
                            <button type="button" className={mobileView === "list" ? "is-on" : ""} aria-pressed={mobileView === "list"} onClick={() => setMobileView("list")}>List</button>
                            <button type="button" className={mobileView === "map" ? "is-on" : ""} aria-pressed={mobileView === "map"} onClick={() => setMobileView("map")}>Map</button>
                        </div>

                        <section className={`vm-split vm-split--${mobileView}`}>
                            <div className="vm-results" aria-live="polite" aria-busy={loading}>
                                {!submitted ? (
                                    <DiscoverEmpty
                                        onCategory={(label) => { setQuery(label); if (place) submit({ query: label, place }); }}
                                        onCity={(p) => { setPlace(p); setLocText(p.label); submit({ query, place: p }); }}
                                    />
                                ) : loading ? (
                                    <ResultsSkeleton />
                                ) : (
                                    <Results
                                        submitted={submitted} result={result!} sort={sort} setSort={setSort} savedIds={savedIds}
                                        selectedId={selectedId} hoveredId={hoveredId}
                                        onHover={setHoveredId} onOpen={openVendor} onSave={save} onAddToList={(v) => addToListFor(v, listProject)}
                                        onLocate={(v) => { setSelectedId(v.id); setFocus({ id: v.id, n: Date.now() }); setMobileView("map"); }}
                                        onExpand={(r) => { setRadius(r); run({ ...submitted, radius: r }); }}
                                        onCity={(city) => { const p = PLACES.find((x) => x.kind === "city" && x.city === city); if (p) { setPlace(p); setLocText(p.label); run({ ...submitted, place: p, center: { lat: p.lat, lng: p.lng }, areaSearch: false }); } }}
                                        onClearFilters={filterCount ? clearAll : undefined}
                                    />
                                )}
                            </div>
                            <VendorMap
                                center={submitted?.center ?? null}
                                radiusKm={radiusKm}
                                pins={pins}
                                selectedId={selectedId}
                                hoveredId={hoveredId}
                                focus={focus}
                                loading={loading}
                                outage={outage}
                                onSelect={setSelectedId}
                                onOpen={openVendor}
                                onToggleOutage={() => setOutage((o) => !o)}
                                onNotify={notify}
                                onSearchArea={(center) => {
                                    const r = typeof radius === "number" ? radius : 25;
                                    setRadius(r);
                                    setLocText("Map area");
                                    run({ query: submitted?.query ?? query.trim(), place: submitted?.place ?? place, center, radius: r, areaSearch: true });
                                }}
                            />
                        </section>
                    </>
                ) : tab === "saved" ? (
                    <SavedTab onOpen={openVendor} onSave={save} onAddToList={(v) => addToListFor(v)} onNotify={notify} />
                ) : tab === "recent" ? (
                    <RecentTab onOpen={openVendor} onSave={save} onAddToList={(v) => addToListFor(v)} onDiscover={() => setTab("discover")} />
                ) : tab === "requests" ? (
                    <RequestsTab onOpen={openVendor} onNotify={notify} onDiscover={() => setTab("discover")} />
                ) : (
                    <ListsTab
                        listId={params.get("list")}
                        onOpenList={(id) => setTab("lists", id ? { list: id } : {})}
                        onOpen={openVendor}
                        onNotify={notify}
                        onFindVendors={(location, category) => {
                            const p = PLACES.find((x) => x.kind === "city" && x.city === location) ?? null;
                            const q = category ? CATEGORY_LABEL[category] ?? "" : "";
                            router.push(`/vendors?tab=discover`);
                            setQuery(q);
                            setPlace(p);
                            setLocText(p?.label ?? "");
                            run({ query: q, place: p, center: p ? { lat: p.lat, lng: p.lng } : null, radius, areaSearch: false });
                        }}
                    />
                )}
            </div>

            <FilterDrawer open={filtersOpen} value={advanced} onClose={() => setFiltersOpen(false)} onApply={(f) => { setAdvanced(f); setFiltersOpen(false); }} />
            <BoqModal open={boqOpen} onClose={() => setBoqOpen(false)} onFind={findFromBoq} />
            <AddToListModal
                vendor={listFor}
                open={!!listFor}
                defaultProjectId={listProject}
                onClose={() => setListFor(null)}
                onDone={(m) => { setListFor(null); notify(m); }}
            />
            <Toast message={toast} onDone={() => setToast(null)} />
        </main>
    );
}

/* Search panel ---------------------------------------------------------------------------------- */

function SearchPanel(props: {
    query: string; setQuery: (v: string) => void; locText: string; setLocText: (v: string) => void; place: Place | null;
    onPickPlace: (p: Place) => void; radius: RadiusOption; setRadius: (r: RadiusOption) => void;
    quick: QuickFilter[]; toggleQuick: (f: QuickFilter) => void; filterCount: number; onClear: () => void;
    onSubmit: () => void; onOpenFilters: () => void; error: string | null; onNotify: (m: string) => void; onCurrentLocation: (p: Place) => void;
}) {
    const { query, setQuery, locText, setLocText, place, onPickPlace, radius, setRadius, quick, toggleQuick, filterCount, onClear, onSubmit, onOpenFilters, error } = props;
    const [openBox, setOpenBox] = useState<"what" | "where" | "radius" | null>(null);
    const [cursor, setCursor] = useState(0);
    const panel = useRef<HTMLFormElement>(null);
    const materialSuggestions = useMemo(() => suggestMaterials(query), [query]);
    const placeSuggestions = useMemo(() => suggestPlaces(place ? "" : locText, PLACES), [locText, place]);

    useEffect(() => {
        const close = (e: MouseEvent) => { if (panel.current && !panel.current.contains(e.target as Node)) setOpenBox(null); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);
    useEffect(() => setCursor(0), [openBox, query, locText]);

    const keyNav = (e: ReactKeyboardEvent, count: number, pick: (i: number) => void) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(count - 1, c + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
        else if (e.key === "Enter" && count && openBox) { e.preventDefault(); pick(cursor); }
        else if (e.key === "Escape") setOpenBox(null);
    };

    const useCurrentLocation = () => {
        if (!("geolocation" in navigator)) return props.onNotify("Current location isn't available. Enter a city instead.");
        navigator.geolocation.getCurrentPosition(
            (pos) => props.onCurrentLocation({ id: "current", label: "Current location", kind: "area", city: "", state: "", lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => props.onNotify("Location permission was denied. Enter a city, area or pincode instead."),
            { timeout: 8000 },
        );
    };

    const radiusLabel = RADIUS_OPTIONS.find((r) => r.value === radius)?.label ?? "25 km";

    return (
        <form ref={panel} className="vm-search" onSubmit={(e) => { e.preventDefault(); setOpenBox(null); onSubmit(); }} role="search">
            <div className="vm-search-row">
                <div className={`vm-search-field${openBox === "what" ? " is-focus" : ""}`}>
                    <Search size={18} aria-hidden="true" />
                    <label>
                        <span>What are you sourcing?</span>
                        <input
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setOpenBox("what"); }}
                            onFocus={() => setOpenBox("what")}
                            onKeyDown={(e) => keyNav(e, materialSuggestions.length, (i) => { setQuery(materialSuggestions[i].label); setOpenBox(null); })}
                            placeholder="Search materials, products or vendors"
                            role="combobox"
                            aria-expanded={openBox === "what" && materialSuggestions.length > 0}
                            aria-controls="vm-what-list"
                            autoComplete="off"
                        />
                    </label>
                    {query ? <button type="button" className="vm-clear" aria-label="Clear material" onClick={() => setQuery("")}><X size={15} /></button> : null}
                    {openBox === "what" && materialSuggestions.length ? (
                        <ul id="vm-what-list" className="vm-suggest" role="listbox">
                            {materialSuggestions.map((s, i) => (
                                <li key={s.label} role="option" aria-selected={i === cursor} className={i === cursor ? "is-cursor" : ""} onMouseDown={(e) => { e.preventDefault(); setQuery(s.label); setOpenBox(null); }}>
                                    {s.kind === "vendor" ? <Bookmark size={14} /> : <Search size={14} />} <span>{s.label}</span><small>{s.hint}</small>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                <div className={`vm-search-field${openBox === "where" ? " is-focus" : ""}`}>
                    <MapPin size={18} aria-hidden="true" />
                    <label>
                        <span>Where are you sourcing?</span>
                        <input
                            value={locText}
                            onChange={(e) => { setLocText(e.target.value); setOpenBox("where"); }}
                            onFocus={() => setOpenBox("where")}
                            onKeyDown={(e) => keyNav(e, placeSuggestions.length, (i) => { onPickPlace(placeSuggestions[i]); setOpenBox(null); })}
                            placeholder="City, area or pincode"
                            role="combobox"
                            aria-expanded={openBox === "where"}
                            aria-controls="vm-where-list"
                            autoComplete="off"
                        />
                    </label>
                    <button type="button" className="vm-clear" aria-label="Use my current location" title="Use my current location" onClick={useCurrentLocation}><Crosshair size={16} /></button>
                    {openBox === "where" ? (
                        <ul id="vm-where-list" className="vm-suggest" role="listbox">
                            {placeSuggestions.length ? placeSuggestions.map((p, i) => (
                                <li key={p.id} role="option" aria-selected={i === cursor} className={i === cursor ? "is-cursor" : ""} onMouseDown={(e) => { e.preventDefault(); onPickPlace(p); setOpenBox(null); }}>
                                    <MapPin size={14} /> <span>{p.label}</span><small>{p.kind.toUpperCase()}</small>
                                </li>
                            )) : <li className="vm-suggest-empty">No matching locations</li>}
                        </ul>
                    ) : null}
                </div>

                <div className="vm-search-field vm-search-radius">
                    <button type="button" aria-haspopup="listbox" aria-expanded={openBox === "radius"} onClick={() => setOpenBox(openBox === "radius" ? null : "radius")}>
                        <span>Radius</span>
                        <strong>{radiusLabel}</strong>
                        <ChevronDown size={16} aria-hidden="true" />
                    </button>
                    {openBox === "radius" ? (
                        <ul className="vm-suggest" role="listbox" aria-label="Search radius">
                            {RADIUS_OPTIONS.map((r) => (
                                <li key={String(r.value)} role="option" aria-selected={r.value === radius} className={r.value === radius ? "is-selected" : ""}
                                    onMouseDown={(e) => { e.preventDefault(); setRadius(r.value); setOpenBox(null); }}>
                                    <span>{r.label}</span>{r.value === radius ? <small>✓</small> : null}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                <button type="submit" className="vm-btn vm-btn--primary vm-search-go"><Search size={18} /> Search</button>
                <button type="button" className={`vm-btn vm-search-filters${filterCount ? " is-active" : ""}`} onClick={onOpenFilters}>
                    <SlidersHorizontal size={17} /> Filters{filterCount ? ` (${filterCount})` : ""}
                </button>
            </div>
            {error ? <p className="vm-error vm-search-error" role="alert">{error}</p> : null}
            <div className="vm-quick" role="group" aria-label="Quick filters">
                {QUICK_FILTERS.map((f) => (
                    <button key={f.value} type="button" className={`vm-pill${quick.includes(f.value) ? " is-on" : ""}`} aria-pressed={quick.includes(f.value)} onClick={() => toggleQuick(f.value)}>
                        {f.label}
                    </button>
                ))}
                {filterCount ? <button type="button" className="vm-link vm-link--underline" onClick={onClear}>Clear filters</button> : null}
            </div>
        </form>
    );
}

/* Discover states ------------------------------------------------------------------------------- */

function DiscoverEmpty({ onCategory, onCity }: { onCategory: (label: string) => void; onCity: (p: Place) => void }) {
    return (
        <div className="vm-empty-start">
            <h3>Start your first sourcing search</h3>
            <p>Enter a city, pick a material and RVYO shows verified local suppliers, ranked by relevance, with their locations on the map.</p>
            <p className="vm-section-label">Popular categories</p>
            <div className="vm-cat-grid">
                {CATEGORIES.slice(0, 6).map((c) => (
                    <button key={c.key} type="button" className="vm-cat" onClick={() => onCategory(c.subcategories.includes("Italian Marble") ? "Italian Marble" : c.label)}>
                        <strong>{c.label}</strong>
                        <span>{c.subcategories.slice(0, 3).join(" · ")}</span>
                    </button>
                ))}
            </div>
            <p className="vm-section-label">Popular locations</p>
            <div className="vm-chips">
                {POPULAR_CITIES.map((id) => getPlace(id)!).map((p) => (
                    <button key={p.id} type="button" className="vm-pill" onClick={() => onCity(p)}><MapPin size={14} /> {p.city}</button>
                ))}
            </div>
        </div>
    );
}

function ResultsSkeleton() {
    return (
        <div className="vm-skeletons" aria-label="Loading vendors">
            {[0, 1, 2].map((i) => <div key={i} className="vm-skeleton"><span /><span /><span /></div>)}
        </div>
    );
}

function Results({
    submitted, result, sort, setSort, savedIds, selectedId, hoveredId, onHover, onOpen, onSave, onAddToList, onLocate, onExpand, onCity, onClearFilters,
}: {
    submitted: Submitted; result: ReturnType<typeof searchVendors>; sort: SortKey; setSort: (s: SortKey) => void; savedIds: Set<string>;
    selectedId: string | null; hoveredId: string | null; onHover: (id: string | null) => void; onOpen: (id: string) => void;
    onSave: (v: Vendor) => void; onAddToList: (v: Vendor) => void; onLocate: (v: Vendor) => void;
    onExpand: (r: RadiusOption) => void; onCity: (city: string) => void; onClearFilters?: () => void;
}) {
    const total = result.exact.length + result.related.length;
    const where = submitted.areaSearch ? "in this map area" : submitted.place ? `near ${submitted.place.city || "your location"}` : "in all cities";
    const nextRadius = typeof submitted.radius === "number" ? ([5, 10, 25, 50, 100] as const).find((r) => r > (submitted.radius as number)) ?? "state" : submitted.radius === "city" ? "state" : null;
    const nextLabel = RADIUS_OPTIONS.find((r) => r.value === nextRadius)?.label;

    const card = (h: SearchHit) => (
        <VendorCard
            key={h.vendor.id}
            vendor={h.vendor}
            certified={h.certified}
            distanceKm={h.distanceKm}
            saved={savedIds.has(h.vendor.id)}
            active={selectedId === h.vendor.id}
            highlighted={hoveredId === h.vendor.id}
            onOpen={() => onOpen(h.vendor.id)}
            onToggleSave={() => onSave(h.vendor)}
            onAddToList={() => onAddToList(h.vendor)}
            onLocate={() => onLocate(h.vendor)}
            onHover={(on) => onHover(on ? h.vendor.id : null)}
        />
    );

    return (
        <>
            <div className="vm-results-head">
                <p><strong>{total} vendor{total === 1 ? "" : "s"}</strong> {where}</p>
                <label className="vm-sort">
                    <span>Sort</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </label>
            </div>

            {result.certifiedOnly && total > 0 && total <= 3 ? (
                <div className="vm-notice">
                    <AlertCircle size={16} aria-hidden="true" />
                    <span>Only {total} RVYO-certified vendor{total === 1 ? "" : "s"} match your search.{nextLabel ? <> <button type="button" className="vm-link" onClick={() => onExpand(nextRadius!)}>Expand to {nextLabel}</button> to discover more suppliers.</> : null}</span>
                </div>
            ) : null}

            {total === 0 ? (
                <div className="vm-noresults">
                    <Search size={22} aria-hidden="true" />
                    <strong>{result.nearbyCities.length && !result.outsideRadius ? `No matching vendors in ${submitted.place?.city}` : `No vendors match “${submitted.query || "your search"}” ${where}`}</strong>
                    <p>
                        {result.certifiedOnly && result.outsideRadius === 0 ? "There are no RVYO-certified vendors here yet. Try verified vendors, which are clearly labelled. " : ""}
                        {result.outsideRadius ? `${result.outsideRadius} more vendor${result.outsideRadius === 1 ? "" : "s"} match outside this radius.` : "Try a related category, a wider area or fewer filters."}
                    </p>
                    <div className="vm-noresults-actions">
                        {nextLabel && result.outsideRadius ? <button type="button" className="vm-btn vm-btn--primary" onClick={() => onExpand(nextRadius!)}>Expand to {nextLabel}</button> : null}
                        {result.nearbyCities.map((c) => <button key={c} type="button" className="vm-btn" onClick={() => onCity(c)}><MapPin size={15} /> Try {c}</button>)}
                        {onClearFilters ? <button type="button" className="vm-btn" onClick={onClearFilters}>Clear filters</button> : null}
                    </div>
                </div>
            ) : (
                <div className="vm-card-list">
                    {result.exact.map(card)}
                    {result.related.length ? (
                        <>
                            <p className="vm-section-label vm-related-label">Related categories</p>
                            {result.related.map(card)}
                        </>
                    ) : null}
                </div>
            )}
        </>
    );
}

/* Saved vendors (PRD §10A) ---------------------------------------------------------------------- */

function SavedTab({ onOpen, onSave, onAddToList, onNotify }: { onOpen: (id: string) => void; onSave: (v: Vendor) => void; onAddToList: (v: Vendor) => void; onNotify: (m: string) => void }) {
    const store = useVendorStore();
    const [category, setCategory] = useState("");
    const [city, setCity] = useState("");
    const [picked, setPicked] = useState<string[]>([]);
    const [comparing, setComparing] = useState(false);
    const home = getPlace("hyd")!;

    const rows = store.saved.map((s) => ({ ...s, vendor: getVendor(s.vendorId) }));
    const cities = [...new Set(rows.map((r) => r.vendor?.city).filter(Boolean))] as string[];
    const visible = rows.filter((r) => !r.vendor || ((!category || r.vendor.categories.includes(category)) && (!city || r.vendor.city === city)));
    const pickedVendors = picked.map(getVendor).filter(Boolean) as Vendor[];

    if (!rows.length) {
        return <EmptyBlock icon={<Bookmark size={22} />} title="No saved vendors yet" text="Save vendors while you search to compare them and add them to sourcing lists." />;
    }

    return (
        <section className="vm-tab-body">
            <div className="vm-toolbar">
                <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                    <option value="">All categories</option>
                    {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by location">
                    <option value="">All locations</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="vm-muted">{visible.length} saved</span>
                <span className="vm-toolbar-end">
                    <span className="vm-muted">{picked.length ? `${picked.length} selected (2–4)` : "Select 2–4 vendors to compare"}</span>
                    <button type="button" className="vm-btn vm-btn--primary" disabled={picked.length < 2} onClick={() => setComparing(true)}><GitCompare size={16} /> Compare</button>
                </span>
            </div>
            <div className="vm-grid">
                {visible.map((r) => {
                    const v = r.vendor;
                    if (!v || !isDiscoverable(v)) {
                        return (
                            <article key={r.vendorId} className="vm-card vm-card--gone">
                                <div className="vm-card-top">
                                    <span className="vm-logo vm-logo--gone" aria-hidden="true"><AlertCircle size={18} /></span>
                                    <div className="vm-card-id">
                                        <h3>{v?.name ?? "Unknown vendor"}</h3>
                                        <p className="vm-muted">This vendor is no longer available in discovery.</p>
                                    </div>
                                </div>
                                <div><button type="button" className="vm-btn vm-btn--sm" onClick={() => { toggleSaved(r.vendorId); onNotify("Removed from saved vendors."); }}><Trash2 size={14} /> Remove</button></div>
                            </article>
                        );
                    }
                    const checked = picked.includes(v.id);
                    return (
                        <VendorCard
                            key={v.id}
                            vendor={v}
                            certified={isCertified(v)}
                            distanceKm={v.lat !== null && v.lng !== null && v.city === home.city ? distanceKm(home, { lat: v.lat, lng: v.lng }) : null}
                            saved
                            compact
                            footerNote={<span className="vm-muted">Saved {timeAgo(r.savedAt)}</span>}
                            selectable={{ checked, disabled: !checked && picked.length >= 4, onChange: () => setPicked((p) => (checked ? p.filter((x) => x !== v.id) : [...p, v.id])) }}
                            onOpen={() => onOpen(v.id)}
                            onToggleSave={() => { onSave(v); setPicked((p) => p.filter((x) => x !== v.id)); }}
                            onAddToList={() => onAddToList(v)}
                        />
                    );
                })}
            </div>
            {!visible.length ? <EmptyBlock title="No saved vendors match these filters" text="Change the category or location filter." /> : null}
            <CompareModal open={comparing} vendors={pickedVendors} certifiedOf={(v) => isCertified(v)} onClose={() => setComparing(false)} />
        </section>
    );
}

/* Recently viewed ------------------------------------------------------------------------------- */

function RecentTab({ onOpen, onSave, onAddToList, onDiscover }: { onOpen: (id: string) => void; onSave: (v: Vendor) => void; onAddToList: (v: Vendor) => void; onDiscover: () => void }) {
    const store = useVendorStore();
    const savedIds = new Set(store.saved.map((s) => s.vendorId));
    const rows = store.recent.map((r) => ({ ...r, vendor: getVendor(r.vendorId) })).filter((r) => r.vendor && isDiscoverable(r.vendor));
    if (!rows.length) {
        return <EmptyBlock icon={<History size={22} />} title="Nothing viewed yet" text="Vendor profiles you open appear here." action={<button type="button" className="vm-btn vm-btn--primary" onClick={onDiscover}>Discover vendors</button>} />;
    }
    return (
        <section className="vm-tab-body">
            <div className="vm-grid">
                {rows.map(({ vendor: v, at }) => (
                    <VendorCard
                        key={v!.id}
                        vendor={v!}
                        certified={isCertified(v!)}
                        distanceKm={null}
                        saved={savedIds.has(v!.id)}
                        compact
                        footerNote={<span className="vm-muted">{timeAgo(at)}</span>}
                        onOpen={() => onOpen(v!.id)}
                        onToggleSave={() => onSave(v!)}
                        onAddToList={() => onAddToList(v!)}
                    />
                ))}
            </div>
        </section>
    );
}

/* Contact requests (PRD §09 access history) ----------------------------------------------------- */

function RequestsTab({ onOpen, onNotify, onDiscover }: { onOpen: (id: string) => void; onNotify: (m: string) => void; onDiscover: () => void }) {
    const store = useVendorStore();
    const [viewing, setViewing] = useState<Vendor | null>(null);
    const router = useRouter();
    const contact = viewing ? getUnlockedContact(viewing.id) : null;

    if (!store.disclosures.length) {
        return <EmptyBlock icon={<Lock size={22} />} title="No contact requests yet" text="When you verify with an OTP to reveal a vendor's contact details, the request is recorded here." action={<button type="button" className="vm-btn vm-btn--primary" onClick={onDiscover}>Discover vendors</button>} />;
    }

    return (
        <section className="vm-tab-body">
            <div className="vm-table-card">
                <table className="vm-table">
                    <thead>
                        <tr><th>Vendor</th><th>Requested by</th><th>Method</th><th>When</th><th>Status</th><th aria-label="Actions" /></tr>
                    </thead>
                    <tbody>
                        {store.disclosures.map((d) => {
                            const v = getVendor(d.vendorId);
                            const available = !!v && isDiscoverable(v);
                            return (
                                <tr key={d.id}>
                                    <td>
                                        <button type="button" className="vm-table-vendor" onClick={() => v && available && onOpen(v.id)} disabled={!available}>
                                            {v ? <VendorLogo vendor={v} size={32} /> : null}
                                            <span><strong>{v?.name ?? "Removed vendor"}</strong><small>{v ? `${v.area}, ${v.city}` : "No longer listed"}</small></span>
                                        </button>
                                    </td>
                                    <td>{d.requestedBy}</td>
                                    <td>{d.method === "email" ? "Email OTP" : "SMS OTP"}</td>
                                    <td>{timeAgo(d.at)}</td>
                                    <td><span className={`vm-status vm-status--${d.status}`}>{d.status === "success" ? "Success" : "Failed"}</span></td>
                                    <td className="vm-table-action">
                                        {!available ? <span className="vm-muted">Unavailable</span>
                                            : store.unlocked.includes(d.vendorId) && d.status === "success"
                                                ? <button type="button" className="vm-btn vm-btn--sm" onClick={() => setViewing(v!)}>View contact</button>
                                                : <button type="button" className="vm-btn vm-btn--sm" onClick={() => router.push(`/vendors/${d.vendorId}?contact=1`)}>Try again</button>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="vm-fine">Once verified, a vendor stays unlocked for your company account. Every disclosure is recorded against the individual who requested it.</p>
            <Modal open={!!viewing} onClose={() => setViewing(null)} labelledBy="vm-view-contact">
                {viewing ? (
                    <div className="vm-otp">
                        <h2 id="vm-view-contact">{viewing.name}</h2>
                        <TrustBadges certified={isCertified(viewing)} verified={!!viewing.verifiedOn} />
                        {contact ? (
                            <ContactDetails contact={contact} onCopy={(t) => { void navigator.clipboard?.writeText(t).then(() => onNotify("Number copied."), () => onNotify("Couldn't copy.")); }} />
                        ) : <p className="vm-error">This vendor has withdrawn its published contact details.</p>}
                    </div>
                ) : null}
            </Modal>
        </section>
    );
}

/* Sourcing lists (PRD §10B, §11) ---------------------------------------------------------------- */

function ListsTab({ listId, onOpenList, onOpen, onNotify, onFindVendors }: {
    listId: string | null; onOpenList: (id: string | null) => void; onOpen: (id: string) => void; onNotify: (m: string) => void;
    onFindVendors: (location: string, category: string | null) => void;
}) {
    const store = useVendorStore();
    const [creating, setCreating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const list = listId ? store.lists.find((l) => l.id === listId) ?? null : null;
    const [notes, setNotes] = useState(list?.notes ?? "");
    useEffect(() => setNotes(list?.notes ?? ""), [list?.id, list?.notes]);

    if (listId && !list) {
        return <EmptyBlock title="Sourcing list not found" text="It may have been deleted by a teammate." action={<button type="button" className="vm-btn" onClick={() => onOpenList(null)}>All sourcing lists</button>} />;
    }

    if (list) {
        const groups = [...new Set(list.items.map((i) => i.category))];
        return (
            <section className="vm-tab-body">
                <button type="button" className="vm-back" onClick={() => onOpenList(null)}><ArrowLeft size={15} /> All sourcing lists</button>
                <div className="vm-list-detail">
                    <div className="vm-panel">
                        <div className="vm-panel-head">
                            <h3>{list.name}</h3>
                            <span className="vm-panel-actions">
                                <button type="button" className={`vm-btn vm-btn--sm${list.shared ? " is-active" : ""}`} onClick={() => { setListShared(list.id, !list.shared); onNotify(list.shared ? "List is now private to you." : "List shared with your company."); }}>
                                    <Share2 size={14} /> {list.shared ? "Shared" : "Share"}
                                </button>
                                <button type="button" className="vm-btn vm-btn--sm vm-btn--primary" onClick={() => onFindVendors(list.location, list.categories[0] ?? null)}><Search size={14} /> Find vendors</button>
                            </span>
                        </div>
                        {list.items.length ? groups.map((g) => (
                            <div key={g} className="vm-list-group">
                                <p className="vm-section-label">{CATEGORY_LABEL[g] ?? g}</p>
                                {list.items.filter((i) => i.category === g).map((item) => {
                                    const v = getVendor(item.vendorId);
                                    const available = !!v && isDiscoverable(v);
                                    return (
                                        <div key={item.vendorId} className={`vm-list-row${available ? "" : " is-gone"}`}>
                                            <button type="button" className="vm-table-vendor" onClick={() => available && onOpen(item.vendorId)} disabled={!available}>
                                                {v ? <VendorLogo vendor={v} size={36} /> : null}
                                                <span>
                                                    <strong>{v?.name ?? "Removed vendor"}</strong>
                                                    <small>{available ? `${v!.area}, ${v!.city}${v!.rating ? ` · ${v!.rating.toFixed(1)} ★` : ""} · added by ${item.addedBy}` : "No longer available in discovery"}</small>
                                                </span>
                                            </button>
                                            {available && isCertified(v!) ? <TrustBadges certified verified={false} small /> : null}
                                            {store.unlocked.includes(item.vendorId) ? <span className="vm-status vm-status--success">Contacted</span> : null}
                                            <button type="button" className={`vm-btn vm-btn--sm${item.shortlisted ? " is-active" : ""}`} disabled={!available} aria-pressed={item.shortlisted} onClick={() => toggleShortlist(list.id, item.vendorId)}>
                                                {item.shortlisted ? "✓ Shortlisted" : "Shortlist"}
                                            </button>
                                            <button type="button" className="vm-icon-btn" aria-label={`Remove ${v?.name ?? "vendor"} from list`} onClick={() => { removeFromList(list.id, item.vendorId); onNotify("Removed from the list."); }}><Trash2 size={15} /></button>
                                        </div>
                                    );
                                })}
                            </div>
                        )) : (
                            <EmptyBlock title="No vendors in this list yet" text="Find vendors and use “Add to sourcing list” on any vendor card or profile." />
                        )}
                        <p className="vm-fine">Shortlisting or unlocking contact details does not appoint a vendor to the project.</p>
                    </div>
                    <aside className="vm-side">
                        <div className="vm-panel">
                            <h3>List details</h3>
                            <dl className="vm-dl">
                                <div><dt>Linked project</dt><dd>{list.projectName ?? "None"}</dd></div>
                                <div><dt>Location</dt><dd>{list.location}</dd></div>
                                <div><dt>Categories</dt><dd>{list.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(", ") || "—"}</dd></div>
                                <div><dt>Vendors</dt><dd>{list.items.length} · {list.items.filter((i) => i.shortlisted).length} shortlisted</dd></div>
                                <div><dt>Created by</dt><dd>{list.createdBy}</dd></div>
                                <div><dt>Last updated</dt><dd>{timeAgo(list.updatedAt)}</dd></div>
                            </dl>
                        </div>
                        <div className="vm-panel">
                            <h3>Notes</h3>
                            <textarea
                                className="vm-textarea"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                onBlur={() => { if (notes !== list.notes) { setListNotes(list.id, notes); onNotify("Notes saved."); } }}
                                placeholder="Internal sourcing observations — visible only to your company."
                                maxLength={2000}
                                rows={5}
                            />
                        </div>
                        <button type="button" className="vm-btn vm-btn--danger" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete list</button>
                    </aside>
                </div>
                <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} labelledBy="vm-del-title">
                    <h2 id="vm-del-title" className="vm-modal-title">Delete “{list.name}”?</h2>
                    <p className="vm-muted">The list and its notes are removed for everyone in your company. Saved vendors and contact history are kept.</p>
                    <div className="vm-modal-actions">
                        <button type="button" className="vm-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                        <button type="button" className="vm-btn vm-btn--danger-solid" onClick={() => { deleteList(list.id); setConfirmDelete(false); onOpenList(null); onNotify("Sourcing list deleted."); }}>Delete list</button>
                    </div>
                </Modal>
            </section>
        );
    }

    return (
        <section className="vm-tab-body">
            <div className="vm-toolbar">
                <span className="vm-muted">{store.lists.length} sourcing list{store.lists.length === 1 ? "" : "s"} · {store.lists.filter((l) => l.shared).length} shared with your company</span>
                <span className="vm-toolbar-end">
                    <button type="button" className="vm-btn vm-btn--primary" onClick={() => setCreating(true)}><Plus size={16} /> New sourcing list</button>
                </span>
            </div>
            {store.lists.length ? (
                <div className="vm-grid">
                    {store.lists.map((l) => (
                        <button key={l.id} type="button" className="vm-list-card" onClick={() => onOpenList(l.id)}>
                            <strong>{l.name}</strong>
                            <span className="vm-muted">{l.projectName ?? "No project"} · {l.location}</span>
                            <span className="vm-chips">{l.categories.map((c) => <span key={c} className="vm-chip">{CATEGORY_LABEL[c] ?? c}</span>)}</span>
                            <span className="vm-list-card-foot">
                                <span>{l.items.length} vendor{l.items.length === 1 ? "" : "s"} · {l.items.filter((i) => i.shortlisted).length} shortlisted{l.shared ? " · Shared" : ""}</span>
                                <span>Updated {timeAgo(l.updatedAt)}</span>
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <EmptyBlock icon={<ListIcon size={22} />} title="No sourcing lists yet" text={`Create lists such as “${SAMPLE_PROJECTS[1].name} — Kitchen suppliers” to organise vendors by project and material.`}
                    action={<button type="button" className="vm-btn vm-btn--primary" onClick={() => setCreating(true)}><Plus size={16} /> New sourcing list</button>} />
            )}
            <NewListModal open={creating} onClose={() => setCreating(false)} onCreated={(id, name) => { setCreating(false); onNotify(`${name} created.`); onOpenList(id); }} />
        </section>
    );
}

function EmptyBlock({ icon, title, text, action }: { icon?: ReactNode; title: string; text: string; action?: ReactNode }) {
    return (
        <div className="vm-emptyblock">
            {icon ? <span className="vm-emptyblock-icon">{icon}</span> : null}
            <strong>{title}</strong>
            <p>{text}</p>
            {action}
        </div>
    );
}

export default function VendorMarketplacePage() {
    return (
        <Suspense fallback={null}>
            <VendorMarketplaceInner />
        </Suspense>
    );
}
