"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SettingsOverview, updateOrganization } from "@/lib/api/auth";

interface OrganizationBusinessInfoProps {
    overview: SettingsOverview | null;
    canEdit: boolean;
    onSaveSuccess: () => void;
    showNotice: (message: string, type?: "success" | "error") => void;
}

const BUSINESS_TYPES = [
    "Interior Design Studio",
    "General Contractor",
    "Architectural Firm",
    "Civil Engineering & Construction",
    "MEP / Turnkey Contractor",
    "Consultancy & Project Management",
    "Private Limited Company",
    "Limited Liability Partnership (LLP)",
    "Sole Proprietorship",
    "Partnership Firm",
    "Other",
];

const PAYMENT_TERMS_OPTIONS = [
    "Net 15",
    "Net 30",
    "Net 45",
    "Net 60",
    "Due on Receipt",
    "Advance 50% / Balance Completion",
    "Advance 40% / Progress 40% / Handover 20%",
    "Immediate",
    "Custom Terms",
];

export default function OrganizationBusinessInfo({
    overview,
    canEdit,
    onSaveSuccess,
    showNotice,
}: OrganizationBusinessInfoProps) {
    const ws = overview?.workspace;
    const wp = (ws?.profile as Record<string, unknown>) || {};
    const settings = overview?.settings || {};
    const boqCosting = ((settings["boq-costing"] || settings.boq_costing || {}) as Record<string, unknown>);
    const branding = ((settings.branding || {}) as Record<string, unknown>);
    const businessInfo = ((boqCosting.businessInfo || boqCosting.business_info || {}) as Record<string, unknown>);

    const initialLegal = (businessInfo.legalName as string) || (branding.companyName as string) || (ws?.name as string) || "";
    const initialTrade = (businessInfo.tradeName as string) || (ws?.name as string) || "";
    const initialType = (businessInfo.businessType as string) || "Interior Design Studio";
    const initialReg = (businessInfo.registrationNumber as string) || "";
    const initialGst = (businessInfo.gstNumber as string) || (wp.tax_id as string) || "";
    const initialPan = (businessInfo.pan as string) || (initialGst.length >= 12 ? initialGst.slice(2, 12).toUpperCase() : "");
    const initialBank = (businessInfo.bankName as string) || "";
    const initialAccount = (businessInfo.accountNumber as string) || "";
    const initialIfsc = (businessInfo.ifscCode as string) || "";
    const initialTerms = (businessInfo.paymentTerms as string) || (boqCosting.paymentTerms as string) || "Net 30";

    const [legalName, setLegalName] = useState(initialLegal);
    const [tradeName, setTradeName] = useState(initialTrade);
    const [businessType, setBusinessType] = useState(initialType);
    const [registrationNumber, setRegistrationNumber] = useState(initialReg);
    const [gstNumber, setGstNumber] = useState(initialGst);
    const [pan, setPan] = useState(initialPan);
    const [bankName, setBankName] = useState(initialBank);
    const [accountNumber, setAccountNumber] = useState(initialAccount);
    const [ifscCode, setIfscCode] = useState(initialIfsc);
    const [paymentTerms, setPaymentTerms] = useState(initialTerms);

    const [panManuallyEdited, setPanManuallyEdited] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!overview) return;
        const currentBoq = ((overview.settings?.["boq-costing"] || overview.settings?.boq_costing || {}) as Record<string, unknown>);
        const currentBranding = ((overview.settings?.branding || {}) as Record<string, unknown>);
        const currentWp = (overview.workspace?.profile as Record<string, unknown>) || {};
        const currentBiz = ((currentBoq.businessInfo || currentBoq.business_info || {}) as Record<string, unknown>);

        const lName = (currentBiz.legalName as string) || (currentBranding.companyName as string) || (overview.workspace?.name as string) || "";
        const tName = (currentBiz.tradeName as string) || (overview.workspace?.name as string) || "";
        const gst = (currentBiz.gstNumber as string) || (currentWp.tax_id as string) || "";

        setLegalName(lName);
        setTradeName(tName);
        setBusinessType((currentBiz.businessType as string) || "Interior Design Studio");
        setRegistrationNumber((currentBiz.registrationNumber as string) || "");
        setGstNumber(gst);
        if (!panManuallyEdited) {
            setPan((currentBiz.pan as string) || (gst.length >= 12 ? gst.slice(2, 12).toUpperCase() : ""));
        }
        setBankName((currentBiz.bankName as string) || "");
        setAccountNumber((currentBiz.accountNumber as string) || "");
        setIfscCode((currentBiz.ifscCode as string) || "");
        setPaymentTerms((currentBiz.paymentTerms as string) || (currentBoq.paymentTerms as string) || "Net 30");
    }, [overview, panManuallyEdited]);

    const handleGstChange = (val: string) => {
        const uppercaseGst = val.toUpperCase().trim();
        setGstNumber(uppercaseGst);
        if (formErrors.gstNumber) {
            setFormErrors((prev) => ({ ...prev, gstNumber: "" }));
        }

        // If PAN hasn't been manually edited and user typed at least 12 characters of GSTIN,
        // extract the 10-character PAN (characters 3-12)
        if (!panManuallyEdited && uppercaseGst.length >= 12) {
            const derivedPan = uppercaseGst.slice(2, 12);
            setPan(derivedPan);
            if (formErrors.pan) {
                setFormErrors((prev) => ({ ...prev, pan: "" }));
            }
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!legalName.trim()) {
            errors.legalName = "Legal Name is required";
        }
        if (!tradeName.trim()) {
            errors.tradeName = "Trade Name is required";
        }
        if (!businessType.trim()) {
            errors.businessType = "Business Type is required";
        }
        if (!registrationNumber.trim()) {
            errors.registrationNumber = "Registration Number is required";
        }
        if (!gstNumber.trim()) {
            errors.gstNumber = "GST Number is required";
        }
        if (!pan.trim()) {
            errors.pan = "PAN is required";
        }
        if (!bankName.trim()) {
            errors.bankName = "Bank Name is required";
        }
        if (!accountNumber.trim()) {
            errors.accountNumber = "Account Number is required";
        }
        if (!ifscCode.trim()) {
            errors.ifscCode = "IFSC Code is required";
        }
        if (!paymentTerms.trim()) {
            errors.paymentTerms = "Payment Terms are required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canEdit) {
            showNotice("You do not have permission to edit business information.", "error");
            return;
        }

        if (!validateForm()) {
            showNotice("Please fill in all required fields.", "error");
            return;
        }

        setSaving(true);
        setFormErrors({});

        try {
            await updateOrganization({
                legalName: legalName.trim(),
                legalEntityName: legalName.trim(),
                tradeName: tradeName.trim(),
                name: tradeName.trim(),
                companyName: tradeName.trim(),
                businessType: businessType.trim(),
                registrationNumber: registrationNumber.trim(),
                gstNumber: gstNumber.trim().toUpperCase(),
                taxId: gstNumber.trim().toUpperCase(),
                gstin: gstNumber.trim().toUpperCase(),
                pan: pan.trim().toUpperCase(),
                bankName: bankName.trim(),
                accountNumber: accountNumber.trim(),
                ifscCode: ifscCode.trim().toUpperCase(),
                paymentTerms: paymentTerms.trim(),
            });

            showNotice("Business information saved successfully.", "success");
            onSaveSuccess();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update business information.";
            showNotice(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    // Ensure options include whatever current values are set
    const businessTypeOptions = Array.from(new Set([...BUSINESS_TYPES, businessType])).filter(Boolean);
    const paymentTermsOptions = Array.from(new Set([...PAYMENT_TERMS_OPTIONS, paymentTerms])).filter(Boolean);

    return (
        <form onSubmit={handleSubmit} className="org-profile-form" noValidate>
            <div className="org-content-card">
                <div className="org-form-grid">
                    {/* ROW 1: Legal Name * | Trade Name * */}
                    <div className="org-field">
                        <label htmlFor="legalName">
                            Legal Name <span className="required">*</span>
                        </label>
                        <input
                            id="legalName"
                            type="text"
                            className={`org-input ${formErrors.legalName ? "has-error" : ""}`}
                            value={legalName}
                            onChange={(e) => {
                                setLegalName(e.target.value);
                                if (formErrors.legalName) setFormErrors((prev) => ({ ...prev, legalName: "" }));
                            }}
                            placeholder="e.g. Arvin Interiors LLP"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.legalName && (
                            <span className="org-field-error" role="alert">{formErrors.legalName}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="tradeName">
                            Trade Name <span className="required">*</span>
                        </label>
                        <input
                            id="tradeName"
                            type="text"
                            className={`org-input ${formErrors.tradeName ? "has-error" : ""}`}
                            value={tradeName}
                            onChange={(e) => {
                                setTradeName(e.target.value);
                                if (formErrors.tradeName) setFormErrors((prev) => ({ ...prev, tradeName: "" }));
                            }}
                            placeholder="e.g. Arvin Interiors"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.tradeName && (
                            <span className="org-field-error" role="alert">{formErrors.tradeName}</span>
                        )}
                    </div>

                    {/* ROW 2: Business Type * | Registration Number * */}
                    <div className="org-field">
                        <label htmlFor="businessType">
                            Business Type <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="businessType"
                                className={`org-select ${formErrors.businessType ? "has-error" : ""}`}
                                value={businessType}
                                onChange={(e) => {
                                    setBusinessType(e.target.value);
                                    if (formErrors.businessType) setFormErrors((prev) => ({ ...prev, businessType: "" }));
                                }}
                                disabled={!canEdit}
                                required
                            >
                                {businessTypeOptions.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formErrors.businessType && (
                            <span className="org-field-error" role="alert">{formErrors.businessType}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="registrationNumber">
                            Registration Number <span className="required">*</span>
                        </label>
                        <input
                            id="registrationNumber"
                            type="text"
                            className={`org-input ${formErrors.registrationNumber ? "has-error" : ""}`}
                            value={registrationNumber}
                            onChange={(e) => {
                                setRegistrationNumber(e.target.value);
                                if (formErrors.registrationNumber) setFormErrors((prev) => ({ ...prev, registrationNumber: "" }));
                            }}
                            placeholder="e.g. AAF-1234"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.registrationNumber && (
                            <span className="org-field-error" role="alert">{formErrors.registrationNumber}</span>
                        )}
                    </div>

                    {/* ROW 3: GST Number * | PAN * */}
                    <div className="org-field">
                        <label htmlFor="gstNumber">
                            GST Number <span className="required">*</span>
                        </label>
                        <input
                            id="gstNumber"
                            type="text"
                            className={`org-input font-mono ${formErrors.gstNumber ? "has-error" : ""}`}
                            value={gstNumber}
                            onChange={(e) => handleGstChange(e.target.value)}
                            placeholder="e.g. 22AAAAA0000A1Z5"
                            maxLength={15}
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.gstNumber && (
                            <span className="org-field-error" role="alert">{formErrors.gstNumber}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="pan">
                            PAN <span className="required">*</span>
                        </label>
                        <input
                            id="pan"
                            type="text"
                            className={`org-input font-mono ${formErrors.pan ? "has-error" : ""}`}
                            value={pan}
                            onChange={(e) => {
                                setPanManuallyEdited(true);
                                setPan(e.target.value.toUpperCase().trim());
                                if (formErrors.pan) setFormErrors((prev) => ({ ...prev, pan: "" }));
                            }}
                            placeholder="e.g. AAAAA0000A"
                            maxLength={10}
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.pan && (
                            <span className="org-field-error" role="alert">{formErrors.pan}</span>
                        )}
                    </div>

                    {/* ROW 4: Bank Name * | Account Number * */}
                    <div className="org-field">
                        <label htmlFor="bankName">
                            Bank Name <span className="required">*</span>
                        </label>
                        <input
                            id="bankName"
                            type="text"
                            className={`org-input ${formErrors.bankName ? "has-error" : ""}`}
                            value={bankName}
                            onChange={(e) => {
                                setBankName(e.target.value);
                                if (formErrors.bankName) setFormErrors((prev) => ({ ...prev, bankName: "" }));
                            }}
                            placeholder="e.g. HDFC Bank"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.bankName && (
                            <span className="org-field-error" role="alert">{formErrors.bankName}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="accountNumber">
                            Account Number <span className="required">*</span>
                        </label>
                        <input
                            id="accountNumber"
                            type="text"
                            className={`org-input font-mono ${formErrors.accountNumber ? "has-error" : ""}`}
                            value={accountNumber}
                            onChange={(e) => {
                                setAccountNumber(e.target.value);
                                if (formErrors.accountNumber) setFormErrors((prev) => ({ ...prev, accountNumber: "" }));
                            }}
                            placeholder="e.g. 50200012345678"
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.accountNumber && (
                            <span className="org-field-error" role="alert">{formErrors.accountNumber}</span>
                        )}
                    </div>

                    {/* ROW 5: IFSC Code * | Payment Terms * */}
                    <div className="org-field">
                        <label htmlFor="ifscCode">
                            IFSC Code <span className="required">*</span>
                        </label>
                        <input
                            id="ifscCode"
                            type="text"
                            className={`org-input font-mono ${formErrors.ifscCode ? "has-error" : ""}`}
                            value={ifscCode}
                            onChange={(e) => {
                                setIfscCode(e.target.value.toUpperCase().trim());
                                if (formErrors.ifscCode) setFormErrors((prev) => ({ ...prev, ifscCode: "" }));
                            }}
                            placeholder="e.g. HDFC0001234"
                            maxLength={11}
                            disabled={!canEdit}
                            required
                        />
                        {formErrors.ifscCode && (
                            <span className="org-field-error" role="alert">{formErrors.ifscCode}</span>
                        )}
                    </div>

                    <div className="org-field">
                        <label htmlFor="paymentTerms">
                            Payment Terms <span className="required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="paymentTerms"
                                className={`org-select ${formErrors.paymentTerms ? "has-error" : ""}`}
                                value={paymentTerms}
                                onChange={(e) => {
                                    setPaymentTerms(e.target.value);
                                    if (formErrors.paymentTerms) setFormErrors((prev) => ({ ...prev, paymentTerms: "" }));
                                }}
                                disabled={!canEdit}
                                required
                            >
                                {paymentTermsOptions.map((term) => (
                                    <option key={term} value={term}>
                                        {term}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formErrors.paymentTerms && (
                            <span className="org-field-error" role="alert">{formErrors.paymentTerms}</span>
                        )}
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
