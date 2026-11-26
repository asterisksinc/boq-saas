"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Copy, FileText, Lock, Mail, MessageSquareText, Phone, Plus, Search, X } from "lucide-react";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABEL, CATEGORIES, CATEGORY_LABEL, CURRENT_USER, SAMPLE_PROJECTS, getPlace, type Vendor } from "@/lib/vendors/data";
import { EMPTY_ADVANCED, QUICK_FILTERS, categoryCounts, type AdvancedFilters, type QuickFilter } from "@/lib/vendors/search";
import {
    ContactAccessError, OTP_RULES, PROTOTYPE_OTP, addToList, createList, expireContactOtp, requestContactOtp, resendContactOtp, verifyContactOtp,
    type ChallengeView, type OtpMethod,
} from "@/lib/vendors/store";
import type { VendorContact } from "@/lib/vendors/contacts";
import { CertifiedBadge, Layer, Modal, VendorLogo, useVendorStore } from "./VendorUi";

/* Filter drawer (PRD §05, progressive disclosure) ------------------------------------------------ */

const LANGUAGES = ["English", "Hindi", "Telugu", "Kannada", "Tamil", "Marathi", "Urdu"];

export function FilterDrawer({ open, value, quick, onApply, onClose, previewCount }: {
    open: boolean; value: AdvancedFilters; quick: QuickFilter[]; onApply: (f: AdvancedFilters, quick: QuickFilter[]) => void; onClose: () => void;
    /** Live result count for the draft filters, when a search is active. */
    previewCount?: (f: AdvancedFilters, quick: QuickFilter[]) => number;
}) {
    const [draft, setDraft] = useState(value);
    const [quickDraft, setQuickDraft] = useState(quick);
    const [allCats, setAllCats] = useState(false);
    const counts = useMemo(() => categoryCounts(), []);
    useEffect(() => { if (open) { setDraft(value); setQuickDraft(quick); } }, [open, value, quick]);
    const panel = useRef<HTMLElement>(null);
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        window.setTimeout(() => panel.current?.querySelector<HTMLElement>("button")?.focus(), 0);
        return () => {
            document.removeEventListener("keydown", onKey);
            previous?.focus?.();
        };
    }, [open, onClose]);
    const preview = useMemo(() => (open && previewCount ? previewCount(draft, quickDraft) : null), [open, previewCount, draft, quickDraft]);
    if (!open) return null;

    const toggle = <K extends "verification" | "categories" | "businessTypes" | "languages">(key: K, item: AdvancedFilters[K][number]) =>
        setDraft((d) => {
            const list = d[key] as string[];
            return { ...d, [key]: list.includes(item as string) ? list.filter((x) => x !== item) : [...list, item] };
        });

    const cats = allCats ? CATEGORIES : CATEGORIES.slice(0, 5);

    return (
        <Layer lockScroll>
        <div className="vm-overlay vm-overlay--drawer" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <aside ref={panel} className="vm-drawer" role="dialog" aria-modal="true" aria-labelledby="vm-filter-title">
                <header className="vm-drawer-head">
                    <div>
                        <h2 id="vm-filter-title">Filter vendors</h2>
                        <p>Filters can be combined</p>
                    </div>
                    <button type="button" className="vm-icon-btn" aria-label="Close filters" onClick={onClose}><X size={18} /></button>
                </header>
                <div className="vm-drawer-body">
                    <fieldset>
                        <legend>Quick filters</legend>
                        <div className="vm-chips">
                            {QUICK_FILTERS.map((f) => {
                                const on = quickDraft.includes(f.value);
                                return (
                                    <button key={f.value} type="button" className={`vm-chip vm-chip--toggle${on ? " is-on" : ""}`} aria-pressed={on}
                                        onClick={() => setQuickDraft((qs) => (on ? qs.filter((x) => x !== f.value) : [...qs, f.value]))}>{f.label}</button>
                                );
                            })}
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Vendor verification</legend>
                        {([["certified", "RVYO Certified"], ["verified", "Verified business"], ["profileComplete", "Profile complete (catalogue + portfolio)"]] as const).map(([k, label]) => (
                            <label key={k} className="vm-checkrow"><input type="checkbox" checked={draft.verification.includes(k)} onChange={() => toggle("verification", k)} /> {label}</label>
                        ))}
                    </fieldset>
                    <fieldset>
                        <legend>Material categories</legend>
                        {cats.map((c) => (
                            <label key={c.key} className="vm-checkrow">
                                <input type="checkbox" checked={draft.categories.includes(c.key)} onChange={() => toggle("categories", c.key)} /> {c.label}
                                <span className="vm-count">{counts[c.key] ?? 0}</span>
                            </label>
                        ))}
                        <button type="button" className="vm-link" onClick={() => setAllCats((v) => !v)}>{allCats ? "Show fewer" : `Show all ${CATEGORIES.length} categories`}</button>
                    </fieldset>
                    <fieldset>
                        <legend>Business type</legend>
                        {BUSINESS_TYPES.map((t) => (
                            <label key={t.value} className="vm-checkrow"><input type="checkbox" checked={draft.businessTypes.includes(t.value)} onChange={() => toggle("businessTypes", t.value)} /> {t.label}</label>
                        ))}
                    </fieldset>
                    <fieldset>
                        <legend>Additional filters</legend>
                        {([["hasCatalogue", "Has product catalogue"], ["hasPortfolio", "Has portfolio"], ["installation", "Offers installation"]] as const).map(([k, label]) => (
                            <label key={k} className="vm-checkrow"><input type="checkbox" checked={draft[k]} onChange={() => setDraft((d) => ({ ...d, [k]: !d[k] }))} /> {label}</label>
                        ))}
                    </fieldset>
                    <fieldset>
                        <legend>Delivery</legend>
                        <div className="vm-seg">
                            {([["", "Any"], ["local", "Local"], ["outstation", "Outstation"]] as const).map(([k, label]) => (
                                <button key={k} type="button" className={draft.delivery === k ? "is-on" : ""} aria-pressed={draft.delivery === k} onClick={() => setDraft((d) => ({ ...d, delivery: k }))}>{label}</button>
                            ))}
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Minimum rating</legend>
                        <div className="vm-seg">
                            {[0, 4, 4.5, 4.8].map((r) => (
                                <button key={r} type="button" className={draft.minRating === r ? "is-on" : ""} aria-pressed={draft.minRating === r} onClick={() => setDraft((d) => ({ ...d, minRating: r }))}>{r ? `${r}+` : "Any"}</button>
                            ))}
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Years in business</legend>
                        <div className="vm-seg">
                            {[0, 5, 10, 15].map((y) => (
                                <button key={y} type="button" className={draft.minYears === y ? "is-on" : ""} aria-pressed={draft.minYears === y} onClick={() => setDraft((d) => ({ ...d, minYears: y }))}>{y ? `${y}+ yrs` : "Any"}</button>
                            ))}
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Languages</legend>
                        <div className="vm-chips">
                            {LANGUAGES.map((l) => (
                                <button key={l} type="button" className={`vm-chip vm-chip--toggle${draft.languages.includes(l) ? " is-on" : ""}`} aria-pressed={draft.languages.includes(l)} onClick={() => toggle("languages", l)}>{l}</button>
                            ))}
                        </div>
                    </fieldset>
                    <p className="vm-fine">Price and minimum-order filters appear once vendors publish reliable pricing data.</p>
                </div>
                <footer className="vm-drawer-foot">
                    <button type="button" className="vm-btn vm-btn--ghost" onClick={() => { setDraft(EMPTY_ADVANCED); setQuickDraft([]); }}>Clear all</button>
                    <button type="button" className="vm-btn vm-btn--primary" onClick={() => onApply(draft, quickDraft)}>
                        {preview === null ? "Apply filters" : preview === 0 ? "No matches — apply anyway" : `Show ${preview} vendor${preview === 1 ? "" : "s"}`}
                    </button>
                </footer>
            </aside>
        </div>
        </Layer>
    );
}

/* Secure contact disclosure (PRD §09: method → OTP → revealed) ---------------------------------- */

type Step = { kind: "method" } | { kind: "otp"; challenge: ChallengeView } | { kind: "done"; contact: VendorContact };

export function ContactAccessModal({ vendor, certified, open, onClose, onUnlocked, onNotify }: {
    vendor: Vendor; certified: boolean; open: boolean; onClose: () => void; onUnlocked: (contact: VendorContact) => void; onNotify: (m: string) => void;
}) {
    const [step, setStep] = useState<Step>({ kind: "method" });
    const [method, setMethod] = useState<OtpMethod>("email");
    const [digits, setDigits] = useState<string[]>(Array(OTP_RULES.length).fill(""));
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(Date.now());
    const inputs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (open) {
            setStep({ kind: "method" });
            setDigits(Array(OTP_RULES.length).fill(""));
            setError(null);
        }
    }, [open]);

    useEffect(() => {
        if (step.kind !== "otp") return;
        const t = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(t);
    }, [step.kind]);

    const send = async () => {
        setBusy(true);
        setError(null);
        try {
            await new Promise((r) => window.setTimeout(r, 450));
            const challenge = requestContactOtp(vendor.id, method);
            setDigits(Array(OTP_RULES.length).fill(""));
            setStep({ kind: "otp", challenge });
            setNow(Date.now());
            window.setTimeout(() => inputs.current[0]?.focus(), 0);
        } catch (err) {
            setError(err instanceof ContactAccessError ? err.message : "We couldn't send a code right now. Try again in a moment.");
        } finally {
            setBusy(false);
        }
    };

    const resend = () => {
        if (step.kind !== "otp") return;
        try {
            const challenge = resendContactOtp(step.challenge.id);
            setStep({ kind: "otp", challenge });
            setDigits(Array(OTP_RULES.length).fill(""));
            setError(null);
            onNotify(`A new code was sent to ${challenge.destination}.`);
        } catch (err) {
            setError(err instanceof ContactAccessError ? err.message : "Couldn't resend the code.");
        }
    };

    const verify = async () => {
        if (step.kind !== "otp") return;
        setBusy(true);
        setError(null);
        try {
            await new Promise((r) => window.setTimeout(r, 350));
            const contact = verifyContactOtp(step.challenge.id, digits.join(""));
            setStep({ kind: "done", contact });
            onUnlocked(contact);
        } catch (err) {
            if (err instanceof ContactAccessError) {
                setError(err.message);
                if (err.code === "invalid") {
                    setDigits(Array(OTP_RULES.length).fill(""));
                    inputs.current[0]?.focus();
                    setStep({ kind: "otp", challenge: { ...step.challenge, attemptsLeft: err.attemptsLeft ?? 0 } });
                }
            } else setError("Verification failed. Try again.");
        } finally {
            setBusy(false);
        }
    };

    const setDigit = (i: number, raw: string) => {
        const clean = raw.replace(/\D/g, "");
        if (clean.length > 1) {
            const next = clean.slice(0, OTP_RULES.length).split("");
            setDigits(Array.from({ length: OTP_RULES.length }, (_, k) => next[k] ?? ""));
            inputs.current[Math.min(next.length, OTP_RULES.length - 1)]?.focus();
            return;
        }
        setDigits((d) => d.map((x, k) => (k === i ? clean : x)));
        if (clean && i < OTP_RULES.length - 1) inputs.current[i + 1]?.focus();
    };

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            onNotify("Number copied.");
        } catch {
            onNotify("Couldn't copy. Select the number to copy it.");
        }
    };

    const expired = step.kind === "otp" && now > step.challenge.expiresAt;
    const resendIn = step.kind === "otp" ? Math.max(0, Math.ceil((step.challenge.resendAt - now) / 1000)) : 0;
    const locked = step.kind === "otp" && step.challenge.attemptsLeft <= 0;

    return (
        <Modal open={open} onClose={onClose} labelledBy="vm-contact-title" sheet>
            {step.kind === "method" ? (
                <div className="vm-sheet">
                    <header className="vm-sheet-head">
                        <h2 id="vm-contact-title">Secure Contact Access</h2>
                        <p>Verify your RVYO account to reveal {vendor.name}&apos;s contact information.</p>
                    </header>
                    <div className="vm-sheet-card vm-methods" role="radiogroup" aria-label="Verification method">
                        {([["email", Mail, "Email Verification", CURRENT_USER.maskedEmail, true], ["sms", MessageSquareText, "SMS Verification", CURRENT_USER.maskedPhone, false]] as const).map(([value, Icon, label, dest, rec]) => (
                            <label key={value} className={`vm-method${method === value ? " is-on" : ""}`}>
                                <input type="radio" name="vm-method" checked={method === value} onChange={() => setMethod(value)} />
                                <Icon size={20} aria-hidden="true" />
                                <span><strong>{label}</strong><small>{dest}</small></span>
                                {rec ? <span className="vm-rec">Recommended</span> : null}
                            </label>
                        ))}
                    </div>
                    {error ? <p className="vm-error" role="alert">{error}</p> : null}
                    <button type="button" className="vm-btn vm-btn--primary vm-btn--block" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send OTP"}</button>
                    <p className="vm-sheet-fine">Verify your RVYO account to reveal {vendor.name}&apos;s contact information.</p>
                </div>
            ) : step.kind === "otp" ? (
                <div className="vm-sheet">
                    <header className="vm-sheet-head">
                        <h2 id="vm-contact-title">Enter Verification Code</h2>
                        <p>We sent a 6-digit OTP to <strong>{step.challenge.destination}</strong>. It expires in 5 minutes.</p>
                    </header>
                    <div className="vm-sheet-card">
                        <div className="vm-otp-boxes" onPaste={(e) => { e.preventDefault(); setDigit(0, e.clipboardData.getData("text")); }}>
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputs.current[i] = el; }}
                                    value={d}
                                    placeholder="0"
                                    inputMode="numeric"
                                    autoComplete={i === 0 ? "one-time-code" : "off"}
                                    maxLength={OTP_RULES.length}
                                    aria-label={`Digit ${i + 1}`}
                                    disabled={expired || locked}
                                    className={error && !expired ? "has-error" : ""}
                                    onChange={(e) => setDigit(i, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Backspace" && !d && i > 0) inputs.current[i - 1]?.focus();
                                        if (e.key === "Enter" && digits.every(Boolean)) void verify();
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    {expired ? <p className="vm-error" role="alert">This code has expired. Request a new one.</p>
                        : error ? <p className="vm-error" role="alert">{error}</p> : null}
                    <button type="button" className="vm-btn vm-btn--primary vm-btn--block" onClick={verify} disabled={busy || expired || locked || !digits.every(Boolean)}>
                        {busy ? "Verifying…" : "Verify & Reveal Contact"}
                    </button>
                    <div className="vm-otp-foot">
                        {resendIn > 0 && !expired
                            ? <span className="vm-resend">Resend <b>00:{String(resendIn).padStart(2, "0")}s</b></span>
                            : <button type="button" className="vm-link" onClick={expired || locked ? send : resend}>{expired || locked ? "Send a new code" : "Resend code"}</button>}
                        <button type="button" className="vm-link" onClick={() => { setStep({ kind: "method" }); setError(null); }}>Change Method</button>
                    </div>
                    <p className="vm-sheet-fine vm-sheet-fine--left">
                        Prototype: use code <strong>{PROTOTYPE_OTP}</strong>.
                        {!expired ? <> <button type="button" className="vm-sim-link" onClick={() => { expireContactOtp(step.challenge.id); setNow(Date.now() + 1); }}>Simulate expired code</button></> : null}
                    </p>
                </div>
            ) : (
                <div className="vm-sheet">
                    <header className="vm-sheet-head">
                        <span className="vm-tag vm-tag--green">OTP Verified</span>
                        <h2 id="vm-contact-title">Contact Information Unlocked</h2>
                    </header>
                    <div className="vm-sheet-card">
                        <ContactDetails contact={step.contact} onCopy={copy} actions={false} />
                    </div>
                    <p className="vm-sheet-fine vm-sheet-fine--left">Access is recorded for your company. This does not select the vendor for a project.</p>
                </div>
            )}
        </Modal>
    );
}

export function ContactDetails({ contact, onCopy, actions = true }: { contact: VendorContact; onCopy: (text: string) => void; actions?: boolean }) {
    return (
        <>
            <dl className="vm-contact">
                <div><dt>Contact Number</dt><dd>{contact.phone}</dd></div>
                <div><dt>Email Address</dt><dd>{contact.email}</dd></div>
                <div><dt>Business Address</dt><dd>{contact.address}</dd></div>
            </dl>
            {actions ? <div className="vm-contact-actions">
                <a className="vm-btn vm-btn--primary" href={`tel:${contact.phone.replace(/\s/g, "")}`}><Phone size={16} /> Call</a>
                <a className="vm-btn" href={`mailto:${contact.email}`}><Mail size={16} /> Email</a>
                <button type="button" className="vm-btn" onClick={() => onCopy(contact.phone)}><Copy size={16} /> Copy</button>
            </div> : null}
        </>
    );
}

/* Vendor comparison (PRD §16) ------------------------------------------------------------------- */

export function CompareModal({ open, vendors, certifiedOf, onClose }: { open: boolean; vendors: Vendor[]; certifiedOf: (v: Vendor) => boolean; onClose: () => void }) {
    const rows: Array<[string, (v: Vendor) => string]> = [
        ["Certification", (v) => (certifiedOf(v) ? "RVYO Certified" : v.verifiedOn ? "Verified" : "—")],
        ["Location", (v) => `${v.area}, ${v.city}`],
        ["Business type", (v) => v.businessTypes.map((t) => BUSINESS_TYPE_LABEL[t]).join(", ")],
        ["Materials", (v) => v.materials.join(", ")],
        ["Delivery", (v) => (v.delivery.outstation ? "Local + outstation" : v.delivery.local ? "Local" : "No")],
        ["Installation", (v) => (v.installation ? "Yes" : "No")],
        ["Rating", (v) => (v.rating === null ? "No reviews yet" : `${v.rating.toFixed(1)} (${v.reviewCount})`)],
        ["Experience", (v) => `${v.years} years`],
        ["Minimum order", (v) => v.minOrder ?? "Not published"],
    ];
    return (
        <Modal open={open} onClose={onClose} labelledBy="vm-compare-title" wide>
            <h2 id="vm-compare-title" className="vm-modal-title">Compare vendors</h2>
            <p className="vm-muted">Only sourced profile data is shown. Pricing and availability are not displayed.</p>
            <div className="vm-compare-scroll">
                <table className="vm-compare">
                    <thead>
                        <tr>
                            <th aria-label="Attribute" />
                            {vendors.map((v) => <th key={v.id}><span className="vm-compare-head"><VendorLogo vendor={v} size={26} /> {v.name}</span></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(([label, get]) => (
                            <tr key={label}><th scope="row">{label}</th>{vendors.map((v) => <td key={v.id}>{get(v)}</td>)}</tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
}

/* BOQ-to-vendor discovery (PRD §11) ------------------------------------------------------------- */

export function BoqModal({ open, onClose, onFind }: { open: boolean; onClose: () => void; onFind: (query: string, placeId: string, projectId: string) => void }) {
    const [projectId, setProjectId] = useState(SAMPLE_PROJECTS[0].id);
    const project = SAMPLE_PROJECTS.find((p) => p.id === projectId) ?? SAMPLE_PROJECTS[0];
    const place = getPlace(project.placeId);
    return (
        <Modal open={open} onClose={onClose} labelledBy="vm-boq-title">
            <h2 id="vm-boq-title" className="vm-modal-title">Bill of Quantities</h2>
            <p className="vm-muted">Select an item to find vendors for it.</p>
            <label className="vm-field">
                <span>Project</span>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    {SAMPLE_PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name} · {getPlace(p.placeId)?.city}</option>)}
                </select>
            </label>
            <ul className="vm-boq-list">
                {project.boq.map((line) => (
                    <li key={line.id}>
                        <span className="vm-boq-icon"><FileText size={16} /></span>
                        <span><strong>{line.item}</strong><small>{line.quantity} · {CATEGORY_LABEL[line.category]}</small></span>
                        <button type="button" className="vm-btn vm-btn--sm" onClick={() => onFind(line.query, project.placeId, project.id)}><Search size={14} /> Find Vendors</button>
                    </li>
                ))}
            </ul>
            <p className="vm-fine">Project location ({place?.city}) will be pre-filled in the marketplace search.</p>
        </Modal>
    );
}

/* Add to sourcing list (PRD §10) ---------------------------------------------------------------- */

export function AddToListModal({ vendor, open, defaultProjectId, onClose, onDone }: {
    vendor: Vendor | null; open: boolean; defaultProjectId?: string | null; onClose: () => void; onDone: (message: string) => void;
}) {
    const store = useVendorStore();
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [projectId, setProjectId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setCreating(store.lists.length === 0);
        setName("");
        setProjectId(defaultProjectId ?? "");
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (!vendor) return null;
    const category = vendor.categories[0];

    const create = () => {
        const trimmed = name.trim();
        if (trimmed.length < 3) {
            setError("Give the list a name of at least 3 characters.");
            return;
        }
        if (store.lists.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())) {
            setError("A sourcing list with this name already exists.");
            return;
        }
        const project = SAMPLE_PROJECTS.find((p) => p.id === projectId) ?? null;
        const list = createList({
            name: trimmed, projectId: project?.id ?? null, projectName: project?.name ?? null,
            location: project ? getPlace(project.placeId)?.city ?? vendor.city : vendor.city, categories: [category],
        });
        addToList(list.id, vendor.id, category);
        onDone(`${vendor.name} added to ${list.name}.`);
    };

    return (
        <Modal open={open} onClose={onClose} labelledBy="vm-addlist-title">
            <h2 id="vm-addlist-title" className="vm-modal-title">Add to sourcing list</h2>
            <p className="vm-muted">Organise {vendor.name} under a project or material.</p>
            {!creating ? (
                <>
                    <ul className="vm-pick-list">
                        {store.lists.map((l) => {
                            const has = l.items.some((i) => i.vendorId === vendor.id);
                            return (
                                <li key={l.id}>
                                    <button
                                        type="button"
                                        disabled={has}
                                        onClick={() => { addToList(l.id, vendor.id, category); onDone(`${vendor.name} added to ${l.name}.`); }}
                                    >
                                        <span><strong>{l.name}</strong><small>{l.projectName ?? "No project"} · {l.location} · {l.items.length} vendor{l.items.length === 1 ? "" : "s"}</small></span>
                                        {has ? <span className="vm-added"><Check size={14} /> Added</span> : <Plus size={16} />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <button type="button" className="vm-btn vm-btn--block" onClick={() => setCreating(true)}><Plus size={16} /> New sourcing list</button>
                </>
            ) : (
                <NewListFields name={name} setName={(n) => { setName(n); setError(null); }} projectId={projectId} setProjectId={setProjectId} error={error}>
                    <div className="vm-modal-actions">
                        {store.lists.length ? <button type="button" className="vm-btn" onClick={() => setCreating(false)}>Back</button> : null}
                        <button type="button" className="vm-btn vm-btn--primary" onClick={create}>Create &amp; add</button>
                    </div>
                </NewListFields>
            )}
        </Modal>
    );
}

export function NewListFields({ name, setName, projectId, setProjectId, error, children }: {
    name: string; setName: (v: string) => void; projectId: string; setProjectId: (v: string) => void; error: string | null; children: ReactNode;
}) {
    return (
        <form className="vm-form" onSubmit={(e) => e.preventDefault()} noValidate>
            <label className="vm-field">
                <span>List name <em aria-hidden="true">*</em></span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lakeview Villa — Kitchen suppliers" aria-invalid={!!error} maxLength={80} required />
            </label>
            <label className="vm-field">
                <span>Linked project <small>(optional)</small></span>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">No project</option>
                    {SAMPLE_PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </label>
            {error ? <p className="vm-error" role="alert">{error}</p> : null}
            {children}
        </form>
    );
}

export function NewListModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string, name: string) => void }) {
    const store = useVendorStore();
    const [name, setName] = useState("");
    const [projectId, setProjectId] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { if (open) { setName(""); setProjectId(""); setCategories([]); setError(null); } }, [open]);
    const create = () => {
        const trimmed = name.trim();
        if (trimmed.length < 3) return setError("Give the list a name of at least 3 characters.");
        if (store.lists.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())) return setError("A sourcing list with this name already exists.");
        const project = SAMPLE_PROJECTS.find((p) => p.id === projectId) ?? null;
        const list = createList({
            name: trimmed, projectId: project?.id ?? null, projectName: project?.name ?? null,
            location: project ? getPlace(project.placeId)?.city ?? "" : "Any location", categories,
        });
        onCreated(list.id, list.name);
    };
    return (
        <Modal open={open} onClose={onClose} labelledBy="vm-newlist-title">
            <h2 id="vm-newlist-title" className="vm-modal-title">New sourcing list</h2>
            <p className="vm-muted">Group shortlisted vendors by project, location and material.</p>
            <NewListFields name={name} setName={(n) => { setName(n); setError(null); }} projectId={projectId} setProjectId={setProjectId} error={error}>
                <fieldset className="vm-field">
                    <span>Material categories</span>
                    <div className="vm-chips">
                        {CATEGORIES.map((c) => (
                            <button key={c.key} type="button" className={`vm-chip vm-chip--toggle${categories.includes(c.key) ? " is-on" : ""}`} aria-pressed={categories.includes(c.key)}
                                onClick={() => setCategories((cs) => (cs.includes(c.key) ? cs.filter((x) => x !== c.key) : [...cs, c.key]))}>{c.label}</button>
                        ))}
                    </div>
                </fieldset>
                <div className="vm-modal-actions">
                    <button type="button" className="vm-btn" onClick={onClose}>Cancel</button>
                    <button type="button" className="vm-btn vm-btn--primary" onClick={create}>Create list</button>
                </div>
            </NewListFields>
        </Modal>
    );
}

