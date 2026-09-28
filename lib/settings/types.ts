export type SettingsTab =
    | "overview"
    | "profile"
    | "organization"
    | "branding"
    | "boq-costing"
    | "integrations"
    | "notifications"
    | "security"
    | "advanced"
    | "additional";

export interface SettingsNavItem {
    key: SettingsTab;
    label: string;
}

export type HealthStatus = "DONE" | "WARNING" | "ERROR";

export type HealthIconType =
    | "company"
    | "branding"
    | "gst"
    | "boq"
    | "templates"
    | "security"
    | "integrations";

export interface ConfigurationHealthCard {
    id: string;
    title: string;
    subtitle: string;
    status: HealthStatus;
    iconType: HealthIconType;
    route?: string;
    tabKey?: SettingsTab;
}

export interface FormattedRecentChange {
    id: string;
    action: string;
    description: string;
    timeAgo: string;
    actorName: string;
    actorAvatarUrl: string | null;
    actorInitials: string;
}

export interface SettingsOverviewViewModel {
    profile: {
        name: string;
        email: string;
        role: string;
        avatarUrl: string | null;
        initials: string;
        completionPercent: number;
    };
    usage: {
        projects: number;
        boqs: number;
        templates: number;
        storage: string;
    };
    healthCards: ConfigurationHealthCard[];
    recentChanges: FormattedRecentChange[];
}

export type BrandSubTab = "brand-assets" | "brand-system" | "document-preview";

export type BrandAssetType =
    | "primaryLogo"
    | "lightLogo"
    | "darkLogo"
    | "favicon"
    | "signature";

export type ButtonStyle = "rounded" | "square" | "pill";
export type DocumentSpacing = "compact" | "standard" | "spacious";
export type DocumentPreviewType = "boq" | "proposal" | "invoice" | "email";

export interface BrandColors {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
}

export interface BrandingSettings {
    primaryLogo?: string | null;
    lightLogo?: string | null;
    darkLogo?: string | null;
    favicon?: string | null;
    signature?: string | null;
    colors: BrandColors;
    font: string;
    buttonStyle: ButtonStyle;
    documentSpacing: DocumentSpacing;
    companyName?: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    status?: string;
}

export interface BrandingPreviewData {
    organization: {
        name: string;
        address: string;
        phone: string;
        email: string;
        website?: string | null;
        taxId?: string | null;
    };
    boq: {
        number: string;
        title: string;
        amount: number;
        items: Array<{ name: string; amount: number }>;
    };
    proposal: {
        number: string;
        projectName: string;
        amount: number;
        items: Array<{ name: string; amount: number }>;
    };
    invoice: {
        number: string;
        projectName: string;
        amount: number;
        items: Array<{ name: string; amount: number }>;
    };
    email: {
        subject: string;
        greeting: string;
        body: string;
        ctaText: string;
    };
}

// ── BOQ & Costing Sub-Navigation & Domain Types ─────────────────────────────

export type BoqCostingSubTab =
    | "units"
    | "numbering"
    | "tax-rules"
    | "pricing-rules"
    | "revision-rules"
    | "approval-rules";

export type UnitType = "Count" | "Area" | "Length" | "Weight" | "Volume" | "Time" | "Other";

export interface BoqUnit {
    id: string;
    name: string;
    code: string;
    type: UnitType;
    decimals: number;
    active: boolean;
    isCustom?: boolean;
    createdAt?: string;
}

export interface BoqNumberingSettings {
    boqPrefix: string;
    projectPrefix: string;
    financialYear: string;
    sequenceFormat: string;
    revisionFormat: string;
}

export interface BoqTaxRule {
    id: string;
    name: string;
    code: string;
    rate: number;
    inclusive: boolean;
    active: boolean;
    createdAt?: string;
}

export interface CategoryMarkup {
    id: string;
    name: string;
    markupPercent: number;
}

export interface BoqPricingSettings {
    defaultMarkupPercent: number;
    categoryMarkups: CategoryMarkup[];
    discountLimitPercent: number;
    marginThresholdPercent: number;
    wastagePercent: number;
    contingencyPercent: number;
    rounding: string;
}

export interface BoqRevisionSettings {
    autoRevisionNumbering: boolean;
    revisionReasonRequired: boolean;
    lockApprovedVersions: boolean;
    reopenAfterApproval: boolean;
    compareVersions: boolean;
}

export interface BoqApprovalSettings {
    internalApprovalRequired: boolean;
    clientApprovalRequired: boolean;
    minValueForApproval: number;
    discountApprovalThresholdPercent: number;
    marginApprovalThresholdPercent: number;
}

export interface BoqPricingRule {
    id: string;
    name: string;
    appliesTo: string;
    type: string;
    ratePercent: number;
    active: boolean;
    createdAt?: string;
}

export interface BoqRevisionRule {
    id: string;
    ruleName: string;
    triggerEvent: string;
    requiresApproval: boolean;
    active: boolean;
    description?: string;
}

export interface BoqApprovalRule {
    id: string;
    ruleName: string;
    threshold: string;
    approverRole: string;
    sequenceOrder: number;
    active: boolean;
}

export interface BoqCostingSettingsData {
    defaultTaxPercent?: number;
    defaultMarkupPercent?: number;
    defaultWastePercent?: number;
    currency?: string;
    numberFormat?: string;
    units: BoqUnit[];
    numbering: BoqNumberingSettings;
    taxRules: BoqTaxRule[];
    pricing: BoqPricingSettings;
    revision: BoqRevisionSettings;
    approval: BoqApprovalSettings;
    pricingRules?: BoqPricingRule[];
    revisionRules?: BoqRevisionRule[];
    approvalRules?: BoqApprovalRule[];
    [key: string]: unknown;
}

// ── Notification Settings & Matrix Types ─────────────────────────────────────

export type NotificationChannel = "email" | "in_app" | "push" | "whatsapp";

export type NotificationEvent =
    | "boq_approval"
    | "payment_alert"
    | "document_shared"
    | "new_comment"
    | "task_due"
    | "weekly_digest"
    | "marketing";

export type NotificationMatrix = Record<NotificationEvent, Record<NotificationChannel, boolean>>;

export interface NotificationSettingsData {
    matrix: NotificationMatrix;
    email?: boolean;
    tasks?: boolean;
    approvals?: boolean;
    billing?: boolean;
    weeklyDigest?: boolean;
    [key: string]: unknown;
}



