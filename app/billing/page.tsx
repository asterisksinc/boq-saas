"use client";

import {
    CreditCard,
    ArrowUpRight,
    X,
    Check,
    AlertCircle,
    Download,
    Loader2,
    FileText,
    CalendarDays,
    Eye,
    RefreshCw,
    Users,
    FolderKanban,
    Layers,
    HardDrive,
    Zap,
    Mail,
    Info,
    Calendar,
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
import "./billing-redesign.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const planOrder = ["starter", "professional", "business", "enterprise"];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    trial: { label: "Trial", color: "#16A34A", bg: "rgba(22, 163, 74, 0.12)" },
    active: { label: "Active", color: "#16A34A", bg: "rgba(22, 163, 74, 0.12)" },
    past_due: { label: "Past Due", color: "#DC2626", bg: "#FEF2F2" },
    suspended: { label: "Suspended", color: "#DC2626", bg: "#FEF2F2" },
    cancelled_at_period_end: { label: "Cancelling", color: "#D97706", bg: "#FEF3C7" },
    cancelled: { label: "Cancelled", color: "#64748B", bg: "#F1F5F9" },
};

const cardBrands = ["Visa", "Mastercard", "American Express", "Discover", "RuPay"];

// ─── Formatters ───────────────────────────────────────────────────────────────

const money = (n: number, currency = "INR") =>
    new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(n);

const fmtDate = (x?: string | null) =>
    x
        ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
              new Date(`${x.slice(0, 10)}T00:00:00`)
          )
        : "Not available";

const fmtDateShort = (x?: string | null) =>
    x
        ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
              new Date(`${x.slice(0, 10)}T00:00:00`)
          )
        : "—";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
    const router = useRouter();

    // Data state
    const [overview, setOverview] = useState<BillingOverview | null>(null);
    const [orgName, setOrgName] = useState<string>("");
    const [ownerName, setOwnerName] = useState<string>("Organization Owner");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [showContactEdit, setShowContactEdit] = useState(false);
    const [contactEmail, setContactEmail] = useState("");
    const [contactSaving, setContactSaving] = useState(false);

    const [showPaymentEdit, setShowPaymentEdit] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ brand: "", last4: "", expiryMonth: "", expiryYear: "" });
    const [paymentSaving, setPaymentSaving] = useState(false);

    const [showUpcomingChargeModal, setShowUpcomingChargeModal] = useState(false);
    const [showRenewalInfoModal, setShowRenewalInfoModal] = useState(false);
    const [showAllInvoicesModal, setShowAllInvoicesModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);

    // Banner action loading
    const [actionLoading, setActionLoading] = useState(false);

    // Toast
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
            if (dashboardData?.profile?.displayName) {
                setOwnerName(dashboardData.profile.displayName);
            }

            const contact =
                billingData.subscription?.billingContact ||
                (billingData.subscription as any)?.billing_contact;
            if (contact) {
                setContactEmail(contact);
            }

            if (billingData.paymentMethod) {
                setPaymentForm({
                    brand: billingData.paymentMethod.brand,
                    last4: billingData.paymentMethod.last4,
                    expiryMonth:
                        (
                            billingData.paymentMethod.expiryMonth ||
                            (billingData.paymentMethod as any).expiry_month
                        )
                            ?.toString()
                            .padStart(2, "0") || "",
                    expiryYear:
                        (
                            billingData.paymentMethod.expiryYear ||
                            (billingData.paymentMethod as any).expiry_year
                        )?.toString() || "",
                });
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Could not load billing details";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadOverview();
    }, [loadOverview]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 5000);
    };

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
            showNotice("Billing contact updated successfully");
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
        if (
            !paymentForm.brand ||
            !paymentForm.last4 ||
            paymentForm.last4.length !== 4 ||
            !paymentForm.expiryMonth ||
            !paymentForm.expiryYear
        ) {
            showNotice("Please complete all payment fields", "error");
            return;
        }
        setPaymentSaving(true);
        try {
            await updatePaymentMethod({
                brand: paymentForm.brand,
                last4: paymentForm.last4,
                expiryMonth: Number(paymentForm.expiryMonth),
                expiryYear: Number(paymentForm.expiryYear),
            });
            showNotice("Payment method updated successfully");
            setShowPaymentEdit(false);
            await loadOverview();
        } catch (e: unknown) {
            showNotice(e instanceof Error ? e.message : "Could not update payment method", "error");
        } finally {
            setPaymentSaving(false);
        }
    };

    // ── Banner Actions ────────────────────────────────────────────────────────

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

    // ── Invoice Download ──────────────────────────────────────────────────────

    const handleDownloadInvoice = (inv: SubscriptionInvoice) => {
        const lines = [
            "============================================================",
            "                   SUBSCRIPTION INVOICE                     ",
            "============================================================",
            `Invoice Number:  ${inv.invoiceNumber}`,
            `Issue Date:      ${fmtDate(inv.issuedAt)}`,
            `Due Date:        ${fmtDate(inv.dueAt)}`,
            `Status:          ${inv.status.toUpperCase()}`,
            `Billed To:       ${orgName || "Asterisks Inc"}`,
            `Billing Contact: ${contactEmail || "accounts@company.com"}`,
            "------------------------------------------------------------",
            `Plan Charge:     ${money(inv.amount, inv.currency)}`,
            `Applicable Tax:  ${money(inv.taxAmount, inv.currency)}`,
            `Total Amount:    ${money(inv.amount + inv.taxAmount, inv.currency)}`,
            "------------------------------------------------------------",
            inv.paidAt ? `Paid on: ${fmtDate(inv.paidAt)}` : "Payment Pending",
            "============================================================",
        ].join("\n");

        const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${inv.invoiceNumber || "subscription"}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotice(`Downloaded invoice #${inv.invoiceNumber}`);
    };

    // ── Render Loading ────────────────────────────────────────────────────────

    if (loading) {
        return <BillingSkeleton />;
    }

    // ── Derived Data ──────────────────────────────────────────────────────────

    const sub = overview?.subscription;
    const plan = sub?.subscriptionPlans || (sub as any)?.subscription_plans;
    const status = sub?.status || "active";
    const statusInfo = statusConfig[status] || statusConfig.active;
    const currentPlanCode = sub?.planCode || (sub as any)?.plan_code || "professional";
    const billingContact = sub?.billingContact || (sub as any)?.billing_contact || contactEmail || "";
    const billingFrequency = sub?.billingFrequency || (sub as any)?.billing_frequency || "monthly";

    // Next charge calculation
    const planPrice = plan?.monthlyPrice ?? (plan as any)?.monthly_price ?? 9999;
    const currency = plan?.currency || "INR";
    const taxRate = 0.18; // 18% GST standard in India (e.g. ₹9,999 * 1.18 = ₹11,798 in Figma)
    const nextChargeAmount = Math.round(planPrice * (1 + taxRate));

    const latestInvoice = overview?.invoices && overview.invoices.length > 0 ? overview.invoices[0] : null;

    return (
        <main className="fig-dashboard boq-dashboard billing-page">
            <div className="billing-gradient-glow" />
            <DashboardRail current="/billing" />

            <div className="fig-dashboard-main">
                {/* ── Dashboard Shell Header (inherits parent, no duplicates) ── */}
                <DashboardHeader
                    title="Billing"
                    onNew={() => router.push("/projects")}
                />

                {/* ── Billing Page Body ── */}
                <div className="billing-page-body">

                    {/* ── Page Title Row (Frame 2147225066) ── */}
                    <div className="billing-page-title-row">
                        <div className="billing-title-text-group">
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
                                <CreditCard size={18} />
                                <span>Update Payment Method</span>
                            </button>
                            <button
                                type="button"
                                className="billing-btn-primary"
                                onClick={() => router.push("/billing/manage-plan")}
                            >
                                <ArrowUpRight size={18} />
                                <span>Manage Plan</span>
                            </button>
                        </div>
                    </div>

                    {/* Error Banner if any */}
                    {error && (
                        <div className="billing-error-banner">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={loadOverview}
                                style={{
                                    background: "#FFFFFF",
                                    border: "1px solid #FECACA",
                                    padding: "4px 10px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "#DC2626",
                                    fontWeight: 600,
                                }}
                            >
                                <RefreshCw size={12} /> Retry
                            </button>
                        </div>
                    )}

                    {/* ── Dynamic Scenario-Specific Notification Banner (trial / past due / etc.) ── */}
                    <BillingScenarioBanner
                        sub={sub ?? null}
                        planName={
                            plan?.name ||
                            (currentPlanCode === "business"
                                ? "Business Plan"
                                : currentPlanCode === "starter"
                                ? "Starter Plan"
                                : "Professional Plan")
                        }
                        onChoosePlan={() => router.push("/billing/manage-plan")}
                        onUpdatePayment={() => setShowPaymentEdit(true)}
                        onRetryPayment={handleRetryPayment}
                        onReactivate={handleReactivate}
                        onResolveIssue={() => setShowPaymentEdit(true)}
                        loadingAction={actionLoading}
                    />

                    {/* ── 1. BILLING DETAIL Section (Frame 2147225073) ── */}
                    <section className="billing-section-wrapper" aria-label="Billing Detail">
                        <p className="billing-section-label">BILLING DETAIL</p>
                        <div className="billing-inner-card">
                            <div className="billing-detail-row">
                                <div className="billing-detail-col">
                                    <span className="billing-detail-col-label">Billing Account</span>
                                    <span className="billing-detail-col-value">{orgName || "Asterisks Inc"}</span>
                                </div>
                                <div className="billing-detail-col">
                                    <span className="billing-detail-col-label">Plan Owner</span>
                                    <span className="billing-detail-col-value">{ownerName || "Organization Owner"}</span>
                                </div>
                                <div className="billing-detail-col">
                                    <span className="billing-detail-col-label">Billing Contact</span>
                                    <button
                                        type="button"
                                        className="billing-detail-col-email-btn"
                                        onClick={() => setShowContactEdit(true)}
                                        title="Click to edit billing contact"
                                    >
                                        {billingContact || "accounts@company.com"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── 2. SUBSCRIPTION OVERVIEW ROW (Frame 2147225464: Current Plan | Next Charge | Status) ── */}
                    <div className="billing-overview-grid">
                        {/* Current Plan Card (Frame 2147225074) */}
                        <div className="billing-overview-card-wrapper">
                            <p className="billing-section-label">CURRENT PLAN</p>
                            <div className="billing-inner-card">
                                <div className="bcp-header-row">
                                    <div className="bcp-title-block">
                                        <h2 className="bcp-plan-name">
                                            {plan?.name ||
                                                (currentPlanCode === "business"
                                                    ? "Business Plan"
                                                    : currentPlanCode === "starter"
                                                    ? "Starter Plan"
                                                    : "Professional Plan")}
                                        </h2>
                                        <span className="bcp-plan-interval">
                                            {billingFrequency === "annual" ? "Annual" : "Monthly"}
                                        </span>
                                    </div>
                                    <span
                                        className="bcp-status-badge"
                                        style={{ color: statusInfo.color, background: statusInfo.bg }}
                                    >
                                        {statusInfo.label.toUpperCase()}
                                    </span>
                                </div>

                                <hr className="billing-divider" />

                                <div className="bcp-price-row">
                                    <span className="bcp-price-label">Plan Price</span>
                                    <span className="bcp-price-value">
                                        {status === "trial"
                                            ? "Not billed"
                                            : `${money(planPrice, currency)} / ${
                                                  billingFrequency === "annual" ? "year" : "month"
                                              }`}
                                    </span>
                                </div>

                                <hr className="billing-divider" />

                                <div className="bcp-meta-row">
                                    <div className="bcp-meta-col">
                                        <span className="bcp-meta-col-label">Renewal</span>
                                        <span className="bcp-meta-col-value">
                                            {sub?.periodEnd
                                                ? fmtDate(sub.periodEnd)
                                                : (sub as any)?.period_end
                                                ? fmtDate((sub as any).period_end)
                                                : "14 September 2026"}
                                        </span>
                                    </div>
                                    <div className="bcp-meta-col">
                                        <span className="bcp-meta-col-label">Seats</span>
                                        <span className="bcp-meta-col-value">
                                            {overview?.usage?.teamMembers?.used ??
                                                sub?.seatsUsed ??
                                                (sub as any)?.seats_used ??
                                                12}{" "}
                                            of{" "}
                                            {overview?.usage?.teamMembers?.limit ??
                                                plan?.limits?.users ??
                                                (plan?.limits as any)?.seats ??
                                                20}{" "}
                                            used
                                        </span>
                                    </div>
                                    <div className="bcp-meta-col">
                                        <span className="bcp-meta-col-label">Payment Method</span>
                                        <span className="bcp-meta-col-value">
                                            {overview?.paymentMethod?.last4
                                                ? `•••• ${overview.paymentMethod.last4}`
                                                : "•••• 4242"}
                                        </span>
                                    </div>
                                </div>

                                <div className="bcp-actions-row">
                                    <button
                                        type="button"
                                        className="billing-btn-primary"
                                        onClick={() => router.push("/billing/manage-plan")}
                                    >
                                        <ArrowUpRight size={18} />
                                        <span>Manage Plan</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="billing-btn-outline"
                                        onClick={() => setShowPaymentEdit(true)}
                                    >
                                        <CreditCard size={18} />
                                        <span>Update Payment Method</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Next Charge Card (Frame 2147225075) */}
                        <div className="billing-overview-card-wrapper">
                            <p className="billing-section-label">NEXT CHARGE</p>
                            <div className="billing-inner-card">
                                <div className="bnc-amount-block">
                                    <h3 className="bnc-amount-value">
                                        {status === "trial" && !sub?.periodEnd
                                            ? "Not Scheduled"
                                            : money(nextChargeAmount, currency)}
                                    </h3>
                                    <p className="bnc-tax-label">Including applicable tax</p>
                                </div>

                                <div className="bnc-renews-box">
                                    <div className="bnc-renews-info">
                                        <span className="bnc-renews-label">Renews on</span>
                                        <span className="bnc-renews-date">
                                            {sub?.periodEnd
                                                ? fmtDate(sub.periodEnd)
                                                : (sub as any)?.period_end
                                                ? fmtDate((sub as any).period_end)
                                                : "14 September 2026"}
                                        </span>
                                    </div>
                                    <CalendarDays size={20} className="bnc-calendar-icon" />
                                </div>

                                <div className="bnc-pm-row">
                                    <div className="bnc-pm-left">
                                        <span className="bnc-pm-label">Payment method</span>
                                        <span className="bnc-pm-val">
                                            {overview?.paymentMethod?.last4
                                                ? `•••• ${overview.paymentMethod.last4}`
                                                : "•••• 4242"}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="bnc-view-details-btn"
                                        onClick={() => setShowUpcomingChargeModal(true)}
                                    >
                                        View Details
                                    </button>
                                </div>

                                <hr className="billing-divider" />

                                <button
                                    type="button"
                                    className="bnc-renewal-info-link"
                                    onClick={() => setShowRenewalInfoModal(true)}
                                >
                                    View Renewal Information
                                </button>
                            </div>
                        </div>

                        {/* Subscription Status Dark Card (Frame 93 Dark) */}
                        <div className="billing-status-dark-card">
                            <p className="bsdc-label">SUBSCRIPTION STATUS</p>

                            <hr className="billing-divider-dark" />

                            <div className="bsdc-status-group">
                                <div className="bsdc-pill">
                                    <Check size={24} className="bsdc-check-icon" strokeWidth={3} />
                                    <span className="bsdc-pill-text">
                                        {status === "active" ? "Active" : statusInfo.label}
                                    </span>
                                </div>
                                <p className="bsdc-scope-desc">
                                    Billing is scoped to {orgName || "Asterisks Inc"}. Important payment and usage changes will appear here.
                                </p>
                            </div>

                            <hr className="billing-divider-dark" />

                            <div className="bsdc-freq-row">
                                <span className="bsdc-freq-label">Billing Frequency</span>
                                <span className="bsdc-freq-val">
                                    {billingFrequency === "annual" ? "Annual" : "Monthly"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── 3. USAGE SNAPSHOT (Frame 2147225074) ── */}
                    <section className="billing-section-wrapper" aria-label="Usage Snapshot">
                        <div className="billing-section-header">
                            <p className="billing-section-label">USAGE SNAPSHOT</p>
                            <button
                                type="button"
                                className="billing-btn-primary"
                                onClick={() => router.push("/analytics")}
                            >
                                <ArrowUpRight size={18} />
                                <span>Review Usage</span>
                            </button>
                        </div>

                        <div className="billing-usage-grid">
                            {/* Card 1: Team Members */}
                            <UsageCard
                                title="Team Members"
                                icon={<Users size={16} className="buk-icon" />}
                                value={`${overview?.usage?.teamMembers?.used ?? 12}/${
                                    overview?.usage?.teamMembers?.limit ?? 20
                                }`}
                                percentage={Math.min(
                                    100,
                                    Math.round(
                                        ((overview?.usage?.teamMembers?.used ?? 12) /
                                            (overview?.usage?.teamMembers?.limit ?? 20)) *
                                            100
                                    )
                                )}
                                note={`${Math.min(
                                    100,
                                    Math.round(
                                        ((overview?.usage?.teamMembers?.used ?? 12) /
                                            (overview?.usage?.teamMembers?.limit ?? 20)) *
                                            100
                                    )
                                )}% used`}
                                onClick={() => router.push("/settings")}
                            />

                            {/* Card 2: Projects */}
                            <UsageCard
                                title="Projects"
                                icon={<FolderKanban size={16} className="buk-icon" />}
                                value={`${overview?.usage?.projects?.used ?? 74}/${
                                    overview?.usage?.projects?.limit ?? 100
                                }`}
                                percentage={Math.min(
                                    100,
                                    Math.round(
                                        ((overview?.usage?.projects?.used ?? 74) /
                                            (overview?.usage?.projects?.limit ?? 100)) *
                                            100
                                    )
                                )}
                                note={`${(overview?.usage?.projects as any)?.createdThisMonth ?? 12} projects created this month · Projected at renewal: ${
                                    (overview?.usage?.projects?.used ?? 74) +
                                    ((overview?.usage?.projects as any)?.createdThisMonth ?? 12)
                                } / ${overview?.usage?.projects?.limit ?? 100}`}
                                onClick={() => router.push("/projects")}
                            />

                            {/* Card 3: BOQs */}
                            <UsageCard
                                title="BOQs"
                                icon={<Layers size={16} className="buk-icon" />}
                                value={
                                    overview?.usage?.boqs?.used != null
                                        ? String(overview.usage.boqs.used)
                                        : "Unavailable"
                                }
                                note="Dynamic Usage Data"
                                onClick={() => router.push("/boqs")}
                            />

                            {/* Card 4: Storage */}
                            <UsageCard
                                title="Storage"
                                icon={<HardDrive size={16} className="buk-icon" />}
                                value="Unavailable"
                                note="Dynamic Usage Data"
                                onClick={() => router.push("/documents")}
                            />

                            {/* Card 5: Leads */}
                            <UsageCard
                                title="Leads"
                                icon={<Zap size={16} className="buk-icon" />}
                                value="Unavailable"
                                note="Dynamic Usage Data"
                                onClick={() => router.push("/activities")}
                            />
                        </div>
                    </section>

                    {/* ── 4. BOTTOM ROW (Frame 2147225476: Payment + Contact + Recent Invoices) ── */}
                    <div className="billing-bottom-grid">
                        {/* Subgrid: Left 2 Cards */}
                        <div className="billing-bottom-subgrid">
                            {/* Payment Method Card (Frame 2147225027) */}
                            <div className="billing-bottom-card">
                                <div className="bbc-header-row">
                                    <div className="bbc-icon-box">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="bbc-title-block">
                                        <p className="bbc-card-title">Payment Method</p>
                                        <p className="bbc-card-subtitle">Active default method</p>
                                    </div>
                                </div>

                                <div className="bbc-value-row">
                                    <p className="bbc-value-digits">
                                        {overview?.paymentMethod?.last4
                                            ? `•••• ${overview.paymentMethod.last4}`
                                            : "•••• 4242"}
                                    </p>
                                    <span className="bbc-default-badge">DEFAULT</span>
                                </div>

                                <button
                                    type="button"
                                    className="billing-btn-outline"
                                    onClick={() => setShowPaymentEdit(true)}
                                >
                                    <CreditCard size={16} />
                                    <span>Update Payment Method</span>
                                </button>
                            </div>

                            {/* Billing Contact Card (Frame 2147225465) */}
                            <div className="billing-bottom-card">
                                <div className="bbc-header-row">
                                    <div className="bbc-icon-box">
                                        <Mail size={20} />
                                    </div>
                                    <div className="bbc-title-block">
                                        <p className="bbc-card-title">Billing contact</p>
                                        <p className="bbc-card-subtitle">Receives invoices and billing notices</p>
                                    </div>
                                </div>

                                <p className="bbc-email-val">{billingContact || "accounts@company.com"}</p>

                                <button
                                    type="button"
                                    className="billing-btn-outline"
                                    onClick={() => setShowContactEdit(true)}
                                >
                                    <ArrowUpRight size={16} />
                                    <span>Edit Contact</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Billing Invoices Card (Frame 2147225466) */}
                        <div className="billing-bottom-card">
                            <div className="binv-top-bar">
                                <div className="bbc-header-row">
                                    <div className="bbc-icon-box">
                                        <FileText size={20} />
                                    </div>
                                    <div className="bbc-title-block">
                                        <p className="bbc-card-title">Recent Billing Invoices</p>
                                        <p className="bbc-card-subtitle">
                                            Platform subscription invoices, not project invoices.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="billing-btn-primary"
                                    onClick={() => setShowAllInvoicesModal(true)}
                                >
                                    <ArrowUpRight size={16} />
                                    <span>View All</span>
                                </button>
                            </div>

                            <hr className="billing-divider" />

                            <div className="binv-item-row">
                                <div className="binv-item-left">
                                    <div className="bbc-icon-box">
                                        <FileText size={20} />
                                    </div>
                                    <div className="bbc-title-block">
                                        {latestInvoice ? (
                                            <>
                                                <p className="bbc-card-title">
                                                    Invoice #{latestInvoice.invoiceNumber || (latestInvoice as any).invoice_number}
                                                </p>
                                                <p className="bbc-card-subtitle">
                                                    {fmtDateShort(latestInvoice.issuedAt || (latestInvoice as any).issued_at)} ·{" "}
                                                    {money(
                                                        (latestInvoice.amount || 0) +
                                                            (latestInvoice.taxAmount ||
                                                                (latestInvoice as any).tax_amount ||
                                                                0),
                                                        latestInvoice.currency
                                                    )}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="bbc-card-title">Latest invoice unavailable</p>
                                                <p className="bbc-card-subtitle">
                                                    Invoice records will appear here when billing data is available.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="binv-item-actions">
                                    <button
                                        type="button"
                                        className="billing-btn-outline"
                                        disabled={!latestInvoice}
                                        onClick={() => latestInvoice && handleDownloadInvoice(latestInvoice)}
                                    >
                                        <Download size={16} />
                                        <span>Download</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="billing-btn-primary"
                                        disabled={!latestInvoice}
                                        onClick={() => latestInvoice && setSelectedInvoice(latestInvoice)}
                                    >
                                        <ArrowUpRight size={16} />
                                        <span>View Invoice</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

            {/* ── Edit Billing Contact Modal ── */}
            {showContactEdit && (
                <ContactEditModal
                    email={contactEmail || billingContact}
                    setEmail={setContactEmail}
                    onSave={handleContactSave}
                    saving={contactSaving}
                    onClose={() => setShowContactEdit(false)}
                />
            )}

            {/* ── Next Charge Upcoming Breakdown Modal ── */}
            {showUpcomingChargeModal && (
                <UpcomingChargeModal
                    amount={nextChargeAmount}
                    planPrice={planPrice}
                    currency={currency}
                    taxRate={taxRate}
                    renewalDate={sub?.periodEnd || (sub as any)?.period_end}
                    paymentMethod={overview?.paymentMethod ?? null}
                    onClose={() => setShowUpcomingChargeModal(false)}
                    onUpdatePayment={() => {
                        setShowUpcomingChargeModal(false);
                        setShowPaymentEdit(true);
                    }}
                />
            )}

            {/* ── Renewal Information Modal ── */}
            {showRenewalInfoModal && (
                <RenewalInfoModal
                    orgName={orgName || "Asterisks Inc"}
                    planName={
                        plan?.name ||
                        (currentPlanCode === "business"
                            ? "Business Plan"
                            : currentPlanCode === "starter"
                            ? "Starter Plan"
                            : "Professional Plan")
                    }
                    billingFrequency={billingFrequency}
                    periodEnd={sub?.periodEnd || (sub as any)?.period_end}
                    periodStart={sub?.periodStart || (sub as any)?.period_start}
                    amount={nextChargeAmount}
                    currency={currency}
                    seatsUsed={overview?.usage?.teamMembers?.used ?? 12}
                    seatLimit={overview?.usage?.teamMembers?.limit ?? 20}
                    onClose={() => setShowRenewalInfoModal(false)}
                />
            )}

            {/* ── Platform Subscription Invoices List Modal ("View All") ── */}
            {showAllInvoicesModal && (
                <AllInvoicesModal
                    invoices={overview?.invoices || []}
                    onSelectInvoice={(inv) => {
                        setShowAllInvoicesModal(false);
                        setSelectedInvoice(inv);
                    }}
                    onDownloadInvoice={handleDownloadInvoice}
                    onClose={() => setShowAllInvoicesModal(false)}
                />
            )}

            {/* ── Single Invoice Detail Modal ── */}
            {selectedInvoice && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    orgName={orgName || "Asterisks Inc"}
                    onDownload={() => handleDownloadInvoice(selectedInvoice)}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}

            {/* ── Toast Notification ── */}
            {notice && (
                <div className={`billing-toast ${notice.type}`}>
                    {notice.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{notice.message}</span>
                    <button type="button" onClick={() => setNotice(null)}>
                        <X size={14} />
                    </button>
                </div>
            )}
        </main>
    );
}

// ─── Usage KPI Card ───────────────────────────────────────────────────────────

function UsageCard({
    title,
    icon,
    value,
    percentage,
    note,
    onClick,
}: {
    title: string;
    icon: React.ReactNode;
    value: string;
    percentage?: number;
    note?: string;
    onClick?: () => void;
}) {
    return (
        <div
            className="billing-usage-kpi-card"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onClick?.();
            }}
        >
            <div className="buk-top-row">
                <span className="buk-title">{title}</span>
                {icon}
            </div>

            <div className="buk-body">
                <p className="buk-value-main">{value}</p>

                {percentage !== undefined ? (
                    <div className="buk-progress-group">
                        <div className="buk-progress-track">
                            <div
                                className="buk-progress-fill"
                                style={{ width: `${Math.max(4, percentage)}%` }}
                            />
                        </div>
                        {note && <p className="buk-subtitle-text">{note}</p>}
                    </div>
                ) : (
                    note && <p className="buk-subtitle-text">{note}</p>
                )}
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
    setFormData: (d: typeof formData) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
    onClose: () => void;
}) {
    return (
        <div
            className="billing-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="billing-modal">
                <div className="billing-modal-header">
                    <h2>Update Payment Method</h2>
                    <p>Enter your payment card details below.</p>
                    <button type="button" className="billing-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <form className="billing-modal-body" onSubmit={onSave}>
                    <div className="billing-form-row">
                        <label className="billing-form-label">Card Brand</label>
                        <select
                            className="billing-form-input"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            required
                        >
                            <option value="">Select card brand</option>
                            {cardBrands.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="billing-form-row">
                        <label className="billing-form-label">Last 4 Digits</label>
                        <input
                            className="billing-form-input"
                            type="text"
                            value={formData.last4}
                            onChange={(e) => setFormData({ ...formData, last4: e.target.value })}
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
                                onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
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
                                onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                                placeholder="YYYY"
                                maxLength={4}
                                pattern="\d{4}"
                                required
                            />
                        </div>
                    </div>
                    <div className="billing-modal-footer">
                        <button type="button" className="billing-btn-outline" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="billing-btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={16} className="billing-spin" /> : <Check size={16} />}
                            <span>Save Payment Method</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Contact Edit Modal ───────────────────────────────────────────────────────

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
        <div
            className="billing-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="billing-modal">
                <div className="billing-modal-header">
                    <h2>Edit Billing Contact</h2>
                    <p>This email receives platform subscription invoices and notices.</p>
                    <button type="button" className="billing-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <form className="billing-modal-body" onSubmit={onSave}>
                    <div className="billing-form-row">
                        <label className="billing-form-label">Billing Email Address</label>
                        <input
                            className="billing-form-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="accounts@company.com"
                            required
                        />
                    </div>
                    <div className="billing-modal-footer">
                        <button type="button" className="billing-btn-outline" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="billing-btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={16} className="billing-spin" /> : <Check size={16} />}
                            <span>Save Contact</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Upcoming Charge Modal ────────────────────────────────────────────────────

function UpcomingChargeModal({
    amount,
    planPrice,
    currency,
    taxRate,
    renewalDate,
    paymentMethod,
    onClose,
    onUpdatePayment,
}: {
    amount: number;
    planPrice: number;
    currency: string;
    taxRate: number;
    renewalDate?: string | null;
    paymentMethod: PaymentMethod | null;
    onClose: () => void;
    onUpdatePayment: () => void;
}) {
    const taxAmount = Math.round(planPrice * taxRate);

    return (
        <div
            className="billing-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="billing-modal">
                <div className="billing-modal-header">
                    <h2>Upcoming Charge Details</h2>
                    <p>Estimated billing preview for your next subscription renewal.</p>
                    <button type="button" className="billing-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="billing-modal-body">
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom: "1px solid #EBEBEB",
                        }}
                    >
                        <span style={{ color: "#64748B", fontSize: "14px" }}>Plan Base Price</span>
                        <span style={{ fontWeight: 600, color: "#0F172A", fontSize: "14px" }}>
                            {money(planPrice, currency)}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom: "1px solid #EBEBEB",
                        }}
                    >
                        <span style={{ color: "#64748B", fontSize: "14px" }}>Applicable Taxes (18% GST)</span>
                        <span style={{ fontWeight: 600, color: "#0F172A", fontSize: "14px" }}>
                            {money(taxAmount, currency)}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "14px 0",
                            borderBottom: "2px solid #E2E8F0",
                        }}
                    >
                        <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "15px" }}>
                            Estimated Total
                        </span>
                        <span style={{ fontWeight: 700, color: "#2563EB", fontSize: "18px" }}>
                            {money(amount, currency)}
                        </span>
                    </div>
                    <div
                        style={{
                            background: "#F8FAFC",
                            padding: "14px",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            fontSize: "13px",
                            color: "#64748B",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Scheduled Renewal Date:</span>
                            <strong style={{ color: "#0F172A" }}>
                                {renewalDate ? fmtDate(renewalDate) : "14 September 2026"}
                            </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Charging Method:</span>
                            <strong style={{ color: "#0F172A" }}>
                                {paymentMethod?.last4 ? `•••• ${paymentMethod.last4}` : "•••• 4242"}
                            </strong>
                        </div>
                    </div>
                </div>
                <div className="billing-modal-footer">
                    <button type="button" className="billing-btn-outline" onClick={onClose}>
                        Close
                    </button>
                    <button type="button" className="billing-btn-primary" onClick={onUpdatePayment}>
                        <CreditCard size={16} />
                        <span>Change Card</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Renewal Information Modal ────────────────────────────────────────────────

function RenewalInfoModal({
    orgName,
    planName,
    billingFrequency,
    periodStart,
    periodEnd,
    amount,
    currency,
    seatsUsed,
    seatLimit,
    onClose,
}: {
    orgName: string;
    planName: string;
    billingFrequency: string;
    periodStart?: string | null;
    periodEnd?: string | null;
    amount: number;
    currency: string;
    seatsUsed: number;
    seatLimit: number;
    onClose: () => void;
}) {
    return (
        <div
            className="billing-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="billing-modal">
                <div className="billing-modal-header">
                    <h2>Subscription Renewal Terms</h2>
                    <p>Details regarding your subscription cycle and renewal policy.</p>
                    <button type="button" className="billing-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="billing-modal-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Organization:</span>
                            <strong style={{ color: "#0F172A" }}>{orgName}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Subscribed Tier:</span>
                            <strong style={{ color: "#0F172A" }}>{planName}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Billing Frequency:</span>
                            <strong style={{ color: "#0F172A" }}>
                                {billingFrequency === "annual" ? "Annual" : "Monthly"}
                            </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Current Period:</span>
                            <strong style={{ color: "#0F172A" }}>
                                {periodStart ? fmtDateShort(periodStart) : "14 Aug 2026"} –{" "}
                                {periodEnd ? fmtDateShort(periodEnd) : "14 Sep 2026"}
                            </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Seats Included:</span>
                            <strong style={{ color: "#0F172A" }}>
                                {seatsUsed} of {seatLimit} utilized
                            </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Renewal Charge:</span>
                            <strong style={{ color: "#2563EB" }}>{money(amount, currency)}</strong>
                        </div>
                    </div>

                    <div
                        style={{
                            background: "#F1F5F9",
                            padding: "14px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "#475569",
                            lineHeight: "1.5",
                        }}
                    >
                        Subscriptions auto-renew automatically at the end of each billing cycle unless cancelled prior to renewal. All invoices are provided for tax and accounting compliance.
                    </div>
                </div>
                <div className="billing-modal-footer">
                    <button type="button" className="billing-btn-primary" onClick={onClose}>
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── All Subscription Invoices Modal ──────────────────────────────────────────

function AllInvoicesModal({
    invoices,
    onSelectInvoice,
    onDownloadInvoice,
    onClose,
}: {
    invoices: SubscriptionInvoice[];
    onSelectInvoice: (inv: SubscriptionInvoice) => void;
    onDownloadInvoice: (inv: SubscriptionInvoice) => void;
    onClose: () => void;
}) {
    return (
        <div
            className="billing-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="billing-modal billing-modal-md">
                <div className="billing-modal-header">
                    <h2>Platform Subscription Invoices</h2>
                    <p>Platform billing history (independent of customer project invoices).</p>
                    <button type="button" className="billing-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="billing-modal-body">
                    {invoices.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "36px 16px",
                                color: "#64748B",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <FileText size={32} style={{ color: "#CBD5E1" }} />
                            <p style={{ margin: 0, fontWeight: 600, color: "#0F172A", fontSize: "15px" }}>
                                No Platform Invoices Yet
                            </p>
                            <p style={{ margin: 0, fontSize: "13px" }}>
                                Platform subscription invoices will be generated and archived here upon billing cycle renewal.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {invoices.map((inv) => (
                                <div
                                    key={inv.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "14px",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "8px",
                                        background: "#FFFFFF",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div className="bbc-icon-box" style={{ width: "36px", height: "36px" }}>
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 600,
                                                    fontSize: "14px",
                                                    color: "#0F172A",
                                                }}
                                            >
                                                Invoice #{inv.invoiceNumber}
                                            </p>
                                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                                                {fmtDate(inv.issuedAt)} ·{" "}
                                                {money(inv.amount + inv.taxAmount, inv.currency)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            className="billing-btn-outline"
                                            style={{ height: "36px", padding: "0 12px", fontSize: "12px" }}
                                            onClick={() => onDownloadInvoice(inv)}
                                        >
                                            <Download size={14} /> Download
                                        </button>
                                        <button
                                            type="button"
                                            className="billing-btn-primary"
                                            style={{ height: "36px", padding: "0 12px", fontSize: "12px" }}
                                            onClick={() => onSelectInvoice(inv)}
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="billing-modal-footer">
                    <button type="button" className="billing-btn-outline" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Single Invoice Detail Modal ──────────────────────────────────────────────

function InvoiceDetailModal({
    invoice,
    orgName,
    onDownload,
    onClose,
}: {
    invoice: SubscriptionInvoice;
    orgName: string;
    onDownload: () => void;
    onClose: () => void;
}) {
    return (
        <div
            className="billing-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="billing-modal">
                <div className="billing-modal-header">
                    <h2>Invoice #{invoice.invoiceNumber}</h2>
                    <p>Issued {fmtDate(invoice.issuedAt)}</p>
                    <button type="button" className="billing-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="billing-modal-body">
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                        <span style={{ color: "#64748B" }}>Organization:</span>
                        <strong style={{ color: "#0F172A" }}>{orgName}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                        <span style={{ color: "#64748B" }}>Status:</span>
                        <span
                            style={{
                                padding: "2px 8px",
                                borderRadius: "99px",
                                background: "rgba(22, 163, 74, 0.12)",
                                color: "#16A34A",
                                fontSize: "12px",
                                fontWeight: 600,
                            }}
                        >
                            {invoice.status.toUpperCase()}
                        </span>
                    </div>
                    <hr className="billing-divider" />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                        <span style={{ color: "#64748B" }}>Subscription Fee:</span>
                        <strong style={{ color: "#0F172A" }}>{money(invoice.amount, invoice.currency)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                        <span style={{ color: "#64748B" }}>Tax:</span>
                        <strong style={{ color: "#0F172A" }}>{money(invoice.taxAmount, invoice.currency)}</strong>
                    </div>
                    <hr className="billing-divider" />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px" }}>
                        <span style={{ fontWeight: 700, color: "#0F172A" }}>Total Amount:</span>
                        <strong style={{ fontWeight: 700, color: "#2563EB" }}>
                            {money(invoice.amount + invoice.taxAmount, invoice.currency)}
                        </strong>
                    </div>
                    {invoice.paidAt && (
                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748B" }}>
                            Payment settled on {fmtDate(invoice.paidAt)}
                        </p>
                    )}
                </div>
                <div className="billing-modal-footer">
                    <button type="button" className="billing-btn-outline" onClick={onClose}>
                        Close
                    </button>
                    <button type="button" className="billing-btn-primary" onClick={onDownload}>
                        <Download size={16} />
                        <span>Download Invoice</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Billing Skeleton ─────────────────────────────────────────────────────────

function BillingSkeleton() {
    return (
        <main className="fig-dashboard boq-dashboard billing-page">
            <div className="billing-gradient-glow" />
            <DashboardRail current="/billing" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Billing" />
                <div className="billing-page-body">
                    <div className="billing-page-title-row">
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div className="billing-skel" style={{ width: "120px", height: "24px" }} />
                            <div className="billing-skel" style={{ width: "320px", height: "16px" }} />
                        </div>
                    </div>
                    <div className="billing-skel" style={{ width: "100%", height: "148px" }} />
                    <div className="billing-overview-grid">
                        <div className="billing-skel" style={{ height: "352px" }} />
                        <div className="billing-skel" style={{ height: "352px" }} />
                        <div className="billing-skel" style={{ height: "352px" }} />
                    </div>
                    <div className="billing-skel" style={{ width: "100%", height: "269px" }} />
                    <div className="billing-bottom-grid">
                        <div className="billing-bottom-subgrid">
                            <div className="billing-skel" style={{ height: "179px" }} />
                            <div className="billing-skel" style={{ height: "179px" }} />
                        </div>
                        <div className="billing-skel" style={{ height: "179px" }} />
                    </div>
                </div>
            </div>
        </main>
    );
}
