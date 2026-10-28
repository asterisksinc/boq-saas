"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Ticket,
    X,
    FileText,
    AlertCircle,
} from "lucide-react";

import {
    getHelpOverview,
    getHelpArticle,
    submitArticleFeedback,
    listSupportTickets,
    getSupportTicket,
    updateSupportTicket,
    listSupportTicketMessages,
    createSupportTicketMessage,
    HelpArticle,
    HelpOverview,
    SupportTicket,
    SupportTicketMessage,
} from "@/lib/api/auth";
import TicketWizardDrawer from "@/components/TicketWizardDrawer";
import HelpSupportLayout from "./HelpSupportLayout";
import HelpSearch from "./HelpSearch";
import ArticleCard from "./ArticleCard";
import { HelpCategoriesGrid, HelpCategoryItem } from "./HelpCategory";
import HelpSupportCta from "./HelpSupportCta";
import { HelpSkeleton, CategorySkeleton } from "./HelpSkeletons";
import ArticleDetailView from "./ArticleDetailView";
import TicketsTableView from "./TicketsTableView";
import TicketDetailView from "./TicketDetailView";
import { getArticleCategory } from "./help-helpers";

export const DEFAULT_CATEGORIES: HelpCategoryItem[] = [
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

export const DEFAULT_POPULAR_ARTICLES: HelpArticle[] = [
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

export interface HelpSupportViewProps {
    rail: React.ReactNode;
    header: React.ReactNode;
    baseRoute?: string;
    role?: "user" | "client";
}

export function HelpSupportView({
    rail,
    header,
    baseRoute = "/help",
    role = "user",
}: HelpSupportViewProps) {
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

    // Read query params
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const action = params.get("action");
            const articleTitle = params.get("articleTitle");
            if (action === "new-ticket") {
                handleOpenNewTicket(articleTitle);
                window.history.replaceState({}, "", baseRoute);
            }
        }
    }, [baseRoute]);

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
            const fullArticle = await getHelpArticle(article.slug || article.id);
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
            await submitArticleFeedback(selectedArticle.slug || selectedArticle.id, { helpful });
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
            showNotice(`Ticket status updated`);
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

    // Categories with dynamic counts
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

    // Popular articles
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
        const q = searchQuery.toLowerCase().trim();
        return DEFAULT_POPULAR_ARTICLES.filter((a) =>
            a.title.toLowerCase().includes(q) ||
            (a.summary?.toLowerCase() || "").includes(q)
        );
    }, [searchQuery, helpData]);

    return (
        <HelpSupportLayout
            rail={rail}
            header={header}
            notice={notice}
            drawer={
                <TicketWizardDrawer
                    isOpen={isTicketDrawerOpen}
                    onClose={() => setIsTicketDrawerOpen(false)}
                    onTicketCreated={handleTicketCreated}
                    initialData={drawerInitialTicket}
                    initialArticleTitle={drawerArticleTitle}
                    helpArticles={popularArticles}
                />
            }
        >
            {/* View: Help Center Main */}
            {view === "center" && (
                <>
                    {/* Section 1: Intro Header & Buttons */}
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

                    {/* Section 2: Knowledge-Base Search */}
                    <HelpSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onClear={() => setSearchQuery("")}
                        onSubmit={() => {
                            if (searchResults.length > 0) {
                                void handleSelectArticle(searchResults[0]);
                            }
                        }}
                        loading={loadingHelp}
                    />

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
                            {/* Section 3: Popular Articles */}
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

                            {/* Section 4: Browse by Product Area */}
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
                                    <HelpCategoriesGrid
                                        categories={categoriesWithCounts}
                                        onSelectCategory={(slug) => {
                                            setSelectedCategory(slug);
                                            setView("articles");
                                        }}
                                    />
                                )}
                            </div>

                            {/* Section 5: Bottom Support CTA */}
                            <HelpSupportCta onRaiseTicket={() => handleOpenNewTicket()} />
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
                    <HelpSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onClear={() => setSearchQuery("")}
                        placeholder="Search within articles..."
                    />

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
                <ArticleDetailView
                    article={selectedArticle}
                    loading={loadingArticle}
                    feedbackGiven={articleFeedbackGiven}
                    onFeedback={(helpful) => void handleArticleFeedback(helpful)}
                    onRaiseTicket={(art) => handleRaiseTicketFromArticle(art)}
                    onBack={() => setView("center")}
                />
            )}

            {/* View: Tickets Listing ("View My Ticket") */}
            {view === "tickets" && (
                <TicketsTableView
                    tickets={tickets}
                    loading={loadingTickets}
                    error={ticketsError}
                    ticketFilter={ticketFilter}
                    onFilterChange={setTicketFilter}
                    onBack={() => setView("center")}
                    onSelectTicket={(ticket) => {
                        if (ticket.status === "draft") {
                            handleResumeDraftTicket(ticket);
                        } else {
                            void handleSelectTicket(ticket);
                        }
                    }}
                    onOpenNewTicket={() => handleOpenNewTicket()}
                    onRetry={() => void loadTickets()}
                />
            )}

            {/* View: Ticket Detail & Conversation */}
            {view === "ticket-detail" && selectedTicket && (
                <TicketDetailView
                    ticket={selectedTicket}
                    messages={ticketMessages}
                    loadingMessages={loadingMessages}
                    replyText={replyText}
                    onReplyTextChange={setReplyText}
                    onSendReply={() => void handleSendReply()}
                    sendingReply={sendingReply}
                    onUpdateStatus={(status) => void handleUpdateTicketStatus(selectedTicket.id, status)}
                    onResumeDraft={handleResumeDraftTicket}
                    onBack={() => {
                        setView("tickets");
                        setSelectedTicket(null);
                    }}
                />
            )}
        </HelpSupportLayout>
    );
}

export default HelpSupportView;
