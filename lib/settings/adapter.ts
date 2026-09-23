import { SettingsOverview } from "@/lib/api/auth";
import {
    ConfigurationHealthCard,
    FormattedRecentChange,
    SettingsOverviewViewModel,
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
    const hasLogo = Boolean(branding.logoUrl || workspaceProf?.logo_url);
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
