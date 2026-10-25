"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ClipboardList,
  Package,
  ShieldCheck,
  Calendar,
  MoreHorizontal,
  X,
  Check,
  Plus,
  Copy,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
} from "lucide-react";
import type { MockMilestone } from "@/lib/templates/types";
import { DEFAULT_WORKFLOW_MILESTONES } from "@/lib/templates/default-milestones";

interface WorkflowMilestonesViewProps {
  templateId?: string;
  templateName?: string;
  milestones?: MockMilestone[];
  stages?: any[];
  tasks?: any[];
  searchQuery?: string;
  statusFilter?: string;
  onUpdateMilestones?: (milestones: MockMilestone[]) => void;
  onAddMilestoneClick?: () => void;
  saving?: boolean;
  saveSuccess?: boolean;
  saveError?: string | null;
}

export default function WorkflowMilestonesView({
  templateId,
  templateName = "Template",
  milestones: propMilestones,
  stages = [],
  tasks = [],
  searchQuery = "",
  statusFilter = "All",
  onUpdateMilestones,
  onAddMilestoneClick,
  saving = false,
  saveSuccess = false,
  saveError = null,
}: WorkflowMilestonesViewProps) {
  // Local milestones state initialized from props or fallback to standard 8 milestones if completely empty/undefined
  const [milestones, setMilestones] = useState<MockMilestone[]>(() => {
    if (propMilestones && Array.isArray(propMilestones) && propMilestones.length > 0) {
      return propMilestones;
    }
    return DEFAULT_WORKFLOW_MILESTONES;
  });

  // Keep state synced with prop updates
  useEffect(() => {
    if (propMilestones && Array.isArray(propMilestones) && propMilestones.length > 0) {
      setMilestones(propMilestones);
    }
  }, [propMilestones]);

  // Selected milestone ID (defaults to Concept Design ms-03 matching Figma Card 03)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("ms-03");

  // Card dropdown menu tracking
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);

  // Inspector Drawer state (Figma Frame 2147225086)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorMilestone, setInspectorMilestone] = useState<MockMilestone | null>(null);

  // Form fields for Inspector / Edit
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    subtitle: "",
    description: "",
    category: "Design",
    status: "CONFIGURED" as "CONFIGURED" | "DRAFT" | "PENDING",
    ownerRole: "Lead Designer",
    durationDays: 7,
    durationUnit: "Days",
    tasksCount: 6,
    deliverablesCount: 2,
    approvalType: "No Approval",
    startRule: "After Site Measurement",
    completionRule: "All Required Tasks Complete",
  });

  // Dedicated Add Milestone Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    code: "",
    subtitle: "",
    description: "",
    category: "Design",
    ownerRole: "Lead Designer",
    durationDays: 5,
    durationUnit: "Days",
    tasksCount: 4,
    deliverablesCount: 1,
    approvalType: "No Approval",
    startRule: "After Preceding Milestone",
    completionRule: "All Required Tasks Complete",
    status: "CONFIGURED" as "CONFIGURED" | "DRAFT" | "PENDING",
  });

  // Delete confirmation modal state
  const [milestoneToDelete, setMilestoneToDelete] = useState<MockMilestone | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      setOpenCardMenuId(null);
    };
    if (openCardMenuId) {
      window.addEventListener("click", handleWindowClick);
      return () => window.removeEventListener("click", handleWindowClick);
    }
  }, [openCardMenuId]);

  // Dynamic KPI calculation derived strictly from real milestone records
  const totalMilestones = milestones.length;
  const linkedTasks = milestones.reduce(
    (sum, m) => sum + (Number(m.tasksCount) || Number(m.linkedTasks) || 0),
    0
  );
  const totalDeliverables = milestones.reduce(
    (sum, m) => sum + (Number(m.deliverablesCount) || Number(m.linkedDeliverables) || 0),
    0
  );
  const approvalGates = milestones.filter(
    (m) =>
      m.approvalType &&
      m.approvalType !== "No Approval" &&
      m.approvalType !== "None"
  ).length;

  // Filtered milestones based on Search and Status Filter
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.subtitle && m.subtitle.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.code && m.code.toLowerCase().includes(q)) ||
          (m.category && m.category.toLowerCase().includes(q)) ||
          (m.ownerRole && m.ownerRole.toLowerCase().includes(q)) ||
          (m.approvalType && m.approvalType.toLowerCase().includes(q));

        if (!matchesQuery) return false;
      }

      // Status filter matching
      if (statusFilter && statusFilter !== "All") {
        const filterNorm = statusFilter.toUpperCase();
        const statusNorm = (m.status || "CONFIGURED").toUpperCase();
        if (filterNorm === "ACTIVE" && statusNorm !== "ACTIVE" && statusNorm !== "CONFIGURED") {
          return false;
        } else if (filterNorm === "DRAFT" && statusNorm !== "DRAFT") {
          return false;
        } else if (filterNorm === "COMPLETED" && statusNorm !== "COMPLETED") {
          return false;
        }
      }

      return true;
    });
  }, [milestones, searchQuery, statusFilter]);

  // Handle card click / selection
  const handleSelectCard = (m: MockMilestone) => {
    setSelectedMilestoneId(m.id);
  };

  // Open Inspector Drawer for a milestone
  const handleOpenInspector = (m: MockMilestone) => {
    setSelectedMilestoneId(m.id);
    setInspectorMilestone(m);
    setFormData({
      name: m.name || "",
      code: m.code || "",
      subtitle: m.subtitle || "",
      description: m.description || m.subtitle || "",
      category: m.category || "Design",
      status: (m.status as any) || "CONFIGURED",
      ownerRole: m.ownerRole || "Lead Designer",
      durationDays: m.durationDays || parseInt(m.duration) || 5,
      durationUnit: m.duration?.includes("Business") ? "Business Days" : "Days",
      tasksCount: m.tasksCount || 6,
      deliverablesCount: m.deliverablesCount || 2,
      approvalType: m.approvalType || "No Approval",
      startRule: m.startRule || "After Preceding Milestone",
      completionRule: m.completionRule || "All Required Tasks Complete",
    });
    setIsInspectorOpen(true);
    setOpenCardMenuId(null);
  };

  // Save changes from Inspector Drawer
  const handleSaveInspector = (targetStatus?: "CONFIGURED" | "DRAFT" | "PENDING") => {
    if (!inspectorMilestone) return;
    if (!formData.name.trim()) return;

    const newStatus = targetStatus || formData.status;
    const durationStr = `${formData.durationDays} ${formData.durationUnit}`;

    const updated = milestones.map((m) => {
      if (m.id === inspectorMilestone.id) {
        return {
          ...m,
          name: formData.name.trim(),
          code: formData.code.trim(),
          subtitle: formData.subtitle.trim(),
          description: formData.description.trim(),
          category: formData.category,
          status: newStatus,
          ownerRole: formData.ownerRole,
          duration: durationStr,
          durationDays: Number(formData.durationDays),
          tasksCount: Number(formData.tasksCount),
          deliverablesCount: Number(formData.deliverablesCount),
          approvalType: formData.approvalType,
          startRule: formData.startRule,
          completionRule: formData.completionRule,
          linkedTasks: Number(formData.tasksCount),
          linkedDeliverables: Number(formData.deliverablesCount),
          linkedApprovals: formData.approvalType === "No Approval" ? "None" : formData.approvalType,
        };
      }
      return m;
    });

    setMilestones(updated);
    onUpdateMilestones?.(updated);
    setIsInspectorOpen(false);
  };

  // Duplicate a milestone
  const handleDuplicateMilestone = (m: MockMilestone) => {
    const newOrderNum = String(milestones.length + 1).padStart(2, "0");
    const newId = `ms-${Date.now()}`;
    const newCode = `MS-00${milestones.length + 1}`;

    const newMilestone: MockMilestone = {
      ...m,
      id: newId,
      orderNumber: newOrderNum,
      code: newCode,
      name: `${m.name} (Copy)`,
      status: "DRAFT",
    };

    const updated = [...milestones, newMilestone];
    setMilestones(updated);
    onUpdateMilestones?.(updated);
    setSelectedMilestoneId(newId);
    setOpenCardMenuId(null);
  };

  // Delete milestone
  const handleConfirmDelete = () => {
    if (!milestoneToDelete) return;
    const updated = milestones
      .filter((m) => m.id !== milestoneToDelete.id)
      .map((m, idx) => ({
        ...m,
        orderNumber: String(idx + 1).padStart(2, "0"),
      }));

    setMilestones(updated);
    onUpdateMilestones?.(updated);
    if (selectedMilestoneId === milestoneToDelete.id) {
      setSelectedMilestoneId(updated[0]?.id || "");
    }
    setMilestoneToDelete(null);
    setIsInspectorOpen(false);
  };

  // Open Add Milestone Modal
  const handleOpenAddModal = () => {
    const nextOrder = String(milestones.length + 1).padStart(2, "0");
    const nextCode = `MS-00${milestones.length + 1}`;
    setAddFormData({
      name: "",
      code: nextCode,
      subtitle: "",
      description: "",
      category: "Design",
      ownerRole: "Lead Designer",
      durationDays: 5,
      durationUnit: "Days",
      tasksCount: 4,
      deliverablesCount: 1,
      approvalType: "No Approval",
      startRule: "After Preceding Milestone",
      completionRule: "All Required Tasks Complete",
      status: "CONFIGURED",
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Milestone
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name.trim()) return;

    const nextOrder = String(milestones.length + 1).padStart(2, "0");
    const newMilestone: MockMilestone = {
      id: `ms-${Date.now()}`,
      orderNumber: nextOrder,
      code: addFormData.code.trim() || `MS-00${nextOrder}`,
      name: addFormData.name.trim(),
      subtitle: addFormData.subtitle.trim() || addFormData.name.trim(),
      description: addFormData.description.trim() || addFormData.subtitle.trim(),
      category: addFormData.category,
      ownerRole: addFormData.ownerRole,
      duration: `${addFormData.durationDays} ${addFormData.durationUnit}`,
      durationDays: Number(addFormData.durationDays),
      tasksCount: Number(addFormData.tasksCount),
      deliverablesCount: Number(addFormData.deliverablesCount),
      approvalType: addFormData.approvalType,
      status: addFormData.status,
      startRule: addFormData.startRule,
      completionRule: addFormData.completionRule,
      linkedTasks: Number(addFormData.tasksCount),
      linkedDeliverables: Number(addFormData.deliverablesCount),
      linkedApprovals: addFormData.approvalType === "No Approval" ? "None" : addFormData.approvalType,
      linkedDependencies: 1,
      nextMilestoneTitle: "Next Milestone",
      nextMilestoneCode: "N/A",
    };

    const updated = [...milestones, newMilestone];
    setMilestones(updated);
    onUpdateMilestones?.(updated);
    setSelectedMilestoneId(newMilestone.id);
    setIsAddModalOpen(false);
  };

  // Initialize standard 8 Figma milestones if empty
  const handleResetToStandard = () => {
    setMilestones(DEFAULT_WORKFLOW_MILESTONES);
    onUpdateMilestones?.(DEFAULT_WORKFLOW_MILESTONES);
    setSelectedMilestoneId("ms-03");
  };

  return (
    <div className="td-wf-milestones-view-container">
      {/* ── Status Alerts (Saving, Success, Error) ───────────────────── */}
      {saveSuccess && (
        <div className="td-wf-alert success" role="alert">
          <Check size={16} />
          <span>Milestone changes saved successfully.</span>
        </div>
      )}
      {saveError && (
        <div className="td-wf-alert error" role="alert">
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}
      {saving && (
        <div className="td-wf-alert info" role="status">
          <span className="td-wf-spinner" />
          <span>Saving milestone workflow to database…</span>
        </div>
      )}

      {/* ── 4 KPI Summary Cards (Figma Frame 2147225138) ─────────────── */}
      <div className="td-wf-milestones-kpi-grid">
        {/* Card 1: Milestones */}
        <div className="td-wf-milestones-kpi-card">
          <span className="label">Milestones</span>
          <span className="val">{String(totalMilestones).padStart(2, "0")}</span>
          <span className="sub">All Configured</span>
        </div>

        {/* Card 2: Linked Tasks */}
        <div className="td-wf-milestones-kpi-card">
          <span className="label">Linked Tasks</span>
          <span className="val">{String(linkedTasks).padStart(2, "0")}</span>
          <span className="sub">Across Milestones</span>
        </div>

        {/* Card 3: Deliverables */}
        <div className="td-wf-milestones-kpi-card">
          <span className="label">Deliverables</span>
          <span className="val">{String(totalDeliverables).padStart(2, "0")}</span>
          <span className="sub">Requires Output</span>
        </div>

        {/* Card 4: Approval Gates */}
        <div className="td-wf-milestones-kpi-card">
          <span className="label">Approval Gates</span>
          <span className="val">{String(approvalGates).padStart(2, "0")}</span>
          <span className="sub">At Milestones</span>
        </div>
      </div>

      {/* ── Milestones Content: 4-Column Cards Grid OR Empty State ──── */}
      {filteredMilestones.length === 0 ? (
        <div className="td-wf-milestones-empty-state">
          <div className="empty-icon-wrap">
            <ClipboardList size={32} />
          </div>
          <h3 className="empty-title">
            {searchQuery
              ? "No milestones match your search"
              : "No Milestones Configured"}
          </h3>
          <p className="empty-desc">
            {searchQuery
              ? `No milestones found matching "${searchQuery}". Try clearing the search or filters.`
              : "Define the key checkpoints, deliverable requirements, and approval gates for projects created from this template."}
          </p>
          <div className="empty-actions">
            <button
              type="button"
              className="td-wf-btn-add"
              onClick={handleOpenAddModal}
            >
              <Plus size={16} />
              <span>Add Milestone</span>
            </button>
            {!searchQuery && milestones.length === 0 && (
              <button
                type="button"
                className="td-wf-btn-filter"
                onClick={handleResetToStandard}
              >
                <Sparkles size={14} />
                <span>Initialize 8 Standard Milestones</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="td-wf-milestones-grid">
          {filteredMilestones.map((m) => {
            const isSelected = selectedMilestoneId === m.id;
            const isMenuOpen = openCardMenuId === m.id;
            const statusUpper = (m.status || "CONFIGURED").toUpperCase();
            const badgeClass =
              statusUpper === "CONFIGURED" || statusUpper === "ACTIVE"
                ? "badge-configured"
                : statusUpper === "DRAFT"
                ? "badge-draft"
                : "badge-pending";

            return (
              <div
                key={m.id}
                className={`td-wf-milestone-card ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectCard(m)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSelectCard(m);
                  }
                }}
              >
                {/* ── Card Top Header (Figma Frame 2147225073) ──────── */}
                <div className="card-top">
                  <div className="card-header-left">
                    <div className="order-badge">
                      <span>{m.orderNumber || "01"}</span>
                    </div>
                    <div className="titles-col">
                      <h4 className="card-title" title={m.name}>
                        {m.name}
                      </h4>
                      <p className="card-desc" title={m.subtitle || m.description}>
                        {m.subtitle || m.description || "Project milestone and deliverables"}
                      </p>
                    </div>
                  </div>

                  {/* Kebab Menu */}
                  <div
                    className="card-menu-wrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="card-menu-btn"
                      onClick={() =>
                        setOpenCardMenuId(isMenuOpen ? null : m.id)
                      }
                      title="Milestone options"
                      aria-label="Milestone options"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {isMenuOpen && (
                      <div className="card-dropdown-menu">
                        <button
                          type="button"
                          className="item"
                          onClick={() => handleOpenInspector(m)}
                        >
                          <Edit2 size={13} />
                          <span>View / Edit Details</span>
                        </button>
                        <button
                          type="button"
                          className="item"
                          onClick={() => handleDuplicateMilestone(m)}
                        >
                          <Copy size={13} />
                          <span>Duplicate Milestone</span>
                        </button>
                        <button
                          type="button"
                          className="item danger"
                          onClick={() => {
                            setMilestoneToDelete(m);
                            setOpenCardMenuId(null);
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Delete Milestone</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Rectangle 40: Divider ─────────────────────────── */}
                <hr className="card-divider" />

                {/* ── 3 Metric Rows ─────────────────────────────────── */}
                <div className="card-metrics-col">
                  {/* Row 1: Tasks */}
                  <div className="card-metric-row">
                    <div className="metric-icon">
                      <ClipboardList size={18} />
                    </div>
                    <span className="metric-text">
                      {m.tasksCount || m.linkedTasks || 0} Tasks
                    </span>
                  </div>

                  {/* Row 2: Deliverables */}
                  <div className="card-metric-row">
                    <div className="metric-icon">
                      <Package size={18} />
                    </div>
                    <span className="metric-text">
                      {m.deliverablesCount || m.linkedDeliverables || 0} Deliverables
                    </span>
                  </div>

                  {/* Row 3: Approvals */}
                  <div className="card-metric-row">
                    <div className="metric-icon">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="metric-text">
                      {m.approvalType || "No Approval"}
                    </span>
                  </div>
                </div>

                {/* ── Rectangle 41: Divider ─────────────────────────── */}
                <hr className="card-divider" />

                {/* ── Card Footer (Duration + Status Pill) ──────────── */}
                <div className="card-footer">
                  <div className="card-duration">
                    <Calendar size={16} />
                    <span>{m.duration || "2 Days"}</span>
                  </div>

                  <span className={`card-status-badge ${badgeClass}`}>
                    {statusUpper}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Milestone Details Drawer (Figma Frame 2147225086) ─────────── */}
      {isInspectorOpen && inspectorMilestone && (
        <div
          className="td-milestone-drawer-overlay"
          onClick={() => setIsInspectorOpen(false)}
        >
          <aside
            className="td-milestone-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-milestone-title"
          >
            {/* Drawer Header */}
            <div className="td-milestone-drawer-header">
              <span id="drawer-milestone-title" className="title">
                STAGE & MILESTONE DETAILS
              </span>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsInspectorOpen(false)}
                title="Close Details"
                aria-label="Close Details"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Banner */}
            <div className="td-milestone-drawer-banner">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="order-badge">
                  {inspectorMilestone.orderNumber || "01"}
                </span>
                <span
                  style={{
                    fontFamily: "Urbanist",
                    fontWeight: 600,
                    fontSize: 16,
                    color: "#0F172A",
                  }}
                >
                  {inspectorMilestone.name}
                </span>
              </div>
              <span className="card-status-badge badge-configured">
                {formData.status}
              </span>
            </div>

            {/* Drawer Form Fields */}
            <div className="td-milestone-drawer-body">
              {/* Milestone Name */}
              <div className="td-field-group">
                <label>
                  <span>Milestone Name</span>
                  <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Concept Design"
                  required
                />
              </div>

              {/* Milestone Code */}
              <div className="td-field-group">
                <label>
                  <span>Milestone Code</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g. MS-003"
                />
              </div>

              {/* Subtitle / Short Description */}
              <div className="td-field-group">
                <label>
                  <span>Description</span>
                </label>
                <textarea
                  className="textarea"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="Brief description of this milestone's purpose"
                />
              </div>

              {/* Associated Stage & Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="td-field-group">
                  <label>
                    <span>Stage</span>
                  </label>
                  <select
                    className="select"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    {stages.length > 0 ? (
                      stages.map((st: any) => (
                        <option key={st.id || st.code} value={st.name}>
                          {st.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Discovery">Discovery</option>
                        <option value="Design">Design</option>
                        <option value="Costing">Costing</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Execution">Execution</option>
                        <option value="Closure">Closure</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="td-field-group">
                  <label>
                    <span>Status</span>
                  </label>
                  <select
                    className="select"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="CONFIGURED">CONFIGURED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              {/* Owner Role */}
              <div className="td-field-group">
                <label>
                  <span>Milestone Owner (Role)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.ownerRole}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerRole: e.target.value })
                  }
                  placeholder="e.g. Lead Designer"
                />
              </div>

              {/* Expected Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="td-field-group">
                  <label>
                    <span>Duration</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={formData.durationDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationDays: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                  />
                </div>
                <div className="td-field-group">
                  <label>
                    <span>Unit</span>
                  </label>
                  <select
                    className="select"
                    value={formData.durationUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, durationUnit: e.target.value })
                    }
                  >
                    <option value="Days">Days</option>
                    <option value="Business Days">Business Days</option>
                    <option value="Weeks">Weeks</option>
                  </select>
                </div>
              </div>

              {/* Tasks & Deliverables Counts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="td-field-group">
                  <label>
                    <span>Linked Tasks</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={formData.tasksCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tasksCount: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <div className="td-field-group">
                  <label>
                    <span>Deliverables</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={formData.deliverablesCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliverablesCount: Math.max(
                          0,
                          parseInt(e.target.value) || 0
                        ),
                      })
                    }
                  />
                </div>
              </div>

              {/* Approval Gate */}
              <div className="td-field-group">
                <label>
                  <span>Approval Gate</span>
                </label>
                <select
                  className="select"
                  value={formData.approvalType}
                  onChange={(e) =>
                    setFormData({ ...formData, approvalType: e.target.value })
                  }
                >
                  <option value="No Approval">No Approval</option>
                  <option value="Client Approval">Client Approval</option>
                  <option value="Finance Approval">Finance Approval</option>
                  <option value="Internal Sign-off">Internal Sign-off</option>
                  <option value="Management Gate">Management Gate</option>
                </select>
              </div>

              {/* Entry Condition / Start Rule */}
              <div className="td-field-group">
                <label>
                  <span>Entry Condition / Start Rule</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.startRule}
                  onChange={(e) =>
                    setFormData({ ...formData, startRule: e.target.value })
                  }
                  placeholder="e.g. Discovery Sign Off Completed"
                />
              </div>

              {/* Exit Condition / Completion Rule */}
              <div className="td-field-group">
                <label>
                  <span>Exit Condition / Completion Rule</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.completionRule}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      completionRule: e.target.value,
                    })
                  }
                  placeholder="e.g. Design Approval Received"
                />
              </div>
            </div>

            {/* Drawer Footer Actions (Save Draft & Save Changes) */}
            <div className="td-milestone-drawer-footer">
              <button
                type="button"
                className="btn-save-draft"
                onClick={() => handleSaveInspector("DRAFT")}
              >
                Save Draft
              </button>
              <button
                type="button"
                className="btn-save-changes"
                onClick={() => handleSaveInspector("CONFIGURED")}
              >
                Save Changes
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Add Milestone Modal ─────────────────────────────────────── */}
      {isAddModalOpen && (
        <div
          className="td-milestone-modal-overlay"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="td-milestone-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-milestone-modal-title"
          >
            <div className="modal-header">
              <h3 id="add-milestone-modal-title" className="modal-title">
                Add Milestone Checkpoint
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="td-field-group">
                  <label>
                    <span>Milestone Name</span>
                    <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={addFormData.name}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, name: e.target.value })
                    }
                    placeholder="e.g. Technical Site Inspection"
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="td-field-group">
                    <label>
                      <span>Code</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={addFormData.code}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, code: e.target.value })
                      }
                      placeholder="e.g. MS-009"
                    />
                  </div>

                  <div className="td-field-group">
                    <label>
                      <span>Stage</span>
                    </label>
                    <select
                      className="select"
                      value={addFormData.category}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, category: e.target.value })
                      }
                    >
                      <option value="Discovery">Discovery</option>
                      <option value="Design">Design</option>
                      <option value="Costing">Costing</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Execution">Execution</option>
                      <option value="Closure">Closure</option>
                    </select>
                  </div>
                </div>

                <div className="td-field-group">
                  <label>
                    <span>Subtitle / Description</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={addFormData.subtitle}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        subtitle: e.target.value,
                      })
                    }
                    placeholder="Brief description of the milestone objective"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="td-field-group">
                    <label>
                      <span>Owner Role</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={addFormData.ownerRole}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          ownerRole: e.target.value,
                        })
                      }
                      placeholder="e.g. Project Manager"
                    />
                  </div>

                  <div className="td-field-group">
                    <label>
                      <span>Approval Requirement</span>
                    </label>
                    <select
                      className="select"
                      value={addFormData.approvalType}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          approvalType: e.target.value,
                        })
                      }
                    >
                      <option value="No Approval">No Approval</option>
                      <option value="Client Approval">Client Approval</option>
                      <option value="Finance Approval">Finance Approval</option>
                      <option value="Internal Sign-off">Internal Sign-off</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div className="td-field-group">
                    <label>
                      <span>Duration (Days)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={addFormData.durationDays}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          durationDays: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                    />
                  </div>

                  <div className="td-field-group">
                    <label>
                      <span>Tasks Count</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={addFormData.tasksCount}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          tasksCount: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                    />
                  </div>

                  <div className="td-field-group">
                    <label>
                      <span>Deliverables</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={addFormData.deliverablesCount}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          deliverablesCount: Math.max(
                            0,
                            parseInt(e.target.value) || 0
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={!addFormData.name.trim()}
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────────────── */}
      {milestoneToDelete && (
        <div
          className="td-milestone-modal-overlay"
          onClick={() => setMilestoneToDelete(null)}
        >
          <div
            className="td-milestone-modal-box"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-milestone-title"
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <h3
                  id="delete-milestone-title"
                  className="modal-title"
                  style={{ color: "#0F172A" }}
                >
                  Delete Milestone?
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMilestoneToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p
                style={{
                  fontFamily: "Urbanist",
                  fontSize: 14,
                  lineHeight: "150%",
                  color: "#475569",
                  margin: 0,
                }}
              >
                Are you sure you want to delete milestone{" "}
                <strong style={{ color: "#0F172A" }}>
                  {milestoneToDelete.orderNumber} {milestoneToDelete.name}
                </strong>
                ? This will remove the checkpoint and its associated outputs from
                this template.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setMilestoneToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
