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

