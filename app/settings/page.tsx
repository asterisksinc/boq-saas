"use client";

import {
    ChevronRight,
    ChevronLeft,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    Shield,
    Bell,
    Globe,
    Palette,
    Database,
    Zap,
    Settings,
    User,
    Lock,
    Cpu,
    FolderOpen,
    FileText,
    LayoutDashboard,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getSettingsOverview,
    getSettingsSection,
    updateSettingsSection,
    SettingsOverview,
    SettingsSection,
    SettingsSectionInput,
} from "@/lib/api/auth";
import DashboardRail from "@/components/DashboardRail";

const settingsSections = [
    { key: "branding", label: "Branding", icon: <Palette size={18} />, description: "Logo, colors, and visual identity" },
    { key: "boq-costing", label: "BOQ & Costing", icon: <Database size={18} />, description: "Defaults for estimates and costing" },
    { key: "integrations", label: "Integrations", icon: <Zap size={18} />, description: "Third-party connections" },
    { key: "notifications", label: "Notifications", icon: <Bell size={18} />, description: "Email and in-app preferences" },
    { key: "security", label: "Security", icon: <Shield size={18} />, description: "Authentication and access control" },
    { key: "advanced", label: "Advanced", icon: <Cpu size={18} />, description: "System configuration" },
];

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
    const [activeSection, setActiveSection] = useState<string | null>("overview");
    const [sectionData, setSectionData] = useState<SectionData>({});
    const [sectionLoading, setSectionLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSettingsOverview();
            setOverview(data);
        } catch (e: any) {
            setNotice({ message: e.message || "Could not load settings", type: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOverview(); }, [loadOverview]);

    const loadSection = async (sectionKey: string) => {
        if (sectionKey === "overview") { setActiveSection("overview"); return; }
        setSectionLoading(true);
        setActiveSection(sectionKey);
        try {
            const data = await getSettingsSection(sectionKey);
            setSectionData(data.data || defaultSectionData[sectionKey] || {});
        } catch {
            setSectionData(defaultSectionData[sectionKey] || {});
        } finally {
            setSectionLoading(false);
        }
    };

    const handleInputChange = (key: string, value: unknown) => {
        setSectionData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!activeSection || activeSection === "overview") return;
        setSaving(true);
        try {
            await updateSettingsSection(activeSection, { data: sectionData });
            setNotice({ message: `${settingsSections.find(s => s.key === activeSection)?.label} settings saved`, type: "success" });
            loadOverview();
        } catch (e: any) {
            setNotice({ message: e.message || "Could not save settings", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 4000);
    };

    const renderSectionContent = () => {
        if (!activeSection || activeSection === "overview") return <OverviewContent overview={overview} onNavigate={loadSection} />;
        if (sectionLoading) return <SectionSkeleton />;

        switch (activeSection) {
            case "branding": return <BrandingForm data={sectionData} onChange={handleInputChange} onSave={handleSave} saving={saving} />;
            case "boq-costing": return <BoqCostingForm data={sectionData} onChange={handleInputChange} onSave={handleSave} saving={saving} />;
            case "integrations": return <IntegrationsForm data={sectionData} onChange={handleInputChange} onSave={handleSave} saving={saving} />;
            case "notifications": return <NotificationsForm data={sectionData} onChange={handleInputChange} onSave={handleSave} saving={saving} />;
            case "security": return <SecurityForm data={sectionData} onChange={handleInputChange} onSave={handleSave} saving={saving} />;
            case "advanced": return <AdvancedForm data={sectionData} onChange={handleInputChange} onSave={handleSave} saving={saving} />;
            default: return <OverviewContent overview={overview} onNavigate={loadSection} />;
        }
    };

    return (
        <main className="fig-dashboard boq-dashboard settings-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Settings</h1>
                    <div className="fig-dashboard-header-actions">
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
                        <div className="fig-dashboard-avatar">ST</div>
                    </div>
                </header>

                <section className="settings-content">
                    {notice && <div className={`notice-banner ${notice.type}`}><span>{notice.message}</span></div>}

                    <div className="settings-layout">
                        <aside className="settings-sidebar">
                            <nav className="settings-nav">
                                <button
                                    className={activeSection === "overview" || !activeSection ? "active" : ""}
                                    onClick={() => loadSection("overview")}
                                >
                                    <Settings size={18} />
                                    <span>Overview</span>
                                </button>
                                {settingsSections.map(section => (
                                    <button
                                        key={section.key}
                                        className={activeSection === section.key ? "active" : ""}
                                        onClick={() => loadSection(section.key)}
                                    >
                                        {section.icon}
                                        <span>{section.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </aside>

                        <div className="settings-main">
                            {renderSectionContent()}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function OverviewContent({ overview, onNavigate }: { overview: SettingsOverview | null; onNavigate: (section: string) => void }) {
    if (!overview) return <SectionSkeleton />;

    const cards = [
        { key: "branding", label: "Branding", desc: "Logo, colors, and visual identity", icon: <Palette size={20} /> },
        { key: "boq-costing", label: "BOQ & Costing", desc: "Defaults for estimates and costing", icon: <Database size={20} /> },
        { key: "integrations", label: "Integrations", desc: "Third-party connections", icon: <Zap size={20} /> },
        { key: "notifications", label: "Notifications", desc: "Email and in-app preferences", icon: <Bell size={20} /> },
        { key: "security", label: "Security", desc: "Authentication and access control", icon: <Shield size={20} /> },
        { key: "advanced", label: "Advanced", desc: "System configuration", icon: <Cpu size={20} /> },
    ];

    return (
        <div className="settings-overview">
            <div className="overview-header">
                <div className="profile-card">
                    <div className="profile-avatar">
                        {overview.profile?.displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="profile-info">
                        <h2>{overview.profile?.displayName || "User"}</h2>
                        <p>{overview.role}</p>
                    </div>
                    <div className="completion-badge">
                        <span className="completion-ring" style={{ background: `conic-gradient(#2563eb ${overview.completionPercent}%, #e2e8f0 ${overview.completionPercent}%)` }}>
                            <span>{overview.completionPercent}%</span>
                        </span>
                        <span className="completion-label">Profile Complete</span>
                    </div>
                </div>
            </div>

            <div className="usage-cards">
                <UsageCard label="Projects" value={overview.usage.projects} limit={overview.settings?.["boq-costing"] && typeof overview.settings["boq-costing"] === "object" && "maxProjects" in overview.settings["boq-costing"] ? (overview.settings["boq-costing"] as any).maxProjects : null} icon={<FolderOpen size={20} />} />
                <UsageCard label="BOQs" value={overview.usage.boqs} icon={<FileText size={20} />} />
                <UsageCard label="Templates" value={overview.usage.templates} icon={<LayoutDashboard size={20} />} />
                <UsageCard label="Storage" value={overview.usage.storageBytes ? `${(overview.usage.storageBytes / 1024 / 1024).toFixed(1)} MB` : "—"} icon={<Database size={20} />} />
            </div>

            <div className="section-cards">
                {cards.map(card => (
                    <button key={card.key} className="section-card" onClick={() => onNavigate(card.key)}>
                        <div className="section-card-icon">{card.icon}</div>
                        <div className="section-card-content">
                            <h3>{card.label}</h3>
                            <p>{card.desc}</p>
                        </div>
                        <ChevronRight size={20} />
                    </button>
                ))}
            </div>

            <div className="recent-changes">
                <h3>Recent Changes</h3>
                {overview.recentChanges.length === 0 ? (
                    <p className="no-changes">No recent changes</p>
                ) : (
                    <ul className="changes-list">
                        {overview.recentChanges.slice(0, 5).map(change => (
                            <li key={change.id}>
                                <span className="change-action">{change.action}</span>
                                <span className="change-time">{new Date(change.createdAt).toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function UsageCard({ label, value, limit, icon }: { label: string; value: number | string; limit?: number | null; icon: React.ReactNode }) {
    return (
        <div className="usage-card">
            <div className="usage-icon">{icon}</div>
            <div className="usage-info">
                <span className="usage-label">{label}</span>
                <span className="usage-value">{typeof value === "number" ? value.toLocaleString() : value}</span>
            </div>
        </div>
    );
}

function SectionSkeleton() {
    return (
        <div className="settings-main-skeleton">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /></div>)}
        </div>
    );
}

function BaseForm({ title, description, children, onSave, saving }: { title: string; description: string; children: React.ReactNode; onSave: (e: FormEvent) => void; saving: boolean }) {
    return (
        <form onSubmit={onSave} className="settings-form">
            <div className="form-header">
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            <div className="form-body">{children}</div>
            <div className="form-footer">
                <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save Changes
                </button>
            </div>
        </form>
    );
}

function BrandingForm({ data, onChange, onSave, saving }: { data: SectionData; onChange: (key: string, value: unknown) => void; onSave: (e: FormEvent) => void; saving: boolean }) {
    return (
        <BaseForm title="Branding" description="Customize your workspace's visual identity" onSave={onSave} saving={saving}>
            <div className="form-grid">
                <Field label="Company Name" type="text" value={data.companyName as string} onChange={v => onChange("companyName", v)} placeholder="Acme Inc." />
                <Field label="Logo URL" type="text" value={data.logoUrl as string} onChange={v => onChange("logoUrl", v)} placeholder="https://example.com/logo.svg" />
                <Field label="Primary Color" type="color" value={data.primaryColor as string} onChange={v => onChange("primaryColor", v)} />
                <Field label="Secondary Color" type="color" value={data.secondaryColor as string} onChange={v => onChange("secondaryColor", v)} />
                <Field label="Favicon URL" type="text" value={data.faviconUrl as string} onChange={v => onChange("faviconUrl", v)} placeholder="https://example.com/favicon.ico" fullWidth />
            </div>
            <div className="color-preview">
                <div className="preview-item"><span style={{ background: data.primaryColor as string }} /><span>Primary</span></div>
                <div className="preview-item"><span style={{ background: data.secondaryColor as string }} /><span>Secondary</span></div>
            </div>
        </BaseForm>
    );
}

function BoqCostingForm({ data, onChange, onSave, saving }: { data: SectionData; onChange: (key: string, value: unknown) => void; onSave: (e: FormEvent) => void; saving: boolean }) {
    return (
        <BaseForm title="BOQ & Costing" description="Configure defaults for estimates, BOQs, and costing" onSave={onSave} saving={saving}>
            <div className="form-grid">
                <Field label="Default Tax %" type="number" value={data.defaultTaxPercent as number} onChange={v => onChange("defaultTaxPercent", Number(v))} min={0} max={100} step={0.5} />
                <Field label="Default Markup %" type="number" value={data.defaultMarkupPercent as number} onChange={v => onChange("defaultMarkupPercent", Number(v))} min={0} max={1000} step={0.5} />
                <Field label="Default Waste %" type="number" value={data.defaultWastePercent as number} onChange={v => onChange("defaultWastePercent", Number(v))} min={0} max={100} step={0.5} />
                <Field label="Currency" type="select" value={data.currency as string} onChange={v => onChange("currency", v)} options={["INR", "USD", "EUR", "GBP", "AED", "SGD"]} />
                <Field label="Number Format" type="select" value={data.numberFormat as string} onChange={v => onChange("numberFormat", v)} options={["indian", "international"]} fullWidth />
            </div>
        </BaseForm>
    );
}

function IntegrationsForm({ data, onChange, onSave, saving }: { data: SectionData; onChange: (key: string, value: unknown) => void; onSave: (e: FormEvent) => void; saving: boolean }) {
    const integrations = ["accounting", "crm", "storage", "communication"];
    return (
        <BaseForm title="Integrations" description="Manage third-party integrations" onSave={onSave} saving={saving}>
            <div className="integrations-list">
                {integrations.map(key => (
                    <div key={key} className="integration-card">
                        <div className="integration-info">
                            <h4>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                            <p>Connect your {key} provider</p>
                        </div>
                        <button type="button" className="btn-secondary" onClick={() => onChange(key, { connected: true, provider: "example" })}>Configure</button>
                    </div>
                ))}
            </div>
        </BaseForm>
    );
}

function NotificationsForm({ data, onChange, onSave, saving }: { data: SectionData; onChange: (key: string, value: unknown) => void; onSave: (e: FormEvent) => void; saving: boolean }) {
    const toggles = [
        { key: "email", label: "Email notifications", desc: "Receive email updates" },
        { key: "tasks", label: "Task notifications", desc: "Get notified about task updates" },
        { key: "approvals", label: "Approval notifications", desc: "Get notified about approval requests" },
        { key: "billing", label: "Billing notifications", desc: "Receive billing and invoice updates" },
        { key: "weeklyDigest", label: "Weekly digest", desc: "Receive weekly summary email" },
    ];

    return (
        <BaseForm title="Notifications" description="Configure how you receive notifications" onSave={onSave} saving={saving}>
            <div className="toggles-list">
                {toggles.map(t => (
                    <label key={t.key} className="toggle-item">
                        <div className="toggle-info">
                            <span className="toggle-label">{t.label}</span>
                            <span className="toggle-desc">{t.desc}</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={(data[t.key] as boolean) ?? false}
                            onChange={e => onChange(t.key, e.target.checked)}
                            className="toggle-input"
                        />
                    </label>
                ))}
            </div>
        </BaseForm>
    );
}

function SecurityForm({ data, onChange, onSave, saving }: { data: SectionData; onChange: (key: string, value: unknown) => void; onSave: (e: FormEvent) => void; saving: boolean }) {
    return (
        <BaseForm title="Security" description="Configure authentication and access control" onSave={onSave} saving={saving}>
            <div className="form-grid">
                <Field label="Two-Factor Authentication" type="checkbox" checked={(data.twoFactorRequired as boolean) ?? false} onChange={v => onChange("twoFactorRequired", v)} fullWidth />
                <Field label="Session Timeout (minutes)" type="number" value={data.sessionTimeout as number} onChange={v => onChange("sessionTimeout", Number(v))} min={15} max={1440} />
                <Field label="Minimum Password Length" type="number" value={data.passwordMinLength as number} onChange={v => onChange("passwordMinLength", Number(v))} min={8} max={64} />
                <Field label="Allowed IP Ranges" type="textarea" value={((data.allowedIpRanges as string[]) || []).join("\n")} onChange={v => onChange("allowedIpRanges", (v as string).split("\n").filter(Boolean))} fullWidth placeholder="192.168.1.0/24&#10;10.0.0.0/8" />
            </div>
        </BaseForm>
    );
}

function AdvancedForm({ data, onChange, onSave, saving }: { data: SectionData; onChange: (key: string, value: unknown) => void; onSave: (e: FormEvent) => void; saving: boolean }) {
    return (
        <BaseForm title="Advanced" description="System configuration options" onSave={onSave} saving={saving}>
            <div className="form-grid">
                <Field label="API Access" type="checkbox" checked={(data.apiEnabled as boolean) ?? false} onChange={v => onChange("apiEnabled", v)} fullWidth />
                <Field label="Webhook URLs" type="textarea" value={((data.webhookUrls as string[]) || []).join("\n")} onChange={v => onChange("webhookUrls", (v as string).split("\n").filter(Boolean))} fullWidth placeholder="https://example.com/webhook" />
                <Field label="Custom Domain" type="text" value={data.customDomain as string} onChange={v => onChange("customDomain", v)} placeholder="app.example.com" fullWidth />
                <Field label="Data Retention (days)" type="number" value={data.dataRetentionDays as number} onChange={v => onChange("dataRetentionDays", Number(v))} min={30} max={3650} fullWidth />
            </div>
        </BaseForm>
    );
}

function Field({ label, type = "text", value, onChange, placeholder, options, min, max, step, fullWidth, checked }: { label: string; type?: string; value?: string | number | boolean; onChange: (value: string | number | boolean) => void; placeholder?: string; options?: string[]; min?: number; max?: number; step?: number; fullWidth?: boolean; checked?: boolean }) {
    const inputValue = value as string | number | undefined;
    return (
        <div className={`form-field ${fullWidth ? "full-width" : ""}`}>
            <label>{label}</label>
            {type === "checkbox" ? (
                <label className="checkbox-label">
                    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
                    <span>Enabled</span>
                </label>
            ) : type === "select" ? (
                <select value={inputValue} onChange={e => onChange(e.target.value)} className="form-input">
                    {options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : type === "textarea" ? (
                <textarea value={inputValue} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="form-textarea" rows={3} />
            ) : type === "color" ? (
                <input type="color" value={inputValue} onChange={e => onChange(e.target.value)} className="color-input" />
            ) : (
                <input type={type} value={inputValue} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} max={max} step={step} className="form-input" />
            )}
        </div>
    );
}