"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SettingsOverview, updateOrganization } from "@/lib/api/auth";

interface OrganizationGstTaxProps {
    overview: SettingsOverview | null;
    canEdit: boolean;
    onSaveSuccess: () => void;
    showNotice: (message: string, type?: "success" | "error") => void;
}

const INDIAN_STATES_AND_UTS = [
    "Maharashtra",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
    "Other",
];

const TAX_REGIMES = [
    "Regular",
    "Composition Scheme",
    "Special Economic Zone (SEZ)",
    "Deemed Export / EOU",
    "Non-GST / Exempt",
];

export default function OrganizationGstTax({
    overview,
    canEdit,
    onSaveSuccess,
    showNotice,
}: OrganizationGstTaxProps) {
    const ws = overview?.workspace;
    const wp = (ws?.profile as Record<string, unknown>) || {};
    const settings = overview?.settings || {};
    const boqCosting = ((settings["boq-costing"] || settings.boq_costing || {}) as Record<string, unknown>);
    const businessInfo = ((boqCosting.businessInfo || boqCosting.business_info || {}) as Record<string, unknown>);
    const taxInfo = ((boqCosting.taxInfo || boqCosting.tax_info || {}) as Record<string, unknown>);

    const initialRegistered = boqCosting.registeredUnderGst !== undefined
        ? Boolean(boqCosting.registeredUnderGst)
        : Boolean(wp.tax_id || businessInfo.gstNumber);
    const initialGstin = (taxInfo.gstin as string) || (businessInfo.gstNumber as string) || (wp.tax_id as string) || "";
    const initialState = (taxInfo.state as string) || (taxInfo.taxJurisdiction as string) || (wp.state as string) || "Maharashtra";
    const initialRegime = (taxInfo.taxRegime as string) || (boqCosting.taxRegime as string) || "Regular";

    const initialCgst = typeof boqCosting.cgstRate === "number" ? String(boqCosting.cgstRate) : "9";
    const initialSgst = typeof boqCosting.sgstRate === "number" ? String(boqCosting.sgstRate) : "9";
    const initialIgst = typeof boqCosting.igstRate === "number" ? String(boqCosting.igstRate) : "18";
    const initialCess = typeof boqCosting.cessRate === "number" ? String(boqCosting.cessRate) : "0";

    const initialTaxDisplay = boqCosting.taxDisplay === "inclusive" || boqCosting.taxDisplay === false ? false : true;
    const initialReverseCharge = boqCosting.reverseCharge !== undefined ? Boolean(boqCosting.reverseCharge) : true;

    const [registeredUnderGst, setRegisteredUnderGst] = useState(initialRegistered);
    const [gstin, setGstin] = useState(initialGstin);
    const [state, setState] = useState(initialState);
    const [taxRegime, setTaxRegime] = useState(initialRegime);

    const [cgstRate, setCgstRate] = useState(initialCgst);
    const [sgstRate, setSgstRate] = useState(initialSgst);
    const [igstRate, setIgstRate] = useState(initialIgst);
    const [cessRate, setCessRate] = useState(initialCess);

    const [taxDisplayExclusive, setTaxDisplayExclusive] = useState(initialTaxDisplay);
    const [reverseCharge, setReverseCharge] = useState(initialReverseCharge);

    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!overview) return;
        const currentBoq = ((overview.settings?.["boq-costing"] || overview.settings?.boq_costing || {}) as Record<string, unknown>);
        const currentWp = (overview.workspace?.profile as Record<string, unknown>) || {};
        const currentBiz = ((currentBoq.businessInfo || currentBoq.business_info || {}) as Record<string, unknown>);
        const currentTax = ((currentBoq.taxInfo || currentBoq.tax_info || {}) as Record<string, unknown>);

        const reg = currentBoq.registeredUnderGst !== undefined
            ? Boolean(currentBoq.registeredUnderGst)
            : Boolean(currentWp.tax_id || currentBiz.gstNumber);
        const gst = (currentTax.gstin as string) || (currentBiz.gstNumber as string) || (currentWp.tax_id as string) || "";
        const st = (currentTax.state as string) || (currentTax.taxJurisdiction as string) || (currentWp.state as string) || "Maharashtra";
        const rg = (currentTax.taxRegime as string) || (currentBoq.taxRegime as string) || "Regular";

        setRegisteredUnderGst(reg);
        setGstin(gst);
        setState(st);
        setTaxRegime(rg);

        setCgstRate(typeof currentBoq.cgstRate === "number" ? String(currentBoq.cgstRate) : "9");
        setSgstRate(typeof currentBoq.sgstRate === "number" ? String(currentBoq.sgstRate) : "9");
        setIgstRate(typeof currentBoq.igstRate === "number" ? String(currentBoq.igstRate) : "18");
        setCessRate(typeof currentBoq.cessRate === "number" ? String(currentBoq.cessRate) : "0");

        setTaxDisplayExclusive(currentBoq.taxDisplay === "inclusive" || currentBoq.taxDisplay === false ? false : true);
        setReverseCharge(currentBoq.reverseCharge !== undefined ? Boolean(currentBoq.reverseCharge) : true);
    }, [overview]);

    const handleCgstChange = (val: string) => {
        setCgstRate(val);
        const numCgst = parseFloat(val);
        const numSgst = parseFloat(sgstRate);
        if (!isNaN(numCgst) && !isNaN(numSgst)) {
            setIgstRate(String(numCgst + numSgst));
        }
        if (formErrors.cgstRate) setFormErrors((prev) => ({ ...prev, cgstRate: "" }));
    };

    const handleSgstChange = (val: string) => {
        setSgstRate(val);
        const numCgst = parseFloat(cgstRate);
        const numSgst = parseFloat(val);
        if (!isNaN(numCgst) && !isNaN(numSgst)) {
            setIgstRate(String(numCgst + numSgst));
        }
        if (formErrors.sgstRate) setFormErrors((prev) => ({ ...prev, sgstRate: "" }));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (registeredUnderGst) {
            if (!gstin.trim()) {
                errors.gstin = "GSTIN is required when registered under GST";
            }
            if (!state.trim()) {
                errors.state = "State / Jurisdiction is required";
            }
            if (!taxRegime.trim()) {
                errors.taxRegime = "Default Tax Regime is required";
            }
        }

        if (cgstRate === "" || isNaN(Number(cgstRate)) || Number(cgstRate) < 0 || Number(cgstRate) > 100) {
            errors.cgstRate = "Valid CGST Rate (0-100%) is required";
        }
        if (sgstRate === "" || isNaN(Number(sgstRate)) || Number(sgstRate) < 0 || Number(sgstRate) > 100) {
            errors.sgstRate = "Valid SGST Rate (0-100%) is required";
        }
        if (igstRate === "" || isNaN(Number(igstRate)) || Number(igstRate) < 0 || Number(igstRate) > 100) {
            errors.igstRate = "Valid IGST Rate (0-100%) is required";
        }
        if (cessRate === "" || isNaN(Number(cessRate)) || Number(cessRate) < 0 || Number(cessRate) > 100) {
            errors.cessRate = "Valid Cess Rate (0-100%) is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canEdit) {
            showNotice("You do not have permission to edit GST & Tax settings.", "error");
            return;
        }

        if (!validateForm()) {
            showNotice("Please fill in all required tax fields.", "error");
            return;
        }

        setSaving(true);
        setFormErrors({});

        try {
            await updateOrganization({
                registeredUnderGst,
                gstin: gstin.trim().toUpperCase(),
                gstNumber: gstin.trim().toUpperCase(),
                taxId: gstin.trim().toUpperCase(),
                taxJurisdiction: state,
                state: state,
                taxRegime,
                cgstRate: Number(cgstRate),
                sgstRate: Number(sgstRate),
                igstRate: Number(igstRate),
                cessRate: Number(cessRate),
                taxDisplay: taxDisplayExclusive ? "exclusive" : "inclusive",
                reverseCharge,
            });

            showNotice("GST & Tax settings saved successfully.", "success");
            onSaveSuccess();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update GST & Tax settings.";
            showNotice(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    const stateOptions = Array.from(new Set([...INDIAN_STATES_AND_UTS, state])).filter(Boolean);
    const regimeOptions = Array.from(new Set([...TAX_REGIMES, taxRegime])).filter(Boolean);

    return (
        <form onSubmit={handleSubmit} className="org-profile-form" noValidate>
            {/* CARD 1: Registered under GST & Registration details */}
            <div className="org-content-card">
                <div className="org-card-header-toggle">
                    <div>
                        <h3 className="org-card-title">Registered under GST</h3>
                        <p className="org-card-subtitle">Organisation is a registered GST taxpayer</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={registeredUnderGst}
                        className={`org-toggle-switch ${registeredUnderGst ? "is-checked" : ""}`}
                        onClick={() => {
                            if (canEdit) setRegisteredUnderGst(!registeredUnderGst);
                        }}
                        disabled={!canEdit}
                        aria-label="Toggle GST Registration"
                    >
                        <span className="org-toggle-thumb" />
                    </button>
                </div>

                <div className="org-form-grid" style={{ marginTop: "24px" }}>
                    {/* GSTIN * | State / Jurisdiction * */}
                    <div className="org-field">
                        <label htmlFor="gstin">
                            GSTIN <span className="required">*</span>
                        </label>
                        <input
                            id="gstin"
                            type="text"
                            className={`org-input font-mono ${formErrors.gstin ? "has-error" : ""}`}
                            value={gstin}
                            onChange={(e) => {
                                setGstin(e.target.value.toUpperCase().trim());
                                if (formErrors.gstin) setFormErrors((prev) => ({ ...prev, gstin: "" }));
                            }}
                            placeholder="e.g. 22AAAAA0000A1Z5"
                            maxLength={15}
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.gstin && (
                            <span className="org-field-error" role="alert">{formErrors.gstin}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="taxState">
                            State / Jurisdiction <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="taxState"
                                className={`org-select ${formErrors.state ? "has-error" : ""}`}
                                value={state}
                                onChange={(e) => {
                                    setState(e.target.value);
                                    if (formErrors.state) setFormErrors((prev) => ({ ...prev, state: "" }));
                                }}
                                disabled={!canEdit}
                                required
                            >
                                {stateOptions.map((st) => (
                                    <option key={st} value={st}>
                                        {st}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formErrors.state && (
                            <span className="org-field-error" role="alert">{formErrors.state}</span>
                        )}
                    </div>

                    {/* Default Tax Regime * (Spans left column) */}
                    <div className="org-field">
                        <label htmlFor="taxRegime">
                            Default Tax Regime <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="taxRegime"
                                className={`org-select ${formErrors.taxRegime ? "has-error" : ""}`}
                                value={taxRegime}
                                onChange={(e) => {
                                    setTaxRegime(e.target.value);
                                    if (formErrors.taxRegime) setFormErrors((prev) => ({ ...prev, taxRegime: "" }));
                                }}
                                disabled={!canEdit}
                                required
                            >
                                {regimeOptions.map((rg) => (
                                    <option key={rg} value={rg}>
                                        {rg}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formErrors.taxRegime && (
                            <span className="org-field-error" role="alert">{formErrors.taxRegime}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* CARD 2: Tax Rates (CGST, SGST, IGST, Cess) */}
            <div className="org-content-card">
                <div className="org-form-grid">
                    {/* Row 1: CGST Rate (%) * | SGST Rate (%) * */}
                    <div className="org-field">
                        <label htmlFor="cgstRate">
                            CGST Rate (%) <span className="required">*</span>
                        </label>
                        <input
                            id="cgstRate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className={`org-input ${formErrors.cgstRate ? "has-error" : ""}`}
                            value={cgstRate}
                            onChange={(e) => handleCgstChange(e.target.value)}
                            placeholder="9"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.cgstRate && (
                            <span className="org-field-error" role="alert">{formErrors.cgstRate}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="sgstRate">
                            SGST Rate (%) <span className="required">*</span>
                        </label>
                        <input
                            id="sgstRate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className={`org-input ${formErrors.sgstRate ? "has-error" : ""}`}
                            value={sgstRate}
                            onChange={(e) => handleSgstChange(e.target.value)}
                            placeholder="9"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.sgstRate && (
                            <span className="org-field-error" role="alert">{formErrors.sgstRate}</span>
                        )}
                    </div>

                    {/* Row 2: IGST Rate (%) * | Cess (%) * */}
                    <div className="org-field">
                        <label htmlFor="igstRate">
                            IGST Rate (%) <span className="required">*</span>
                        </label>
                        <input
                            id="igstRate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className={`org-input ${formErrors.igstRate ? "has-error" : ""}`}
                            value={igstRate}
                            onChange={(e) => {
                                setIgstRate(e.target.value);
                                if (formErrors.igstRate) setFormErrors((prev) => ({ ...prev, igstRate: "" }));
                            }}
                            placeholder="18"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.igstRate && (
                            <span className="org-field-error" role="alert">{formErrors.igstRate}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="cessRate">
                            Cess (%) <span className="required">*</span>
                        </label>
                        <input
                            id="cessRate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className={`org-input ${formErrors.cessRate ? "has-error" : ""}`}
                            value={cessRate}
                            onChange={(e) => {
                                setCessRate(e.target.value);
                                if (formErrors.cessRate) setFormErrors((prev) => ({ ...prev, cessRate: "" }));
                            }}
                            placeholder="0"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.cessRate && (
                            <span className="org-field-error" role="alert">{formErrors.cessRate}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* CARD 3: Tax Behavior (Exclusive display, Reverse Charge) */}
            <div className="org-content-card">
                <div className="org-setting-row">
                    <div className="org-setting-text">
                        <div className="org-setting-title">
                            Tax Display: {taxDisplayExclusive ? "Exclusive" : "Inclusive"}
                        </div>
                        <div className="org-setting-desc">
                            {taxDisplayExclusive ? "Tax shown separately on documents" : "Tax included in item prices"}
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={taxDisplayExclusive}
                        className={`org-toggle-switch ${taxDisplayExclusive ? "is-checked" : ""}`}
                        onClick={() => {
                            if (canEdit) setTaxDisplayExclusive(!taxDisplayExclusive);
                        }}
                        disabled={!canEdit}
                        aria-label="Toggle Exclusive Tax Display"
                    >
                        <span className="org-toggle-thumb" />
                    </button>
                </div>

                <div className="org-setting-divider" />

                <div className="org-setting-row">
                    <div className="org-setting-text">
                        <div className="org-setting-title">Reverse Charge Applicable</div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={reverseCharge}
                        className={`org-toggle-switch ${reverseCharge ? "is-checked" : ""}`}
                        onClick={() => {
                            if (canEdit) setReverseCharge(!reverseCharge);
                        }}
                        disabled={!canEdit}
                        aria-label="Toggle Reverse Charge Applicable"
                    >
                        <span className="org-toggle-thumb" />
                    </button>
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
