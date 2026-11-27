/**
 * Browser-only Vendor Marketplace store, used until the marketplace backend exists (same approach as lib/leads).
 *
 * Holds company-level saved vendors, recently viewed, sourcing lists, internal notes, contact-disclosure history and the
 * OTP challenge for contact access. Planned REST contract for the backend team:
 *   GET    /api/v1/vendors?q&lat&lng&radius&filters&sort        search (never returns contact data)
 *   GET    /api/v1/vendors/:id                                    public profile
 *   POST   /api/v1/vendors/:id/contact-disclosures                { method } -> challenge (sends OTP to the RVYO user)
 *   POST   /api/v1/contact-disclosures/:challengeId/verify        { code } -> contact (logged, rate-limited)
 *   GET    /api/v1/contact-disclosures                            company access history
 *   GET/PUT/DELETE /api/v1/saved-vendors/:vendorId
 *   GET/POST/PATCH/DELETE /api/v1/sourcing-lists[/:id[/items/:vendorId]]
 *   PUT    /api/v1/vendors/:id/notes                              company-private note
 */
import { lookupVendorContact, type VendorContact } from "./contacts";
import { CURRENT_USER, getVendor } from "./data";
import { FREE_CONTACT_PLAN, contactUsage, type ContactPlan, type ContactUsage } from "./credits";

// v2: contact credits. Starts every company with no unlocked vendors (v1 seeded one as already unlocked).
const STORAGE_KEY = "boq-saas:vendors:v2";

/** PRD §09 rules. */
export const OTP_RULES = {
    length: 6,
    expiryMs: 5 * 60_000,
    resendCooldownMs: 30_000,
    maxAttempts: 5,
    maxChallengesPerHour: 10,
} as const;

/** Prototype-only code; a real OTP is generated and checked server-side. */
export const PROTOTYPE_OTP = "123456";

export type OtpMethod = "email" | "sms";

export interface Disclosure {
    id: string;
    vendorId: string;
    requestedBy: string;
    method: OtpMethod;
    at: string;
    status: "success" | "failed";
}

export interface SourcingListItem {
    vendorId: string;
    category: string;
    shortlisted: boolean;
    addedBy: string;
    addedAt: string;
}

export interface SourcingList {
    id: string;
    name: string;
    projectId: string | null;
    projectName: string | null;
    location: string;
    categories: string[];
    items: SourcingListItem[];
    notes: string;
    createdBy: string;
    shared: boolean;
    updatedAt: string;
}

export interface ActivityEvent {
    id: string;
    type: "vendor_saved" | "vendor_unsaved" | "list_created" | "vendor_added_to_list" | "vendor_shortlisted"
        | "contact_requested" | "contact_verified" | "contact_failed" | "profile_viewed";
    vendorId?: string;
    listId?: string;
    by: string;
    at: string;
}

interface State {
    saved: Array<{ vendorId: string; savedAt: string }>;
    recent: Array<{ vendorId: string; at: string }>;
    disclosures: Disclosure[];
    /** Company-level persistent unlock (PRD §09 recommendation) — the contact itself is not stored. */
    unlocked: string[];
    lists: SourcingList[];
    notes: Record<string, string>;
    activity: ActivityEvent[];
}

interface Challenge {
    id: string;
    vendorId: string;
    method: OtpMethod;
    createdAt: number;
    expiresAt: number;
    resendAt: number;
    attemptsLeft: number;
    used: boolean;
}

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const H = 3_600_000;
const D = 24 * H;

function uid(prefix: string) {
    const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
    return `${prefix}_${rand}`;
}

function seed(): State {
    return {
        saved: [
            { vendorId: "studio-surface", savedAt: ago(2 * D) },
            { vendorId: "indiranagar-lighting", savedAt: ago(4 * D) },
            { vendorId: "kondapur-stone", savedAt: ago(20 * D) },
        ],
        recent: [{ vendorId: "deccan-timber", at: ago(D) }],
        disclosures: [
            { id: "dc_2", vendorId: "marblecraft-blr", requestedBy: "Arjun K.", method: "sms", at: ago(2 * D), status: "failed" },
        ],
        unlocked: [],
        lists: [
            {
                id: "sl_parkview", name: "Parkview Residence — Marble sourcing", projectId: "parkview", projectName: "Parkview Residence",
                location: "Hyderabad", categories: ["flooring"], shared: true, createdBy: "Priya N.", updatedAt: ago(5 * H),
                notes: "Visited Studio Surface showroom on 14 Nov. Need to confirm bulk pricing before shortlisting.",
                items: [
                    { vendorId: "studio-surface", category: "flooring", shortlisted: true, addedBy: "Priya N.", addedAt: ago(3 * D) },
                    { vendorId: "charminar-tiles", category: "flooring", shortlisted: false, addedBy: "Arjun K.", addedAt: ago(2 * D) },
                ],
            },
            {
                id: "sl_blr_light", name: "Bengaluru — Lighting suppliers", projectId: "skyline", projectName: "Skyline Loft",
                location: "Bengaluru", categories: ["lighting"], shared: true, createdBy: "Arjun K.", updatedAt: ago(D), notes: "",
                items: [{ vendorId: "indiranagar-lighting", category: "lighting", shortlisted: false, addedBy: "Arjun K.", addedAt: ago(D) }],
            },
        ],
        notes: {},
        activity: [],
    };
}

let state: State | null = null;
const challenges = new Map<string, Challenge>();
const listeners = new Set<() => void>();

function load(): State {
    if (state) return state;
    if (typeof window === "undefined") return seed();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        state = raw ? { ...seed(), ...(JSON.parse(raw) as Partial<State>) } : seed();
    } catch {
        state = seed();
    }
    return state;
}

function commit(next: State) {
    state = next;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Storage unavailable (private mode): keep working in memory for this visit.
    }
    listeners.forEach((fn) => fn());
}

function log(s: State, event: Omit<ActivityEvent, "id" | "at" | "by">): ActivityEvent[] {
    return [{ id: uid("ev"), at: new Date().toISOString(), by: CURRENT_USER.name, ...event }, ...s.activity].slice(0, 200);
}

/* Contact credits ------------------------------------------------------ */

let contactPlan: ContactPlan = FREE_CONTACT_PLAN;

/** Set from the workspace's billing plan (see useContactPlan). Re-renders subscribers. */
export function setContactPlan(plan: ContactPlan) {
    if (plan.tier === contactPlan.tier && plan.limit === contactPlan.limit && plan.period === contactPlan.period && plan.planName === contactPlan.planName) return;
    contactPlan = plan;
    if (state) state = { ...state };
    listeners.forEach((fn) => fn());
}

export function getContactPlan() {
    return contactPlan;
}

/** Credits used and left. Each vendor is charged once, on its first successful OTP check. */
export function getContactUsage(s: State = load(), now = new Date()): ContactUsage {
    return contactUsage(s.disclosures.filter((d) => d.status === "success"), contactPlan, now);
}

function assertCredit(vendorId: string) {
    const s = load();
    if (s.unlocked.includes(vendorId)) return;
    const usage = getContactUsage(s);
    if (usage.remaining > 0) return;
    throw new ContactAccessError(
        "quota",
        usage.tier === "free"
            ? `You've used all ${usage.limit} free contacts. Buy credits or upgrade your plan to unlock more vendors.`
            : `You've used all ${usage.limit} contacts for this month. Buy credits or upgrade your plan to unlock more vendors.`,
    );
}

export function subscribe(fn: () => void) {
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) {
            state = null;
            fn();
        }
    };
    window.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(fn);
        window.removeEventListener("storage", onStorage);
    };
}

export function getSnapshot(): State {
    return load();
}

const SERVER_SNAPSHOT = seed();
export function getServerSnapshot(): State {
    return SERVER_SNAPSHOT;
}

/* Saved vendors -------------------------------------------------------- */

export function isSaved(s: State, vendorId: string) {
    return s.saved.some((x) => x.vendorId === vendorId);
}

export function toggleSaved(vendorId: string): boolean {
    const s = load();
    const saved = isSaved(s, vendorId);
    commit({
        ...s,
        saved: saved ? s.saved.filter((x) => x.vendorId !== vendorId) : [{ vendorId, savedAt: new Date().toISOString() }, ...s.saved],
        activity: log(s, { type: saved ? "vendor_unsaved" : "vendor_saved", vendorId }),
    });
    return !saved;
}

/* Recently viewed ------------------------------------------------------ */

export function recordView(vendorId: string) {
    const s = load();
    if (s.recent[0]?.vendorId === vendorId) return;
    commit({
        ...s,
        recent: [{ vendorId, at: new Date().toISOString() }, ...s.recent.filter((x) => x.vendorId !== vendorId)].slice(0, 20),
        activity: log(s, { type: "profile_viewed", vendorId }),
    });
}

/* Notes ---------------------------------------------------------------- */

export function saveNote(vendorId: string, text: string) {
    const s = load();
    commit({ ...s, notes: { ...s.notes, [vendorId]: text } });
}

/* Sourcing lists ------------------------------------------------------- */

export function createList(input: { name: string; projectId: string | null; projectName: string | null; location: string; categories: string[]; notes?: string }): SourcingList {
    const s = load();
    const list: SourcingList = {
        id: uid("sl"), items: [], notes: input.notes ?? "", createdBy: CURRENT_USER.name, shared: false,
        updatedAt: new Date().toISOString(), ...input, name: input.name.trim(),
    };
    commit({ ...s, lists: [list, ...s.lists], activity: log(s, { type: "list_created", listId: list.id }) });
    return list;
}

function updateList(listId: string, change: (list: SourcingList) => SourcingList, event?: Omit<ActivityEvent, "id" | "at" | "by">) {
    const s = load();
    commit({
        ...s,
        lists: s.lists.map((l) => (l.id === listId ? { ...change(l), updatedAt: new Date().toISOString() } : l)),
        activity: event ? log(s, event) : s.activity,
    });
}

export function addToList(listId: string, vendorId: string, category: string) {
    updateList(listId, (l) => (l.items.some((i) => i.vendorId === vendorId) ? l : {
        ...l,
        categories: l.categories.includes(category) ? l.categories : [...l.categories, category],
        items: [...l.items, { vendorId, category, shortlisted: false, addedBy: CURRENT_USER.name, addedAt: new Date().toISOString() }],
    }), { type: "vendor_added_to_list", vendorId, listId });
}

export function removeFromList(listId: string, vendorId: string) {
    updateList(listId, (l) => ({ ...l, items: l.items.filter((i) => i.vendorId !== vendorId) }));
}

export function toggleShortlist(listId: string, vendorId: string) {
    updateList(listId, (l) => ({ ...l, items: l.items.map((i) => (i.vendorId === vendorId ? { ...i, shortlisted: !i.shortlisted } : i)) }), { type: "vendor_shortlisted", vendorId, listId });
}

export function setListNotes(listId: string, notes: string) {
    updateList(listId, (l) => ({ ...l, notes }));
}

export function setListShared(listId: string, shared: boolean) {
    updateList(listId, (l) => ({ ...l, shared }));
}

export function deleteList(listId: string) {
    const s = load();
    commit({ ...s, lists: s.lists.filter((l) => l.id !== listId) });
}

/* OTP-protected contact disclosure (PRD §09) --------------------------- */

export class ContactAccessError extends Error {
    constructor(public code: "rate_limited" | "expired" | "invalid" | "locked" | "used" | "cooldown" | "unavailable" | "quota", message: string, public attemptsLeft?: number) {
        super(message);
    }
}

export interface ChallengeView {
    id: string;
    method: OtpMethod;
    destination: string;
    expiresAt: number;
    resendAt: number;
    attemptsLeft: number;
}

const view = (c: Challenge): ChallengeView => ({
    id: c.id, method: c.method, destination: c.method === "email" ? CURRENT_USER.maskedEmail : CURRENT_USER.maskedPhone,
    expiresAt: c.expiresAt, resendAt: c.resendAt, attemptsLeft: c.attemptsLeft,
});

/** Starts a challenge. The OTP verifies the RVYO user, never the vendor. */
export function requestContactOtp(vendorId: string, method: OtpMethod, now = Date.now()): ChallengeView {
    const vendor = getVendor(vendorId);
    if (!vendor || (vendor.status !== "verified" && vendor.status !== "certified")) {
        throw new ContactAccessError("unavailable", "This vendor is no longer available.");
    }
    assertCredit(vendorId);
    const recent = [...challenges.values()].filter((c) => now - c.createdAt < H);
    if (recent.length >= OTP_RULES.maxChallengesPerHour) {
        throw new ContactAccessError("rate_limited", "Too many verification requests. Try again in an hour.");
    }
    const challenge: Challenge = {
        id: uid("otp"), vendorId, method, createdAt: now, used: false,
        expiresAt: now + OTP_RULES.expiryMs, resendAt: now + OTP_RULES.resendCooldownMs, attemptsLeft: OTP_RULES.maxAttempts,
    };
    challenges.set(challenge.id, challenge);
    return view(challenge);
}

export function resendContactOtp(challengeId: string, now = Date.now()): ChallengeView {
    const old = challenges.get(challengeId);
    if (!old) throw new ContactAccessError("expired", "This code has expired. Request a new one.");
    if (now < old.resendAt) throw new ContactAccessError("cooldown", "Please wait before requesting another code.");
    challenges.delete(challengeId);
    return requestContactOtp(old.vendorId, old.method, now);
}

/** Prototype helper behind the "Simulate expired code" link. */
export function expireContactOtp(challengeId: string) {
    const c = challenges.get(challengeId);
    if (c) c.expiresAt = 0;
}

function recordDisclosure(vendorId: string, method: OtpMethod, status: Disclosure["status"]) {
    const s = load();
    commit({
        ...s,
        disclosures: [{ id: uid("dc"), vendorId, requestedBy: CURRENT_USER.name, method, at: new Date().toISOString(), status }, ...s.disclosures],
        unlocked: status === "success" && !s.unlocked.includes(vendorId) ? [...s.unlocked, vendorId] : s.unlocked,
        activity: log(s, { type: status === "success" ? "contact_verified" : "contact_failed", vendorId }),
    });
}

export function verifyContactOtp(challengeId: string, code: string, now = Date.now()): VendorContact {
    const c = challenges.get(challengeId);
    if (!c) throw new ContactAccessError("expired", "This code has expired. Request a new one.");
    if (c.used) throw new ContactAccessError("used", "This code has already been used. Request a new one.");
    if (now > c.expiresAt) throw new ContactAccessError("expired", "This code has expired. Request a new one.");
    if (c.attemptsLeft <= 0) throw new ContactAccessError("locked", "Too many incorrect attempts. Request a new code.", 0);
    if (!/^\d{6}$/.test(code) || code !== PROTOTYPE_OTP) {
        c.attemptsLeft -= 1;
        if (c.attemptsLeft <= 0) {
            recordDisclosure(c.vendorId, c.method, "failed");
            throw new ContactAccessError("locked", "Too many incorrect attempts. Request a new code.", 0);
        }
        throw new ContactAccessError("invalid", `Incorrect code. ${c.attemptsLeft} attempt${c.attemptsLeft === 1 ? "" : "s"} left.`, c.attemptsLeft);
    }
    assertCredit(c.vendorId);
    const contact = lookupVendorContact(c.vendorId);
    if (!contact) throw new ContactAccessError("unavailable", "This vendor has not published contact details.");
    c.used = true;
    recordDisclosure(c.vendorId, c.method, "success");
    return contact;
}

/**
 * Re-fetch the current approved contact for a vendor this company already unlocked (persistent company access).
 * Server-side this re-checks the disclosure record; it never trusts client state alone.
 */
export function getUnlockedContact(vendorId: string): VendorContact | null {
    return load().unlocked.includes(vendorId) ? lookupVendorContact(vendorId) : null;
}

/** Test hook. */
export function __resetVendorStore() {
    state = null;
    contactPlan = FREE_CONTACT_PLAN;
    challenges.clear();
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}
