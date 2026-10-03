"use client";

import React, { useState } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import {
  MockWorkflowTask,
  MockMilestone,
  MockApprovalFlow,
  MockWorkflowRule,
} from "@/lib/templates/mock-data";

type AddTargetType = "Task" | "Milestone" | "Approval" | "Rule" | "Stage";

interface WorkflowAddModalProps {
  isOpen: boolean;
  defaultType: AddTargetType;
  onClose: () => void;
  onAddTask?: (task: MockWorkflowTask) => void;
  onAddMilestone?: (milestone: MockMilestone) => void;
  onAddApproval?: (approval: MockApprovalFlow) => void;
  onAddRule?: (rule: MockWorkflowRule) => void;
  onAddStage?: (stage: any) => void;
}

export default function WorkflowAddModal({
  isOpen,
  defaultType,
  onClose,
  onAddTask,
  onAddMilestone,
  onAddApproval,
  onAddRule,
  onAddStage,
}: WorkflowAddModalProps) {
  const [targetType, setTargetType] = useState<AddTargetType>(defaultType);

  // Task form
  const [taskName, setTaskName] = useState("");
  const [taskStage, setTaskStage] = useState("01 Initiation");
  const [taskAssignee, setTaskAssignee] = useState("Project Manager");
  const [taskDuration, setTaskDuration] = useState("2 Days");
  const [taskDependency, setTaskDependency] = useState("01");
  const [taskCriticality, setTaskCriticality] = useState<"MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  // Milestone form
  const [msName, setMsName] = useState("");
  const [msSubtitle, setMsSubtitle] = useState("");
  const [msOwner, setMsOwner] = useState("Lead Designer");
  const [msDuration, setMsDuration] = useState("5 Days");
  const [msCategory, setMsCategory] = useState("Design");
  const [msApproval, setMsApproval] = useState("No Approval");

  // Approval form
  const [aprName, setAprName] = useState("");
  const [aprTrigger, setAprTrigger] = useState("Milestone Reached");
  const [aprTriggerSub, setAprTriggerSub] = useState("Stage Complete");
  const [aprSla, setAprSla] = useState("2 Business Days");
  const [aprCategory, setAprCategory] = useState("Design");

  // Rule form
  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState("Cost Variance > 5%");
  const [ruleCondition, setRuleCondition] = useState("Estimated Total > Approved BOQ");
  const [ruleAction, setRuleAction] = useState("Notify PM & Freeze BOQ Edits");
  const [ruleStage, setRuleStage] = useState("Costing");

  // Stage form
  const [stageName, setStageName] = useState("");
  const [stageOwner, setStageOwner] = useState("Design Manager");
  const [stageDuration, setStageDuration] = useState("5");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === "Task") {
      if (!taskName.trim()) return;
      onAddTask?.({
        id: `tsk-${Date.now()}`,
        name: taskName.trim(),
        stage: taskStage,
        assignee: taskAssignee,
        duration: taskDuration,
        dependency: taskDependency,
        criticality: taskCriticality,
        status: "ACTIVE",
        approval: "No",
      });
    } else if (targetType === "Milestone") {
      if (!msName.trim()) return;
      onAddMilestone?.({
        id: `ms-${Date.now()}`,
        code: `MS-00${Math.floor(Math.random() * 90 + 10)}`,
        orderNumber: "09",
        name: msName.trim(),
        subtitle: msSubtitle.trim() || "Configured project milestone",
        category: msCategory,
        ownerRole: msOwner,
        duration: msDuration,
        durationDays: 5,
        tasksCount: 4,
        deliverablesCount: 1,
        approvalType: msApproval,
        status: "CONFIGURED",
        startRule: "After Preceding Milestone",
        completionRule: "All Required Tasks Complete",
      });
    } else if (targetType === "Approval") {
      if (!aprName.trim()) return;
      onAddApproval?.({
        id: `apr-${Date.now()}`,
        code: `APR-TPL-00${Math.floor(Math.random() * 90 + 10)}`,
        name: aprName.trim(),
        category: aprCategory,
        version: "v1.0",
        description: "Custom approval rule configured for this template.",
        triggerTitle: aprTrigger,
        triggerDescription: aprTriggerSub,
        stagesCount: 1,
        mode: "Sequential",
        sla: aprSla,
        status: "ACTIVE",
        createdBy: "User",
        createdAt: "Today",
        lastUpdated: "Today",
        lastUpdatedBy: "User",
        approvers: [{ label: "PM", role: "Project Manager", color: "red" }],
        previewSteps: [
          { header: "TRIGGER", title: aprTrigger, subtitle: aprTriggerSub },
          { badge: "01", title: "Project Manager", subtitle: "Required" },
          { header: "Approved", title: "on Approval", subtitle: "Proceed to Next Stage" },
        ],
      });
    } else if (targetType === "Rule") {
      if (!ruleName.trim()) return;
      onAddRule?.({
        id: `rul-${Date.now()}`,
        code: `RUL-00${Math.floor(Math.random() * 90 + 10)}`,
        name: ruleName.trim(),
        trigger: ruleTrigger,
        condition: ruleCondition,
        action: ruleAction,
        stage: ruleStage,
        status: "ACTIVE",
        lastModified: "Today",
      });
    } else if (targetType === "Stage") {
      if (!stageName.trim()) return;
      onAddStage?.({
        id: `stg-${Date.now()}`,
        name: stageName.trim(),
        code: `STG-00${Math.floor(Math.random() * 90 + 10)}`,
        owner: stageOwner,
        duration: Number(stageDuration) || 5,
        durationUnit: "Business Days",
        tasksCount: 0,
        status: "Active",
      });
    }

    onClose();
  };

  return (
    <div className="td-modal-overlay">
      <div className="td-modal-content-milestone">
        <div className="modal-head">
          <div className="left">
            <h3>Add Workflow Item</h3>
            <div className="td-type-selector-pills">
              {(["Task", "Milestone", "Approval", "Rule", "Stage"] as const).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    className={`pill-btn ${targetType === t ? "active" : ""}`}
                    onClick={() => setTargetType(t)}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {targetType === "Task" && (
              <>
                <div className="form-group">
                  <label>Task Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3D Model Review"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Workflow Stage</label>
                  <select
                    value={taskStage}
                    onChange={(e) => setTaskStage(e.target.value)}
                    className="td-form-select"
                  >
                    <option value="01 Initiation">01 Initiation</option>
                    <option value="02 Design">02 Design</option>
                    <option value="03 Costing">03 Costing</option>
                    <option value="04 Approval">04 Approval</option>
                    <option value="05 Execution">05 Execution</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assignee Role</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="td-form-select"
                  >
                    <option value="Project Manager">Project Manager</option>
                    <option value="Site Engineer">Site Engineer</option>
                    <option value="Designer">Designer</option>
                    <option value="Client">Client</option>
                  </select>
                </div>

                <div className="td-form-row-2">
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 Days"
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(e.target.value)}
                      className="td-form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Criticality</label>
                    <select
                      value={taskCriticality}
                      onChange={(e) =>
                        setTaskCriticality(e.target.value as "MEDIUM" | "HIGH" | "CRITICAL")
                      }
                      className="td-form-select"
                    >
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {targetType === "Milestone" && (
              <>
                <div className="form-group">
                  <label>Milestone Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Civil Work Completion"
                    value={msName}
                    onChange={(e) => setMsName(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Subtitle / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Structure ready for carpentry and wiring"
                    value={msSubtitle}
                    onChange={(e) => setMsSubtitle(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="td-form-row-2">
                  <div className="form-group">
                    <label>Owner Role</label>
                    <input
                      type="text"
                      value={msOwner}
                      onChange={(e) => setMsOwner(e.target.value)}
                      className="td-form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={msDuration}
                      onChange={(e) => setMsDuration(e.target.value)}
                      className="td-form-input"
                      placeholder="e.g. 5 Days"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Approval Type</label>
                  <select
                    value={msApproval}
                    onChange={(e) => setMsApproval(e.target.value)}
                    className="td-form-select"
                  >
                    <option value="No Approval">No Approval</option>
                    <option value="Client Approval">Client Approval</option>
                    <option value="Finance Approval">Finance Approval</option>
                  </select>
                </div>
              </>
            )}

            {targetType === "Approval" && (
              <>
                <div className="form-group">
                  <label>Flow Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Site Handover Signoff"
                    value={aprName}
                    onChange={(e) => setAprName(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Trigger Event</label>
                  <input
                    type="text"
                    value={aprTrigger}
                    onChange={(e) => setAprTrigger(e.target.value)}
                    className="td-form-input"
                    placeholder="e.g. Milestone Reached"
                  />
                </div>

                <div className="td-form-row-2">
                  <div className="form-group">
                    <label>SLA</label>
                    <input
                      type="text"
                      value={aprSla}
                      onChange={(e) => setAprSla(e.target.value)}
                      className="td-form-input"
                      placeholder="e.g. 2 Business Days"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={aprCategory}
                      onChange={(e) => setAprCategory(e.target.value)}
                      className="td-form-input"
                    />
                  </div>
                </div>
              </>
            )}

            {targetType === "Rule" && (
              <>
                <div className="form-group">
                  <label>Rule Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Over-Budget Escalation"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Trigger</label>
                  <input
                    type="text"
                    value={ruleTrigger}
                    onChange={(e) => setRuleTrigger(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Condition</label>
                  <input
                    type="text"
                    value={ruleCondition}
                    onChange={(e) => setRuleCondition(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Action</label>
                  <input
                    type="text"
                    value={ruleAction}
                    onChange={(e) => setRuleAction(e.target.value)}
                    className="td-form-input"
                  />
                </div>
              </>
            )}

            {targetType === "Stage" && (
              <>
                <div className="form-group">
                  <label>Stage Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Procurement"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Stage Owner</label>
                  <input
                    type="text"
                    value={stageOwner}
                    onChange={(e) => setStageOwner(e.target.value)}
                    className="td-form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Duration (Days)</label>
                  <input
                    type="number"
                    value={stageDuration}
                    onChange={(e) => setStageDuration(e.target.value)}
                    className="td-form-input"
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Add {targetType}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
