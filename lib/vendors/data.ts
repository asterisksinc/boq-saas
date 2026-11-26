/**
 * Vendor Marketplace sample catalogue (PRD "RVYO — Vendor Marketplace", Figma Make "Build RVYO Vendor Marketplace").
 *
 * Frontend-only until the marketplace backend exists. Public vendor data lives here; contact details are kept
 * separately in ./contacts.ts and are only handed out by the OTP flow in ./store.ts, mirroring the PRD rule that
 * contact data never ships in search or profile payloads. All names, numbers and addresses are fictional.
 */

export type BusinessType =
    | "manufacturer" | "distributor" | "wholesaler" | "retailer" | "dealer"
    | "contractor" | "service_provider" | "fabricator" | "custom_manufacturer";

export type ListingStatus = "draft" | "submitted" | "under_review" | "verified" | "certified" | "rejected" | "suspended" | "archived";

export interface Category {
    key: string;
    label: string;
    subcategories: string[];
}

/** PRD §04 material taxonomy. Configurable from RVYO admin once the backend exists. */
export const CATEGORIES: Category[] = [
    { key: "flooring", label: "Flooring & Surfaces", subcategories: ["Tiles", "Marble", "Italian Marble", "Granite", "Quartz", "Wooden Flooring", "Natural Stone"] },
    { key: "wood", label: "Wood & Boards", subcategories: ["Plywood", "MDF", "HDF", "Veneer", "Laminates"] },
    { key: "furniture", label: "Furniture", subcategories: ["Custom Furniture", "Modular Furniture", "Upholstery"] },
    { key: "lighting", label: "Lighting", subcategories: ["Decorative Lighting", "Architectural Lighting", "Outdoor Lighting", "Smart Lighting"] },
    { key: "fabrics", label: "Fabrics & Furnishing", subcategories: ["Curtains", "Upholstery Fabric", "Blinds", "Carpets"] },
    { key: "kitchen", label: "Kitchen & Hardware", subcategories: ["Hinges", "Channels", "Handles", "Kitchen Accessories", "Modular Kitchen Hardware"] },
    { key: "bathroom", label: "Bathroom & Sanitaryware", subcategories: ["Faucets", "Basins", "Sanitaryware", "Shower Systems"] },
    { key: "wall", label: "Wall & Ceiling", subcategories: ["Wallpaper", "Wall Panels", "Paint", "False Ceiling"] },
    { key: "glass", label: "Glass & Metal", subcategories: ["Toughened Glass", "Aluminium", "Stainless Steel"] },
    { key: "decor", label: "Decor & Accessories", subcategories: ["Mirrors", "Artwork", "Decorative Objects"] },
    { key: "appliances", label: "Appliances", subcategories: ["Kitchen Appliances", "HVAC", "Home Automation"] },
    { key: "services", label: "Services", subcategories: ["Civil Work", "Carpentry", "Electrical", "Installation"] },
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));

export const BUSINESS_TYPES: Array<{ value: BusinessType; label: string }> = [
    { value: "manufacturer", label: "Manufacturer" },
    { value: "distributor", label: "Distributor" },
    { value: "wholesaler", label: "Wholesaler" },
    { value: "retailer", label: "Retailer" },
    { value: "dealer", label: "Dealer" },
    { value: "contractor", label: "Contractor" },
    { value: "service_provider", label: "Service Provider" },
    { value: "fabricator", label: "Fabricator" },
    { value: "custom_manufacturer", label: "Custom Manufacturer" },
];

export const BUSINESS_TYPE_LABEL = Object.fromEntries(BUSINESS_TYPES.map((t) => [t.value, t.label])) as Record<BusinessType, string>;

export type RadiusOption = 5 | 10 | 25 | 50 | 100 | "city" | "state";
export const RADIUS_OPTIONS: Array<{ value: RadiusOption; label: string }> = [
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 25, label: "25 km" },
    { value: 50, label: "50 km" },
    { value: 100, label: "100 km" },
    { value: "city", label: "Entire city" },
    { value: "state", label: "Entire state" },
];

export interface Place {
    id: string;
    label: string;
    kind: "city" | "area" | "pincode";
    city: string;
    state: string;
    lat: number;
    lng: number;
}

/** Location suggestions (city, locality, pincode). A geocoding service replaces this with the backend. */
export const PLACES: Place[] = [
    { id: "hyd", label: "Hyderabad, Telangana", kind: "city", city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
    { id: "hyd-banjara", label: "Banjara Hills, Hyderabad", kind: "area", city: "Hyderabad", state: "Telangana", lat: 17.4156, lng: 78.4347 },
    { id: "hyd-gachi", label: "Gachibowli, Hyderabad", kind: "area", city: "Hyderabad", state: "Telangana", lat: 17.4401, lng: 78.3489 },
    { id: "hyd-500034", label: "500034 · Banjara Hills, Hyderabad", kind: "pincode", city: "Hyderabad", state: "Telangana", lat: 17.4156, lng: 78.4347 },
    { id: "blr", label: "Bengaluru, Karnataka", kind: "city", city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
    { id: "blr-indira", label: "Indiranagar, Bengaluru", kind: "area", city: "Bengaluru", state: "Karnataka", lat: 12.9784, lng: 77.6408 },
    { id: "blr-whitefield", label: "Whitefield, Bengaluru", kind: "area", city: "Bengaluru", state: "Karnataka", lat: 12.9698, lng: 77.75 },
    { id: "pune", label: "Pune, Maharashtra", kind: "city", city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
    { id: "pune-kp", label: "Koregaon Park, Pune", kind: "area", city: "Pune", state: "Maharashtra", lat: 18.5362, lng: 73.8939 },
    { id: "chennai", label: "Chennai, Tamil Nadu", kind: "city", city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
    { id: "chennai-adyar", label: "Adyar, Chennai", kind: "area", city: "Chennai", state: "Tamil Nadu", lat: 13.0012, lng: 80.2565 },
    { id: "mumbai", label: "Mumbai, Maharashtra", kind: "city", city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
    { id: "mumbai-andheri", label: "Andheri East, Mumbai", kind: "area", city: "Mumbai", state: "Maharashtra", lat: 19.1136, lng: 72.8697 },
];

export const POPULAR_CITIES = ["hyd", "blr", "pune", "chennai", "mumbai"];

/** Neighbouring cities suggested when a city has no matching vendors (PRD §14 result states). */
export const NEARBY_CITIES: Record<string, string[]> = {
    Hyderabad: ["Bengaluru", "Pune"],
    Bengaluru: ["Chennai", "Hyderabad"],
    Pune: ["Mumbai", "Hyderabad"],
    Chennai: ["Bengaluru", "Hyderabad"],
    Mumbai: ["Pune"],
};

export interface Review {
    author: string;
    company: string;
    rating: number;
    date: string;
    text: string;
    verifiedInteraction: boolean;
}

export interface Vendor {
    id: string;
    name: string;
    initials: string;
    description: string;
    categories: string[];
    materials: string[];
    brands: string[];
    businessTypes: BusinessType[];
    years: number;
    rating: number | null;
    reviewCount: number;
    area: string;
    city: string;
    state: string;
    pincode: string;
    /** null when the vendor has no confirmed location: it is listed but never pinned on the map. */
    lat: number | null;
    lng: number | null;
    status: ListingStatus;
    verifiedOn: string | null;
    certification: { approvedOn: string; reviewDue: string } | null;
    hours: { open: string; close: string; days: string };
    hasCatalogue: boolean;
    hasPortfolio: boolean;
    delivery: { local: boolean; outstation: boolean };
    installation: boolean;
    serviceAreas: string[];
    installationAreas: string[];
    minOrder: string | null;
    languages: string[];
    portfolio: Array<{ title: string; caption: string }>;
    reviews: Review[];
    updatedAt: string;
}

const today = "2026-11-26";

function v(partial: Omit<Vendor, "initials" | "updatedAt" | "reviews" | "portfolio" | "serviceAreas" | "installationAreas" | "languages" | "brands"> & Partial<Vendor>): Vendor {
    const initials = partial.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return {
        initials,
        updatedAt: today,
        reviews: [],
        portfolio: [],
        serviceAreas: [partial.city],
        installationAreas: partial.installation ? [partial.city] : [],
        languages: ["English", "Hindi"],
        brands: [],
        ...partial,
    };
}

export const VENDORS: Vendor[] = [
    v({
        id: "studio-surface", name: "Studio Surface",
        description: "Premium stone surface supplier specialising in marble, granite and engineered quartz for residential and commercial interior projects. Custom cutting and project supply.",
        categories: ["flooring"], materials: ["Italian Marble", "Quartz", "Granite", "Natural Stone"], brands: ["Caesarstone", "Stone Italiana"],
        businessTypes: ["manufacturer"], years: 8, rating: 4.8, reviewCount: 42,
        area: "Banjara Hills", city: "Hyderabad", state: "Telangana", pincode: "500034", lat: 17.4126, lng: 78.4392,
        status: "certified", verifiedOn: "2025-09-12", certification: { approvedOn: "2025-10-20", reviewDue: "2027-10-20" },
        hours: { open: "09:30", close: "19:30", days: "Mon–Sat" }, hasCatalogue: true, hasPortfolio: true,
        delivery: { local: true, outstation: true }, installation: true, serviceAreas: ["Hyderabad", "Bengaluru", "Vijayawada"], installationAreas: ["Hyderabad"],
        minOrder: "200 sq. ft.", languages: ["English", "Hindi", "Telugu"],
        portfolio: [
            { title: "Jubilee Hills villa", caption: "Statuario flooring, 4,200 sq. ft." },
            { title: "Showroom — Road No. 12", caption: "Quartz and marble display gallery" },
            { title: "Gachibowli office lobby", caption: "Book-matched marble feature wall" },
        ],
        reviews: [
            { author: "Ritika S.", company: "Atelier Nine", rating: 5, date: "2026-10-02", text: "Consistent slab quality and they kept to the cutting schedule on a tight handover.", verifiedInteraction: true },
            { author: "Manoj K.", company: "Linea Interiors", rating: 4.5, date: "2026-08-19", text: "Good range of engineered quartz. Bulk pricing took a few days to confirm.", verifiedInteraction: true },
        ],
    }),
    v({
        id: "charminar-tiles", name: "Charminar Tiles & Stone",
        description: "Large-format tile and stone gallery with a trade desk for interior designers and contractors.",
        categories: ["flooring"], materials: ["Tiles", "Italian Marble", "Granite", "Wooden Flooring"], brands: ["Kajaria", "Somany", "Simpolo"],
        businessTypes: ["retailer", "wholesaler"], years: 21, rating: 4.6, reviewCount: 88,
        area: "Abids", city: "Hyderabad", state: "Telangana", pincode: "500001", lat: 17.3924, lng: 78.4747,
        status: "certified", verifiedOn: "2025-10-01", certification: { approvedOn: "2025-10-18", reviewDue: "2027-04-18" },
        hours: { open: "10:00", close: "20:30", days: "Mon–Sun" }, hasCatalogue: true, hasPortfolio: true,
        delivery: { local: true, outstation: false }, installation: true, minOrder: null, languages: ["English", "Hindi", "Telugu", "Urdu"],
        portfolio: [{ title: "Trade desk gallery", caption: "1,200+ tile SKUs on display" }, { title: "Kondapur apartments", caption: "Vitrified tiles across 64 units" }],
        reviews: [{ author: "Sana M.", company: "Habitat Studio", rating: 4.5, date: "2026-11-01", text: "Huge range and helpful trade desk. Delivery slots fill up quickly.", verifiedInteraction: true }],
    }),
    v({
        id: "deccan-timber", name: "Deccan Timber & Boards",
        description: "Distributor of plywood, MDF, veneers and laminates with same-day dispatch across Hyderabad.",
        categories: ["wood"], materials: ["Plywood", "MDF", "HDF", "Veneer", "Laminates"], brands: ["Greenply", "Century", "Merino"],
        businessTypes: ["distributor"], years: 15, rating: 4.7, reviewCount: 67,
        area: "Kukatpally", city: "Hyderabad", state: "Telangana", pincode: "500072", lat: 17.4948, lng: 78.3996,
        status: "certified", verifiedOn: "2025-07-05", certification: { approvedOn: "2025-08-01", reviewDue: "2027-08-01" },
        hours: { open: "09:00", close: "19:00", days: "Mon–Sat" }, hasCatalogue: true, hasPortfolio: false,
        delivery: { local: true, outstation: true }, installation: false, serviceAreas: ["Hyderabad", "Warangal"], minOrder: "20 sheets",
    }),
    v({
        id: "lumina-lighting", name: "Lumina Lighting",
        description: "Decorative and architectural lighting studio with an in-house design desk for residential projects.",
        categories: ["lighting"], materials: ["Decorative Lighting", "Architectural Lighting"], brands: ["Philips Hue", "Jaquar Lighting"],
        businessTypes: ["retailer", "dealer"], years: 6, rating: 4.4, reviewCount: 23,
        area: "Jubilee Hills", city: "Hyderabad", state: "Telangana", pincode: "500033", lat: 17.4318, lng: 78.4071,
        status: "verified", verifiedOn: "2026-02-14", certification: null,
        hours: { open: "11:00", close: "21:00", days: "Tue–Sun" }, hasCatalogue: true, hasPortfolio: true,
        delivery: { local: true, outstation: false }, installation: true, minOrder: null,
        portfolio: [{ title: "Penthouse living room", caption: "Layered decorative lighting plan" }],
    }),
    v({
        id: "hitech-modular", name: "HiTech Modular Kitchens",
        description: "Modular kitchen and wardrobe manufacturer with soft-close hardware and on-site installation teams.",
        categories: ["furniture", "kitchen"], materials: ["Modular Furniture", "Modular Kitchen Hardware", "Hinges", "Channels"], brands: ["Hettich", "Hafele", "Blum"],
        businessTypes: ["manufacturer", "contractor"], years: 11, rating: 4.3, reviewCount: 31,
        area: "Madhapur", city: "Hyderabad", state: "Telangana", pincode: "500081", lat: 17.4483, lng: 78.3915,
        status: "verified", verifiedOn: "2025-12-03", certification: null,
        hours: { open: "10:00", close: "19:00", days: "Mon–Sat" }, hasCatalogue: true, hasPortfolio: true,
        delivery: { local: true, outstation: true }, installation: true, minOrder: "1 kitchen", serviceAreas: ["Hyderabad", "Bengaluru"], installationAreas: ["Hyderabad", "Bengaluru"],
        portfolio: [{ title: "Lakeview Villa kitchen", caption: "Acrylic shutters with Blum hardware" }],
    }),
    v({
        id: "secunderabad-sanitary", name: "Secunderabad Sanitary House",
        description: "Bath fittings and sanitaryware dealer stocking premium faucet and shower systems.",
        categories: ["bathroom"], materials: ["Faucets", "Basins", "Sanitaryware", "Shower Systems"], brands: ["Jaquar", "Kohler", "Grohe"],
        businessTypes: ["dealer", "retailer"], years: 27, rating: null, reviewCount: 0,
        area: "Secunderabad", city: "Hyderabad", state: "Telangana", pincode: "500003", lat: 17.4399, lng: 78.4983,
        status: "verified", verifiedOn: "2026-10-28", certification: null,
        hours: { open: "10:00", close: "20:00", days: "Mon–Sat" }, hasCatalogue: false, hasPortfolio: false,
        delivery: { local: true, outstation: false }, installation: false, minOrder: null,
    }),
    v({
        id: "kondapur-stone", name: "Kondapur Stone Depot",
        description: "Granite and marble yard.",
        categories: ["flooring"], materials: ["Granite", "Marble"], businessTypes: ["wholesaler"], years: 4, rating: 3.9, reviewCount: 9,
        area: "Kondapur", city: "Hyderabad", state: "Telangana", pincode: "500084", lat: 17.4622, lng: 78.3568,
        status: "suspended", verifiedOn: null, certification: null,
        hours: { open: "09:00", close: "18:00", days: "Mon–Sat" }, hasCatalogue: false, hasPortfolio: false,
        delivery: { local: true, outstation: false }, installation: false, minOrder: null,
    }),
    v({
        id: "weave-fabrics", name: "Weave & Drape Furnishings",
        description: "Curtains, blinds and upholstery fabrics with a measuring and stitching service.",
        categories: ["fabrics"], materials: ["Curtains", "Blinds", "Upholstery Fabric", "Carpets"], brands: ["D'Decor", "Sarom"],
        businessTypes: ["retailer", "service_provider"], years: 9, rating: 4.5, reviewCount: 18,
        area: "Ameerpet", city: "Hyderabad", state: "Telangana", pincode: "500016", lat: 17.4375, lng: 78.4482,
        status: "verified", verifiedOn: "2026-05-20", certification: null,
        hours: { open: "10:30", close: "20:30", days: "Mon–Sun" }, hasCatalogue: true, hasPortfolio: false,
        delivery: { local: true, outstation: false }, installation: true, minOrder: null,
    }),
    v({
        id: "unlisted-wallcraft", name: "Wallcraft Panels",
        description: "Wallpaper and decorative wall panels. Location pending confirmation.",
        categories: ["wall"], materials: ["Wallpaper", "Wall Panels"], businessTypes: ["retailer"], years: 3, rating: 4.1, reviewCount: 6,
        area: "Begumpet", city: "Hyderabad", state: "Telangana", pincode: "500016", lat: null, lng: null,
        status: "verified", verifiedOn: "2026-09-09", certification: null,
        hours: { open: "10:00", close: "19:00", days: "Mon–Sat" }, hasCatalogue: false, hasPortfolio: false,
        delivery: { local: true, outstation: false }, installation: true, minOrder: null,
    }),
    v({
        id: "marblecraft-blr", name: "Marblecraft Bengaluru",
        description: "Imported Italian marble and onyx specialists with CNC inlay work.",
        categories: ["flooring"], materials: ["Italian Marble", "Marble", "Natural Stone"], brands: ["Antolini"],
        businessTypes: ["wholesaler", "fabricator"], years: 18, rating: 4.7, reviewCount: 54,
        area: "Peenya", city: "Bengaluru", state: "Karnataka", pincode: "560058", lat: 13.0285, lng: 77.5197,
        status: "certified", verifiedOn: "2025-06-10", certification: { approvedOn: "2025-07-02", reviewDue: "2027-07-02" },
        hours: { open: "09:00", close: "18:30", days: "Mon–Sat" }, hasCatalogue: true, hasPortfolio: true,
        delivery: { local: true, outstation: true }, installation: true, serviceAreas: ["Bengaluru", "Chennai", "Hyderabad"], minOrder: "150 sq. ft.",
        portfolio: [{ title: "Sadashivanagar residence", caption: "Onyx backlit bar counter" }],
    }),
    v({
        id: "indiranagar-lighting", name: "Indiranagar Lighting Co.",
        description: "Decorative, architectural and smart lighting with lighting-design consultations.",
        categories: ["lighting"], materials: ["Decorative Lighting", "Architectural Lighting", "Smart Lighting"], brands: ["Philips Hue", "Wipro"],
        businessTypes: ["retailer"], years: 10, rating: 4.9, reviewCount: 47,
        area: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038", lat: 12.9784, lng: 77.6408,
        status: "certified", verifiedOn: "2025-04-11", certification: { approvedOn: "2025-05-15", reviewDue: "2027-05-15" },
        hours: { open: "11:00", close: "21:00", days: "Mon–Sun" }, hasCatalogue: true, hasPortfolio: true,
        delivery: { local: true, outstation: true }, installation: false, minOrder: "On request",
    }),
    v({
        id: "whitefield-woodworks", name: "Whitefield Woodworks",
        description: "Custom furniture and carpentry workshop for villas and offices.",
        categories: ["furniture", "services"], materials: ["Custom Furniture", "Upholstery", "Carpentry"],
        businessTypes: ["custom_manufacturer", "contractor"], years: 12, rating: 4.6, reviewCount: 29,
        area: "Whitefield", city: "Bengaluru", state: "Karnataka", pincode: "560066", lat: 12.9698, lng: 77.75,
        status: "verified", verifiedOn: "2026-01-21", certification: null,
        hours: { open: "09:00", close: "19:00", days: "Mon–Sat" }, hasCatalogue: false, hasPortfolio: true,
        delivery: { local: true, outstation: false }, installation: true, minOrder: null, languages: ["English", "Kannada", "Hindi"],
        portfolio: [{ title: "Tech park cafeteria", caption: "120 custom bench seats" }],
    }),
    v({
        id: "pune-plyhouse", name: "Pune Ply House",
        description: "Plywood, laminates and edge-banding supplies for carpenters and designers.",
        categories: ["wood"], materials: ["Plywood", "Laminates", "Veneer"], brands: ["Greenply", "Merino"],
        businessTypes: ["distributor", "retailer"], years: 14, rating: 4.4, reviewCount: 38,
        area: "Kondhwa", city: "Pune", state: "Maharashtra", pincode: "411048", lat: 18.4777, lng: 73.8915,
        status: "verified", verifiedOn: "2025-11-30", certification: null,
        hours: { open: "09:30", close: "20:00", days: "Mon–Sat" }, hasCatalogue: true, hasPortfolio: false,
        delivery: { local: true, outstation: true }, installation: false, minOrder: "10 sheets", serviceAreas: ["Pune", "Mumbai"],
    }),
    v({
        id: "adyar-bath", name: "Adyar Bath Studio",
        description: "Experience centre for faucets, wellness showers and sanitaryware.",
        categories: ["bathroom"], materials: ["Faucets", "Shower Systems", "Sanitaryware"], brands: ["Grohe", "Hansgrohe"],
        businessTypes: ["dealer"], years: 7, rating: 4.5, reviewCount: 21,
        area: "Adyar", city: "Chennai", state: "Tamil Nadu", pincode: "600020", lat: 13.0012, lng: 80.2565,
        status: "certified", verifiedOn: "2025-08-08", certification: { approvedOn: "2025-09-01", reviewDue: "2026-09-01" },
        hours: { open: "10:00", close: "20:00", days: "Mon–Sat" }, hasCatalogue: true, hasPortfolio: true,
        delivery: { local: true, outstation: false }, installation: true, minOrder: null, languages: ["English", "Tamil"],
    }),
    v({
        id: "andheri-glass", name: "Andheri Glass & Aluminium",
        description: "Toughened glass partitions, shower enclosures and aluminium profiles.",
        categories: ["glass"], materials: ["Toughened Glass", "Aluminium", "Stainless Steel"],
        businessTypes: ["fabricator", "service_provider"], years: 16, rating: 4.2, reviewCount: 26,
        area: "Andheri East", city: "Mumbai", state: "Maharashtra", pincode: "400069", lat: 19.1136, lng: 72.8697,
        status: "verified", verifiedOn: "2026-03-17", certification: null,
        hours: { open: "09:00", close: "18:00", days: "Mon–Sat" }, hasCatalogue: false, hasPortfolio: true,
        delivery: { local: true, outstation: true }, installation: true, minOrder: null, languages: ["English", "Hindi", "Marathi"],
        portfolio: [{ title: "BKC office floor", caption: "Frameless glass cabins" }],
    }),
];

export interface BoqLine {
    id: string;
    item: string;
    quantity: string;
    query: string;
    category: string;
}

export interface SampleProject {
    id: string;
    name: string;
    placeId: string;
    boq: BoqLine[];
}

/** PRD §11 example BOQ. Replaced by the project's real BOQ lines once the BOQ API is wired in. */
export const SAMPLE_PROJECTS: SampleProject[] = [
    {
        id: "parkview", name: "Parkview Residence", placeId: "hyd",
        boq: [
            { id: "b1", item: "Italian marble", quantity: "500 sq. ft.", query: "Italian Marble", category: "flooring" },
            { id: "b2", item: "Wooden flooring", quantity: "300 sq. ft.", query: "Wooden Flooring", category: "flooring" },
            { id: "b3", item: "Decorative light fixtures", quantity: "20 units", query: "Decorative Lighting", category: "lighting" },
            { id: "b4", item: "Custom furniture pieces", quantity: "12 units", query: "Custom Furniture", category: "furniture" },
        ],
    },
    {
        id: "lakeview", name: "Lakeview Villa", placeId: "blr",
        boq: [
            { id: "b5", item: "Modular kitchen hardware", quantity: "1 set", query: "Modular Kitchen Hardware", category: "kitchen" },
            { id: "b6", item: "Shower systems", quantity: "4 units", query: "Shower Systems", category: "bathroom" },
        ],
    },
    {
        id: "skyline", name: "Skyline Loft", placeId: "blr",
        boq: [{ id: "b7", item: "Smart lighting", quantity: "35 points", query: "Smart Lighting", category: "lighting" }],
    },
];

/** The signed-in RVYO user, masked for the OTP method picker. Comes from the session once auth is wired in. */
export const CURRENT_USER = {
    name: "Priya N.",
    maskedEmail: "pr•••••@company.com",
    maskedPhone: "+91 ••••••4321",
};

export function getVendor(id: string) {
    return VENDORS.find((vendor) => vendor.id === id) ?? null;
}

export function getPlace(id: string) {
    return PLACES.find((place) => place.id === id) ?? null;
}

export function isDiscoverable(vendor: Vendor) {
    return vendor.status === "verified" || vendor.status === "certified";
}

export function isCertified(vendor: Vendor, now = new Date()) {
    return vendor.status === "certified" && !!vendor.certification && new Date(vendor.certification.reviewDue) >= now;
}
