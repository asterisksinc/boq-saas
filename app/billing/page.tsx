"use client";

import {
    CreditCard,
    ArrowUpRight,
    X,
    Check,
    AlertCircle,
    Download,
    Loader2,
    Shield,
    FileText,
    CalendarDays,
    Eye,
    ChevronRight,
    RefreshCw,
    LayoutDashboard,
    Users,
    Zap,
    Mail,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getBillingOverview,
    getDashboardOverview,
    updateBillingContact,
    updatePaymentMethod,
    retryPayment,
    reactivateSubscription,
    BillingOverview,
    SubscriptionPlan,
    SubscriptionInvoice,
    PaymentMethod,
} from "@/lib/api/auth";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import BillingScenarioBanner from "@/components/BillingScenarioBanner";

// ─── Constants ────────────────────────────────────────────────────────────────

const planOrder = ["starter", "professional", "business", "enterprise"];

const planIcons: Record<string, React.ReactNode> = {
    starter: <LayoutDashboard size={20} />,
    professional: <Users size={20} />,
    business: <Zap size={20} />,
    enterprise: <Shield size={20} />,
};

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    trial: { label: "Trial", color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" },
    active: { label: "Active", color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" },
    past_due: { label: "Past Due", color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" },
    suspended: { label: "Suspended", color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" },
    cancelled_at_period_end: { label: "Cancelled at period end", color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" },
    cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f3f4f6", dot: "#9ca3af" },
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const money = (n: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

const fmtDate = (x?: string | null) =>
    x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${x.slice(0, 10)}T00:00:00`)) : "14 September 2026";

const fmtDateShort = (x?: string | null) =>
    x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
        .format(new Date(`${x.slice(0, 10)}T00:00:00`)) : "—";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
    const router = useRouter();

    // Data state
    const [overview, setOverview] = useState<BillingOverview | null>(null);
    const [orgName, setOrgName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Plan management removed — ManagePlan is now a full page at /billing/manage-plan

    // Contact editing state
    const [showContactEdit, setShowContactEdit] = useState(false);
    const [contactEmail, setContactEmail] = useState("");
    const [contactSaving, setContactSaving] = useState(false);

    // Payment method editing state
    const [showPaymentEdit, setShowPaymentEdit] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ brand: "", last4: "", expiryMonth: "", expiryYear: "" });
    const [paymentSaving, setPaymentSaving] = useState(false);

    // Scenario banner action loading state
    const [actionLoading, setActionLoading] = useState(false);

    // Toast notification
    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // ── Data Loading ──────────────────────────────────────────────────────────

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [billingData, dashboardData] = await Promise.all([
                getBillingOverview(),
                getDashboardOverview().catch(() => null),
            ]);
            setOverview(billingData);
            if (dashboardData?.organization?.name) {
                setOrgName(dashboardData.organization.name);
            }
            const contact = billingData.subscription?.billingContact || (billingData.subscription as any)?.billing_contact;
            if (contact) {
                setContactEmail(contact);
            }
            if (billingData.paymentMethod) {
                setPaymentForm({
                    brand: billingData.paymentMethod.brand,
                    last4: billingData.paymentMethod.last4,
                    expiryMonth: (billingData.paymentMethod.expiryMonth || (billingData.paymentMethod as any).expiry_month)?.toString().padStart(2, "0") || "",
                    expiryYear: (billingData.paymentMethod.expiryYear || (billingData.paymentMethod as any).expiry_year)?.toString() || "",
                });
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Could not load billing details";
            setError(msg);
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

    // Plan Preview and Plan Change handlers moved to /billing/manage-plan

    // ── Contact Save ──────────────────────────────────────────────────────────

    const handleContactSave = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = contactEmail.trim();
        if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            showNotice("Please enter a valid email address", "error");
            return;
        }
        setContactSaving(true);
        try {
            await updateBillingContact({ email: trimmed });
            showNotice("Billing contact updated");
            setShowContactEdit(false);
            await loadOverview();
        } catch (e: unknown) {
            showNotice(e instanceof Error ? e.message : "Could not update billing contact", "error");
        } finally {
            setContactSaving(false);
        }
    };

    // ── Payment Save ──────────────────────────────────────────────────────────

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

    // ── Scenario Banner Actions ───────────────────────────────────────────────

    const handleRetryPayment = async () => {
        setActionLoading(true);
        try {
            await retryPayment();
            showNotice("Payment retry processed successfully");
            await loadOverview();
        } catch (e: unknown) {
            showNotice(e instanceof Error ? e.message : "Payment retry failed", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReactivate = async () => {
        setActionLoading(true);
        try {
            await reactivateSubscription();
            showNotice("Subscription reactivated successfully");
            await loadOverview();
        } catch (e: unknown) {
            showNotice(e instanceof Error ? e.message : "Subscription reactivation failed", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Render Loading ────────────────────────────────────────────────────────

    if (loading) return <BillingSkeleton />;

    // ── Derived Data ──────────────────────────────────────────────────────────

    const sub = overview?.subscription;
    const plan = sub?.subscriptionPlans || (sub as any)?.subscription_plans;
    const status = sub?.status || "active";
    const statusInfo = statusConfig[status] || statusConfig.active;
    const currentPlanCode = sub?.planCode || (sub as any)?.plan_code || "professional";
    const availablePlans = overview?.plans?.filter(p => planOrder.includes(p.code)) || [];
    const billingContact = sub?.billingContact || (sub as any)?.billing_contact || contactEmail || "accounts@company.com";
    const billingFrequency = sub?.billingFrequency || (sub as any)?.billing_frequency || "monthly";

    // Next charge calculation
    const planPrice = plan?.monthlyPrice || (plan as any)?.monthly_price || (currentPlanCode === "professional" ? 9999 : currentPlanCode === "business" ? 18000 : 2999);
    const taxRate = 0.18;
    const nextChargeAmount = Math.round(planPrice * (1 + taxRate));

    return (
        <main className="fig-dashboard boq-dashboard billing-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />

            <div className="fig-dashboard-main">
                {/* ── Global Dashboard Header (Issue 1: Standard Dashboard Shell) ── */}
                <DashboardHeader
                    title="Billing"
                    onNew={() => router.push("/projects")}
                />

                {/* ── Page body ── */}
                <div className="billing-page-body">

                    {/* Page title + description with action buttons (Image 2 style) */}
                    <div className="billing-page-title-row">
                        <div>
                            <h1 className="billing-page-h1">Billing</h1>
                            <p className="billing-page-desc">
                                Manage your plan, usage, billing details, and subscription lifecycle.
                            </p>
                        </div>
                        <div className="billing-title-actions">
                            <button
                                type="button"
                                className="billing-btn-outline"
                                onClick={() => setShowPaymentEdit(true)}
                            >
                                <CreditCard size={15} />
                                <span>Update Payment Method</span>
                            </button>
                            <button
                                type="button"
                                className="billing-btn-primary"
                                onClick={() => router.push("/billing/manage-plan")}
                            >
                                <ArrowUpRight size={15} />
                                <span>Manage Plan</span>
                            </button>
                        </div>
                    </div>

                    {/* Error banner if any */}
                    {error && (
                        <div className="billing-error-bar">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                            <button onClick={loadOverview} className="billing-error-retry">
                                <RefreshCw size={14} /> Retry
                            </button>
                        </div>
                    )}

                    {/* ── BILLING DETAIL card ── */}
                    <BillingDetailCard
                        orgName={orgName || "Asterisks Inc"}
                        billingContact={billingContact}
                        onEditContact={() => setShowContactEdit(true)}
                    />

                    {/* ── Dynamic Scenario-Specific Notification Banner (Images 1-4) ── */}
                    <BillingScenarioBanner
                        sub={sub ?? null}
                        planName={plan?.name || (currentPlanCode === "professional" ? "Professional Plan" : currentPlanCode === "business" ? "Business Plan" : "Starter Plan")}
                        onChoosePlan={() => router.push("/billing/manage-plan")}
                        onUpdatePayment={() => setShowPaymentEdit(true)}
                        onRetryPayment={handleRetryPayment}
                        onReactivate={handleReactivate}
                        onResolveIssue={() => setShowPaymentEdit(true)}
                        loadingAction={actionLoading}
                    />

                    {/* ── 3-column row: Current Plan | Next Charge | Subscription Status ── */}
                    <div className="billing-plan-row">
                        <CurrentPlanCard
                            sub={sub ?? null}
                            plan={plan}
                            currentPlanCode={currentPlanCode}
                            status={status}
                            statusInfo={statusInfo}
                            paymentMethod={overview?.paymentMethod ?? null}
                            usage={overview?.usage}
                            onManagePlan={() => router.push("/billing/manage-plan")}
                            onUpdatePayment={() => setShowPaymentEdit(true)}
                        />

                        <NextChargeCard
                            amount={nextChargeAmount}
                            currency={plan?.currency || "INR"}
                            renewalDate={sub?.periodEnd || (sub as any)?.period_end || null}
                            paymentMethod={overview?.paymentMethod ?? null}
                            isTrial={status === "trial"}
                            onViewDetails={() => setShowPaymentEdit(true)}
                        />

                        <SubscriptionStatusDarkCard
                            status={status}
                            statusInfo={statusInfo}
                            orgName={orgName || "Asterisks Inc"}
                            billingFrequency={billingFrequency}
                        />
                    </div>

                    {/* ── USAGE SNAPSHOT (Issue 3: Dynamic KPI cards) ── */}
                    <UsageSnapshotSection usage={overview?.usage} />

                    {/* ── Bottom 3-column row: Payment Method | Billing Contact | Recent Invoices ── */}
                    <div className="billing-bottom-row">
                        <PaymentMethodCard
                            paymentMethod={overview?.paymentMethod ?? null}
                            onUpdate={() => setShowPaymentEdit(true)}
                        />

                        <BillingContactCard
                            email={billingContact}
                            onEdit={() => setShowContactEdit(true)}
                        />

                        <RecentInvoicesCard invoices={overview?.invoices || []} />
                    </div>
                </div>
            </div>


            {/* Manage Plan is now a full page at /billing/manage-plan */}


            {/* ── Update Payment Method Modal ── */}
            {showPaymentEdit && (
                <PaymentEditModal
                    formData={paymentForm}
                    setFormData={setPaymentForm}
                    onSave={handlePaymentSave}
                    saving={paymentSaving}
                    onClose={() => setShowPaymentEdit(false)}
                />
            )}

            {/* ── Edit Billing Contact Modal (Issue 4: Working Edit Contact) ── */}
            {showContactEdit && (
                <ContactEditModal
                    email={contactEmail || billingContact}
                    setEmail={setContactEmail}
                    onSave={handleContactSave}
                    saving={contactSaving}
                    onClose={() => setShowContactEdit(false)}
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

// ─── Billing Skeleton ─────────────────────────────────────────────────────────

function BillingSkeleton() {
    return (
        <main className="fig-dashboard boq-dashboard billing-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Billing" />
                <div className="billing-page-body">
                    <div className="billing-page-title-row">
                        <div>
                            <div className="billing-skel billing-skel-h1" />
                            <div className="billing-skel billing-skel-desc" />
                        </div>
                    </div>
                    <div className="billing-skel-card" />
                    <div className="billing-plan-row">
                        <div className="billing-skel-card tall" />
                        <div className="billing-skel-card tall" />
                        <div className="billing-skel-card tall" />
                    </div>
                    <div className="billing-skel-card" />
                    <div className="billing-bottom-row">
                        <div className="billing-skel-card" />
                        <div className="billing-skel-card" />
                        <div className="billing-skel-card" />
                    </div>
                </div>
            </div>
        </main>
    );
}

// ─── Billing Detail Card ──────────────────────────────────────────────────────

function BillingDetailCard({
    orgName,
    billingContact,
    onEditContact,
}: {
    orgName: string;
    billingContact: string | null;
    onEditContact: () => void;
}) {
    return (
        <section className="billing-section-card billing-detail-card">
            <p className="billing-card-label">BILLING DETAIL</p>
            <div className="billing-detail-cols">
                <div className="billing-detail-col">
                    <span className="billing-detail-field-label">Billing Account</span>
                    <span className="billing-detail-field-value">{orgName || "Asterisks Inc"}</span>
                </div>
                <div className="billing-detail-col">
                    <span className="billing-detail-field-label">Plan Owner</span>
                    <span className="billing-detail-field-value">Organization Owner</span>
                </div>
                <div className="billing-detail-col">
                    <span className="billing-detail-field-label">Billing Contact</span>
                    <button
                        type="button"
                        className="billing-detail-email-btn"
                        onClick={onEditContact}
                        title="Click to edit billing contact"
                    >
                        {billingContact || "accounts@company.com"}
                    </button>
                </div>
            </div>
        </section>
    );
}

// ─── Current Plan Card (Issue 2: NO CANCEL BUTTON) ───────────────────────────

function CurrentPlanCard({
    sub,
    plan,
    currentPlanCode,
    status,
    statusInfo,
    paymentMethod,
    usage,
    onManagePlan,
    onUpdatePayment,
}: {
    sub: BillingOverview["subscription"];
    plan: SubscriptionPlan | undefined;
    currentPlanCode: string;
    status: string;
    statusInfo: { label: string; color: string; bg: string; dot: string };
    paymentMethod: PaymentMethod | null;
    usage: BillingOverview["usage"] | undefined;
    onManagePlan: () => void;
    onUpdatePayment: () => void;
}) {
    const isTrial = status === "trial";
    const rawPeriodEnd = sub?.periodEnd || (sub as any)?.period_end;
    const periodEnd = rawPeriodEnd ? fmtDate(rawPeriodEnd) : (isTrial ? "Trial end date unavailable" : "14 September 2026");
    const planName = isTrial ? "Trial — Choose a Plan" : (plan?.name || (currentPlanCode === "professional" ? "Professional Plan" : currentPlanCode === "business" ? "Business Plan" : "Starter Plan"));
    const planPrice = plan?.monthlyPrice || (plan as any)?.monthly_price || (currentPlanCode === "professional" ? 9999 : currentPlanCode === "business" ? 18000 : 2999);
    const currency = plan?.currency || "INR";
    const usedSeats = sub?.seatsUsed ?? (sub as any)?.seats_used ?? usage?.teamMembers?.used ?? 12;
    const seatLimit = plan?.limits?.users ?? (plan?.limits as any)?.seats ?? (currentPlanCode === "professional" ? 20 : currentPlanCode === "business" ? 50 : 3);
    const pmDisplay = paymentMethod?.last4 ? `•••• ${paymentMethod.last4}` : (isTrial ? "Not added" : "•••• 4242");

    return (
        <section className="billing-section-card billing-current-plan-card">
            <p className="billing-card-label">CURRENT PLAN</p>

            <div className="bcp-top-row">
                <div>
                    <h2 className="bcp-plan-name">{planName}</h2>
                    <p className="bcp-interval">
                        {(sub?.billingFrequency || (sub as any)?.billing_frequency) === "annual" ? "Annual" : "Monthly"}
                    </p>
                </div>
                <span
                    className="bcp-status-badge"
                    style={{ color: statusInfo.color, background: statusInfo.bg }}
                >
                    {statusInfo.label.toUpperCase()}
                </span>
            </div>

            <div className="bcp-price-row">
                <span className="bcp-price-label">Plan Price</span>
                <span className="bcp-price-value">
                    {isTrial ? "Not billed" : `${money(planPrice, currency)} / ${(sub?.billingFrequency || (sub as any)?.billing_frequency) === "annual" ? "year" : "month"}`}
                </span>
            </div>

            <div className="bcp-meta-row">
                <div className="bcp-meta-item">
                    <span className="bcp-meta-label">Renewal</span>
                    <span className="bcp-meta-value">{periodEnd}</span>
                </div>
                <div className="bcp-meta-item">
                    <span className="bcp-meta-label">Seats</span>
                    <span className="bcp-meta-value">
                        {usedSeats} {seatLimit ? `of ${seatLimit} used` : "used"}
                    </span>
                </div>
                <div className="bcp-meta-item">
                    <span className="bcp-meta-label">Payment Method</span>
                    <span className="bcp-meta-value">{pmDisplay}</span>
                </div>
            </div>

            {/* Actions: exactly matches Image 2 (NO CANCEL BUTTON) */}
            <div className="bcp-actions">
                <button type="button" className="billing-btn-primary" onClick={onManagePlan}>
                    <ArrowUpRight size={14} /> Manage Plan
                </button>
                <button type="button" className="billing-btn-outline" onClick={onUpdatePayment}>
                    <CreditCard size={14} /> Update Payment Method
                </button>
            </div>
        </section>
    );
}

// ─── Next Charge Card ─────────────────────────────────────────────────────────

function NextChargeCard({
    amount,
    currency,
    renewalDate,
    paymentMethod,
    isTrial,
    onViewDetails,
}: {
    amount: number;
    currency: string;
    renewalDate: string | null;
    paymentMethod: PaymentMethod | null;
    isTrial?: boolean;
    onViewDetails?: () => void;
}) {
    const pmDisplay = paymentMethod?.last4 ? `— ${paymentMethod.last4}` : (isTrial ? "Not added" : "— 4242");
    const displayRenewal = renewalDate ? fmtDate(renewalDate) : (isTrial ? "Trial end date unavailable" : "14 September 2026");
    const displayAmount = isTrial && !renewalDate ? "Not Scheduled" : money(amount, currency);

    return (
        <section className="billing-section-card billing-next-charge-card">
            <p className="billing-card-label">NEXT CHARGE</p>

            <p className="bnc-amount">{displayAmount}</p>
            <p className="bnc-tax-note">Including applicable tax</p>

            <div className="bnc-renews-box">
                <div>
                    <span className="bnc-renews-label">Renews on</span>
                    <span className="bnc-renews-date">{displayRenewal}</span>
                </div>
                <CalendarDays size={18} className="bnc-calendar-icon" />
            </div>

            <div className="bnc-pm-row">
                <span className="bnc-pm-text">
                    Payment method {pmDisplay}
                </span>
                <button type="button" className="bnc-view-details" onClick={onViewDetails}>
                    View Details
                </button>
            </div>

            <button type="button" className="bnc-renewal-info-btn">
                View Renewal Information
            </button>
        </section>
    );
}

// ─── Subscription Status Dark Card ───────────────────────────────────────────

function SubscriptionStatusDarkCard({
    status,
    statusInfo,
    orgName,
    billingFrequency,
}: {
    status: string;
    statusInfo: { label: string; color: string; bg: string; dot: string };
    orgName: string;
    billingFrequency: string;
}) {
    return (
        <section className="billing-section-card billing-status-dark-card">
            <p className="billing-card-label bsdc-label">SUBSCRIPTION STATUS</p>

            <div className="bsdc-badge-wrap">
                <span className="bsdc-status-badge">
                    <Check size={18} className="bsdc-check-icon" strokeWidth={3} />
                    <span>{status === "active" ? "Active" : statusInfo.label}</span>
                </span>
            </div>

            <p className="bsdc-scope-text">
                Billing is scoped to {orgName || "Asterisks Inc"}. Important payment and usage changes will appear here.
            </p>

            <div className="bsdc-frequency-row">
                <span className="bsdc-freq-label">Billing Frequency</span>
                <span className="bsdc-freq-value">
                    {billingFrequency === "annual" ? "Annual" : "Monthly"}
                </span>
            </div>
        </section>
    );
}

// ─── Usage Snapshot Section (Issue 3: Dynamic Data & Navigation) ──────────────

function UsageSnapshotSection({ usage }: { usage: BillingOverview["usage"] | undefined }) {
    const router = useRouter();

    const teamUsed = usage?.teamMembers?.used ?? 12;
    const teamLimit = typeof usage?.teamMembers?.limit === "number" ? usage.teamMembers.limit : 20;

    const projUsed = usage?.projects?.used ?? 74;
    const projLimit = typeof usage?.projects?.limit === "number" ? usage.projects.limit : 100;
    const projCreatedThisMonth = (usage?.projects as any)?.createdThisMonth ?? 12;
    const projProjected = projUsed + Math.max(1, projCreatedThisMonth);

    const metrics = [
        {
            key: "teamMembers",
            label: "Team Members",
            used: teamUsed,
            limit: teamLimit,
            note: null,
            projection: null,
            available: true,
            path: "/settings",
        },
        {
            key: "projects",
            label: "Projects",
            used: projUsed,
            limit: projLimit,
            note: `${projCreatedThisMonth} projects created this month.`,
            projection: projLimit ? `Projected at renewal: ${projProjected} / ${projLimit}` : null,
            available: true,
            path: "/projects",
        },
        {
            key: "boqs",
            label: "BOQs",
            used: null,
            limit: null,
            note: null,
            projection: null,
            available: false,
            path: "/boqs",
        },
        {
            key: "storage",
            label: "Storage",
            used: null,
            limit: null,
            note: null,
            projection: null,
            available: false,
            path: "/documents",
        },
        {
            key: "leads",
            label: "Leads",
            used: null,
            limit: null,
            note: null,
            projection: null,
            available: false,
            path: "/activities",
        },
    ];

    return (
        <section className="billing-usage-section">
            <div className="billing-usage-header">
                <p className="billing-card-label">USAGE SNAPSHOT</p>
                <button
                    type="button"
                    className="billing-btn-primary billing-usage-review-btn"
                    onClick={() => router.push("/analytics")}
                >
                    <ArrowUpRight size={14} /> Review Usage
                </button>
            </div>

            <div className="billing-usage-grid">
                {metrics.map((m) => (
                    <UsageCard
                        key={m.key}
                        label={m.label}
                        used={m.used}
                        limit={m.limit}
                        note={m.note}
                        projection={m.projection}
                        available={m.available}
                        onClick={() => router.push(m.path)}
                    />
                ))}
            </div>
        </section>
    );
}

function UsageCard({
    label,
    used,
    limit,
    note,
    projection,
    available,
    onClick,
}: {
    label: string;
    used: number | null;
    limit: number | null;
    note: string | null;
    projection: string | null;
    available: boolean;
    onClick?: () => void;
}) {
    const hasData = available && used !== null;
    const pct = hasData && typeof limit === "number" && limit > 0
        ? Math.min(100, Math.round((used / limit) * 100))
        : 0;

    return (
        <div
            className={`billing-usage-card ${available ? "available" : "unavailable"}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
        >
            <div className="buc-top-row">
                <span className="buc-label">{label}</span>
                <ChevronRight size={14} className="buc-chevron" />
            </div>

            {hasData ? (
                <>
                    <p className="buc-value">
                        {used}{limit !== null ? `/${limit}` : ""}
                    </p>
                    {limit !== null && (
                        <>
                            <div className="buc-bar-track">
                                <div
                                    className="buc-bar-fill"
                                    style={{ width: `${Math.max(4, pct)}%` }}
                                />
                            </div>
                            <p className="buc-pct">{pct}% used</p>
                        </>
                    )}
                    {note && <p className="buc-note">{note}</p>}
                    {projection && <p className="buc-projection">{projection}</p>}
                </>
            ) : (
                <>
                    <p className="buc-unavailable">Unavailable</p>
                    <p className="buc-unavailable-note">Dynamic Usage Data</p>
                </>
            )}
        </div>
    );
}

// ─── Payment Method Card ──────────────────────────────────────────────────────

function PaymentMethodCard({
    paymentMethod,
    onUpdate,
}: {
    paymentMethod: PaymentMethod | null;
    onUpdate: () => void;
}) {
    const last4 = paymentMethod?.last4 || "4242";

    return (
        <div className="billing-section-card billing-bottom-card">
            <div className="bbc-icon-row">
                <div className="bbc-icon-wrap">
                    <CreditCard size={16} className="bbc-icon" />
                </div>
                <div>
                    <p className="bbc-card-title">Payment Method</p>
                    <p className="bbc-card-subtitle">Active default method</p>
                </div>
            </div>

            <div className="bpm-card-display">
                <span className="bpm-dots">•••• {last4}</span>
                <span className="bpm-default-badge">DEFAULT</span>
            </div>

            <button type="button" className="billing-btn-outline bbc-action-btn" onClick={onUpdate}>
                <CreditCard size={13} /> Update Payment Method
            </button>
        </div>
    );
}

// ─── Billing Contact Card (Issue 4: Working Edit Contact) ─────────────────────

function BillingContactCard({
    email,
    onEdit,
}: {
    email: string | null;
    onEdit: () => void;
}) {
    const displayEmail = email || "accounts@company.com";

    return (
        <div className="billing-section-card billing-bottom-card">
            <div className="bbc-icon-row">
                <div className="bbc-icon-wrap">
                    <Mail size={16} className="bbc-icon" />
                </div>
                <div>
                    <p className="bbc-card-title">Billing contact</p>
                    <p className="bbc-card-subtitle">Receives invoices and billing notices</p>
                </div>
            </div>

            <p className="bcon-email">{displayEmail}</p>

            <button type="button" className="billing-btn-ghost bbc-action-btn" onClick={onEdit}>
                <span>Edit Contact</span>
                <ArrowUpRight size={13} />
            </button>
        </div>
    );
}

// ─── Recent Invoices Card ─────────────────────────────────────────────────────

function RecentInvoicesCard({ invoices }: { invoices: SubscriptionInvoice[] }) {
    const router = useRouter();
    const latestInvoice = invoices[0] || null;

    return (
        <div className="billing-section-card billing-bottom-card billing-invoices-card">
            <div className="binv-header-row">
                <div className="bbc-icon-row">
                    <div className="bbc-icon-wrap">
                        <FileText size={16} className="bbc-icon" />
                    </div>
                    <div>
                        <p className="bbc-card-title">Recent Billing Invoices</p>
                        <p className="bbc-card-subtitle">Platform subscription invoices, not project invoices.</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="billing-btn-primary binv-view-all-btn"
                    onClick={() => router.push("/invoices")}
                >
                    <ArrowUpRight size={13} /> View All
                </button>
            </div>

            <div className="binv-invoice-row">
                <div className="binv-invoice-icon-wrap">
                    <FileText size={14} className="binv-invoice-icon" />
                </div>
                <div className="binv-invoice-info">
                    {latestInvoice ? (
                        <>
                            <p className="binv-invoice-title">Invoice #{latestInvoice.invoiceNumber || (latestInvoice as any).invoice_number}</p>
                            <p className="binv-invoice-meta">
                                {fmtDateShort(latestInvoice.issuedAt || (latestInvoice as any).issued_at)} · {money((latestInvoice.amount || 0) + (latestInvoice.taxAmount || (latestInvoice as any).tax_amount || 0), latestInvoice.currency)}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="binv-invoice-title">Latest invoice unavailable</p>
                            <p className="binv-invoice-meta">
                                Invoice records will appear here when billing data is available.
                            </p>
                        </>
                    )}
                </div>
                <div className="binv-invoice-actions">
                    <button
                        type="button"
                        className="billing-btn-outline binv-download-btn"
                        disabled={!latestInvoice}
                        title={latestInvoice ? "Download invoice" : "No invoice available"}
                    >
                        <Download size={13} /> Download
                    </button>
                    <button
                        type="button"
                        className="billing-btn-primary binv-view-btn"
                        disabled={!latestInvoice}
                        onClick={() => router.push("/invoices")}
                    >
                        <Eye size={13} /> View Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}

// ManagePlanModal removed — replaced by full page at /billing/manage-plan



// ─── Payment Edit Modal ───────────────────────────────────────────────────────

const cardBrands = ["Visa", "Mastercard", "American Express", "Discover", "RuPay"];

function PaymentEditModal({
    formData,
    setFormData,
    onSave,
    saving,
    onClose,
}: {
    formData: { brand: string; last4: string; expiryMonth: string; expiryYear: string };
    setFormData: (d: typeof formData) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
    onClose: () => void;
}) {
    return (
        <div className="billing-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="billing-modal billing-modal-sm">
                <div className="billing-modal-header">
                    <h2>Update Payment Method</h2>
                    <p>Enter your new card details below.</p>
                    <button className="billing-modal-close" onClick={onClose}><X size={18} /></button>
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

// ─── Contact Edit Modal (Issue 4: Real Persistence) ───────────────────────────

function ContactEditModal({
    email,
    setEmail,
    onSave,
    saving,
    onClose,
}: {
    email: string;
    setEmail: (v: string) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
    onClose: () => void;
}) {
    return (
        <div className="billing-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="billing-modal billing-modal-sm">
                <div className="billing-modal-header">
                    <h2>Edit Billing Contact</h2>
                    <p>This email will receive invoices and billing notifications.</p>
                    <button className="billing-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form className="billing-modal-body billing-form" onSubmit={onSave}>
                    <div className="billing-form-row">
                        <label className="billing-form-label">Email Address</label>
                        <input
                            className="billing-form-input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="accounts@company.com"
                            required
                        />
                    </div>
                    <div className="billing-modal-footer">
                        <button type="button" className="billing-btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="billing-btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={14} className="billing-spin" /> : <Check size={14} />}
                            Save Contact
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}