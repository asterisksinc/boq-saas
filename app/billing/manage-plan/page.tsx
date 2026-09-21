"use client";

import {
    ArrowLeft,
    Check,
    AlertCircle,
    X,
    Loader2,
    Sparkles,
    FileBarChart,
    HardDrive,
    Cable,
    UserCircle,
    Paintbrush,
    Headphones,
    FileText,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getBillingOverview,
    getPlanPreview,
    changeSubscription,
    updatePaymentMethod,
    BillingOverview,
    PlanPreview,
    SubscriptionPlan,
    PaymentMethod,
} from "@/lib/api/auth";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";

// ─── Constants ────────────────────────────────────────────────────────────────

const planOrder = ["starter", "professional", "business", "enterprise"];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    trial: { label: "Trial", color: "#16a34a", bg: "#dcfce7" },
    active: { label: "Active", color: "#16a34a", bg: "#dcfce7" },
    past_due: { label: "Past Due", color: "#dc2626", bg: "#fef2f2" },
    suspended: { label: "Suspended", color: "#dc2626", bg: "#fef2f2" },
    cancelled_at_period_end: { label: "Cancelling", color: "#f59e0b", bg: "#fef3c7" },
    cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f3f4f6" },
};

const cardBrands = ["Visa", "Mastercard", "American Express", "Discover", "RuPay"];

// ─── Formatters ───────────────────────────────────────────────────────────────

const money = (n: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

const fmtDate = (x?: string | null) =>
    x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${x.slice(0, 10)}T00:00:00`)) : "14 September 2026";

// Capitalize first letter, replace underscores with spaces and handle snake_case/camelCase
const capitalize = (s: string | number | null | undefined): string => {
    if (s == null) return "—";
    const str = String(s);
    if (str === "null" || str === "") return "—";
    const cleaned = str.replace(/_/g, "-").replace(/([a-z])([A-Z])/g, "$1 $2");
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

// ─── Add-on Catalog (static — no backend) ────────────────────────────────────

interface AddOnDef {
    key: string;
    name: string;
    description: string;
    icon: React.ReactNode;
}

const addOnCatalog: AddOnDef[] = [
    { key: "proposal-generator", name: "Proposal Generator", description: "Create branded proposals from approved BOQs.", icon: <FileText size={22} /> },
    { key: "ai-assistant", name: "AI Assistant", description: "Contextual assistance across estimation and project workflows.", icon: <Sparkles size={22} /> },
    { key: "advanced-reports", name: "Advanced Reports", description: "Deeper analytics with configurable dashboards.", icon: <FileBarChart size={22} /> },
    { key: "additional-storage", name: "Additional Storage", description: "Extend workflow forms beyond your plan allotment.", icon: <HardDrive size={22} /> },
    { key: "advanced-integrations", name: "Advanced Integrations", description: "Premium connectors for ERPs and accounting systems.", icon: <Cable size={22} /> },
    { key: "client-portal", name: "Client Portal", description: "Give clients a secure space to review and approve BOQs.", icon: <UserCircle size={22} /> },
    { key: "white-label", name: "White-label Branding", description: "Remove BOQ branding and apply your own.", icon: <Paintbrush size={22} /> },
    { key: "enterprise-support", name: "Enterprise Support", description: "Dedicated support with named engineers and SLAs.", icon: <Headphones size={22} /> },
];

// ─── Plan feature rows for comparison ─────────────────────────────────────────

const comparisonRows = [
    { key: "users", label: "Users", source: "limits" },
    { key: "projects", label: "Projects", source: "limits" },
    { key: "boqs", label: "BOQs", source: "limits" },
    { key: "templates", label: "Templates", source: "limits" },
    { key: "integrations", label: "Integrations", source: "features" },
    { key: "reports", label: "Reports", source: "features" },
    { key: "support", label: "Support", source: "features" },
] as const;

// ─── Included features list ──────────────────────────────────────────────────

const includedFeatures = [
    { key: "users", label: "Users", source: "limits" },
    { key: "projects", label: "Projects", source: "limits" },
    { key: "boqs", label: "BOQs", source: "limits" },
    { key: "templates", label: "Templates", source: "limits" },
    { key: "integrations", label: "Integrations", source: "features" },
    { key: "reports", label: "Reports", source: "features" },
    { key: "support", label: "Support", source: "features" },
    { key: "storage", label: "Storage", source: "features" },
    { key: "aiUsage", label: "AI usage", source: "features" },
] as const;

// Helper to resolve a value from limits/features
function resolvePlanValue(plan: SubscriptionPlan, key: string, source: string): string {
    const pool = source === "limits" ? plan.limits : (plan.features as unknown as Record<string, unknown>);
    if (!pool || typeof pool !== "object") return "—";
    const val = (pool as Record<string, unknown>)[key];
    if (val === null || val === undefined) {
        if (plan.code === "enterprise") return "Custom";
        if (source === "limits" && (key === "projects" || key === "users")) return "Unlimited";
        return "—";
    }
    if (typeof val === "number") return String(val);
    return capitalize(val as string);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagePlanPage() {
    const router = useRouter();

    // Data
    const [overview, setOverview] = useState<BillingOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Plan change flow
    const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
    const [preview, setPreview] = useState<PlanPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [changeLoading, setChangeLoading] = useState(false);

    // Modals
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<{
        newPlanName: string;
        isUpgrade: boolean;
        nextRenewalText: string;
    } | null>(null);

    // Payment edit modal state
    const [showPaymentEdit, setShowPaymentEdit] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ brand: "Visa", last4: "4242", expiryMonth: "12", expiryYear: "2028" });
    const [paymentSaving, setPaymentSaving] = useState(false);

    // Toast
    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // ── Data Loading ──────────────────────────────────────────────────────────

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBillingOverview();
            setOverview(data);
            if (data.paymentMethod) {
                setPaymentForm({
                    brand: data.paymentMethod.brand,
                    last4: data.paymentMethod.last4,
                    expiryMonth: (data.paymentMethod.expiryMonth || (data.paymentMethod as any).expiry_month)?.toString().padStart(2, "0") || "12",
                    expiryYear: (data.paymentMethod.expiryYear || (data.paymentMethod as any).expiry_year)?.toString() || "2028",
                });
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Could not load billing details");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadOverview(); }, [loadOverview]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 5000);
    };

    // ── Plan Selection (Opens Confirmation Modal — Image 2) ───────────────────

    const handleSelectPlan = async (planCode: string) => {
        if (planCode === "enterprise") {
            window.location.href = "mailto:sales@boqapp.com?subject=Enterprise%20Plan%20Inquiry";
            return;
        }
        setPreviewLoading(true);
        setSelectedPlanCode(planCode);
        try {
            const data = await getPlanPreview(planCode);
            setPreview(data);
            setShowConfirmModal(true);
        } catch {
            setPreview(null);
            showNotice("Unable to calculate plan change. Please try again.", "error");
        } finally {
            setPreviewLoading(false);
        }
    };

    // ── Plan Change Execution (Triggers Success Modal — Image 3) ───────────────

    const handleConfirmChangePlan = async () => {
        if (!selectedPlanCode || !preview) return;
        const sub = overview?.subscription;
        const freq = ((sub?.billingFrequency || (sub as any)?.billing_frequency) as "monthly" | "annual") || "monthly";
        setChangeLoading(true);
        try {
            await changeSubscription({
                planCode: selectedPlanCode as "starter" | "professional" | "business" | "enterprise",
                billingFrequency: freq,
            });

            const newPlanName = preview.newPlan.name;
            const isUpg = planOrder.indexOf(selectedPlanCode) > planOrder.indexOf(currentPlanCode);
            const renewalAmt = preview.breakdown.nextRenewalAmount ?? (preview.breakdown.planCharge + preview.breakdown.tax);
            const renewalDateStr = fmtDate(preview.nextRenewal);

            setShowConfirmModal(false);
            setSuccessData({
                newPlanName,
                isUpgrade: isUpg,
                nextRenewalText: `${money(renewalAmt, preview.newPlan.currency)} · ${renewalDateStr}`,
            });
            setShowSuccessModal(true);
            await loadOverview();
        } catch (e: unknown) {
            showNotice(e instanceof Error ? e.message : "Unable to change your plan.", "error");
        } finally {
            setChangeLoading(false);
        }
    };

    // ── Payment Method Save ───────────────────────────────────────────────────

    const handlePaymentSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!paymentForm.brand || !paymentForm.last4 || paymentForm.last4.length !== 4 ||
            !paymentForm.expiryMonth || !paymentForm.expiryYear) return;
        setPaymentSaving(true);
        try {
            await updatePaymentMethod({
                brand: paymentForm.brand,
                last4: paymentForm.last4,
                expiryMonth: Number(paymentForm.expiryMonth),
                expiryYear: Number(paymentForm.expiryYear),
            });
            showNotice("Payment method updated");
            setShowPaymentEdit(false);
            await loadOverview();
        } catch (e: unknown) {
            showNotice(e instanceof Error ? e.message : "Could not update payment method", "error");
        } finally {
            setPaymentSaving(false);
        }
    };

    // ── Render Loading ────────────────────────────────────────────────────────

    if (loading) return <ManagePlanSkeleton />;

    // ── Derived Data ──────────────────────────────────────────────────────────

    const sub = overview?.subscription;
    const plan = sub?.subscriptionPlans || (sub as any)?.subscription_plans;
    const status = sub?.status || "active";
    const statusInfo = statusConfig[status] || statusConfig.active;
    const currentPlanCode = sub?.planCode || (sub as any)?.plan_code || "professional";
    const availablePlans = (overview?.plans?.filter(p => planOrder.includes(p.code)) || [])
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const isTrial = status === "trial";

    // Current plan data
    const planName = isTrial
        ? "Trial Plan"
        : (plan?.name || (currentPlanCode === "professional" ? "Professional Plan" : currentPlanCode === "business" ? "Business Plan" : "Starter Plan"));
    const planPrice = plan?.monthlyPrice || (plan as any)?.monthly_price || 0;
    const currency = plan?.currency || "INR";
    const billingFrequency = sub?.billingFrequency || (sub as any)?.billing_frequency || "monthly";
    const pmLast4 = overview?.paymentMethod?.last4 || null;
    const periodEnd = sub?.periodEnd || (sub as any)?.period_end || null;
    const planDescription = plan?.description || "";

    const selectedPlanObj = availablePlans.find(p => p.code === selectedPlanCode) || (preview?.newPlan ?? null);

    return (
        <main className="fig-dashboard boq-dashboard billing-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />

            <div className="fig-dashboard-main">
                <DashboardHeader title="Billing" onNew={() => router.push("/projects")} />

                <div className="billing-page-body mp-page-body">
                    {/* ── Back Navigation ── */}
                    <button
                        type="button"
                        className="mp-back-btn"
                        onClick={() => router.push("/billing")}
                    >
                        <ArrowLeft size={18} />
                        <span>Manage Plan</span>
                    </button>

                    {/* ── Error banner ── */}
                    {error && (
                        <div className="billing-error-bar">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                            <button onClick={loadOverview} className="billing-error-retry">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* ── Section 1: YOUR CURRENT PLAN ── */}
                    <section className="mp-section-card">
                        <p className="mp-section-label">YOUR CURRENT PLAN</p>
                        <div className="mp-current-header">
                            <div className="mp-current-left">
                                <h2 className="mp-current-name">{planName}</h2>
                                <span
                                    className="mp-status-badge"
                                    style={{ color: statusInfo.color, background: statusInfo.bg }}
                                >
                                    {statusInfo.label}
                                </span>
                                <p className="mp-current-desc">{planDescription}</p>
                            </div>
                            <div className="mp-current-right">
                                <span className="mp-price-label">Current Plan Price</span>
                                <span className="mp-price-value">
                                    {isTrial || !planPrice
                                        ? <span className="mp-price-na">Not billed</span>
                                        : <>{money(planPrice, currency)}<span className="mp-price-period"> / month</span></>
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="mp-current-meta">
                            <div className="mp-meta-item">
                                <span className="mp-meta-label">Renews</span>
                                <span className="mp-meta-value">{periodEnd ? fmtDate(periodEnd) : (isTrial ? "Not scheduled" : "—")}</span>
                            </div>
                            <div className="mp-meta-item">
                                <span className="mp-meta-label">Billing Frequency</span>
                                <span className="mp-meta-value">{billingFrequency === "annual" ? "Annual" : "Monthly"}</span>
                            </div>
                            <div className="mp-meta-item">
                                <span className="mp-meta-label">Payment method</span>
                                <span className="mp-meta-value">{pmLast4 ? `–– ${pmLast4}` : (isTrial ? "Not added" : "—")}</span>
                            </div>
                        </div>

                        <div className="mp-current-footer">
                            <span className="mp-addon-line">Add-ons: <strong>None</strong></span>
                            <span className="mp-updated-line">
                                Last updated: Today, {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })} IST
                            </span>
                        </div>
                    </section>

                    {/* ── Section 2: INCLUDED WITH YOUR PLAN ── */}
                    {plan && (
                        <section className="mp-section-card">
                            <p className="mp-section-label">INCLUDED WITH YOUR PLAN</p>
                            <div className="mp-included-grid">
                                {includedFeatures.map(f => (
                                    <div key={f.key} className="mp-included-item">
                                        <span className="mp-included-label">{f.label}</span>
                                        <span className="mp-included-value">{resolvePlanValue(plan, f.key, f.source)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── Section 3: PLAN COMPARISON ── */}
                    <section className="mp-section-card">
                        <p className="mp-section-label">PLAN COMPARISON</p>
                        <div className="mp-plan-grid">
                            {availablePlans.map(p => {
                                const isCurrent = p.code === currentPlanCode;
                                const isEnterprise = p.code === "enterprise";

                                return (
                                    <div key={p.code} className={`mp-plan-card${isCurrent ? " mp-plan-current" : ""}`}>
                                        <div className="mp-plan-header">
                                            <h3 className="mp-plan-name">{p.name}</h3>
                                            {isCurrent && <span className="mp-current-tag">Current</span>}
                                        </div>
                                        <p className="mp-plan-desc">{p.description || ""}</p>

                                        <div className="mp-plan-price-row">
                                            {isEnterprise ? (
                                                <>
                                                    <span className="mp-plan-price">Custom</span>
                                                    <span className="mp-plan-price-sub">Contact sales</span>
                                                </>
                                            ) : p.monthlyPrice ? (
                                                <>
                                                    <span className="mp-plan-price">{money(p.monthlyPrice, p.currency)}</span>
                                                    <span className="mp-plan-price-sub">/ month</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="mp-plan-price">—</span>
                                                    <span className="mp-plan-price-sub">Pricing TBD</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="mp-plan-features">
                                            {comparisonRows.map(row => (
                                                <div key={row.key} className="mp-plan-feature-row">
                                                    <span className="mp-feat-label">{row.label}</span>
                                                    <span className="mp-feat-value">{resolvePlanValue(p, row.key, row.source)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action button */}
                                        {isCurrent ? (
                                            <button type="button" className="mp-plan-btn mp-plan-btn-current" disabled>
                                                Current Plan
                                            </button>
                                        ) : isEnterprise ? (
                                            <button
                                                type="button"
                                                className="mp-plan-btn mp-plan-btn-enterprise"
                                                onClick={() => handleSelectPlan("enterprise")}
                                            >
                                                Contact Sales
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="mp-plan-btn mp-plan-btn-select"
                                                onClick={() => handleSelectPlan(p.code)}
                                                disabled={previewLoading && selectedPlanCode === p.code}
                                            >
                                                {previewLoading && selectedPlanCode === p.code
                                                    ? <Loader2 size={14} className="billing-spin" />
                                                    : "Select Plan"
                                                }
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Section 4: ADD-ONS ── */}
                    <section className="mp-section-card">
                        <p className="mp-section-label">ADD-ONS</p>
                        <div className="mp-addon-grid">
                            {addOnCatalog.map(addon => (
                                <div key={addon.key} className="mp-addon-card">
                                    <div className="mp-addon-top">
                                        <div className="mp-addon-icon">{addon.icon}</div>
                                        <span className="mp-addon-badge">Not Enabled</span>
                                    </div>
                                    <h4 className="mp-addon-name">{addon.name}</h4>
                                    <p className="mp-addon-desc">{addon.description}</p>
                                    <div className="mp-addon-bottom">
                                        <span className="mp-addon-price">₹X / month</span>
                                        <button
                                            type="button"
                                            className="mp-addon-btn"
                                            onClick={() => showNotice("Add-ons coming soon", "success")}
                                        >
                                            + Add Add-ons
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* ── Plan Change Confirmation Modal (Image 2) ── */}
            {showConfirmModal && preview && selectedPlanObj && (
                <PlanChangeConfirmationModal
                    currentPlan={plan || preview.currentPlanDetails || availablePlans.find(p => p.code === currentPlanCode) || null}
                    currentPlanCode={currentPlanCode}
                    newPlan={selectedPlanObj}
                    preview={preview}
                    paymentMethod={overview?.paymentMethod ?? null}
                    isUpgrade={planOrder.indexOf(selectedPlanObj.code) > planOrder.indexOf(currentPlanCode)}
                    changeLoading={changeLoading}
                    onConfirm={handleConfirmChangePlan}
                    onCancel={() => { setShowConfirmModal(false); setSelectedPlanCode(null); setPreview(null); }}
                    onChangePaymentMethod={() => setShowPaymentEdit(true)}
                />
            )}

            {/* ── Plan Change Success Modal (Image 3) ── */}
            {showSuccessModal && successData && (
                <PlanChangeSuccessModal
                    newPlanName={successData.newPlanName}
                    isUpgrade={successData.isUpgrade}
                    nextRenewalText={successData.nextRenewalText}
                    onBackToPlan={() => { setShowSuccessModal(false); setSuccessData(null); }}
                    onViewSubscription={() => router.push("/billing")}
                />
            )}

            {/* ── Payment Method Edit Modal ── */}
            {showPaymentEdit && (
                <PaymentEditModal
                    formData={paymentForm}
                    setFormData={setPaymentForm}
                    onSave={handlePaymentSave}
                    saving={paymentSaving}
                    onClose={() => setShowPaymentEdit(false)}
                />
            )}

            {/* ── Toast notification ── */}
            {notice && (
                <div className={`billing-toast ${notice.type}`}>
                    {notice.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{notice.message}</span>
                    <button onClick={() => setNotice(null)}><X size={12} /></button>
                </div>
            )}
        </main>
    );
}

// ─── Plan Change Confirmation Modal (Image 2) ────────────────────────────────

function PlanChangeConfirmationModal({
    currentPlan,
    currentPlanCode,
    newPlan,
    preview,
    paymentMethod,
    isUpgrade,
    changeLoading,
    onConfirm,
    onCancel,
    onChangePaymentMethod,
}: {
    currentPlan: SubscriptionPlan | null;
    currentPlanCode: string;
    newPlan: SubscriptionPlan;
    preview: PlanPreview;
    paymentMethod: PaymentMethod | null;
    isUpgrade: boolean;
    changeLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    onChangePaymentMethod: () => void;
}) {
    const curName = currentPlan?.name || (currentPlanCode === "professional" ? "Professional" : currentPlanCode === "business" ? "Business" : "Starter");
    const currency = newPlan.currency || "INR";
    const bd = preview.breakdown;
    const renewalAmount = bd.nextRenewalAmount ?? (bd.planCharge + bd.tax);
    const renewalDate = fmtDate(preview.nextRenewal);
    const confirmButtonText = isUpgrade
        ? `Confirm Upgrade - ${money(bd.dueToday, currency)} Today`
        : bd.dueToday > 0
            ? `Confirm Downgrade - ${money(bd.dueToday, currency)} Today`
            : "Confirm Downgrade";

    return (
        <div className="plan-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="pcm-modal">
                <div className="pcm-header">
                    <h2 className="pcm-title">{isUpgrade ? "Upgrade" : "Downgrade"} to {newPlan.name}</h2>
                    <p className="pcm-subtitle">Review the immediate charge, credit and new limits before confirming.</p>
                    <button type="button" className="pcm-close" onClick={onCancel} aria-label="Close modal">
                        <X size={16} />
                    </button>
                </div>

                <div className="pcm-body">
                    {/* Current Plan vs New Plan cards */}
                    <div className="pcm-plan-pair">
                        <div className="pcm-plan-card">
                            <div className="pcm-plan-card-label">CURRENT PLAN</div>
                            <div className="pcm-plan-card-name">{curName}</div>
                        </div>
                        <div className="pcm-plan-card new-plan">
                            <div className="pcm-plan-card-label">NEW PLAN</div>
                            <div className="pcm-plan-card-name">{newPlan.name}</div>
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="pcm-section-box">
                        <div className="pcm-section-heading">PRICE BREAKDOWN</div>
                        <div className="pcm-breakdown-row">
                            <span>{newPlan.name} plan charge</span>
                            <span>{money(bd.planCharge, currency)}</span>
                        </div>
                        <div className="pcm-breakdown-row">
                            <span>Credit for unused {curName} period</span>
                            <span className="pcm-credit-amount">−{money(bd.unusedPeriodCredit, currency)}</span>
                        </div>
                        <div className="pcm-breakdown-row">
                            <span>Tax</span>
                            <span>{money(bd.tax, currency)}</span>
                        </div>
                        <div className="pcm-divider" />
                        <div className="pcm-due-today-row">
                            <span>Due today</span>
                            <span className="pcm-due-today-amount">{money(bd.dueToday, currency)}</span>
                        </div>
                        <div className="pcm-renewal-row">
                            <span>Next renewal on {renewalDate}</span>
                            <span className="pcm-renewal-amount">{money(renewalAmount, currency)}</span>
                        </div>
                    </div>

                    {/* What Changes on [New Plan] */}
                    <div className="pcm-section-box">
                        <div className="pcm-section-heading">WHAT CHANGES ON {newPlan.name.toUpperCase()}</div>
                        {comparisonRows.map(row => {
                            const curVal = currentPlan ? resolvePlanValue(currentPlan, row.key, row.source) : "—";
                            const newVal = resolvePlanValue(newPlan, row.key, row.source);
                            return (
                                <div key={row.key} className="pcm-change-row">
                                    <span className="pcm-change-label">{row.label}</span>
                                    <span className="pcm-change-from">{curVal}</span>
                                    <span className="pcm-change-arrow">→</span>
                                    <span className="pcm-change-to">{newVal}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add-on Effect */}
                    <div className="pcm-section-box">
                        <div className="pcm-section-heading">ADD-ON EFFECT</div>
                        <p className="pcm-addon-text">No active add-ons on this workspace.</p>
                    </div>

                    {/* Payment Method */}
                    <div className="pcm-section-box pcm-pm-box">
                        <div className="pcm-pm-info">
                            <span className="pcm-pm-label">PAYMENT METHOD</span>
                            <span className="pcm-pm-card">•••• {paymentMethod?.last4 || "4242"}</span>
                        </div>
                        <button type="button" className="pcm-pm-btn" onClick={onChangePaymentMethod}>
                            Change Payment Method
                        </button>
                    </div>

                    {/* Footer actions */}
                    <div className="pcm-footer">
                        <button type="button" className="pcm-btn-cancel" onClick={onCancel}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="pcm-btn-confirm"
                            onClick={onConfirm}
                            disabled={changeLoading}
                        >
                            {changeLoading && <Loader2 size={14} className="billing-spin" />}
                            <span>{confirmButtonText}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Plan Change Success Modal (Image 3) ──────────────────────────────────────

function PlanChangeSuccessModal({
    newPlanName,
    isUpgrade,
    nextRenewalText,
    onBackToPlan,
    onViewSubscription,
}: {
    newPlanName: string;
    isUpgrade: boolean;
    nextRenewalText: string;
    onBackToPlan: () => void;
    onViewSubscription: () => void;
}) {
    return (
        <div className="plan-modal-overlay">
            <div className="psm-modal">
                <div className="psm-icon-wrap">
                    <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="68" height="68" rx="34" fill="#16A34A" fillOpacity="0.12" />
                        <path d="M33.9997 45.6654C40.4429 45.6654 45.6663 40.442 45.6663 33.9987C45.6663 27.5554 40.4429 22.332 33.9997 22.332C27.5563 22.332 22.333 27.5554 22.333 33.9987C22.333 40.442 27.5563 45.6654 33.9997 45.6654ZM40.3663 31.032L32.833 38.5653L27.9247 33.657L29.5746 32.0071L32.833 35.2655L38.7164 29.3821L40.3663 31.032Z" fill="#16A34A" />
                    </svg>
                </div>
                <h2 className="psm-title">{isUpgrade ? "Upgrade" : "Downgrade"} Successful</h2>
                <p className="psm-desc">Your plan has been changed to {newPlanName}.</p>

                <div className="psm-info-card">
                    <div className="psm-info-col">
                        <span className="psm-info-label">Effective</span>
                        <span className="psm-info-value">Effective Today</span>
                    </div>
                    <div className="psm-info-col">
                        <span className="psm-info-label">Next Renewal</span>
                        <span className="psm-info-value">{nextRenewalText}</span>
                    </div>
                </div>

                <div className="psm-actions">
                    <button type="button" className="psm-btn-back" onClick={onBackToPlan}>
                        Back to Plan
                    </button>
                    <button type="button" className="psm-btn-view" onClick={onViewSubscription}>
                        View Subscription
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Payment Edit Modal ───────────────────────────────────────────────────────

function PaymentEditModal({
    formData,
    setFormData,
    onSave,
    saving,
    onClose,
}: {
    formData: { brand: string; last4: string; expiryMonth: string; expiryYear: string };
    setFormData: (d: { brand: string; last4: string; expiryMonth: string; expiryYear: string }) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
    onClose: () => void;
}) {
    return (
        <div className="billing-modal-overlay" style={{ zIndex: 1100 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="billing-modal billing-modal-sm">
                <div className="billing-modal-header">
                    <h2>Update Payment Method</h2>
                    <p>Enter your credit or debit card details below.</p>
                    <button className="billing-modal-close" onClick={onClose} aria-label="Close modal"><X size={18} /></button>
                </div>
                <form className="billing-modal-body billing-form" onSubmit={onSave}>
                    <div className="billing-form-row">
                        <label className="billing-form-label">Card Brand</label>
                        <select
                            className="billing-form-input"
                            value={formData.brand}
                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            required
                        >
                            <option value="">Select brand</option>
                            {cardBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="billing-form-row">
                        <label className="billing-form-label">Last 4 Digits</label>
                        <input
                            className="billing-form-input"
                            type="text"
                            value={formData.last4}
                            onChange={e => setFormData({ ...formData, last4: e.target.value })}
                            placeholder="4242"
                            maxLength={4}
                            pattern="\d{4}"
                            required
                        />
                    </div>
                    <div className="billing-form-2col">
                        <div className="billing-form-row">
                            <label className="billing-form-label">Expiry Month</label>
                            <input
                                className="billing-form-input"
                                type="text"
                                value={formData.expiryMonth}
                                onChange={e => setFormData({ ...formData, expiryMonth: e.target.value })}
                                placeholder="MM"
                                maxLength={2}
                                pattern="\d{2}"
                                required
                            />
                        </div>
                        <div className="billing-form-row">
                            <label className="billing-form-label">Expiry Year</label>
                            <input
                                className="billing-form-input"
                                type="text"
                                value={formData.expiryYear}
                                onChange={e => setFormData({ ...formData, expiryYear: e.target.value })}
                                placeholder="YYYY"
                                maxLength={4}
                                pattern="\d{4}"
                                required
                            />
                        </div>
                    </div>
                    <div className="billing-modal-footer">
                        <button type="button" className="billing-btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="billing-btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={14} className="billing-spin" /> : <Check size={14} />}
                            Save Payment Method
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ManagePlanSkeleton() {
    return (
        <main className="fig-dashboard boq-dashboard billing-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Billing" />
                <div className="billing-page-body mp-page-body">
                    <div className="billing-skel" style={{ width: 160, height: 24, marginBottom: 24 }} />
                    <div className="billing-skel-card" style={{ height: 200 }} />
                    <div className="billing-skel-card" style={{ height: 120, marginTop: 20 }} />
                    <div className="billing-skel-card" style={{ height: 400, marginTop: 20 }} />
                    <div className="billing-skel-card" style={{ height: 300, marginTop: 20 }} />
                </div>
            </div>
        </main>
    );
}
