"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Edit3,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  CornerDownRight,
  X,
  Check,
  Navigation,
  Paintbrush,
  IndianRupee,
  CalendarCheck,
  Play,
  Award,
  Package,
  Layers,
  Trash2,
  Copy,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import type {
  MockWorkflowTask,
  MockMilestone,
  MockApprovalFlow,
} from "@/lib/templates/types";

export interface WorkflowTaskItem {
  id: string;
  code?: string;
  name: string;
  assignee: string;
  assigneeRole?: string;
  duration: string;
  durationDays?: number;
  dependency: string;
  approval: "Yes" | "No";
  sla?: string;
  rateStatus?: string;
  criticality?: "MEDIUM" | "HIGH" | "CRITICAL";
  status?: string;
  stage?: string;
}

export interface WorkflowStageItem {
  id: string;
  name: string;
  code: string;
  icon?: string;
  tasksCount?: number;
  tasks?: WorkflowTaskItem[];
  status?: string;
  owner?: string;
  duration?: number;
  expectedDurationDays?: number;
  durationUnit?: string;
  description?: string;
  entryCondition?: string;
  exitCondition?: string;
  sortOrder?: number;
}

interface WorkflowStagesViewProps {
  stages: WorkflowStageItem[];
  allTasks?: MockWorkflowTask[];
  allMilestones?: MockMilestone[];
  allApprovals?: MockApprovalFlow[];
  searchQuery?: string;
  statusFilter?: string;
  onUpdateStages: (stages: WorkflowStageItem[]) => void;
  onUpdateTasks?: (tasks: MockWorkflowTask[]) => void;
  onSaveBackend?: () => Promise<void>;
  saving?: boolean;
  saveSuccess?: boolean;
  saveError?: string | null;
}

const defaultInitialStages: WorkflowStageItem[] = [
  {
    id: "stg-001",
    name: "Discovery",
    code: "STG-001",
    status: "Active",
    owner: "Project Manager",
    duration: 3,
    durationUnit: "Business Days",
    description: "Initial client briefing, site measurements, and requirements gathering.",
    entryCondition: "Project Initiation Confirmed",
    exitCondition: "Discovery Sign Off Completed",
    tasksCount: 2,
    tasks: [
      {
        id: "tsk-001",
        code: "TSK-001",
        name: "Client Briefing & Requirement",
        assignee: "Project Manager",
        duration: "1 Day",
        dependency: "Project Kickoff",
        approval: "No",
        sla: "2 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-002",
        code: "TSK-002",
        name: "Site Visit & Measurement",
        assignee: "Site Engineer",
        duration: "2 Days",
        dependency: "Client Briefing",
        approval: "No",
        sla: "3 Days",
        rateStatus: "REQUIRED",
      },
    ],
  },
  {
    id: "stg-002",
    name: "Design",
    code: "STG-002",
    status: "Active",
    owner: "Design Manager",
    duration: 12,
    durationUnit: "Business Days",
    description: "Create review and finalise the interior 2D/3D design package.",
    entryCondition: "Discovery Sign Off Completed",
    exitCondition: "Design Approval Received",
    tasksCount: 6,
    tasks: [
      {
        id: "tsk-003",
        code: "TSK-003",
        name: "Concept Design",
        assignee: "Lead Designer",
        duration: "3 Days",
        dependency: "Project Kickoff",
        approval: "No",
        sla: "5 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-004",
        code: "TSK-004",
        name: "Client Review",
        assignee: "Project Manager",
        duration: "2 Days",
        dependency: "Concept Design",
        approval: "Yes",
        sla: "3 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-005",
        code: "TSK-005",
        name: "Revisions",
        assignee: "Lead Designer",
        duration: "3 Days",
        dependency: "Client Review",
        approval: "No",
        sla: "4 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-006",
        code: "TSK-006",
        name: "Final Design",
        assignee: "Lead Designer",
        duration: "2 Days",
        dependency: "Revisions",
        approval: "No",
        sla: "3 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-007",
        code: "TSK-007",
        name: "Design Approval",
        assignee: "Client",
        duration: "2 Days",
        dependency: "Final Design",
        approval: "Yes",
        sla: "2 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-008",
        code: "TSK-008",
        name: "Design Freeze",
        assignee: "Project Manager",
        duration: "0 Days",
        dependency: "Design Approval",
        approval: "No",
        sla: "-",
        rateStatus: "REQUIRED",
      },
    ],
  },
  {
    id: "stg-003",
    name: "Costing",
    code: "STG-003",
    status: "Active",
    owner: "Estimator",
    duration: 5,
    durationUnit: "Business Days",
    description: "Prepare and finalize the detailed Bill of Quantities (BOQ) and rate analysis.",
    entryCondition: "Design Approval Received",
    exitCondition: "BOQ Approved by Client",
    tasksCount: 2,
    tasks: [
      {
        id: "tsk-009",
        code: "TSK-009",
        name: "BOQ Estimation & Rates",
        assignee: "Estimator",
        duration: "3 Days",
        dependency: "Design Freeze",
        approval: "No",
        sla: "4 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-010",
        code: "TSK-010",
        name: "Rate Verification & Vendor Check",
        assignee: "Procurement Manager",
        duration: "2 Days",
        dependency: "BOQ Estimation",
        approval: "Yes",
        sla: "3 Days",
        rateStatus: "REQUIRED",
      },
    ],
  },
  {
    id: "stg-004",
    name: "Approval",
    code: "STG-004",
    status: "Active",
    owner: "Project Manager",
    duration: 4,
    durationUnit: "Business Days",
    description: "Client formal sign-off on design, estimates, and contract agreement.",
    entryCondition: "BOQ Approved",
    exitCondition: "Contract Signed & Advance Paid",
    tasksCount: 2,
    tasks: [
      {
        id: "tsk-011",
        code: "TSK-011",
        name: "Contract Finalization",
        assignee: "Project Manager",
        duration: "2 Days",
        dependency: "Rate Verification",
        approval: "Yes",
        sla: "3 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-012",
        code: "TSK-012",
        name: "Client Advance Sign-off",
        assignee: "Client",
        duration: "2 Days",
        dependency: "Contract Finalization",
        approval: "Yes",
        sla: "2 Days",
        rateStatus: "REQUIRED",
      },
    ],
  },
  {
    id: "stg-005",
    name: "Execution",
    code: "STG-005",
    status: "Active",
    owner: "Site Engineer",
    duration: 30,
    durationUnit: "Business Days",
    description: "Site execution, material delivery, and civil / MEP / interior installation.",
    entryCondition: "Contract Signed & Site Cleared",
    exitCondition: "Snag List Completed",
    tasksCount: 3,
    tasks: [
      {
        id: "tsk-013",
        code: "TSK-013",
        name: "Material Procurement & Delivery",
        assignee: "Procurement Lead",
        duration: "10 Days",
        dependency: "Advance Received",
        approval: "No",
        sla: "12 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-014",
        code: "TSK-014",
        name: "Civil & Interior Installation",
        assignee: "Site Engineer",
        duration: "20 Days",
        dependency: "Material Delivery",
        approval: "No",
        sla: "22 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-015",
        code: "TSK-015",
        name: "Quality Audit & Snagging",
        assignee: "QA Manager",
        duration: "3 Days",
        dependency: "Interior Installation",
        approval: "Yes",
        sla: "4 Days",
        rateStatus: "REQUIRED",
      },
    ],
  },
  {
    id: "stg-006",
    name: "Handover",
    code: "STG-006",
    status: "Active",
    owner: "Project Manager",
    duration: 3,
    durationUnit: "Business Days",
    description: "Deep cleaning, joint site inspection with client, and key handover.",
    entryCondition: "Snag Clearance Completed",
    exitCondition: "Handover Certificate Signed",
    tasksCount: 2,
    tasks: [
      {
        id: "tsk-016",
        code: "TSK-016",
        name: "Final Cleaning & Inspection",
        assignee: "Site Supervisor",
        duration: "1 Day",
        dependency: "Quality Audit",
        approval: "No",
        sla: "2 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-017",
        code: "TSK-017",
        name: "Client Handover & Key Ceremony",
        assignee: "Project Manager",
        duration: "2 Days",
        dependency: "Final Cleaning",
        approval: "Yes",
        sla: "2 Days",
        rateStatus: "REQUIRED",
      },
    ],
  },
  {
    id: "stg-007",
    name: "Closure",
    code: "STG-007",
    status: "Active",
    owner: "Project Manager",
    duration: 2,
    durationUnit: "Business Days",
    description: "Final billing settlement, vendor retention release, and warranty documentation.",
    entryCondition: "Handover Certificate Signed",
    exitCondition: "Final Settlement Completed",
    tasksCount: 2,
    tasks: [
      {
        id: "tsk-018",
        code: "TSK-018",
        name: "Final Accounts & Retention Settlement",
        assignee: "Finance Lead",
        duration: "2 Days",
        dependency: "Handover Certificate",
        approval: "Yes",
        sla: "3 Days",
        rateStatus: "REQUIRED",
      },
      {
        id: "tsk-019",
        code: "TSK-019",
        name: "Warranty Document Delivery",
        assignee: "Project Manager",
        duration: "1 Day",
        dependency: "Final Accounts",
        approval: "No",
        sla: "2 Days",
        rateStatus: "REQUIRED",
      },
    ],
  },
];

function getStageIcon(name: string) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("discovery") || lower.includes("init")) {
    return <Navigation size={16} />;
  }
  if (lower.includes("design") || lower.includes("concept") || lower.includes("draw")) {
    return <Paintbrush size={16} />;
  }
  if (lower.includes("cost") || lower.includes("estimate") || lower.includes("budget") || lower.includes("boq")) {
    return <IndianRupee size={16} />;
  }
  if (lower.includes("approv") || lower.includes("review") || lower.includes("sign")) {
    return <CalendarCheck size={16} />;
  }
  if (lower.includes("execut") || lower.includes("construct") || lower.includes("build") || lower.includes("site")) {
    return <Play size={16} />;
  }
  if (lower.includes("handover") || lower.includes("deliver")) {
    return <Award size={16} />;
  }
  if (lower.includes("clos") || lower.includes("finish") || lower.includes("final")) {
    return <Package size={16} />;
  }
  return <Layers size={16} />;
}

export default function WorkflowStagesView({
  stages: propStages,
  allTasks = [],
  allMilestones = [],
  allApprovals = [],
  searchQuery = "",
  statusFilter = "All",
  onUpdateStages,
  onUpdateTasks,
  onSaveBackend,
  saving = false,
  saveSuccess = false,
  saveError = null,
}: WorkflowStagesViewProps) {
  // Normalize stages
  const stages: WorkflowStageItem[] = useMemo(() => {
    if (propStages && Array.isArray(propStages) && propStages.length > 0) {
      return propStages.map((stg, idx) => ({
        id: stg.id || stg.code || `stg-${idx + 1}`,
        name: stg.name || `Stage ${idx + 1}`,
        code: stg.code || `STG-${String(idx + 1).padStart(3, "0")}`,
        status: stg.status ? (stg.status.charAt(0).toUpperCase() + stg.status.slice(1).toLowerCase()) : "Active",
        owner: stg.owner || "Design Manager",
        duration: stg.duration ?? stg.expectedDurationDays ?? 5,
        durationUnit: stg.durationUnit || "Business Days",
        description: stg.description || "",
        entryCondition: stg.entryCondition || "",
        exitCondition: stg.exitCondition || "",
        tasksCount: stg.tasksCount,
        tasks: stg.tasks,
        sortOrder: stg.sortOrder ?? idx + 1,
      }));
    }
    return defaultInitialStages;
  }, [propStages]);

  // Selected stage id
  const [selectedStageId, setSelectedStageId] = useState<string>(() => {
    return stages[0]?.id || "stg-001";
  });

  // Keep selected stage valid when stages change
  useEffect(() => {
    if (!stages.some((s) => s.id === selectedStageId)) {
      if (stages[0]?.id) {
        setSelectedStageId(stages[0].id);
      }
    }
  }, [stages, selectedStageId]);

  const selectedStage = useMemo(() => {
    return stages.find((s) => s.id === selectedStageId) || stages[0] || defaultInitialStages[0];
  }, [stages, selectedStageId]);

  // Sidebar search filter toggle
  const [isSidebarSearchOpen, setIsSidebarSearchOpen] = useState(false);
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState("");

  // Inspector panel open/collapse state
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Inspector form state
  const [formName, setFormName] = useState(selectedStage?.name || "");
  const [formCode, setFormCode] = useState(selectedStage?.code || "");
  const [formDesc, setFormDesc] = useState(selectedStage?.description || "");
  const [formStatus, setFormStatus] = useState(selectedStage?.status || "Active");
  const [formOwner, setFormOwner] = useState(selectedStage?.owner || "Design Manager");
  const [formDuration, setFormDuration] = useState<number>(selectedStage?.duration ?? 5);
  const [formDurationUnit, setFormDurationUnit] = useState(selectedStage?.durationUnit || "Business Days");
  const [formEntryCondition, setFormEntryCondition] = useState(selectedStage?.entryCondition || "");
  const [formExitCondition, setFormExitCondition] = useState(selectedStage?.exitCondition || "");

  // Update inspector form when selected stage changes
  useEffect(() => {
    if (selectedStage) {
      setFormName(selectedStage.name || "");
      setFormCode(selectedStage.code || "");
      setFormDesc(selectedStage.description || "");
      setFormStatus(selectedStage.status || "Active");
      setFormOwner(selectedStage.owner || "Design Manager");
      setFormDuration(selectedStage.duration ?? 5);
      setFormDurationUnit(selectedStage.durationUnit || "Business Days");
      setFormEntryCondition(selectedStage.entryCondition || "");
      setFormExitCondition(selectedStage.exitCondition || "");
    }
  }, [selectedStage?.id]);

  // Tasks resolution for each stage
  const getStageTasks = (stg: WorkflowStageItem): WorkflowTaskItem[] => {
    if (stg.tasks && Array.isArray(stg.tasks) && stg.tasks.length > 0) {
      return stg.tasks;
    }
    // Match against allTasks by stage name or code
    const matching = allTasks.filter(
      (t) =>
        t.stage &&
        (t.stage.toLowerCase() === stg.name.toLowerCase() ||
          t.stage.toLowerCase() === stg.code.toLowerCase())
    );
    if (matching.length > 0) {
      return matching.map((t, idx) => ({
        id: t.id || `tsk-${idx + 1}`,
        code: t.code || `TSK-${String(idx + 1).padStart(3, "0")}`,
        name: t.name,
        assignee: t.assignee || t.assigneeRole || "Unassigned",
        duration: t.duration || (t.durationDays ? `${t.durationDays} Days` : "1 Day"),
        dependency: t.dependency || "-",
        approval: t.approval || "No",
        sla: t.sla || "-",
        rateStatus: t.rateStatus || (t.criticality ? (t.criticality === "CRITICAL" || t.criticality === "HIGH" ? "REQUIRED" : "OPTIONAL") : "REQUIRED"),
      }));
    }
    return [];
  };

  // Currently selected stage tasks
  const currentStageTasks = useMemo(() => {
    return getStageTasks(selectedStage);
  }, [selectedStage, allTasks]);

  // Overall counts for KPI Cards
  const totalStagesCount = stages.length;
  const totalTasksCount = useMemo(() => {
    let sum = 0;
    stages.forEach((s) => {
      sum += getStageTasks(s).length;
    });
    return sum > 0 ? sum : allTasks.length > 0 ? allTasks.length : 48;
  }, [stages, allTasks]);

  const totalMilestonesCount = allMilestones.length > 0 ? allMilestones.length : 6;
  const totalApprovalsCount = allApprovals.length > 0 ? allApprovals.length : 9;

  // Filtered Stages for Sidebar Outline
  const filteredStages = useMemo(() => {
    const q = (searchQuery || sidebarSearchTerm).trim().toLowerCase();
    return stages.filter((stg) => {
      if (statusFilter && statusFilter !== "All" && stg.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return (
        stg.name.toLowerCase().includes(q) ||
        stg.code.toLowerCase().includes(q) ||
        (stg.owner && stg.owner.toLowerCase().includes(q))
      );
    });
  }, [stages, searchQuery, sidebarSearchTerm, statusFilter]);

  // Filtered Tasks for Center Table
  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentStageTasks;
    return currentStageTasks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        t.dependency.toLowerCase().includes(q) ||
        (t.code && t.code.toLowerCase().includes(q))
    );
  }, [currentStageTasks, searchQuery]);

  // Pagination state for Tasks Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  // Reset page when stage or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStageId, searchQuery]);

  // Stage Action Dropdown menu
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);

  // Add / Edit Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkflowTaskItem | null>(null);
  const [taskFormName, setTaskFormName] = useState("");
  const [taskFormAssignee, setTaskFormAssignee] = useState("Lead Designer");
  const [taskFormDuration, setTaskFormDuration] = useState("3 Days");
  const [taskFormDependency, setTaskFormDependency] = useState("-");
  const [taskFormApproval, setTaskFormApproval] = useState<"Yes" | "No">("No");
  const [taskFormSla, setTaskFormSla] = useState("3 Days");
  const [taskFormRateStatus, setTaskFormRateStatus] = useState("REQUIRED");

  // Add Stage Modal state
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageCode, setNewStageCode] = useState("");
  const [newStageOwner, setNewStageOwner] = useState("Design Manager");
  const [newStageDuration, setNewStageDuration] = useState(5);
  const [newStageDurationUnit, setNewStageDurationUnit] = useState("Business Days");
  const [newStageStatus, setNewStageStatus] = useState("Active");
  const [newStageDesc, setNewStageDesc] = useState("");
  const [newStageEntryCond, setNewStageEntryCond] = useState("");
  const [newStageExitCond, setNewStageExitCond] = useState("");

  // Handle Stage Selection
  const handleSelectStage = (stg: WorkflowStageItem) => {
    setSelectedStageId(stg.id);
    setIsInspectorOpen(true);
  };

  // Save inspector form changes
  const handleApplyInspectorChanges = (overrideStatus?: string) => {
    const updatedStages = stages.map((s) => {
      if (s.id === selectedStageId) {
        return {
          ...s,
          name: formName.trim() || s.name,
          code: formCode.trim() || s.code,
          description: formDesc,
          status: overrideStatus || formStatus,
          owner: formOwner,
          duration: formDuration,
          expectedDurationDays: formDuration,
          durationUnit: formDurationUnit,
          entryCondition: formEntryCondition,
          exitCondition: formExitCondition,
        };
      }
      return s;
    });

    onUpdateStages(updatedStages);
    if (onSaveBackend) {
      onSaveBackend();
    }
  };

  // Create New Stage
  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    const nextCode = newStageCode.trim() || `STG-${String(stages.length + 1).padStart(3, "0")}`;
    const newStage: WorkflowStageItem = {
      id: `stg-${Date.now()}`,
      name: newStageName.trim(),
      code: nextCode,
      status: newStageStatus,
      owner: newStageOwner,
      duration: Number(newStageDuration) || 5,
      expectedDurationDays: Number(newStageDuration) || 5,
      durationUnit: newStageDurationUnit,
      description: newStageDesc.trim(),
      entryCondition: newStageEntryCond.trim(),
      exitCondition: newStageExitCond.trim(),
      tasksCount: 0,
      tasks: [],
      sortOrder: stages.length + 1,
    };

    const updated = [...stages, newStage];
    onUpdateStages(updated);
    setSelectedStageId(newStage.id);
    setIsAddStageModalOpen(false);

    // Reset form
    setNewStageName("");
    setNewStageCode("");
    setNewStageDesc("");
    setNewStageEntryCond("");
    setNewStageExitCond("");

    if (onSaveBackend) {
      onSaveBackend();
    }
  };

  // Duplicate Selected Stage
  const handleDuplicateStage = () => {
    setIsStageMenuOpen(false);
    const existingTasks = getStageTasks(selectedStage);
    const dupCode = `STG-${String(stages.length + 1).padStart(3, "0")}`;
    const dupStage: WorkflowStageItem = {
      ...selectedStage,
      id: `stg-${Date.now()}`,
      name: `${selectedStage.name} (Copy)`,
      code: dupCode,
      sortOrder: stages.length + 1,
      tasks: existingTasks.map((t, idx) => ({
        ...t,
        id: `tsk-${Date.now()}-${idx}`,
        code: `TSK-${String(idx + 1).padStart(3, "0")}`,
      })),
    };

    const updated = [...stages, dupStage];
    onUpdateStages(updated);
    setSelectedStageId(dupStage.id);
    if (onSaveBackend) {
      onSaveBackend();
    }
  };

  // Delete Selected Stage
  const handleDeleteStage = () => {
    setIsStageMenuOpen(false);
    if (stages.length <= 1) {
      alert("At least one stage must be maintained in the workflow.");
      return;
    }
    if (confirm(`Are you sure you want to delete the stage "${selectedStage.name}"?`)) {
      const updated = stages.filter((s) => s.id !== selectedStageId);
      onUpdateStages(updated);
      setSelectedStageId(updated[0]?.id || "");
      if (onSaveBackend) {
        onSaveBackend();
      }
    }
  };

  // Open Task Modal for Add
  const handleOpenAddTask = () => {
    setEditingTask(null);
    setTaskFormName("");
    setTaskFormAssignee("Lead Designer");
    setTaskFormDuration("2 Days");
    setTaskFormDependency(currentStageTasks.length > 0 ? currentStageTasks[currentStageTasks.length - 1].name : "-");
    setTaskFormApproval("No");
    setTaskFormSla("3 Days");
    setTaskFormRateStatus("REQUIRED");
    setIsTaskModalOpen(true);
  };

  // Open Task Modal for Edit
  const handleOpenEditTask = (task: WorkflowTaskItem) => {
    setEditingTask(task);
    setTaskFormName(task.name);
    setTaskFormAssignee(task.assignee);
    setTaskFormDuration(task.duration);
    setTaskFormDependency(task.dependency || "-");
    setTaskFormApproval(task.approval || "No");
    setTaskFormSla(task.sla || "-");
    setTaskFormRateStatus(task.rateStatus || "REQUIRED");
    setIsTaskModalOpen(true);
  };

  // Save Task (Add or Edit)
  const handleSaveTaskForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormName.trim()) return;

    const existingTasks = getStageTasks(selectedStage);

    let updatedTasks: WorkflowTaskItem[];
    if (editingTask) {
      // Edit existing
      updatedTasks = existingTasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              name: taskFormName.trim(),
              assignee: taskFormAssignee,
              duration: taskFormDuration,
              dependency: taskFormDependency,
              approval: taskFormApproval,
              sla: taskFormSla,
              rateStatus: taskFormRateStatus,
            }
          : t
      );
    } else {
      // Add new
      const newTask: WorkflowTaskItem = {
        id: `tsk-${Date.now()}`,
        code: `TSK-${String(existingTasks.length + 1).padStart(3, "0")}`,
        name: taskFormName.trim(),
        assignee: taskFormAssignee,
        duration: taskFormDuration,
        dependency: taskFormDependency,
        approval: taskFormApproval,
        sla: taskFormSla,
        rateStatus: taskFormRateStatus,
      };
      updatedTasks = [...existingTasks, newTask];
    }

    // Update stages collection
    const updatedStages = stages.map((s) => {
      if (s.id === selectedStageId) {
        return {
          ...s,
          tasks: updatedTasks,
          tasksCount: updatedTasks.length,
        };
      }
      return s;
    });

    onUpdateStages(updatedStages);
    setIsTaskModalOpen(false);

    if (onSaveBackend) {
      onSaveBackend();
    }
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to remove this task?")) {
      const existingTasks = getStageTasks(selectedStage);
      const updatedTasks = existingTasks.filter((t) => t.id !== taskId);

      const updatedStages = stages.map((s) => {
        if (s.id === selectedStageId) {
          return {
            ...s,
            tasks: updatedTasks,
            tasksCount: updatedTasks.length,
          };
        }
        return s;
      });

      onUpdateStages(updatedStages);
      if (onSaveBackend) {
        onSaveBackend();
      }
    }
  };

  return (
    <div className="td-wf-stages-wrapper">
      {/* ── 4 KPI Summary Cards for Stages (Figma Frame 2147225138) ── */}
      <div className="td-wf-kpi-grid">
        <div className="td-wf-kpi-card">
          <span className="label">Stages</span>
          <span className="val">{String(totalStagesCount).padStart(2, "0")}</span>
          <span className="sub">This quarter</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Tasks</span>
          <span className="val">{String(totalTasksCount).padStart(2, "0")}</span>
          <span className="sub">4 of 6 decided</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Milestones</span>
          <span className="val">{String(totalMilestonesCount).padStart(2, "0")}</span>
          <span className="sub">Per proposal</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Approvals</span>
          <span className="val">{String(totalApprovalsCount).padStart(2, "0")}</span>
          <span className="sub">1 expiring soon</span>
        </div>
      </div>

      {/* ── Fluid 3-Column / 2-Column Grid (Figma Frame 2147225084) ── */}
      <div className={`td-wf-content-grid ${!isInspectorOpen ? "inspector-closed" : ""}`}>
        {/* Column 1: Left Workflow Outline Sidebar (Frame 2147225071) */}
        <aside className="td-wf-outline-sidebar">
          <div className="header">
            <div className="titles">
              <span className="title">WORKFLOW OUTLINE</span>
              <span className="meta">
                {String(stages.length).padStart(2, "0")} Stages • {String(totalTasksCount).padStart(2, "0")} Tasks
              </span>
            </div>
            <button
              type="button"
              className="search-btn"
              title="Filter Stages"
              onClick={() => setIsSidebarSearchOpen(!isSidebarSearchOpen)}
            >
              <Search size={14} />
            </button>
          </div>

          {isSidebarSearchOpen && (
            <div className="sidebar-search-input-wrap">
              <input
                type="text"
                placeholder="Search stages..."
                value={sidebarSearchTerm}
                onChange={(e) => setSidebarSearchTerm(e.target.value)}
                className="sidebar-search-input"
                autoFocus
              />
              {sidebarSearchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSidebarSearchTerm("")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          <div className="stages-list">
            {filteredStages.length === 0 ? (
              <div className="empty-stages-list">
                <AlertCircle size={16} />
                <span>No matching stages</span>
              </div>
            ) : (
              filteredStages.map((stage) => {
                const isSelected = stage.id === selectedStageId;
                const stageTasks = getStageTasks(stage);
                return (
                  <div
                    key={stage.id}
                    className={`stage-row ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectStage(stage)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="left">
                      <div className="icon-box">{getStageIcon(stage.name)}</div>
                      <span className="name">{stage.name}</span>
                    </div>
                    <div className="right">
                      <span className="tasks-badge">{stageTasks.length} Tasks</span>
                      <ChevronRight size={14} className="chevron" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="footer">
            <button
              type="button"
              className="add-stage-btn"
              onClick={() => setIsAddStageModalOpen(true)}
            >
              <Plus size={15} />
              <span>Add Stage</span>
            </button>
          </div>
        </aside>

        {/* Column 2: Center Stage Tasks Table (Frame 2147225072) */}
        <section className="td-wf-center-section">
          {/* Stage Header */}
          <div className="td-wf-stage-header">
            <div className="title-col">
              <div className="name-row">
                <h3 className="stage-name">{selectedStage.name} Stage</h3>
                <span
                  className={`td-status-pill status-pill-${(selectedStage.status || "active").toLowerCase()}`}
                >
                  {(selectedStage.status || "ACTIVE").toUpperCase()}
                </span>
              </div>
              <span className="stage-meta">
                {currentStageTasks.length} Tasks • 3 Milestones • 3 Approvals
              </span>
            </div>

            <div className="stage-actions">
              <button
                type="button"
                className="td-icon-box-btn"
                title={isInspectorOpen ? "Focus Stage Details" : "Open Stage Details"}
                onClick={() => setIsInspectorOpen(true)}
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                className="td-icon-box-btn"
                title="Add Task to this Stage"
                onClick={handleOpenAddTask}
              >
                <Plus size={15} />
              </button>
              <div className="relative-inline">
                <button
                  type="button"
                  className="td-icon-box-btn"
                  title="More Options"
                  onClick={() => setIsStageMenuOpen(!isStageMenuOpen)}
                >
                  <MoreHorizontal size={15} />
                </button>

                {isStageMenuOpen && (
                  <div className="td-stage-kebab-menu">
                    <button
                      type="button"
                      className="item"
                      onClick={handleDuplicateStage}
                    >
                      <Copy size={13} />
                      <span>Duplicate Stage</span>
                    </button>
                    <button
                      type="button"
                      className="item"
                      onClick={() => {
                        setIsStageMenuOpen(false);
                        handleApplyInspectorChanges("Completed");
                      }}
                    >
                      <FileCheck size={13} />
                      <span>Mark as Completed</span>
                    </button>
                    <button
                      type="button"
                      className="item danger"
                      onClick={handleDeleteStage}
                    >
                      <Trash2 size={13} />
                      <span>Delete Stage</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks Table (10 Columns matching Figma) */}
          <div className="td-wf-table-wrap">
            <table className="td-wf-tasks-table">
              <thead>
                <tr>
                  <th style={{ width: "38px" }}></th>
                  <th style={{ width: "42px" }}>#</th>
                  <th style={{ minWidth: "170px" }}>TASK NAME</th>
                  <th style={{ minWidth: "140px" }}>OWNER / ASSIGNEE</th>
                  <th style={{ minWidth: "90px" }}>DURATION</th>
                  <th style={{ minWidth: "150px" }}>DEPENDENCY</th>
                  <th style={{ minWidth: "80px" }}>APPROVAL</th>
                  <th style={{ minWidth: "80px" }}>SLA</th>
                  <th style={{ minWidth: "100px" }}>RATE STATUS</th>
                  <th style={{ width: "44px" }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="empty-tasks-td">
                      <div className="td-wf-empty-tasks">
                        <AlertCircle size={24} className="icon" />
                        <span className="title">No tasks defined for this stage</span>
                        <p className="desc">
                          Add the operational tasks and dependencies required during the {selectedStage.name} stage.
                        </p>
                        <button
                          type="button"
                          className="td-wf-btn-add-task-empty"
                          onClick={handleOpenAddTask}
                        >
                          <Plus size={14} />
                          <span>Add Task</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={task.id || idx}>
                        <td>
                          <div className="grip-cell">
                            <GripVertical size={14} className="grip" />
                          </div>
                        </td>
                        <td>
                          <span className="seq-num">{rowNumber}</span>
                        </td>
                        <td>
                          <span
                            className="task-name-cell"
                            onClick={() => handleOpenEditTask(task)}
                            title="Click to edit task"
                          >
                            {task.name}
                          </span>
                        </td>
                        <td>
                          <span className="assignee-txt">{task.assignee}</span>
                        </td>
                        <td>
                          <span className="duration-txt">{task.duration}</span>
                        </td>
                        <td>
                          <div className="dep-cell">
                            <CornerDownRight size={13} className="dep-icon" />
                            <span className="dep-txt">{task.dependency || "-"}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`approval-badge ${task.approval === "Yes" ? "yes" : "no"}`}
                          >
                            {task.approval}
                          </span>
                        </td>
                        <td>
                          <span className="sla-txt">{task.sla || "-"}</span>
                        </td>
                        <td>
                          <span
                            className={`rate-status-pill ${
                              (task.rateStatus || "REQUIRED").toUpperCase() === "REQUIRED"
                                ? "required"
                                : "optional"
                            }`}
                          >
                            {(task.rateStatus || "REQUIRED").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="Edit Task"
                              onClick={() => handleOpenEditTask(task)}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn danger"
                              title="Delete Task"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="target-table-pagination-row">
            <div className="target-table-total-count">
              Total Tasks: {filteredTasks.length}
            </div>

            <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
              <button
                type="button"
                className="target-table-page-btn arrow"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`target-table-page-btn ${pageNum === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="target-table-page-btn arrow"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={15} />
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
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={14} className="target-table-select-arrow" />
              </div>
            </div>
          </div>
        </section>

        {/* Column 3: Right Stage Details Inspector (Frame 2147225086) */}
        {isInspectorOpen && (
          <aside className="td-wf-inspector-panel">
            <div className="header">
              <span className="title">STAGE DETAILS</span>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsInspectorOpen(false)}
                aria-label="Close inspector"
                title="Collapse Inspector"
              >
                <X size={15} />
              </button>
            </div>

            <div className="body">
              {saveSuccess && (
                <div className="td-inspector-alert success">
                  <Check size={14} />
                  <span>Changes saved to template.</span>
                </div>
              )}
              {saveError && (
                <div className="td-inspector-alert error">
                  <span>{saveError}</span>
                </div>
              )}

              <div className="td-form-group">
                <label className="td-form-label">
                  Stage Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="td-form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">
                  Stage Code <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="td-form-input"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Description</label>
                <textarea
                  className="td-form-textarea"
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Operational purpose of this workflow stage..."
                />
              </div>

              <div className="td-form-row-2">
                <div className="td-form-group">
                  <label className="td-form-label">
                    Stage Status <span className="req">*</span>
                  </label>
                  <div className="td-select-wrapper">
                    <select
                      className="td-form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Draft">Draft</option>
                    </select>
                    <ChevronDown size={14} className="td-select-chevron" />
                  </div>
                </div>

                <div className="td-form-group">
                  <label className="td-form-label">
                    Stage Owner <span className="req">*</span>
                  </label>
                  <div className="td-select-wrapper">
                    <select
                      className="td-form-select"
                      value={formOwner}
                      onChange={(e) => setFormOwner(e.target.value)}
                    >
                      <option value="Design Manager">Design Manager</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Lead Designer">Lead Designer</option>
                      <option value="Estimator">Estimator</option>
                      <option value="Site Engineer">Site Engineer</option>
                      <option value="Finance Lead">Finance Lead</option>
                      <option value="Client">Client</option>
                    </select>
                    <ChevronDown size={14} className="td-select-chevron" />
                  </div>
                </div>
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Expected Duration</label>
                <div className="td-duration-row">
                  <input
                    type="number"
                    min={0}
                    className="td-form-input num"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Math.max(0, Number(e.target.value)))}
                  />
                  <div className="td-select-wrapper unit">
                    <select
                      className="td-form-select"
                      value={formDurationUnit}
                      onChange={(e) => setFormDurationUnit(e.target.value)}
                    >
                      <option value="Business Days">Business Days</option>
                      <option value="Calendar Days">Calendar Days</option>
                      <option value="Weeks">Weeks</option>
                    </select>
                    <ChevronDown size={14} className="td-select-chevron" />
                  </div>
                </div>
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Entry Condition</label>
                <input
                  type="text"
                  className="td-form-input"
                  value={formEntryCondition}
                  onChange={(e) => setFormEntryCondition(e.target.value)}
                  placeholder="e.g. Discovery Sign Off Completed"
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Exit Condition</label>
                <input
                  type="text"
                  className="td-form-input"
                  value={formExitCondition}
                  onChange={(e) => setFormExitCondition(e.target.value)}
                  placeholder="e.g. Design Approval Received"
                />
              </div>
            </div>

            <div className="footer">
              <button
                type="button"
                className="td-btn-secondary-wf"
                onClick={() => handleApplyInspectorChanges("Draft")}
                disabled={saving}
              >
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                className="td-btn-primary-wf"
                onClick={() => handleApplyInspectorChanges()}
                disabled={saving}
              >
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Add / Edit Task Modal ── */}
      {isTaskModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div
            className="td-modal-content"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="td-modal-header">
              <h3 className="td-modal-title">
                {editingTask ? "Edit Task" : `Add Task to ${selectedStage.name}`}
              </h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setIsTaskModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTaskForm}>
              <div className="td-modal-body">
                <div className="td-form-group">
                  <label className="td-form-label">
                    Task Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="td-form-input"
                    value={taskFormName}
                    onChange={(e) => setTaskFormName(e.target.value)}
                    placeholder="e.g. Concept Design Review"
                    required
                    autoFocus
                  />
                </div>

                <div className="td-form-row-2">
                  <div className="td-form-group">
                    <label className="td-form-label">Assignee / Role</label>
                    <div className="td-select-wrapper">
                      <select
                        className="td-form-select"
                        value={taskFormAssignee}
                        onChange={(e) => setTaskFormAssignee(e.target.value)}
                      >
                        <option value="Lead Designer">Lead Designer</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Site Engineer">Site Engineer</option>
                        <option value="Estimator">Estimator</option>
                        <option value="Procurement Lead">Procurement Lead</option>
                        <option value="QA Manager">QA Manager</option>
                        <option value="Client">Client</option>
                      </select>
                      <ChevronDown size={14} className="td-select-chevron" />
                    </div>
                  </div>

                  <div className="td-form-group">
                    <label className="td-form-label">Duration</label>
                    <input
                      type="text"
                      className="td-form-input"
                      value={taskFormDuration}
                      onChange={(e) => setTaskFormDuration(e.target.value)}
                      placeholder="e.g. 3 Days"
                    />
                  </div>
                </div>

                <div className="td-form-row-2">
                  <div className="td-form-group">
                    <label className="td-form-label">Dependency</label>
                    <input
                      type="text"
                      className="td-form-input"
                      value={taskFormDependency}
                      onChange={(e) => setTaskFormDependency(e.target.value)}
                      placeholder="e.g. Concept Design"
                    />
                  </div>

                  <div className="td-form-group">
                    <label className="td-form-label">Requires Approval</label>
                    <div className="td-select-wrapper">
                      <select
                        className="td-form-select"
                        value={taskFormApproval}
                        onChange={(e) => setTaskFormApproval(e.target.value as "Yes" | "No")}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                      <ChevronDown size={14} className="td-select-chevron" />
                    </div>
                  </div>
                </div>

                <div className="td-form-row-2">
                  <div className="td-form-group">
                    <label className="td-form-label">SLA</label>
                    <input
                      type="text"
                      className="td-form-input"
                      value={taskFormSla}
                      onChange={(e) => setTaskFormSla(e.target.value)}
                      placeholder="e.g. 3 Days or -"
                    />
                  </div>

                  <div className="td-form-group">
                    <label className="td-form-label">Rate Status / Criticality</label>
                    <div className="td-select-wrapper">
                      <select
                        className="td-form-select"
                        value={taskFormRateStatus}
                        onChange={(e) => setTaskFormRateStatus(e.target.value)}
                      >
                        <option value="REQUIRED">REQUIRED</option>
                        <option value="OPTIONAL">OPTIONAL</option>
                        <option value="MILESTONE">MILESTONE</option>
                      </select>
                      <ChevronDown size={14} className="td-select-chevron" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="td-modal-footer">
                <button
                  type="button"
                  className="td-btn-secondary"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="td-btn-primary">
                  {editingTask ? "Update Task" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Stage Modal ── */}
      {isAddStageModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsAddStageModalOpen(false)}>
          <div
            className="td-modal-content"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="td-modal-header">
              <h3 className="td-modal-title">Add Workflow Stage</h3>
              <button
                type="button"
                className="td-modal-close-btn"
                onClick={() => setIsAddStageModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStage}>
              <div className="td-modal-body">
                <div className="td-form-row-2">
                  <div className="td-form-group">
                    <label className="td-form-label">
                      Stage Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="td-form-input"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="e.g. Procurement"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="td-form-group">
                    <label className="td-form-label">Stage Code</label>
                    <input
                      type="text"
                      className="td-form-input"
                      value={newStageCode}
                      onChange={(e) => setNewStageCode(e.target.value)}
                      placeholder={`STG-${String(stages.length + 1).padStart(3, "0")}`}
                    />
                  </div>
                </div>

                <div className="td-form-group">
                  <label className="td-form-label">Description</label>
                  <textarea
                    className="td-form-textarea"
                    rows={2}
                    value={newStageDesc}
                    onChange={(e) => setNewStageDesc(e.target.value)}
                    placeholder="Describe stage responsibilities..."
                  />
                </div>

                <div className="td-form-row-2">
                  <div className="td-form-group">
                    <label className="td-form-label">Stage Owner</label>
                    <div className="td-select-wrapper">
                      <select
                        className="td-form-select"
                        value={newStageOwner}
                        onChange={(e) => setNewStageOwner(e.target.value)}
                      >
                        <option value="Design Manager">Design Manager</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Lead Designer">Lead Designer</option>
                        <option value="Estimator">Estimator</option>
                        <option value="Site Engineer">Site Engineer</option>
                        <option value="Finance Lead">Finance Lead</option>
                        <option value="Client">Client</option>
                      </select>
                      <ChevronDown size={14} className="td-select-chevron" />
                    </div>
                  </div>

                  <div className="td-form-group">
                    <label className="td-form-label">Status</label>
                    <div className="td-select-wrapper">
                      <select
                        className="td-form-select"
                        value={newStageStatus}
                        onChange={(e) => setNewStageStatus(e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <ChevronDown size={14} className="td-select-chevron" />
                    </div>
                  </div>
                </div>

                <div className="td-form-group">
                  <label className="td-form-label">Expected Duration</label>
                  <div className="td-duration-row">
                    <input
                      type="number"
                      min={0}
                      className="td-form-input num"
                      value={newStageDuration}
                      onChange={(e) => setNewStageDuration(Math.max(0, Number(e.target.value)))}
                    />
                    <div className="td-select-wrapper unit">
                      <select
                        className="td-form-select"
                        value={newStageDurationUnit}
                        onChange={(e) => setNewStageDurationUnit(e.target.value)}
                      >
                        <option value="Business Days">Business Days</option>
                        <option value="Calendar Days">Calendar Days</option>
                        <option value="Weeks">Weeks</option>
                      </select>
                      <ChevronDown size={14} className="td-select-chevron" />
                    </div>
                  </div>
                </div>

                <div className="td-form-group">
                  <label className="td-form-label">Entry Condition</label>
                  <input
                    type="text"
                    className="td-form-input"
                    value={newStageEntryCond}
                    onChange={(e) => setNewStageEntryCond(e.target.value)}
                    placeholder="e.g. Previous Stage Completed"
                  />
                </div>

                <div className="td-form-group">
                  <label className="td-form-label">Exit Condition</label>
                  <input
                    type="text"
                    className="td-form-input"
                    value={newStageExitCond}
                    onChange={(e) => setNewStageExitCond(e.target.value)}
                    placeholder="e.g. Stage Sign Off Received"
                  />
                </div>
              </div>

              <div className="td-modal-footer">
                <button
                  type="button"
                  className="td-btn-secondary"
                  onClick={() => setIsAddStageModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="td-btn-primary">
                  Create Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
