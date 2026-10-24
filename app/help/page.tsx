"use client";

import {
    ChevronLeft,
    ChevronRight,
    Search,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Plus,
    X,
    Send,
    Clock,
    AlertCircle,
    CheckCircle,
    FileText,
    Sparkles,
    LayoutDashboard,
    FileSpreadsheet,
    Receipt,
    FolderOpen,
    Link2,
    Users,
    CreditCard,
    HelpCircle,
    Ticket,
    RefreshCw,
    ArrowLeft,
    Bookmark,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getHelpOverview,
    getHelpArticle,
    submitArticleFeedback,
    listSupportTickets,
    createSupportTicket,
    getSupportTicket,
    updateSupportTicket,
    listSupportTicketMessages,
    createSupportTicketMessage,
    HelpArticle,
    HelpOverview,
    SupportTicket,
    SupportTicketMessage,
    SupportTicketInput,
} from "@/lib/api/auth";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import TicketWizardDrawer from "@/components/TicketWizardDrawer";
import "./help-redesign.css";

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: "Low", color: "#16a34a", bg: "#f0fdf4" },
    normal: { label: "Normal", color: "#2563eb", bg: "#eff6ff" },
    high: { label: "High", color: "#d97706", bg: "#fffbeb" },
    urgent: { label: "Urgent", color: "#dc2626", bg: "#fef2f2" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Draft", color: "#64748b", bg: "#f8fafc" },
    open: { label: "Open", color: "#2563eb", bg: "#eff6ff" },
    in_progress: { label: "In Progress", color: "#7c3aed", bg: "#f5f3ff" },
    waiting_on_user: { label: "Waiting on User", color: "#d97706", bg: "#fffbeb" },
    resolved: { label: "Resolved", color: "#16a34a", bg: "#f0fdf4" },
    closed: { label: "Closed", color: "#64748b", bg: "#f1f5f9" },
};

const formatDate = (iso?: string | null) => {
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

const formatArticleDate = (iso?: string | null) => {
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

function getArticleCategory(article: HelpArticle): { slug: string; name: string } | null {
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
 * Display helpfulness percentages only when backed by real data with a meaningful denominator.
 * Never display a default 96% helpful or fabricated rating.
 */
function getHelpfulPercentage(article: HelpArticle): number | null {
    const yes = article.helpfulYes ?? article.helpful_yes ?? 0;
    const no = article.helpfulNo ?? article.helpful_no ?? 0;
    const total = yes + no;
    if (total < 5) return null;
    return Math.round((yes / total) * 100);
}

/**
 * Calculate or read valid reading duration.
 */
function getReadMinutes(article: HelpArticle): number | null {
    if (article.readMinutes && article.readMinutes > 0) return article.readMinutes;
    if (article.read_minutes && article.read_minutes > 0) return article.read_minutes;
    if (article.content) {
        const text = typeof article.content === "string" ? article.content : JSON.stringify(article.content);
        const words = text.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
        if (words > 20) return Math.max(1, Math.ceil(words / 180));
    }
    return null;
}

function getArticleShortAnswer(article: HelpArticle): string | null {
    if (article.content && typeof article.content === "object" && "shortAnswer" in article.content) {
        const val = (article.content as { shortAnswer?: string }).shortAnswer;
        if (val) return val;
    }
    return article.summary || null;
}

function getCategoryIcon(slug: string) {
    const s = slug.toLowerCase();
    if (s.includes("getting-started") || s.includes("start")) return <Sparkles size={20} />;
    if (s.includes("project") || s.includes("activit")) return <LayoutDashboard size={20} />;
    if (s.includes("boq") || s.includes("cost")) return <FileSpreadsheet size={20} />;
    if (s.includes("proposal") || s.includes("invoice")) return <Receipt size={20} />;
    if (s.includes("doc")) return <FolderOpen size={20} />;
    if (s.includes("integration")) return <Link2 size={20} />;
    if (s.includes("team") || s.includes("permission")) return <Users size={20} />;
    if (s.includes("bill") || s.includes("account")) return <CreditCard size={20} />;
    return <HelpCircle size={20} />;
}

const DEFAULT_CATEGORIES: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    articleCount: number;
}> = [
    {
        id: "cat-getting-started",
        slug: "getting-started",
        name: "Getting Started",
        description: "Set up your workspace and create your first project",
        articleCount: 8,
    },
    {
        id: "cat-projects-activities",
        slug: "projects-activities",
        name: "Projects & Activities",
        description: "Manage stages, milestones, tasks, and approvals",
        articleCount: 12,
    },
    {
        id: "cat-boqs-costing",
        slug: "boqs-costing",
        name: "BOQs & Costing",
        description: "Create BOQs, manage items, rates, and margins",
        articleCount: 18,
    },
    {
        id: "cat-proposals-invoices",
        slug: "proposals-invoices",
        name: "Proposals & Invoices",
        description: "Create, send, and track commercial documents",
        articleCount: 14,
    },
    {
        id: "cat-documents",
        slug: "documents",
        name: "Documents",
        description: "Upload, organize, preview, and share files",
        articleCount: 9,
    },
    {
        id: "cat-integrations",
        slug: "integrations",
        name: "Integrations",
        description: "Connect forms, Meta, Google Ads, and external systems",
        articleCount: 11,
    },
    {
        id: "cat-team-permissions",
        slug: "team-permissions",
        name: "Team & Permissions",
        description: "Invite users and control access",
        articleCount: 7,
    },
    {
        id: "cat-account-billing",
        slug: "account-billing",
        name: "Account & Billing",
        description: "Manage plans, usage, subscriptions, and payments",
        articleCount: 6,
    },
];

const DEFAULT_POPULAR_ARTICLES: HelpArticle[] = [
    {
        id: "art-1",
        slug: "how-to-import-an-excel-boq",
        title: "How to Import an Excel BOQ",
        summary: "Bring your existing estimate into Buildwise and map columns to your costing library.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "boqs-costing", name: "BOQs & Costing" },
        content: {
            shortAnswer: "Upload your workbook from the BOQ menu, map the required columns, then review the validation summary before importing.",
            sections: [
                {
                    heading: "Before you start",
                    body: "Use .xlsx or .csv files with a header row. Keep units and rates in separate columns for the cleanest mapping.",
                },
                {
                    heading: "Import your BOQ",
                    items: [
                        "Open the project and choose BOQs.",
                        "Select Import from Excel.",
                        "Upload your file and map each column.",
                        "Review invalid rows, correct them, and confirm the import.",
                    ],
                },
                {
                    heading: "Troubleshooting",
                    body: "If units are marked invalid, check that they match your Costing Library. You can map a new unit during review.",
                },
            ],
        },
    },
    {
        id: "art-2",
        slug: "create-your-first-project",
        title: "Create Your First Project",
        summary: "Set up a project workspace, invite your team, and start building your estimate.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "getting-started", name: "Getting Started" },
        content: {
            shortAnswer: "Set up a project workspace, invite your team, and start building your estimate.",
            sections: [
                { heading: "Getting Started", body: "Create your project container to manage rooms, BOQs, and team assignments." },
                { heading: "Steps", items: ["Click '+ New' in the top dashboard navigation.", "Enter the project title, client, and location.", "Assign team members and initial milestone dates.", "Save to open your project workspace."] }
            ]
        }
    },
    {
        id: "art-3",
        slug: "add-a-costing-item",
        title: "Add a Costing Item",
        summary: "Add materials, labour, and custom rates to your Costing Library or directly to a BOQ.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "boqs-costing", name: "BOQs & Costing" },
        content: {
            shortAnswer: "Add materials, labour, and custom rates to your Costing Library or directly to a BOQ.",
            sections: [
                { heading: "Costing Library", body: "Centralize your material and labor rates to reuse across projects." },
                { heading: "Steps", items: ["Open the Costing section from the navigation.", "Click 'Add Costing Item'.", "Enter item code, unit, material rate, and labor allowance.", "Save to make available in all new BOQs."] }
            ]
        }
    },
    {
        id: "art-4",
        slug: "send-a-proposal-to-a-client",
        title: "Send a Proposal to a Client",
        summary: "Turn your approved BOQ into a polished proposal and send it for review.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "boqs-costing", name: "BOQs & Costing" },
        content: {
            shortAnswer: "Turn your approved BOQ into a polished proposal and send it for review.",
            sections: [
                { heading: "Proposals", body: "Generate commercial client proposals directly from approved estimates." },
                { heading: "Steps", items: ["Open your BOQ and click 'Generate Proposal'.", "Review client details, terms, and payment milestones.", "Click 'Send to Client' to email a secure review link."] }
            ]
        }
    },
    {
        id: "art-5",
        slug: "record-a-partial-invoice-payment",
        title: "Record a Partial Invoice Payment",
        summary: "Keep your project balances accurate when a client pays an invoice in instalments.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "proposals-invoices", name: "Proposals & Invoices" },
        content: {
            shortAnswer: "Keep your project balances accurate when a client pays an invoice in instalments.",
            sections: [
                { heading: "Invoicing", body: "Record milestone payments and track outstanding balances in real time." },
                { heading: "Steps", items: ["Navigate to Invoices and select the target invoice.", "Click 'Record Payment'.", "Enter the payment amount, reference, and date.", "Confirm to update outstanding balances."] }
            ]
        }
    },
    {
        id: "art-6",
        slug: "connect-meta-lead-forms",
        title: "Connect Meta Lead Forms",
        summary: "Send new leads from Meta directly into your project pipeline.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "integrations", name: "Integrations" },
        content: {
            shortAnswer: "Send new leads from Meta directly into your project pipeline.",
            sections: [
                { heading: "Integrations", body: "Automatically capture incoming leads from Facebook and Instagram lead ads." },
                { heading: "Steps", items: ["Go to Settings > Integrations.", "Select Meta Lead Ads and click Connect.", "Authorize permissions and map form fields to project lead fields.", "Submit a test lead to verify."] }
            ]
        }
    },
    {
        id: "art-7",
        slug: "manage-team-roles-permissions",
        title: "Manage Team Roles & Permissions",
        summary: "Invite team members and configure role-based access for estimates and projects.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "team-permissions", name: "Team & Permissions" },
        content: {
            shortAnswer: "Invite team members and configure role-based access for estimates and projects.",
            sections: [
                { heading: "Roles & Permissions", body: "Manage user permissions across workspace modules." },
                { heading: "Steps", items: ["Navigate to Team & Permissions.", "Click 'Invite User'.", "Enter email and select role (Admin, Estimator, Viewer).", "Send invite to grant immediate access."] }
            ]
        }
    },
    {
        id: "art-8",
        slug: "upgrade-your-subscription-plan",
        title: "Upgrade Your Subscription Plan",
        summary: "Choose the right plan for your business and manage payment methods and billing intervals.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "account-billing", name: "Account & Billing" },
        content: {
            shortAnswer: "Choose the right plan for your business and manage payment methods and billing intervals.",
            sections: [
                { heading: "Billing & Plans", body: "Switch plans, update payment methods, and download invoices." },
                { heading: "Steps", items: ["Open Settings > Billing.", "Compare Starter, Professional, and Enterprise plans.", "Click 'Upgrade Plan' to confirm your selection."] }
            ]
        }
    },
];

export default function HelpPage() {
    const router = useRouter();

    // Data State
    const [helpData, setHelpData] = useState<HelpOverview | null>(null);
    const [loadingHelp, setLoadingHelp] = useState(true);
    const [helpError, setHelpError] = useState<string | null>(null);

    // Active View
    const [view, setView] = useState<"center" | "articles" | "article" | "tickets" | "new-ticket" | "ticket-detail">("center");
    const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
    const [loadingArticle, setLoadingArticle] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Tickets State
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [ticketsError, setTicketsError] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [ticketMessages, setTicketMessages] = useState<SupportTicketMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [ticketFilter, setTicketFilter] = useState<string>("all");

    // Ticket Wizard Drawer State
    const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(false);
    const [drawerInitialTicket, setDrawerInitialTicket] = useState<SupportTicket | null>(null);
    const [drawerArticleTitle, setDrawerArticleTitle] = useState<string | null>(null);

    const handleOpenNewTicket = (articleTitle?: string | null) => {
        setDrawerInitialTicket(null);
        setDrawerArticleTitle(articleTitle || null);
        setIsTicketDrawerOpen(true);
    };

    const handleResumeDraftTicket = (ticket: SupportTicket) => {
        setDrawerInitialTicket(ticket);
        setDrawerArticleTitle(null);
        setIsTicketDrawerOpen(true);
    };

    const handleTicketCreated = (ticket: SupportTicket, wasDraft?: boolean) => {
        const num = ticket.ticketNumber || ticket.ticket_number || "";
        if (wasDraft) {
            showNotice(`Draft ticket ${num} saved. You can resume it anytime under View My Tickets.`);
        } else {
            showNotice(`Support ticket ${num} submitted successfully! Our team will get back to you shortly.`);
        }
        void loadTickets();
    };

    // Reply Form State
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    // Feedback Notice
    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [articleFeedbackGiven, setArticleFeedbackGiven] = useState(false);

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 4000);
    };

    // Load Help Center Overview
    const loadHelp = useCallback(async (query?: string) => {
        setLoadingHelp(true);
        setHelpError(null);
        try {
            const data = await getHelpOverview(query);
            setHelpData(data);
        } catch (err: any) {
            setHelpError(err.message || "Could not load Help Center");
        } finally {
            setLoadingHelp(false);
        }
    }, []);

    useEffect(() => {
        void loadHelp();
    }, [loadHelp]);

    // Read query params (e.g. ?action=new-ticket&articleTitle=...)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const action = params.get("action");
            const articleTitle = params.get("articleTitle");
            if (action === "new-ticket") {
                handleOpenNewTicket(articleTitle);
                window.history.replaceState({}, "", "/help");
            }
        }
    }, []);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (view === "center" || view === "articles") {
                void loadHelp(searchQuery.trim());
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, view, loadHelp]);

    // Load Tickets
    const loadTickets = useCallback(async () => {
        setLoadingTickets(true);
        setTicketsError(null);
        try {
            const data = await listSupportTickets();
            setTickets(data.items || []);
        } catch (err: any) {
            setTicketsError(err.message || "Could not load tickets");
        } finally {
            setLoadingTickets(false);
        }
    }, []);

    useEffect(() => {
        if (view === "tickets") {
            void loadTickets();
        }
    }, [view, loadTickets]);

    // Select Article (fetches full article detail including content)
    const handleSelectArticle = async (article: HelpArticle) => {
        setSelectedArticle(article);
        setView("article");
        setArticleFeedbackGiven(false);
        setLoadingArticle(true);
        try {
            const fullArticle = await getHelpArticle(article.slug);
            setSelectedArticle(fullArticle);
        } catch {
            // Keep basic article if detail request fails
        } finally {
            setLoadingArticle(false);
        }
    };

    // Article feedback
    const handleArticleFeedback = async (helpful: boolean) => {
        if (!selectedArticle || articleFeedbackGiven) return;
        try {
            await submitArticleFeedback(selectedArticle.slug, { helpful });
            setSelectedArticle((prev) => {
                if (!prev) return null;
                const yes = (prev.helpfulYes ?? prev.helpful_yes ?? 0) + (helpful ? 1 : 0);
                const no = (prev.helpfulNo ?? prev.helpful_no ?? 0) + (helpful ? 0 : 1);
                return {
                    ...prev,
                    helpfulYes: yes,
                    helpful_yes: yes,
                    helpfulNo: no,
                    helpful_no: no,
                };
            });
            setArticleFeedbackGiven(true);
            showNotice("Thank you for your feedback!");
        } catch {
            showNotice("Could not submit feedback", "error");
        }
    };

    // Raise ticket pre-filled from current article
    const handleRaiseTicketFromArticle = (article: HelpArticle) => {
        handleOpenNewTicket(article.title);
    };

    // Load Ticket Detail and Messages
    const handleSelectTicket = async (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setView("ticket-detail");
        setLoadingMessages(true);
        try {
            const [ticketData, messagesData] = await Promise.all([
                getSupportTicket(ticket.id),
                listSupportTicketMessages(ticket.id),
            ]);
            setSelectedTicket(ticketData);
            setTicketMessages(messagesData.items || []);
        } catch (err: any) {
            showNotice(err.message || "Could not load ticket conversation", "error");
        } finally {
            setLoadingMessages(false);
        }
    };

    // Update Ticket Status
    const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket["status"]) => {
        try {
            await updateSupportTicket(ticketId, { status });
            showNotice(`Ticket status updated to ${statusConfig[status]?.label || status}`);
            if (selectedTicket && selectedTicket.id === ticketId) {
                setSelectedTicket({ ...selectedTicket, status });
            }
            void loadTickets();
        } catch (err: any) {
            showNotice(err.message || "Could not update ticket", "error");
        }
    };

    // Send Reply Message
    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setSendingReply(true);
        try {
            const msg = await createSupportTicketMessage(selectedTicket.id, { body: replyText.trim() });
            setReplyText("");
            setTicketMessages((prev) => [...prev, msg]);
            showNotice("Reply sent");
        } catch (err: any) {
            showNotice(err.message || "Could not send reply", "error");
        } finally {
            setSendingReply(false);
        }
    };

    // Calculate articles per category dynamically from the real dataset
    const categoriesWithCounts = useMemo(() => {
        const categories = helpData?.categories && helpData.categories.length > 0
            ? helpData.categories
            : DEFAULT_CATEGORIES;
        const articles = helpData?.articles && helpData.articles.length > 0
            ? helpData.articles
            : DEFAULT_POPULAR_ARTICLES;

        return categories.map((category) => {
            const realCount = articles.filter((a) => {
                const catInfo = getArticleCategory(a);
                if (catInfo?.slug === category.slug) return true;
                if (a.categoryId === category.id || a.category_id === category.id) return true;
                return false;
            }).length;

            return {
                ...category,
                articleCount: realCount > 0 ? realCount : (category as any).articleCount || 0,
            };
        });
    }, [helpData]);

    // Popular articles (flagged popular or top articles)
    const popularArticles = useMemo(() => {
        if (helpData?.articles && helpData.articles.length > 0) {
            return helpData.articles;
        }
        return DEFAULT_POPULAR_ARTICLES;
    }, [helpData]);

    // Filtered articles for All Articles view
    const filteredArticles = useMemo(() => {
        const list = helpData?.articles && helpData.articles.length > 0
            ? helpData.articles
            : DEFAULT_POPULAR_ARTICLES;
        if (selectedCategory) {
            return list.filter((a) => {
                const cat = getArticleCategory(a);
                return cat?.slug === selectedCategory;
            });
        }
        return list;
    }, [helpData, selectedCategory]);

    // Search results
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        if (helpData?.articles && helpData.articles.length > 0) {
            return helpData.articles;
        }
        // Fallback filter over default articles
        const q = searchQuery.toLowerCase().trim();
        return DEFAULT_POPULAR_ARTICLES.filter((a) =>
            a.title.toLowerCase().includes(q) ||
            (a.summary?.toLowerCase() || "").includes(q)
        );
    }, [searchQuery, helpData]);

    // Filtered tickets
    const filteredTickets = useMemo(() => {
        if (ticketFilter === "all") return tickets;
        return tickets.filter((t) => t.status === ticketFilter);
    }, [tickets, ticketFilter]);

    return (
        <main className="fig-dashboard boq-dashboard help-page">
            {/* Top gradient glow matching Figma Rectangle 14 */}
            <div className="help-gradient-glow" />
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/help" />

            <div className="fig-dashboard-main">
                {/* Reused global dashboard topbar */}
                <DashboardHeader title="Help & Support" />

                <section className="help-content">
                    {/* Notice Toast */}
                    {notice && (
                        <div
                            className={`notice-banner ${notice.type}`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                background: notice.type === "success" ? "#dcfce7" : "#fee2e2",
                                color: notice.type === "success" ? "#15803d" : "#b91c1c",
                                border: `1px solid ${notice.type === "success" ? "#86efac" : "#fca5a5"}`,
                                fontSize: "13px",
                                fontWeight: "500",
                            }}
                        >
                            {notice.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            <span>{notice.message}</span>
                        </div>
                    )}

                    {/* View: Help Center Main */}
                    {view === "center" && (
                        <>
                            {/* Section 1: Intro Header & Buttons (Frame 2147225066) */}
                            <div className="help-hero">
                                <div className="help-hero-text">
                                    <h2>How Can We Help You Today?</h2>
                                    <p>Find answers, troubleshoot issues, or contact our support team.</p>
                                </div>
                                <div className="help-hero-actions">
                                    <button
                                        type="button"
                                        className="btn-view-ticket"
                                        onClick={() => {
                                            setView("tickets");
                                            void loadTickets();
                                        }}
                                    >
                                        <Ticket size={20} color="#0F172A" />
                                        <span>View My Ticket</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-raise-ticket"
                                        onClick={() => handleOpenNewTicket()}
                                    >
                                        <Plus size={20} color="#FFFFFF" />
                                        <span>Raise a Ticket</span>
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Knowledge-Base Search (Frame 2147225073) */}
                            <div className="help-search-container">
                                <div className="help-global-search">
                                    <Search size={20} className="search-icon" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && searchResults.length > 0) {
                                                void handleSelectArticle(searchResults[0]);
                                            }
                                        }}
                                        placeholder="Search questions, features, error messages, or topics"
                                        aria-label="Search questions, features, error messages, or topics"
                                    />
                                    {loadingHelp && searchQuery.trim() !== "" && (
                                        <Loader2 size={16} className="spin" style={{ color: "#2563EB", marginRight: "4px" }} />
                                    )}
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="clear-btn"
                                            onClick={() => setSearchQuery("")}
                                            aria-label="Clear search"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Live Search Results Display */}
                            {searchQuery.trim() !== "" ? (
                                <div className="help-popular-container">
                                    <div className="help-popular-header">
                                        <h3>SEARCH RESULTS ({searchResults.length})</h3>
                                        <button
                                            type="button"
                                            className="section-action-btn"
                                            onClick={() => setSearchQuery("")}
                                        >
                                            Clear Search
                                        </button>
                                    </div>

                                    {loadingHelp ? (
                                        <HelpSkeleton />
                                    ) : searchResults.length === 0 ? (
                                        <div className="empty-state" style={{ width: "100%", padding: "40px 20px" }}>
                                            <Search size={44} style={{ color: "#64748B", opacity: 0.7 }} />
                                            <h3 style={{ fontFamily: "Urbanist", fontWeight: 600, fontSize: "18px", color: "#0F172A", margin: "12px 0 6px" }}>
                                                No articles match your search
                                            </h3>
                                            <p style={{ fontFamily: "Urbanist", fontSize: "14px", color: "#64748B", margin: "0 0 20px", maxWidth: "420px" }}>
                                                We couldn&apos;t find any articles matching &ldquo;{searchQuery}&rdquo;. Try using different keywords, browse by product area, or reach out to our support team.
                                            </p>
                                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                                                <button
                                                    type="button"
                                                    className="btn-view-ticket"
                                                    onClick={() => {
                                                        setSearchQuery("");
                                                        setSelectedCategory(null);
                                                        setView("articles");
                                                    }}
                                                >
                                                    Browse All Articles
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-raise-ticket"
                                                    onClick={() => handleOpenNewTicket()}
                                                >
                                                    <Plus size={16} /> Raise a Ticket
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="popular-articles-grid">
                                            {searchResults.map((article) => (
                                                <ArticleCard
                                                    key={article.id}
                                                    article={article}
                                                    onSelect={() => void handleSelectArticle(article)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Section 3: Popular Articles (Frame 2147225477) */}
                                    <div className="help-popular-container">
                                        <div className="help-popular-header">
                                            <h3>POPULAR ARTICLES</h3>
                                            <button
                                                type="button"
                                                className="section-action-btn"
                                                onClick={() => {
                                                    setSelectedCategory(null);
                                                    setView("articles");
                                                }}
                                            >
                                                View All Articles
                                            </button>
                                        </div>

                                        {loadingHelp && popularArticles.length === 0 ? (
                                            <HelpSkeleton />
                                        ) : helpError && popularArticles.length === 0 ? (
                                            <div className="empty-state" style={{ width: "100%", padding: "40px 20px" }}>
                                                <AlertCircle size={40} style={{ color: "#EF4444" }} />
                                                <h3 style={{ fontFamily: "Urbanist", fontWeight: 600, fontSize: "18px", color: "#0F172A", margin: "12px 0 6px" }}>
                                                    Unable to load articles
                                                </h3>
                                                <p style={{ fontFamily: "Urbanist", fontSize: "14px", color: "#64748B", margin: "0 0 16px" }}>{helpError}</p>
                                                <button
                                                    type="button"
                                                    className="section-action-btn"
                                                    onClick={() => void loadHelp()}
                                                >
                                                    <RefreshCw size={14} /> Retry
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="popular-articles-grid">
                                                {popularArticles.map((article) => (
                                                    <ArticleCard
                                                        key={article.id}
                                                        article={article}
                                                        onSelect={() => void handleSelectArticle(article)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 4: Browse by Product Area (Frame 2147225478) */}
                                    <div className="help-categories-section">
                                        <div className="help-categories-header">
                                            <h3>BROWSE BY PRODUCT AREA</h3>
                                            <button
                                                type="button"
                                                className="section-action-btn"
                                                onClick={() => {
                                                    setSelectedCategory(null);
                                                    setView("articles");
                                                }}
                                            >
                                                View All Categories
                                            </button>
                                        </div>

                                        {loadingHelp && categoriesWithCounts.length === 0 ? (
                                            <CategorySkeleton />
                                        ) : (
                                            <div className="product-categories-grid">
                                                {categoriesWithCounts.map((cat) => (
                                                    <div
                                                        key={cat.id || cat.slug}
                                                        className="product-category-card"
                                                        onClick={() => {
                                                            setSelectedCategory(cat.slug);
                                                            setView("articles");
                                                        }}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                setSelectedCategory(cat.slug);
                                                                setView("articles");
                                                            }
                                                        }}
                                                    >
                                                        <div className="category-icon-box">
                                                            {getCategoryIcon(cat.slug)}
                                                        </div>
                                                        <div className="category-info">
                                                            <div className="category-text-block">
                                                                <h4>{cat.name}</h4>
                                                                <p>{cat.description}</p>
                                                            </div>
                                                            <span className="category-count-link">
                                                                {cat.articleCount} {cat.articleCount === 1 ? "Article" : "Articles"}
                                                                <ChevronRight size={14} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 5: Bottom Support CTA / Need a Human? (Frame 2147225027) */}
                                    <div className="help-support-cta">
                                        <div className="cta-watermark">?</div>
                                        <div className="cta-content">
                                            <span className="cta-tag">NEED A HUMAN?</span>
                                            <h3>Can&apos;t find what you need?</h3>
                                            <p>Our team will review your issue and respond according to your support plan.</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-cta-raise"
                                            onClick={() => handleOpenNewTicket()}
                                        >
                                            <span>Raise a Support Ticket</span>
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* View: All Articles & Category Browse */}
                    {view === "articles" && (
                        <div className="help-section">
                            <button
                                type="button"
                                className="help-back-btn"
                                onClick={() => setView("center")}
                            >
                                <ChevronLeft size={16} /> Back to Help Center
                            </button>

                            <div className="help-hero">
                                <div className="help-hero-text">
                                    <h2>
                                        {selectedCategory
                                            ? categoriesWithCounts.find((c) => c.slug === selectedCategory)?.name || "Category Articles"
                                            : "All Knowledge-Base Articles"}
                                    </h2>
                                    <p>Browse guides, tutorials, and frequently asked questions.</p>
                                </div>
                                <div className="help-hero-actions">
                                    <button
                                        type="button"
                                        className="btn-raise-ticket"
                                        onClick={() => handleOpenNewTicket()}
                                    >
                                        <Plus size={18} /> Raise a Ticket
                                    </button>
                                </div>
                            </div>

                            {/* Search Within Articles */}
                            <div className="help-search-container">
                                <div className="help-global-search">
                                    <Search size={20} className="search-icon" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search within articles..."
                                        aria-label="Search within articles"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="clear-btn"
                                            onClick={() => setSearchQuery("")}
                                            aria-label="Clear search"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Filter Pills */}
                            <div className="category-pills">
                                <button
                                    type="button"
                                    className={`category-pill ${!selectedCategory ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    All Articles ({popularArticles.length})
                                </button>
                                {categoriesWithCounts.map((cat) => (
                                    <button
                                        key={cat.slug}
                                        type="button"
                                        className={`category-pill ${selectedCategory === cat.slug ? "active" : ""}`}
                                        onClick={() => setSelectedCategory(cat.slug)}
                                    >
                                        {cat.name} ({cat.articleCount})
                                    </button>
                                ))}
                            </div>

                            {/* Article Grid */}
                            {loadingHelp ? (
                                <HelpSkeleton />
                            ) : filteredArticles.length === 0 ? (
                                <div className="empty-state" style={{ width: "100%", padding: "40px 20px" }}>
                                    <FileText size={44} style={{ color: "#64748B", opacity: 0.7 }} />
                                    <h3 style={{ fontFamily: "Urbanist", fontWeight: 600, fontSize: "18px", color: "#0F172A", margin: "12px 0 6px" }}>
                                        No articles found
                                    </h3>
                                    <p style={{ fontFamily: "Urbanist", fontSize: "14px", color: "#64748B", margin: "0 0 20px" }}>
                                        No articles match your current filter or search criteria.
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-view-ticket"
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setSearchQuery("");
                                        }}
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="popular-articles-grid">
                                    {filteredArticles.map((article) => (
                                        <ArticleCard
                                            key={article.id}
                                            article={article}
                                            onSelect={() => void handleSelectArticle(article)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: Article Detail */}
                    {view === "article" && selectedArticle && (
                        <div className="article-view">
                            <button
                                type="button"
                                className="article-back-link"
                                onClick={() => setView("center")}
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Help Center</span>
                            </button>

                            {/* Card 1: Article Header Card */}
                            <div className="article-header-card">
                                {getArticleCategory(selectedArticle) && (
                                    <span className="article-header-category">
                                        {getArticleCategory(selectedArticle)?.name}
                                    </span>
                                )}
                                <h1 className="article-header-title">{selectedArticle.title}</h1>
                                <div className="article-header-meta">
                                    <span>Updated {formatArticleDate(selectedArticle.updatedAt || selectedArticle.updated_at)}</span>
                                    {getReadMinutes(selectedArticle) !== null && (
                                        <>
                                            <span className="meta-dot">·</span>
                                            <span>{getReadMinutes(selectedArticle)} min read</span>
                                        </>
                                    )}
                                    {getHelpfulPercentage(selectedArticle) !== null && (
                                        <>
                                            <span className="meta-dot">·</span>
                                            <span>{getHelpfulPercentage(selectedArticle)}% helpful</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Short Answer Card */}
                            {getArticleShortAnswer(selectedArticle) && (
                                <div className="article-short-answer-card">
                                    <h4>Short answer</h4>
                                    <p>{getArticleShortAnswer(selectedArticle)}</p>
                                </div>
                            )}

                            {/* Card 3: Main Article Body Card */}
                            <div className="article-body-card">
                                {loadingArticle ? (
                                    <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748B" }}>
                                        <Loader2 size={24} className="spin" style={{ margin: "0 auto 10px", color: "#2563EB" }} />
                                        <p style={{ fontSize: "14px", fontFamily: "Urbanist" }}>Loading article details...</p>
                                    </div>
                                ) : (
                                    <ArticleContentRenderer
                                        content={selectedArticle.content}
                                        summary={selectedArticle.summary}
                                    />
                                )}
                            </div>

                            {/* Card 4: Feedback Card */}
                            <div className="article-feedback-card">
                                <span className="feedback-label">Was this article helpful?</span>
                                <div className="feedback-buttons-row">
                                    <button
                                        type="button"
                                        className={`feedback-action-btn ${articleFeedbackGiven ? "voted" : ""}`}
                                        onClick={() => void handleArticleFeedback(true)}
                                        disabled={articleFeedbackGiven}
                                    >
                                        <ThumbsUp size={14} />
                                        <span>Yes</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="feedback-action-btn"
                                        onClick={() => void handleArticleFeedback(false)}
                                        disabled={articleFeedbackGiven}
                                    >
                                        <ThumbsDown size={14} />
                                        <span>No</span>
                                    </button>
                                </div>
                                {articleFeedbackGiven && (
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#16A34A" }}>
                                        ✓ Feedback recorded. Thank you!
                                    </span>
                                )}
                            </div>

                            {/* Card 5: Bottom Support CTA */}
                            <div className="article-support-cta">
                                <span className="cta-watermark">?</span>
                                <div className="cta-content">
                                    <h3>Still need help?</h3>
                                    <p>Carry this article into a support ticket so you don&apos;t have to repeat yourself.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-cta-raise"
                                    onClick={() => handleRaiseTicketFromArticle(selectedArticle)}
                                >
                                    <span>Raise a Ticket</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* View: Tickets Listing ("View My Ticket") */}
                    {view === "tickets" && (
                        <div className="help-section">
                            <button
                                type="button"
                                className="help-back-btn"
                                onClick={() => setView("center")}
                            >
                                <ChevronLeft size={16} /> Back to Help Center
                            </button>

                            <div className="tickets-header">
                                <div>
                                    <h2>Support Tickets</h2>
                                    <p style={{ color: "#64748B", fontSize: "14px", margin: "4px 0 0", fontFamily: "Urbanist" }}>
                                        Track and manage your requests to our support team.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-raise-ticket"
                                    onClick={() => handleOpenNewTicket()}
                                >
                                    <Plus size={18} /> Raise a Ticket
                                </button>
                            </div>

                            {/* Status Filter Pills */}
                            <div className="category-pills">
                                {["all", "open", "in_progress", "waiting_on_user", "resolved", "closed"].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`category-pill ${ticketFilter === s ? "active" : ""}`}
                                        onClick={() => setTicketFilter(s)}
                                    >
                                        {s === "all" ? `All Tickets (${tickets.length})` : `${statusConfig[s]?.label || s} (${tickets.filter((t) => t.status === s).length})`}
                                    </button>
                                ))}
                            </div>

                            {loadingTickets ? (
                                <HelpSkeleton />
                            ) : ticketsError ? (
                                <div className="empty-state" style={{ width: "100%", padding: "40px 20px" }}>
                                    <AlertCircle size={44} style={{ color: "#EF4444" }} />
                                    <h3 style={{ fontFamily: "Urbanist", fontWeight: 600, fontSize: "18px", color: "#0F172A", margin: "12px 0 6px" }}>
                                        Couldn&apos;t load tickets
                                    </h3>
                                    <p style={{ fontFamily: "Urbanist", fontSize: "14px", color: "#64748B", margin: "0 0 16px" }}>{ticketsError}</p>
                                    <button
                                        type="button"
                                        className="btn-view-ticket"
                                        onClick={() => void loadTickets()}
                                    >
                                        <RefreshCw size={14} /> Retry
                                    </button>
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="empty-state" style={{ width: "100%", padding: "48px 20px" }}>
                                    <Ticket size={48} style={{ color: "#64748B", opacity: 0.6 }} />
                                    <h3 style={{ fontFamily: "Urbanist", fontWeight: 600, fontSize: "18px", color: "#0F172A", margin: "12px 0 6px" }}>
                                        No tickets found
                                    </h3>
                                    <p style={{ fontFamily: "Urbanist", fontSize: "14px", color: "#64748B", margin: "0 0 20px", maxWidth: "420px" }}>
                                        {ticketFilter === "all"
                                            ? "You haven't created any support tickets yet."
                                            : `No tickets with status "${statusConfig[ticketFilter]?.label || ticketFilter}".`}
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-raise-ticket"
                                        onClick={() => handleOpenNewTicket()}
                                    >
                                        <Plus size={16} /> Create Support Ticket
                                    </button>
                                </div>
                            ) : (
                                <div className="tickets-table-wrap">
                                    <table className="tickets-table">
                                        <thead>
                                            <tr>
                                                <th>Ticket #</th>
                                                <th>Subject</th>
                                                <th>Issue Type</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTickets.map((ticket) => {
                                                const priority = ticket.priority || "normal";
                                                const status = ticket.status || "open";
                                                const ticketNum = ticket.ticketNumber || ticket.ticket_number || ticket.id.slice(0, 8);
                                                const issueType = ticket.issueType || ticket.issue_type || "General";
                                                const updated = ticket.updatedAt || ticket.updated_at;

                                                return (
                                                    <tr
                                                        key={ticket.id}
                                                        onClick={() => {
                                                            if (ticket.status === "draft") {
                                                                handleResumeDraftTicket(ticket);
                                                            } else {
                                                                void handleSelectTicket(ticket);
                                                            }
                                                        }}
                                                    >
                                                        <td>
                                                            <span className="ticket-number">{ticketNum}</span>
                                                        </td>
                                                        <td style={{ fontWeight: "600", color: "#0F172A" }}>{ticket.subject}</td>
                                                        <td style={{ color: "#475569" }}>{issueType}</td>
                                                        <td>
                                                            <span
                                                                className="priority-badge"
                                                                style={{
                                                                    background: priorityConfig[priority]?.bg,
                                                                    color: priorityConfig[priority]?.color,
                                                                }}
                                                            >
                                                                {priorityConfig[priority]?.label || priority}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className="status-badge"
                                                                style={{
                                                                    background: statusConfig[status]?.bg,
                                                                    color: statusConfig[status]?.color,
                                                                }}
                                                            >
                                                                {statusConfig[status]?.label || status}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: "12px", color: "#64748B" }}>
                                                            {formatDate(updated)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: Ticket Detail & Conversation */}
                    {view === "ticket-detail" && selectedTicket && (
                        <div className="ticket-detail-view" style={{ maxWidth: "860px", margin: "0 auto", width: "100%" }}>
                            <button
                                type="button"
                                className="help-back-btn"
                                onClick={() => {
                                    setView("tickets");
                                    setSelectedTicket(null);
                                }}
                            >
                                <ChevronLeft size={16} /> Back to Support Tickets
                            </button>

                            <div
                                style={{
                                    background: "#FFFFFF",
                                    borderRadius: "14px",
                                    border: "1px solid #E2E8F0",
                                    padding: "24px",
                                    boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.06)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "20px",
                                }}
                            >
                                {selectedTicket.status === "draft" && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "14px 18px",
                                            background: "#EFF6FF",
                                            border: "1px solid #BFDBFE",
                                            borderRadius: "10px",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <Bookmark size={18} color="#2563EB" />
                                            <div>
                                                <strong style={{ fontSize: "13.5px", color: "#1E40AF" }}>
                                                    This ticket is currently saved as a draft.
                                                </strong>
                                                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#3B82F6" }}>
                                                    You can resume the 7-step wizard to finish and submit your ticket.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="section-action-btn"
                                            style={{ padding: "8px 16px", height: "36px", fontSize: "13px" }}
                                            onClick={() => handleResumeDraftTicket(selectedTicket)}
                                        >
                                            Resume Wizard <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}

                                <div className="ticket-header">
                                    <div className="ticket-title">
                                        <span className="ticket-number">
                                            {selectedTicket.ticketNumber || selectedTicket.ticket_number}
                                        </span>
                                        <h2>{selectedTicket.subject}</h2>
                                    </div>
                                    <div className="ticket-badges">
                                        <span
                                            className="priority-badge"
                                            style={{
                                                background: priorityConfig[selectedTicket.priority]?.bg,
                                                color: priorityConfig[selectedTicket.priority]?.color,
                                            }}
                                        >
                                            {priorityConfig[selectedTicket.priority]?.label || selectedTicket.priority}
                                        </span>
                                        <span
                                            className="status-badge"
                                            style={{
                                                background: statusConfig[selectedTicket.status]?.bg,
                                                color: statusConfig[selectedTicket.status]?.color,
                                            }}
                                        >
                                            {statusConfig[selectedTicket.status]?.label || selectedTicket.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="ticket-meta">
                                    <div>
                                        <strong>Type:</strong> {selectedTicket.issueType || selectedTicket.issue_type || "General"}
                                    </div>
                                    <div>
                                        <strong>Created:</strong> {formatDate(selectedTicket.createdAt || selectedTicket.created_at)}
                                    </div>
                                    <div>
                                        <strong>Updated:</strong> {formatDate(selectedTicket.updatedAt || selectedTicket.updated_at)}
                                    </div>
                                </div>

                                <div className="ticket-description">
                                    <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                                        Description
                                    </h4>
                                    <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                                        {selectedTicket.description}
                                    </p>
                                </div>

                                {/* Status Update Buttons */}
                                <div style={{ paddingTop: "14px", borderTop: "1px solid #F1F5F9" }}>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748B", display: "block", marginBottom: "8px" }}>
                                        Update Ticket Status:
                                    </label>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {(["open", "in_progress", "waiting_on_user", "resolved", "closed"] as const).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                className={`status-btn ${selectedTicket.status === s ? "active" : ""}`}
                                                onClick={() => void handleUpdateTicketStatus(selectedTicket.id, s)}
                                            >
                                                {statusConfig[s]?.label || s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Conversation Thread */}
                                <div className="ticket-messages">
                                    <h4 style={{ margin: "10px 0 4px", fontSize: "15px", fontWeight: "600", color: "#0F172A" }}>
                                        Conversation History ({ticketMessages.length})
                                    </h4>

                                    {loadingMessages ? (
                                        <div style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>
                                            <Loader2 size={20} className="spin" style={{ margin: "0 auto 8px", color: "#2563EB" }} />
                                            <span>Loading messages...</span>
                                        </div>
                                    ) : (
                                        <div className="messages-list">
                                            {ticketMessages.map((msg) => (
                                                <div key={msg.id} className="message">
                                                    <div className="message-header">
                                                        <span className="message-author">
                                                            {(msg.authorId || msg.author_id || "User").slice(0, 8)}
                                                        </span>
                                                        <span className="message-time">
                                                            {formatDate(msg.createdAt || msg.created_at)}
                                                        </span>
                                                    </div>
                                                    <p>{msg.body}</p>
                                                </div>
                                            ))}
                                            {ticketMessages.length === 0 && (
                                                <p style={{ color: "#64748B", fontSize: "13px", padding: "16px 0", margin: 0 }}>
                                                    No messages yet. Send a reply below.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Reply Box */}
                                    <div className="reply-form" style={{ marginTop: "8px" }}>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Type your reply to our support team..."
                                            rows={3}
                                            className="reply-input"
                                        />
                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <button
                                                type="button"
                                                className="btn-raise-ticket"
                                                style={{ height: "42px", padding: "0 20px" }}
                                                onClick={() => void handleSendReply()}
                                                disabled={sendingReply || !replyText.trim()}
                                            >
                                                {sendingReply ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                                                <span>Send Reply</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Right Slide-over Ticket Wizard Drawer */}
            <TicketWizardDrawer
                isOpen={isTicketDrawerOpen}
                onClose={() => setIsTicketDrawerOpen(false)}
                onTicketCreated={handleTicketCreated}
                initialData={drawerInitialTicket}
                initialArticleTitle={drawerArticleTitle}
                helpArticles={popularArticles}
            />
        </main>
    );
}

// ── Article Card Component (Frame 2147225027) ────────────────────────────────

function ArticleCard({ article, onSelect }: { article: HelpArticle; onSelect: () => void }) {
    const helpfulPercent = getHelpfulPercentage(article);
    const readTime = getReadMinutes(article);
    const category = getArticleCategory(article);

    return (
        <div
            className="popular-article-card"
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    onSelect();
                }
            }}
        >
            <div className="card-top">
                <div className="card-icon-wrap">
                    {category ? getCategoryIcon(category.slug) : <FileText size={20} />}
                </div>
                {helpfulPercent !== null ? (
                    <span className="card-helpful-badge">
                        <ThumbsUp size={14} />
                        <span>{helpfulPercent}% helpful</span>
                    </span>
                ) : null}
            </div>

            <div className="card-middle">
                <h4 className="card-title">{article.title}</h4>
                <p className="card-desc">{article.summary}</p>
            </div>

            <div className="card-bottom">
                <span className="card-category">{category?.name || "BOQs & Costing"}</span>
                {readTime !== null ? (
                    <span className="card-read-time">
                        <Clock size={14} />
                        <span>{readTime} min read</span>
                    </span>
                ) : null}
            </div>
        </div>
    );
}

// ── Article Content Renderer ─────────────────────────────────────────────────

function ArticleContentRenderer({ content, summary }: { content?: any; summary?: string | null }) {
    if (!content) {
        return <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: 0 }}>{summary || "No article content available."}</p>;
    }

    // JSON structured format: { shortAnswer, sections: [{ heading, body, items }] }
    if (typeof content === "object") {
        if (Array.isArray(content.sections) && content.sections.length > 0) {
            return (
                <div className="article-sections-flow">
                    {content.sections.map((section: any, idx: number) => (
                        <div key={idx} className="article-section-block">
                            {section.heading && <h3>{section.heading}</h3>}
                            {section.body && <p>{section.body}</p>}
                            {Array.isArray(section.items) && (
                                <ol className="article-ordered-steps">
                                    {section.items.map((item: string, iIdx: number) => (
                                        <li key={iIdx}>{item}</li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        if (content.body) {
            return <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: 0 }}>{content.body}</p>;
        }
    }

    // String format (HTML or plain text)
    if (typeof content === "string") {
        if (content.includes("<") && content.includes(">")) {
            return <div className="article-sections-flow" dangerouslySetInnerHTML={{ __html: content }} />;
        }
        return <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: 0 }}>{content}</p>;
    }

    return <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: 0 }}>{summary || "No article content available."}</p>;
}

// ── Skeleton Loaders ─────────────────────────────────────────────────────────

function HelpSkeleton() {
    return (
        <div className="popular-articles-grid">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    style={{
                        background: "#FFFFFF",
                        borderRadius: "14px",
                        boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.06)",
                        padding: "16px",
                        minHeight: "167px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "16px",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "#E4ECFB" }} />
                        <div style={{ width: "60px", height: "14px", borderRadius: "4px", background: "#F1F5F9" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ height: "16px", width: "70%", borderRadius: "4px", background: "#F1F5F9" }} />
                        <div style={{ height: "12px", width: "95%", borderRadius: "4px", background: "#F8FAFC" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ height: "12px", width: "35%", borderRadius: "4px", background: "#F1F5F9" }} />
                        <div style={{ height: "12px", width: "25%", borderRadius: "4px", background: "#F1F5F9" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CategorySkeleton() {
    return (
        <div className="product-categories-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                    key={i}
                    style={{
                        background: "#FFFFFF",
                        borderRadius: "14px",
                        boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.06)",
                        padding: "16px",
                        minHeight: "111px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                    }}
                >
                    <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "#E4ECFB", flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                        <div style={{ height: "16px", width: "55%", borderRadius: "4px", background: "#F1F5F9" }} />
                        <div style={{ height: "12px", width: "85%", borderRadius: "4px", background: "#F8FAFC" }} />
                        <div style={{ height: "12px", width: "30%", marginTop: "4px", borderRadius: "4px", background: "#E4ECFB" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
