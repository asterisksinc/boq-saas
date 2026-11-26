import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORIES, VENDORS, getPlace, isCertified } from "../lib/vendors/data";
import { EMPTY_ADVANCED, distanceKm, matchVendor, searchVendors, type SearchInput } from "../lib/vendors/search";
import {
    ContactAccessError, OTP_RULES, PROTOTYPE_OTP, __resetVendorStore, expireContactOtp, getSnapshot, getUnlockedContact,
    requestContactOtp, resendContactOtp, toggleSaved, verifyContactOtp,
} from "../lib/vendors/store";

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");
const NOW = new Date("2026-11-26T12:00:00+05:30");

const base = (over: Partial<SearchInput> = {}): SearchInput => ({
    query: "", place: getPlace("hyd"), radius: 25, quick: [], advanced: EMPTY_ADVANCED, sort: "relevance", now: NOW, ...over,
});

describe("Vendor Marketplace — search, filters and ranking (PRD §04, §05, §14)", () => {
    it("finds Italian marble vendors near Hyderabad like the Figma prototype, and never surfaces suspended listings", () => {
        const r = searchVendors(base({ query: "Italian Marble" }));
        const names = r.exact.map((h) => h.vendor.name);
        expect(names).toEqual(expect.arrayContaining(["Studio Surface", "Charminar Tiles & Stone"]));
        expect(names).not.toContain("Kondapur Stone Depot");
        expect(names).not.toContain("Marblecraft Bengaluru");
        expect(r.outsideRadius).toBeGreaterThanOrEqual(1);
    });

    it("separates exact material matches from related-category vendors", () => {
        expect(matchVendor(VENDORS.find((v) => v.id === "studio-surface")!, "quartz")).toBe("exact");
        expect(matchVendor(VENDORS.find((v) => v.id === "charminar-tiles")!, "quartz")).toBe("related");
        expect(matchVendor(VENDORS.find((v) => v.id === "lumina-lighting")!, "quartz")).toBe("none");
        const r = searchVendors(base({ query: "Quartz" }));
        expect(r.exact.map((h) => h.vendor.id)).toEqual(["studio-surface"]);
        expect(r.related.map((h) => h.vendor.id)).toContain("charminar-tiles");
    });

    it("measures radius from the vendor's real coordinates and supports entire city / state", () => {
        const hyd = getPlace("hyd")!;
        const studio = VENDORS.find((v) => v.id === "studio-surface")!;
        expect(distanceKm(hyd, { lat: studio.lat!, lng: studio.lng! })).toBeLessThan(10);
        const near = searchVendors(base({ radius: 5 })).exact.length;
        const city = searchVendors(base({ radius: "city" })).exact.length;
        expect(city).toBeGreaterThan(near);
        expect(searchVendors(base({ radius: "city" })).exact.every((h) => h.vendor.city === "Hyderabad")).toBe(true);
    });

    it("keeps vendors without a confirmed location out of radius results instead of guessing a pin", () => {
        const r = searchVendors(base({ query: "Wallpaper", radius: 100 }));
        expect(r.exact.find((h) => h.vendor.id === "unlisted-wallcraft")).toBeUndefined();
        expect(searchVendors(base({ query: "Wallpaper", radius: "city" })).exact[0]?.distanceKm).toBeNull();
    });

    it("applies quick and advanced filters together", () => {
        const certified = searchVendors(base({ radius: "city", quick: ["certified"] }));
        expect(certified.exact.length).toBeGreaterThan(0);
        expect(certified.exact.every((h) => h.certified)).toBe(true);
        expect(certified.certifiedOnly).toBe(true);
        const installers = searchVendors(base({ radius: "city", advanced: { ...EMPTY_ADVANCED, installation: true, businessTypes: ["manufacturer"] } }));
        expect(installers.exact.every((h) => h.vendor.installation && h.vendor.businessTypes.includes("manufacturer"))).toBe(true);
    });

    it("ranks certified exact matches first by relevance and lets users sort", () => {
        const r = searchVendors(base({ query: "Italian Marble" }));
        expect(r.exact[0].certified).toBe(true);
        const byDistance = searchVendors(base({ query: "Italian Marble", sort: "distance" })).exact.map((h) => h.distanceKm ?? Infinity);
        expect([...byDistance].sort((a, b) => a - b)).toEqual(byDistance);
    });

    it("drops the certified badge once certification lapses (PRD §17)", () => {
        const adyar = VENDORS.find((v) => v.id === "adyar-bath")!;
        expect(adyar.status).toBe("certified");
        expect(isCertified(adyar, NOW)).toBe(false);
    });

    it("suggests nearby cities when a city has no matching vendors", () => {
        const r = searchVendors(base({ query: "Italian Marble", place: getPlace("pune"), radius: "city" }));
        expect(r.exact.length + r.related.length).toBe(0);
        expect(r.nearbyCities).toContain("Hyderabad");
    });

    it("uses the PRD taxonomy with 12 parent categories", () => {
        expect(CATEGORIES.map((c) => c.label)).toEqual([
            "Flooring & Surfaces", "Wood & Boards", "Furniture", "Lighting", "Fabrics & Furnishing", "Kitchen & Hardware",
            "Bathroom & Sanitaryware", "Wall & Ceiling", "Glass & Metal", "Decor & Accessories", "Appliances", "Services",
        ]);
    });
});

describe("Vendor Marketplace — OTP-protected contact disclosure (PRD §09)", () => {
    beforeEach(() => __resetVendorStore());

    it("follows the PRD OTP rules", () => {
        expect(OTP_RULES).toMatchObject({ length: 6, expiryMs: 300_000, maxAttempts: 5 });
        expect(OTP_RULES.resendCooldownMs).toBeGreaterThanOrEqual(30_000);
    });

    it("reveals contact only after a valid code, logs it, and unlocks the vendor for the company", () => {
        expect(getUnlockedContact("studio-surface")).toBeNull();
        const c = requestContactOtp("studio-surface", "email");
        const contact = verifyContactOtp(c.id, PROTOTYPE_OTP);
        expect(contact.phone).toMatch(/^\+91/);
        const s = getSnapshot();
        expect(s.unlocked).toContain("studio-surface");
        expect(s.disclosures[0]).toMatchObject({ vendorId: "studio-surface", method: "email", status: "success" });
        expect(getUnlockedContact("studio-surface")?.email).toBe(contact.email);
    });

    it("counts down attempts, locks after five failures and never reuses a challenge", () => {
        const c = requestContactOtp("charminar-tiles", "sms");
        for (let left = 4; left >= 1; left--) {
            expect(() => verifyContactOtp(c.id, "000000")).toThrow(`${left} attempt`);
        }
        expect(() => verifyContactOtp(c.id, "000000")).toThrow(ContactAccessError);
        expect(() => verifyContactOtp(c.id, PROTOTYPE_OTP)).toThrow(/Too many/);
        expect(getSnapshot().disclosures[0]).toMatchObject({ vendorId: "charminar-tiles", status: "failed" });

        const ok = requestContactOtp("charminar-tiles", "sms");
        verifyContactOtp(ok.id, PROTOTYPE_OTP);
        expect(() => verifyContactOtp(ok.id, PROTOTYPE_OTP)).toThrow(/already been used/);
    });

    it("rejects expired codes and enforces the resend cooldown", () => {
        const c = requestContactOtp("deccan-timber", "email", 1_000);
        expect(() => resendContactOtp(c.id, 2_000)).toThrow(/wait/);
        expect(() => verifyContactOtp(c.id, PROTOTYPE_OTP, 1_000 + OTP_RULES.expiryMs + 1)).toThrow(/expired/);
        const d = requestContactOtp("deccan-timber", "email");
        expect(() => resendContactOtp(d.id)).toThrow(/wait/);
        expireContactOtp(d.id);
        expect(() => verifyContactOtp(d.id, PROTOTYPE_OTP)).toThrow(/expired/);
    });

    it("refuses contact access for suspended vendors", () => {
        expect(() => requestContactOtp("kondapur-stone", "email")).toThrow(/no longer available/);
    });

    it("keeps contact details out of public vendor data", () => {
        expect(read("lib", "vendors", "data.ts")).not.toMatch(/\+91 9\d{4} \d{5}/);
        expect(JSON.stringify(VENDORS)).not.toMatch(/@\w+\.in/);
        const search = read("lib", "vendors", "search.ts");
        expect(search).not.toContain("contacts");
    });

    it("toggles saved vendors", () => {
        expect(toggleSaved("lumina-lighting")).toBe(true);
        expect(getSnapshot().saved[0].vendorId).toBe("lumina-lighting");
        expect(toggleSaved("lumina-lighting")).toBe(false);
    });
});

describe("Vendor Marketplace — pages and navigation", () => {
    it("adds Vendor Marketplace to the sidebar right after Bill of Quantities", () => {
        const rail = read("components", "DashboardRail.tsx");
        expect(rail).toContain('{ route: "/vendors", icon: "nav-vendors", label: "Vendor Marketplace" }');
        expect(rail.indexOf('route: "/boqs"')).toBeLessThan(rail.indexOf('route: "/vendors"'));
    });

    it("ships the five marketplace destinations, split map/list and vendor profile", () => {
        const page = read("app", "vendors", "page.tsx");
        for (const tab of ["Discover Vendors", "Saved Vendors", "Recently Viewed", "Contact Requests", "My Sourcing List"]) expect(page).toContain(`label: "${tab}"`);
        for (const text of ["Find from BOQ", "VendorMap", "FilterDrawer", "Start your first sourcing search", "Popular Categories", "Popular Locations", "Try an Example", "Related categories", "CompareModal", "New sourcing list"]) expect(page).toContain(text);
        const profile = read("app", "vendors", "[id]", "page.tsx");
        for (const text of ["Vendor Profile", "Evaluate the business before you connect.", "Acquire Contact Information", "Want to connect with this Vendor?", "Business Information", "Service Coverage", "Trust &amp; Certification", "Report listing"]) expect(profile).toContain(text);
        const dialogs = read("components", "vendors", "VendorDialogs.tsx");
        for (const text of ["Secure Contact Access", "Enter Verification Code", "Verify & Reveal Contact", "OTP Verified", "Contact Information Unlocked", "Compare vendors", "Bill of Quantities"]) expect(dialogs).toContain(text);
        expect(read("components", "vendors", "VendorMap.tsx")).toContain("Search this area");
    });

    it("renders the filter drawer, modals and toast above the side rail with a live result count", () => {
        const ui = read("components", "vendors", "VendorUi.tsx");
        expect(ui).toContain("createPortal(<div className=\"vm-layer\">");
        const dialogs = read("components", "vendors", "VendorDialogs.tsx");
        expect(dialogs).toMatch(/<Layer lockScroll>\s*<div className="vm-overlay vm-overlay--drawer"/);
        expect(dialogs).toContain("Show ${preview} vendor");
        expect(read("app", "vendors", "page.tsx")).toContain("previewCount={previewCount}");
        const css = read("app", "vendors", "vendors.css");
        expect(css).toMatch(/\.vm-drawer \{[^}]*max-height: 100dvh/);
        expect(css).toMatch(/\.vm-drawer-body \{[^}]*min-height: 0;[^}]*overflow-y: auto/);
        expect(read("app", "vendors", "vendors.css")).toMatch(/\.vm-page,\s*\.vm-layer \{\s*--vm-ink/);
    });

    it("draws the map with MapLibre GL on free OpenFreeMap tiles, keeping the attribution", () => {
        const map = read("components", "vendors", "VendorMap.tsx");
        expect(map).toContain('import("maplibre-gl")');
        expect(map).toContain('"https://tiles.openfreemap.org/styles/liberty"');
        expect(map).toContain("attributionControl: { compact: true }");
        expect(map).toContain("never draw an inaccurate pin");
        expect(JSON.parse(read("package.json")).dependencies["maplibre-gl"]).toBeDefined();
    });
});

describe("Vendor Marketplace — map radius ring", () => {
    it("builds a closed geodesic circle whose points sit at the search radius", async () => {
        const { circlePolygon } = await import("../lib/vendors/geo");
        const hyd = getPlace("hyd")!;
        const ring = circlePolygon(hyd, 25).geometry.coordinates[0];
        expect(ring[0]).toEqual(ring[ring.length - 1]);
        for (const [lng, lat] of ring.filter((_, i) => i % 12 === 0)) expect(distanceKm(hyd, { lat, lng })).toBeCloseTo(25, 0);
    });
});
