"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
    getUserPreferences,
    updateUserPreferences,
    SettingsOverview,
    UserPreferences,
} from "@/lib/api/auth";
import PreferenceSegmentedControl, {
    SegmentedOption,
} from "./PreferenceSegmentedControl";

interface PreferencesSettingsProps {
    overview?: SettingsOverview | null;
    onPreferencesUpdated?: () => void;
}

type ThemeType = "light" | "dark" | "system";
type DensityType = "comfortable" | "compact";
type ProjectViewType = "table" | "card";

const THEME_OPTIONS: SegmentedOption<ThemeType>[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
];

const DENSITY_OPTIONS: SegmentedOption<DensityType>[] = [
    { value: "comfortable", label: "Comfortable" },
    { value: "compact", label: "Compact" },
];

const PROJECT_VIEW_OPTIONS: SegmentedOption<ProjectViewType>[] = [
    { value: "table", label: "Table" },
    { value: "card", label: "Card" },
];

const LANDING_PAGE_OPTIONS = [
    { value: "dashboard", label: "Dashboard" },
    { value: "projects", label: "Projects" },
    { value: "boqs", label: "BOQs" },
    { value: "activities", label: "Activities" },
];

const EMAIL_DIGEST_OPTIONS = [
    { value: "weekly", label: "Weekly" },
    { value: "daily", label: "Daily" },
    { value: "off", label: "Off" },
];

export default function PreferencesSettings({
    overview,
    onPreferencesUpdated,
}: PreferencesSettingsProps) {
    const [theme, setTheme] = useState<ThemeType>("light");
    const [density, setDensity] = useState<DensityType>("comfortable");
    const [landingPage, setLandingPage] = useState("dashboard");
    const [projectView, setProjectView] = useState<ProjectViewType>("table");
    const [emailDigest, setEmailDigest] = useState("weekly");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Populate initial state from overview or fetch
    useEffect(() => {
        if (overview?.preferences) {
            const p = overview.preferences;
            if (p.theme) setTheme(p.theme);
            if (p.density) setDensity(p.density);
            if (p.landingPage) setLandingPage(p.landingPage.toLowerCase());
            if (p.projectView) setProjectView(p.projectView);
            if (p.emailDigest) setEmailDigest(p.emailDigest.toLowerCase());
            return;
        }

        setLoading(true);
        getUserPreferences()
            .then((data: UserPreferences) => {
                if (data.theme) setTheme(data.theme);
                if (data.density) setDensity(data.density);
                if (data.landingPage || data.landing_page) {
                    setLandingPage((data.landingPage || data.landing_page || "dashboard").toLowerCase());
                }
                if (data.projectView || data.project_view) {
                    setProjectView(data.projectView || data.project_view || "table");
                }
                if (data.emailDigest || data.email_digest) {
                    setEmailDigest((data.emailDigest || data.email_digest || "weekly").toLowerCase());
                }
            })
            .catch(() => {
                // Keep defaults if fetch fails
            })
            .finally(() => {
                setLoading(false);
            });
    }, [overview]);

    const handleSaveField = async (patch: {
        theme?: ThemeType;
        density?: DensityType;
        landingPage?: string;
        projectView?: ProjectViewType;
        emailDigest?: string;
    }) => {
        setSaving(true);
        setErrorMsg(null);
        try {
            await updateUserPreferences(patch);
            setSuccessMsg("Preferences saved");
            setTimeout(() => setSuccessMsg(null), 2500);
            if (onPreferencesUpdated) {
                onPreferencesUpdated();
            }
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to update preferences.");
        } finally {
            setSaving(false);
        }
    };

    const handleThemeChange = (newTheme: ThemeType) => {
        setTheme(newTheme);
        handleSaveField({ theme: newTheme });
    };

    const handleDensityChange = (newDensity: DensityType) => {
        setDensity(newDensity);
        handleSaveField({ density: newDensity });
    };

    const handleLandingPageChange = (val: string) => {
        setLandingPage(val);
        handleSaveField({ landingPage: val });
    };

    const handleProjectViewChange = (newView: ProjectViewType) => {
        setProjectView(newView);
        handleSaveField({ projectView: newView });
    };

    const handleEmailDigestChange = (val: string) => {
        setEmailDigest(val);
        handleSaveField({ emailDigest: val });
    };

    if (loading) {
        return (
            <div className="preferences-cards-stack">
                <div className="preferences-target-card skeleton-box" style={{ height: 130 }} />
                <div className="preferences-target-card skeleton-box" style={{ height: 130 }} />
                <div className="preferences-target-card skeleton-box" style={{ height: 110 }} />
            </div>
        );
    }

    return (
        <div className="preferences-cards-stack">
            {errorMsg && (
                <div className="notice-banner error" role="alert" style={{ marginBottom: 16 }}>
                    <span>{errorMsg}</span>
                </div>
            )}
            {successMsg && (
                <div className="notice-banner success" role="status" style={{ marginBottom: 16 }}>
                    <span>{successMsg}</span>
                </div>
            )}

            {/* ── CARD 1: DISPLAY ── */}
            <section className="preferences-target-card">
                <div className="preferences-card-header">
                    <h3>Display</h3>
                </div>
                <div className="preferences-card-body">
                    <div className="preferences-grid-2col">
                        {/* Theme Box */}
                        <div className="pref-control-box">
                            <span className="pref-box-label">Theme</span>
                            <PreferenceSegmentedControl
                                name="Theme"
                                options={THEME_OPTIONS}
                                value={theme}
                                onChange={handleThemeChange}
                                disabled={saving}
                            />
                        </div>

                        {/* Density Box */}
                        <div className="pref-control-box">
                            <span className="pref-box-label">Density</span>
                            <PreferenceSegmentedControl
                                name="Density"
                                options={DENSITY_OPTIONS}
                                value={density}
                                onChange={handleDensityChange}
                                disabled={saving}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CARD 2: NAVIGATION ── */}
            <section className="preferences-target-card">
                <div className="preferences-card-header">
                    <h3>Navigation</h3>
                </div>
                <div className="preferences-card-body">
                    <div className="preferences-grid-2col">
                        {/* Default Landing Page */}
                        <div className="pref-field-wrap">
                            <label htmlFor="pref-landing-page" className="pref-field-label">
                                Default Landing Page <span className="profile-req">*</span>
                            </label>
                            <div className="pref-select-wrapper">
                                <select
                                    id="pref-landing-page"
                                    className="pref-select"
                                    value={landingPage}
                                    onChange={(e) => handleLandingPageChange(e.target.value)}
                                    disabled={saving}
                                >
                                    {LANDING_PAGE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Default Project View */}
                        <div className="pref-control-box pref-align-bottom">
                            <span className="pref-box-label">Default Project View</span>
                            <PreferenceSegmentedControl
                                name="Default Project View"
                                options={PROJECT_VIEW_OPTIONS}
                                value={projectView}
                                onChange={handleProjectViewChange}
                                disabled={saving}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CARD 3: EMAIL ── */}
            <section className="preferences-target-card">
                <div className="preferences-card-header">
                    <h3>Email</h3>
                </div>
                <div className="preferences-card-body">
                    <div className="pref-field-wrap" style={{ maxWidth: "100%" }}>
                        <label htmlFor="pref-email-digest" className="pref-field-label">
                            Email Digest <span className="profile-req">*</span>
                        </label>
                        <div className="pref-select-wrapper">
                            <select
                                id="pref-email-digest"
                                className="pref-select"
                                value={emailDigest}
                                onChange={(e) => handleEmailDigestChange(e.target.value)}
                                disabled={saving}
                            >
                                {EMAIL_DIGEST_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
