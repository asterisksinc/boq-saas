import { HelpArticle } from "@/lib/api/auth";

export function getArticleCategory(article: HelpArticle): { slug: string; name: string } | null {
    if (article.category) {
        if (typeof article.category === "string") {
            const raw = article.category as string;
            return { slug: raw.toLowerCase().replace(/\s+/g, "-"), name: raw };
        }
        return article.category;
    }
    if (article.help_categories) {
        if (Array.isArray(article.help_categories)) {
            return article.help_categories[0] ?? null;
        }
        return article.help_categories;
    }
    return null;
}

/**
 * Display helpfulness percentages only when backed by real data with a meaningful denominator (total >= 5).
 * Never display a default 96% helpful or fabricated rating.
 */
export function getHelpfulPercentage(article: HelpArticle): number | null {
    const yes = article.helpfulYes ?? article.helpful_yes ?? 0;
    const no = article.helpfulNo ?? article.helpful_no ?? 0;
    const total = yes + no;
    if (total < 5) return null;
    return Math.round((yes / total) * 100);
}

/**
 * Calculate or read valid reading duration.
 */
export function getReadMinutes(article: HelpArticle): number | null {
    if (article.readMinutes && article.readMinutes > 0) return article.readMinutes;
    if (article.read_minutes && article.read_minutes > 0) return article.read_minutes;
    if (article.content) {
        const text = typeof article.content === "string" ? article.content : JSON.stringify(article.content);
        const words = text.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
        if (words > 20) return Math.max(1, Math.ceil(words / 180));
    }
    return null;
}

export function getArticleShortAnswer(article: HelpArticle): string | null {
    if (article.content && typeof article.content === "object" && "shortAnswer" in article.content) {
        const val = (article.content as { shortAnswer?: string }).shortAnswer;
        if (val) return val;
    }
    return article.summary || null;
}

export const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(iso));
    } catch {
        return iso;
    }
};

export const formatArticleDate = (iso?: string | null) => {
    if (!iso) return "Recently";
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "Recently";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(d);
    } catch {
        return "Recently";
    }
};

export const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: "Low", color: "#16a34a", bg: "#f0fdf4" },
    normal: { label: "Normal", color: "#2563eb", bg: "#eff6ff" },
    high: { label: "High", color: "#d97706", bg: "#fffbeb" },
    urgent: { label: "Urgent", color: "#dc2626", bg: "#fef2f2" },
};

export const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Draft", color: "#64748b", bg: "#f8fafc" },
    open: { label: "Open", color: "#2563eb", bg: "#eff6ff" },
    in_progress: { label: "In Progress", color: "#7c3aed", bg: "#f5f3ff" },
    waiting_on_user: { label: "Waiting on User", color: "#d97706", bg: "#fffbeb" },
    resolved: { label: "Resolved", color: "#16a34a", bg: "#f0fdf4" },
    closed: { label: "Closed", color: "#64748b", bg: "#f1f5f9" },
};
