"use client";

import {
    ChevronLeft,
    ChevronRight,
    Search,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    Plus,
    X,
    Send,
    Clock,
    AlertCircle,
    CheckCircle,
    Filter,
    FileText,
    User,
    Settings,
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
    HelpCategory,
    HelpOverview,
    SupportTicket,
    SupportTicketMessage,
    SupportTicketInput,
    SupportTicketPatchInput,
    SupportTicketMessageInput,
} from "@/lib/api/auth";

const navRoutes = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing", "/activities", "/settings", "/help"];
const navIcons = [
    "dashboard-overview-active",
    "dashboard-projects",
    "dashboard-boqs",
    "dashboard-costs",
    "dashboard-workspace",
    "dashboard-estimates",
    "dashboard-purchase-orders",
    "dashboard-analytics",
    "dashboard-reports",
    "dashboard-integrations",
    "dashboard-billing",
    "dashboard-activities-active",
    "dashboard-settings",
    "dashboard-help",
];

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: "Low", color: "#22c55e", bg: "#f0fdf4" },
    normal: { label: "Normal", color: "#3b82f6", bg: "#eff6ff" },
    high: { label: "High", color: "#f59e0b", bg: "#fffbeb" },
    urgent: { label: "Urgent", color: "#ef4444", bg: "#fef2f2" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Draft", color: "#6b7280", bg: "#f9fafb" },
    open: { label: "Open", color: "#3b82f6", bg: "#eff6ff" },
    in_progress: { label: "In Progress", color: "#8b5cf6", bg: "#f5f3ff" },
    waiting_on_user: { label: "Waiting on User", color: "#f59e0b", bg: "#fffbeb" },
    resolved: { label: "Resolved", color: "#22c55e", bg: "#f0fdf4" },
    closed: { label: "Closed", color: "#6b7280", bg: "#f9fafb" },
};

const date = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(x)) : "—";

export default function HelpPage() {
    const router = useRouter();
    const [helpData, setHelpData] = useState<HelpOverview | null>(null);
    const [loadingHelp, setLoadingHelp] = useState(true);

    const [view, setView] = useState<"center" | "article" | "tickets" | "new-ticket" | "ticket-detail">("center");
    const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchDebounce, setSearchDebounce] = useState("");

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [ticketMessages, setTicketMessages] = useState<SupportTicketMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [ticketFilter, setTicketFilter] = useState<string>("all");

    const [newTicketForm, setNewTicketForm] = useState<SupportTicketInput>({ issueType: "", subject: "", description: "", priority: "normal", status: "open" });
    const [creatingTicket, setCreatingTicket] = useState(false);

    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadHelp = useCallback(async (query?: string) => {
        setLoadingHelp(true);
        try {
            const data = await getHelpOverview(query);
            setHelpData(data);
        } catch {
            setNotice({ message: "Could not load help center", type: "error" });
        } finally {
            setLoadingHelp(false);
        }
    }, []);

    useEffect(() => { loadHelp(); }, [loadHelp]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(searchQuery);
            if (view === "center") loadHelp(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, view, loadHelp]);

    const loadTickets = useCallback(async () => {
        setLoadingTickets(true);
        try {
            const data = await listSupportTickets();
            setTickets(data.items || []);
        } catch {
            setNotice({ message: "Could not load tickets", type: "error" });
        } finally {
            setLoadingTickets(false);
        }
    }, []);

    useEffect(() => { if (view === "tickets") loadTickets(); }, [view, loadTickets]);

    const loadTicketDetail = async (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setLoadingMessages(true);
        try {
            const [ticketData, messagesData] = await Promise.all([
                getSupportTicket(ticket.id),
                listSupportTicketMessages(ticket.id),
            ]);
            setSelectedTicket(ticketData);
            setTicketMessages(messagesData.items || []);
            setView("ticket-detail");
        } catch {
            setNotice({ message: "Could not load ticket", type: "error" });
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleCreateTicket = async (e: FormEvent) => {
        e.preventDefault();
        if (!newTicketForm.issueType || !newTicketForm.subject || !newTicketForm.description) return;
        setCreatingTicket(true);
        try {
            const ticket = await createSupportTicket(newTicketForm);
            setNotice({ message: "Ticket created", type: "success" });
            setNewTicketForm({ issueType: "", subject: "", description: "", priority: "normal", status: "open" });
            setView("tickets");
            loadTickets();
        } catch (e: any) {
            setNotice({ message: e.message || "Could not create ticket", type: "error" });
        } finally {
            setCreatingTicket(false);
        }
    };

    const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket["status"]) => {
        try {
            await updateSupportTicket(ticketId, { status });
            setNotice({ message: "Ticket updated", type: "success" });
            if (selectedTicket?.id === ticketId) loadTicketDetail({ ...selectedTicket, status } as SupportTicket);
            loadTickets();
        } catch (e: any) {
            setNotice({ message: e.message || "Could not update ticket", type: "error" });
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setSendingReply(true);
        try {
            await createSupportTicketMessage(selectedTicket.id, { body: replyText.trim() });
            setReplyText("");
            const messagesData = await listSupportTicketMessages(selectedTicket.id);
            setTicketMessages(messagesData.items || []);
        } catch {
            setNotice({ message: "Could not send reply", type: "error" });
        } finally {
            setSendingReply(false);
        }
    };

    const handleArticleFeedback = async (helpful: boolean) => {
        if (!selectedArticle) return;
        try {
            await submitArticleFeedback(selectedArticle.slug, { helpful });
            setSelectedArticle(prev => prev ? { ...prev, helpfulYes: helpful ? prev.helpfulYes + 1 : prev.helpfulYes, helpfulNo: helpful ? prev.helpfulNo : prev.helpfulNo + 1 } : null);
        } catch {
            setNotice({ message: "Could not submit feedback", type: "error" });
        }
    };

    const filteredArticles = useMemo(() => {
        if (!helpData) return [];
        let articles = helpData.articles;
        if (selectedCategory) articles = articles.filter(a => a.category?.slug === selectedCategory);
        return articles;
    }, [helpData, selectedCategory]);

    const filteredTickets = useMemo(() => {
        if (ticketFilter === "all") return tickets;
        return tickets.filter(t => t.status === ticketFilter);
    }, [tickets, ticketFilter]);

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 4000);
    };

    return (
        <main className="fig-dashboard boq-dashboard help-page">
            <div className="fig-dashboard-glow" />
            <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
                <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
                <nav className="fig-dashboard-menu">
                    {navRoutes.map((route, index) => (
                        <button key={route} type="button" className={index === 13 ? "is-current" : ""} aria-label={`Navigate to ${route}`} onClick={() => window.location.assign(route)}>
                            <img src={`/assets/dashboard/${navIcons[index]}.svg`} alt="" />
                        </button>
                    ))}
                </nav>
                <div className="fig-dashboard-tools">
                    <button type="button" aria-label="Help"><img src="/assets/dashboard/dashboard-help.svg" alt="" /></button>
                    <button type="button" aria-label="Settings"><img src="/assets/dashboard/dashboard-settings.svg" alt="" /></button>
                </div>
            </aside>

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Help & Support</h1>
                    <div className="fig-dashboard-header-actions">
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
                        <div className="fig-dashboard-avatar">HS</div>
                    </div>
                </header>

                <section className="help-content">
                    {notice && <div className={`notice-banner ${notice.type}`}><span>{notice.message}</span></div>}

                    <div className="help-layout">
                        <aside className="help-sidebar">
                            <nav className="help-nav">
                                <button className={view === "center" ? "active" : ""} onClick={() => { setView("center"); setSelectedArticle(null); }}>
                                    <Settings size={18} />
                                    <span>Help Center</span>
                                </button>
                                <button className={view === "tickets" || view === "ticket-detail" || view === "new-ticket" ? "active" : ""} onClick={() => { setView("tickets"); loadTickets(); }}>
                                    <MessageSquare size={18} />
                                    <span>Support Tickets</span>
                                    {tickets.filter(t => !["resolved", "closed"].includes(t.status)).length > 0 && (
                                        <span className="nav-badge">{tickets.filter(t => !["resolved", "closed"].includes(t.status)).length}</span>
                                    )}
                                </button>
                                {view === "tickets" && (
                                    <button className="new-ticket-btn" onClick={() => setView("new-ticket")}>
                                        <Plus size={16} /> New Ticket
                                    </button>
                                )}
                            </nav>

                            {view === "center" && helpData && (
                                <div className="help-categories">
                                    <h4>Categories</h4>
                                    <button className={!selectedCategory ? "active" : ""} onClick={() => setSelectedCategory(null)}>All</button>
                                    {helpData.categories.map(cat => (
                                        <button key={cat.slug} className={selectedCategory === cat.slug ? "active" : ""} onClick={() => setSelectedCategory(cat.slug)}>
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {view === "tickets" && (
                                <div className="ticket-filters">
                                    <h4>Filter</h4>
                                    <button className={ticketFilter === "all" ? "active" : ""} onClick={() => setTicketFilter("all")}>All</button>
                                    <button className={ticketFilter === "open" ? "active" : ""} onClick={() => setTicketFilter("open")}>Open</button>
                                    <button className={ticketFilter === "in_progress" ? "active" : ""} onClick={() => setTicketFilter("in_progress")}>In Progress</button>
                                    <button className={ticketFilter === "waiting_on_user" ? "active" : ""} onClick={() => setTicketFilter("waiting_on_user")}>Waiting</button>
                                    <button className={ticketFilter === "resolved" ? "active" : ""} onClick={() => setTicketFilter("resolved")}>Resolved</button>
                                    <button className={ticketFilter === "closed" ? "active" : ""} onClick={() => setTicketFilter("closed")}>Closed</button>
                                </div>
                            )}
                        </aside>

                        <div className="help-main">
                            {view === "center" && <HelpCenterView helpData={helpData} loading={loadingHelp} articles={filteredArticles} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSelectArticle={setSelectedArticle} />}
                            {view === "article" && selectedArticle && <ArticleView article={selectedArticle} onBack={() => { setView("center"); setSelectedArticle(null); }} onFeedback={handleArticleFeedback} />}
                            {view === "tickets" && <TicketsListView tickets={filteredTickets} loading={loadingTickets} onSelectTicket={loadTicketDetail} onNewTicket={() => setView("new-ticket")} />}
                            {view === "new-ticket" && <NewTicketView form={newTicketForm} setForm={setNewTicketForm} onSubmit={handleCreateTicket} onCancel={() => setView("tickets")} submitting={creatingTicket} />}
                            {view === "ticket-detail" && selectedTicket && <TicketDetailView ticket={selectedTicket} messages={ticketMessages} loading={loadingMessages} replyText={replyText} setReplyText={setReplyText} onSendReply={handleSendReply} sending={sendingReply} onStatusChange={handleUpdateTicketStatus} onBack={() => { setView("tickets"); setSelectedTicket(null); }} />}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function HelpCenterView({ helpData, loading, articles, searchQuery, setSearchQuery, onSelectArticle }: { helpData: HelpOverview | null; loading: boolean; articles: HelpArticle[]; searchQuery: string; setSearchQuery: (query: string) => void; onSelectArticle: (article: HelpArticle) => void }) {
    if (loading) return <HelpSkeleton />;

    return (
        <div className="help-center">
            <div className="help-header">
                <div className="help-search">
                    <Search size={18} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search help articles..." />
                </div>
            </div>

            <div className="popular-articles">
                <h3>Popular Articles</h3>
                {articles.slice(0, 5).map(article => (
                    <button key={article.id} className="article-card" onClick={() => onSelectArticle(article)}>
                        <div className="article-info">
                            <h4>{article.title}</h4>
                            <p>{article.summary}</p>
                        </div>
                        <div className="article-meta">
                            <span>{article.readMinutes} min read</span>
                            {article.category && <span className="article-category">{article.category.name}</span>}
                        </div>
                    </button>
                ))}
            </div>

            <div className="all-articles">
                <h3>All Articles</h3>
                {articles.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No articles found</p>
                    </div>
                ) : (
                    <div className="articles-list">
                        {articles.map(article => (
                            <button key={article.id} className="article-row" onClick={() => onSelectArticle(article)}>
                                <div className="article-main">
                                    <h4>{article.title}</h4>
                                    <p>{article.summary}</p>
                                </div>
                                <div className="article-tags">
                                    {article.category && <span className="tag">{article.category.name}</span>}
                                    <span className="read-time">{article.readMinutes} min</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ArticleView({ article, onBack, onFeedback }: { article: HelpArticle; onBack: () => void; onFeedback: (helpful: boolean) => void }) {
    return (
        <div className="article-view">
            <button className="back-btn" onClick={onBack}><ChevronLeft size={18} /> Back</button>

            <article className="article-content">
                {article.category && <span className="article-category">{article.category.name}</span>}
                <h1>{article.title}</h1>
                <div className="article-meta-top">
                    <span>{article.readMinutes} min read</span>
                    <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                </div>

                <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content || "" }} />

                <div className="article-feedback">
                    <p>Was this article helpful?</p>
                    <div className="feedback-buttons">
                        <button className="feedback-btn" onClick={() => onFeedback(true)}>
                            <ThumbsUp size={18} />
                            <span>Yes ({article.helpfulYes})</span>
                        </button>
                        <button className="feedback-btn" onClick={() => onFeedback(false)}>
                            <ThumbsDown size={18} />
                            <span>No ({article.helpfulNo})</span>
                        </button>
                    </div>
                </div>
            </article>
        </div>
    );
}

function TicketsListView({ tickets, loading, onSelectTicket, onNewTicket }: { tickets: SupportTicket[]; loading: boolean; onSelectTicket: (ticket: SupportTicket) => void; onNewTicket: () => void }) {
    if (loading) return <HelpSkeleton />;

    return (
        <div className="tickets-view">
            <div className="tickets-header">
                <h2>Support Tickets</h2>
                <button className="btn-primary" onClick={onNewTicket}><Plus size={16} /> New Ticket</button>
            </div>

            {tickets.length === 0 ? (
                <div className="empty-state">
                    <MessageSquare size={48} />
                    <h3>No tickets yet</h3>
                    <p>Create a ticket to get help from our support team</p>
                    <button className="btn-primary" onClick={onNewTicket}><Plus size={16} /> Create Ticket</button>
                </div>
            ) : (
                <div className="tickets-table-wrap">
                    <table className="tickets-table">
                        <thead>
                            <tr>
                                <th>Ticket</th>
                                <th>Subject</th>
                                <th>Type</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(ticket => (
                                <tr key={ticket.id} onClick={() => onSelectTicket(ticket)}>
                                    <td><span className="ticket-number">{ticket.ticketNumber}</span></td>
                                    <td>{ticket.subject}</td>
                                    <td>{ticket.issueType}</td>
                                    <td><span className="priority-badge" style={{ background: priorityConfig[ticket.priority]?.bg, color: priorityConfig[ticket.priority]?.color }}>{priorityConfig[ticket.priority]?.label}</span></td>
                                    <td><span className="status-badge" style={{ background: statusConfig[ticket.status]?.bg, color: statusConfig[ticket.status]?.color }}>{statusConfig[ticket.status]?.label}</span></td>
                                    <td>{date(ticket.updatedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function NewTicketView({ form, setForm, onSubmit, onCancel, submitting }: { form: SupportTicketInput; setForm: (form: SupportTicketInput) => void; onSubmit: (e: FormEvent) => void; onCancel: () => void; submitting: boolean }) {
    const issueTypes = ["Technical Issue", "Billing Question", "Feature Request", "Account Help", "Other"];

    return (
        <form onSubmit={onSubmit} className="new-ticket-form">
            <div className="form-header">
                <button type="button" className="back-btn" onClick={onCancel}><ChevronLeft size={18} /> Back</button>
                <h2>Create Support Ticket</h2>
            </div>

            <div className="form-body">
                <Field label="Issue Type" type="select" value={form.issueType} onChange={v => setForm({ ...form, issueType: v })} options={issueTypes} required />
                <Field label="Subject" type="text" value={form.subject} onChange={v => setForm({ ...form, subject: v })} placeholder="Brief summary of the issue" required />
                <Field label="Priority" type="select" value={form.priority} onChange={v => setForm({ ...form, priority: v as "low" | "normal" | "high" | "urgent" })} options={["low", "normal", "high", "urgent"]} required />
                <Field label="Description" type="textarea" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Describe your issue in detail..." required rows={6} fullWidth />
            </div>

            <div className="form-footer">
                <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Submit Ticket
                </button>
            </div>
        </form>
    );
}

function TicketDetailView({ ticket, messages, loading, replyText, setReplyText, onSendReply, sending, onStatusChange, onBack }: { ticket: SupportTicket; messages: SupportTicketMessage[]; loading: boolean; replyText: string; setReplyText: (text: string) => void; onSendReply: () => void; sending: boolean; onStatusChange: (ticketId: string, status: SupportTicket["status"]) => void; onBack: () => void }) {
    const statusInfo = statusConfig[ticket.status];
    const priorityInfo = priorityConfig[ticket.priority];

    return (
        <div className="ticket-detail-view">
            <div className="ticket-header">
                <button className="back-btn" onClick={onBack}><ChevronLeft size={18} /> Back</button>
                <div className="ticket-title">
                    <span className="ticket-number">{ticket.ticketNumber}</span>
                    <h2>{ticket.subject}</h2>
                </div>
                <div className="ticket-badges">
                    <span className="priority-badge" style={{ background: priorityInfo?.bg, color: priorityInfo?.color }}>{priorityInfo?.label}</span>
                    <span className="status-badge" style={{ background: statusInfo?.bg, color: statusInfo?.color }}>{statusInfo?.label}</span>
                </div>
            </div>

            <div className="ticket-meta">
                <div className="meta-item"><strong>Type:</strong> {ticket.issueType}</div>
                <div className="meta-item"><strong>Created:</strong> {date(ticket.createdAt)}</div>
                <div className="meta-item"><strong>Updated:</strong> {date(ticket.updatedAt)}</div>
            </div>

            <div className="ticket-description">
                <h4>Description</h4>
                <p>{ticket.description}</p>
            </div>

            <div className="ticket-messages">
                <h4>Conversation</h4>
                {loading ? <div className="messages-loading">Loading messages...</div> : (
                    <div className="messages-list">
                        {messages.map(msg => (
                            <div key={msg.id} className="message">
                                <div className="message-header">
                                    <span className="message-author">{msg.authorId.slice(0, 8)}</span>
                                    <span className="message-time">{date(msg.createdAt)}</span>
                                </div>
                                <p>{msg.body}</p>
                            </div>
                        ))}
                        {messages.length === 0 && <p className="no-messages">No messages yet</p>}
                    </div>
                )}

                <div className="reply-form">
                    <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        className="reply-input"
                    />
                    <button className="btn-primary" onClick={onSendReply} disabled={sending || !replyText.trim()}>
                        {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Send
                    </button>
                </div>
            </div>

            {["open", "in_progress", "waiting_on_user"].includes(ticket.status) && (
                <div className="ticket-status-actions">
                    <label>Update Status:</label>
                    <div className="status-buttons">
                        {["open", "in_progress", "waiting_on_user", "resolved", "closed"].map(s => (
                            <button
                                key={s}
                                className={`status-btn ${ticket.status === s ? "active" : ""}`}
                                onClick={() => onStatusChange(ticket.id, s as any)}
                            >
                                {statusConfig[s].label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function HelpSkeleton() {
    return (
        <div className="help-main-skeleton">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /></div>)}
        </div>
    );
}

function Field({ label, type = "text", value, onChange, placeholder, options, required, rows, fullWidth }: { label: string; type?: string; value: string | undefined; onChange: (value: string) => void; placeholder?: string; options?: string[]; required?: boolean; rows?: number; fullWidth?: boolean }) {
    return (
        <div className={`form-field ${fullWidth ? "full-width" : ""}`}>
            <label>{label}{required && <span className="required">*</span>}</label>
            {type === "select" ? (
                <select value={value} onChange={e => onChange(e.target.value)} className="form-input" required={required}>
                    <option value="">Select...</option>
                    {options?.map((o: string) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
            ) : type === "textarea" ? (
                <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="form-textarea" rows={rows || 3} required={required} />
            ) : (
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="form-input" required={required} />
            )}
        </div>
    );
}