"use client";

import React from "react";
import {
  WorkflowRule,
  RuleCategory,
  RULE_CATEGORIES,
  calculateCategoryCounts,
} from "@/lib/templates/rules-domain";

interface RuleCategoryTabsProps {
  rules: WorkflowRule[];
  activeCategory: RuleCategory;
  onSelectCategory: (category: RuleCategory) => void;
}

export default function RuleCategoryTabs({
  rules,
  activeCategory,
  onSelectCategory,
}: RuleCategoryTabsProps) {
  const counts = calculateCategoryCounts(rules);

  return (
    <div className="td-rule-cat-tabs-row" role="tablist" aria-label="Rule Categories">
      {RULE_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat;
        const count = counts[cat] ?? 0;

        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`td-rule-cat-pill ${isActive ? "active" : ""}`}
            onClick={() => onSelectCategory(cat)}
          >
            <span className="cat-label">{cat}</span>
            <span className={`cat-count-badge ${isActive ? "active" : ""}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
