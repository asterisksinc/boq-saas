"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Save, Check } from "lucide-react";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

const menuRoutes = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing"];
const menuIcons = ["dashboard-overview-active", "dashboard-projects", "dashboard-boqs", "dashboard-costs", "dashboard-workspace", "dashboard-estimates", "dashboard-purchase-orders", "dashboard-analytics", "dashboard-reports", "dashboard-integrations", "dashboard-billing"];

type Tab = "Profile" | "Password" | "Preferences";

export default function SettingsPage() {
    const [tab, setTab] = useState<Tab>("Profile");
    const tabs: Tab[] = ["Profile", "Password", "Preferences"];

    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />
            <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
                <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
                <nav className="fig-dashboard-menu">
                    {menuRoutes.map((route, index) => (
                        <button key={route} type="button" aria-label={`Navigate to ${route}`} onClick={() => window.location.assign(route)}>
                            <img src={`/assets/dashboard/${menuIcons[index]}.svg`} alt="" />
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
                    <h1>Settings</h1>
                    <div className="fig-dashboard-header-actions">
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                <section style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", margin: 0 }}>User Settings</h2>

                    <div style={{ display: "flex", gap: "8px", background: "#fff", padding: "4px", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", width: "fit-content" }}>
                        {tabs.map(t => (
                            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 24px", background: tab === t ? "#eff6ff" : "transparent", color: tab === t ? "#2563eb" : "#6b7280", fontWeight: tab === t ? 600 : 500, border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>{t}</button>
                        ))}
                    </div>

                    {tab === "Profile" && <ProfileTab />}
                    {tab === "Password" && <PasswordTab />}
                    {tab === "Preferences" && <PreferencesTab />}
                </section>
            </div>
        </main>
    );
}

function ProfileTab() {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/v1/users/me", { credentials: "include" });
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(getApiErrorMessage(payload));
                const data = parseApiResponse<{ displayName: string; email: string }>(payload);
                setDisplayName(data.displayName || "");
                setEmail(data.email || "");
            } catch (e) { setError(e instanceof Error ? e.message : "Failed to load profile"); }
            finally { setLoading(false); }
        })();
    }, []);

    const save = async () => {
        setSaving(true); setError(""); setSuccess("");
        try {
            const res = await fetch("/api/v1/users/me", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName }) });
            if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(getApiErrorMessage(p)); }
            setSuccess("Profile updated.");
        } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
        finally { setSaving(false); }
    };

    if (loading) return <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading profile...</div>;

    return (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", maxWidth: "600px" }}>
            {error && <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}
            {success && <div style={{ padding: "12px", background: "#ecfdf5", color: "#10b981", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} />{success}</div>}
            <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Email</label>
                <input value={email} disabled style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", background: "#f9fafb", color: "#6b7280", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
}

function PasswordTab() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const save = async () => {
        if (!currentPassword || !newPassword) { setError("Both fields are required."); return; }
        if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
        setSaving(true); setError(""); setSuccess("");
        try {
            const res = await fetch("/api/v1/users/me/password", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
            if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(getApiErrorMessage(p)); }
            setSuccess("Password updated successfully.");
            setCurrentPassword(""); setNewPassword("");
        } catch (e) { setError(e instanceof Error ? e.message : "Failed to update password"); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", maxWidth: "600px" }}>
            {error && <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}
            {success && <div style={{ padding: "12px", background: "#ecfdf5", color: "#10b981", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} />{success}</div>}
            <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                <Save size={16} /> {saving ? "Updating..." : "Update Password"}
            </button>
        </div>
    );
}

function PreferencesTab() {
    const [timezone, setTimezone] = useState("");
    const [locale, setLocale] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/v1/users/me/preferences", { credentials: "include" });
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(getApiErrorMessage(payload));
                const data = parseApiResponse<{ timezone: string; locale: string }>(payload);
                setTimezone(data.timezone || "Asia/Kolkata");
                setLocale(data.locale || "en-IN");
            } catch (e) { setError(e instanceof Error ? e.message : "Failed to load preferences"); }
            finally { setLoading(false); }
        })();
    }, []);

    const save = async () => {
        setSaving(true); setError(""); setSuccess("");
        try {
            const res = await fetch("/api/v1/users/me/preferences", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timezone, locale }) });
            if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(getApiErrorMessage(p)); }
            setSuccess("Preferences saved.");
        } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
        finally { setSaving(false); }
    };

    if (loading) return <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading preferences...</div>;

    return (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", maxWidth: "600px" }}>
            {error && <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}
            {success && <div style={{ padding: "12px", background: "#ecfdf5", color: "#10b981", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} />{success}</div>}
            <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                </select>
            </div>
            <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Locale</label>
                <select value={locale} onChange={e => setLocale(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}>
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                </select>
            </div>
            <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                <Save size={16} /> {saving ? "Saving..." : "Save Preferences"}
            </button>
        </div>
    );
}
