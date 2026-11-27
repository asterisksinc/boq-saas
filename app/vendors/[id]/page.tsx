"use client";

import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Award, BadgeCheck, Bookmark, BookmarkCheck, BookOpen, Box, Flag, FolderOpen, ImageIcon, Layers, ListChecks, ListPlus, Lock, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { AddToListModal, ContactAccessModal, ContactDetails } from "@/components/vendors/VendorDialogs";
import { Modal, Toast, VendorLogo, businessTypes, useVendorStore } from "@/components/vendors/VendorUi";
import { BUSINESS_TYPE_LABEL, CATEGORY_LABEL, getVendor, isCertified, isDiscoverable, type Vendor } from "@/lib/vendors/data";
import { isOpenNow } from "@/lib/vendors/search";
import { getUnlockedContact, isSaved, recordView, saveNote, toggleSaved } from "@/lib/vendors/store";
import type { VendorContact } from "@/lib/vendors/contacts";
import "../vendors.css";

type ProfileTab = "overview" | "business" | "coverage";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const REPORT_REASONS = ["Incorrect business details", "Fake or duplicate listing", "Contact details don't work", "Misleading certification claim", "Other"];

function VendorProfileInner() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const params = useSearchParams();
    const store = useVendorStore();
    const vendor = getVendor(id);
    const [tab, setTab] = useState<ProfileTab>("overview");
    const [contactOpen, setContactOpen] = useState(false);
    const [listOpen, setListOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [revealed, setRevealed] = useState<VendorContact | null>(null);
    const notify = useCallback((m: string) => setToast(m), []);
    const [note, setNote] = useState("");
    const [allPortfolio, setAllPortfolio] = useState(false);

    const available = !!vendor && isDiscoverable(vendor);

    useEffect(() => {
        if (!vendor || !available) return;
        recordView(vendor.id);
        if (params.get("contact") === "1") setContactOpen(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vendor?.id]);

    useEffect(() => setNote(store.notes[id] ?? ""), [id, store.notes]);

    // Persistent company-level access: re-fetch the current approved contact (never cached client-side between visits).
    const unlocked = !!vendor && store.unlocked.includes(vendor.id);
    useEffect(() => { setRevealed(unlocked && vendor ? getUnlockedContact(vendor.id) : null); }, [unlocked, vendor]);

    const shell = (children: ReactNode) => (
        <main className="fig-dashboard vm-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/vendors" />
            <div className="fig-dashboard-main">
                <DashboardHeader
                    title="Vendor Profile"
                    subtitle="Evaluate the business before you connect."
                    hideNew
                    hideSearch
                    actions={(
                        <button type="button" className="vm-btn vm-head-btn" onClick={() => router.push("/vendors?tab=discover&boq=1")}>
                            <ListChecks size={18} aria-hidden="true" /> Find from BOQ
                        </button>
                    )}
                />
                {children}
            </div>
            <Toast message={toast} onDone={() => setToast(null)} />
        </main>
    );

    if (!vendor || !available) {
        return shell(
            <div className="vm-emptyblock vm-emptyblock--page">
                <strong>{vendor ? "This vendor is no longer available" : "Vendor not found"}</strong>
                <p>{vendor ? "The listing has been removed from discovery. Saved references and your contact history are kept." : "The link may be wrong, or the listing was removed."}</p>
                <button type="button" className="vm-btn vm-btn--primary" onClick={() => router.push("/vendors")}>Back to Vendor Marketplace</button>
            </div>,
        );
    }

    const certified = isCertified(vendor);
    const saved = isSaved(store, vendor.id);
    const lists = store.lists.filter((l) => l.items.some((i) => i.vendorId === vendor.id));
    const certExpired = vendor.status === "certified" && !certified;

    const tabs: Array<{ id: ProfileTab; label: string }> = [
        { id: "overview", label: "Overview" },
        { id: "business", label: "Business Information" },
        { id: "coverage", label: "Service Coverage" },
    ];

    return shell(
        <>
            <button type="button" className="vm-back vm-back--lg" onClick={() => (window.history.length > 1 ? router.back() : router.push("/vendors"))}>
                <ArrowLeft size={20} aria-hidden="true" /> Back
            </button>

            <section className="vm-profile-head">
                <div className="vm-profile-id">
                    <VendorLogo vendor={vendor} size={54} />
                    <div>
                        <div className="vm-profile-name">
                            <h2>{vendor.name}</h2>
                            {vendor.verifiedOn ? <span className="vm-tag vm-tag--green">Verified</span> : null}
                            {certified ? <span className="vm-tag vm-tag--blue">RVYO Certified</span> : null}
                        </div>
                        <p className="vm-profile-meta">
                            {vendor.area}, {vendor.city} · {businessTypes(vendor)}
                        </p>
                    </div>
                </div>
                <div className="vm-profile-actions">
                    <button type="button" className={`vm-btn${saved ? " is-active" : ""}`} aria-pressed={saved} onClick={() => notify(toggleSaved(vendor.id) ? `${vendor.name} saved.` : "Removed from saved vendors.")}>
                        {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />} {saved ? "Saved" : "Save Vendor"}
                    </button>
                    <button type="button" className="vm-btn" onClick={() => setReportOpen(true)}><Flag size={18} /> Report</button>
                    {revealed ? null : <button type="button" className="vm-btn vm-btn--primary" onClick={() => setContactOpen(true)}><Lock size={18} /> Acquire Contact Information</button>}
                </div>
            </section>

            <nav className="vm-tabs" aria-label="Vendor profile sections">
                {tabs.map((t) => (
                    <button key={t.id} type="button" className={tab === t.id ? "is-current" : ""} aria-current={tab === t.id ? "true" : undefined} onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
            </nav>

            <div className="vm-profile-body">
                <div className="vm-profile-main vm-panel">
                    {tab === "overview" ? (
                        <>
                            <Card icon={<UserRound size={20} />} title="About the vendor">
                                <p className="vm-body">{vendor.description}</p>
                            </Card>
                            <div className="vm-ov-card vm-ov-grid">
                                <Block icon={<Layers size={20} />} title="Product categories"><Chips items={vendor.categories.map((c) => CATEGORY_LABEL[c] ?? c)} /></Block>
                                <Block icon={<Box size={20} />} title="Materials supplied"><Chips items={vendor.materials} /></Block>
                                <Block icon={<Award size={20} />} title="Brands">
                                    {vendor.brands.length ? <Chips items={vendor.brands} /> : <p className="vm-body">The vendor hasn&apos;t listed the brands it supplies.</p>}
                                </Block>
                                <Block icon={<BookOpen size={20} />} title="Catalogue">
                                    <p className="vm-body">{vendor.hasCatalogue ? "A product catalogue is available. Ask the vendor for the latest version after you connect." : "No catalogue published."}</p>
                                </Block>
                            </div>
                            <Card
                                icon={<FolderOpen size={20} />}
                                title="Portfolio"
                                divider
                                action={vendor.portfolio.length > 3 ? (
                                    <button type="button" className="vm-link" aria-expanded={allPortfolio} onClick={() => setAllPortfolio((v) => !v)}>
                                        {allPortfolio ? "Show less" : "View all portfolio"} <ArrowRight size={18} aria-hidden="true" />
                                    </button>
                                ) : null}
                            >
                                {vendor.portfolio.length ? (
                                    <div className="vm-portfolio">
                                        {(allPortfolio ? vendor.portfolio : vendor.portfolio.slice(0, 3)).map((p) => (
                                            <figure key={p.title}>
                                                <div className="vm-portfolio-img" aria-hidden="true"><ImageIcon size={28} /></div>
                                                <figcaption><strong>{p.title}</strong><span>{p.caption}</span></figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                ) : <p className="vm-body">This vendor hasn&apos;t added completed projects or showroom images yet.</p>}
                            </Card>
                        </>
                    ) : tab === "business" ? (
                        <InfoTable title="Business information" rows={businessRows(vendor)} />
                    ) : (
                        <InfoTable
                            title="Service Coverage"
                            rows={[
                                ["Business location", revealed ? revealed.address : (
                                    <button type="button" className="vm-link" onClick={() => setContactOpen(true)}><Lock size={16} aria-hidden="true" /> Acquire Contact Information</button>
                                )],
                                ["Delivery", vendor.delivery.outstation ? `Local and outstation · ${vendor.serviceAreas.join(", ")}` : vendor.delivery.local ? `Local · ${vendor.city}` : "Not offered"],
                                ["Installation", vendor.installation ? vendor.installationAreas.join(", ") : "Not offered"],
                                ["Operating hours", `${vendor.hours.days}, ${vendor.hours.open}–${vendor.hours.close} · ${isOpenNow(vendor, new Date()) ? "Open now" : "Closed now"}`],
                            ]}
                        />
                    )}
                </div>

                <aside className="vm-side">
                    {revealed ? (
                        <div className="vm-panel vm-side-card">
                            <h3>Contact Information</h3>
                            <ContactDetails contact={revealed} onCopy={(t) => { void navigator.clipboard?.writeText(t).then(() => notify("Number copied."), () => notify("Couldn't copy.")); }} />
                            <p className="vm-fine">Access recorded in Contact Requests. Disclosure does not select or appoint this vendor for a project.</p>
                        </div>
                    ) : (
                        <div className="vm-panel vm-side-card">
                            <div>
                                <h3>Want to connect with this Vendor?</h3>
                                <p className="vm-side-sub">Verify your RVYO account to securely reveal the vendor&apos;s contact information.</p>
                            </div>
                            {/* Masks are generic: no part of the real number or email reaches the browser before verification. */}
                            <ul className="vm-masked-list" aria-label="Contact details, hidden until verified">
                                <li><Phone size={18} aria-hidden="true" /> +91 9••••••••</li>
                                <li><Mail size={18} aria-hidden="true" /> ••••••••••••@••••••.in</li>
                                <li><MapPin size={18} aria-hidden="true" /> ••••••••••••, {vendor.city}, India</li>
                            </ul>
                            <button type="button" className="vm-btn vm-btn--primary vm-btn--block" onClick={() => setContactOpen(true)}><Lock size={18} /> Acquire Contact Information</button>
                            <p className="vm-fine vm-center">Contact details are protected by OTP verification.</p>
                        </div>
                    )}

                    <div className="vm-panel vm-side-card">
                        <div className="vm-panel-head"><h3>Sourcing</h3><button type="button" className="vm-link" onClick={() => setListOpen(true)}><ListPlus size={18} /> Add to List</button></div>
                        {lists.length ? (
                            <ul className="vm-in-lists">
                                {lists.map((l) => (
                                    <li key={l.id}><button type="button" className="vm-link" onClick={() => router.push(`/vendors?tab=lists&list=${l.id}`)}>{l.name}</button>{l.items.find((i) => i.vendorId === vendor.id)?.shortlisted ? <span className="vm-status vm-status--success">Shortlisted</span> : null}</li>
                                ))}
                            </ul>
                        ) : null}
                        <label className="vm-field">
                            <span>Internal Note · Visible to your company</span>
                            <textarea
                                className="vm-textarea"
                                rows={4}
                                maxLength={1000}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onBlur={() => { if (note !== (store.notes[vendor.id] ?? "")) { saveNote(vendor.id, note); notify("Note saved."); } }}
                                placeholder="e.g. Visited showroom, need to confirm bulk pricing"
                            />
                        </label>
                    </div>

                    <div className="vm-panel vm-side-card">
                        <h3>Trust &amp; Certification</h3>
                        <ul className="vm-trust">
                            <li>
                                <ShieldCheck size={20} className={vendor.verifiedOn ? "is-ok" : ""} />
                                <span><strong>Verified Business</strong>{vendor.verifiedOn ? `RVYO checked business identity and documents on ${fmtDate(vendor.verifiedOn)}.` : "Business verification is pending."}</span>
                            </li>
                            <li>
                                <BadgeCheck size={20} className={certified ? "is-cert" : ""} />
                                <span>
                                    <strong>RVYO Certified</strong>
                                    {certified ? `Met additional certification criteria. Review due ${fmtDate(vendor.certification!.reviewDue)}.`
                                        : certExpired ? `Certification lapsed on ${fmtDate(vendor.certification!.reviewDue)} and is awaiting review.`
                                            : "Not certified. Verification alone doesn't grant certification."}
                                </span>
                            </li>
                        </ul>
                        <p className="vm-fine">Certification reviews identity, address, capability, portfolio and conduct. It is not a guarantee of product quality, pricing, delivery or future performance.</p>
                    </div>
                </aside>
            </div>

            <ContactAccessModal
                vendor={vendor}
                certified={certified}
                open={contactOpen}
                onClose={() => setContactOpen(false)}
                onUnlocked={(c) => setRevealed(c)}
                onNotify={notify}
            />
            <AddToListModal vendor={vendor} open={listOpen} onClose={() => setListOpen(false)} onDone={(m) => { setListOpen(false); notify(m); }} />
            <ReportModal open={reportOpen} vendor={vendor} onClose={() => setReportOpen(false)} onDone={() => { setReportOpen(false); notify("Thanks — RVYO's listing team will review this report."); }} />
        </>,
    );
}

function Card({ icon, title, action, divider, children }: { icon: ReactNode; title: string; action?: ReactNode; divider?: boolean; children: ReactNode }) {
    return (
        <section className={`vm-ov-card${divider ? " vm-ov-card--divided" : ""}`}>
            <div className="vm-ov-head"><h3><span aria-hidden="true">{icon}</span>{title}</h3>{action}</div>
            {children}
        </section>
    );
}

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return (
        <section className="vm-ov-block">
            <h3><span aria-hidden="true">{icon}</span>{title}</h3>
            {children}
        </section>
    );
}

function Chips({ items }: { items: string[] }) {
    return <div className="vm-chips">{items.map((m) => <span key={m} className="vm-chip vm-chip--soft">{m}</span>)}</div>;
}

function InfoTable({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
    return (
        <section className="vm-info">
            <h3>{title}</h3>
            <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </section>
    );
}

function businessRows(vendor: Vendor): Array<[string, string]> {
    return [
        ["Business type", vendor.businessTypes.map((t) => BUSINESS_TYPE_LABEL[t]).join(", ")],
        ["Experience", `${vendor.years} years`],
        ["Location", vendor.area],
        ["Delivery", vendor.delivery.local || vendor.delivery.outstation ? "Available" : "Not offered"],
        ["Installation", vendor.installation ? "Available" : "Not offered"],
        ["Operating hours", `${vendor.hours.days}, ${vendor.hours.open}–${vendor.hours.close}`],
        ["Minimum order", vendor.minOrder ?? "Not published"],
        ["Languages", vendor.languages.join(", ")],
        ["Catalogue", vendor.hasCatalogue ? "Available" : "Not published"],
    ];
}

function ReportModal({ open, vendor, onClose, onDone }: { open: boolean; vendor: Vendor; onClose: () => void; onDone: () => void }) {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { if (open) { setReason(""); setDetails(""); setError(null); } }, [open]);
    const submit = () => {
        if (!reason) return setError("Choose a reason for the report.");
        if (reason === "Other" && details.trim().length < 10) return setError("Describe the problem in at least 10 characters.");
        onDone();
    };
    return (
        <Modal open={open} onClose={onClose} labelledBy="vm-report-title">
            <h2 id="vm-report-title" className="vm-modal-title">Report listing</h2>
            <p className="vm-muted">Tell RVYO what&apos;s wrong with {vendor.name}&apos;s listing. The vendor won&apos;t see who reported it.</p>
            <form className="vm-form" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
                <fieldset className="vm-field">
                    <span>Reason <em aria-hidden="true">*</em></span>
                    {REPORT_REASONS.map((r) => (
                        <label key={r} className="vm-checkrow"><input type="radio" name="vm-report" checked={reason === r} onChange={() => { setReason(r); setError(null); }} /> {r}</label>
                    ))}
                </fieldset>
                <label className="vm-field">
                    <span>Details {reason === "Other" ? <em aria-hidden="true">*</em> : <small>(optional)</small>}</span>
                    <textarea className="vm-textarea" rows={3} maxLength={1000} value={details} onChange={(e) => { setDetails(e.target.value); setError(null); }} />
                </label>
                {error ? <p className="vm-error" role="alert">{error}</p> : null}
                <div className="vm-modal-actions">
                    <button type="button" className="vm-btn" onClick={onClose}>Cancel</button>
                    <button type="submit" className="vm-btn vm-btn--primary">Submit report</button>
                </div>
            </form>
        </Modal>
    );
}

export default function VendorProfilePage() {
    return (
        <Suspense fallback={null}>
            <VendorProfileInner />
        </Suspense>
    );
}
