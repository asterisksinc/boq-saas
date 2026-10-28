"use client";

import React from "react";
import { Clock, FileText, ThumbsUp } from "lucide-react";
import { HelpArticle } from "@/lib/api/auth";
import {
    getArticleCategory,
    getHelpfulPercentage,
    getReadMinutes,
} from "./help-helpers";
import { getCategoryIcon } from "./category-icons";

export interface ArticleCardProps {
    article: HelpArticle;
    onSelect: () => void;
}

export function ArticleCard({ article, onSelect }: ArticleCardProps) {
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
                    {category ? getCategoryIcon(category.slug, 20) : <FileText size={20} />}
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

export default ArticleCard;
