"use client";

import {
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    X,
    Check,
    AlertCircle,
    Clock,
    RotateCcw,
    Trash2,
    Edit3,
    Plus,
    ChevronDown,
    Download,
    Loader2,
    Shield,
    Users,
    FolderOpen,
    FileText,
    LayoutDashboard,
    Zap,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getBillingOverview,
    getPlanPreview,
    updateBillingContact,
    updatePaymentMethod,
    changeSubscription,
    cancelSubscription,
    reactivateSubscription,
    retryPayment,
    BillingOverview,
    PlanPreview,
    SubscriptionPlan,
    SubscriptionInvoice,
    PaymentMethod,
} from "@/lib/api/auth";

const navRoutes = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing", "/activities"];
const navIcons = [
    "dashboard-overview-active",
    "dashboard-projects",
    "dashboard-boqs",
    "dashboard-costs",
    "dashboard-workspace",
    "dashboard-estimates",
    "dashboard-purchase-orders",
    "dashboard-analytics",
    "dashboard-reports",
    "dashboard-integrations",
    "dashboard-billing",
    "dashboard-activities-active",
];

const planOrder = ["starter", "professional", "business", "enterprise"];
const planIcons: Record<string, React.ReactNode> = {
    starter: <LayoutDashboard size={24} />,
    professional: <Users size={24} />,
    business: <Zap size={24} />,
    enterprise: <Shield size={24} />,
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    trial: { label: "Trial", color: "#2563eb", bg: "#eff6ff", icon: <Zap size={12} className="status-icon" /> },
    active: { label: "Active", color: "#16a34a", bg: "#f0fdf4", icon: <Check size={12} className="status-icon" /> },
    past_due: { label: "Past Due", color: "#f59e0b", bg: "#fffbeb", icon: <AlertCircle size={12} className="status-icon" /> },
    suspended: { label: "Suspended", color: "#ef4444", bg: "#fef2f2", icon: <X size={12} className="status-icon" /> },
    cancelled_at_period_end: { label: "Cancels at Period End", color: "#6b7280", bg: "#f9fafb", icon: <Clock size={12} className="status-icon" /> },
    cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f3f4f6", icon: <X size={12} className="status-icon" /> },
};

const money = (n: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
const date = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${x}T00:00:00`)) : "—";
const dateTime = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(x)) : "—";

export default function BillingPage() {
    const router = useRouter();
    const [overview, setOverview] = useState<BillingOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [preview, setPreview] = useState<PlanPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);

    const [contactEmail, setContactEmail] = useState("");
    const [contactSaving, setContactSaving] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState<{ brand: string; last4: string; expiryMonth: string; expiryYear: string }>({ brand: "", last4: "", expiryMonth: "", expiryYear: "" });
    const [paymentSaving, setPaymentSaving] = useState(false);

    const [changeLoading, setChangeLoading] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBillingOverview();
            setOverview(data);
            if (data.subscription?.billingContact) {
                setContactEmail(data.subscription.billingContact);
            }
            if (data.paymentMethod) {
                setPaymentMethod({
                    brand: data.paymentMethod.brand,
                    last4: data.paymentMethod.last4,
                    expiryMonth: data.paymentMethod.expiryMonth?.toString().padStart(2, "0") || "",
                    expiryYear: data.paymentMethod.expiryYear?.toString() || "",
                });
            }
        } catch (e: any) {
            setError(e.message || "Could not load billing details");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOverview(); }, [loadOverview]);

    const handlePreview = async (planCode: string) => {
        if (selectedPlanCode === planCode) { setSelectedPlanCode(null); setPreview(null); return; }
        setPreviewLoading(true);
        setSelectedPlanCode(planCode);
        try {
            const data = await getPlanPreview(planCode);
            setPreview(data);
        } catch { setPreview(null); }
        finally { setPreviewLoading(false); }
    };

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 5000);
    };

    const handleContactSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return;
        setContactSaving(true);
        try {
            await updateBillingContact({ email: contactEmail });
            showNotice("Billing contact updated");
            loadOverview();
        } catch (e: any) { showNotice(e.message || "Could not update billing contact", "error"); }
        finally { setContactSaving(false); }
    };

    const handlePaymentSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!paymentMethod.brand || !paymentMethod.last4 || paymentMethod.last4.length !== 4 || !paymentMethod.expiryMonth || !paymentMethod.expiryYear) return;
        setPaymentSaving(true);
        try {
            await updatePaymentMethod({
                brand: paymentMethod.brand,
                last4: paymentMethod.last4,
                expiryMonth: Number(paymentMethod.expiryMonth),
                expiryYear: Number(paymentMethod.expiryYear),
            });
            showNotice("Payment method updated");
            loadOverview();
        } catch (e: any) { showNotice(e.message || "Could not update payment method", "error"); }
        finally { setPaymentSaving(false); }
    };

    const handleChangePlan = async (planCode: string, frequency: "monthly" | "annual") => {
        setChangeLoading(true);
        try {
            await changeSubscription({ planCode: planCode as any, billingFrequency: frequency });
            showNotice(`Plan changed to ${planCode}`);
            setSelectedPlanCode(null);
            setPreview(null);
            loadOverview();
        } catch (e: any) { showNotice(e.message || "Could not change plan", "error"); }
        finally { setChangeLoading(false); }
    };

    const handleCancel = async () => {
        try {
            await cancelSubscription();
            showNotice("Subscription will be cancelled at period end");
            loadOverview();
        } catch (e: any) { showNotice(e.message || "Could not cancel subscription", "error"); }
        finally { setCancelConfirm(false); }
    };

    const handleReactivate = async () => {
        try {
            await reactivateSubscription();
            showNotice("Subscription reactivated");
            loadOverview();
        } catch (e: any) { showNotice(e.message || "Could not reactivate", "error"); }
    };

    const handleRetry = async () => {
        try {
            await retryPayment();
            showNotice("Payment retry initiated");
            loadOverview();
        } catch (e: any) { showNotice(e.message || "Could not retry payment", "error"); }
    };

    if (loading) return <BillingSkeleton />;

    const sub = overview?.subscription;
    const plan = sub?.subscriptionPlans;
    const status = sub?.status || "trial";
    const statusInfo = statusConfig[status] || statusConfig.trial;
    const canManage = overview?.canManageBilling;

    const currentPlanCode = sub?.planCode || "starter";
    const currentPlanIdx = planOrder.indexOf(currentPlanCode);
    const availablePlans = overview?.plans?.filter(p => planOrder.includes(p.code)) || [];

    return (
        <main className="fig-dashboard boq-dashboard billing-page">
            <div className="fig-dashboard-glow" />
            <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
                <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
                <nav className="fig-dashboard-menu">
                    {navRoutes.map((route, index) => (
                        <button key={route} type="button" className={index === 11 ? "is-current" : ""} aria-label={`Navigate to ${route}`} onClick={() => window.location.assign(route)}>
                            <img src={`/assets/dashboard/${navIcons[index]}.svg`} alt="" />
                        </button>
                    ))}
                </nav>
                <div className="fig-dashboard-tools">
                    <button type="button" aria-label="Help"><img src="/assets/dashboard/dashboard-help.svg" alt="" /></button>
                    <button type="button" aria-label="Settings"><img src="/assets/dashboard/dashboard-settings.svg" alt="" /></button>
                </div>
            </aside>

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Billing</h1>
                    <div className="fig-dashboard-header-actions">
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
                        <div className="fig-dashboard-avatar">BI</div>
                    </div>
                </header>

                <section className="billing-content">
                    {error && <div className="billing-error"><AlertCircle size={20} /><span>{error}</span><button onClick={loadOverview}><RotateCcw size={16} />Retry</button></div>}

                    <div className="billing-grid">
                        <div className="billing-main">
                            <SubscriptionStatusCard
                                sub={sub}
                                plan={plan}
                                status={status}
                                statusInfo={statusInfo}
                                canManage={canManage}
                                onCancel={() => setCancelConfirm(true)}
                                onReactivate={handleReactivate}
                                onRetry={handleRetry}
                                cancelConfirm={cancelConfirm}
                                setCancelConfirm={setCancelConfirm}
                            />

                            <UsageCard usage={overview?.usage} />

                            <PaymentMethodCard
                                paymentMethod={overview?.paymentMethod}
                                formData={paymentMethod}
                                setFormData={setPaymentMethod}
                                onSave={handlePaymentSave}
                                saving={paymentSaving}
                                canManage={canManage}
                            />

                            <BillingContactCard
                                email={contactEmail}
                                setEmail={setContactEmail}
                                onSave={handleContactSave}
                                saving={contactSaving}
                                canManage={canManage}
                            />

                            <InvoicesCard invoices={overview?.invoices || []} />
                        </div>

                        <aside className="billing-sidebar">
                            <PlansComparisonCard
                                plans={availablePlans}
                                currentPlanCode={currentPlanCode}
                                selectedPlanCode={selectedPlanCode}
                                setSelectedPlanCode={setSelectedPlanCode}
                                preview={preview}
                                previewLoading={previewLoading}
                                onPreview={handlePreview}
                                onChangePlan={handleChangePlan}
                                changeLoading={changeLoading}
                                sub={sub}
                            />
                        </aside>
                    </div>
                </section>
            </div>

            {notice && <div className={`notice-banner ${notice.type}`}><span>{notice.message}</span><button onClick={() => setNotice(null)}><X size={14} /></button></div>}
        </main>
    );
}

function BillingSkeleton() {
    return (
        <main className="fig-dashboard boq-dashboard billing-page">
            <div className="fig-dashboard-glow" />
            <aside className="fig-dashboard-rail"><div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div><nav className="fig-dashboard-menu">{navIcons.map((icon, i) => <button key={icon} className={i === 11 ? "is-current" : ""}><img src={`/assets/dashboard/${icon}.svg`} alt="" /></button>)}</nav></aside>
            <div className="fig-dashboard-main"><header className="fig-dashboard-header"><h1>Billing</h1></header>
                <section className="billing-content">
                    <div className="billing-grid">
                        <div className="billing-main">
                            <div className="skeleton-card"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /><div className="skeleton skeleton-meta" /></div>
                            <div className="skeleton-card"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /><div className="skeleton skeleton-meta" /></div>
                            <div className="skeleton-card"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /><div className="skeleton skeleton-meta" /></div>
                            <div className="skeleton-card"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /><div className="skeleton skeleton-meta" /></div>
                        </div>
                        <aside className="billing-sidebar"><div className="skeleton-card"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /><div className="skeleton skeleton-meta" /></div></aside>
                    </div>
                </section>
            </div>
        </main>
    );
}

function SubscriptionStatusCard({ sub, plan, status, statusInfo, canManage, onCancel, onReactivate, onRetry, cancelConfirm, setCancelConfirm }: any) {
    const periodEnd = sub?.periodEnd ? date(sub.periodEnd) : "—";
    const periodStart = sub?.periodStart ? date(sub.periodStart) : "—";

    return (
        <section className="billing-card subscription-status">
            <div className="card-header">
                <h2>Subscription</h2>
                <span className={`status-badge ${status}`} style={{ background: statusInfo.bg, color: statusInfo.color }}>
                    {statusInfo.icon}
                    {statusInfo.label}
                </span>
            </div>

            <div className="plan-info">
                <div className="plan-icon" style={{ background: plan?.code === "enterprise" ? "linear-gradient(135deg, #7c3aed, #a855f7)" : plan?.code === "business" ? "linear-gradient(135deg, #2563eb, #3b82f6)" : plan?.code === "professional" ? "linear-gradient(135deg, #0891b2, #06b6d4)" : "linear-gradient(135deg, #16a34a, #22c55e)" }}>
                    {planIcons[plan?.code || "starter"]}
                </div>
                <div className="plan-details">
                    <h3>{plan?.name || "Starter Plan"}</h3>
                    <p>{plan?.description || "Basic features for small teams"}</p>
                    <div className="plan-price">
                        <span className="amount">{money(plan?.monthlyPrice || 0, plan?.currency || "INR")}</span>
                        <span className="period">/{sub?.billingFrequency === "annual" ? "year" : "month"}</span>
                        {sub?.billingFrequency === "annual" && <span className="annual-badge">Billed annually</span>}
                    </div>
                </div>
            </div>

            <div className="subscription-meta">
                <div className="meta-item"><span className="meta-label">Billing Period</span><span className="meta-value">{periodStart} – {periodEnd}</span></div>
                <div className="meta-item"><span className="meta-label">Renewal</span><span className="meta-value">{periodEnd}</span></div>
                {sub?.cancelAtPeriodEnd && <div className="meta-item warning"><span className="meta-label">Cancels On</span><span className="meta-value">{periodEnd}</span></div>}
                {sub?.lastPaymentError && <div className="meta-item error"><span className="meta-label">Last Payment Error</span><span className="meta-value">{sub.lastPaymentError}</span></div>}
            </div>

            {canManage && (
                <div className="subscription-actions">
                    {status === "cancelled_at_period_end" && (
                        <div className="cancel-notice">
                            <Clock size={16} />
                            <span>Your subscription will be cancelled on {periodEnd}.</span>
                            <button className="btn-secondary" onClick={onReactivate}><RotateCcw size={14} />Reactivate</button>
                        </div>
                    )}
                    {status === "past_due" && (
                        <div className="cancel-notice error">
                            <AlertCircle size={16} />
                            <span>Payment failed. Please update your payment method and retry.</span>
                            <button className="btn-primary" onClick={onRetry}><RotateCcw size={14} />Retry Payment</button>
                        </div>
                    )}
                    {status === "suspended" && (
                        <div className="cancel-notice error">
                            <Shield size={16} />
                            <span>Your subscription is suspended due to payment failure.</span>
                            <button className="btn-primary" onClick={onRetry}><RotateCcw size={14} />Retry Payment</button>
                        </div>
                    )}
                    {["trial", "active"].includes(status) && (
                        <div className="action-row">
                            <button className="btn-secondary" onClick={onCancel}><X size={14} />Cancel Subscription</button>
                        </div>
                    )}
                    {cancelConfirm && (
                        <div className="confirm-dialog">
                            <p>Are you sure you want to cancel? Your access will continue until {periodEnd}.</p>
                            <div className="confirm-actions">
                                <button className="btn-secondary" onClick={() => setCancelConfirm(false)}>Keep Subscription</button>
                                <button className="btn-danger" onClick={onCancel}><Trash2 size={14} />Confirm Cancellation</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function UsageCard({ usage }: { usage: BillingOverview["usage"] | undefined }) {
    const metrics = [
        { key: "teamMembers", label: "Team Members", icon: <Users size={16} /> },
        { key: "projects", label: "Projects", icon: <FolderOpen size={16} /> },
        { key: "boqs", label: "BOQs", icon: <FileText size={16} /> },
        { key: "templates", label: "Templates", icon: <LayoutDashboard size={16} /> },
    ];

    return (
        <section className="billing-card usage-card">
            <h2>Usage</h2>
            <div className="usage-grid">
                {metrics.map(m => {
                    const u = usage?.[m.key as keyof typeof usage] as { used: number; limit: number | null } | undefined;
                    const used = u?.used || 0;
                    const limit = u?.limit;
                    const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
                    const unlimited = limit === null;
                    return (
                        <div key={m.key} className="usage-item">
                            <div className="usage-header">
                                <span className="usage-icon">{m.icon}</span>
                                <div>
                                    <span className="usage-label">{m.label}</span>
                                    <span className="usage-count">{used}{unlimited ? "" : ` / ${limit}`}</span>
                                </div>
                            </div>
                            <div className="usage-bar">
                                <div className="usage-fill" style={{ width: `${unlimited ? 100 : pct}%` }} />
                            </div>
                            {unlimited && <span className="unlimited">Unlimited</span>}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function PaymentMethodCard({ paymentMethod: pm, formData, setFormData, onSave, saving, canManage }: any) {
    const brands = ["Visa", "Mastercard", "American Express", "Discover"];

    return (
        <section className="billing-card payment-method">
            <div className="card-header">
                <h2>Payment Method</h2>
            </div>

            <form onSubmit={onSave} className="payment-form">
                {pm ? (
                    <div className="current-payment">
                        <div className="card-display">
                            <div className="card-brand">{pm.brand}</div>
                            <div className="card-number">•••• •••• •••• {pm.last4}</div>
                            <div className="card-expiry">Expires {pm.expiryMonth}/{pm.expiryYear?.slice(-2)}</div>
                        </div>
                        <p className="payment-hint">Update your payment method below</p>
                    </div>
                ) : (
                    <p className="no-payment">No payment method on file</p>
                )}

                {canManage && (
                    <div className="payment-inputs">
                        <div className="form-row">
                            <div className="form-field">
                                <label>Card Brand</label>
                                <select value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} required>
                                    <option value="">Select brand</option>
                                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Last 4 Digits</label>
                                <input type="text" value={formData.last4} onChange={e => setFormData({ ...formData, last4: e.target.value })} placeholder="1234" maxLength={4} pattern="\\d{4}" required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-field">
                                <label>Expiry Month</label>
                                <input type="text" value={formData.expiryMonth} onChange={e => setFormData({ ...formData, expiryMonth: e.target.value })} placeholder="MM" maxLength={2} pattern="\\d{2}" required />
                            </div>
                            <div className="form-field">
                                <label>Expiry Year</label>
                                <input type="text" value={formData.expiryYear} onChange={e => setFormData({ ...formData, expiryYear: e.target.value })} placeholder="YYYY" maxLength={4} pattern="\\d{4}" required />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} {pm ? "Update" : "Add"} Payment Method
                        </button>
                    </div>
                )}
            </form>
        </section>
    );
}

function BillingContactCard({ email, setEmail, onSave, saving, canManage }: any) {
    return (
        <section className="billing-card billing-contact">
            <div className="card-header">
                <h2>Billing Contact</h2>
            </div>

            <form onSubmit={onSave} className="contact-form">
                <div className="form-field">
                    <label>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="billing@company.com" required disabled={!canManage} />
                </div>
                {canManage && (
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Save
                    </button>
                )}
            </form>
        </section>
    );
}

function InvoicesCard({ invoices }: { invoices: SubscriptionInvoice[] }) {
    return (
        <section className="billing-card invoices-card">
            <div className="card-header">
                <h2>Recent Invoices</h2>
            </div>

            {invoices.length === 0 ? (
                <div className="empty-invoices">
                    <FileText size={32} />
                    <p>No invoices yet</p>
                </div>
            ) : (
                <div className="invoices-table-wrap">
                    <table className="invoices-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Date</th>
                                <th>Due</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td><span className="invoice-code">{inv.invoiceNumber}</span></td>
                                    <td>{date(inv.issuedAt)}</td>
                                    <td>{date(inv.dueAt)}</td>
                                    <td>{money(inv.amount + inv.taxAmount, inv.currency)}</td>
                                    <td><span className={`invoice-status ${inv.status}`}>{inv.status.replace("_", " ")}</span></td>
                                    <td>
                                        <button className="btn-icon" title="Download PDF"><Download size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function PlansComparisonCard({ plans, currentPlanCode, selectedPlanCode, setSelectedPlanCode, preview, previewLoading, onPreview, onChangePlan, changeLoading, sub }: { plans: SubscriptionPlan[]; currentPlanCode: string; selectedPlanCode: string | null; setSelectedPlanCode: (code: string | null) => void; preview: PlanPreview | null; previewLoading: boolean; onPreview: (code: string) => void; onChangePlan: (code: string, freq: "monthly" | "annual") => void; changeLoading: boolean; sub: any }) {
    const currentIdx = planOrder.indexOf(currentPlanCode);
    const isUpgrade = (code: string) => planOrder.indexOf(code) > currentIdx;

    return (
        <section className="billing-card plans-comparison">
            <h2>Manage Plan</h2>
            <p className="plans-subtitle">Compare plans and choose the best fit for your team</p>

            <div className="plans-list">
                {plans.map(p => {
                    const selected = selectedPlanCode === p.code;
                    const isCurrent = p.code === currentPlanCode;
                    const showPreview = selected && preview && preview.newPlan.code === p.code;

                    return (
                        <div key={p.code} className={`plan-card ${isCurrent ? "current" : ""} ${selected ? "selected" : ""}`}>
                            <div className="plan-card-header">
                                <div className="plan-icon-sm" style={{ background: p.code === "enterprise" ? "linear-gradient(135deg, #7c3aed, #a855f7)" : p.code === "business" ? "linear-gradient(135deg, #2563eb, #3b82f6)" : p.code === "professional" ? "linear-gradient(135deg, #0891b2, #06b6d4)" : "linear-gradient(135deg, #16a34a, #22c55e)" }}>
                                    {planIcons[p.code]}
                                </div>
                                <div className="plan-info-sm">
                                    <h4>{p.name}</h4>
                                    {isCurrent && <span className="current-badge">Current Plan</span>}
                                </div>
                                {selected && <ChevronDown size={20} />}
                            </div>

                            <div className="plan-price-row">
                                <span className="price">{money(p.monthlyPrice, p.currency)}</span>
                                <span className="period">/month</span>
                                <button
                                    className={`plan-toggle ${selected ? "active" : ""}`}
                                    onClick={() => onPreview(p.code)}
                                    disabled={previewLoading}
                                >
                                    <span>{selected ? "Hide" : "Show"} details</span>
                                </button>
                            </div>

                            <ul className="plan-features">
                                {(() => {
                                    let feats = p.features;
                                    if (typeof feats === 'string') {
                                        try { feats = JSON.parse(feats); } catch { feats = []; }
                                    }
                                    if (!Array.isArray(feats)) feats = [];
                                    return feats.slice(0, 5).map((f: string, i: number) => <li key={i}>{f}</li>);
                                })()}
                            </ul>

                            {showPreview && preview && (
                                <div className="plan-preview">
                                    <div className="preview-breakdown">
                                        <h5>Change Summary</h5>
                                        <div className="breakdown-row"><span>Plan charge</span><span>{money(preview.breakdown.planCharge, preview.newPlan.currency)}</span></div>
                                        <div className="breakdown-row"><span>Unused period credit</span><span>-{money(preview.breakdown.unusedPeriodCredit, preview.newPlan.currency)}</span></div>
                                        <div className="breakdown-row"><span>Tax (18%)</span><span>{money(preview.breakdown.tax, preview.newPlan.currency)}</span></div>
                                        <div className="breakdown-row total"><span>Due today</span><span>{money(preview.breakdown.dueToday, preview.newPlan.currency)}</span></div>
                                        <p className="preview-note">Next renewal: {date(preview.nextRenewal)}</p>
                                    </div>
                                    <div className="preview-actions">
                                        {isCurrent ? (
                                            <button className="btn-secondary" disabled>Current Plan</button>
                                        ) : (
                                            <button
                                                className={`btn-primary ${isUpgrade(p.code) ? "upgrade" : "downgrade"}`}
                                                onClick={() => onChangePlan(p.code, sub?.billingFrequency || "monthly")}
                                                disabled={changeLoading}
                                            >
                                                {changeLoading ? <Loader2 size={16} className="spin" /> : isUpgrade(p.code) ? <>Upgrade to {p.name}<ArrowUpRight size={14} /></> : <>Downgrade to {p.name}<ArrowDownRight size={14} /></>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}