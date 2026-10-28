"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { getCategoryIcon } from "./category-icons";

export interface HelpCategoryItem {
    id?: string;
    slug: string;
    name: string;
    description?: string | null;
    articleCount?: number;
}

export interface HelpCategoryCardProps {
    category: HelpCategoryItem;
    onSelect: (slug: string) => void;
}

export function HelpCategoryCard({ category, onSelect }: HelpCategoryCardProps) {
    return (
        <div
            className="product-category-card"
            onClick={() => onSelect(category.slug)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    onSelect(category.slug);
                }
            }}
        >
            <div className="category-icon-box">
                {getCategoryIcon(category.slug, 20)}
            </div>
            <div className="category-info">
                <div className="category-text-block">
                    <h4>{category.name}</h4>
                    <p>{category.description || ""}</p>
                </div>
                <span className="category-count-link">
                    {category.articleCount ?? 0} {category.articleCount === 1 ? "Article" : "Articles"}
                    <ChevronRight size={14} />
                </span>
            </div>
        </div>
    );
}

export interface HelpCategoriesGridProps {
    categories: HelpCategoryItem[];
    onSelectCategory: (slug: string) => void;
}

export function HelpCategoriesGrid({ categories, onSelectCategory }: HelpCategoriesGridProps) {
    return (
        <div className="product-categories-grid">
            {categories.map((cat) => (
                <HelpCategoryCard
                    key={cat.id || cat.slug}
                    category={cat}
                    onSelect={onSelectCategory}
                />
            ))}
        </div>
    );
}

export default HelpCategoryCard;
