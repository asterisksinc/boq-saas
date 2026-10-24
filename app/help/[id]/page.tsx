"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronRight,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

import {
    getHelpArticle,
    submitArticleFeedback,
    HelpArticle,
    SupportTicket,
} from "@/lib/api/auth";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import TicketWizardDrawer from "@/components/TicketWizardDrawer";
import "../help-redesign.css";

const DEFAULT_ARTICLES: Record<string, HelpArticle> = {
    "how-to-import-an-excel-boq": {
        id: "art-1",
        slug: "how-to-import-an-excel-boq",
        title: "How to import an Excel BOQ",
        summary: "Upload your workbook from the BOQ menu, map the required columns, then review the validation summary before importing.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "boqs-costing", name: "BOQS & COSTING" },
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
    "create-your-first-project": {
        id: "art-2",
        slug: "create-your-first-project",
        title: "Create Your First Project",
        summary: "Set up a project workspace, invite your team, and start building your estimate.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "getting-started", name: "GETTING STARTED" },
        content: {
            shortAnswer: "Set up a project workspace, invite your team, and start building your estimate.",
            sections: [
                { heading: "Getting Started", body: "Create your project container to manage rooms, BOQs, and team assignments." },
                { heading: "Steps", items: ["Click '+ New' in the top dashboard navigation.", "Enter the project title, client, and location.", "Assign team members and initial milestone dates.", "Save to open your project workspace."] }
            ]
        }
    },
    "add-a-costing-item": {
        id: "art-3",
        slug: "add-a-costing-item",
        title: "Add a Costing Item",
        summary: "Add materials, labour, and custom rates to your Costing Library or directly to a BOQ.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "boqs-costing", name: "BOQS & COSTING" },
        content: {
            shortAnswer: "Add materials, labour, and custom rates to your Costing Library or directly to a BOQ.",
            sections: [
                { heading: "Costing Library", body: "Centralize your material and labor rates to reuse across projects." },
                { heading: "Steps", items: ["Open the Costing section from the navigation.", "Click 'Add Costing Item'.", "Enter item code, unit, material rate, and labor allowance.", "Save to make available in all new BOQs."] }
            ]
        }
    },
    "send-a-proposal-to-a-client": {
        id: "art-4",
        slug: "send-a-proposal-to-a-client",
        title: "Send a Proposal to a Client",
        summary: "Turn your approved BOQ into a polished proposal and send it for review.",
        readMinutes: 4,
        helpfulYes: 0,
        helpfulNo: 0,
        popular: true,
        updatedAt: "2026-08-28T10:00:00Z",
        category: { slug: "boqs-costing", name: "BOQS & COSTING" },
        content: {
            shortAnswer: "Turn your approved BOQ into a polished proposal and send it for review.",
            sections: [
                { heading: "Proposals", body: "Generate commercial client proposals directly from approved estimates." },
                { heading: "Steps", items: ["Open your BOQ and click 'Generate Proposal'.", "Review client details, terms, and payment milestones.", "Click 'Send to Client' to email a secure review link."] }
            ]
        }
    },
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

function getHelpfulPercentage(article: HelpArticle): number | null {
    const yes = article.helpfulYes ?? article.helpful_yes ?? 0;
    const no = article.helpfulNo ?? article.helpful_no ?? 0;
    const total = yes + no;
    // Only return percentage when there is a statistically meaningful sample size (at least 5 votes)
    if (total < 5) return null;
    return Math.round((yes / total) * 100);
}

function getReadMinutes(article: HelpArticle): number {
    if (article.readMinutes && article.readMinutes > 0) return article.readMinutes;
    if (article.read_minutes && article.read_minutes > 0) return article.read_minutes;
    // Calculate based on content length: standard average 200 words per minute
    let text = article.summary || "";
    if (article.content && typeof article.content === "object") {
        if ("shortAnswer" in article.content && typeof (article.content as any).shortAnswer === "string") {
            text += " " + (article.content as any).shortAnswer;
        }
        if (Array.isArray(article.content.sections)) {
            for (const s of article.content.sections) {
                text += " " + (s.heading || "") + " " + (s.body || "");
                if (Array.isArray(s.items)) text += " " + s.items.join(" ");
            }
        }
    } else if (typeof article.content === "string") {
        text += " " + article.content;
    }
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

function getArticleShortAnswer(article: HelpArticle): string | null {
    if (article.content && typeof article.content === "object" && "shortAnswer" in article.content) {
        const val = (article.content as { shortAnswer?: string }).shortAnswer;
        if (val) return val;
    }
    return article.summary || null;
}

function ArticleContentRenderer({ content, summary }: { content?: any; summary?: string | null }) {
    if (!content) {
        return <p className="article-plain-body">{summary || "No article content available."}</p>;
    }

    if (typeof content === "object") {
        if (Array.isArray(content.sections) && content.sections.length > 0) {
            return (
                <div className="article-sections-flow">
                    {content.sections.map((section: any, idx: number) => (
                        <div key={idx} className="article-section-block">
                            {section.heading && <h3>{section.heading}</h3>}
                            {section.body && <p>{section.body}</p>}
                            {Array.isArray(section.items) && section.items.length > 0 && (
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

    return <p className="article-plain-body">{summary || "No article content available."}</p>;
}

function ArticleDetailSkeleton() {
    return (
        <div className="article-view" aria-label="Loading article details">
            {/* Back Nav Skeleton */}
            <div className="article-back-nav">
                <div style={{ width: "180px", height: "24px", background: "#E2E8F0", borderRadius: "6px" }} />
            </div>

            {/* Frame 2147225477: Metadata Skeleton */}
            <div className="article-meta-section help-article-page__section">
                <div style={{ width: "120px", height: "18px", background: "rgba(100, 116, 139, 0.2)", borderRadius: "4px" }} />
                <div className="article-title-card help-article-page__card">
                    <div style={{ width: "65%", height: "28px", background: "#E2E8F0", borderRadius: "6px", marginBottom: "8px" }} />
                    <div style={{ width: "40%", height: "16px", background: "#F1F5F9", borderRadius: "4px" }} />
                </div>
            </div>

            {/* Frame 2147225478: Main Content Skeleton */}
            <div className="article-content-section help-article-page__section">
                {/* Short Answer Skeleton */}
                <div className="article-short-answer-callout help-article-page__card">
                    <div style={{ width: "90px", height: "18px", background: "rgba(22, 163, 74, 0.2)", borderRadius: "4px", marginBottom: "6px" }} />
                    <div style={{ width: "100%", height: "16px", background: "#F1F5F9", borderRadius: "4px" }} />
                </div>

                {/* Body Card Skeleton */}
                <div className="article-body-card help-article-page__card" style={{ gap: "20px" }}>
                    <div style={{ width: "140px", height: "18px", background: "#E2E8F0", borderRadius: "4px" }} />
                    <div style={{ width: "100%", height: "16px", background: "#F8FAFC", borderRadius: "4px" }} />
                    <div style={{ width: "95%", height: "16px", background: "#F8FAFC", borderRadius: "4px" }} />
                    <div style={{ width: "120px", height: "18px", background: "#E2E8F0", borderRadius: "4px", marginTop: "12px" }} />
                    <div style={{ width: "80%", height: "16px", background: "#F8FAFC", borderRadius: "4px" }} />
                    <div style={{ width: "85%", height: "16px", background: "#F8FAFC", borderRadius: "4px" }} />
                </div>

                {/* Feedback Skeleton */}
                <div className="article-feedback-card help-article-page__card">
                    <div style={{ width: "160px", height: "18px", background: "#E2E8F0", borderRadius: "4px" }} />
                    <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ width: "76px", height: "36px", background: "#F1F5F9", borderRadius: "6px" }} />
                        <div style={{ width: "76px", height: "36px", background: "#F1F5F9", borderRadius: "6px" }} />
                    </div>
                </div>
            </div>

            {/* Frame 2147225027: Bottom CTA Skeleton */}
            <div className="article-support-cta help-support-cta help-article-page__card">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    <div style={{ width: "160px", height: "24px", background: "rgba(255, 255, 255, 0.2)", borderRadius: "4px" }} />
                    <div style={{ width: "320px", height: "14px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px" }} />
                </div>
                <div style={{ width: "143px", height: "46px", background: "rgba(37, 99, 235, 0.5)", borderRadius: "6px" }} />
            </div>
        </div>
    );
}

export default function ArticleDetailPage() {
    const router = useRouter();
    const params = useParams();
    const idOrSlug = (params?.id as string) || "";

    const [article, setArticle] = useState<HelpArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [articleFeedbackGiven, setArticleFeedbackGiven] = useState(false);
    const [feedbackVote, setFeedbackVote] = useState<"yes" | "no" | null>(null);
    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(false);

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 4000);
    };

    useEffect(() => {
        let isMounted = true;
        async function loadArticle() {
            setLoading(true);
            try {
                const fetched = await getHelpArticle(idOrSlug);
                if (isMounted && fetched) {
                    setArticle(fetched);
                    setLoading(false);
                    return;
                }
            } catch {
                // Fallback to offline defaults if available
                if (DEFAULT_ARTICLES[idOrSlug]) {
                    if (isMounted) {
                        setArticle(DEFAULT_ARTICLES[idOrSlug]);
                        setLoading(false);
                    }
                    return;
                }
            }
            if (isMounted) {
                // Fallback check
                if (DEFAULT_ARTICLES[idOrSlug]) {
                    setArticle(DEFAULT_ARTICLES[idOrSlug]);
                } else {
                    setArticle(null);
                }
                setLoading(false);
            }
        }

        if (idOrSlug) {
            void loadArticle();
        } else {
            setLoading(false);
        }
        return () => {
            isMounted = false;
        };
    }, [idOrSlug]);

    const handleArticleFeedback = async (helpful: boolean) => {
        if (!article || articleFeedbackGiven) return;
        try {
            await submitArticleFeedback(article.slug, { helpful });
            setArticle((prev) => {
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
            setFeedbackVote(helpful ? "yes" : "no");
            setArticleFeedbackGiven(true);
            showNotice("Thank you for your feedback!");
        } catch {
            showNotice("Could not submit feedback", "error");
        }
    };

    const handleRaiseTicket = () => {
        setIsTicketDrawerOpen(true);
    };

    const handleTicketCreated = (ticket: SupportTicket, wasDraft?: boolean) => {
        const num = ticket.ticketNumber || ticket.ticket_number || "";
        if (wasDraft) {
            showNotice(`Draft ticket ${num} saved. You can resume it anytime under Help & Support.`);
        } else {
            showNotice(`Support ticket ${num} submitted successfully! Our team will respond shortly.`);
        }
    };

    const category = article ? getArticleCategory(article) : null;
    const shortAnswer = article ? getArticleShortAnswer(article) : null;
    const helpfulPct = article ? getHelpfulPercentage(article) : null;

    return (
        <main className="fig-dashboard boq-dashboard help-page">
            <div className="help-gradient-glow" aria-hidden="true" />
            <DashboardRail current="/help" />

            <div className="fig-dashboard-main">
                <DashboardHeader title="Help & Support" />

                <section className="help-content help-article-page help-article-page__content">
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

                    {loading ? (
                        <ArticleDetailSkeleton />
                    ) : article ? (
                        <div className="article-view">
                            {/* Frame 2147225121: Back to Help Centre */}
                            <div className="article-back-nav">
                                <button
                                    type="button"
                                    className="article-back-link"
                                    onClick={() => router.push("/help")}
                                >
                                    <ArrowLeft size={24} className="article-back-icon" />
                                    <span>Back to Help Centre</span>
                                </button>
                            </div>

                            {/* Frame 2147225477: Outer Translucent Section Container 1 (Metadata) */}
                            <div className="article-meta-section help-article-page__section">
                                {category && (
                                    <span className="article-category-badge">
                                        {category.name}
                                    </span>
                                )}
                                <div className="article-title-card help-article-page__card">
                                    <h1 className="article-title">{article.title}</h1>
                                    <div className="article-meta-row">
                                        <span>Updated {formatArticleDate(article.updatedAt || article.updated_at)}</span>
                                        <span className="article-meta-dot">·</span>
                                        <span>{getReadMinutes(article)} min read</span>
                                        {helpfulPct !== null && (
                                            <>
                                                <span className="article-meta-dot">·</span>
                                                <span>{helpfulPct}% helpful</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Frame 2147225478: Outer Translucent Section Container 2 (Main Content) */}
                            <div className="article-content-section help-article-page__section">
                                {/* Frame 2147225027: Short answer callout */}
                                {shortAnswer && (
                                    <div className="article-short-answer-callout help-article-page__card">
                                        <h4>Short answer</h4>
                                        <p>{shortAnswer}</p>
                                    </div>
                                )}

                                {/* Frame 2147225029: Main article body card */}
                                <div className="article-body-card help-article-page__card">
                                    <ArticleContentRenderer
                                        content={article.content}
                                        summary={article.summary}
                                    />
                                </div>

                                {/* Frame 2147225030: Feedback card */}
                                <div className="article-feedback-card help-article-page__card">
                                    <div className="article-feedback-question-wrap">
                                        <h4 className="feedback-label">Was this article helpful?</h4>
                                        <div className="feedback-buttons-row">
                                            <button
                                                type="button"
                                                className={`feedback-action-btn ${feedbackVote === "yes" ? "voted" : ""}`}
                                                onClick={() => void handleArticleFeedback(true)}
                                                disabled={articleFeedbackGiven}
                                            >
                                                <ThumbsUp size={20} />
                                                <span>Yes</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`feedback-action-btn ${feedbackVote === "no" ? "voted" : ""}`}
                                                onClick={() => void handleArticleFeedback(false)}
                                                disabled={articleFeedbackGiven}
                                            >
                                                <ThumbsDown size={20} />
                                                <span>No</span>
                                            </button>
                                        </div>
                                    </div>
                                    {articleFeedbackGiven && (
                                        <span className="feedback-thanks">
                                            ✓ Feedback recorded. Thank you!
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Frame 2147225027: Still need help? Support CTA Card */}
                            <div className="article-support-cta help-support-cta help-article-page__card">
                                <span className="cta-watermark" aria-hidden="true">?</span>
                                <div className="cta-content">
                                    <span className="cta-tag">NEED A HUMAN?</span>
                                    <h3>Still need help?</h3>
                                    <p>Carry this article into a support ticket so you don&apos;t have to repeat yourself.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-raise-ticket-cta btn-cta-raise"
                                    onClick={handleRaiseTicket}
                                    aria-label="Raise a Support Ticket"
                                >
                                    <span>Raise a Ticket</span>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state article-not-found-card" style={{ padding: "60px 20px", textAlign: "center" }}>
                            <AlertCircle size={40} style={{ color: "#EF4444", margin: "0 auto 12px" }} />
                            <h3 style={{ fontFamily: "Urbanist", fontSize: "20px", fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
                                Article not found
                            </h3>
                            <p style={{ fontFamily: "Urbanist", fontSize: "14px", color: "#64748B", margin: "0 0 20px" }}>
                                The requested help article could not be located.
                            </p>
                            <button
                                type="button"
                                className="btn-raise-ticket"
                                onClick={() => router.push("/help")}
                                style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "8px" }}
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Help Centre</span>
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {/* Right Slide-over Ticket Wizard Drawer */}
            <TicketWizardDrawer
                isOpen={isTicketDrawerOpen}
                onClose={() => setIsTicketDrawerOpen(false)}
                onTicketCreated={handleTicketCreated}
                initialArticleTitle={article?.title || null}
            />
        </main>
    );
}
