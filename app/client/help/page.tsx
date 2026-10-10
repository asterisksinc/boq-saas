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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import TicketWizardDrawer from "@/components/TicketWizardDrawer";

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
    if (!iso) return "Aug 28, 2026";
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "Aug 28, 2026";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(d);
    } catch {
        return "Aug 28, 2026";
    }
};

function getArticleCategory(article: HelpArticle): { slug: string; name: string } | null {
    if (article.category) return article.category;
    if (article.help_categories) {
        if (Array.isArray(article.help_categories)) {
            return article.help_categories[0] ?? null;
        }
        return article.help_categories;
    }
    return null;
}

function getHelpfulPercentage(article: HelpArticle): number | null {
    const yes = article.helpfulYes ?? article.helpful_yes ?? 0;
    const no = article.helpfulNo ?? article.helpful_no ?? 0;
    const total = yes + no;
    if (total <= 0) return null;
    return Math.round((yes / total) * 100);
}

function getReadMinutes(article: HelpArticle): number {
    return article.readMinutes ?? article.read_minutes ?? 4;
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
    if (s.includes("getting-started") || s.includes("start")) return <Sparkles size={16} />;
    if (s.includes("project") || s.includes("activit")) return <LayoutDashboard size={16} />;
    if (s.includes("boq") || s.includes("cost")) return <FileSpreadsheet size={16} />;
    if (s.includes("proposal") || s.includes("invoice")) return <Receipt size={16} />;
    if (s.includes("doc")) return <FolderOpen size={16} />;
    if (s.includes("integration")) return <Link2 size={16} />;
    if (s.includes("team") || s.includes("permission")) return <Users size={16} />;
    if (s.includes("bill") || s.includes("account")) return <CreditCard size={16} />;
    return <HelpCircle size={16} />;
}

export default function ClientHelpPage() {
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

    // Read query params
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const action = params.get("action");
            const articleTitle = params.get("articleTitle");
            if (action === "new-ticket") {
                handleOpenNewTicket(articleTitle);
                window.history.replaceState({}, "", "/client/help");
            }
        }
    }, []);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 1) {
                void loadHelp(searchQuery.trim());
            } else if (searchQuery.trim().length === 0) {
                void loadHelp();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, loadHelp]);

    // Select Article Detail
    const handleSelectArticle = async (article: HelpArticle) => {
        setSelectedArticle(article);
        setArticleFeedbackGiven(false);
        setView("article");
        setLoadingArticle(true);
        try {
            const full = await getHelpArticle(article.slug || article.id);
            setSelectedArticle(full);
        } catch {
            // Keep preview article on error
        } finally {
            setLoadingArticle(false);
        }
    };

    // Article Feedback
    const handleArticleFeedback = async (helpful: boolean) => {
        if (!selectedArticle || articleFeedbackGiven) return;
        try {
            await submitArticleFeedback(selectedArticle.slug || selectedArticle.id, { helpful });
            setArticleFeedbackGiven(true);
            showNotice("Thank you for your feedback!", "success");
        } catch {
            showNotice("Could not record feedback", "error");
        }
    };

    // Raise ticket from article
    const handleRaiseTicketFromArticle = (article: HelpArticle) => {
        handleOpenNewTicket(article.title);
    };

    // Load Tickets
    const loadTickets = useCallback(async () => {
        setLoadingTickets(true);
        setTicketsError(null);
        try {
            const data = await listSupportTickets();
            setTickets(data.items || []);
        } catch (err: any) {
            setTicketsError(err.message || "Could not load support tickets");
        } finally {
            setLoadingTickets(false);
        }
    }, []);

    // Select Ticket Detail
    const handleSelectTicket = async (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setView("ticket-detail");
        setLoadingMessages(true);
        try {
            const [freshTicket, msgs] = await Promise.all([
                getSupportTicket(ticket.id),
                listSupportTicketMessages(ticket.id),
            ]);
            setSelectedTicket(freshTicket);
            setTicketMessages(msgs.items || []);
        } catch {
            // keep state on error
        } finally {
            setLoadingMessages(false);
        }
    };

    // Update Ticket Status
    const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
        try {
            const updated = await updateSupportTicket(ticketId, { status } as any);
            setSelectedTicket(updated);
            setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
            showNotice(`Ticket status updated to ${statusConfig[status]?.label || status}`);
        } catch (err: any) {
            showNotice(err.message || "Could not update ticket status", "error");
        }
    };

    // Send Message Reply
    const handleSendReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;
        setSendingReply(true);
        try {
            const msg = await createSupportTicketMessage(selectedTicket.id, { body: replyText.trim() });
            setTicketMessages((prev) => [...prev, msg]);
            setReplyText("");
            showNotice("Reply sent successfully");
        } catch (err: any) {
            showNotice(err.message || "Could not send reply", "error");
        } finally {
            setSendingReply(false);
        }
    };

    const categoriesWithCounts = useMemo(() => {
        return (helpData?.categories ?? []).map((category) => {
            const realCount = (helpData?.articles ?? []).filter((a) => {
                const catInfo = getArticleCategory(a);
                if (catInfo?.slug === category.slug) return true;
                if (a.categoryId === category.id || a.category_id === category.id) return true;
                return false;
            }).length;
            return {
                ...category,
                articleCount: realCount,
            };
        });
    }, [helpData]);

    const popularArticles = useMemo(() => {
        return helpData?.articles ?? [];
    }, [helpData]);

    const filteredArticles = useMemo(() => {
        if (!helpData?.articles) return [];
        let list = helpData.articles;
        if (selectedCategory) {
            list = list.filter((a) => {
                const cat = getArticleCategory(a);
                return cat?.slug === selectedCategory;
            });
        }
        return list;
    }, [helpData, selectedCategory]);

    const filteredTickets = useMemo(() => {
        if (ticketFilter === "all") return tickets;
        return tickets.filter((t) => t.status === ticketFilter);
    }, [tickets, ticketFilter]);

    return (
        <main className="fig-dashboard">
            <ClientDashboardRail current="/client/help" />
            <div className="fig-dashboard-glow" />

            <div className="fig-dashboard-main">
                <DashboardHeader title="Help & Support" hideNew={true} />

                <section className="help-content">
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
                            <div className="help-hero">
                                <div className="help-hero-text">
                                    <h2>How Can We Help You Today?</h2>
                                    <p>Find answers, review BOQs &amp; documents, or contact our support team.</p>
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
                                        <Ticket size={15} />
                                        <span>View My Tickets</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-raise-ticket"
                                        onClick={() => handleOpenNewTicket()}
                                    >
                                        <Plus size={15} />
                                        <span>Raise a Ticket</span>
                                    </button>
                                </div>
                            </div>

                            <div className="help-global-search">
                                <Search size={17} className="search-icon" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search questions, features, error messages, or topics"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        className="clear-btn"
                                        onClick={() => setSearchQuery("")}
                                        aria-label="Clear search"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {searchQuery.trim() !== "" ? (
                                <div className="help-section">
                                    <div className="help-section-header">
                                        <h3>Search Results ({helpData?.articles.length || 0})</h3>
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
                                    ) : (helpData?.articles || []).length === 0 ? (
                                        <div className="empty-state">
                                            <Search size={44} />
                                            <h3>No articles found</h3>
                                            <p>We couldn&apos;t find any articles matching &ldquo;{searchQuery}&rdquo;</p>
                                            <button
                                                type="button"
                                                className="btn-raise-ticket"
                                                onClick={() => handleOpenNewTicket()}
                                            >
                                                <Plus size={16} /> Raise a Support Ticket
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="popular-articles-grid">
                                            {helpData?.articles.map((article) => (
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
                                            <div className="empty-state">
                                                <AlertCircle size={40} />
                                                <h3>Unable to load articles</h3>
                                                <p>{helpError}</p>
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

                                    <div className="help-categories-section">
                                        <div className="help-categories-header">
                                            <h3>BROWSE BY TOPIC</h3>
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
                                                    >
                                                        <div className="category-icon-box">
                                                            {getCategoryIcon(cat.slug)}
                                                        </div>
                                                        <div className="category-info">
                                                            <h4>{cat.name}</h4>
                                                            <p>{cat.description}</p>
                                                            <span className="category-count-link">
                                                                {cat.articleCount} {cat.articleCount === 1 ? "Article" : "Articles"}
                                                                <ChevronRight size={12} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="help-support-cta">
                                        <div className="cta-watermark">?</div>
                                        <div className="cta-content">
                                            <span className="cta-tag">Need Assistance?</span>
                                            <h3>Can&apos;t find what you need?</h3>
                                            <p>Our project team is available to assist you with any questions or issues.</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-cta-raise"
                                            onClick={() => handleOpenNewTicket()}
                                        >
                                            <span>Raise a Support Ticket</span>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* View: All Articles */}
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
                                            ? helpData?.categories.find((c) => c.slug === selectedCategory)?.name || "Articles"
                                            : "All Help Articles"}
                                    </h2>
                                    <p>Browse guides, tutorials, and frequently asked questions.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-raise-ticket"
                                    onClick={() => handleOpenNewTicket()}
                                >
                                    <Plus size={16} /> Raise a Ticket
                                </button>
                            </div>

                            <div className="help-global-search">
                                <Search size={20} className="search-icon" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search within articles..."
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        className="clear-btn"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="category-pills">
                                <button
                                    type="button"
                                    className={`category-pill ${!selectedCategory ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    All ({helpData?.articles.length || 0})
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

                            {loadingHelp ? (
                                <HelpSkeleton />
                            ) : filteredArticles.length === 0 ? (
                                <div className="empty-state">
                                    <FileText size={44} />
                                    <h3>No articles found</h3>
                                    <p>No articles match your current filter or search criteria.</p>
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
                                <span>Back to Help Centre</span>
                            </button>

                            <div className="article-header-card">
                                {getArticleCategory(selectedArticle) && (
                                    <span className="article-header-category">
                                        {getArticleCategory(selectedArticle)?.name}
                                    </span>
                                )}
                                <h1 className="article-header-title">{selectedArticle.title}</h1>
                                <div className="article-header-meta">
                                    <span>Updated {formatArticleDate(selectedArticle.updatedAt || selectedArticle.updated_at)}</span>
                                    <span className="meta-dot">·</span>
                                    <span>{getReadMinutes(selectedArticle)} min read</span>
                                    {getHelpfulPercentage(selectedArticle) !== null && (
                                        <>
                                            <span className="meta-dot">·</span>
                                            <span>{getHelpfulPercentage(selectedArticle)}% helpful</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {getArticleShortAnswer(selectedArticle) && (
                                <div className="article-short-answer-card">
                                    <h4>Short answer</h4>
                                    <p>{getArticleShortAnswer(selectedArticle)}</p>
                                </div>
                            )}

                            <div className="article-body-card">
                                {loadingArticle ? (
                                    <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748b" }}>
                                        <Loader2 size={24} className="spin" style={{ margin: "0 auto 10px" }} />
                                        <p style={{ fontSize: "13px" }}>Loading article details...</p>
                                    </div>
                                ) : (
                                    <ArticleContentRenderer
                                        content={selectedArticle.content}
                                        summary={selectedArticle.summary}
                                    />
                                )}
                            </div>

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
                                    <span className="feedback-thanks">
                                        ✓ Feedback recorded. Thank you!
                                    </span>
                                )}
                            </div>

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
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* View: Tickets Listing */}
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
                                    <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
                                        Track and manage your requests to our support team.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-raise-ticket"
                                    onClick={() => handleOpenNewTicket()}
                                >
                                    <Plus size={16} /> Raise a Ticket
                                </button>
                            </div>

                            <div className="category-pills" style={{ marginTop: "8px" }}>
                                {["all", "open", "in_progress", "waiting_on_user", "resolved", "closed"].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`category-pill ${ticketFilter === s ? "active" : ""}`}
                                        onClick={() => setTicketFilter(s)}
                                    >
                                        {s === "all" ? "All Tickets" : statusConfig[s]?.label || s}
                                    </button>
                                ))}
                            </div>

                            {loadingTickets ? (
                                <HelpSkeleton />
                            ) : ticketsError ? (
                                <div className="empty-state">
                                    <AlertCircle size={44} />
                                    <h3>Couldn&apos;t load tickets</h3>
                                    <p>{ticketsError}</p>
                                    <button
                                        type="button"
                                        className="btn-view-ticket"
                                        onClick={() => void loadTickets()}
                                    >
                                        <RefreshCw size={14} /> Retry
                                    </button>
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="empty-state">
                                    <Ticket size={48} />
                                    <h3>No tickets found</h3>
                                    <p>
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
                                <div className="tickets-table-wrap" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
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
                                                        style={{ cursor: "pointer" }}
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
                                                        <td style={{ fontWeight: "600" }}>{ticket.subject}</td>
                                                        <td>{issueType}</td>
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
                                                        <td style={{ fontSize: "12px", color: "#64748b" }}>
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

                    {/* View: Ticket Detail */}
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
                                    background: "#ffffff",
                                    borderRadius: "14px",
                                    border: "1px solid #e2e8f0",
                                    padding: "24px",
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
                                            background: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            borderRadius: "10px",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <Bookmark size={18} color="#2563eb" />
                                            <div>
                                                <strong style={{ fontSize: "13.5px", color: "#1e40af" }}>
                                                    This ticket is currently saved as a draft.
                                                </strong>
                                                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#3b82f6" }}>
                                                    You can resume the 7-step wizard to finish and submit your ticket.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="ticket-drawer-btn-continue"
                                            style={{ padding: "8px 16px", fontSize: "12.5px" }}
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
                                    <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                                        Description
                                    </h4>
                                    <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                                        {selectedTicket.description}
                                    </p>
                                </div>

                                <div className="ticket-status-actions" style={{ paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                                        Update Status:
                                    </label>
                                    <div className="status-buttons" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
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

                                <div className="ticket-messages">
                                    <h4 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>
                                        Conversation History ({ticketMessages.length})
                                    </h4>

                                    {loadingMessages ? (
                                        <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                                            <Loader2 size={20} className="spin" style={{ margin: "0 auto 8px" }} />
                                            <span>Loading messages...</span>
                                        </div>
                                    ) : (
                                        <div className="messages-list">
                                            {ticketMessages.map((msg) => (
                                                <div key={msg.id} className="message">
                                                    <div className="message-header">
                                                        <span className="message-author">
                                                            {(msg.authorId || msg.author_id || "Support Team").slice(0, 8)}
                                                        </span>
                                                        <span className="message-time">
                                                            {formatDate(msg.createdAt || msg.created_at)}
                                                        </span>
                                                    </div>
                                                    <p>{msg.body}</p>
                                                </div>
                                            ))}
                                            {ticketMessages.length === 0 && (
                                                <p className="no-messages" style={{ color: "#64748b", fontSize: "13px" }}>
                                                    No messages yet. Send a reply below.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="reply-form" style={{ marginTop: "16px" }}>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Type your reply to our support team..."
                                            rows={3}
                                            className="reply-input"
                                        />
                                        <button
                                            type="button"
                                            className="btn-primary"
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
                    )}
                </section>
            </div>

            <TicketWizardDrawer
                isOpen={isTicketDrawerOpen}
                onClose={() => setIsTicketDrawerOpen(false)}
                onTicketCreated={handleTicketCreated}
                initialData={drawerInitialTicket}
                initialArticleTitle={drawerArticleTitle}
                helpArticles={helpData?.articles || []}
            />
        </main>
    );
}

function ArticleCard({ article, onSelect }: { article: HelpArticle; onSelect: () => void }) {
    const helpfulPercent = getHelpfulPercentage(article) ?? 96;
    const readTime = getReadMinutes(article) || 4;
    const category = getArticleCategory(article);

    return (
        <div className="popular-article-card" onClick={onSelect}>
            <div className="card-top">
                <div className="card-icon-wrap">
                    <FileText size={14} />
                </div>
                <span className="card-helpful-badge">
                    <ThumbsUp size={11} />
                    <span>{helpfulPercent}% helpful</span>
                </span>
            </div>

            <h4 className="card-title">{article.title}</h4>
            <p className="card-desc">{article.summary}</p>

            <div className="card-bottom">
                <span className="card-category">{category?.name || "Client Portal"}</span>
                <span className="card-read-time">
                    <Clock size={11} />
                    <span>{readTime} min read</span>
                </span>
            </div>
        </div>
    );
}

function ArticleContentRenderer({ content, summary }: { content?: any; summary?: string | null }) {
    if (!content) {
        return <p className="article-default-summary">{summary || "No article content available."}</p>;
    }

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
            return <p className="article-plain-body" style={{ whiteSpace: "pre-wrap" }}>{content.body}</p>;
        }
    }

    if (typeof content === "string") {
        if (content.includes("<") && content.includes(">")) {
            return <div className="article-sections-flow" dangerouslySetInnerHTML={{ __html: content }} />;
        }
        return <p className="article-plain-body" style={{ whiteSpace: "pre-wrap" }}>{content}</p>;
    }

    return <p className="article-default-summary">{summary || "No article content available."}</p>;
}

function HelpSkeleton() {
    return (
        <div className="popular-articles-grid">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    style={{
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        padding: "13px 15px",
                        height: "120px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#f1f5f9" }} />
                    <div style={{ height: "14px", width: "70%", borderRadius: "4px", background: "#f1f5f9" }} />
                    <div style={{ height: "11px", width: "90%", borderRadius: "4px", background: "#f8fafc" }} />
                    <div style={{ height: "10px", width: "40%", marginTop: "auto", borderRadius: "4px", background: "#f1f5f9" }} />
                </div>
            ))}
        </div>
    );
}

function CategorySkeleton() {
    return (
        <div className="product-categories-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                    key={i}
                    style={{
                        background: "#ffffff",
                        borderRadius: "9px",
                        border: "1px solid #e2e8f0",
                        padding: "10px 13px",
                        height: "56px",
                        display: "flex",
                        alignItems: "center",
                        gap: "11px",
                    }}
                >
                    <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#f1f5f9", flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                        <div style={{ height: "12px", width: "50%", borderRadius: "4px", background: "#f1f5f9" }} />
                        <div style={{ height: "9px", width: "75%", borderRadius: "4px", background: "#f8fafc" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
