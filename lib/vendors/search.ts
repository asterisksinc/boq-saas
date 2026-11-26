/**
 * Marketplace search, filtering and ranking (PRD §04, §05, §14). Pure functions so they are unit-testable and can move
 * to the search service unchanged.
 */
import { CATEGORIES, CATEGORY_LABEL, NEARBY_CITIES, VENDORS, isCertified, isDiscoverable, type BusinessType, type Place, type RadiusOption, type Vendor } from "./data";

export type SortKey = "relevance" | "distance" | "rating" | "reviews" | "certified" | "recent";

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: "relevance", label: "Relevance" },
    { value: "distance", label: "Distance" },
    { value: "rating", label: "Highest rated" },
    { value: "reviews", label: "Most reviewed" },
    { value: "certified", label: "RVYO Certified first" },
    { value: "recent", label: "Recently verified" },
];

export type QuickFilter = "certified" | "verified" | "openNow" | "topRated" | "nearby" | "hasPortfolio";

export const QUICK_FILTERS: Array<{ value: QuickFilter; label: string }> = [
    { value: "certified", label: "RVYO Certified" },
    { value: "verified", label: "Verified Vendors" },
    { value: "openNow", label: "Open Now" },
    { value: "topRated", label: "Top Rated" },
    { value: "nearby", label: "Nearby" },
    { value: "hasPortfolio", label: "Has Portfolio" },
];

export interface AdvancedFilters {
    verification: Array<"certified" | "verified" | "profileComplete">;
    categories: string[];
    businessTypes: BusinessType[];
    hasCatalogue: boolean;
    hasPortfolio: boolean;
    installation: boolean;
    delivery: "" | "local" | "outstation";
    minRating: number;
    minYears: number;
    languages: string[];
}

export const EMPTY_ADVANCED: AdvancedFilters = {
    verification: [], categories: [], businessTypes: [], hasCatalogue: false, hasPortfolio: false,
    installation: false, delivery: "", minRating: 0, minYears: 0, languages: [],
};

export function countAdvanced(f: AdvancedFilters) {
    return f.verification.length + f.categories.length + f.businessTypes.length
        + Number(f.hasCatalogue) + Number(f.hasPortfolio) + Number(f.installation) + Number(!!f.delivery)
        + Number(f.minRating > 0) + Number(f.minYears > 0) + f.languages.length;
}

export interface SearchInput {
    query: string;
    place: Place | null;
    /** Overrides the place centre after "Search this area". */
    center?: { lat: number; lng: number } | null;
    radius: RadiusOption;
    quick: QuickFilter[];
    advanced: AdvancedFilters;
    sort: SortKey;
    now?: Date;
}

export type MatchKind = "exact" | "related" | "none";

export interface SearchHit {
    vendor: Vendor;
    distanceKm: number | null;
    match: MatchKind;
    score: number;
    certified: boolean;
    verified: boolean;
}

export interface SearchResult {
    exact: SearchHit[];
    related: SearchHit[];
    /** Vendors that match everything except the radius — powers "expand your radius". */
    outsideRadius: number;
    nearbyCities: string[];
    certifiedOnly: boolean;
}

const EARTH_KM = 6371;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Exact = the query names one of the vendor's materials, brands, its name or a subcategory it supplies. Related = same parent category only. */
export function matchVendor(vendor: Vendor, query: string): MatchKind {
    const q = norm(query);
    if (!q) return "exact";
    const exactTerms = [vendor.name, ...vendor.materials, ...vendor.brands].map(norm);
    if (exactTerms.some((t) => t.includes(q) || (q.length > 3 && q.includes(t)))) return "exact";
    const parentLabels = vendor.categories.map((c) => norm(CATEGORY_LABEL[c] ?? c));
    if (parentLabels.some((t) => t.includes(q) || q.includes(t))) return "exact";
    const queriedParents = CATEGORIES.filter((c) => norm(c.label).includes(q) || c.subcategories.some((s) => { const n = norm(s); return n.includes(q) || q.includes(n); })).map((c) => c.key);
    if (queriedParents.some((p) => vendor.categories.includes(p))) return "related";
    if (norm(vendor.description).includes(q)) return "related";
    return "none";
}

export function isOpenNow(vendor: Vendor, now: Date) {
    const [oh, om] = vendor.hours.open.split(":").map(Number);
    const [ch, cm] = vendor.hours.close.split(":").map(Number);
    const minutes = now.getHours() * 60 + now.getMinutes();
    const day = now.getDay(); // 0 Sun
    const days = vendor.hours.days;
    const openDay = days === "Mon–Sun" || (days === "Mon–Sat" && day !== 0) || (days === "Tue–Sun" && day !== 1);
    return openDay && minutes >= oh * 60 + om && minutes < ch * 60 + cm;
}

export function isProfileComplete(vendor: Vendor) {
    return vendor.hasCatalogue && vendor.hasPortfolio && vendor.lat !== null;
}

/** PRD §14 proposed initial weights: material 30, proximity 25, trust 20, capability 10, rating 10, completeness 5. */
export function scoreVendor(vendor: Vendor, match: MatchKind, distance: number | null, radiusKm: number, now: Date) {
    const material = match === "exact" ? 1 : match === "related" ? 0.4 : 0;
    const proximity = distance === null ? 0.3 : Math.max(0, 1 - distance / Math.max(radiusKm, 1));
    const trust = isCertified(vendor, now) ? 1 : vendor.verifiedOn ? 0.6 : 0;
    const capability = Math.min(1, (vendor.materials.length + (vendor.installation ? 1 : 0) + (vendor.delivery.outstation ? 1 : 0)) / 6);
    // A vendor with no reviews is neutral, not poor (PRD §14 ranking principles).
    const rating = vendor.rating === null ? 0.5 : Math.min(1, (vendor.rating / 5) * Math.min(1, 0.6 + vendor.reviewCount / 100));
    const completeness = (Number(vendor.hasCatalogue) + Number(vendor.hasPortfolio) + Number(vendor.lat !== null)) / 3;
    return 30 * material + 25 * proximity + 20 * trust + 10 * capability + 10 * rating + 5 * completeness;
}

function radiusKmOf(radius: RadiusOption) {
    return typeof radius === "number" ? radius : radius === "city" ? 40 : 400;
}

function withinArea(vendor: Vendor, input: SearchInput, distance: number | null) {
    if (!input.place && !input.center) return true;
    if (input.radius === "city") return vendor.city === input.place?.city;
    if (input.radius === "state") return vendor.state === input.place?.state;
    return distance !== null && distance <= input.radius;
}

function passesFilters(vendor: Vendor, input: SearchInput, distance: number | null, now: Date) {
    const certified = isCertified(vendor, now);
    const q = new Set(input.quick);
    const a = input.advanced;
    if (q.has("certified") && !certified) return false;
    if (q.has("verified") && !vendor.verifiedOn) return false;
    if (q.has("openNow") && !isOpenNow(vendor, now)) return false;
    if (q.has("topRated") && !((vendor.rating ?? 0) >= 4.5)) return false;
    if (q.has("nearby") && !(distance !== null && distance <= 10)) return false;
    if (q.has("hasPortfolio") && !vendor.hasPortfolio) return false;
    if (a.verification.includes("certified") && !certified) return false;
    if (a.verification.includes("verified") && !vendor.verifiedOn) return false;
    if (a.verification.includes("profileComplete") && !isProfileComplete(vendor)) return false;
    if (a.categories.length && !a.categories.some((c) => vendor.categories.includes(c))) return false;
    if (a.businessTypes.length && !a.businessTypes.some((t) => vendor.businessTypes.includes(t))) return false;
    if (a.hasCatalogue && !vendor.hasCatalogue) return false;
    if (a.hasPortfolio && !vendor.hasPortfolio) return false;
    if (a.installation && !vendor.installation) return false;
    if (a.delivery && !vendor.delivery[a.delivery]) return false;
    if (a.minRating && !((vendor.rating ?? 0) >= a.minRating)) return false;
    if (a.minYears && vendor.years < a.minYears) return false;
    if (a.languages.length && !a.languages.some((l) => vendor.languages.includes(l))) return false;
    return true;
}

export function sortHits(hits: SearchHit[], sort: SortKey) {
    const by: Record<SortKey, (a: SearchHit, b: SearchHit) => number> = {
        relevance: (a, b) => b.score - a.score,
        distance: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
        rating: (a, b) => (b.vendor.rating ?? 0) - (a.vendor.rating ?? 0),
        reviews: (a, b) => b.vendor.reviewCount - a.vendor.reviewCount,
        certified: (a, b) => Number(b.certified) - Number(a.certified) || b.score - a.score,
        recent: (a, b) => (b.vendor.verifiedOn ?? "").localeCompare(a.vendor.verifiedOn ?? ""),
    };
    return [...hits].sort((a, b) => by[sort](a, b) || a.vendor.name.localeCompare(b.vendor.name));
}

export function searchVendors(input: SearchInput, catalogue: Vendor[] = VENDORS): SearchResult {
    const now = input.now ?? new Date();
    const center = input.center ?? (input.place ? { lat: input.place.lat, lng: input.place.lng } : null);
    const radiusKm = radiusKmOf(input.radius);
    const exact: SearchHit[] = [];
    const related: SearchHit[] = [];
    let outsideRadius = 0;

    for (const vendor of catalogue) {
        if (!isDiscoverable(vendor)) continue; // suspended / archived / unreviewed listings never surface
        const match = matchVendor(vendor, input.query);
        if (match === "none") continue;
        const distance = center && vendor.lat !== null && vendor.lng !== null ? distanceKm(center, { lat: vendor.lat, lng: vendor.lng }) : null;
        if (!passesFilters(vendor, input, distance, now)) continue;
        if (!withinArea(vendor, input, distance)) {
            outsideRadius += 1;
            continue;
        }
        const hit: SearchHit = {
            vendor, distanceKm: distance, match,
            score: scoreVendor(vendor, match, distance, radiusKm, now),
            certified: isCertified(vendor, now), verified: !!vendor.verifiedOn,
        };
        (match === "exact" ? exact : related).push(hit);
    }

    const city = input.place?.city;
    const nearbyCities = exact.length + related.length === 0 && city
        ? (NEARBY_CITIES[city] ?? []).filter((c) => catalogue.some((v) => v.city === c && isDiscoverable(v) && matchVendor(v, input.query) !== "none"))
        : [];

    return {
        exact: sortHits(exact, input.sort),
        related: sortHits(related, input.sort),
        outsideRadius,
        nearbyCities,
        certifiedOnly: input.quick.includes("certified") || input.advanced.verification.includes("certified"),
    };
}

/** Category counts for the filter drawer, from discoverable vendors in the current area. */
export function categoryCounts(catalogue: Vendor[] = VENDORS) {
    const counts: Record<string, number> = {};
    for (const v of catalogue) if (isDiscoverable(v)) for (const c of v.categories) counts[c] = (counts[c] ?? 0) + 1;
    return counts;
}

/** Location suggestions for the "Where are you sourcing?" field. */
export function suggestPlaces(text: string, places: Place[]) {
    const q = norm(text);
    if (!q) return places.filter((p) => p.kind === "city");
    return places.filter((p) => norm(p.label).includes(q) || p.label.replace(/\D/g, "").startsWith(q.replace(/\D/g, "") || "x")).slice(0, 6);
}

/** Material / vendor suggestions for "What are you sourcing?". */
export function suggestMaterials(text: string) {
    const q = norm(text);
    if (q.length < 2) return [];
    const subs = CATEGORIES.flatMap((c) => c.subcategories.map((s) => ({ label: s, hint: c.label, kind: "material" as const })));
    const parents = CATEGORIES.map((c) => ({ label: c.label, hint: "Category", kind: "category" as const }));
    const vendors = VENDORS.filter(isDiscoverable).map((v) => ({ label: v.name, hint: `Vendor · ${v.city}`, kind: "vendor" as const }));
    const seen = new Set<string>();
    return [...subs, ...parents, ...vendors]
        .filter((s) => norm(s.label).includes(q) && !seen.has(s.label) && seen.add(s.label))
        .slice(0, 7);
}
