"use client";

import React, { useState, useMemo } from "react";
import {
  GripVertical,
  Plus,
  MoreHorizontal,
  Search,
  X,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  Check,
  AlertTriangle,
  RotateCcw,
  Layers,
  CheckSquare,
} from "lucide-react";

export type BoqRule = {
  id: string;
  name: string;
  description: string;
  scope: string;
  value: string;
  source: "TEMPLATE" | "ORGANISATION" | string;
  status: "ACTIVE" | "OVERRIDE" | "INACTIVE" | string;
  impact: string;
  lastUpdated: string;
  category: "Commercial" | "Calculation" | "Governance" | string;
  appliedTo?: string[];
  conditions?: string;
  actions?: string;
};

export type BoqTemplateDetailData = {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  category: string;
  projectType: string;
  status: string;
  version: string;
  usedIn: string;
  tags: string[];
  useCount: number;
  sections: number;
  categories: number;
  items: number;
  costMapping: number;
  indicativeBaseCost: string;
  baseCostAmount: number;
  readiness: number;
  updatedAt: string;
  rules?: BoqRule[];
};

interface BoqTemplateRulesProps {
  template: BoqTemplateDetailData;
  onRefresh?: () => Promise<void> | void;
  onNotice?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// Exact fallback rules from Figma export specification
const FIGMA_DEFAULT_RULES: BoqRule[] = [
  {
    id: "r1",
    name: "Quantity Resolution",
    description: "How quantity is determined",
    scope: "BOQ",
    value: "Project Input",
    source: "TEMPLATE",
    status: "ACTIVE",
    impact: "186 Items",
    lastUpdated: "12 Aug 2026",
    category: "Commercial",
    appliedTo: ["Material", "Labour", "Transportation", "Overhead"],
    conditions: "Applied automatically to all variable input quantities from project site surveys.",
    actions: "Compute effective base quantity using measurements multiplied by room unit factor.",
  },
  {
    id: "r2",
    name: "Rate Resolution",
    description: "Where item rates comes from",
    scope: "BOQ",
    value: "Current Library",
    source: "TEMPLATE",
    status: "ACTIVE",
    impact: "174 Items",
    lastUpdated: "10 Aug 2026",
    category: "Commercial",
    appliedTo: ["Material", "Labour"],
    conditions: "Match library item code to organizational central rate card v2.4.",
    actions: "Auto-sync benchmark unit rates and trigger freshness alerts when outdated > 30 days.",
  },
  {
    id: "r3",
    name: "Default Storage",
    description: "General Wastage %",
    scope: "BOQ",
    value: "5%",
    source: "TEMPLATE",
    status: "ACTIVE",
    impact: "142 Items",
    lastUpdated: "06 Aug 2026",
    category: "Calculation",
    appliedTo: ["Material"],
    conditions: "All non-modular materials without specific trade wastage overrides.",
    actions: "Add 5% allowance to raw material cutting and storage margin.",
  },
  {
    id: "r4",
    name: "Flooring Wastage",
    description: "Category Override",
    scope: "Category Flooring",
    value: "8%",
    source: "TEMPLATE",
    status: "OVERRIDE",
    impact: "27 Items",
    lastUpdated: "02 Aug 2026",
    category: "Calculation",
    appliedTo: ["Material"],
    conditions: "Category matches Flooring, Vitrified Tiles, Marble, or Hardwood.",
    actions: "Override default 5% storage allowance with 8% tile diagonal cutting allowance.",
  },
  {
    id: "r5",
    name: "Default Tax",
    description: "Markup percentage",
    scope: "BOQ",
    value: "18%(GST)",
    source: "TEMPLATE",
    status: "ACTIVE",
    impact: "186 Items",
    lastUpdated: "01 Aug 2026",
    category: "Commercial",
    appliedTo: ["Material", "Labour", "Overhead", "Tax"],
    conditions: "Standard domestic commercial and residential services within state jurisdiction.",
    actions: "Apply 18% GST (9% CGST + 9% SGST) over net line item subtotal.",
  },
  {
    id: "r6",
    name: "Default Markup",
    description: "Markup Percentage",
    scope: "BOQ",
    value: "12%",
    source: "ORGANISATION",
    status: "ACTIVE",
    impact: "172 Items",
    lastUpdated: "01 Aug 2026",
    category: "Commercial",
    appliedTo: ["Material", "Labour", "Overhead"],
    conditions: "Global organization target gross margin baseline.",
    actions: "Append 12% contractor gross margin to calculated internal base cost.",
  },
  {
    id: "r7",
    name: "Material Minimum",
    description: "Minimum material threshold",
    scope: "BOQ",
    value: "₹500",
    source: "TEMPLATE",
    status: "ACTIVE",
    impact: "186 Items",
    lastUpdated: "28 Jul 2026",
    category: "Governance",
    appliedTo: ["Material"],
    conditions: "Small miscellaneous hardware, fasteners, and installation sundries.",
    actions: "Enforce minimum unit billable cost floor of ₹500.",
  },
  {
    id: "r8",
    name: "Budget Cap Alert",
    description: "Alert when budget exceeds",
    scope: "BOQ",
    value: "₹50L",
    source: "TEMPLATE",
    status: "ACTIVE",
    impact: "1 BOQ",
    lastUpdated: "25 Jul 2026",
    category: "Governance",
    appliedTo: ["Material", "Labour", "Transportation", "Overhead", "Tax"],
    conditions: "Cumulative project estimate total exceeds ₹50.00 Lakhs baseline.",
    actions: "Require Commercial Director approval flag before client quote generation.",
  },
];

export default function BoqTemplateRules({
  template,
  onRefresh,
  onNotice,
}: BoqTemplateRulesProps) {
  // Local rules state initialized from template.rules or Figma defaults
  const [rulesList, setRulesList] = useState<BoqRule[]>(() => {
    if (template.rules && template.rules.length > 0) {
      return template.rules;
    }
    return FIGMA_DEFAULT_RULES;
  });

  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState<string>("All Rules");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Inspector Panel state (optional side inspector split)
  const [selectedRule, setSelectedRule] = useState<BoqRule | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"Overview" | "Conditions" | "Actions">("Overview");

  // Row Action Menu state
  const [activeMenuRuleId, setActiveMenuRuleId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BoqRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<BoqRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for Create / Edit
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<"Commercial" | "Calculation" | "Governance">("Commercial");
  const [formScope, setFormScope] = useState("BOQ");
  const [formValue, setFormValue] = useState("");
  const [formSource, setFormSource] = useState<"TEMPLATE" | "ORGANISATION">("TEMPLATE");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "OVERRIDE" | "INACTIVE">("ACTIVE");
  const [formImpact, setFormImpact] = useState("");

  // Categories list
  const categories = ["All Rules", "Commercial", "Calculation", "Governance"] as const;

  // Category counts computed dynamically from the complete rule set
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "All Rules": rulesList.length,
      Commercial: 0,
      Calculation: 0,
      Governance: 0,
    };
    rulesList.forEach((r) => {
      const cat = r.category || "Commercial";
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [rulesList]);

  // Filtered rules based on category, search, and optional status filter
  const filteredRules = useMemo(() => {
    return rulesList.filter((r) => {
      // Category filter
      if (selectedCategory !== "All Rules" && r.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter && r.status !== statusFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = r.name.toLowerCase().includes(query);
        const descMatch = (r.description || "").toLowerCase().includes(query);
        const scopeMatch = (r.scope || "").toLowerCase().includes(query);
        const valMatch = (r.value || "").toLowerCase().includes(query);
        if (!nameMatch && !descMatch && !scopeMatch && !valMatch) {
          return false;
        }
      }
      return true;
    });
  }, [rulesList, selectedCategory, statusFilter, searchQuery]);

  // Paginated rules
  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
  const paginatedRules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, currentPage, pageSize]);

  // Persist updated rules to backend via PATCH /api/v1/boq-templates/${id}
  const persistRulesToBackend = async (newRules: BoqRule[]) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/v1/boq-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            rules: newRules,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update rules on server.");
      }
      setRulesList(newRules);
      await onRefresh?.();
      return true;
    } catch (err) {
      // Fallback: update local state so user can continue without blocking
      setRulesList(newRules);
      const msg = err instanceof Error ? err.message : "Error updating rules.";
      onNotice?.(msg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormName("");
    setFormDescription("");
    setFormCategory("Commercial");
    setFormScope("BOQ");
    setFormValue("");
    setFormSource("TEMPLATE");
    setFormStatus("ACTIVE");
    setFormImpact(`${template.items || 186} Items`);
    setIsCreateModalOpen(true);
  };

  // Submit Create Rule
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onNotice?.("Please provide a rule name.");
      return;
    }

    const todayStr = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const newRule: BoqRule = {
      id: `r_${Date.now()}`,
      name: formName.trim(),
      description: formDescription.trim() || "Configured rule",
      category: formCategory,
      scope: formScope.trim() || "BOQ",
      value: formValue.trim() || "Enabled",
      source: formSource,
      status: formStatus,
      impact: formImpact.trim() || `${template.items || 186} Items`,
      lastUpdated: todayStr,
      appliedTo: ["Material", "Labour", "Overhead"],
    };

    const updated = [newRule, ...rulesList];
    await persistRulesToBackend(updated);
    setIsCreateModalOpen(false);
    onNotice?.(`Rule "${newRule.name}" created successfully.`);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rule: BoqRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormDescription(rule.description);
    setFormCategory(
      ["Commercial", "Calculation", "Governance"].includes(rule.category)
        ? (rule.category as any)
        : "Commercial"
    );
    setFormScope(rule.scope);
    setFormValue(rule.value);
    setFormSource(rule.source === "ORGANISATION" ? "ORGANISATION" : "TEMPLATE");
    setFormStatus(
      ["ACTIVE", "OVERRIDE", "INACTIVE"].includes(rule.status)
        ? (rule.status as any)
        : "ACTIVE"
    );
    setFormImpact(rule.impact);
    setActiveMenuRuleId(null);
  };

  // Submit Edit Rule
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !formName.trim()) return;

    const todayStr = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const updated = rulesList.map((r) => {
      if (r.id === editingRule.id) {
        return {
          ...r,
          name: formName.trim(),
          description: formDescription.trim(),
          category: formCategory,
          scope: formScope.trim(),
          value: formValue.trim(),
          source: formSource,
          status: formStatus,
          impact: formImpact.trim(),
          lastUpdated: todayStr,
        };
      }
      return r;
    });

    await persistRulesToBackend(updated);
    if (selectedRule && selectedRule.id === editingRule.id) {
      setSelectedRule({
        ...selectedRule,
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        scope: formScope.trim(),
        value: formValue.trim(),
        source: formSource,
        status: formStatus,
        impact: formImpact.trim(),
        lastUpdated: todayStr,
      });
    }
    setEditingRule(null);
    onNotice?.(`Rule "${formName}" updated.`);
  };

  // Toggle Rule Status (ACTIVE <-> INACTIVE)
  const handleToggleStatus = async (rule: BoqRule) => {
    const nextStatus = rule.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const updated = rulesList.map((r) =>
      r.id === rule.id ? { ...r, status: nextStatus } : r
    );
    await persistRulesToBackend(updated);
    if (selectedRule && selectedRule.id === rule.id) {
      setSelectedRule({ ...selectedRule, status: nextStatus });
    }
    setActiveMenuRuleId(null);
    onNotice?.(`Rule "${rule.name}" is now ${nextStatus}.`);
  };

  // Delete Rule
  const handleConfirmDelete = async () => {
    if (!deletingRule) return;
    const updated = rulesList.filter((r) => r.id !== deletingRule.id);
    await persistRulesToBackend(updated);
    if (selectedRule && selectedRule.id === deletingRule.id) {
      setSelectedRule(null);
    }
    setDeletingRule(null);
    onNotice?.(`Rule "${deletingRule.name}" deleted.`);
  };

  return (
    <div className="boq-rules-container">
      {/* ── 1. Subheader Row (Figma Frame 2147225198) ── */}
      <div className="boq-rules-subheader">
        <div className="boq-rules-subheader-left">
          <h2 className="boq-rules-title">Rules</h2>
          <p className="boq-rules-desc">
            Configure how this BOQ behaves when used in Projects
          </p>
        </div>

        <div className="boq-rules-toolbar">
          {/* Search rules... (Frame 76) */}
          <div className="boq-rules-search-box">
            <div className="boq-rules-search-icon-container">
              <Search size={16} />
            </div>
            <input
              type="text"
              className="boq-rules-search-input"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Primary Create Rule button */}
          <button
            type="button"
            className="boq-rules-create-btn"
            onClick={handleOpenCreateModal}
          >
            <Plus size={18} />
            <span>Create Rule</span>
          </button>

          {/* Filter/Instant Mix Button (instant_mix) */}
          <button
            type="button"
            className={`boq-rules-icon-btn ${statusFilter ? "active" : ""}`}
            title="Filter by status"
            onClick={() => {
              if (!statusFilter) setStatusFilter("ACTIVE");
              else if (statusFilter === "ACTIVE") setStatusFilter("OVERRIDE");
              else setStatusFilter(null);
            }}
          >
            <Sliders size={18} />
          </button>

          {/* More actions button (more_horiz) */}
          <button
            type="button"
            className="boq-rules-icon-btn"
            title="Reset filters"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All Rules");
              setStatusFilter(null);
              onNotice?.("Rules filters reset.");
            }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* ── 2. Metric Summary Cards (Figma Frame 2147225138) ── */}
      <div className="boq-rules-metrics-grid">
        {/* Sections */}
        <div className="boq-rules-metric-card">
          <span className="boq-rules-metric-label">Sections</span>
          <div className="boq-rules-metric-val">{template.sections || 18}</div>
          <span className="boq-rules-metric-sub">Organised Structure</span>
        </div>

        {/* Line Items */}
        <div className="boq-rules-metric-card">
          <span className="boq-rules-metric-label">Line Items</span>
          <div className="boq-rules-metric-val">{template.items || 186}</div>
          <span className="boq-rules-metric-sub">Total Items</span>
        </div>

        {/* Indicative Base Cost */}
        <div className="boq-rules-metric-card">
          <span className="boq-rules-metric-label">Indicative Base Cost</span>
          <div className="boq-rules-metric-val accent">
            {template.indicativeBaseCost || "₹28.60L"}
          </div>
          <span className="boq-rules-metric-sub">Current Library Rates</span>
        </div>

        {/* Rate Mapping */}
        <div className="boq-rules-metric-card">
          <span className="boq-rules-metric-label">Rate Mapping</span>
          <div className="boq-rules-metric-val blue">
            {template.costMapping || 94}%
          </div>
          <span className="boq-rules-metric-sub">Mapped to Library</span>
        </div>
      </div>

      {/* ── 3. Rule Category Filter Bar (Figma Frame 2147225291) ── */}
      <div className="boq-rules-filter-bar-wrap">
        <div className="boq-rules-filter-bar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                className={`boq-rules-filter-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
              >
                <span>{cat}</span>
                <span className="boq-rules-filter-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Rules Table Area (Figma Frame 2147225085 & 2147225072) ── */}
      <div className="boq-rules-main-area">
        <div
          className={`boq-rules-table-container ${
            selectedRule ? "with-inspector" : ""
          }`}
        >
          <div className="boq-rules-table-inner">
            <table className="boq-rules-table">
              <thead>
                <tr>
                  <th className="boq-rules-th-drag" />
                  <th className="boq-rules-th-name">RULE NAME</th>
                  <th className="boq-rules-th-scope">SCOPE</th>
                  <th className="boq-rules-th-val">VALUE</th>
                  <th className="boq-rules-th-source">SOURCE</th>
                  <th className="boq-rules-th-status">STATUS</th>
                  <th className="boq-rules-th-impact">IMPACT</th>
                  <th className="boq-rules-th-updated">LAST UPDATED</th>
                  <th className="boq-rules-th-actions" />
                </tr>
              </thead>
              <tbody>
                {paginatedRules.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="boq-rules-empty-state">
                        <div className="boq-rules-empty-icon">
                          <Layers size={24} />
                        </div>
                        <p className="boq-rules-empty-title">
                          No matching rules found
                        </p>
                        <p className="boq-rules-empty-desc">
                          {searchQuery
                            ? `No rules match your search for "${searchQuery}".`
                            : "No rules in this category. You can create a new rule to govern project behaviors."}
                        </p>
                        {searchQuery && (
                          <button
                            type="button"
                            className="boq-rules-empty-btn"
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedCategory("All Rules");
                            }}
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRules.map((rule) => {
                    const isSelected = selectedRule?.id === rule.id;
                    const isMenuOpen = activeMenuRuleId === rule.id;

                    return (
                      <tr
                        key={rule.id}
                        className={isSelected ? "selected" : ""}
                        onClick={() => setSelectedRule(rule)}
                      >
                        {/* Drag Handle */}
                        <td
                          className="boq-rules-td-drag"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="boq-rules-drag-handle">
                            <GripVertical size={16} />
                          </div>
                        </td>

                        {/* Rule Name & Subtitle */}
                        <td className="boq-rules-td-name">
                          <div className="boq-rules-name-container">
                            <p className="boq-rules-item-title">{rule.name}</p>
                            <p className="boq-rules-item-subtitle">
                              {rule.description}
                            </p>
                          </div>
                        </td>

                        {/* Scope */}
                        <td className="boq-rules-td-scope">
                          <span className="boq-rules-cell-text">
                            {rule.scope}
                          </span>
                        </td>

                        {/* Value */}
                        <td className="boq-rules-td-val">
                          <span className="boq-rules-cell-text">
                            {rule.value}
                          </span>
                        </td>

                        {/* Source */}
                        <td className="boq-rules-td-source">
                          <span
                            className={`boq-rules-source-badge ${rule.source.toLowerCase()}`}
                          >
                            {rule.source}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="boq-rules-td-status">
                          <span
                            className={`boq-rules-status-badge ${rule.status.toLowerCase()}`}
                          >
                            {rule.status}
                          </span>
                        </td>

                        {/* Impact */}
                        <td className="boq-rules-td-impact">
                          <span className="boq-rules-cell-impact">
                            {rule.impact}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="boq-rules-td-updated">
                          <span className="boq-rules-cell-updated">
                            {rule.lastUpdated}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="boq-rules-td-actions"
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: "relative" }}
                        >
                          <button
                            type="button"
                            className="boq-rules-row-action-btn"
                            title="Rule Actions"
                            onClick={() =>
                              setActiveMenuRuleId(isMenuOpen ? null : rule.id)
                            }
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {isMenuOpen && (
                            <div
                              style={{
                                position: "absolute",
                                right: 12,
                                top: 40,
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: 6,
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                width: 140,
                                zIndex: 50,
                                display: "flex",
                                flexDirection: "column",
                                padding: "4px 0",
                              }}
                            >
                              <button
                                type="button"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  border: "none",
                                  background: "transparent",
                                  fontFamily: "inherit",
                                  fontSize: 13,
                                  color: "#334155",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  width: "100%",
                                }}
                                onClick={() => {
                                  setSelectedRule(rule);
                                  setActiveMenuRuleId(null);
                                }}
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  border: "none",
                                  background: "transparent",
                                  fontFamily: "inherit",
                                  fontSize: 13,
                                  color: "#334155",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  width: "100%",
                                }}
                                onClick={() => handleOpenEditModal(rule)}
                              >
                                Edit Rule
                              </button>
                              <button
                                type="button"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  border: "none",
                                  background: "transparent",
                                  fontFamily: "inherit",
                                  fontSize: 13,
                                  color: "#334155",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  width: "100%",
                                }}
                                onClick={() => handleToggleStatus(rule)}
                              >
                                {rule.status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                              <hr
                                style={{
                                  border: "none",
                                  borderTop: "1px solid #F1F5F9",
                                  margin: "4px 0",
                                }}
                              />
                              <button
                                type="button"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  border: "none",
                                  background: "transparent",
                                  fontFamily: "inherit",
                                  fontSize: 13,
                                  color: "#DC2626",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  width: "100%",
                                }}
                                onClick={() => {
                                  setDeletingRule(rule);
                                  setActiveMenuRuleId(null);
                                }}
                              >
                                Delete Rule
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Scroll Indicator Pill (Rectangle 70) */}
          <div className="boq-rules-scroll-indicator" />

          {/* ── 5. Pagination Bar (Figma Frame 2147225166) ── */}
          <div className="boq-rules-pagination">
            <span className="boq-rules-pagination-total">
              Total Rules: {filteredRules.length || "NA"}
            </span>

            <div className="boq-rules-pagination-pages">
              <button
                type="button"
                className="boq-rules-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(
                (num) => (
                  <button
                    key={num}
                    type="button"
                    className={`boq-rules-page-btn ${
                      currentPage === num ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                )
              )}

              <button
                type="button"
                className="boq-rules-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="boq-rules-pagination-per-page">
              <span>Show per Page:</span>
              <div className="boq-rules-select-container">
                <select
                  className="boq-rules-select-native"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={14} color="#64748B" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. Rule Inspector Panel (Right Sliding Panel) ── */}
        {selectedRule && (
          <div className="boq-rules-inspector-panel">
            <div className="boq-rules-insp-header">
              <p className="boq-rules-insp-title">
                {selectedRule.name.toUpperCase()}
              </p>
              <p className="boq-rules-insp-desc">
                {selectedRule.description} applied on internal cost
              </p>
              <button
                type="button"
                className="boq-rules-insp-close"
                onClick={() => setSelectedRule(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="boq-rules-insp-tabs">
              {(["Overview", "Conditions", "Actions"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`boq-rules-insp-tab ${
                    inspectorTab === tab ? "active" : ""
                  }`}
                  onClick={() => setInspectorTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="boq-rules-insp-body">
              {inspectorTab === "Overview" && (
                <>
                  <div className="boq-rules-insp-field">
                    <span className="boq-rules-insp-field-label">Status</span>
                    <span
                      className={`boq-rules-status-badge ${selectedRule.status.toLowerCase()}`}
                    >
                      {selectedRule.status}
                    </span>
                  </div>

                  <div className="boq-rules-insp-field">
                    <span className="boq-rules-insp-field-label">Value</span>
                    <span className="boq-rules-insp-field-value">
                      {selectedRule.value}
                    </span>
                  </div>

                  <div className="boq-rules-insp-field">
                    <span className="boq-rules-insp-field-label">Scope</span>
                    <span className="boq-rules-insp-field-value">
                      {selectedRule.scope}
                    </span>
                  </div>

                  <div className="boq-rules-insp-field">
                    <span className="boq-rules-insp-field-label">Category</span>
                    <span className="boq-rules-insp-field-value">
                      {selectedRule.category}
                    </span>
                  </div>

                  <div className="boq-rules-insp-field">
                    <span className="boq-rules-insp-field-label">
                      Inherited by
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <span className="boq-rules-insp-field-value">
                        {selectedRule.impact}
                      </span>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>
                        {template.sections || 18} sections
                      </div>
                    </div>
                  </div>

                  <div className="boq-rules-insp-field">
                    <span className="boq-rules-insp-field-label">
                      Calculation Basis
                    </span>
                    <span className="boq-rules-insp-field-value">
                      Internal Cost
                    </span>
                  </div>

                  <div className="boq-rules-insp-checklist">
                    <h4 className="boq-rules-insp-checklist-title">
                      Applied to
                    </h4>
                    {[
                      "Material",
                      "Labour",
                      "Transportation",
                      "Overhead",
                      "Tax",
                    ].map((item, idx) => (
                      <label key={item} className="boq-rules-checkbox-item">
                        <input
                          type="checkbox"
                          defaultChecked={idx < 4}
                          readOnly
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {inspectorTab === "Conditions" && (
                <div style={{ color: "#64748B", fontSize: 13 }}>
                  <p style={{ margin: "0 0 12px 0" }}>
                    Rule conditions define when this rule is triggered during
                    project BOQ generation:
                  </p>
                  <div
                    style={{
                      padding: 12,
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      background: "#F8FAFC",
                    }}
                  >
                    <b style={{ color: "#0F172A", display: "block" }}>
                      Scope: {selectedRule.scope}
                    </b>
                    <p style={{ margin: "4px 0 0 0", fontSize: 12 }}>
                      {selectedRule.conditions ||
                        "Applies to all items in scope when baseline criteria are met."}
                    </p>
                  </div>
                </div>
              )}

              {inspectorTab === "Actions" && (
                <div style={{ color: "#64748B", fontSize: 13 }}>
                  <p style={{ margin: "0 0 12px 0" }}>
                    Actions executed when this rule&apos;s conditions are
                    satisfied:
                  </p>
                  <div
                    style={{
                      padding: 12,
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      background: "#F8FAFC",
                    }}
                  >
                    <b style={{ color: "#0F172A", display: "block" }}>
                      Apply {selectedRule.value}
                    </b>
                    <p style={{ margin: "4px 0 0 0", fontSize: 12 }}>
                      {selectedRule.actions ||
                        `Calculation formula applied dynamically to ${selectedRule.impact.toLowerCase()}.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="boq-rules-insp-footer">
              <button
                type="button"
                className="boq-rules-btn-edit-primary"
                onClick={() => handleOpenEditModal(selectedRule)}
              >
                <Edit3 size={15} />
                <span>Edit Rule</span>
              </button>

              <button
                type="button"
                className="boq-rules-btn-toggle-status"
                onClick={() => handleToggleStatus(selectedRule)}
              >
                <RotateCcw size={15} />
                <span>
                  {selectedRule.status === "ACTIVE"
                    ? "Deactivate Rule"
                    : "Activate Rule"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 7. Create Rule Modal ── */}
      {isCreateModalOpen && (
        <div className="boq-rules-modal-overlay">
          <div className="boq-rules-modal-card">
            <div className="boq-rules-modal-header">
              <h3>Create New Rule</h3>
              <button
                type="button"
                className="boq-rules-insp-close"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitCreate}>
              <div className="boq-rules-modal-body">
                <div className="boq-rules-modal-field">
                  <label>Rule Name *</label>
                  <input
                    type="text"
                    required
                    className="boq-rules-modal-input"
                    placeholder="e.g., Modular Furniture Wastage"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="boq-rules-modal-field">
                  <label>Description</label>
                  <input
                    type="text"
                    className="boq-rules-modal-input"
                    placeholder="e.g., Wastage allowance on factory finished modules"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="boq-rules-modal-field">
                  <label>Category</label>
                  <select
                    className="boq-rules-modal-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Calculation">Calculation</option>
                    <option value="Governance">Governance</option>
                  </select>
                </div>

                <div className="boq-rules-modal-field">
                  <label>Scope</label>
                  <input
                    type="text"
                    className="boq-rules-modal-input"
                    placeholder="e.g., BOQ or Category Furniture"
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value)}
                  />
                </div>

                <div className="boq-rules-modal-field">
                  <label>Value / Formula</label>
                  <input
                    type="text"
                    className="boq-rules-modal-input"
                    placeholder="e.g., 5% or Current Library"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                  />
                </div>

                <div className="boq-rules-modal-field">
                  <label>Source</label>
                  <select
                    className="boq-rules-modal-select"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as any)}
                  >
                    <option value="TEMPLATE">TEMPLATE</option>
                    <option value="ORGANISATION">ORGANISATION</option>
                  </select>
                </div>

                <div className="boq-rules-modal-field">
                  <label>Status</label>
                  <select
                    className="boq-rules-modal-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="OVERRIDE">OVERRIDE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="boq-rules-modal-field">
                  <label>Impact Indicator</label>
                  <input
                    type="text"
                    className="boq-rules-modal-input"
                    placeholder="e.g., 42 Items"
                    value={formImpact}
                    onChange={(e) => setFormImpact(e.target.value)}
                  />
                </div>
              </div>

              <div className="boq-rules-modal-footer">
                <button
                  type="button"
                  className="boq-rules-btn-cancel"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="boq-rules-btn-save"
                >
                  <Check size={16} />
                  <span>{isSaving ? "Saving..." : "Create Rule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. Edit Rule Modal ── */}
      {editingRule && (
        <div className="boq-rules-modal-overlay">
          <div className="boq-rules-modal-card">
            <div className="boq-rules-modal-header">
              <h3>Edit Rule</h3>
              <button
                type="button"
                className="boq-rules-insp-close"
                onClick={() => setEditingRule(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="boq-rules-modal-body">
                <div className="boq-rules-modal-field">
                  <label>Rule Name *</label>
                  <input
                    type="text"
                    required
                    className="boq-rules-modal-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="boq-rules-modal-field">
                  <label>Description</label>
                  <input
                    type="text"
                    className="boq-rules-modal-input"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="boq-rules-modal-field">
                  <label>Category</label>
                  <select
                    className="boq-rules-modal-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Calculation">Calculation</option>
                    <option value="Governance">Governance</option>
                  </select>
                </div>

                <div className="boq-rules-modal-field">
                  <label>Scope</label>
                  <input
                    type="text"
                    className="boq-rules-modal-input"
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value)}
                  />
                </div>

                <div className="boq-rules-modal-field">
                  <label>Value / Formula</label>
                  <input
                    type="text"
                    className="boq-rules-modal-input"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                  />
                </div>

                <div className="boq-rules-modal-field">
                  <label>Source</label>
                  <select
                    className="boq-rules-modal-select"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as any)}
                  >
                    <option value="TEMPLATE">TEMPLATE</option>
                    <option value="ORGANISATION">ORGANISATION</option>
                  </select>
                </div>

                <div className="boq-rules-modal-field">
                  <label>Status</label>
                  <select
                    className="boq-rules-modal-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="OVERRIDE">OVERRIDE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="boq-rules-modal-field">
                  <label>Impact Indicator</label>
                  <input
                    type="text"
                    className="boq-rules-modal-input"
                    value={formImpact}
                    onChange={(e) => setFormImpact(e.target.value)}
                  />
                </div>
              </div>

              <div className="boq-rules-modal-footer">
                <button
                  type="button"
                  className="boq-rules-btn-cancel"
                  onClick={() => setEditingRule(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="boq-rules-btn-save"
                >
                  <Check size={16} />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 9. Delete Rule Confirmation Dialog ── */}
      {deletingRule && (
        <div className="boq-rules-modal-overlay">
          <div className="boq-rules-modal-card" style={{ maxWidth: 440 }}>
            <div className="boq-rules-modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={20} color="#DC2626" />
                <span>Delete Rule</span>
              </h3>
              <button
                type="button"
                className="boq-rules-insp-close"
                onClick={() => setDeletingRule(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="boq-rules-modal-body">
              <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
                Are you sure you want to delete the rule{" "}
                <strong>&ldquo;{deletingRule.name}&rdquo;</strong>?
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>
                This will remove the rule from this BOQ template and project
                derivations. This action cannot be undone.
              </p>
            </div>
            <div className="boq-rules-modal-footer">
              <button
                type="button"
                className="boq-rules-btn-cancel"
                onClick={() => setDeletingRule(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                className="boq-rules-btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                <Trash2 size={16} />
                <span>{isSaving ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
