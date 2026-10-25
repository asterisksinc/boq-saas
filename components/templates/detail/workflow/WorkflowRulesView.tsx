"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  WorkflowRule,
  RuleCategory,
  RulePriority,
  DEFAULT_WORKFLOW_RULES,
  normalizeRule,
} from "@/lib/templates/rules-domain";
import RulesKpiCards from "./rules/RulesKpiCards";
import RuleCategoryTabs from "./rules/RuleCategoryTabs";
import RulesDataTable from "./rules/RulesDataTable";
import RuleDetailSidePanel from "./rules/RuleDetailSidePanel";
import RuleBuilderModal from "./rules/RuleBuilderModal";
import { X, ArrowRight, ShieldCheck, Zap, Sliders, Bell } from "lucide-react";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Normalize initial rules
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

  // Selected Rule ID
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(() => {
    // Check URL query param ?rule=
    const ruleQuery = searchParams.get("rule");
    if (ruleQuery) {
      const matched = initialNormalized.find(
        (r) =>
          r.code.toLowerCase() === ruleQuery.toLowerCase() ||
          r.id.toLowerCase() === ruleQuery.toLowerCase()
      );
      if (matched) return matched.id;
    }
    // Default open first rule matching Figma "View Rule" state
    return initialNormalized.length > 0 ? initialNormalized[0].id : null;
  });

  // Keep URL query in sync when rule selection changes
  const updateUrlRuleParam = useCallback(
    (ruleCodeOrId: string | null) => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (ruleCodeOrId) {
          params.set("rule", ruleCodeOrId);
        } else {
          params.delete("rule");
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
      } catch (err) {
        // Fallback gracefully
      }
    },
    []
  );

  // Watch searchParams for external URL navigation
  useEffect(() => {
    const ruleQuery = searchParams.get("rule");
    if (ruleQuery) {
      const matched = rules.find(
        (r) =>
          r.code.toLowerCase() === ruleQuery.toLowerCase() ||
          r.id.toLowerCase() === ruleQuery.toLowerCase()
      );
      if (matched && matched.id !== selectedRuleId) {
        setSelectedRuleId(matched.id);
      }
    }
  }, [searchParams, rules, selectedRuleId]);

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState<RuleCategory>("All Rules");

  // Rule Builder modal state (create / edit)
  const [isBuilderOpen, setIsBuilderOpen] = useState(isAddModalOpen);
  const [ruleToEdit, setRuleToEdit] = useState<WorkflowRule | null>(null);

  // Flow Diagram modal state
  const [flowDiagramRule, setFlowDiagramRule] = useState<WorkflowRule | null>(null);

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
        const matchesAction = rule.actions.some(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            (a.target && a.target.toLowerCase().includes(q))
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

  const handleSelectRule = (rule: WorkflowRule) => {
    setSelectedRuleId(rule.id);
    updateUrlRuleParam(rule.code);
  };

  const handleCloseInspector = () => {
    setSelectedRuleId(null);
    updateUrlRuleParam(null);
  };

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
    updateUrlRuleParam(newRule.code);
  };

  // Delete rule
  const handleDeleteRule = (ruleId: string) => {
    if (confirm("Are you sure you want to delete this workflow rule?")) {
      const updated = rules.filter((r) => r.id !== ruleId);
      commitRulesChange(updated);
      if (selectedRuleId === ruleId) {
        setSelectedRuleId(updated.length > 0 ? updated[0].id : null);
        updateUrlRuleParam(updated.length > 0 ? updated[0].code : null);
      }
    }
  };

  // Edit rule
  const handleEditRule = (rule: WorkflowRule) => {
    setRuleToEdit(rule);
    setIsBuilderOpen(true);
  };

  // Open flow diagram
  const handleOpenFlowDiagram = (rule: WorkflowRule) => {
    setFlowDiagramRule(rule);
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
    updateUrlRuleParam(ruleWithStatus.code);
    setIsBuilderOpen(false);
    onCloseAddModal?.();
  };

  const handleUpdatePriority = (ruleId: string, priority: RulePriority) => {
    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, priority } : r
    );
    commitRulesChange(updated);
  };

  return (
    <div className="td-wf-rules-container" style={{ width: "100%" }}>
      {/* ── 1. KPI Summary Cards (Frame 2147225138) ────────────────────── */}
      <RulesKpiCards rules={rules} />

      {/* ── 2. Category Filter Pill Bar (Frame Buttons) ─────────────────── */}
      <RuleCategoryTabs
        rules={rules}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* ── 3. Split Layout: 10-Col Table (Left) + View Rule Inspector (Right) (Frame 2147225227) */}
      <div className={`td-wf-rules-split-row ${selectedRule ? "with-inspector" : ""}`}>
        <div className="td-wf-rules-table-card">
          <RulesDataTable
            rules={filteredRules}
            selectedRuleId={selectedRuleId}
            onSelectRule={handleSelectRule}
            onEditRule={handleEditRule}
            onDuplicateRule={handleDuplicateRule}
            onDeleteRule={handleDeleteRule}
            onToggleStatus={handleToggleStatus}
            onUpdatePriority={handleUpdatePriority}
            onCreateRuleClick={handleOpenCreateRule}
          />
        </div>

        {selectedRule && (
          <RuleDetailSidePanel
            rule={selectedRule}
            onClose={handleCloseInspector}
            onEditRule={handleEditRule}
            onOpenFlowDiagram={handleOpenFlowDiagram}
          />
        )}
      </div>

      {/* ── 4. Create New Rule / Edit Rule Multi-Step Builder Modal ─────── */}
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

      {/* ── 5. Interactive "View Rule Flow" Diagram Modal ───────────────── */}
      {flowDiagramRule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="flow-diagram-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setFlowDiagramRule(null)}
        >
          <div
            className="view-rule-diagram-modal"
            style={{
              width: "100%",
              maxWidth: "760px",
              background: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <div>
                <h3
                  id="flow-diagram-title"
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  Rule Execution Flow
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                  {flowDiagramRule.name} ({flowDiagramRule.code})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFlowDiagramRule(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: "4px",
                  borderRadius: "4px",
                }}
                aria-label="Close Diagram"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Diagram Flow Content */}
            <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  alignItems: "stretch",
                }}
              >
                {/* 1. Trigger Node */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563EB" }}>
                    <Zap size={16} />
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      1. Trigger
                    </span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                    {flowDiagramRule.trigger.event}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Evaluate: {flowDiagramRule.trigger.timing || "Immediately"}
                  </div>
                </div>

                {/* 2. Condition Evaluation Node */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#D97706" }}>
                    <Sliders size={16} />
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      2. Condition
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                    {flowDiagramRule.conditions.summary || "Budget > ₹50,00,000"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Logic: Match {flowDiagramRule.conditions.conjunction} criteria
                  </div>
                </div>

                {/* 3. Action / Approval Node */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7C3AED" }}>
                    <ShieldCheck size={16} />
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      3. Operational Flow
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                    {flowDiagramRule.approval?.flowName || "Finance Approval"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    {flowDiagramRule.actions.map((a) => a.title).join(", ") || "Authorize actions"}
                  </div>
                </div>
              </div>

              {/* Execution Summary Bar */}
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#1E40AF" }}>
                    Priority: {(flowDiagramRule.priority || "MEDIUM").toUpperCase()}
                  </span>
                  <span style={{ margin: "0 8px", color: "#93C5FD" }}>•</span>
                  <span style={{ fontSize: "12px", color: "#1E3A8A" }}>
                    Executed {flowDiagramRule.executedCount ?? 12} times
                  </span>
                  <span style={{ margin: "0 8px", color: "#93C5FD" }}>•</span>
                  <span style={{ fontSize: "12px", color: "#1E3A8A" }}>
                    Last Triggered: {flowDiagramRule.lastTriggered || "12 Aug 2026"}
                  </span>
                </div>

                <button
                  type="button"
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={() => {
                    const r = flowDiagramRule;
                    setFlowDiagramRule(null);
                    handleEditRule(r);
                  }}
                >
                  <span>Edit in Rule Builder</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
