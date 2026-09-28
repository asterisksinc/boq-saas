import { SettingsOverview } from "@/lib/api/auth";
import {
    ConfigurationHealthCard,
    FormattedRecentChange,
    SettingsOverviewViewModel,
    BoqApprovalRule,
    BoqApprovalSettings,
    BoqCostingSettingsData,
    BoqNumberingSettings,
    BoqPricingRule,
    BoqPricingSettings,
    BoqRevisionRule,
    BoqRevisionSettings,
    BoqTaxRule,
    BoqUnit,
    CategoryMarkup,
    NotificationChannel,
    NotificationEvent,
    NotificationMatrix,
    NotificationSettingsData,
} from "./types";

export function formatStorageBytes(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined) {
        return "—";
    }
    if (bytes === 0) {
        return "0 B";
    }
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "recently";
    }
    const now = new Date();
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffSeconds < 60) {
        return "just now";
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) {
        return `${diffWeeks}w ago`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
        return `${diffMonths}mo ago`;
    }
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
}

export function formatActionDescription(action: string): string {
    const knownActions: Record<string, string> = {
        "settings.branding.updated": "Updated brand identity & colors",
        "settings.branding.asset_uploaded": "Uploaded brand asset",
        "settings.branding.asset_deleted": "Removed brand asset",
        "settings.boq-costing.updated": "Updated BOQ & costing defaults",
        "settings.integrations.updated": "Updated third-party integrations",
        "settings.notifications.updated": "Updated notification preferences",
        "settings.security.updated": "Updated security access policies",
        "settings.advanced.updated": "Updated advanced system settings",
        "user.profile.updated": "Updated profile information",
        "auth.password.changed": "Changed account password",
        "auth.email.verified": "Verified email address",
        "onboarding.updated": "Completed onboarding milestone",
    };

    if (knownActions[action]) {
        return knownActions[action];
    }

    if (action.startsWith("settings.") && action.endsWith(".updated")) {
        const section = action.replace("settings.", "").replace(".updated", "");
        return `Updated ${section.replace("-", " ")} settings`;
    }

    return action
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function deriveConfigurationHealth(overview: SettingsOverview): ConfigurationHealthCard[] {
    const settings = overview.settings || {};
    const workspaceProf = overview.workspace?.profile as Record<string, unknown> | null;
    const branding = ((settings.branding || {}) as Record<string, unknown>);
    const boqCosting = ((settings["boq-costing"] || settings.boq_costing || {}) as Record<string, unknown>);
    const security = ((settings.security || {}) as Record<string, unknown>);
    const integrations = ((settings.integrations || {}) as Record<string, unknown>);

    // 1. Company Profile
    const hasCompanyDetails = Boolean(
        overview.workspace?.name &&
        (workspaceProf?.business_email || workspaceProf?.address || workspaceProf?.phone || workspaceProf?.website)
    );
    const companyCard: ConfigurationHealthCard = {
        id: "company-profile",
        title: "Company Profile",
        subtitle: hasCompanyDetails ? "All required fields filled" : "Profile setup pending",
        status: hasCompanyDetails ? "DONE" : "WARNING",
        iconType: "company",
        tabKey: "organization",
    };

    // 2. Branding
    const hasLogo = Boolean(branding.primaryLogo || branding.logoUrl || workspaceProf?.logo_url);
    const brandingCard: ConfigurationHealthCard = {
        id: "branding",
        title: "Branding",
        subtitle: hasLogo ? "Logo & colors configured" : "Needs logo upload",
        status: hasLogo ? "DONE" : "WARNING",
        iconType: "branding",
        tabKey: "branding",
    };

    // 3. GST / Tax
    const taxId = workspaceProf?.tax_id as string | undefined;
    const defaultTax = boqCosting.defaultTaxPercent as number | undefined;
    const hasTax = Boolean(taxId || defaultTax !== undefined);
    const gstCard: ConfigurationHealthCard = {
        id: "gst-tax",
        title: "GST / Tax",
        subtitle: taxId ? "GSTIN verified" : defaultTax !== undefined ? `Tax rate: ${defaultTax}%` : "GST / Tax pending",
        status: hasTax ? "DONE" : "WARNING",
        iconType: "gst",
        tabKey: "boq-costing",
    };

    // 4. BOQ Defaults
    const hasBoqDefaults = Boolean(
        boqCosting.defaultTaxPercent !== undefined ||
        boqCosting.defaultMarkupPercent !== undefined ||
        boqCosting.currency
    );
    const boqCard: ConfigurationHealthCard = {
        id: "boq-defaults",
        title: "BOQ Defaults",
        subtitle: hasBoqDefaults ? "Markup & tax configured" : "Defaults pending setup",
        status: hasBoqDefaults ? "DONE" : "WARNING",
        iconType: "boq",
        tabKey: "boq-costing",
    };

    // 5. Templates
    const templateCount = overview.usage.templates ?? 0;
    const templateCard: ConfigurationHealthCard = {
        id: "templates",
        title: "Templates",
        subtitle: templateCount > 0
            ? `${templateCount} custom template${templateCount > 1 ? "s" : ""}`
            : "0 custom templates",
        status: templateCount > 0 ? "DONE" : "WARNING",
        iconType: "templates",
        route: "/templates",
    };

    // 6. Security
    const twoFactor = Boolean(security.twoFactorRequired);
    const securityCard: ConfigurationHealthCard = {
        id: "security",
        title: "Security",
        subtitle: twoFactor ? "2FA enabled" : "Password & session secured",
        status: "DONE",
        iconType: "security",
        tabKey: "security",
    };

    // 7. Integrations
    let connectedCount = 0;
    if (integrations && typeof integrations === "object") {
        for (const val of Object.values(integrations)) {
            if (val && typeof val === "object" && (val as Record<string, unknown>).connected) {
                connectedCount++;
            }
        }
    }
    const integrationsCard: ConfigurationHealthCard = {
        id: "integrations",
        title: "Integrations",
        subtitle: connectedCount > 0 ? `${connectedCount} connected` : "None connected",
        status: "DONE",
        iconType: "integrations",
        tabKey: "integrations",
    };

    return [companyCard, brandingCard, gstCard, boqCard, templateCard, securityCard, integrationsCard];
}

export function adaptOverview(overview: SettingsOverview): SettingsOverviewViewModel {
    const displayName = overview.profile?.displayName?.trim() || "User";
    const parts = displayName.split(/\s+/);
    const initials = parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : displayName.slice(0, 2).toUpperCase();

    const roleName = overview.role
        ? overview.role.charAt(0).toUpperCase() + overview.role.slice(1).toLowerCase()
        : "Owner";

    const formattedChanges: FormattedRecentChange[] = (overview.recentChanges || []).map((change) => {
        const actorName = change.actorName || displayName;
        const actorParts = actorName.trim().split(/\s+/);
        const actorInitials = change.actorInitials || (
            actorParts.length > 1
                ? (actorParts[0][0] + actorParts[1][0]).toUpperCase()
                : actorName.slice(0, 2).toUpperCase()
        );

        return {
            id: change.id,
            action: change.action,
            description: formatActionDescription(change.action),
            timeAgo: formatTimeAgo(change.createdAt),
            actorName,
            actorAvatarUrl: change.actorAvatarUrl || null,
            actorInitials,
        };
    });

    return {
        profile: {
            name: displayName,
            email: overview.profile?.email || "",
            role: roleName,
            avatarUrl: overview.profile?.avatarUrl || null,
            initials,
            completionPercent: Math.min(100, Math.max(0, overview.completionPercent ?? 0)),
        },
        usage: {
            projects: overview.usage.projects ?? 0,
            boqs: overview.usage.boqs ?? 0,
            templates: overview.usage.templates ?? 0,
            storage: formatStorageBytes(overview.usage.storageBytes),
        },
        healthCards: deriveConfigurationHealth(overview),
        recentChanges: formattedChanges,
    };
}

// ── BOQ & Costing Defaults & Adapter ────────────────────────────────────────

export const DEFAULT_BOQ_UNITS: BoqUnit[] = [
    { id: "unit-1", name: "Piece", code: "Pc", type: "Count", decimals: 0, active: true, isCustom: false },
    { id: "unit-2", name: "Set", code: "Set", type: "Count", decimals: 0, active: true, isCustom: false },
    { id: "unit-3", name: "Sq ft", code: "sft", type: "Area", decimals: 2, active: true, isCustom: false },
    { id: "unit-4", name: "Sq m", code: "sqm", type: "Area", decimals: 2, active: true, isCustom: false },
    { id: "unit-5", name: "Running ft", code: "rft", type: "Length", decimals: 2, active: true, isCustom: false },
    { id: "unit-6", name: "Running m", code: "rm", type: "Length", decimals: 2, active: true, isCustom: false },
    { id: "unit-7", name: "Kg", code: "Kg", type: "Weight", decimals: 2, active: true, isCustom: false },
    { id: "unit-8", name: "Litre", code: "L", type: "Volume", decimals: 1, active: true, isCustom: false },
    { id: "unit-9", name: "Hour", code: "Hr", type: "Time", decimals: 1, active: true, isCustom: false },
    { id: "unit-10", name: "Day", code: "Day", type: "Time", decimals: 0, active: true, isCustom: false },
    { id: "unit-11", name: "Trip", code: "Trip", type: "Count", decimals: 0, active: true, isCustom: false },
    { id: "unit-12", name: "Project", code: "Proj", type: "Count", decimals: 0, active: true, isCustom: false },
];

export const DEFAULT_BOQ_NUMBERING: BoqNumberingSettings = {
    boqPrefix: "BOQ",
    projectPrefix: "PRJ",
    financialYear: "2025-26",
    sequenceFormat: "Year-based",
    revisionFormat: "REV-##",
};

export const DEFAULT_BOQ_TAX_RULES: BoqTaxRule[] = [
    { id: "tax-1", name: "GST 18%", code: "GST18", rate: 18, inclusive: false, active: true },
    { id: "tax-2", name: "GST 12%", code: "GST12", rate: 12, inclusive: false, active: true },
    { id: "tax-3", name: "GST 5%", code: "GST05", rate: 5, inclusive: false, active: true },
    { id: "tax-4", name: "GST 28%", code: "GST28", rate: 28, inclusive: false, active: true },
    { id: "tax-5", name: "Export 0%", code: "EXPO", rate: 0, inclusive: false, active: true },
];

export const DEFAULT_CATEGORY_MARKUPS: CategoryMarkup[] = [
    { id: "cat-furniture", name: "Furniture", markupPercent: 20 },
    { id: "cat-civil", name: "Civil Works", markupPercent: 15 },
    { id: "cat-electrical", name: "Electrical", markupPercent: 18 },
    { id: "cat-flooring", name: "Flooring", markupPercent: 12 },
];

export const DEFAULT_BOQ_PRICING_SETTINGS: BoqPricingSettings = {
    defaultMarkupPercent: 18,
    categoryMarkups: DEFAULT_CATEGORY_MARKUPS,
    discountLimitPercent: 10,
    marginThresholdPercent: 25,
    wastagePercent: 5,
    contingencyPercent: 3,
    rounding: "Nearest ₹10",
};

export const DEFAULT_BOQ_REVISION_SETTINGS: BoqRevisionSettings = {
    autoRevisionNumbering: true,
    revisionReasonRequired: true,
    lockApprovedVersions: true,
    reopenAfterApproval: true,
    compareVersions: true,
};

export const DEFAULT_BOQ_APPROVAL_SETTINGS: BoqApprovalSettings = {
    internalApprovalRequired: true,
    clientApprovalRequired: true,
    minValueForApproval: 500000,
    discountApprovalThresholdPercent: 5,
    marginApprovalThresholdPercent: 20,
};

export const ROUNDING_OPTIONS = [
    { label: "No Rounding", value: "none" },
    { label: "Nearest ₹1", value: "Nearest ₹1" },
    { label: "Nearest ₹5", value: "Nearest ₹5" },
    { label: "Nearest ₹10", value: "Nearest ₹10" },
    { label: "Nearest ₹50", value: "Nearest ₹50" },
    { label: "Nearest ₹100", value: "Nearest ₹100" },
    { label: "Nearest ₹1,000", value: "Nearest ₹1,000" },
];

export function calculatePricingPreview(
    baseCost: number | null | undefined,
    markupPercent: number,
    taxRate: number,
    rounding: string
) {
    if (baseCost === null || baseCost === undefined || isNaN(baseCost) || baseCost <= 0) {
        return {
            markupAmount: null,
            preTaxPrice: null,
            taxAmount: null,
            finalPrice: null,
            grossMarginPercent: null,
        };
    }

    const markupAmount = (baseCost * markupPercent) / 100;
    const rawSellingPrice = baseCost + markupAmount;

    let sellingPrice = rawSellingPrice;
    if (rounding === "Nearest ₹1") sellingPrice = Math.round(rawSellingPrice);
    else if (rounding === "Nearest ₹5") sellingPrice = Math.round(rawSellingPrice / 5) * 5;
    else if (rounding === "Nearest ₹10") sellingPrice = Math.round(rawSellingPrice / 10) * 10;
    else if (rounding === "Nearest ₹50") sellingPrice = Math.round(rawSellingPrice / 50) * 50;
    else if (rounding === "Nearest ₹100") sellingPrice = Math.round(rawSellingPrice / 100) * 100;
    else if (rounding === "Nearest ₹1,000") sellingPrice = Math.round(rawSellingPrice / 1000) * 1000;

    const effectiveMarkup = sellingPrice - baseCost;
    const taxAmount = (sellingPrice * taxRate) / 100;
    const finalPrice = sellingPrice + taxAmount;
    const grossMarginPercent = sellingPrice > 0 ? (effectiveMarkup / sellingPrice) * 100 : 0;

    return {
        markupAmount: Math.round(effectiveMarkup * 100) / 100,
        preTaxPrice: Math.round(sellingPrice * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        finalPrice: Math.round(finalPrice * 100) / 100,
        grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
    };
}

export function formatIndianNumber(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === "") return "";
    const numVal = typeof val === "number" ? val : Number(String(val).replace(/,/g, ""));
    if (isNaN(numVal)) return String(val);
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(numVal);
}

export function parseIndianNumber(val: string): number {
    const cleaned = val.replace(/,/g, "").trim();
    const numVal = Number(cleaned);
    return isNaN(numVal) ? 0 : numVal;
}

export const DEFAULT_BOQ_PRICING_RULES: BoqPricingRule[] = [
    { id: "pr-1", name: "Standard Material Markup", appliesTo: "Material", type: "Markup", ratePercent: 15, active: true },
    { id: "pr-2", name: "Standard Waste Factor", appliesTo: "Material", type: "Wastage", ratePercent: 5, active: true },
    { id: "pr-3", name: "Labor Overhead Markup", appliesTo: "Labor", type: "Overhead", ratePercent: 10, active: true },
    { id: "pr-4", name: "Subcontractor Handling", appliesTo: "Subcontractor", type: "Markup", ratePercent: 8, active: true },
];

export const DEFAULT_BOQ_REVISION_RULES: BoqRevisionRule[] = [
    { id: "rev-1", ruleName: "Auto-increment on re-export", triggerEvent: "BOQ Re-export", requiresApproval: false, active: true, description: "Generates next REV number when re-exporting altered BOQ" },
    { id: "rev-2", ruleName: "Major scope change review", triggerEvent: "Scope Change (> 10%)", requiresApproval: true, active: true, description: "Flags for approval when line item total exceeds 10% variance" },
    { id: "rev-3", ruleName: "Client revision request lock", triggerEvent: "Client Feedback", requiresApproval: false, active: true, description: "Creates snapshot of previous estimate before revising" },
];

export const DEFAULT_BOQ_APPROVAL_RULES: BoqApprovalRule[] = [
    { id: "app-1", ruleName: "High Value BOQ (> ₹10,00,000)", threshold: "Amount > ₹10,00,000", approverRole: "Owner", sequenceOrder: 1, active: true },
    { id: "app-2", ruleName: "Low Gross Margin (< 15%)", threshold: "Gross Margin < 15%", approverRole: "Admin", sequenceOrder: 2, active: true },
    { id: "app-3", ruleName: "Special Discount Exceeds 10%", threshold: "Discount > 10%", approverRole: "Admin", sequenceOrder: 3, active: true },
    { id: "app-4", ruleName: "Standard Project BOQ Sign-off", threshold: "All Estimates", approverRole: "Project Manager", sequenceOrder: 4, active: true },
];

export function generateNumberingPreview(settings: BoqNumberingSettings): string {
    const boqPrefix = settings?.boqPrefix !== undefined ? settings.boqPrefix.trim() : "BOQ";
    const prjPrefix = settings?.projectPrefix !== undefined ? settings.projectPrefix.trim() : "PRJ";
    const fy = settings?.financialYear?.trim() || "2025-26";
    const seqFormat = settings?.sequenceFormat || "Year-based";
    const revFormat = settings?.revisionFormat !== undefined ? settings.revisionFormat.trim() : "REV-##";

    let yearPart = "2026";
    const fyMatch = fy.match(/(\d{4})[/-](\d{2,4})/);
    if (fyMatch) {
        const endYear = fyMatch[2];
        yearPart = endYear.length === 2 ? `${fyMatch[1].slice(0, 2)}${endYear}` : endYear;
    } else {
        const singleYear = fy.match(/\d{4}/);
        if (singleYear) yearPart = singleYear[0];
    }

    let formattedRev = "REV03";
    if (revFormat.includes("##")) {
        formattedRev = revFormat.replace(/##/g, "03").replace(/-/g, "");
    } else if (revFormat.includes("#")) {
        formattedRev = revFormat.replace(/#+/g, "3").replace(/-/g, "");
    } else if (revFormat) {
        formattedRev = revFormat.replace(/^-+/, "");
    }

    const parts: string[] = [];
    if (seqFormat.includes("Project")) {
        if (prjPrefix) parts.push(prjPrefix);
        parts.push("014");
        if (boqPrefix) parts.push(boqPrefix);
    } else if (seqFormat.includes("Sequential") || seqFormat.includes("Simple")) {
        if (boqPrefix) parts.push(boqPrefix);
        parts.push("0014");
    } else if (seqFormat.includes("Monthly")) {
        if (boqPrefix) parts.push(boqPrefix);
        parts.push(`${yearPart}09`);
        parts.push("014");
    } else {
        if (boqPrefix) parts.push(boqPrefix);
        parts.push(yearPart);
        parts.push("014");
    }

    if (formattedRev) {
        parts.push(formattedRev);
    }

    return parts.filter(Boolean).join("-");
}

export function adaptBoqCostingSettings(raw: unknown): BoqCostingSettingsData {
    const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

    const defaultTaxPercent = typeof data.defaultTaxPercent === "number" ? data.defaultTaxPercent : (typeof data.default_tax_percent === "number" ? data.default_tax_percent : 18);
    const defaultMarkupPercent = typeof data.defaultMarkupPercent === "number" ? data.defaultMarkupPercent : (typeof data.default_markup_percent === "number" ? data.default_markup_percent : 15);
    const defaultWastePercent = typeof data.defaultWastePercent === "number" ? data.defaultWastePercent : (typeof data.default_waste_percent === "number" ? data.default_waste_percent : 5);
    const currency = typeof data.currency === "string" ? data.currency : "INR";
    const numberFormat = typeof data.numberFormat === "string" ? data.numberFormat : (typeof data.number_format === "string" ? data.number_format : "indian");

    const rawUnits = Array.isArray(data.units) ? data.units : null;
    const units: BoqUnit[] = rawUnits
        ? rawUnits.map((u: any, idx: number) => ({
            id: String(u.id || `unit-${idx + 1}`),
            name: String(u.name || "Custom Unit"),
            code: String(u.code || u.shortCode || u.short_code || "U"),
            type: (u.type as any) || "Count",
            decimals: typeof u.decimals === "number" ? u.decimals : (typeof u.decimalPlaces === "number" ? u.decimalPlaces : (typeof u.decimal_places === "number" ? u.decimal_places : 0)),
            active: u.active !== undefined ? Boolean(u.active) : (u.isActive !== undefined ? Boolean(u.isActive) : (u.is_active !== undefined ? Boolean(u.is_active) : true)),
            isCustom: Boolean(u.isCustom ?? u.is_custom),
            createdAt: u.createdAt || u.created_at,
        }))
        : DEFAULT_BOQ_UNITS;

    const rawNumbering = (data.numbering && typeof data.numbering === "object" ? data.numbering : {}) as Record<string, unknown>;
    const numbering: BoqNumberingSettings = {
        boqPrefix: String(rawNumbering.boqPrefix !== undefined ? rawNumbering.boqPrefix : (rawNumbering.boq_prefix !== undefined ? rawNumbering.boq_prefix : DEFAULT_BOQ_NUMBERING.boqPrefix)),
        projectPrefix: String(rawNumbering.projectPrefix !== undefined ? rawNumbering.projectPrefix : (rawNumbering.project_prefix !== undefined ? rawNumbering.project_prefix : DEFAULT_BOQ_NUMBERING.projectPrefix)),
        financialYear: String(rawNumbering.financialYear || rawNumbering.financial_year || DEFAULT_BOQ_NUMBERING.financialYear),
        sequenceFormat: String(rawNumbering.sequenceFormat || rawNumbering.sequence_format || DEFAULT_BOQ_NUMBERING.sequenceFormat),
        revisionFormat: String(rawNumbering.revisionFormat || rawNumbering.revision_format || DEFAULT_BOQ_NUMBERING.revisionFormat),
    };

    const rawTaxRules = Array.isArray(data.taxRules) ? data.taxRules : (Array.isArray(data.tax_rules) ? data.tax_rules : null);
    const taxRules: BoqTaxRule[] = rawTaxRules
        ? rawTaxRules.map((t: any, idx: number) => ({
            id: String(t.id || `tax-${idx + 1}`),
            name: String(t.name || `Tax ${idx + 1}`),
            code: String(t.code || `TAX${idx + 1}`),
            rate: typeof t.rate === "number" ? t.rate : Number(t.rate) || 0,
            inclusive: Boolean(t.inclusive ?? t.isInclusive ?? t.is_inclusive),
            active: t.active !== undefined ? Boolean(t.active) : (t.isActive !== undefined ? Boolean(t.isActive) : (t.is_active !== undefined ? Boolean(t.is_active) : true)),
            createdAt: t.createdAt || t.created_at,
        }))
        : DEFAULT_BOQ_TAX_RULES;

    const rawPricing = Array.isArray(data.pricingRules) ? data.pricingRules : (Array.isArray(data.pricing_rules) ? data.pricing_rules : null);
    const pricingRules: BoqPricingRule[] = rawPricing
        ? rawPricing.map((p: any, idx: number) => ({
            id: String(p.id || `pr-${idx + 1}`),
            name: String(p.name || `Rule ${idx + 1}`),
            appliesTo: String(p.appliesTo || p.applies_to || "All Categories"),
            type: String(p.type || "Markup"),
            ratePercent: typeof p.ratePercent === "number" ? p.ratePercent : Number(p.ratePercent) || 0,
            active: p.active !== undefined ? Boolean(p.active) : (p.isActive !== undefined ? Boolean(p.isActive) : (p.is_active !== undefined ? Boolean(p.is_active) : true)),
            createdAt: p.createdAt || p.created_at,
        }))
        : DEFAULT_BOQ_PRICING_RULES;

    const rawRevision = Array.isArray(data.revisionRules) ? data.revisionRules : (Array.isArray(data.revision_rules) ? data.revision_rules : null);
    const revisionRules: BoqRevisionRule[] = rawRevision
        ? rawRevision.map((r: any, idx: number) => ({
            id: String(r.id || `rev-${idx + 1}`),
            ruleName: String(r.ruleName || r.rule_name || `Revision Rule ${idx + 1}`),
            triggerEvent: String(r.triggerEvent || r.trigger_event || "Manual Update"),
            requiresApproval: Boolean(r.requiresApproval ?? r.requires_approval),
            active: r.active !== undefined ? Boolean(r.active) : (r.isActive !== undefined ? Boolean(r.isActive) : (r.is_active !== undefined ? Boolean(r.is_active) : true)),
            description: r.description ? String(r.description) : undefined,
        }))
        : DEFAULT_BOQ_REVISION_RULES;

    const rawApproval = Array.isArray(data.approvalRules) ? data.approvalRules : (Array.isArray(data.approval_rules) ? data.approval_rules : null);
    const approvalRules: BoqApprovalRule[] = rawApproval
        ? rawApproval.map((a: any, idx: number) => ({
            id: String(a.id || `app-${idx + 1}`),
            ruleName: String(a.ruleName || a.rule_name || `Approval Rule ${idx + 1}`),
            threshold: String(a.threshold || "All"),
            approverRole: String(a.approverRole || a.approver_role || "Owner"),
            sequenceOrder: typeof a.sequenceOrder === "number" ? a.sequenceOrder : (typeof a.sequence_order === "number" ? a.sequence_order : idx + 1),
            active: a.active !== undefined ? Boolean(a.active) : (a.isActive !== undefined ? Boolean(a.isActive) : (a.is_active !== undefined ? Boolean(a.is_active) : true)),
        }))
        : DEFAULT_BOQ_APPROVAL_RULES;

    // ── Refined Pricing Settings (Screenshot 1) ──────────────────────────────
    const rawPricingObj = (data.pricing && typeof data.pricing === "object" ? data.pricing : {}) as Record<string, unknown>;
    const defaultMarkup = typeof rawPricingObj.defaultMarkupPercent === "number"
        ? rawPricingObj.defaultMarkupPercent
        : (typeof data.defaultMarkupPercent === "number"
            ? data.defaultMarkupPercent
            : (typeof data.default_markup_percent === "number" ? data.default_markup_percent : 18));

    const rawCategoryMarkups = Array.isArray(rawPricingObj.categoryMarkups)
        ? rawPricingObj.categoryMarkups
        : (Array.isArray(data.categoryMarkups)
            ? data.categoryMarkups
            : (Array.isArray(data.category_markups) ? data.category_markups : null));

    const categoryMarkups: CategoryMarkup[] = rawCategoryMarkups
        ? rawCategoryMarkups.map((c: any, idx: number) => ({
            id: String(c.id || `cat-${idx + 1}`),
            name: String(c.name || `Category ${idx + 1}`),
            markupPercent: typeof c.markupPercent === "number"
                ? c.markupPercent
                : (typeof c.markup_percent === "number" ? c.markup_percent : Number(c.markup) || 0),
        }))
        : DEFAULT_CATEGORY_MARKUPS;

    const discountLimit = typeof rawPricingObj.discountLimitPercent === "number"
        ? rawPricingObj.discountLimitPercent
        : (typeof data.discountLimitPercent === "number"
            ? data.discountLimitPercent
            : (typeof data.discount_limit_percent === "number" ? data.discount_limit_percent : 10));

    const marginThreshold = typeof rawPricingObj.marginThresholdPercent === "number"
        ? rawPricingObj.marginThresholdPercent
        : (typeof data.marginThresholdPercent === "number"
            ? data.marginThresholdPercent
            : (typeof data.margin_threshold_percent === "number" ? data.margin_threshold_percent : 25));

    const wastage = typeof rawPricingObj.wastagePercent === "number"
        ? rawPricingObj.wastagePercent
        : (typeof data.wastagePercent === "number"
            ? data.wastagePercent
            : (typeof data.wasteagePercent === "number"
                ? data.wasteagePercent
                : (typeof data.defaultWastePercent === "number"
                    ? data.defaultWastePercent
                    : (typeof data.default_waste_percent === "number" ? data.default_waste_percent : 5))));

    const contingency = typeof rawPricingObj.contingencyPercent === "number"
        ? rawPricingObj.contingencyPercent
        : (typeof data.contingencyPercent === "number"
            ? data.contingencyPercent
            : (typeof data.contingency_percent === "number" ? data.contingency_percent : 3));

    const rounding = typeof rawPricingObj.rounding === "string"
        ? rawPricingObj.rounding
        : (typeof data.rounding === "string" ? data.rounding : "Nearest ₹10");

    const pricing: BoqPricingSettings = {
        defaultMarkupPercent: defaultMarkup,
        categoryMarkups,
        discountLimitPercent: discountLimit,
        marginThresholdPercent: marginThreshold,
        wastagePercent: wastage,
        contingencyPercent: contingency,
        rounding,
    };

    // ── Refined Revision Settings (Screenshot 2) ─────────────────────────────
    const rawRevObj = (data.revision && typeof data.revision === "object" ? data.revision : {}) as Record<string, unknown>;
    const revision: BoqRevisionSettings = {
        autoRevisionNumbering: rawRevObj.autoRevisionNumbering !== undefined
            ? Boolean(rawRevObj.autoRevisionNumbering)
            : (data.autoRevisionNumbering !== undefined ? Boolean(data.autoRevisionNumbering) : true),
        revisionReasonRequired: rawRevObj.revisionReasonRequired !== undefined
            ? Boolean(rawRevObj.revisionReasonRequired)
            : (data.revisionReasonRequired !== undefined ? Boolean(data.revisionReasonRequired) : true),
        lockApprovedVersions: rawRevObj.lockApprovedVersions !== undefined
            ? Boolean(rawRevObj.lockApprovedVersions)
            : (data.lockApprovedVersions !== undefined ? Boolean(data.lockApprovedVersions) : true),
        reopenAfterApproval: rawRevObj.reopenAfterApproval !== undefined
            ? Boolean(rawRevObj.reopenAfterApproval)
            : (data.reopenAfterApproval !== undefined ? Boolean(data.reopenAfterApproval) : true),
        compareVersions: rawRevObj.compareVersions !== undefined
            ? Boolean(rawRevObj.compareVersions)
            : (data.compareVersions !== undefined ? Boolean(data.compareVersions) : true),
    };

    // ── Refined Approval Settings (Screenshot 3) ─────────────────────────────
    const rawAppObj = (data.approval && typeof data.approval === "object" ? data.approval : {}) as Record<string, unknown>;
    const approval: BoqApprovalSettings = {
        internalApprovalRequired: rawAppObj.internalApprovalRequired !== undefined
            ? Boolean(rawAppObj.internalApprovalRequired)
            : (data.internalApprovalRequired !== undefined ? Boolean(data.internalApprovalRequired) : true),
        clientApprovalRequired: rawAppObj.clientApprovalRequired !== undefined
            ? Boolean(rawAppObj.clientApprovalRequired)
            : (data.clientApprovalRequired !== undefined ? Boolean(data.clientApprovalRequired) : true),
        minValueForApproval: typeof rawAppObj.minValueForApproval === "number"
            ? rawAppObj.minValueForApproval
            : (typeof data.minValueForApproval === "number"
                ? data.minValueForApproval
                : (typeof data.min_value_for_approval === "number" ? data.min_value_for_approval : 500000)),
        discountApprovalThresholdPercent: typeof rawAppObj.discountApprovalThresholdPercent === "number"
            ? rawAppObj.discountApprovalThresholdPercent
            : (typeof data.discountApprovalThresholdPercent === "number"
                ? data.discountApprovalThresholdPercent
                : (typeof data.discount_approval_threshold_percent === "number" ? data.discount_approval_threshold_percent : 5)),
        marginApprovalThresholdPercent: typeof rawAppObj.marginApprovalThresholdPercent === "number"
            ? rawAppObj.marginApprovalThresholdPercent
            : (typeof data.marginApprovalThresholdPercent === "number"
                ? data.marginApprovalThresholdPercent
                : (typeof data.margin_approval_threshold_percent === "number" ? data.margin_approval_threshold_percent : 20)),
    };

    return {
        ...data,
        defaultTaxPercent,
        defaultMarkupPercent: defaultMarkup,
        defaultWastePercent: wastage,
        currency,
        numberFormat,
        units,
        numbering,
        taxRules,
        pricing,
        revision,
        approval,
        pricingRules,
        revisionRules,
        approvalRules,
    };
}

// ── Notification Settings Constants & Adapter ───────────────────────────────

export const NOTIFICATION_ROWS: Array<{
    id: NotificationEvent;
    label: string;
}> = [
    { id: "boq_approval", label: "BOQ Approval" },
    { id: "payment_alert", label: "Payment Alert" },
    { id: "document_shared", label: "Document Shared" },
    { id: "new_comment", label: "New Comment" },
    { id: "task_due", label: "Task Due" },
    { id: "weekly_digest", label: "Weekly Digest" },
    { id: "marketing", label: "Marketing" },
];

export const NOTIFICATION_CHANNELS: Array<{
    id: NotificationChannel;
    label: string;
}> = [
    { id: "email", label: "EMAIL" },
    { id: "in_app", label: "IN-APP" },
    { id: "push", label: "PUSH" },
    { id: "whatsapp", label: "WHATSAPP" },
];

export const DEFAULT_NOTIFICATION_MATRIX: NotificationMatrix = {
    boq_approval: { email: true, in_app: true, push: true, whatsapp: true },
    payment_alert: { email: true, in_app: true, push: true, whatsapp: true },
    document_shared: { email: true, in_app: true, push: true, whatsapp: true },
    new_comment: { email: true, in_app: true, push: true, whatsapp: true },
    task_due: { email: true, in_app: true, push: true, whatsapp: true },
    weekly_digest: { email: true, in_app: true, push: true, whatsapp: true },
    marketing: { email: true, in_app: true, push: true, whatsapp: true },
};

export function adaptNotificationSettings(raw: unknown): NotificationMatrix {
    const matrix: NotificationMatrix = {
        boq_approval: { ...DEFAULT_NOTIFICATION_MATRIX.boq_approval },
        payment_alert: { ...DEFAULT_NOTIFICATION_MATRIX.payment_alert },
        document_shared: { ...DEFAULT_NOTIFICATION_MATRIX.document_shared },
        new_comment: { ...DEFAULT_NOTIFICATION_MATRIX.new_comment },
        task_due: { ...DEFAULT_NOTIFICATION_MATRIX.task_due },
        weekly_digest: { ...DEFAULT_NOTIFICATION_MATRIX.weekly_digest },
        marketing: { ...DEFAULT_NOTIFICATION_MATRIX.marketing },
    };

    if (!raw || typeof raw !== "object") {
        return matrix;
    }

    const obj = raw as Record<string, unknown>;

    // If explicit matrix exists in stored settings:
    if (obj.matrix && typeof obj.matrix === "object") {
        const storedMatrix = obj.matrix as Record<string, Record<string, unknown>>;
        for (const row of NOTIFICATION_ROWS) {
            const eventKey = row.id;
            if (storedMatrix[eventKey] && typeof storedMatrix[eventKey] === "object") {
                for (const channel of NOTIFICATION_CHANNELS) {
                    const channelKey = channel.id;
                    const val = storedMatrix[eventKey][channelKey];
                    if (typeof val === "boolean") {
                        matrix[eventKey][channelKey] = val;
                    }
                }
            }
        }
        return matrix;
    }

    // If legacy keys exist without matrix
    if (typeof obj.email === "boolean" && !obj.email) {
        for (const row of NOTIFICATION_ROWS) {
            matrix[row.id].email = false;
        }
    }
    if (typeof obj.approvals === "boolean") {
        matrix.boq_approval.email = obj.approvals;
        matrix.boq_approval.in_app = obj.approvals;
    }
    if (typeof obj.billing === "boolean") {
        matrix.payment_alert.email = obj.billing;
        matrix.payment_alert.in_app = obj.billing;
    }
    if (typeof obj.tasks === "boolean") {
        matrix.task_due.email = obj.tasks;
        matrix.task_due.in_app = obj.tasks;
    }
    if (typeof obj.weeklyDigest === "boolean") {
        matrix.weekly_digest.email = obj.weeklyDigest;
    }

    return matrix;
}

export function serializeNotificationSettings(matrix: NotificationMatrix): NotificationSettingsData {
    return {
        matrix,
        // Keep legacy keys in sync for backward compatibility
        email: Object.values(matrix).some((row) => row.email),
        approvals: matrix.boq_approval.email || matrix.boq_approval.in_app,
        billing: matrix.payment_alert.email || matrix.payment_alert.in_app,
        tasks: matrix.task_due.email || matrix.task_due.in_app,
        weeklyDigest: matrix.weekly_digest.email,
    };
}

