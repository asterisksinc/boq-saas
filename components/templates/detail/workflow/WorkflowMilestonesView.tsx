"use client";

import React, { useState, useMemo } from "react";
import {
  ClipboardList,
  Compass,
  Clock,
  Calendar,
  MoreHorizontal,
  X,
  Check,
  ChevronRight,
  Copy,
  Edit2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { MockMilestone, mockMilestones } from "@/lib/templates/mock-data";

interface WorkflowMilestonesViewProps {
  milestones?: MockMilestone[];
  searchQuery?: string;
  onUpdateMilestones?: (milestones: MockMilestone[]) => void;
  onAddMilestoneClick?: () => void;
}

export default function WorkflowMilestonesView({
  milestones: propMilestones,
  searchQuery = "",
  onUpdateMilestones,
  onAddMilestoneClick,
}: WorkflowMilestonesViewProps) {
  const [milestones, setMilestones] = useState<MockMilestone[]>(
    propMilestones && Array.isArray(propMilestones) && propMilestones.length > 0
      ? propMilestones
      : mockMilestones
  );

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("ms-3");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editStartRule, setEditStartRule] = useState("");
  const [editCompletionRule, setEditCompletionRule] = useState("");

  // Sync prop changes
  React.useEffect(() => {
    if (propMilestones && propMilestones.length > 0) {
      setMilestones(propMilestones);
    }
  }, [propMilestones]);

  // Filter based on search query
  const filteredMilestones = useMemo(() => {
    if (!searchQuery.trim()) return milestones;
    const q = searchQuery.toLowerCase();
    return milestones.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.ownerRole.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q)
    );
  }, [milestones, searchQuery]);

  const selectedMilestone =
    milestones.find((m) => m.id === selectedMilestoneId) || milestones[0] || mockMilestones[2];

  const handleSelectMilestone = (m: MockMilestone) => {
    setSelectedMilestoneId(m.id);
    setIsInspectorOpen(true);
  };

  const handleOpenEdit = (m: MockMilestone) => {
    setEditName(m.name);
    setEditCode(m.code);
    setEditOwner(m.ownerRole);
    setEditDuration(m.duration);
    setEditStartRule(m.startRule || "");
    setEditCompletionRule(m.completionRule || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedMilestone) return;
    const updated = milestones.map((m) => {
      if (m.id === selectedMilestone.id) {
        return {
          ...m,
          name: editName,
          code: editCode,
          ownerRole: editOwner,
          duration: editDuration,
          startRule: editStartRule,
          completionRule: editCompletionRule,
        };
      }
      return m;
    });
    setMilestones(updated);
    onUpdateMilestones?.(updated);
    setIsEditModalOpen(false);
  };

  const handleDuplicateMilestone = (m: MockMilestone) => {
    const newMilestone: MockMilestone = {
      ...m,
      id: `ms-${Date.now()}`,
      orderNumber: String(milestones.length + 1).padStart(2, "0"),
      name: `${m.name} (Copy)`,
      code: `MS-00${milestones.length + 1}`,
    };
    const updated = [...milestones, newMilestone];
    setMilestones(updated);
    onUpdateMilestones?.(updated);
    setSelectedMilestoneId(newMilestone.id);
    setOpenCardMenuId(null);
  };

  const handleDeleteMilestone = (id: string) => {
    const updated = milestones.filter((m) => m.id !== id);
    setMilestones(updated);
    onUpdateMilestones?.(updated);
    if (selectedMilestoneId === id && updated.length > 0) {
      setSelectedMilestoneId(updated[0].id);
    }
    setOpenCardMenuId(null);
  };

  return (
    <div className="td-wf-milestones-container">
      {/* ── 4 KPI Summary Cards (Reference 3) ─────────────────────── */}
      <div className="td-wf-kpi-grid">
        <div className="td-wf-kpi-card">
          <span className="label">Milestones</span>
          <span className="val">08</span>
          <span className="sub">All Configured</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Linked Tasks</span>
          <span className="val">64</span>
          <span className="sub">Across Milestones</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Deliverables</span>
          <span className="val">11</span>
          <span className="sub">Requires Output</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Approval Gates</span>
          <span className="val">04</span>
          <span className="sub">At Milestones</span>
        </div>
      </div>

      {/* ── Main Layout: Grid + Inspector Panel ───────────────────── */}
      <div className={`td-wf-milestones-split ${isInspectorOpen ? "with-inspector" : ""}`}>
        {/* Left/Center Area: 3-Column Milestone Cards Grid */}
        <div className="td-wf-milestones-grid">
          {filteredMilestones.map((m) => {
            const isSelected = selectedMilestone?.id === m.id;
            const isMenuOpen = openCardMenuId === m.id;

            return (
              <div
                key={m.id}
                className={`td-milestone-card ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectMilestone(m)}
              >
                {/* Card Header */}
                <div className="card-top">
                  <div className="left-head">
                    <span className="order-pill">{m.orderNumber}</span>
                    <h4 className="title">{m.name}</h4>
                  </div>

                  <div className="menu-wrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="kebab-btn"
                      onClick={() => setOpenCardMenuId(isMenuOpen ? null : m.id)}
                      title="Milestone options"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {isMenuOpen && (
                      <div className="card-dropdown-menu">
                        <button
                          type="button"
                          className="item"
                          onClick={() => {
                            handleOpenEdit(m);
                            setOpenCardMenuId(null);
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="item"
                          onClick={() => handleDuplicateMilestone(m)}
                        >
                          <Copy size={12} />
                          <span>Duplicate</span>
                        </button>
                        <button
                          type="button"
                          className="item danger"
                          onClick={() => handleDeleteMilestone(m.id)}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtitle / Description */}
                <p className="card-desc">{m.subtitle}</p>

                {/* Metrics List */}
                <div className="metrics-list">
                  <div className="metric-row">
                    <ClipboardList size={13} className="m-icon" />
                    <span className="m-text">{m.tasksCount} Tasks</span>
                  </div>

                  <div className="metric-row">
                    <Compass size={13} className="m-icon" />
                    <span className="m-text">{m.deliverablesCount} Deliverables</span>
                  </div>

                  <div className="metric-row">
                    <Clock size={13} className="m-icon" />
                    <span className="m-text">{m.approvalType}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  <div className="duration-tag">
                    <Calendar size={13} className="cal-icon" />
                    <span className="dur-text">{m.duration}</span>
                  </div>

                  <span className="td-status-pill status-pill-active">
                    {m.status || "CONFIGURED"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Area: Milestone Details Inspector (Reference 3) ───── */}
        {isInspectorOpen && selectedMilestone && (
          <aside className="td-milestone-inspector">
            {/* Inspector Header */}
            <div className="insp-header">
              <span className="title">MILESTONE DETAILS</span>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsInspectorOpen(false)}
                aria-label="Close Inspector"
              >
                <X size={15} />
              </button>
            </div>

            {/* Selected Milestone Banner */}
            <div className="insp-banner">
              <div className="left">
                <span className="badge-pill">{selectedMilestone.orderNumber}</span>
                <span className="name">{selectedMilestone.name}</span>
              </div>
              <span className="td-status-pill status-pill-active">
                {selectedMilestone.status || "CONFIGURED"}
              </span>
            </div>

            {/* Key-Value Details */}
            <div className="insp-fields-grid">
              <div className="field-item">
                <span className="field-lbl">Milestone Code</span>
                <span className="field-val">{selectedMilestone.code}</span>
              </div>

              <div className="field-item">
                <span className="field-lbl">Description</span>
                <span className="field-val">{selectedMilestone.description || "—"}</span>
              </div>

              <div className="field-item">
                <span className="field-lbl">Category</span>
                <span className="field-val">{selectedMilestone.category}</span>
              </div>

              <div className="field-item">
                <span className="field-lbl">Owner (Role)</span>
                <div className="owner-val">
                  <div className="owner-avatar">LD</div>
                  <span>{selectedMilestone.ownerRole}</span>
                </div>
              </div>

              <div className="field-item full">
                <span className="field-lbl">Duration</span>
                <span className="field-val">{selectedMilestone.duration}</span>
              </div>

              <div className="field-item full">
                <span className="field-lbl">Start Rule</span>
                <span className="field-val highlight">
                  {selectedMilestone.startRule || "After Site Measurement"}
                </span>
              </div>

              <div className="field-item full">
                <span className="field-lbl">Completion Rule</span>
                <span className="field-val highlight">
                  {selectedMilestone.completionRule || "All Required Tasks Complete"}
                </span>
              </div>
            </div>

            {/* Linked Items List */}
            <div className="insp-section">
              <span className="section-title">LINKED ITEMS</span>
              <div className="linked-list">
                <div className="linked-row">
                  <span className="item-name">Tasks</span>
                  <div className="right">
                    <span className="count">{selectedMilestone.linkedTasks || 8}</span>
                    <button type="button" className="view-link">View</button>
                  </div>
                </div>

                <div className="linked-row">
                  <span className="item-name">Deliverables</span>
                  <div className="right">
                    <span className="count">{selectedMilestone.linkedDeliverables || 3}</span>
                    <button type="button" className="view-link">View</button>
                  </div>
                </div>

                <div className="linked-row">
                  <span className="item-name">Approvals</span>
                  <div className="right">
                    <span className="count">{selectedMilestone.linkedApprovals || "NA"}</span>
                    <button type="button" className="view-link">View</button>
                  </div>
                </div>

                <div className="linked-row">
                  <span className="item-name">Dependencies</span>
                  <div className="right">
                    <span className="count">{selectedMilestone.linkedDependencies || 1}</span>
                    <button type="button" className="view-link">View</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Milestone */}
            <div className="insp-section">
              <span className="section-title">NEXT MILESTONE</span>
              <div className="next-milestone-box">
                <span className="next-title">
                  {selectedMilestone.nextMilestoneTitle || "3D Design Approval (MS-004)"}
                </span>
                <span className="next-sub">
                  Starts after this milestone is completed.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="insp-footer">
              <button
                type="button"
                className="btn-duplicate"
                onClick={() => handleDuplicateMilestone(selectedMilestone)}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="btn-edit"
                onClick={() => handleOpenEdit(selectedMilestone)}
              >
                Edit Milestone
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Edit Milestone Modal ──────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="td-modal-overlay">
          <div className="td-modal-content-milestone">
            <div className="modal-head">
              <h3>Edit Milestone: {selectedMilestone?.name}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Milestone Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="td-form-input"
                />
              </div>

              <div className="form-group">
                <label>Milestone Code</label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="td-form-input"
                />
              </div>

              <div className="form-group">
                <label>Owner Role</label>
                <input
                  type="text"
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="td-form-input"
                />
              </div>

              <div className="form-group">
                <label>Duration</label>
                <input
                  type="text"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  className="td-form-input"
                  placeholder="e.g. 7 Business Days"
                />
              </div>

              <div className="form-group">
                <label>Start Rule</label>
                <input
                  type="text"
                  value={editStartRule}
                  onChange={(e) => setEditStartRule(e.target.value)}
                  className="td-form-input"
                />
              </div>

              <div className="form-group">
                <label>Completion Rule</label>
                <input
                  type="text"
                  value={editCompletionRule}
                  onChange={(e) => setEditCompletionRule(e.target.value)}
                  className="td-form-input"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
