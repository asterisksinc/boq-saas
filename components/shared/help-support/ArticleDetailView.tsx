"use client";

import React from "react";
import { ArrowLeft, ChevronRight, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { HelpArticle } from "@/lib/api/auth";
import {
    formatArticleDate,
    getArticleCategory,
    getArticleShortAnswer,
    getHelpfulPercentage,
    getReadMinutes,
} from "./help-helpers";
import { ArticleContentRenderer } from "./ArticleContentRenderer";

export interface ArticleDetailViewProps {
    article: HelpArticle;
    loading?: boolean;
    feedbackGiven?: boolean;
    onFeedback: (helpful: boolean) => void;
    onRaiseTicket: (article: HelpArticle) => void;
    onBack: () => void;
}

export function ArticleDetailView({
    article,
    loading = false,
    feedbackGiven = false,
    onFeedback,
    onRaiseTicket,
    onBack,
}: ArticleDetailViewProps) {
    const helpfulPercent = getHelpfulPercentage(article);
    const readTime = getReadMinutes(article);
    const category = getArticleCategory(article);
    const shortAnswer = getArticleShortAnswer(article);

    return (
        <div className="article-view">
            <button
                type="button"
                className="article-back-link"
                onClick={onBack}
            >
                <ArrowLeft size={16} />
                <span>Back to Help Center</span>
            </button>

            {/* Card 1: Article Header Card */}
            <div className="article-header-card">
                {category && (
                    <span className="article-header-category">
                        {category.name}
                    </span>
                )}
                <h1 className="article-header-title">{article.title}</h1>
                <div className="article-header-meta">
                    <span>Updated {formatArticleDate(article.updatedAt || article.updated_at)}</span>
                    {readTime !== null && (
                        <>
                            <span className="meta-dot">·</span>
                            <span>{readTime} min read</span>
                        </>
                    )}
                    {helpfulPercent !== null && (
                        <>
                            <span className="meta-dot">·</span>
                            <span>{helpfulPercent}% helpful</span>
                        </>
                    )}
                </div>
            </div>

            {/* Card 2: Short Answer Card */}
            {shortAnswer && (
                <div className="article-short-answer-card">
                    <h4>Short answer</h4>
                    <p>{shortAnswer}</p>
                </div>
            )}

            {/* Card 3: Main Article Body Card */}
            <div className="article-body-card">
                {loading ? (
                    <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748B" }}>
                        <Loader2 size={24} className="spin" style={{ margin: "0 auto 10px", color: "#2563EB" }} />
                        <p style={{ fontSize: "14px", fontFamily: "Urbanist" }}>Loading article details...</p>
                    </div>
                ) : (
                    <ArticleContentRenderer
                        content={article.content}
                        summary={article.summary}
                    />
                )}
            </div>

            {/* Card 4: Feedback Card */}
            <div className="article-feedback-card">
                <span className="feedback-label">Was this article helpful?</span>
                <div className="feedback-buttons-row">
                    <button
                        type="button"
                        className={`feedback-action-btn ${feedbackGiven ? "voted" : ""}`}
                        onClick={() => onFeedback(true)}
                        disabled={feedbackGiven}
                    >
                        <ThumbsUp size={14} />
                        <span>Yes</span>
                    </button>
                    <button
                        type="button"
                        className="feedback-action-btn"
                        onClick={() => onFeedback(false)}
                        disabled={feedbackGiven}
                    >
                        <ThumbsDown size={14} />
                        <span>No</span>
                    </button>
                </div>
                {feedbackGiven && (
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
                    onClick={() => onRaiseTicket(article)}
                >
                    <span>Raise a Ticket</span>
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

export default ArticleDetailView;
