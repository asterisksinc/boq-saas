"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Save,
    Loader2,
    Palette,
    Database,
    Zap,
    Bell,
    Shield,
    Cpu,
    User,
    Building2,
} from "lucide-react";

import {
    getSettingsOverview,
    getSettingsSection,
    updateSettingsSection,
    updateUserProfile,
    SettingsOverview,
} from "@/lib/api/auth";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import SettingsNavigation from "@/components/settings/SettingsNavigation";
import SettingsOverviewComponent from "@/components/settings/SettingsOverview";
import MyProfile from "@/components/settings/MyProfile";
import SettingsSkeleton from "@/components/settings/SettingsSkeleton";
import OrganizationSettings from "@/components/settings/OrganizationSettings";
import { SettingsErrorState, SettingsEmptyTab } from "@/components/settings/SettingsEmptyState";
import { adaptOverview } from "@/lib/settings/adapter";
import { SettingsTab } from "@/lib/settings/types";

const defaultSectionData: Record<string, Record<string, unknown>> = {
    branding: {
        companyName: "",
        logoUrl: null,
        primaryColor: "#2563eb",
        secondaryColor: "#64748b",
        faviconUrl: null,
    },
    "boq-costing": {
        defaultTaxPercent: 18,
        defaultMarkupPercent: 0,
        defaultWastePercent: 5,
        currency: "INR",
        numberFormat: "indian",
    },
    integrations: {
        accounting: null,
        crm: null,
        storage: null,
        communication: null,
    },
    notifications: {
        email: true,
        tasks: true,
        approvals: true,
        billing: true,
        weeklyDigest: true,
    },
    security: {
        twoFactorRequired: false,
        sessionTimeout: 480,
        passwordMinLength: 10,
        allowedIpRanges: [],
    },
    advanced: {
        apiEnabled: false,
        webhookUrls: [],
        customDomain: null,
        dataRetentionDays: 2555,
    },
};

type SectionData = Record<string, unknown>;

export default function SettingsPage() {
    const router = useRouter();
    const [overview, setOverview] = useState<SettingsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<SettingsTab>("overview");
    const [sectionData, setSectionData] = useState<SectionData>({});
    const [sectionLoading, setSectionLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSettingsOverview();
            setOverview(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Could not load settings.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 4000);
    };

    const handleSelectTab = async (tab: SettingsTab) => {
        setActiveTab(tab);
        if (tab === "overview" || tab === "additional" || tab === "profile" || tab === "organization") {
            return;
        }

        setSectionLoading(true);
        try {
            const data = await getSettingsSection(tab);
            setSectionData(data.data || defaultSectionData[tab] || {});
        } catch {
            setSectionData(defaultSectionData[tab] || {});
        } finally {
            setSectionLoading(false);
        }
    };

    const handleInputChange = (key: string, value: unknown) => {
        setSectionData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSaveSection = async (e: FormEvent) => {
        e.preventDefault();
        if (activeTab === "overview" || activeTab === "additional" || activeTab === "profile" || activeTab === "organization") {
            return;
        }

        setSaving(true);
        try {
            await updateSettingsSection(activeTab, { data: sectionData });
            showNotice("Settings saved successfully.", "success");
            loadOverview();
        } catch (e: unknown) {
            showNotice(e instanceof Error ? e.message : "Could not save settings", "error");
        } finally {
            setSaving(false);
        }
    };

    const viewModel = useMemo(() => {
        return overview ? adaptOverview(overview) : null;
    }, [overview]);

    const renderTabContent = () => {
        if (activeTab === "overview") {
            if (loading) {
                return <SettingsSkeleton />;
            }
            if (error) {
                return <SettingsErrorState message={error} onRetry={loadOverview} />;
            }
            if (!viewModel) {
                return <SettingsErrorState message="Settings data unavailable." onRetry={loadOverview} />;
            }
            return (
                <SettingsOverviewComponent
                    viewModel={viewModel}
                    onSelectTab={handleSelectTab}
                    onProfileUpdated={loadOverview}
                />
            );
        }

        if (activeTab === "profile") {
            return (
                <MyProfile
                    overview={overview}
                    onProfileUpdated={() => {
                        showNotice("Profile updated successfully.", "success");
                        loadOverview();
                    }}
                />
            );
        }

        if (activeTab === "organization") {
            return (
                <OrganizationSettings
                    overview={overview}
                    loading={loading}
                    error={error}
                    onRefresh={loadOverview}
                    showNotice={showNotice}
                />
            );
        }

        if (activeTab === "additional") {
            return (
                <SettingsEmptyTab
                    title="Additional Settings"
                    description="No additional configuration modules or third-party add-ons are enabled for this workspace."
                    actionLabel="Return to Overview"
                    onAction={() => setActiveTab("overview")}
                />
            );
        }

        if (sectionLoading) {
            return (
                <div className="settings-section-card">
                    <div className="skeleton skeleton-title" style={{ width: "200px", height: "24px", marginBottom: "12px" }} />
                    <div className="skeleton skeleton-subtitle" style={{ width: "320px", height: "14px", marginBottom: "24px" }} />
                    <div className="form-grid">
                        <div className="skeleton" style={{ height: "44px", borderRadius: "8px" }} />
                        <div className="skeleton" style={{ height: "44px", borderRadius: "8px" }} />
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case "branding":
                return (
                    <BrandingForm
                        data={sectionData}
                        onChange={handleInputChange}
                        onSave={handleSaveSection}
                        saving={saving}
                    />
                );
            case "boq-costing":
                return (
                    <BoqCostingForm
                        data={sectionData}
                        onChange={handleInputChange}
                        onSave={handleSaveSection}
                        saving={saving}
                    />
                );
            case "integrations":
                return (
                    <IntegrationsForm
                        data={sectionData}
                        onChange={handleInputChange}
                        onSave={handleSaveSection}
                        saving={saving}
                    />
                );
            case "notifications":
                return (
                    <NotificationsForm
                        data={sectionData}
                        onChange={handleInputChange}
                        onSave={handleSaveSection}
                        saving={saving}
                    />
                );
            case "security":
                return (
                    <SecurityForm
                        data={sectionData}
                        onChange={handleInputChange}
                        onSave={handleSaveSection}
                        saving={saving}
                    />
                );
            case "advanced":
                return (
                    <AdvancedForm
                        data={sectionData}
                        onChange={handleInputChange}
                        onSave={handleSaveSection}
                        saving={saving}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <main className="fig-dashboard boq-dashboard settings-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/settings" />

            <div className="fig-dashboard-main">
                {/* ── Global Dashboard Header (Issue 2: Single Parent Shell) ── */}
                <DashboardHeader
                    title="Settings"
                    onNew={() => router.push("/projects")}
                    avatarUrl={overview?.profile?.avatarUrl}
                    userInitials={overview?.profile?.displayName ? (overview.profile.displayName.trim().split(/\s+/).length > 1 ? (overview.profile.displayName.trim().split(/\s+/)[0][0] + overview.profile.displayName.trim().split(/\s+/)[1][0]).toUpperCase() : overview.profile.displayName.trim().slice(0, 2).toUpperCase()) : "CH"}
                />

                <div className="settings-page-container">
                    {notice && (
                        <div className={`notice-banner ${notice.type}`} role="status">
                            <span>{notice.message}</span>
                        </div>
                    )}

                    {/* ── Target Horizontal Navigation (SCREENSHOT 2) ── */}
                    <SettingsNavigation
                        activeTab={activeTab}
                        onSelectTab={handleSelectTab}
                    />

                    {/* ── Active Tab View ── */}
                    <div className="settings-body-wrap">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </main>
    );
}

// ─── Sub-Tab Forms ─────────────────────────────────────────────────────────────

function ProfileTabContent({
    overview,
    onSaved,
}: {
    overview: SettingsOverview | null;
    onSaved: () => void;
}) {
    const [name, setName] = useState(overview?.profile?.displayName || "");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setErr("Display name cannot be empty.");
            return;
        }
        setSaving(true);
        setErr(null);
        try {
            await updateUserProfile({ displayName: trimmed });
            onSaved();
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-section-card">
            <div className="form-header">
                <h2>My Profile</h2>
                <p>Personal account information and preferences</p>
            </div>

            {err && (
                <div className="settings-modal-error" style={{ marginBottom: "16px" }}>
                    <span>{err}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="settings-form-body">
                <div className="form-grid">
                    <Field
                        label="Display Name"
                        type="text"
                        value={name}
                        onChange={(v) => setName(String(v))}
                        placeholder="e.g. Riya Sharma"
                        required
                    />
                    <Field
                        label="Email Address"
                        type="text"
                        value={overview?.profile?.email || "—"}
                        onChange={() => {}}
                        disabled
                    />
                    <Field
                        label="Workspace Role"
                        type="text"
                        value={overview?.role ? overview.role.toUpperCase() : "OWNER"}
                        onChange={() => {}}
                        disabled
                    />
                    <Field
                        label="Workspace"
                        type="text"
                        value={overview?.workspace?.name || overview?.profile?.workspaceName || "Default Workspace"}
                        onChange={() => {}}
                        disabled
                    />
                </div>

                <div className="form-footer">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </form>
        </div>
    );
}


function BaseForm({
    title,
    description,
    children,
    onSave,
    saving,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
    onSave: (e: FormEvent) => void;
    saving: boolean;
}) {
    return (
        <form onSubmit={onSave} className="settings-section-card">
            <div className="form-header">
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            <div className="form-body">{children}</div>
            <div className="form-footer">
                <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    <span>Save Changes</span>
                </button>
            </div>
        </form>
    );
}

function BrandingForm({
    data,
    onChange,
    onSave,
    saving,
}: {
    data: SectionData;
    onChange: (key: string, value: unknown) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
}) {
    return (
        <BaseForm
            title="Branding"
            description="Customize your workspace's visual identity and brand assets"
            onSave={onSave}
            saving={saving}
        >
            <div className="form-grid">
                <Field
                    label="Company Name"
                    type="text"
                    value={(data.companyName as string) ?? ""}
                    onChange={(v) => onChange("companyName", v)}
                    placeholder="Acme Inc."
                />
                <Field
                    label="Logo URL"
                    type="text"
                    value={(data.logoUrl as string) ?? ""}
                    onChange={(v) => onChange("logoUrl", v)}
                    placeholder="https://example.com/logo.svg"
                />
                <Field
                    label="Primary Color"
                    type="color"
                    value={(data.primaryColor as string) || "#2563eb"}
                    onChange={(v) => onChange("primaryColor", v)}
                />
                <Field
                    label="Secondary Color"
                    type="color"
                    value={(data.secondaryColor as string) || "#64748b"}
                    onChange={(v) => onChange("secondaryColor", v)}
                />
                <Field
                    label="Favicon URL"
                    type="text"
                    value={(data.faviconUrl as string) ?? ""}
                    onChange={(v) => onChange("faviconUrl", v)}
                    placeholder="https://example.com/favicon.ico"
                    fullWidth
                />
            </div>
            <div className="color-preview">
                <div className="preview-item">
                    <span style={{ background: (data.primaryColor as string) || "#2563eb" }} />
                    <span>Primary Accent</span>
                </div>
                <div className="preview-item">
                    <span style={{ background: (data.secondaryColor as string) || "#64748b" }} />
                    <span>Secondary Color</span>
                </div>
            </div>
        </BaseForm>
    );
}

function BoqCostingForm({
    data,
    onChange,
    onSave,
    saving,
}: {
    data: SectionData;
    onChange: (key: string, value: unknown) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
}) {
    return (
        <BaseForm
            title="BOQ & Costing"
            description="Configure defaults for estimates, margins, and taxation"
            onSave={onSave}
            saving={saving}
        >
            <div className="form-grid">
                <Field
                    label="Default Tax %"
                    type="number"
                    value={(data.defaultTaxPercent as number) ?? 18}
                    onChange={(v) => onChange("defaultTaxPercent", Number(v))}
                    min={0}
                    max={100}
                    step={0.5}
                />
                <Field
                    label="Default Markup %"
                    type="number"
                    value={(data.defaultMarkupPercent as number) ?? 0}
                    onChange={(v) => onChange("defaultMarkupPercent", Number(v))}
                    min={0}
                    max={1000}
                    step={0.5}
                />
                <Field
                    label="Default Waste %"
                    type="number"
                    value={(data.defaultWastePercent as number) ?? 5}
                    onChange={(v) => onChange("defaultWastePercent", Number(v))}
                    min={0}
                    max={100}
                    step={0.5}
                />
                <Field
                    label="Currency"
                    type="select"
                    value={(data.currency as string) || "INR"}
                    onChange={(v) => onChange("currency", v)}
                    options={["INR", "USD", "EUR", "GBP", "AED", "SGD"]}
                />
                <Field
                    label="Number Format"
                    type="select"
                    value={(data.numberFormat as string) || "indian"}
                    onChange={(v) => onChange("numberFormat", v)}
                    options={["indian", "international"]}
                    fullWidth
                />
            </div>
        </BaseForm>
    );
}

function IntegrationsForm({
    data,
    onChange,
    onSave,
    saving,
}: {
    data: SectionData;
    onChange: (key: string, value: unknown) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
}) {
    return (
        <div className="settings-section-card">
            <div className="form-header">
                <h2>Integrations</h2>
                <p>Manage third-party tools and API connections</p>
            </div>
            <div className="form-body" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ marginBottom: '20px', color: '#6b7280' }}>The Integrations module has been moved to a dedicated page with enhanced features and analytics.</p>
                <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => window.location.href = '/integrations'}
                    style={{ margin: '0 auto' }}
                >
                    Go to Integrations
                </button>
            </div>
        </div>
    );
}

function NotificationsForm({
    data,
    onChange,
    onSave,
    saving,
}: {
    data: SectionData;
    onChange: (key: string, value: unknown) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
}) {
    const toggles = [
        { key: "email", label: "Email notifications", desc: "Receive email updates on project changes" },
        { key: "tasks", label: "Task notifications", desc: "Get notified about task assignments and due dates" },
        { key: "approvals", label: "Approval notifications", desc: "Get notified about pending and completed approvals" },
        { key: "billing", label: "Billing notifications", desc: "Receive billing receipts and invoice updates" },
        { key: "weeklyDigest", label: "Weekly digest", desc: "Receive weekly summary digest email" },
    ];

    return (
        <BaseForm
            title="Notifications"
            description="Configure email and in-app alert preferences"
            onSave={onSave}
            saving={saving}
        >
            <div className="toggles-list">
                {toggles.map((t) => (
                    <label key={t.key} className="toggle-item">
                        <div className="toggle-info">
                            <span className="toggle-label">{t.label}</span>
                            <span className="toggle-desc">{t.desc}</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={(data[t.key] as boolean) ?? false}
                            onChange={(e) => onChange(t.key, e.target.checked)}
                            className="toggle-input"
                        />
                    </label>
                ))}
            </div>
        </BaseForm>
    );
}

function SecurityForm({
    data,
    onChange,
    onSave,
    saving,
}: {
    data: SectionData;
    onChange: (key: string, value: unknown) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
}) {
    return (
        <BaseForm
            title="Security & Access"
            description="Configure authentication rules and access policies"
            onSave={onSave}
            saving={saving}
        >
            <div className="form-grid">
                <Field
                    label="Two-Factor Authentication (2FA)"
                    type="checkbox"
                    checked={(data.twoFactorRequired as boolean) ?? false}
                    onChange={(v) => onChange("twoFactorRequired", v)}
                    fullWidth
                />
                <Field
                    label="Session Timeout (minutes)"
                    type="number"
                    value={(data.sessionTimeout as number) ?? 480}
                    onChange={(v) => onChange("sessionTimeout", Number(v))}
                    min={15}
                    max={1440}
                />
                <Field
                    label="Minimum Password Length"
                    type="number"
                    value={(data.passwordMinLength as number) ?? 10}
                    onChange={(v) => onChange("passwordMinLength", Number(v))}
                    min={8}
                    max={64}
                />
                <Field
                    label="Allowed IP Ranges"
                    type="textarea"
                    value={((data.allowedIpRanges as string[]) || []).join("\n")}
                    onChange={(v) =>
                        onChange(
                            "allowedIpRanges",
                            (v as string).split("\n").filter(Boolean)
                        )
                    }
                    fullWidth
                    placeholder={"192.168.1.0/24\n10.0.0.0/8"}
                />
            </div>
        </BaseForm>
    );
}

function AdvancedForm({
    data,
    onChange,
    onSave,
    saving,
}: {
    data: SectionData;
    onChange: (key: string, value: unknown) => void;
    onSave: (e: FormEvent) => void;
    saving: boolean;
}) {
    return (
        <BaseForm
            title="Advanced"
            description="System configuration, webhooks, and data retention policies"
            onSave={onSave}
            saving={saving}
        >
            <div className="form-grid">
                <Field
                    label="API Access"
                    type="checkbox"
                    checked={(data.apiEnabled as boolean) ?? false}
                    onChange={(v) => onChange("apiEnabled", v)}
                    fullWidth
                />
                <Field
                    label="Webhook URLs"
                    type="textarea"
                    value={((data.webhookUrls as string[]) || []).join("\n")}
                    onChange={(v) =>
                        onChange(
                            "webhookUrls",
                            (v as string).split("\n").filter(Boolean)
                        )
                    }
                    fullWidth
                    placeholder="https://example.com/webhook"
                />
                <Field
                    label="Custom Domain"
                    type="text"
                    value={(data.customDomain as string) ?? ""}
                    onChange={(v) => onChange("customDomain", v)}
                    placeholder="app.example.com"
                    fullWidth
                />
                <Field
                    label="Data Retention (days)"
                    type="number"
                    value={(data.dataRetentionDays as number) ?? 2555}
                    onChange={(v) => onChange("dataRetentionDays", Number(v))}
                    min={30}
                    max={3650}
                    fullWidth
                />
            </div>
        </BaseForm>
    );
}

function Field({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    options,
    min,
    max,
    step,
    fullWidth,
    checked,
    disabled,
    required,
}: {
    label: string;
    type?: string;
    value?: string | number | boolean;
    onChange: (value: string | number | boolean) => void;
    placeholder?: string;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    fullWidth?: boolean;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
}) {
    const inputValue = value as string | number | undefined;
    return (
        <div className={`form-field ${fullWidth ? "full-width" : ""}`}>
            <label>
                {label}
                {required && <span className="required"> *</span>}
            </label>
            {type === "checkbox" ? (
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={disabled}
                    />
                    <span>Enabled</span>
                </label>
            ) : type === "select" ? (
                <select
                    value={inputValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="form-input"
                    disabled={disabled}
                >
                    {options?.map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
            ) : type === "textarea" ? (
                <textarea
                    value={inputValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="form-textarea"
                    rows={3}
                    disabled={disabled}
                />
            ) : type === "color" ? (
                <input
                    type="color"
                    value={inputValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="color-input"
                    disabled={disabled}
                />
            ) : (
                <input
                    type={type}
                    value={inputValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    step={step}
                    className="form-input"
                    disabled={disabled}
                />
            )}
        </div>
    );
}