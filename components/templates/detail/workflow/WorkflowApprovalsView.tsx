"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  GripVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  ShieldAlert,
} from "lucide-react";
import type {
  MockApprovalFlow,
  MockApprover,
  MockApprovalStepPreview,
} from "@/lib/templates/types";
import { DEFAULT_WORKFLOW_APPROVALS } from "@/lib/templates/default-approvals";

interface WorkflowApprovalsViewProps {
  templateId?: string;
  templateName?: string;
  approvals?: MockApprovalFlow[];
  searchQuery?: string;
  statusFilter?: string;
  onUpdateApprovals?: (approvals: MockApprovalFlow[]) => void;
  onAddApprovalClick?: () => void;
  saving?: boolean;
  saveSuccess?: boolean;
  saveError?: string | null;
}

export default function WorkflowApprovalsView({
  templateId,
  templateName = "Project Template",
  approvals: propApprovals,
  searchQuery = "",
  statusFilter = "All",
  onUpdateApprovals,
  onAddApprovalClick,
  saving = false,
  saveSuccess = false,
  saveError = null,
}: WorkflowApprovalsViewProps) {
  const searchParams = useSearchParams();
  const flowParam = searchParams?.get("flow") || searchParams?.get("approvalId");

  // Local approvals state initialized from props or fallback to standard 6 approvals if empty
  const [approvals, setApprovals] = useState<MockApprovalFlow[]>(() => {
    if (propApprovals && Array.isArray(propApprovals) && propApprovals.length > 0) {
      return propApprovals;
    }
    return DEFAULT_WORKFLOW_APPROVALS;
  });

  // Sync prop changes
  useEffect(() => {
    if (propApprovals && Array.isArray(propApprovals) && propApprovals.length > 0) {
      setApprovals(propApprovals);
    }
  }, [propApprovals]);

  // Selected flow for View Approval side panel and bottom Preview
  const [selectedFlowId, setSelectedFlowId] = useState<string>("apr-01");

  // View Approval Side Inspector Panel (Figma Frame 2147225086) - open by default
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Full Flow Diagram / Visualizer Modal (triggered by "View Flow" button Frame 2147225189)
  const [isViewFlowModalOpen, setIsViewFlowModalOpen] = useState(false);

  // Local card/kebab dropdown menu tracking
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Edit Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerFlow, setDrawerFlow] = useState<MockApprovalFlow | null>(null);

  // Dedicated Add Approval Flow Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Delete Confirmation Modal state
  const [flowToDelete, setFlowToDelete] = useState<MockApprovalFlow | null>(null);

  // Local active status filter override (if user clicks on KPI cards)
  const [localFilter, setLocalFilter] = useState<string>("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sync from URL parameter ?flow=...
  useEffect(() => {
    if (flowParam && approvals.length > 0) {
      const paramLower = flowParam.toLowerCase();
      const matched = approvals.find(
        (a) =>
          a.id.toLowerCase() === paramLower ||
          a.code.toLowerCase() === paramLower ||
          a.name.toLowerCase().includes(paramLower)
      );
      if (matched) {
        setSelectedFlowId(matched.id);
        setIsInspectorOpen(true);
      }
    }
  }, [flowParam, approvals]);

  // Form data for Details/Edit Drawer
  const [drawerFormData, setDrawerFormData] = useState({
    name: "",
    code: "",
    category: "Design",
    triggerTitle: "",
    triggerDescription: "",
    stagesCount: 2,
    mode: "Sequential" as "Sequential" | "Parallel",
    sla: "2 Business Days",
    status: "ACTIVE" as "ACTIVE" | "DRAFT" | "NEEDS ATTENTION",
    description: "",
  });

  // Form data for Add Modal
  const [addFormData, setAddFormData] = useState({
    name: "",
    code: "",
    category: "Design",
    triggerTitle: "Milestone Reached",
    triggerDescription: "Stage Complete",
    stagesCount: 2,
    mode: "Sequential" as "Sequential" | "Parallel",
    sla: "2 Business Days",
    status: "ACTIVE" as "ACTIVE" | "DRAFT" | "NEEDS ATTENTION",
    description: "",
    approver1: "PM",
    approver2: "CL",
  });

  // Close menus on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      setOpenActionMenuId(null);
    };
    if (openActionMenuId) {
      window.addEventListener("click", handleWindowClick);
      return () => window.removeEventListener("click", handleWindowClick);
    }
  }, [openActionMenuId]);

  // Dynamic KPI counts derived strictly from real state records
  const totalFlows = approvals.length;
  const activeFlows = approvals.filter(
    (a) => (a.status || "").toUpperCase() === "ACTIVE"
  ).length;
  const draftFlows = approvals.filter(
    (a) => (a.status || "").toUpperCase() === "DRAFT"
  ).length;
  const needsAttention = approvals.filter((a) => {
    const st = (a.status || "").toUpperCase();
    return st === "NEEDS ATTENTION" || st.includes("ATTENTION") || st.includes("ISSUE");
  }).length;

  // Filtered approvals based on search query, toolbar statusFilter, and KPI card click localFilter
  const effectiveFilter = statusFilter !== "All" ? statusFilter : localFilter;

  const filteredApprovals = useMemo(() => {
    return approvals.filter((flow) => {
      // Status filtering
      if (effectiveFilter && effectiveFilter !== "All") {
        const flowStatus = (flow.status || "").toUpperCase();
        if (effectiveFilter.toUpperCase() === "ACTIVE" && flowStatus !== "ACTIVE") return false;
        if (effectiveFilter.toUpperCase() === "DRAFT" && flowStatus !== "DRAFT") return false;
        if (
          (effectiveFilter.toUpperCase() === "NEEDS ATTENTION" || effectiveFilter.toUpperCase() === "CONFIG ISSUES") &&
          flowStatus !== "NEEDS ATTENTION"
        ) {
          return false;
        }
        if (effectiveFilter.toUpperCase() === "CONFIGURED" && flowStatus === "DRAFT") return false;
      }

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = flow.name?.toLowerCase().includes(q);
        const codeMatch = flow.code?.toLowerCase().includes(q);
        const trigTitleMatch = flow.triggerTitle?.toLowerCase().includes(q);
        const trigDescMatch = flow.triggerDescription?.toLowerCase().includes(q);
        const catMatch = flow.category?.toLowerCase().includes(q);
        const slaMatch = flow.sla?.toLowerCase().includes(q);
        const statusMatch = flow.status?.toLowerCase().includes(q);
        const approverMatch = Array.isArray(flow.approvers) && flow.approvers.some(
          (appr: any) =>
            (typeof appr === "string" && appr.toLowerCase().includes(q)) ||
            (typeof appr === "object" && appr !== null && (appr.label?.toLowerCase().includes(q) || appr.role?.toLowerCase().includes(q)))
        );

        if (
          !nameMatch &&
          !codeMatch &&
          !trigTitleMatch &&
          !trigDescMatch &&
          !catMatch &&
          !slaMatch &&
          !statusMatch &&
          !approverMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [approvals, effectiveFilter, searchQuery]);

  // Paginated approvals
  const totalCount = filteredApprovals.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApprovals.slice(start, start + pageSize);
  }, [filteredApprovals, currentPage, pageSize]);

  // Selected flow for View Approval Panel and Bottom Preview
  const selectedFlow = useMemo(() => {
    return approvals.find((a) => a.id === selectedFlowId) || approvals[0] || null;
  }, [approvals, selectedFlowId]);

  // Handle flow selection
  const handleSelectFlow = (flow: MockApprovalFlow) => {
    setSelectedFlowId(flow.id);
    setIsInspectorOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("flow", flow.code);
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Close Side Inspector Panel
  const handleCloseInspector = () => {
    setIsInspectorOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("flow");
      url.searchParams.delete("approvalId");
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Open Edit Drawer
  const handleOpenDrawer = (flow: MockApprovalFlow) => {
    setDrawerFlow(flow);
    setDrawerFormData({
      name: flow.name || "",
      code: flow.code || "",
      category: flow.category || "Design",
      triggerTitle: flow.triggerTitle || "",
      triggerDescription: flow.triggerDescription || "",
      stagesCount: flow.stagesCount || 1,
      mode: flow.mode || "Sequential",
      sla: flow.sla || "2 Business Days",
      status: (flow.status as any) || "ACTIVE",
      description: flow.description || "",
    });
    setIsDrawerOpen(true);
    setOpenActionMenuId(null);
  };

  // Save changes from Edit Drawer
  const handleSaveDrawer = () => {
    if (!drawerFlow) return;
    const updated = approvals.map((a) => {
      if (a.id === drawerFlow.id) {
        return {
          ...a,
          name: drawerFormData.name.trim() || a.name,
          code: drawerFormData.code.trim() || a.code,
          category: drawerFormData.category,
          triggerTitle: drawerFormData.triggerTitle.trim() || a.triggerTitle,
          triggerDescription: drawerFormData.triggerDescription.trim() || a.triggerDescription,
          stagesCount: Number(drawerFormData.stagesCount) || 1,
          mode: drawerFormData.mode,
          sla: drawerFormData.sla.trim() || a.sla,
          status: drawerFormData.status,
          description: drawerFormData.description.trim() || a.description,
          lastUpdated: "Just now",
          lastUpdatedBy: "Admin User",
          // Sync preview steps if trigger changed
          previewSteps: a.previewSteps ? [
            {
              ...a.previewSteps[0],
              header: "TRIGGER",
              title: drawerFormData.triggerTitle.trim() || a.triggerTitle,
              subtitle: drawerFormData.triggerDescription.trim() || a.triggerDescription,
            },
            ...a.previewSteps.slice(1),
          ] : a.previewSteps,
        };
      }
      return a;
    });

    setApprovals(updated);
    onUpdateApprovals?.(updated);
    setIsDrawerOpen(false);
  };

  // Toggle flow status (Active <-> Draft)
  const handleToggleStatus = (flow: MockApprovalFlow) => {
    const nextStatus = flow.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    const updated = approvals.map((a) =>
      a.id === flow.id
        ? {
            ...a,
            status: nextStatus as any,
            lastUpdated: "Just now",
            lastUpdatedBy: "Admin User",
          }
        : a
    );
    setApprovals(updated);
    onUpdateApprovals?.(updated);
    setOpenActionMenuId(null);
  };

  // Duplicate Flow
  const handleDuplicateFlow = (flow: MockApprovalFlow) => {
    const newCode = `APR-TPL-00${approvals.length + 1}`;
    const newFlow: MockApprovalFlow = {
      ...flow,
      id: `apr-${Date.now()}`,
      code: newCode,
      name: `${flow.name} (Copy)`,
      status: "DRAFT",
      createdAt: "Today",
      createdBy: "Admin User",
      lastUpdated: "Just now",
      lastUpdatedBy: "Admin User",
    };
    const updated = [...approvals, newFlow];
    setApprovals(updated);
    onUpdateApprovals?.(updated);
    setSelectedFlowId(newFlow.id);
    setOpenActionMenuId(null);
  };

  // Delete Flow
  const confirmDeleteFlow = () => {
    if (!flowToDelete) return;
    const updated = approvals.filter((a) => a.id !== flowToDelete.id);
    setApprovals(updated);
    onUpdateApprovals?.(updated);
    if (selectedFlowId === flowToDelete.id && updated.length > 0) {
      setSelectedFlowId(updated[0].id);
    }
    setFlowToDelete(null);
  };

  // Open dedicated Add Modal
  const handleOpenAddModal = () => {
    const nextNum = approvals.length + 1;
    setAddFormData({
      name: "",
      code: `APR-TPL-00${nextNum}`,
      category: "Design",
      triggerTitle: "Milestone Reached",
      triggerDescription: "Stage Complete",
      stagesCount: 2,
      mode: "Sequential",
      sla: "2 Business Days",
      status: "ACTIVE",
      description: "",
      approver1: "PM",
      approver2: "CL",
    });
    setIsAddModalOpen(true);
  };

  // Create new Approval Flow from Add Modal
  const handleCreateApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name.trim()) return;

    const approversList: MockApprover[] = [];
    if (addFormData.approver1 === "PM") {
      approversList.push({ label: "PM", role: "Project Manager", color: "red" });
    } else if (addFormData.approver1 === "LD") {
      approversList.push({ label: "LD", role: "Lead Designer", color: "green" });
    } else if (addFormData.approver1 === "CL") {
      approversList.push({ label: "CL", role: "Client", color: "blue" });
    }

    if (addFormData.approver2 && addFormData.approver2 !== addFormData.approver1) {
      if (addFormData.approver2 === "PM") {
        approversList.push({ label: "PM", role: "Project Manager", color: "red" });
      } else if (addFormData.approver2 === "LD") {
        approversList.push({ label: "LD", role: "Lead Designer", color: "green" });
      } else if (addFormData.approver2 === "CL") {
        approversList.push({ label: "CL", role: "Client", color: "blue" });
      }
    }

    const newFlow: MockApprovalFlow = {
      id: `apr-${Date.now()}`,
      code: addFormData.code.trim() || `APR-TPL-00${approvals.length + 1}`,
      name: addFormData.name.trim(),
      category: addFormData.category,
      version: "v2.1",
      description: addFormData.description.trim() || "Approval flow configured for this template.",
      triggerTitle: addFormData.triggerTitle.trim() || "Milestone Reached",
      triggerDescription: addFormData.triggerDescription.trim() || "Stage Complete",
      stagesCount: Number(addFormData.stagesCount) || 1,
      mode: addFormData.mode,
      sla: addFormData.sla.trim() || "2 Business Days",
      status: addFormData.status,
      createdBy: "Admin User",
      createdAt: "Today",
      lastUpdated: "Today",
      lastUpdatedBy: "Admin User",
      approvers: approversList.length > 0 ? approversList : [
        { label: "PM", role: "Project Manager", color: "red" },
        { label: "CL", role: "Client", color: "blue" },
      ],
      previewSteps: [
        {
          header: "TRIGGER",
          title: addFormData.triggerTitle.trim() || "Milestone Reached",
          subtitle: addFormData.triggerDescription.trim() || "Condition Met",
        },
        {
          header: "01",
          title: approversList[0]?.role || "Project Manager",
          subtitle: "Required Sign-off",
        },
        {
          header: "02",
          title: approversList[1]?.role || "Client",
          subtitle: "Required Sign-off",
        },
        {
          header: "Approved",
          title: "on Approval",
          subtitle: "Proceed to Next Stage",
        },
      ],
    };

    const updated = [newFlow, ...approvals];
    setApprovals(updated);
    onUpdateApprovals?.(updated);
    setSelectedFlowId(newFlow.id);
    setIsInspectorOpen(true);
    setIsAddModalOpen(false);
  };

  // Render approver avatar bubble according to Figma Ellipse 22 (32px colored circle with 10px text)
  const renderApproverBubble = (approver: any, key: string | number) => {
    let label = "AP";
    let role = "Approver";
    let colorClass = "blue";

    if (typeof approver === "string") {
      label = approver.slice(0, 2).toUpperCase();
      role = approver;
      if (label === "PM") colorClass = "red";
      else if (label === "LD") colorClass = "green";
      else if (label === "CL") colorClass = "blue";
    } else if (typeof approver === "object" && approver !== null) {
      label = approver.label || approver.name?.slice(0, 2).toUpperCase() || "AP";
      role = approver.role || "Approver";
      colorClass = approver.color || (label === "PM" ? "red" : label === "LD" ? "green" : "blue");
    }

    return (
      <div
        key={key}
        className={`td-approver-avatar-bubble ${colorClass}`}
        title={`${label} (${role})`}
      >
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="td-wf-approvals-container">
      {/* ── Status / Save Feedback Alerts ───────────────────────────── */}
      {saveSuccess && (
        <div className="td-inspector-alert success" style={{ marginBottom: 4 }}>
          <Check size={14} />
          <span>Approval flows updated and saved to template workflow.</span>
        </div>
      )}
      {saveError && (
        <div className="td-inspector-alert error" style={{ marginBottom: 4 }}>
          <AlertCircle size={14} />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── 4 KPI Summary Cards (Figma Frame 2147225138) ─────────────── */}
      <div className="td-wf-approvals-kpi-grid">
        {/* Card 1: Total Approval Flows */}
        <button
          type="button"
          className={`td-wf-approvals-kpi-card ${localFilter === "All" && statusFilter === "All" ? "selected" : ""}`}
          onClick={() => setLocalFilter("All")}
        >
          <span className="kpi-label">Approval Flows</span>
          <span className="kpi-val">{String(totalFlows).padStart(2, "0")}</span>
          <span className="kpi-sub">All Configured</span>
        </button>

        {/* Card 2: Active Flows */}
        <button
          type="button"
          className={`td-wf-approvals-kpi-card ${localFilter === "Active" || statusFilter === "Active" ? "selected" : ""}`}
          onClick={() => setLocalFilter(localFilter === "Active" ? "All" : "Active")}
        >
          <span className="kpi-label">Active</span>
          <span className="kpi-val">{String(activeFlows).padStart(2, "0")}</span>
          <span className="kpi-sub">Ready to Use</span>
        </button>

        {/* Card 3: Draft Flows */}
        <button
          type="button"
          className={`td-wf-approvals-kpi-card ${localFilter === "Draft" || statusFilter === "Draft" ? "selected" : ""}`}
          onClick={() => setLocalFilter(localFilter === "Draft" ? "All" : "Draft")}
        >
          <span className="kpi-label">Draft</span>
          <span className="kpi-val">{String(draftFlows).padStart(2, "0")}</span>
          <span className="kpi-sub">In-Progress</span>
        </button>

        {/* Card 4: Needs Attention */}
        <button
          type="button"
          className={`td-wf-approvals-kpi-card ${localFilter === "Needs Attention" || statusFilter === "Needs Attention" ? "selected" : ""}`}
          onClick={() => setLocalFilter(localFilter === "Needs Attention" ? "All" : "Needs Attention")}
        >
          <span className="kpi-label">Needs Attention</span>
          <span className="kpi-val">{String(needsAttention).padStart(2, "0")}</span>
          <span className="kpi-sub">Config Issues</span>
        </button>
      </div>

      {/* ── Main Middle Row: Approvals Table (+ Side View Approval Inspector) (Figma Frame 2147225224) ── */}
      <div className={`td-wf-approvals-split-row ${isInspectorOpen ? "with-inspector" : ""}`}>
        {/* Left Table Card (Figma Frame 2147225085 & 2147225072) */}
        <div className="td-wf-approvals-table-card">
          <div className="td-wf-table-responsive">
            <table className="td-wf-approvals-datatable">
              <thead>
                <tr>
                  {/* Column 1: Drag handle (32px) */}
                  <th style={{ width: "32px", minWidth: "32px" }} className="center"></th>
                  {/* Column 2: # (32px) */}
                  <th style={{ width: "32px", minWidth: "32px" }} className="center">#</th>
                  {/* Column 3: FLOW NAME (221px) */}
                  <th style={{ width: "221px", minWidth: "160px" }}>FLOW NAME</th>
                  {/* Column 4: TRIGGER (220px) */}
                  <th style={{ width: "220px", minWidth: "160px" }}>TRIGGER</th>
                  {/* Column 5: STAGES (135px) */}
                  <th style={{ width: "135px", minWidth: "90px" }} className="center">STAGES</th>
                  {/* Column 6: APPROVERS (215px) */}
                  <th style={{ width: "215px", minWidth: "150px" }} className="center">APPROVERS</th>
                  {/* Column 7: SLA (138px) */}
                  <th style={{ width: "138px", minWidth: "100px" }} className="center">SLA</th>
                  {/* Column 8: STATUS (101px) */}
                  <th style={{ width: "101px", minWidth: "85px" }}>STATUS</th>
                  {/* Column 9: LAST UPDATED (139px) */}
                  <th style={{ width: "139px", minWidth: "110px" }}>LAST UPDATED</th>
                  {/* Column 10: ACTIONS (64px) */}
                  <th style={{ width: "64px", minWidth: "50px" }} className="center"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="td-table-empty-row" style={{ padding: "40px 16px" }}>
                      <div className="empty-state-content">
                        <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 10px 0" }}>
                          No approval flows found matching &ldquo;{searchQuery || effectiveFilter}&rdquo;.
                        </p>
                        <button
                          type="button"
                          className="td-wf-btn-reset-filter"
                          onClick={() => {
                            setLocalFilter("All");
                          }}
                        >
                          Reset Filter
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedApprovals.map((flow, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedFlow?.id === flow.id;
                    const isActionOpen = openActionMenuId === flow.id;
                    const statusUpper = (flow.status || "DRAFT").toUpperCase();

                    return (
                      <tr
                        key={flow.id}
                        className={`td-wf-approval-row ${isSelected ? "selected-row" : ""}`}
                        onClick={() => handleSelectFlow(flow)}
                      >
                        {/* Column 1: Drag indicator */}
                        <td className="center drag-cell">
                          <GripVertical size={16} className="grip-icon" />
                        </td>

                        {/* Column 2: Sequence Number # */}
                        <td className="center num-cell">
                          <span className="row-num-text">{rowNumber}</span>
                        </td>

                        {/* Column 3: Flow Name & Code */}
                        <td>
                          <div className="td-flow-name-cell">
                            <span className="primary-title">{flow.name}</span>
                            <span className="sub-code">{flow.code}</span>
                          </div>
                        </td>

                        {/* Column 4: Trigger & Event Condition */}
                        <td>
                          <div className="td-flow-trigger-cell">
                            <span className="primary-trigger">
                              {flow.triggerTitle || (typeof (flow as any).trigger === "string" ? (flow as any).trigger : "Milestone Reached")}
                            </span>
                            <span className="sub-trigger">
                              {flow.triggerDescription || "Standard condition"}
                            </span>
                          </div>
                        </td>

                        {/* Column 5: Stages Count & Mode */}
                        <td className="center">
                          <div className="td-flow-stages-cell">
                            <span className="stages-count">
                              {flow.stagesCount ?? (Array.isArray((flow as any).stages) ? (flow as any).stages.length : 1)}
                            </span>
                            <span className="stages-mode">{flow.mode || "Sequential"}</span>
                          </div>
                        </td>

                        {/* Column 6: Approvers Avatar Stack (Frame 2147225221 / Ellipse 22) */}
                        <td className="center">
                          <div className="td-approvers-stack-figma">
                            {(Array.isArray(flow.approvers) && flow.approvers.length > 0
                              ? flow.approvers
                              : [{ label: "PM", role: "Project Manager", color: "red" }]
                            ).map((appr, aIdx) => renderApproverBubble(appr, aIdx))}

                            <button
                              type="button"
                              className="td-approver-add-circle"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDrawer(flow);
                              }}
                              title="Add or manage approvers"
                              aria-label="Add approver"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Column 7: SLA */}
                        <td className="center">
                          <div className="td-sla-cell">
                            <span className="sla-main">{flow.sla?.split(" ")[0]} {flow.sla?.split(" ")[1] || "Business"}</span>
                            <span className="sla-sub">{flow.sla?.split(" ").slice(2).join(" ") || "Days"}</span>
                          </div>
                        </td>

                        {/* Column 8: Status Pill */}
                        <td>
                          <span
                            className={`td-figma-status-pill ${
                              statusUpper === "ACTIVE"
                                ? "status-active"
                                : statusUpper === "NEEDS ATTENTION"
                                ? "status-attention"
                                : "status-draft"
                            }`}
                          >
                            {statusUpper}
                          </span>
                        </td>

                        {/* Column 9: Last Updated & Actor */}
                        <td>
                          <div className="td-updated-cell">
                            <span className="date-txt">{flow.lastUpdated || "Recently"}</span>
                            <span className="by-txt">by {flow.lastUpdatedBy || "Admin User"}</span>
                          </div>
                        </td>

                        {/* Column 10: Actions Kebab */}
                        <td className="center" onClick={(e) => e.stopPropagation()}>
                          <div className="td-relative-inline">
                            <button
                              type="button"
                              className="td-kebab-btn"
                              onClick={() =>
                                setOpenActionMenuId(isActionOpen ? null : flow.id)
                              }
                              title="Approval flow actions"
                              aria-label="Actions"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {isActionOpen && (
                              <div className="td-wf-action-menu">
                                <button
                                  type="button"
                                  className="item"
                                  onClick={() => {
                                    handleSelectFlow(flow);
                                    setOpenActionMenuId(null);
                                  }}
                                >
                                  <ExternalLink size={13} />
                                  <span>View Approval</span>
                                </button>
                                <button
                                  type="button"
                                  className="item"
                                  onClick={() => {
                                    setSelectedFlowId(flow.id);
                                    setIsViewFlowModalOpen(true);
                                    setOpenActionMenuId(null);
                                  }}
                                >
                                  <Layers size={13} />
                                  <span>View Flow Diagram</span>
                                </button>
                                <button
                                  type="button"
                                  className="item"
                                  onClick={() => handleOpenDrawer(flow)}
                                >
                                  <Edit2 size={13} />
                                  <span>Edit Flow</span>
                                </button>
                                <button
                                  type="button"
                                  className="item"
                                  onClick={() => handleDuplicateFlow(flow)}
                                >
                                  <Copy size={13} />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  type="button"
                                  className="item"
                                  onClick={() => handleToggleStatus(flow)}
                                >
                                  <Sparkles size={13} />
                                  <span>
                                    {flow.status === "ACTIVE" ? "Set to Draft" : "Activate Flow"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className="item danger"
                                  onClick={() => {
                                    setFlowToDelete(flow);
                                    setOpenActionMenuId(null);
                                  }}
                                >
                                  <Trash2 size={13} />
                                  <span>Delete Flow</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Pagination Bar (Frame 2147225165) ──────────────────── */}
          <div className="target-table-pagination-row">
            <div className="target-table-total-count">
              Total Approvals: {filteredApprovals.length}
            </div>

            <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
              <button
                type="button"
                className="target-table-page-btn arrow"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, Math.max(1, totalPages)) }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`target-table-page-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                type="button"
                className="target-table-page-btn arrow"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="target-table-page-size-wrap">
              <span className="target-table-page-size-label">Show per Page:</span>
              <div className="target-table-page-size-select-wrap">
                <select
                  className="target-table-page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <ChevronDown size={14} className="target-table-select-arrow" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Side: View Approval Inspector Panel (Figma Frame 2147225086) ── */}
        {isInspectorOpen && selectedFlow && (
          <aside
            className="td-wf-view-approval-panel"
            role="region"
            aria-label="View Approval Details"
          >
            {/* Header: Title + Subtitle/Meta + Close Button (Frame 2147225209) */}
            <div className="view-apr-header">
              <div className="view-apr-title-meta">
                <h4 className="view-apr-title">
                  {selectedFlow.name.toUpperCase()}
                </h4>
                <span className="view-apr-meta">
                  {selectedFlow.code} • {selectedFlow.category || "Design"} • {selectedFlow.version || "v2.1"}
                </span>
              </div>
              <button
                type="button"
                className="view-apr-close-btn"
                onClick={handleCloseInspector}
                aria-label="Close view approval panel"
                title="Close panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <p className="view-apr-desc">
              {selectedFlow.description || "Approval required before design process from concept to development to execution planning."}
            </p>

            {/* Divider 1 (Rectangle 75) */}
            <div className="view-apr-divider" />

            {/* Row 1: Status (Frame 2147225225) */}
            <div className="view-apr-field-row">
              <span className="field-lbl">Status</span>
              <span
                className={`td-figma-status-pill ${
                  (selectedFlow.status || "").toUpperCase() === "ACTIVE"
                    ? "status-active"
                    : (selectedFlow.status || "").toUpperCase() === "NEEDS ATTENTION"
                    ? "status-attention"
                    : "status-draft"
                }`}
              >
                {selectedFlow.status || "ACTIVE"}
              </span>
            </div>

            {/* Row 2: Trigger (Frame 2147225213) */}
            <div className="view-apr-field-row">
              <span className="field-lbl">Trigger</span>
              <div className="field-val-col">
                <span className="val-main">{selectedFlow.triggerTitle || "Milestone Reached"}</span>
                <span className="val-sub">{selectedFlow.triggerDescription || "Design Concept Complete"}</span>
              </div>
            </div>

            {/* Row 3: Approval Mode (Frame 2147225220) */}
            <div className="view-apr-field-row">
              <span className="field-lbl">Approval Mode</span>
              <span className="val-main">{selectedFlow.mode || "Sequential"}</span>
            </div>

            {/* Row 4: Stages (Frame 2147225221) */}
            <div className="view-apr-field-row">
              <span className="field-lbl">Stages</span>
              <span className="val-main">{selectedFlow.stagesCount ?? 2}</span>
            </div>

            {/* Row 5: SLA (Frame 2147225222) */}
            <div className="view-apr-field-row">
              <span className="field-lbl">SLA</span>
              <span className="val-main">{selectedFlow.sla || "2 Business Days"}</span>
            </div>

            {/* Divider 2 (Rectangle 76) */}
            <div className="view-apr-divider" />

            {/* Row 6: Created By (Frame 2147225223) */}
            <div className="view-apr-field-row">
              <span className="field-lbl">Created By</span>
              <div className="field-val-col">
                <span className="val-main">{selectedFlow.createdBy || "Admin User"}</span>
                <span className="val-sub">{selectedFlow.createdAt || "04 Aug 2026"}</span>
              </div>
            </div>

            {/* Row 7: Last Updated (Frame 2147225224) */}
            <div className="view-apr-field-row">
              <span className="field-lbl">Last Updated</span>
              <div className="field-val-col">
                <span className="val-main">by {selectedFlow.lastUpdatedBy || "Admin User"}</span>
                <span className="val-sub">{selectedFlow.lastUpdated || "12 Aug 2026"}</span>
              </div>
            </div>

            {/* Divider 3 (Rectangle 77) */}
            <div className="view-apr-divider" />

            {/* Bottom Action: View Flow Button (Frame 2147225189) */}
            <button
              type="button"
              className="view-apr-btn-view-flow"
              onClick={() => setIsViewFlowModalOpen(true)}
              title="Open full interactive workflow diagram"
            >
              <span>View Flow</span>
            </button>
          </aside>
        )}
      </div>

      {/* ── Bottom Section: Approval Flow Preview (Figma Frame 2147225199) ── */}
      {selectedFlow && (
        <div className="td-approval-preview-section-figma">
          <div className="preview-heading-row">
            <h4 className="preview-heading">Approval Flow Preview</h4>
            <span className="preview-sub-badge">
              Viewing: <strong>{selectedFlow.name}</strong> ({selectedFlow.code})
            </span>
          </div>

          <div className="preview-steps-grid-figma">
            {/* Step 1: TRIGGER */}
            <div className="preview-step-card-figma">
              <span className="step-tag-header">TRIGGER</span>
              <h5 className="step-title-figma">
                {selectedFlow.triggerTitle || "Milestone Reached"}
              </h5>
              <p className="step-subtitle-figma">
                {selectedFlow.triggerDescription || "Design Concept Completed"}
              </p>
            </div>

            {/* Step 2: 01 Approver */}
            <div className="preview-step-card-figma">
              <span className="step-tag-header">01</span>
              <h5 className="step-title-figma">
                {selectedFlow.approvers?.[0]?.role || "Project Manager"}
              </h5>
              <p className="step-subtitle-figma">
                {selectedFlow.previewSteps?.[1]?.subtitle || "All Required"}
              </p>
            </div>

            {/* Step 3: 02 Approver */}
            <div className="preview-step-card-figma">
              <span className="step-tag-header">02</span>
              <h5 className="step-title-figma">
                {selectedFlow.approvers?.[1]?.role || "Client"}
              </h5>
              <p className="step-subtitle-figma">
                {selectedFlow.previewSteps?.[2]?.subtitle || "Required"}
              </p>
            </div>

            {/* Step 4: Approved Outcome */}
            <div className="preview-step-card-figma">
              <span className="step-tag-header">Approved</span>
              <h5 className="step-title-figma">on Approval</h5>
              <p className="step-subtitle-figma">
                {selectedFlow.previewSteps?.[3]?.subtitle || "Update Milestone, Notify Parties"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── View Flow Interactive Diagram Modal (Triggered by View Flow button) ── */}
      {isViewFlowModalOpen && selectedFlow && (
        <div
          className="td-milestone-modal-overlay"
          onClick={() => setIsViewFlowModalOpen(false)}
        >
          <div
            className="td-milestone-modal-box view-flow-diagram-modal"
            style={{ maxWidth: 860 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Workflow Diagram: ${selectedFlow.name}`}
          >
            {/* Modal Header */}
            <div className="modal-header view-flow-modal-header">
              <div className="flow-meta-block">
                <button
                  type="button"
                  className="btn-back-link"
                  onClick={() => setIsViewFlowModalOpen(false)}
                >
                  <ArrowLeft size={14} />
                  <span>Approvals</span>
                </button>
                <div className="flow-title-row">
                  <h3 className="modal-title">{selectedFlow.name}</h3>
                  <span className="flow-code-badge">{selectedFlow.code}</span>
                  <span className="flow-version-badge">{selectedFlow.version || "v2.1"}</span>
                  <span
                    className={`td-figma-status-pill ${
                      selectedFlow.status === "ACTIVE" ? "status-active" : "status-draft"
                    }`}
                  >
                    {selectedFlow.status}
                  </span>
                </div>
              </div>

              <div className="modal-header-actions">
                <button
                  type="button"
                  className="btn-action-ghost"
                  onClick={() => {
                    handleOpenDrawer(selectedFlow);
                    setIsViewFlowModalOpen(false);
                  }}
                  title="Edit Approval Flow"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsViewFlowModalOpen(false)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body view-flow-modal-body">
              {/* Top Overview Cards Row */}
              <div className="view-flow-stats-row">
                <div className="stat-card">
                  <span className="lbl">TRIGGER EVENT</span>
                  <span className="val">{selectedFlow.triggerTitle}</span>
                  <span className="sub">{selectedFlow.triggerDescription}</span>
                </div>
                <div className="stat-card">
                  <span className="lbl">APPROVAL MODE</span>
                  <span className="val">{selectedFlow.mode}</span>
                  <span className="sub">{selectedFlow.stagesCount} Sequential Stages</span>
                </div>
                <div className="stat-card">
                  <span className="lbl">EXPECTED SLA</span>
                  <span className="val">{selectedFlow.sla}</span>
                  <span className="sub">Business hours policy</span>
                </div>
                <div className="stat-card">
                  <span className="lbl">ASSIGNED ROLES</span>
                  <div className="approver-avatars-row">
                    {(selectedFlow.approvers || []).map((appr, idx) =>
                      renderApproverBubble(appr, idx)
                    )}
                  </div>
                  <span className="sub">Authorized Sign-offs</span>
                </div>
              </div>

              {/* Description */}
              <div className="view-flow-description-box">
                <h5 className="desc-heading">Flow Purpose & Scope</h5>
                <p className="desc-text">{selectedFlow.description}</p>
              </div>

              {/* Stepper Timeline Diagram */}
              <div className="view-flow-diagram-container">
                <h5 className="diagram-heading">Connected Stage Progression</h5>

                <div className="flow-stepper-track">
                  {/* Step 0: Trigger */}
                  <div className="flow-stepper-node trigger-node">
                    <div className="node-badge">TRIGGER</div>
                    <div className="node-card">
                      <div className="node-icon-wrap">
                        <Clock size={16} />
                      </div>
                      <div className="node-info">
                        <h6 className="node-title">{selectedFlow.triggerTitle}</h6>
                        <p className="node-sub">{selectedFlow.triggerDescription}</p>
                        <span className="node-meta">System automatically initiates approval</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-step-connector" />

                  {/* Step 1: Stage 01 */}
                  <div className="flow-stepper-node stage-node">
                    <div className="node-badge">STAGE 01</div>
                    <div className="node-card">
                      <div className="node-icon-wrap avatar-wrap">
                        {renderApproverBubble(selectedFlow.approvers?.[0] || { label: "PM", color: "red" }, "s1")}
                      </div>
                      <div className="node-info">
                        <h6 className="node-title">{selectedFlow.approvers?.[0]?.role || "Project Manager"}</h6>
                        <p className="node-sub">Requirement: All Required</p>
                        <span className="node-meta">SLA: 1 Business Day · Technical Verification</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-step-connector" />

                  {/* Step 2: Stage 02 */}
                  <div className="flow-stepper-node stage-node">
                    <div className="node-badge">STAGE 02</div>
                    <div className="node-card">
                      <div className="node-icon-wrap avatar-wrap">
                        {renderApproverBubble(selectedFlow.approvers?.[1] || { label: "CL", color: "blue" }, "s2")}
                      </div>
                      <div className="node-info">
                        <h6 className="node-title">{selectedFlow.approvers?.[1]?.role || "Client"}</h6>
                        <p className="node-sub">Requirement: Final Sign-off</p>
                        <span className="node-meta">SLA: 1 Business Day · Commercial Approval</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-step-connector" />

                  {/* Step 3: Approved Outcome */}
                  <div className="flow-stepper-node approved-node">
                    <div className="node-badge success">ON APPROVAL</div>
                    <div className="node-card success-card">
                      <div className="node-icon-wrap success-icon">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="node-info">
                        <h6 className="node-title">Approved</h6>
                        <p className="node-sub">Update Milestone, Notify Parties</p>
                        <span className="node-meta">Unlocks dependent milestone tasks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit & Governance Details */}
              <div className="view-flow-audit-box">
                <span className="audit-item">
                  Created by <strong>{selectedFlow.createdBy}</strong> on {selectedFlow.createdAt}
                </span>
                <span className="audit-divider">•</span>
                <span className="audit-item">
                  Last updated by <strong>{selectedFlow.lastUpdatedBy}</strong> on {selectedFlow.lastUpdated}
                </span>
                <span className="audit-divider">•</span>
                <span className="audit-item">
                  Template: <strong>{templateName}</strong>
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer view-flow-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsViewFlowModalOpen(false)}
              >
                Close View
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={() => {
                  handleOpenDrawer(selectedFlow);
                  setIsViewFlowModalOpen(false);
                }}
              >
                Edit Flow Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-Over Details / Edit Drawer ────────────────────────── */}
      {isDrawerOpen && drawerFlow && (
        <div className="td-milestone-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <aside
            className="td-milestone-drawer"
            style={{ width: 440 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Approval Flow Details"
          >
            <div className="drawer-header">
              <div className="title-wrap">
                <span className="category-badge">{drawerFlow.category || "Design"}</span>
                <h3 className="drawer-title">{drawerFormData.name || drawerFlow.name}</h3>
                <span className="drawer-code">{drawerFlow.code} · {drawerFlow.version || "v2.1"}</span>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="drawer-body">
              <div className="form-group">
                <label className="form-label">Flow Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={drawerFormData.name}
                  onChange={(e) =>
                    setDrawerFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Design Concept Approval"
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={drawerFormData.code}
                    onChange={(e) =>
                      setDrawerFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={drawerFormData.category}
                    onChange={(e) =>
                      setDrawerFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    <option value="Design">Design</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Trigger Event</label>
                <input
                  type="text"
                  className="form-input"
                  value={drawerFormData.triggerTitle}
                  onChange={(e) =>
                    setDrawerFormData((prev) => ({ ...prev, triggerTitle: e.target.value }))
                  }
                  placeholder="e.g. Milestone Reached"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Condition / Detail</label>
                <input
                  type="text"
                  className="form-input"
                  value={drawerFormData.triggerDescription}
                  onChange={(e) =>
                    setDrawerFormData((prev) => ({
                      ...prev,
                      triggerDescription: e.target.value,
                    }))
                  }
                  placeholder="e.g. Design Concept Complete"
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Stages Count</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="form-input"
                    value={drawerFormData.stagesCount}
                    onChange={(e) =>
                      setDrawerFormData((prev) => ({
                        ...prev,
                        stagesCount: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mode</label>
                  <select
                    className="form-select"
                    value={drawerFormData.mode}
                    onChange={(e) =>
                      setDrawerFormData((prev) => ({
                        ...prev,
                        mode: e.target.value as any,
                      }))
                    }
                  >
                    <option value="Sequential">Sequential</option>
                    <option value="Parallel">Parallel</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">SLA</label>
                  <input
                    type="text"
                    className="form-input"
                    value={drawerFormData.sla}
                    onChange={(e) =>
                      setDrawerFormData((prev) => ({ ...prev, sla: e.target.value }))
                    }
                    placeholder="e.g. 2 Business Days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={drawerFormData.status}
                    onChange={(e) =>
                      setDrawerFormData((prev) => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="NEEDS ATTENTION">NEEDS ATTENTION</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={drawerFormData.description}
                  onChange={(e) =>
                    setDrawerFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe the approval purpose and policies..."
                />
              </div>
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={handleSaveDrawer}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Add Approval Flow Modal ─────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="td-milestone-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="td-milestone-modal-box"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Add Approval Flow"
          >
            <div className="modal-header">
              <h3 className="modal-title">Add Approval Flow</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateApproval}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Flow Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={addFormData.name}
                    onChange={(e) =>
                      setAddFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Site Measurement Approval"
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label">Flow Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addFormData.code}
                      onChange={(e) =>
                        setAddFormData((prev) => ({ ...prev, code: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={addFormData.category}
                      onChange={(e) =>
                        setAddFormData((prev) => ({ ...prev, category: e.target.value }))
                      }
                    >
                      <option value="Design">Design</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Procurement">Procurement</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label">Trigger</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addFormData.triggerTitle}
                      onChange={(e) =>
                        setAddFormData((prev) => ({ ...prev, triggerTitle: e.target.value }))
                      }
                      placeholder="e.g. Milestone Reached"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Condition</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addFormData.triggerDescription}
                      onChange={(e) =>
                        setAddFormData((prev) => ({
                          ...prev,
                          triggerDescription: e.target.value,
                        }))
                      }
                      placeholder="e.g. Site Measurement Complete"
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label">Stage 1 Approver</label>
                    <select
                      className="form-select"
                      value={addFormData.approver1}
                      onChange={(e) =>
                        setAddFormData((prev) => ({ ...prev, approver1: e.target.value }))
                      }
                    >
                      <option value="PM">Project Manager (PM)</option>
                      <option value="LD">Lead Designer (LD)</option>
                      <option value="CL">Client (CL)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stage 2 Approver (Optional)</label>
                    <select
                      className="form-select"
                      value={addFormData.approver2}
                      onChange={(e) =>
                        setAddFormData((prev) => ({ ...prev, approver2: e.target.value }))
                      }
                    >
                      <option value="">None (1 Stage)</option>
                      <option value="CL">Client (CL)</option>
                      <option value="PM">Project Manager (PM)</option>
                      <option value="LD">Lead Designer (LD)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label">SLA</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addFormData.sla}
                      onChange={(e) =>
                        setAddFormData((prev) => ({ ...prev, sla: e.target.value }))
                      }
                      placeholder="2 Business Days"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Status</label>
                    <select
                      className="form-select"
                      value={addFormData.status}
                      onChange={(e) =>
                        setAddFormData((prev) => ({
                          ...prev,
                          status: e.target.value as any,
                        }))
                      }
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                    </select>
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
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? "Creating..." : "Add Flow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────── */}
      {flowToDelete && (
        <div className="td-milestone-modal-overlay" onClick={() => setFlowToDelete(null)}>
          <div
            className="td-milestone-modal-box"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Confirm Delete Approval Flow"
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h3 className="modal-title" style={{ color: "#DC2626" }}>
                  Delete Approval Flow
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setFlowToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: "#334155", fontSize: 14, margin: "0 0 12px 0" }}>
                Are you sure you want to delete <strong>{flowToDelete.name}</strong> ({flowToDelete.code})?
              </p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                Projects created from this template will no longer inherit this approval workflow checkpoint.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setFlowToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDeleteFlow}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete Flow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
