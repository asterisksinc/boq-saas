"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  WorkflowRule,
  RuleCategory,
  DEFAULT_WORKFLOW_RULES,
  normalizeRule,
} from "@/lib/templates/rules-domain";
import RulesKpiCards from "./rules/RulesKpiCards";
import RuleCategoryTabs from "./rules/RuleCategoryTabs";
import RulesDataTable from "./rules/RulesDataTable";
import RuleDetailSidePanel from "./rules/RuleDetailSidePanel";
import RuleBuilderModal from "./rules/RuleBuilderModal";

interface WorkflowRulesViewProps {
  rules?: any[];
  templateId?: string;
  templateName?: string;
  searchQuery?: string;
  onUpdateRules?: (rules: WorkflowRule[]) => void;
  onAddRuleClick?: () => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  availableApprovals?: Array<{ code: string; name: string }>;
}

export default function WorkflowRulesView({
  rules: propRules,
  templateId = "",
  templateName = "Project Template",
  searchQuery = "",
  onUpdateRules,
  onAddRuleClick,
  isAddModalOpen = false,
  onCloseAddModal,
  availableApprovals = [],
}: WorkflowRulesViewProps) {
  // Normalize rules
  const initialNormalized = useMemo(() => {
    if (propRules && Array.isArray(propRules) && propRules.length > 0) {
      return propRules.map((r, i) => normalizeRule(r, i));
    }
    return DEFAULT_WORKFLOW_RULES;
  }, [propRules]);

  const [rules, setRules] = useState<WorkflowRule[]>(initialNormalized);

  // Sync prop changes
  useEffect(() => {
    if (propRules && Array.isArray(propRules) && propRules.length > 0) {
      setRules(propRules.map((r, i) => normalizeRule(r, i)));
    }
  }, [propRules]);

  // Selected Rule ID (default to first rule matching screenshot, or null if closed)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(
    initialNormalized.length > 0 ? initialNormalized[0].id : null
  );

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState<RuleCategory>("All Rules");

  // Rule Builder modal state (create / edit)
  const [isBuilderOpen, setIsBuilderOpen] = useState(isAddModalOpen);
  const [ruleToEdit, setRuleToEdit] = useState<WorkflowRule | null>(null);

  useEffect(() => {
    if (isAddModalOpen) {
      setRuleToEdit(null);
      setIsBuilderOpen(true);
    }
  }, [isAddModalOpen]);

  // Selected rule object
  const selectedRule = useMemo(() => {
    if (!selectedRuleId) return null;
    return rules.find((r) => r.id === selectedRuleId) || null;
  }, [rules, selectedRuleId]);

  // Filter rules based on category and search query
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      // Category filter
      if (activeCategory !== "All Rules") {
        const cat = rule.category || "Project";
        if (cat.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rule.name.toLowerCase().includes(q);
        const matchesCode = rule.code.toLowerCase().includes(q);
        const matchesTrigger = rule.trigger.event.toLowerCase().includes(q);
        const matchesCondition = rule.conditions.summary?.toLowerCase().includes(q);
        const matchesAction = rule.actions.some((a) =>
          a.title.toLowerCase().includes(q) || (a.target && a.target.toLowerCase().includes(q))
        );
        return matchesName || matchesCode || matchesTrigger || matchesCondition || matchesAction;
      }

      return true;
    });
  }, [rules, activeCategory, searchQuery]);

  // Save rules helper (propagates to parent and backend)
  const commitRulesChange = useCallback(
    (newRules: WorkflowRule[]) => {
      setRules(newRules);
      onUpdateRules?.(newRules);
    },
    [onUpdateRules]
  );

  // Toggle active/inactive
  const handleToggleStatus = (ruleId: string) => {
    const updated = rules.map((r) =>
      r.id === ruleId
        ? {
            ...r,
            status: (r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
          }
        : r
    );
    commitRulesChange(updated);
  };

  // Duplicate rule
  const handleDuplicateRule = (rule: WorkflowRule) => {
    const newRule: WorkflowRule = {
      ...rule,
      id: `rul-${Date.now()}`,
      code: `RUL-${String(rules.length + 1).padStart(3, "0")}`,
      name: `${rule.name} (Copy)`,
      status: "DRAFT",
      executedCount: 0,
      lastTriggered: "—",
    };
    const updated = [newRule, ...rules];
    commitRulesChange(updated);
    setSelectedRuleId(newRule.id);
  };

  // Delete rule
  const handleDeleteRule = (ruleId: string) => {
    if (confirm("Are you sure you want to delete this workflow rule?")) {
      const updated = rules.filter((r) => r.id !== ruleId);
      commitRulesChange(updated);
      if (selectedRuleId === ruleId) {
        setSelectedRuleId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  // Edit rule
  const handleEditRule = (rule: WorkflowRule) => {
    setRuleToEdit(rule);
    setIsBuilderOpen(true);
  };

  // Create rule
  const handleOpenCreateRule = () => {
    setRuleToEdit(null);
    setIsBuilderOpen(true);
    onAddRuleClick?.();
  };

  // Save rule from builder (Draft or Activate)
  const handleSaveRuleFromBuilder = async (savedRule: WorkflowRule, activate: boolean) => {
    const ruleWithStatus = {
      ...savedRule,
      status: activate ? ("ACTIVE" as const) : ("DRAFT" as const),
    };

    let updated: WorkflowRule[];
    const exists = rules.some((r) => r.id === ruleWithStatus.id);
    if (exists) {
      updated = rules.map((r) => (r.id === ruleWithStatus.id ? ruleWithStatus : r));
    } else {
      updated = [ruleWithStatus, ...rules];
    }

    commitRulesChange(updated);
    setSelectedRuleId(ruleWithStatus.id);
    setIsBuilderOpen(false);
    onCloseAddModal?.();
  };

  return (
    <div className="td-wf-rules-container">
      {/* ── 1. KPI Summary Cards (Real dynamic metrics) ─────────────── */}
      <RulesKpiCards rules={rules} />

      {/* ── 2. Category Filter Pill Bar ─────────────────────────────── */}
      <RuleCategoryTabs
        rules={rules}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* ── 3. Split Layout: Table (Left) + Details Panel (Right) ───── */}
      <div className={`td-rules-content-split ${selectedRule ? "panel-open" : "panel-closed"}`}>
        <div className="td-rules-table-wrapper">
          <RulesDataTable
            rules={filteredRules}
            selectedRuleId={selectedRuleId}
            onSelectRule={(rule) => setSelectedRuleId(rule.id)}
            onEditRule={handleEditRule}
            onDuplicateRule={handleDuplicateRule}
            onDeleteRule={handleDeleteRule}
            onToggleStatus={handleToggleStatus}
            onCreateRuleClick={handleOpenCreateRule}
          />
        </div>

        {selectedRule && (
          <div className="td-rules-side-panel-wrapper">
            <RuleDetailSidePanel
              rule={selectedRule}
              onClose={() => setSelectedRuleId(null)}
              onEditRule={handleEditRule}
            />
          </div>
        )}
      </div>

      {/* ── 4. Create New Rule / Edit Rule Multi-Step Builder Modal ─── */}
      {isBuilderOpen && (
        <RuleBuilderModal
          isOpen={isBuilderOpen}
          templateId={templateId}
          templateName={templateName}
          existingRule={ruleToEdit}
          allRulesCount={rules.length}
          availableApprovals={availableApprovals}
          onClose={() => {
            setIsBuilderOpen(false);
            onCloseAddModal?.();
          }}
          onSaveRule={handleSaveRuleFromBuilder}
        />
      )}
    </div>
  );
}
