"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SettingsOverview, updateOrganization } from "@/lib/api/auth";

interface OrganizationCompanyProfileProps {
    overview: SettingsOverview | null;
    canEdit: boolean;
    onSaveSuccess: () => void;
    showNotice: (message: string, type?: "success" | "error") => void;
}

const COUNTRIES = [
    "India",
    "United States",
    "United Kingdom",
    "United Arab Emirates",
    "Singapore",
    "Australia",
    "Canada",
    "Germany",
    "Saudi Arabia",
    "Qatar",
];

const INDIAN_STATES = [
    "Maharashtra",
    "Andhra Pradesh",
    "Delhi",
    "Gujarat",
    "Haryana",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Uttar Pradesh",
    "West Bengal",
    "Goa",
    "Other",
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];

const TIMEZONES = [
    { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+5:30)" },
    { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4:00)" },
    { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8:00)" },
    { value: "Europe/London", label: "Europe/London (GMT+0:00)" },
    { value: "Europe/Paris", label: "Europe/Paris (GMT+1:00)" },
    { value: "Europe/Berlin", label: "Europe/Berlin (GMT+1:00)" },
    { value: "America/New_York", label: "America/New_York (GMT-5:00)" },
    { value: "America/Chicago", label: "America/Chicago (GMT-6:00)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (GMT-8:00)" },
    { value: "Australia/Sydney", label: "Australia/Sydney (GMT+10:00)" },
    { value: "UTC", label: "UTC (GMT+0:00)" },
];

const FISCAL_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

function monthNumberToName(num: number | unknown): string {
    if (typeof num === "number" && num >= 1 && num <= 12) {
        return FISCAL_MONTHS[num - 1];
    }
    if (typeof num === "string" && FISCAL_MONTHS.includes(num)) {
        return num;
    }
    return "April";
}

function parseAddressState(address: string): string {
    if (!address) return "Maharashtra";
    for (const state of INDIAN_STATES) {
        if (address.toLowerCase().includes(state.toLowerCase())) {
            return state;
        }
    }
    return "Maharashtra";
}

function parsePostalCode(address: string): string {
    if (!address) return "400026";
    const match = address.match(/\b\d{6}\b/);
    return match ? match[0] : "400026";
}

export default function OrganizationCompanyProfile({
    overview,
    canEdit,
    onSaveSuccess,
    showNotice,
}: OrganizationCompanyProfileProps) {
    const ws = overview?.workspace;
    const wp = (ws?.profile as Record<string, unknown>) || {};
    const settings = overview?.settings || {};
    const boqCosting = ((settings["boq-costing"] || settings.boq_costing || {}) as Record<string, unknown>);
    const branding = ((settings.branding || {}) as Record<string, unknown>);

    const initialCompanyName = (ws?.name as string) || "";
    const initialLegalEntity = (branding.companyName as string) || (ws?.name as string) || "";
    const initialWebsite = (wp.website as string) || "";
    const initialEmail = (wp.business_email as string) || (overview?.profile?.email as string) || "";
    const initialPhone = (wp.phone as string) || "";
    const initialAddress = (wp.address as string) || "";
    const initialCountry = (ws?.country as string) || "India";
    const initialState = (wp.state as string) || parseAddressState(initialAddress);
    const initialPostal = (wp.postal_code as string) || parsePostalCode(initialAddress);
    const initialCurrency = (ws?.currency as string) || "INR";
    const initialTimezone = (ws?.timezone as string) || "Asia/Kolkata";
    const initialFiscalYear = (boqCosting.fiscalYearStart as string) || monthNumberToName(boqCosting.fiscalYearStartMonth);

    const [companyName, setCompanyName] = useState(initialCompanyName);
    const [legalEntityName, setLegalEntityName] = useState(initialLegalEntity);
    const [website, setWebsite] = useState(initialWebsite);
    const [primaryEmail, setPrimaryEmail] = useState(initialEmail);
    const [phone, setPhone] = useState(initialPhone);
    const [address, setAddress] = useState(initialAddress);
    const [country, setCountry] = useState(initialCountry);
    const [state, setState] = useState(initialState);
    const [postalCode, setPostalCode] = useState(initialPostal);
    const [currency, setCurrency] = useState(initialCurrency);
    const [timezone, setTimezone] = useState(initialTimezone);
    const [fiscalYearStart, setFiscalYearStart] = useState(initialFiscalYear);

    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Keep form in sync when overview changes if not edited
    useEffect(() => {
        if (!overview) return;
        setCompanyName((ws?.name as string) || "");
        setLegalEntityName((branding.companyName as string) || (ws?.name as string) || "");
        setWebsite((wp.website as string) || "");
        setPrimaryEmail((wp.business_email as string) || (overview?.profile?.email as string) || "");
        setPhone((wp.phone as string) || "");
        setAddress((wp.address as string) || "");
        setCountry((ws?.country as string) || "India");
        setState((wp.state as string) || parseAddressState((wp.address as string) || ""));
        setPostalCode((wp.postal_code as string) || parsePostalCode((wp.address as string) || ""));
        setCurrency((ws?.currency as string) || "INR");
        setTimezone((ws?.timezone as string) || "Asia/Kolkata");
        setFiscalYearStart((boqCosting.fiscalYearStart as string) || monthNumberToName(boqCosting.fiscalYearStartMonth));
    }, [overview]);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!companyName.trim()) {
            errors.companyName = "Company name is required";
        }
        if (!primaryEmail.trim()) {
            errors.primaryEmail = "Primary email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryEmail.trim())) {
            errors.primaryEmail = "Please enter a valid email address";
        }
        if (website.trim()) {
            const hasProtocol = /^https?:\/\//i.test(website.trim());
            const testUrl = hasProtocol ? website.trim() : `https://${website.trim()}`;
            try {
                new URL(testUrl);
            } catch {
                errors.website = "Please enter a valid website URL";
            }
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canEdit) {
            showNotice("You do not have permission to edit organization settings.", "error");
            return;
        }

        if (!validateForm()) {
            showNotice("Please correct the errors in the form before saving.", "error");
            return;
        }

        setSaving(true);
        setFormErrors({});

        // Normalize website URL if needed
        let cleanWebsite = website.trim();
        if (cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)) {
            cleanWebsite = `https://${cleanWebsite}`;
        }

        try {
            await updateOrganization({
                companyName: companyName.trim(),
                name: companyName.trim(),
                legalEntityName: legalEntityName.trim() || undefined,
                website: cleanWebsite || null,
                primaryEmail: primaryEmail.trim() || null,
                businessEmail: primaryEmail.trim() || null,
                phone: phone.trim() || null,
                address: address.trim() || null,
                country: country || null,
                state: state || null,
                postalCode: postalCode.trim() || null,
                currency: currency || "INR",
                timezone: timezone || "Asia/Kolkata",
                fiscalYearStart: fiscalYearStart || "April",
                taxId: (wp.tax_id as string) || undefined,
            });

            showNotice("Organization settings saved successfully.", "success");
            onSaveSuccess();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update organization settings.";
            showNotice(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="org-profile-form" noValidate>
            <div className="org-content-card">
                <div className="org-form-grid">
                    {/* ROW 1: Company Name | Legal Entity Name */}
                    <div className="org-field">
                        <label htmlFor="companyName">
                            Company Name <span className="required">*</span>
                        </label>
                        <input
                            id="companyName"
                            type="text"
                            className={`org-input ${formErrors.companyName ? "has-error" : ""}`}
                            value={companyName}
                            onChange={(e) => {
                                setCompanyName(e.target.value);
                                if (formErrors.companyName) {
                                    setFormErrors((prev) => ({ ...prev, companyName: "" }));
                                }
                            }}
                            placeholder="e.g. Arvin Interiors"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.companyName && (
                            <span className="org-field-error" role="alert">{formErrors.companyName}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="legalEntityName">
                            Legal Entity Name <span className="required">*</span>
                        </label>
                        <input
                            id="legalEntityName"
                            type="text"
                            className="org-input"
                            value={legalEntityName}
                            onChange={(e) => setLegalEntityName(e.target.value)}
                            placeholder="e.g. Arvin Interiors LLP"
                            disabled={!canEdit}
                            required
                        />
                    </div>

                    {/* ROW 2: Website | Primary Email */}
                    <div className="org-field">
                        <label htmlFor="website">
                            Website <span className="required">*</span>
                        </label>
                        <input
                            id="website"
                            type="text"
                            className={`org-input ${formErrors.website ? "has-error" : ""}`}
                            value={website}
                            onChange={(e) => {
                                setWebsite(e.target.value);
                                if (formErrors.website) {
                                    setFormErrors((prev) => ({ ...prev, website: "" }));
                                }
                            }}
                            placeholder="e.g. arvininteriors.com"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.website && (
                            <span className="org-field-error" role="alert">{formErrors.website}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="primaryEmail">
                            Primary Email <span className="required">*</span>
                        </label>
                        <input
                            id="primaryEmail"
                            type="email"
                            className={`org-input ${formErrors.primaryEmail ? "has-error" : ""}`}
                            value={primaryEmail}
                            onChange={(e) => {
                                setPrimaryEmail(e.target.value);
                                if (formErrors.primaryEmail) {
                                    setFormErrors((prev) => ({ ...prev, primaryEmail: "" }));
                                }
                            }}
                            placeholder="e.g. hello@arvininteriors.com"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.primaryEmail && (
                            <span className="org-field-error" role="alert">{formErrors.primaryEmail}</span>
                        )}
                    </div>

                    {/* ROW 3: Phone | Address */}
                    <div className="org-field">
                        <label htmlFor="phone">
                            Phone <span className="required">*</span>
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            className="org-input"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +91 22 1234 5678"
                            disabled={!canEdit}
                            required
                        />
                    </div>

                    <div className="org-field">
                        <label htmlFor="address">
                            Address <span className="required">*</span>
                        </label>
                        <input
                            id="address"
                            type="text"
                            className="org-input"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g. 204, Bhulabhai Desai Road"
                            disabled={!canEdit}
                            required
                        />
                    </div>

                    {/* ROW 4: Country | State */}
                    <div className="org-field">
                        <label htmlFor="country">
                            Country <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="country"
                                className="org-select"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                disabled={!canEdit}
                                required
                            >
                                {COUNTRIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="org-field">
                        <label htmlFor="state">
                            State <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="state"
                                className="org-select"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                disabled={!canEdit}
                                required
                            >
                                {INDIAN_STATES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ROW 5: Postal Code | Default Currency */}
                    <div className="org-field">
                        <label htmlFor="postalCode">
                            Postal Code <span className="required">*</span>
                        </label>
                        <input
                            id="postalCode"
                            type="text"
                            className="org-input"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="e.g. 400026"
                            disabled={!canEdit}
                            required
                        />
                    </div>

                    <div className="org-field">
                        <label htmlFor="currency">
                            Default Currency <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="currency"
                                className="org-select"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                disabled={!canEdit}
                                required
                            >
                                {CURRENCIES.map((cur) => (
                                    <option key={cur} value={cur}>
                                        {cur}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ROW 6: Timezone | Fiscal Year Start */}
                    <div className="org-field">
                        <label htmlFor="timezone">
                            Timezone <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="timezone"
                                className="org-select"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                disabled={!canEdit}
                                required
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="org-field">
                        <label htmlFor="fiscalYearStart">
                            Fiscal Year Start <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="fiscalYearStart"
                                className="org-select"
                                value={fiscalYearStart}
                                onChange={(e) => setFiscalYearStart(e.target.value)}
                                disabled={!canEdit}
                                required
                            >
                                {FISCAL_MONTHS.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom-right Save Changes button */}
            <div className="org-form-actions">
                <button
                    type="submit"
                    className="btn-primary org-btn-save"
                    disabled={saving || !canEdit}
                    title={!canEdit ? "Editing organization settings requires Owner or Admin role" : undefined}
                >
                    {saving && <Loader2 size={16} className="spin" aria-hidden="true" />}
                    <span>Save Changes</span>
                </button>
            </div>
        </form>
    );
}
