"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Play,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Zap,
  Filter,
  Check,
  Building,
  Mail,
  CheckSquare,
  RefreshCw,
  MoreVertical,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Shield,
  Clock,
  User,
} from "lucide-react";
import {
  WorkflowRule,
  RuleCondition,
  RuleConditionGroup,
  RuleAction,
  RulePriority,
  RuleStatus,
  TriggerFrequency,
  SUPPORTED_FIELDS,
  SUPPORTED_OPERATORS,
  TRIGGER_EVENTS,
  EVALUATION_OPTIONS,
  RULE_CATEGORIES,
  formatConditionExpression,
  formatLivePreview,
} from "@/lib/templates/rules-domain";
import TestRuleModal from "./TestRuleModal";

interface RuleBuilderModalProps {
  isOpen: boolean;
  templateId: string;
  templateName: string;
  existingRule?: WorkflowRule | null;
  allRulesCount: number;
  availableApprovals?: Array<{ code: string; name: string }>;
  onClose: () => void;
  onSaveRule: (rule: WorkflowRule, activate: boolean) => Promise<void>;
}

export default function RuleBuilderModal({
  isOpen,
  templateId,
  templateName,
  existingRule,
  allRulesCount,
  availableApprovals = [],
  onClose,
  onSaveRule,
}: RuleBuilderModalProps) {
  // Stepper: 1. Basics, 2. Trigger, 3. Conditions, 4. Actions, 5. Approval, 6. Exceptions, 7. Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State: 1. Basics
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<WorkflowRule["category"]>("Commercial");
  const [priority, setPriority] = useState<RulePriority>("Critical");
  const [status, setStatus] = useState<RuleStatus>("DRAFT");
  const [effectiveFrom, setEffectiveFrom] = useState("2026-08-18");
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [owner, setOwner] = useState("Admin User");
  const [allowOverride, setAllowOverride] = useState(true);
  const [overridePolicy, setOverridePolicy] = useState("Project Manager Approval Required");

  // Form State: 2. Trigger
  const [triggerEvent, setTriggerEvent] = useState("Project Created");
  const [triggerEvaluate, setTriggerEvaluate] = useState("Immediately");
  const [triggerFrequency, setTriggerFrequency] = useState<TriggerFrequency>("once_per_event");

  // Form State: 3. Conditions
  const [rootConjunction, setRootConjunction] = useState<"ALL" | "ANY">("ALL");
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { id: "c-1", field: "estimatedProjectValue", operator: "is greater than", value: 1000000 },
    { id: "c-2", field: "projectType", operator: "equals", value: "Residential" },
  ]);
  const [groups, setGroups] = useState<RuleConditionGroup[]>([
    {
      id: "g-1",
      conjunction: "ALL",
      conditions: [
        { id: "gc-1", field: "clientType", operator: "equals", value: "Enterprise" },
        { id: "gc-2", field: "projectRegion", operator: "equals", value: "Hyderabad" },
      ],
    },
  ]);

  // Form State: 4. Actions
  const [actions, setActions] = useState<RuleAction[]>([
    { id: "a-1", type: "requestApproval", title: "Request Approval", target: "High Value Project Approval", badge: "Approval" },
    { id: "a-2", type: "sendNotification", title: "Send Notification", target: "Project Manager", badge: "Notification" },
    { id: "a-3", type: "createTask", title: "Create Task", target: "Commercial Review Task", badge: "Task" },
    { id: "a-4", type: "changeStatus", title: "Change Project Status", target: "Awaiting Approval", badge: "Status" },
  ]);

  // Form State: 5. Approval
  const [approvalFlowName, setApprovalFlowName] = useState("Finance Approval");
  const [approvalFlowCode, setApprovalFlowCode] = useState("APR-TPL-002");
  const [approvalMode, setApprovalMode] = useState<"sequential" | "parallel">("sequential");
  const [approvalSlaDays, setApprovalSlaDays] = useState(2);

  // Form State: 6. Exceptions
  const [skipInternalProjects, setSkipInternalProjects] = useState(true);
  const [skipAdminInitiated, setSkipAdminInitiated] = useState(false);
  const [customException, setCustomException] = useState("");

  // Saving state & errors
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Reset or initialize when opened
  useEffect(() => {
    if (!isOpen) return;

    if (existingRule) {
      setName(existingRule.name);
      setCode(existingRule.code);
      setDescription(existingRule.description || "");
      setCategory(existingRule.category || "Commercial");
      setPriority(existingRule.priority || "Critical");
      setStatus(existingRule.status || "DRAFT");
      setEffectiveFrom(existingRule.effectiveFrom || "2026-08-18");
      setEffectiveUntil(existingRule.effectiveUntil || "");
      setOwner(existingRule.owner || "Admin User");
      setAllowOverride(existingRule.allowOverride ?? true);
      setOverridePolicy(existingRule.overridePolicy || "Project Manager Approval Required");

      setTriggerEvent(existingRule.trigger.event || "Project Created");
      setTriggerEvaluate(existingRule.trigger.evaluate || "Immediately");
      setTriggerFrequency(existingRule.trigger.frequency || "once_per_event");

      setRootConjunction(existingRule.conditions.conjunction || "ALL");
      setConditions(existingRule.conditions.conditions || []);
      setGroups(existingRule.conditions.groups || []);
      setActions(existingRule.actions || []);

      if (existingRule.approval) {
        setApprovalFlowName(existingRule.approval.flowName || "Finance Approval");
        setApprovalFlowCode(existingRule.approval.flowCode || "APR-TPL-002");
        setApprovalMode(existingRule.approval.mode || "sequential");
        setApprovalSlaDays(existingRule.approval.slaDays || 2);
      }
    } else {
      // New rule defaults matching Screenshot 2
      const autoCode = `RUL-${String(allRulesCount + 1).padStart(3, "0")}`;
      setName("High Value Project Approval");
      setCode(autoCode);
      setDescription("Require Finance approval for projects whose estimated project value exceeds the defined commercial threshold.");
      setCategory("Commercial");
      setPriority("Critical");
      setStatus("DRAFT");
      setEffectiveFrom("2026-08-18");
      setEffectiveUntil("");
      setOwner("Admin User");
      setAllowOverride(true);
      setOverridePolicy("Project Manager Approval Required");

      setTriggerEvent("Project Created");
      setTriggerEvaluate("Immediately");
      setTriggerFrequency("once_per_event");

      setRootConjunction("ALL");
      setConditions([
        { id: "c-1", field: "estimatedProjectValue", operator: "is greater than", value: 1000000 },
        { id: "c-2", field: "projectType", operator: "equals", value: "Residential" },
      ]);
      setGroups([
        {
          id: "g-1",
          conjunction: "ALL",
          conditions: [
            { id: "gc-1", field: "clientType", operator: "equals", value: "Enterprise" },
            { id: "gc-2", field: "projectRegion", operator: "equals", value: "Hyderabad" },
          ],
        },
      ]);
      setActions([
        { id: "a-1", type: "requestApproval", title: "Request Approval", target: "High Value Project Approval", badge: "Approval" },
        { id: "a-2", type: "sendNotification", title: "Send Notification", target: "Project Manager", badge: "Notification" },
        { id: "a-3", type: "createTask", title: "Create Task", target: "Commercial Review Task", badge: "Task" },
        { id: "a-4", type: "changeStatus", title: "Change Project Status", target: "Awaiting Approval", badge: "Status" },
      ]);

      setApprovalFlowName("Finance Approval");
      setApprovalFlowCode("APR-TPL-002");
      setApprovalMode("sequential");
      setApprovalSlaDays(2);
    }
    setCurrentStep(1);
    setValidationErrors({});
  }, [isOpen, existingRule, allRulesCount]);

  // Construct current workflow rule object from form state
  const currentRule: WorkflowRule = useMemo(() => {
    const summaryFormula = formatConditionExpression({
      conjunction: rootConjunction,
      conditions,
      groups,
    });

    return {
      id: existingRule?.id || `rul-${Date.now()}`,
      code: code || `RUL-${String(allRulesCount + 1).padStart(3, "0")}`,
      name: name || "Untitled Rule",
      description,
      category,
      priority,
      status,
      version: existingRule?.version || "v1.0",
      effectiveFrom,
      effectiveUntil: effectiveUntil || undefined,
      owner,
      allowOverride,
      overridePolicy,
      trigger: {
        event: triggerEvent,
        evaluate: triggerEvaluate,
        frequency: triggerFrequency,
        timing: triggerEvaluate,
      },
      conditions: {
        conjunction: rootConjunction,
        conditions,
        groups,
        summary: summaryFormula,
      },
      actions,
      approval: {
        flowName: approvalFlowName,
        flowCode: approvalFlowCode,
        version: "v2.2",
        stepsCount: 2,
        mode: approvalMode,
        slaDays: approvalSlaDays,
      },
      exceptions: [
        ...(skipInternalProjects ? [{ id: "ex-1", type: "tag", value: "internal", description: "Skip if project has tag: internal" }] : []),
        ...(skipAdminInitiated ? [{ id: "ex-2", type: "role", value: "admin", description: "Skip if initiated by Admin" }] : []),
        ...(customException.trim() ? [{ id: "ex-3", type: "custom", value: customException, description: customException }] : []),
      ],
      executedCount: existingRule?.executedCount ?? 0,
      lastTriggered: existingRule?.lastTriggered || "—",
      createdBy: existingRule?.createdBy || owner,
      createdDate: existingRule?.createdDate || "18 Aug 2026",
      lastUpdated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      lastUpdatedBy: owner,
    };
  }, [
    existingRule,
    code,
    name,
    description,
    category,
    priority,
    status,
    effectiveFrom,
    effectiveUntil,
    owner,
    allowOverride,
    overridePolicy,
    triggerEvent,
    triggerEvaluate,
    triggerFrequency,
    rootConjunction,
    conditions,
    groups,
    actions,
    approvalFlowName,
    approvalFlowCode,
    approvalMode,
    approvalSlaDays,
    skipInternalProjects,
    skipAdminInitiated,
    customException,
    allRulesCount,
  ]);

  // Live preview formatting
  const livePreview = useMemo(() => formatLivePreview(currentRule), [currentRule]);

  // Condition summary text
  const conditionSummaryText = useMemo(() => {
    return formatConditionExpression(currentRule.conditions);
  }, [currentRule.conditions]);

  // Dependencies calculation
  const dependenciesCount = useMemo(() => {
    let count = 0;
    if (actions.some((a) => a.type === "requestApproval")) count++;
    if (actions.some((a) => a.type === "createTask")) count++;
    if (triggerEvent.includes("Milestone")) count++;
    return count;
  }, [actions, triggerEvent]);

  if (!isOpen) return null;

  // Validation
  const validateForm = (forActivation: boolean): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Rule Name is required.";
    if (!description.trim()) errors.description = "Description is required.";

    if (forActivation) {
      if (conditions.length === 0 && (!groups || groups.length === 0)) {
        errors.conditions = "At least one condition is required for rule activation.";
      }
      if (actions.length === 0) {
        errors.actions = "At least one action is required for rule activation.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Draft handler
  const handleSaveDraft = async () => {
    if (!validateForm(false)) return;
    try {
      setSaving(true);
      await onSaveRule({ ...currentRule, status: "DRAFT" }, false);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save draft.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // Save & Activate handler
  const handleSaveAndActivate = async () => {
    if (!validateForm(true)) return;
    try {
      setSaving(true);
      await onSaveRule({ ...currentRule, status: "ACTIVE" }, true);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to activate rule.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // Step 3 condition manipulation helpers
  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `c-${Date.now()}`,
        field: "estimatedProjectValue",
        operator: "is greater than",
        value: 1000000,
      },
    ]);
  };

  const handleAddConditionGroup = () => {
    setGroups([
      ...groups,
      {
        id: `g-${Date.now()}`,
        conjunction: "ALL",
        conditions: [
          { id: `gc-${Date.now()}-1`, field: "clientType", operator: "equals", value: "Enterprise" },
        ],
      },
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleUpdateCondition = (id: string, partial: Partial<RuleCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
  };

  const handleUpdateGroupCondition = (
    groupId: string,
    condId: string,
    partial: Partial<RuleCondition>
  ) => {
    setGroups(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) => (c.id === condId ? { ...c, ...partial } : c)),
            }
          : g
      )
    );
  };

  const handleAddGroupCondition = (groupId: string) => {
    setGroups(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: [
                ...g.conditions,
                { id: `gc-${Date.now()}`, field: "projectRegion", operator: "equals", value: "Hyderabad" },
              ],
            }
          : g
      )
    );
  };

  const handleClearAllConditions = () => {
    setConditions([]);
    setGroups([]);
  };

  // Action manipulation helpers
  const handleAddAction = () => {
    const newAction: RuleAction = {
      id: `a-${Date.now()}`,
      type: "sendNotification",
      title: "Send Notification",
      target: "Project Manager",
      badge: "Notification",
    };
    setActions([...actions, newAction]);
  };

  const handleRemoveAction = (actionId: string) => {
    setActions(actions.filter((a) => a.id !== actionId));
  };

  const handleMoveAction = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= actions.length) return;
    const copy = [...actions];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    setActions(copy);
  };

  const STEPS = [
    { num: 1, label: "Basics" },
    { num: 2, label: "Trigger" },
    { num: 3, label: "Conditions" },
    { num: 4, label: "Actions" },
    { num: 5, label: "Approval" },
    { num: 6, label: "Exceptions" },
    { num: 7, label: "Review" },
  ];

  return (
    <div className="td-modal-overlay">
      <div className="td-rule-builder-modal">
        {/* ── Top Header Row ────────────────────────────────────────── */}
        <div className="td-rb-header-row">
          <div className="td-rb-header-left">
            <div className="td-rb-breadcrumb">
              <span>Template Library</span>
              <span className="sep">&gt;</span>
              <span>{templateName}</span>
              <span className="sep">&gt;</span>
              <span>Workflow</span>
              <span className="sep">&gt;</span>
              <span>Rules</span>
              <span className="sep">&gt;</span>
              <span className="active-item">{existingRule ? "Edit Rule" : "New Rule"}</span>
            </div>

            <h2 className="td-rb-main-title">{existingRule ? "Edit Rule" : "Create New Rule"}</h2>
            <p className="td-rb-main-desc">
              Define when this rule should run, the conditions to evaluate, and the actions to perform.
            </p>
          </div>

          <div className="td-rb-header-right">
            <button
              type="button"
              className="td-rb-btn-outline"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              className="td-rb-btn-outline icon-btn"
              onClick={() => setIsTestModalOpen(true)}
            >
              <Play size={14} />
              <span>Test Rule</span>
            </button>

            <button
              type="button"
              className="td-rb-btn-primary"
              onClick={handleSaveAndActivate}
              disabled={saving}
            >
              <span>{saving ? "Saving..." : "Save & Activate"}</span>
            </button>

            <button
              type="button"
              className="td-rb-btn-close"
              onClick={onClose}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Stepper Navigation ────────────────────────────────────── */}
        <div className="td-rb-stepper-wrap">
          {STEPS.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                className={`td-rb-step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                onClick={() => setCurrentStep(s.num)}
              >
                <span className="step-circle">{s.num}</span>
                <span className="step-name">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Main Two-Column Layout ─────────────────────────────────── */}
        <div className="td-rb-content-grid">
          {/* ════════════════════════════════════════════════════════════
              LEFT COLUMN: Form Steps
             ════════════════════════════════════════════════════════════ */}
          <div className="td-rb-form-column">
            {/* ── STEP 1: BASICS ──────────────────────────────────────── */}
            <div className={`td-rb-section ${currentStep === 1 ? "active" : ""}`}>
              <div className="td-rb-section-title">1. BASICS</div>

              {/* Row 1: Rule Name & Rule ID */}
              <div className="td-rb-form-row two-col">
                <div className="td-rb-field">
                  <label className="label">
                    Rule Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="td-rb-input"
                    value={name}
                    placeholder="e.g. High Value Project Approval"
                    onChange={(e) => setName(e.target.value)}
                  />
                  {validationErrors.name && (
                    <span className="err-txt">{validationErrors.name}</span>
                  )}
                </div>

                <div className="td-rb-field">
                  <label className="label">Rule ID</label>
                  <input
                    type="text"
                    className="td-rb-input disabled"
                    value={code}
                    disabled
                  />
                  <span className="sub-helper">Auto-generated</span>
                </div>
              </div>

              {/* Description */}
              <div className="td-rb-field" style={{ marginTop: 16 }}>
                <label className="label">
                  Description <span className="req">*</span>
                </label>
                <textarea
                  className="td-rb-textarea"
                  rows={3}
                  maxLength={300}
                  placeholder="Describe what this rule achieves..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="desc-footer">
                  <span className="helper">Helper text will appear here...</span>
                  <span className="counter">{description.length} / 300</span>
                </div>
                {validationErrors.description && (
                  <span className="err-txt">{validationErrors.description}</span>
                )}
              </div>

              {/* Row 2: Category, Priority, Status */}
              <div className="td-rb-form-row three-col" style={{ marginTop: 16 }}>
                <div className="td-rb-field">
                  <label className="label">
                    Category <span className="req">*</span>
                  </label>
                  <select
                    className="td-rb-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Project">Project</option>
                    <option value="Tasks">Tasks</option>
                    <option value="Milestones">Milestones</option>
                    <option value="Approvals">Approvals</option>
                    <option value="Costing">Costing</option>
                    <option value="Documents">Documents</option>
                    <option value="Clients">Clients</option>
                  </select>
                </div>

                <div className="td-rb-field">
                  <label className="label">
                    Priority <span className="req">*</span>
                  </label>
                  <select
                    className="td-rb-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="Critical">● Critical</option>
                    <option value="High">● High</option>
                    <option value="Medium">● Medium</option>
                    <option value="Low">● Low</option>
                  </select>
                </div>

                <div className="td-rb-field">
                  <label className="label">
                    Status <span className="req">*</span>
                  </label>
                  <select
                    className="td-rb-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Effective Dates & Owner */}
              <div className="td-rb-form-row three-col" style={{ marginTop: 16 }}>
                <div className="td-rb-field">
                  <label className="label">Effective From</label>
                  <input
                    type="date"
                    className="td-rb-input"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                  />
                </div>

                <div className="td-rb-field">
                  <label className="label">Effective Until (optional)</label>
                  <input
                    type="date"
                    className="td-rb-input"
                    value={effectiveUntil}
                    onChange={(e) => setEffectiveUntil(e.target.value)}
                  />
                </div>

                <div className="td-rb-field">
                  <label className="label">
                    Owner <span className="req">*</span>
                  </label>
                  <select
                    className="td-rb-select"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                  >
                    <option value="Admin User">Admin User</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Lead Designer">Lead Designer</option>
                    <option value="Estimator">Estimator</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Overrides Switch */}
              <div className="td-rb-override-row" style={{ marginTop: 20 }}>
                <div className="override-toggle-wrap">
                  <span className="toggle-label">Allow project-level override</span>
                  <label className="td-switch">
                    <input
                      type="checkbox"
                      checked={allowOverride}
                      onChange={(e) => setAllowOverride(e.target.checked)}
                    />
                    <span className="slider round" />
                  </label>
                  <span className="toggle-state-txt">{allowOverride ? "Yes" : "No"}</span>
                </div>

                <div className="override-config-wrap">
                  <span className="policy-label">Override policy</span>
                  <HelpCircle size={14} className="info-icon" />
                  <button
                    type="button"
                    className="btn-configure-override"
                    onClick={() =>
                      alert(`Configured Override Policy: "${overridePolicy}". Project managers may request exception tickets.`)
                    }
                  >
                    Configure Overrides
                  </button>
                </div>
              </div>
            </div>

            {/* ── STEP 2: TRIGGER ─────────────────────────────────────── */}
            <div className={`td-rb-section ${currentStep === 2 ? "active" : ""}`} style={{ marginTop: 28 }}>
              <div className="td-rb-section-title">2. TRIGGER</div>

              <div className="td-rb-form-row two-col">
                <div className="td-rb-field">
                  <label className="label">
                    Trigger Event <span className="req">*</span>
                  </label>
                  <div className="select-with-icon-wrap">
                    <select
                      className="td-rb-select"
                      value={triggerEvent}
                      onChange={(e) => setTriggerEvent(e.target.value)}
                    >
                      {TRIGGER_EVENTS.map((evt) => (
                        <option key={evt} value={evt}>
                          {evt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="td-rb-field">
                  <label className="label">
                    Evaluate <span className="req">*</span>
                  </label>
                  <select
                    className="td-rb-select"
                    value={triggerEvaluate}
                    onChange={(e) => setTriggerEvaluate(e.target.value)}
                  >
                    {EVALUATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Run Frequency & About Callout */}
              <div className="td-rb-form-row two-col" style={{ marginTop: 18 }}>
                <div className="td-rb-frequency-col">
                  <label className="label">
                    Run Frequency <span className="req">*</span>
                  </label>
                  <div className="freq-radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="frequency"
                        checked={triggerFrequency === "once_per_event"}
                        onChange={() => setTriggerFrequency("once_per_event")}
                      />
                      <div className="radio-text">
                        <span className="primary">Once per event</span>
                        <span className="sub">Run once every time the event occurs</span>
                      </div>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="frequency"
                        checked={triggerFrequency === "once_per_project"}
                        onChange={() => setTriggerFrequency("once_per_project")}
                      />
                      <div className="radio-text">
                        <span className="primary">Once per project</span>
                        <span className="sub">Run only once for the entire project</span>
                      </div>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="frequency"
                        checked={triggerFrequency === "every_time_met"}
                        onChange={() => setTriggerFrequency("every_time_met")}
                      />
                      <div className="radio-text">
                        <span className="primary">Every time conditions are met</span>
                        <span className="sub">Run each time the conditions become true</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="td-rb-about-trigger-box">
                  <div className="box-header">
                    <Zap size={15} className="zap-icon" />
                    <span>About this trigger</span>
                  </div>
                  <p className="box-desc">
                    This rule will evaluate {triggerEvaluate.toLowerCase()} when {triggerEvent.toLowerCase()} occurs from this template. System will evaluate the conditions using the project data at the time of {triggerEvent.toLowerCase()}.
                  </p>
                </div>
              </div>
            </div>

            {/* ── STEP 3: CONDITIONS ──────────────────────────────────── */}
            <div className={`td-rb-section ${currentStep === 3 ? "active" : ""}`} style={{ marginTop: 28 }}>
              <div className="td-rb-cond-section-header">
                <div>
                  <div className="td-rb-section-title">3. CONDITIONS</div>
                  <p className="td-rb-section-subtitle">
                    Define the conditions that must be true for this rule to execute.
                  </p>
                </div>

                <div className="cond-actions-top">
                  <button
                    type="button"
                    className="td-btn-add-cond"
                    onClick={handleAddCondition}
                  >
                    <Plus size={13} />
                    <span>Add Condition</span>
                  </button>

                  <button
                    type="button"
                    className="td-btn-add-cond"
                    onClick={handleAddConditionGroup}
                  >
                    <Plus size={13} />
                    <span>Add Condition Group</span>
                  </button>
                </div>
              </div>

              {/* Main Conditions Box */}
              <div className="td-rb-conditions-box">
                <div className="cond-logic-row">
                  <select
                    className="cond-logic-select"
                    value={rootConjunction}
                    onChange={(e) => setRootConjunction(e.target.value as any)}
                  >
                    <option value="ALL">ALL</option>
                    <option value="ANY">ANY</option>
                  </select>
                  <span className="logic-txt">of the following conditions must be true</span>
                </div>

                {/* Condition Rows */}
                <div className="cond-rows-list">
                  {conditions.map((cond, idx) => {
                    const fieldDef = SUPPORTED_FIELDS.find((f) => f.key === cond.field);

                    return (
                      <div key={cond.id} className="cond-single-row">
                        <GripVertical size={13} className="grip-icon" />

                        {/* Field select */}
                        <select
                          className="cond-field-select"
                          value={cond.field}
                          onChange={(e) =>
                            handleUpdateCondition(cond.id, { field: e.target.value })
                          }
                        >
                          {SUPPORTED_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>

                        {/* Operator select */}
                        <select
                          className="cond-operator-select"
                          value={cond.operator}
                          onChange={(e) =>
                            handleUpdateCondition(cond.id, { operator: e.target.value })
                          }
                        >
                          {SUPPORTED_OPERATORS.map((op) => (
                            <option key={op.key} value={op.key}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {/* Value input / select */}
                        {fieldDef?.type === "select" && fieldDef.options ? (
                          <select
                            className="cond-val-input"
                            value={String(cond.value)}
                            onChange={(e) =>
                              handleUpdateCondition(cond.id, { value: e.target.value })
                            }
                          >
                            {fieldDef.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={fieldDef?.type === "currency" || fieldDef?.type === "number" ? "number" : "text"}
                            className="cond-val-input"
                            value={cond.value}
                            placeholder={fieldDef?.type === "currency" ? "₹ Amount" : "Value"}
                            onChange={(e) =>
                              handleUpdateCondition(cond.id, {
                                value: fieldDef?.type === "number" || fieldDef?.type === "currency" ? Number(e.target.value) : e.target.value,
                              })
                            }
                          />
                        )}

                        <button
                          type="button"
                          className="cond-delete-btn"
                          title="Remove condition"
                          onClick={() => handleRemoveCondition(cond.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Nested Groups (OR groups) */}
                {groups.map((group, gi) => (
                  <div key={group.id} className="nested-cond-group-wrap">
                    <div className="group-connector-pill">
                      <span>OR</span>
                    </div>

                    <div className="nested-group-box">
                      <div className="group-top-row">
                        <div className="cond-logic-row">
                          <select
                            className="cond-logic-select"
                            value={group.conjunction}
                            onChange={(e) => {
                              const val = e.target.value as "ALL" | "ANY";
                              setGroups(
                                groups.map((g) => (g.id === group.id ? { ...g, conjunction: val } : g))
                              );
                            }}
                          >
                            <option value="ALL">ALL</option>
                            <option value="ANY">ANY</option>
                          </select>
                          <span className="logic-txt">of the following conditions must be true</span>
                        </div>

                        <button
                          type="button"
                          className="btn-remove-group"
                          onClick={() => handleRemoveGroup(group.id)}
                          title="Remove group"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="cond-rows-list">
                        {group.conditions.map((gc) => {
                          const gFieldDef = SUPPORTED_FIELDS.find((f) => f.key === gc.field);

                          return (
                            <div key={gc.id} className="cond-single-row">
                              <GripVertical size={13} className="grip-icon" />

                              <select
                                className="cond-field-select"
                                value={gc.field}
                                onChange={(e) =>
                                  handleUpdateGroupCondition(group.id, gc.id, { field: e.target.value })
                                }
                              >
                                {SUPPORTED_FIELDS.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>

                              <select
                                className="cond-operator-select"
                                value={gc.operator}
                                onChange={(e) =>
                                  handleUpdateGroupCondition(group.id, gc.id, { operator: e.target.value })
                                }
                              >
                                {SUPPORTED_OPERATORS.map((op) => (
                                  <option key={op.key} value={op.key}>
                                    {op.label}
                                  </option>
                                ))}
                              </select>

                              {gFieldDef?.type === "select" && gFieldDef.options ? (
                                <select
                                  className="cond-val-input"
                                  value={String(gc.value)}
                                  onChange={(e) =>
                                    handleUpdateGroupCondition(group.id, gc.id, { value: e.target.value })
                                  }
                                >
                                  {gFieldDef.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={gFieldDef?.type === "currency" || gFieldDef?.type === "number" ? "number" : "text"}
                                  className="cond-val-input"
                                  value={gc.value}
                                  placeholder="Value"
                                  onChange={(e) =>
                                    handleUpdateGroupCondition(group.id, gc.id, {
                                      value: gFieldDef?.type === "number" || gFieldDef?.type === "currency" ? Number(e.target.value) : e.target.value,
                                    })
                                  }
                                />
                              )}

                              <button
                                type="button"
                                className="cond-delete-btn"
                                onClick={() => {
                                  setGroups(
                                    groups.map((g) =>
                                      g.id === group.id
                                        ? { ...g, conditions: g.conditions.filter((c) => c.id !== gc.id) }
                                        : g
                                    )
                                  );
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        className="btn-add-to-group"
                        onClick={() => handleAddGroupCondition(group.id)}
                      >
                        <Plus size={12} />
                        <span>Add condition to this group</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Condition Summary Box */}
              <div className="td-rb-cond-summary-row">
                <div className="summary-left">
                  <CheckCircle2 size={16} className="summary-icon" />
                  <div className="summary-text-wrap">
                    <span className="summary-title">Condition Summary</span>
                    <p className="summary-formula">{conditionSummaryText || "No conditions configured"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-clear-all"
                  onClick={handleClearAllConditions}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* ── STEP 4: ACTIONS ─────────────────────────────────────── */}
            <div className={`td-rb-section ${currentStep === 4 ? "active" : ""}`} style={{ marginTop: 28 }}>
              <div className="td-rb-cond-section-header">
                <div>
                  <div className="td-rb-section-title">4. ACTIONS</div>
                  <p className="td-rb-section-subtitle">(In execution order)</p>
                </div>

                <button
                  type="button"
                  className="td-btn-add-cond"
                  onClick={handleAddAction}
                >
                  <Plus size={13} />
                  <span>Add Action</span>
                </button>
              </div>

              {/* Actions List */}
              <div className="td-rb-actions-list-builder">
                {actions.map((act, index) => {
                  return (
                    <div key={act.id} className="td-rb-action-item-card">
                      <div className="left-controls">
                        <span className="action-seq-num">{index + 1}</span>
                        <div className="icon-wrap">
                          {act.type === "requestApproval" && <Building size={16} />}
                          {act.type === "sendNotification" && <Mail size={16} />}
                          {act.type === "createTask" && <CheckSquare size={16} />}
                          {act.type === "changeStatus" && <RefreshCw size={16} />}
                          {act.type === "blockActivation" && <Shield size={16} />}
                        </div>
                      </div>

                      <div className="action-details">
                        <input
                          type="text"
                          className="action-title-input"
                          value={act.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActions(
                              actions.map((a) => (a.id === act.id ? { ...a, title: val } : a))
                            );
                          }}
                        />
                        <input
                          type="text"
                          className="action-target-input"
                          value={act.target || ""}
                          placeholder="Target entity, recipient, or step..."
                          onChange={(e) => {
                            const val = e.target.value;
                            setActions(
                              actions.map((a) => (a.id === act.id ? { ...a, target: val } : a))
                            );
                          }}
                        />
                      </div>

                      <div className="right-controls">
                        <span className={`action-type-pill ${act.badge?.toLowerCase().replace(/\s+/g, "-")}`}>
                          {act.badge || act.type}
                        </span>

                        <div className="order-buttons">
                          <button
                            type="button"
                            className="order-btn"
                            disabled={index === 0}
                            onClick={() => handleMoveAction(index, "up")}
                            title="Move up"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            className="order-btn"
                            disabled={index === actions.length - 1}
                            onClick={() => handleMoveAction(index, "down")}
                            title="Move down"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cond-delete-btn"
                          title="Remove action"
                          onClick={() => handleRemoveAction(act.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── STEP 5: APPROVAL ────────────────────────────────────── */}
            <div className={`td-rb-section ${currentStep === 5 ? "active" : ""}`} style={{ marginTop: 28 }}>
              <div className="td-rb-section-title">5. APPROVAL CONFIGURATION</div>
              <p className="td-rb-section-subtitle">
                Link to an existing approval flow defined on this template.
              </p>

              <div className="td-rb-form-row two-col" style={{ marginTop: 14 }}>
                <div className="td-rb-field">
                  <label className="label">Approval Flow</label>
                  <select
                    className="td-rb-select"
                    value={approvalFlowName}
                    onChange={(e) => {
                      setApprovalFlowName(e.target.value);
                      const match = availableApprovals.find((a) => a.name === e.target.value);
                      if (match) setApprovalFlowCode(match.code);
                    }}
                  >
                    <option value="Finance Approval">Finance Approval (APR-TPL-002)</option>
                    <option value="Commercial Approval">Commercial Approval (APR-TPL-001)</option>
                    <option value="Design Concept Approval">Design Concept Approval (APR-TPL-001)</option>
                    <option value="BOQ Approval">BOQ Approval (APR-TPL-002)</option>
                  </select>
                </div>

                <div className="td-rb-field">
                  <label className="label">Execution Mode</label>
                  <select
                    className="td-rb-select"
                    value={approvalMode}
                    onChange={(e) => setApprovalMode(e.target.value as any)}
                  >
                    <option value="sequential">Sequential (Order strictly enforced)</option>
                    <option value="parallel">Parallel (Simultaneous approver sign-off)</option>
                  </select>
                </div>
              </div>

              <div className="td-rb-form-row two-col" style={{ marginTop: 14 }}>
                <div className="td-rb-field">
                  <label className="label">SLA Window (Business Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className="td-rb-input"
                    value={approvalSlaDays}
                    onChange={(e) => setApprovalSlaDays(Number(e.target.value))}
                  />
                </div>
                <div className="td-rb-field">
                  <label className="label">Approval Code</label>
                  <input
                    type="text"
                    className="td-rb-input disabled"
                    value={approvalFlowCode}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* ── STEP 6: EXCEPTIONS ──────────────────────────────────── */}
            <div className={`td-rb-section ${currentStep === 6 ? "active" : ""}`} style={{ marginTop: 28 }}>
              <div className="td-rb-section-title">6. EXCEPTIONS & BYPASS RULES</div>
              <p className="td-rb-section-subtitle">
                Specify criteria where this workflow rule should automatically be bypassed.
              </p>

              <div className="td-rb-exceptions-list" style={{ marginTop: 14 }}>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={skipInternalProjects}
                    onChange={(e) => setSkipInternalProjects(e.target.checked)}
                  />
                  <div>
                    <span className="primary-text">Bypass for Internal/Demo Projects</span>
                    <span className="sub-text">Skip rule evaluation if project has tag: "Internal" or "Demo"</span>
                  </div>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={skipAdminInitiated}
                    onChange={(e) => setSkipAdminInitiated(e.target.checked)}
                  />
                  <div>
                    <span className="primary-text">Bypass for Workspace Owners</span>
                    <span className="sub-text">Skip approval gate if the project is created directly by Organization Owner</span>
                  </div>
                </label>

                <div className="td-rb-field" style={{ marginTop: 14 }}>
                  <label className="label">Custom Exception Note / Condition</label>
                  <input
                    type="text"
                    className="td-rb-input"
                    placeholder="e.g. Skip if project contract type is Fixed Cost Turnkey"
                    value={customException}
                    onChange={(e) => setCustomException(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── STEP 7: REVIEW ──────────────────────────────────────── */}
            <div className={`td-rb-section ${currentStep === 7 ? "active" : ""}`} style={{ marginTop: 28 }}>
              <div className="td-rb-section-title">7. REVIEW & ACTIVATION</div>
              <p className="td-rb-section-subtitle">
                Review all rule configurations before activating into this template.
              </p>

              <div className="td-rb-review-cards-grid" style={{ marginTop: 16 }}>
                <div className="review-card">
                  <span className="card-title">Basics Summary</span>
                  <div className="card-row"><span>Rule Name:</span> <strong>{name}</strong></div>
                  <div className="card-row"><span>Rule Code:</span> <strong>{code}</strong></div>
                  <div className="card-row"><span>Category:</span> <strong>{category}</strong></div>
                  <div className="card-row"><span>Priority:</span> <strong>{priority}</strong></div>
                </div>

                <div className="review-card">
                  <span className="card-title">Trigger & Frequency</span>
                  <div className="card-row"><span>Event:</span> <strong>{triggerEvent}</strong></div>
                  <div className="card-row"><span>Evaluate:</span> <strong>{triggerEvaluate}</strong></div>
                  <div className="card-row"><span>Frequency:</span> <strong>{triggerFrequency.replace(/_/g, " ")}</strong></div>
                </div>

                <div className="review-card full-width">
                  <span className="card-title">Configured Conditions</span>
                  <p className="formula-txt">{conditionSummaryText}</p>
                </div>

                <div className="review-card full-width">
                  <span className="card-title">Actions Pipeline ({actions.length})</span>
                  <div className="actions-review-list">
                    {actions.map((a, i) => (
                      <div key={a.id} className="act-row">
                        <span>{i + 1}. {a.title} ({a.target})</span>
                        <span className="badge">{a.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Navigation Bottom Bar */}
            <div className="td-rb-footer-nav">
              <button
                type="button"
                className="td-btn-step-prev"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div className="footer-right">
                <button
                  type="button"
                  className="td-btn-cancel-link"
                  onClick={onClose}
                >
                  Cancel
                </button>

                {currentStep < 7 ? (
                  <button
                    type="button"
                    className="td-btn-continue"
                    onClick={() => setCurrentStep((s) => Math.min(7, s + 1))}
                  >
                    <span>Continue</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="td-btn-continue"
                    onClick={handleSaveAndActivate}
                    disabled={saving}
                  >
                    <Check size={14} />
                    <span>{saving ? "Saving..." : "Save & Activate"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              RIGHT COLUMN: Live Preview & Metadata Sidebar
             ════════════════════════════════════════════════════════════ */}
          <div className="td-rb-preview-column">
            {/* 1. Live Rule Preview */}
            <div className="td-rb-preview-card">
              <div className="card-head">
                <h4 className="title">LIVE RULE PREVIEW</h4>
                <p className="sub">This is how your rule reads in plain language.</p>
              </div>

              <div className="preview-section">
                <div className="clause-title">
                  <Zap size={13} className="clause-icon" />
                  <span>WHEN</span>
                </div>
                <div className="clause-body">{livePreview.when}</div>
              </div>

              <div className="preview-section">
                <div className="clause-title">
                  <Filter size={13} className="clause-icon filter" />
                  <span>IF</span>
                </div>
                <div className="clause-body code-style">{livePreview.ifText || "—"}</div>
              </div>

              <div className="preview-section">
                <div className="clause-title">
                  <Zap size={13} className="clause-icon" />
                  <span>THEN</span>
                </div>
                <ul className="clause-list">
                  {livePreview.thenList.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 2. Rule Details Card */}
            <div className="td-rb-details-card">
              <h4 className="title">RULE DETAILS</h4>
              <div className="meta-list">
                <div className="meta-row">
                  <span className="lbl">Category</span>
                  <span className="val">{category}</span>
                </div>
                <div className="meta-row">
                  <span className="lbl">Priority</span>
                  <span className="val priority-val">
                    <span className={`dot ${priority.toLowerCase()}`} />
                    {priority}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="lbl">Status</span>
                  <span className="val status-val">
                    <span className="dot blue" />
                    {status}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="lbl">Run Frequency</span>
                  <span className="val">{triggerFrequency.replace(/_/g, " ")}</span>
                </div>
                <div className="meta-row">
                  <span className="lbl">Override</span>
                  <span className="val">{allowOverride ? "Allowed" : "Restricted"}</span>
                </div>
                <div className="meta-row">
                  <span className="lbl">Created By</span>
                  <span className="val">{owner}</span>
                </div>
                <div className="meta-row">
                  <span className="lbl">Created On</span>
                  <span className="val">18 Aug 2026 - 14:32</span>
                </div>
                <div className="meta-row">
                  <span className="lbl">Last Modified</span>
                  <span className="val">—</span>
                </div>
              </div>
            </div>

            {/* 3. Dependencies Card */}
            <div className="td-rb-dep-card">
              <h4 className="title">DEPENDENCIES ({dependenciesCount})</h4>
              {dependenciesCount === 0 ? (
                <div className="dep-empty">
                  <p className="empty-txt">No dependencies added yet.</p>
                  <p className="sub-txt">
                    Dependencies will appear here once approval flows, tasks or milestones are selected in actions.
                  </p>
                </div>
              ) : (
                <div className="dep-items-list">
                  {actions.some((a) => a.type === "requestApproval") && (
                    <div className="dep-item">
                      <Building size={14} />
                      <span>{approvalFlowName} ({approvalFlowCode})</span>
                    </div>
                  )}
                  {actions.some((a) => a.type === "createTask") && (
                    <div className="dep-item">
                      <CheckSquare size={14} />
                      <span>Task: Commercial Review</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Tips Card */}
            <div className="td-rb-tips-card">
              <h4 className="title">TIPS</h4>
              <ul className="tips-list">
                <li>Use groups to combine conditions with AND / OR logic.</li>
                <li>Actions are executed in the order you define.</li>
                <li>You can simulate this rule using the <strong>Test Rule</strong> button.</li>
                <li>Active rules apply to all new projects created from this template.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Test Rule Simulation Modal */}
      {isTestModalOpen && (
        <TestRuleModal
          isOpen={isTestModalOpen}
          rule={currentRule}
          templateId={templateId}
          onClose={() => setIsTestModalOpen(false)}
        />
      )}
    </div>
  );
}
