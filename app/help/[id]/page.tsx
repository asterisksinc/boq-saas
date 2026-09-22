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

const DEFAULT_ARTICLES: Record<string, HelpArticle> = {
    "how-to-import-an-excel-boq": {
        id: "art-1",
        slug: "how-to-import-an-excel-boq",
        title: "How to import an Excel BOQ",
        summary: "Upload your workbook from the BOQ menu, map the required columns, then review the validation summary before importing.",
        readMinutes: 4,
        helpfulYes: 96,
        helpfulNo: 4,
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
    "create-your-first-project": {
        id: "art-2",
        slug: "create-your-first-project",
        title: "Create Your First Project",
        summary: "Set up a project workspace, invite your team, and start building your estimate.",
        readMinutes: 4,
        helpfulYes: 96,
        helpfulNo: 4,
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
    "add-a-costing-item": {
        id: "art-3",
        slug: "add-a-costing-item",
        title: "Add a Costing Item",
        summary: "Add materials, labour, and custom rates to your Costing Library or directly to a BOQ.",
        readMinutes: 4,
        helpfulYes: 96,
        helpfulNo: 4,
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
    "send-a-proposal-to-a-client": {
        id: "art-4",
        slug: "send-a-proposal-to-a-client",
        title: "Send a Proposal to a Client",
        summary: "Turn your approved BOQ into a polished proposal and send it for review.",
        readMinutes: 4,
        helpfulYes: 96,
        helpfulNo: 4,
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

export default function ArticleDetailPage() {
    const router = useRouter();
    const params = useParams();
    const idOrSlug = (params?.id as string) || "";

    const [article, setArticle] = useState<HelpArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [articleFeedbackGiven, setArticleFeedbackGiven] = useState(false);
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
                    return;
                }
            } catch {
                // Fallback to local default article by slug or id
            }

            if (isMounted) {
                const fallback =
                    DEFAULT_ARTICLES[idOrSlug] ||
                    Object.values(DEFAULT_ARTICLES).find((a) => a.id === idOrSlug || a.slug === idOrSlug) ||
                    DEFAULT_ARTICLES["how-to-import-an-excel-boq"];
                setArticle(fallback);
            }
            if (isMounted) setLoading(false);
        }

        if (idOrSlug) {
            void loadArticle();
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

    return (
        <main className="fig-dashboard boq-dashboard help-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/help" />

            <div className="fig-dashboard-main">
                <DashboardHeader title="Help & Support" />

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

                    {loading ? (
                        <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
                            <Loader2 size={28} className="spin" style={{ margin: "0 auto 12px" }} />
                            <p style={{ fontSize: "14px" }}>Loading article details...</p>
                        </div>
                    ) : article ? (
                        <div className="article-view">
                            {/* Back to Help Centre */}
                            <button
                                type="button"
                                className="article-back-link"
                                onClick={() => router.push("/help")}
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Help Centre</span>
                            </button>

                            {/* Card 1: Article Header Card */}
                            <div className="article-header-card">
                                {getArticleCategory(article) && (
                                    <span className="article-header-category">
                                        {getArticleCategory(article)?.name}
                                    </span>
                                )}
                                <h1 className="article-header-title">{article.title}</h1>
                                <div className="article-header-meta">
                                    <span>Updated {formatArticleDate(article.updatedAt || article.updated_at)}</span>
                                    <span className="meta-dot">·</span>
                                    <span>{getReadMinutes(article)} min read</span>
                                    {getHelpfulPercentage(article) !== null && (
                                        <>
                                            <span className="meta-dot">·</span>
                                            <span>{getHelpfulPercentage(article)}% helpful</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Short Answer Card */}
                            {getArticleShortAnswer(article) && (
                                <div className="article-short-answer-card">
                                    <h4>Short answer</h4>
                                    <p>{getArticleShortAnswer(article)}</p>
                                </div>
                            )}

                            {/* Card 3: Main Article Body Card */}
                            <div className="article-body-card">
                                <ArticleContentRenderer
                                    content={article.content}
                                    summary={article.summary}
                                />
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
                                    <span className="feedback-thanks">
                                        ✓ Feedback recorded. Thank you!
                                    </span>
                                )}
                            </div>

                            {/* Card 5: Bottom Support CTA */}
                            <div className="article-support-cta">
                                <span className="cta-watermark">?</span>
                                <div className="cta-content">
                                    <h3>Still need help?</h3>
                                    <p>Carry this article into a support ticket so you don't have to repeat yourself.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-cta-raise"
                                    onClick={handleRaiseTicket}
                                >
                                    <span>Raise a Ticket</span>
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3>Article not found</h3>
                            <p>The requested help article could not be located.</p>
                            <button
                                type="button"
                                className="btn-raise-ticket"
                                onClick={() => router.push("/help")}
                            >
                                Back to Help Center
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
