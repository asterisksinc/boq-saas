"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Loader2, Lock, ShieldCheck, Sliders, User } from "lucide-react";
import {
    deleteUserAvatar,
    SettingsOverview,
    updateUserPassword,
    updateUserPreferences,
    updateUserProfile,
    uploadUserAvatar,
} from "@/lib/api/auth";
import SecuritySettings from "./SecuritySettings";
import PreferencesSettings from "./PreferencesSettings";

interface MyProfileProps {
    overview: SettingsOverview | null;
    onProfileUpdated: () => void;
}

type ProfileMenuTab = "personal-info" | "security" | "preferences";

const LANGUAGE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
];

const TIMEZONE_OPTIONS = [
    { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+5:30)" },
    { value: "UTC", label: "UTC (GMT+0:00)" },
    { value: "America/New_York", label: "America/New_York (GMT-5:00)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (GMT-8:00)" },
    { value: "Europe/London", label: "Europe/London (GMT+0:00)" },
    { value: "Europe/Paris", label: "Europe/Paris (GMT+1:00)" },
    { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4:00)" },
    { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8:00)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9:00)" },
    { value: "Australia/Sydney", label: "Australia/Sydney (GMT+10:00)" },
];

const DATE_FORMAT_OPTIONS = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const CURRENCY_OPTIONS = [
    { value: "INR", label: "₹ INR" },
    { value: "USD", label: "$ USD" },
    { value: "EUR", label: "€ EUR" },
    { value: "GBP", label: "£ GBP" },
    { value: "AED", label: "د.إ AED" },
];

export default function MyProfile({ overview, onProfileUpdated }: MyProfileProps) {
    const [selectedMenu, setSelectedMenu] = useState<ProfileMenuTab>("personal-info");

    // Profile form state
    const [fullName, setFullName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [department, setDepartment] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [language, setLanguage] = useState("en");
    const [timezone, setTimezone] = useState("Asia/Kolkata");
    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const [currencyDisplay, setCurrencyDisplay] = useState("INR");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Security form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI state
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [removingPhoto, setRemovingPhoto] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Populate initial state from overview
    useEffect(() => {
        if (!overview) return;
        const prof = overview.profile;
        const pref = overview.preferences;
        const ws = overview.workspace;

        if (prof?.displayName) setFullName(prof.displayName);
        if (prof?.jobTitle) setJobTitle(prof.jobTitle);
        if (prof?.department) setDepartment(prof.department);
        if (prof?.email) setEmail(prof.email);
        if (prof?.phone) setPhone(prof.phone);
        if (prof?.avatarUrl) setAvatarUrl(prof.avatarUrl);

        if (pref?.locale) {
            const code = pref.locale.split("-")[0].toLowerCase();
            setLanguage(code || "en");
        }
        if (pref?.timezone) {
            setTimezone(pref.timezone);
        } else if (ws?.timezone) {
            setTimezone(ws.timezone);
        }
        if (pref?.dateFormat) {
            setDateFormat(pref.dateFormat);
        }
        if (pref?.currencyDisplay) {
            setCurrencyDisplay(pref.currencyDisplay);
        } else if (ws?.currency) {
            setCurrencyDisplay(ws.currency);
        }
    }, [overview]);

    const initials = useMemo(() => {
        const name = fullName.trim() || overview?.profile?.displayName?.trim() || "User";
        const parts = name.split(/\s+/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }, [fullName, overview]);

    const triggerNotification = (msg: string, isError = false) => {
        if (isError) {
            setErrorMsg(msg);
            setSuccessMsg(null);
        } else {
            setSuccessMsg(msg);
            setErrorMsg(null);
            setTimeout(() => setSuccessMsg(null), 4000);
        }
    };

    // ── Photo Upload & Removal ──
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) {
            triggerNotification("Please select a valid image file (JPG, PNG, or WebP).", true);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            triggerNotification("Photo exceeds 5MB size limit.", true);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setUploadingPhoto(true);
        setErrorMsg(null);
        try {
            const res = await uploadUserAvatar(file);
            if (res.avatarUrl) {
                setAvatarUrl(res.avatarUrl);
            }
            triggerNotification("Profile photo updated.");
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: { avatarUrl: res.avatarUrl } }));
            }
            onProfileUpdated();
        } catch (err: unknown) {
            triggerNotification(err instanceof Error ? err.message : "Failed to upload photo.", true);
        } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemovePhoto = async () => {
        setRemovingPhoto(true);
        setErrorMsg(null);
        try {
            await deleteUserAvatar();
            setAvatarUrl(null);
            triggerNotification("Profile photo removed.");
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: { avatarUrl: null } }));
            }
            onProfileUpdated();
        } catch (err: unknown) {
            triggerNotification(err instanceof Error ? err.message : "Failed to remove photo.", true);
        } finally {
            setRemovingPhoto(false);
        }
    };

    // ── Personal Info Save ──
    const handleSavePersonalInfo = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedName = fullName.trim();
        if (!trimmedName) {
            triggerNotification("Full Name cannot be empty.", true);
            return;
        }

        setSaving(true);
        setErrorMsg(null);
        try {
            // Save profile details
            await updateUserProfile({
                displayName: trimmedName,
                jobTitle: jobTitle.trim() || null,
                department: department.trim() || null,
                phone: phone.trim() || null,
            });

            // Save preferences
            await updateUserPreferences({
                timezone,
                locale: language === "en" ? "en-IN" : language,
                dateFormat,
                currencyDisplay,
            });

            triggerNotification("Changes saved successfully.");
            onProfileUpdated();
        } catch (err: unknown) {
            triggerNotification(err instanceof Error ? err.message : "Could not save profile changes.", true);
        } finally {
            setSaving(false);
        }
    };

    // ── Security Password Change ──
    const handleUpdatePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            triggerNotification("Current password is required.", true);
            return;
        }
        if (newPassword.length < 10) {
            triggerNotification("New password must be at least 10 characters.", true);
            return;
        }
        if (newPassword !== confirmPassword) {
            triggerNotification("New passwords do not match.", true);
            return;
        }

        setSaving(true);
        setErrorMsg(null);
        try {
            await updateUserPassword({
                currentPassword,
                newPassword,
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            triggerNotification("Password changed successfully.");
        } catch (err: unknown) {
            triggerNotification(err instanceof Error ? err.message : "Failed to update password.", true);
        } finally {
            setSaving(false);
        }
    };

    // ── Preferences Save ──
    const handleSavePreferencesOnly = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg(null);
        try {
            await updateUserPreferences({
                timezone,
                locale: language === "en" ? "en-IN" : language,
                dateFormat,
                currencyDisplay,
            });
            triggerNotification("Preferences saved successfully.");
            onProfileUpdated();
        } catch (err: unknown) {
            triggerNotification(err instanceof Error ? err.message : "Could not save preferences.", true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-redesign-container">
            {/* Feedback notifications */}
            {successMsg && (
                <div className="notice-banner success" role="status" style={{ marginBottom: 16 }}>
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="notice-banner error" role="alert" style={{ marginBottom: 16 }}>
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="profile-layout-grid">
                {/* ── LEFT COLUMN: SELECT MENU (SCREENSHOT 2) ── */}
                <aside className="profile-sidebar-card">
                    <div className="profile-sidebar-header">SELECT MENU</div>
                    <nav className="profile-sidebar-nav" aria-label="Profile navigation">
                        <button
                            type="button"
                            className={`profile-sidebar-item ${selectedMenu === "personal-info" ? "active" : ""}`}
                            onClick={() => {
                                setSelectedMenu("personal-info");
                                setErrorMsg(null);
                            }}
                        >
                            <span>Personal Info</span>
                            {selectedMenu === "personal-info" && <ChevronRight size={18} className="sidebar-chevron" />}
                        </button>

                        <button
                            type="button"
                            className={`profile-sidebar-item ${selectedMenu === "security" ? "active" : ""}`}
                            onClick={() => {
                                setSelectedMenu("security");
                                setErrorMsg(null);
                            }}
                        >
                            <span>Security</span>
                            {selectedMenu === "security" && <ChevronRight size={18} className="sidebar-chevron" />}
                        </button>

                        <button
                            type="button"
                            className={`profile-sidebar-item ${selectedMenu === "preferences" ? "active" : ""}`}
                            onClick={() => {
                                setSelectedMenu("preferences");
                                setErrorMsg(null);
                            }}
                        >
                            <span>Preferences</span>
                            {selectedMenu === "preferences" && <ChevronRight size={18} className="sidebar-chevron" />}
                        </button>
                    </nav>
                </aside>

                {/* ── RIGHT COLUMN: CONTENT CARD (SCREENSHOT 2) ── */}
                <main className="profile-content-area">
                    {selectedMenu === "personal-info" && (
                        <form onSubmit={handleSavePersonalInfo}>
                            <div className="profile-content-card">
                                {/* Top Avatar Row */}
                                <div className="profile-avatar-row">
                                    <div className="profile-avatar-circle" title="User Avatar">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={fullName || "User Avatar"}
                                                onError={() => setAvatarUrl(null)}
                                            />
                                        ) : (
                                            <span className="profile-avatar-initials">{initials}</span>
                                        )}
                                    </div>

                                    <div className="profile-avatar-actions">
                                        <button
                                            type="button"
                                            className="btn-upload-photo"
                                            onClick={handleUploadClick}
                                            disabled={uploadingPhoto || saving}
                                        >
                                            {uploadingPhoto ? <Loader2 size={15} className="spin" /> : null}
                                            <span>{uploadingPhoto ? "Uploading..." : "Upload Photo"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-remove-photo"
                                            onClick={handleRemovePhoto}
                                            disabled={!avatarUrl || removingPhoto || saving}
                                        >
                                            {removingPhoto ? <Loader2 size={15} className="spin" /> : null}
                                            <span>Remove</span>
                                        </button>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/gif"
                                            style={{ display: "none" }}
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                {/* 2-Column Form Grid (SCREENSHOT 2) */}
                                <div className="profile-form-grid">
                                    {/* Row 1 */}
                                    <div className="profile-field-group">
                                        <label htmlFor="field-fullname">
                                            Full Name <span className="profile-req">*</span>
                                        </label>
                                        <input
                                            id="field-fullname"
                                            type="text"
                                            className="profile-input"
                                            placeholder="e.g. Riya Sharma"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="profile-field-group">
                                        <label htmlFor="field-jobtitle">
                                            Job Title <span className="profile-req">*</span>
                                        </label>
                                        <input
                                            id="field-jobtitle"
                                            type="text"
                                            className="profile-input"
                                            placeholder="e.g. Principal Designer"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Row 2 */}
                                    <div className="profile-field-group">
                                        <label htmlFor="field-department">
                                            Department <span className="profile-req">*</span>
                                        </label>
                                        <input
                                            id="field-department"
                                            type="text"
                                            className="profile-input"
                                            placeholder="e.g. Design"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="profile-field-group">
                                        <label htmlFor="field-email">
                                            Email <span className="profile-req">*</span>
                                        </label>
                                        <input
                                            id="field-email"
                                            type="email"
                                            className="profile-input profile-input-readonly"
                                            value={email || overview?.profile?.email || ""}
                                            readOnly
                                            disabled
                                            title="Account email address cannot be changed directly."
                                        />
                                    </div>

                                    {/* Row 3 */}
                                    <div className="profile-field-group">
                                        <label htmlFor="field-phone">
                                            Phone <span className="profile-req">*</span>
                                        </label>
                                        <input
                                            id="field-phone"
                                            type="tel"
                                            className="profile-input"
                                            placeholder="+91 98200 00001"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="profile-field-group">
                                        <label htmlFor="field-language">
                                            Preferred Language <span className="profile-req">*</span>
                                        </label>
                                        <div className="profile-select-wrapper">
                                            <select
                                                id="field-language"
                                                className="profile-select"
                                                value={language}
                                                onChange={(e) => setLanguage(e.target.value)}
                                                required
                                            >
                                                {LANGUAGE_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 4 */}
                                    <div className="profile-field-group">
                                        <label htmlFor="field-timezone">
                                            Timezone <span className="profile-req">*</span>
                                        </label>
                                        <div className="profile-select-wrapper">
                                            <select
                                                id="field-timezone"
                                                className="profile-select"
                                                value={timezone}
                                                onChange={(e) => setTimezone(e.target.value)}
                                                required
                                            >
                                                {TIMEZONE_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="profile-field-group">
                                        <label htmlFor="field-dateformat">
                                            Date Format <span className="profile-req">*</span>
                                        </label>
                                        <div className="profile-select-wrapper">
                                            <select
                                                id="field-dateformat"
                                                className="profile-select"
                                                value={dateFormat}
                                                onChange={(e) => setDateFormat(e.target.value)}
                                                required
                                            >
                                                {DATE_FORMAT_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 5 */}
                                    <div className="profile-field-group">
                                        <label htmlFor="field-currency">
                                            Currency Display <span className="profile-req">*</span>
                                        </label>
                                        <div className="profile-select-wrapper">
                                            <select
                                                id="field-currency"
                                                className="profile-select"
                                                value={currencyDisplay}
                                                onChange={(e) => setCurrencyDisplay(e.target.value)}
                                                required
                                            >
                                                {CURRENCY_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Right Save Changes Button (SCREENSHOT 2) */}
                            <div className="profile-save-container">
                                <button type="submit" className="btn-profile-save" disabled={saving}>
                                    {saving && <Loader2 size={16} className="spin" style={{ marginRight: 8 }} />}
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {selectedMenu === "security" && (
                        <SecuritySettings onSecurityUpdated={onProfileUpdated} />
                    )}

                    {selectedMenu === "preferences" && (
                        <PreferencesSettings
                            overview={overview}
                            onPreferencesUpdated={onProfileUpdated}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
