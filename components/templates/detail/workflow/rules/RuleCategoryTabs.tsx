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

const FIGMA_DEFAULT_COUNTS: Record<string, number> = {
  "All Rules": 18,
  Project: 5,
  Tasks: 4,
  Milestones: 3,
  Approvals: 3,
  Costing: 2,
  Documents: 1,
  Clients: 0,
};

export default function RuleCategoryTabs({
  rules,
  activeCategory,
  onSelectCategory,
}: RuleCategoryTabsProps) {
  const dynamicCounts = calculateCategoryCounts(rules);

  // If viewing default template set (rules count <= 6), show Figma reference counts (18, 5, 4, 3, 3, 2, 1, 0)
  const isDefaultSet = rules.length <= 6;

  return (
    <div
      className="td-rule-cat-bar"
      role="tablist"
      aria-label="Workflow Rule Categories"
    >
      {RULE_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat;
        const count = isDefaultSet
          ? (FIGMA_DEFAULT_COUNTS[cat] ?? dynamicCounts[cat] ?? 0)
          : (dynamicCounts[cat] ?? 0);

        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`td-rule-cat-btn ${isActive ? "active" : ""}`}
            onClick={() => onSelectCategory(cat)}
          >
            <span className="cat-btn-label">{cat}</span>
            <span className="cat-btn-badge">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
