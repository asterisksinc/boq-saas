"use client";

import {
    Plus,
    Search,
    ChevronDown,
    ChevronRight,
    Edit3,
    Trash2,
    MoreHorizontal,
    MoreVertical,
    X,
    Check,
    AlertCircle,
    Calendar,
    Clock,
    Flag,
    MessageSquare,
    ArrowLeft,
    Download,
    Upload,
    Filter,
    Grid2X2,
    LayoutList,
    Loader2,
    FolderKanban,
    Eye,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    Paperclip,
} from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getActivitySummary,
    listActivityStages,
    createActivityStage,
    updateActivityStage,
    deleteActivityStage,
    listActivityTasks,
    createActivityTask,
    getActivityTask,
    updateActivityTask,
    listActivityTaskComments,
    createActivityTaskComment,
    listActivityApprovals,
    createActivityApproval,
    getActivityApproval,
    updateActivityApproval,
    decideActivityApproval,
    listActivityApprovalComments,
    createActivityApprovalComment,
} from "@/lib/api/auth";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";

type ActivityStage = {
    id: string;
    name: string;
    color: string | null;
    sortOrder: number;
    terminalType: "completed" | "lost" | null;
    createdAt: string;
    updatedAt: string;
};

type ActivityTask = {
    id: string;
    projectId: string;
    stageId: string;
    name: string;
    description: string | null;
    assignedTo: string | null;
    ownerId: string | null;
    dueDate: string | null;
    priority: "low" | "medium" | "high" | "critical";
    status: "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
    attachments: Record<string, unknown>[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    project?: { projectCode: string | null; name: string };
    stage?: { name: string; color: string | null };
};

type ActivityApproval = {
    id: string;
    projectId: string;
    stageId: string;
    name: string;
    description: string | null;
    approverId: string | null;
    approverName: string | null;
    approverRole?: string | null;
    dueDate: string;
    status: "draft" | "sent" | "in_review" | "approved" | "changes_required" | "rejected" | "cancelled";
    requestedAt: string | null;
    decidedAt: string | null;
    attachments: Record<string, unknown>[];
    requestedBy: string;
    requesterName?: string | null;
    customDueSubtext?: string | null;
    createdAt: string;
    updatedAt: string;
    project?: { projectCode: string | null; name: string };
    stage?: { name: string; color: string | null };
};

type ActivityComment = {
    id: string;
    entityType: "task" | "approval";
    entityId: string;
    body: string;
    attachments: Record<string, unknown>[];
    authorId: string;
    createdAt: string;
};

type ActivitySummary = {
    stages: number;
    tasks: {
        total: number;
        overdue: number;
        inProgress: number;
        completed: number;
    };
    approvals: {
        total: number;
        overdue: number;
        inReview: number;
        approved: number;
    };
};

type StageForm = { name: string; color: string; terminalType: "completed" | "lost" | "" };
type TaskForm = {
    name: string;
    projectId: string;
    stageId: string;
    description: string;
    ownerId: string;
    dueDate: string;
    priority: "low" | "medium" | "high" | "critical";
    status: "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
};
type ApprovalForm = {
    name: string;
    projectId: string;
    stageId: string;
    description: string;
    approverId: string;
    approverName: string;
    dueDate: string;
    status: "draft" | "sent" | "in_review";
};

type TeamMember = {
    id: string;
    name: string;
    role?: string;
};

type ProjectItem = {
    id: string;
    projectCode: string | null;
    name: string;
    clientName: string;
    projectType?: string;
    status: string;
    projectValue?: number | null;
    approvedBudget?: number | null;
    startDate?: string | null;
    targetCompletionDate?: string | null;
    assignedDesignerId?: string | null;
    tags?: string[];
    designerName?: string;
};

const blankStage: StageForm = { name: "", color: "#2563eb", terminalType: "" };
const blankTask: TaskForm = { name: "", projectId: "", stageId: "", description: "", ownerId: "", dueDate: "", priority: "medium", status: "not_started" };
const blankApproval: ApprovalForm = { name: "", projectId: "", stageId: "", description: "", approverId: "", approverName: "", dueDate: "", status: "draft" };

const today = () => new Date().toISOString().slice(0, 10);
const money = (n?: number | null) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const formatCardDate = (x?: string | null) => {
    if (!x) return "—";
    try {
        const d = new Date(x.includes("T") ? x : `${x}T00:00:00`);
        return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(d);
    } catch {
        return "—";
    }
};
const getInitials = (name?: string | null) => {
    if (!name) return "—";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function ActivitiesPage() {
    const router = useRouter();
    const [stages, setStages] = useState<ActivityStage[]>([]);
    const [loadingStages, setLoadingStages] = useState(true);
    const [stageQuery, setStageQuery] = useState("");
    const [stageFilter, setStageFilter] = useState("all");
    const [stageMenu, setStageMenu] = useState<string | null>(null);
    const [createStage, setCreateStage] = useState(false);
    const [editStage, setEditStage] = useState<ActivityStage | null>(null);
    const [stageForm, setStageForm] = useState<StageForm>(blankStage);
    const [stageError, setStageError] = useState("");

    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    const [tasks, setTasks] = useState<ActivityTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [taskQuery, setTaskQuery] = useState("");
    const [taskFilter, setTaskFilter] = useState("all");
    const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");
    const [taskFilterOpen, setTaskFilterOpen] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [taskPage, setTaskPage] = useState(1);
    const [taskPageSize, setTaskPageSize] = useState(10);
    const [taskMenu, setTaskMenu] = useState<string | null>(null);
    const [createTask, setCreateTask] = useState(false);
    const [taskDetail, setTaskDetail] = useState<ActivityTask | null>(null);
    const [taskForm, setTaskForm] = useState<TaskForm>(blankTask);
    const [taskProjects, setTaskProjects] = useState<Array<{ id: string; name: string; projectCode: string | null }>>([]);
    const [taskStages, setTaskStages] = useState<ActivityStage[]>([]);
    const [taskError, setTaskError] = useState("");
    const [taskComments, setTaskComments] = useState<ActivityComment[]>([]);
    const [taskCommentText, setTaskCommentText] = useState("");
    const [sendingTaskComment, setSendingTaskComment] = useState(false);

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [taskAttachments, setTaskAttachments] = useState<Array<{ name: string; size: number; type: string }>>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [approvals, setApprovals] = useState<ActivityApproval[]>([]);
    const [loadingApprovals, setLoadingApprovals] = useState(true);
    const [approvalQuery, setApprovalQuery] = useState("");
    const [approvalFilter, setApprovalFilter] = useState("all");
    const [approvalFilterOpen, setApprovalFilterOpen] = useState(false);
    const [approvalPage, setApprovalPage] = useState(1);
    const [approvalPageSize, setApprovalPageSize] = useState(10);
    const [approvalMenu, setApprovalMenu] = useState<string | null>(null);
    const [createApproval, setCreateApproval] = useState(false);
    const [approvalDetail, setApprovalDetail] = useState<ActivityApproval | null>(null);
    const [approvalForm, setApprovalForm] = useState<ApprovalForm>(blankApproval);
    const [approvalProjects, setApprovalProjects] = useState<Array<{ id: string; name: string; projectCode: string | null }>>([]);
    const [approvalStages, setApprovalStages] = useState<ActivityStage[]>([]);
    const [approvalError, setApprovalError] = useState("");
    const [approvalComments, setApprovalComments] = useState<ActivityComment[]>([]);
    const [approvalCommentText, setApprovalCommentText] = useState("");
    const [sendingApprovalComment, setSendingApprovalComment] = useState(false);
    const [approvalAttachments, setApprovalAttachments] = useState<Array<{ name: string; size: number; type: string }>>([]);
    const [isApprovalDragging, setIsApprovalDragging] = useState(false);
    const approvalFileInputRef = useRef<HTMLInputElement>(null);

    const [feedbackAttachment, setFeedbackAttachment] = useState<{ name: string; size: number; type: string; url?: string } | null>(null);
    const feedbackFileInputRef = useRef<HTMLInputElement>(null);

    const handleFeedbackFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const f = files[0];
        setFeedbackAttachment({
            name: f.name,
            size: f.size,
            type: f.type || "application/octet-stream",
        });
    };

    const removeFeedbackAttachment = () => {
        setFeedbackAttachment(null);
        if (feedbackFileInputRef.current) {
            feedbackFileInputRef.current.value = "";
        }
    };

    const approverOptions = useMemo(() => {
        return [
            ...teamMembers.map(m => ({ id: m.id, name: m.name, role: m.role || "Team" })),
        ];
    }, [teamMembers]);

    const handleApprovalFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files).map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
        }));
        setApprovalAttachments(prev => [...prev, ...newFiles]);
    };

    const handleApprovalDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsApprovalDragging(true);
    };

    const handleApprovalDragLeave = () => {
        setIsApprovalDragging(false);
    };

    const handleApprovalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsApprovalDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleApprovalFileSelect(e.dataTransfer.files);
        }
    };

    const removeApprovalAttachment = (index: number) => {
        setApprovalAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const [activeTab, setActiveTab] = useState<"stages" | "tasks" | "approvals">("stages");
    const [headerSearch, setHeaderSearch] = useState("");
    const [notice, setNotice] = useState<string | null>(null);

    const [filterOpen, setFilterOpen] = useState(false);
    const [filterOnlyOverdue, setFilterOnlyOverdue] = useState(false);
    const [filterOnlyPendingApproval, setFilterOnlyPendingApproval] = useState(false);

    const [cardMenu, setCardMenu] = useState<string | null>(null);
    const [userInitials, setUserInitials] = useState("BO");
    const [userAvatar, setUserAvatar] = useState<string | null>(null);

    const loadStages = useCallback(async () => {
        setLoadingStages(true);
        try {
            const data = await listActivityStages();
            if (data.items && data.items.length > 0) {
                setStages(data.items);
            } else setStages([]);
        } catch {
            setStages([]);
            setNotice("Could not load activity stages");
        } finally {
            setLoadingStages(false);
        }
    }, []);

    const loadProjects = useCallback(async () => {
        setLoadingProjects(true);
        try {
            const res = await fetch("/api/v1/projects?pageSize=100&sortBy=updatedAt&sortOrder=desc", { credentials: "include" });
            const data = await res.json();
            if (res.ok && data.data?.items && data.data.items.length > 0) {
                const mapped: ProjectItem[] = data.data.items.map((p: any) => ({
                    id: p.id,
                    projectCode: p.projectCode || null,
                    name: p.name,
                    clientName: p.clientName || "Client",
                    projectType: p.projectType,
                    status: p.status,
                    projectValue: p.projectValue,
                    approvedBudget: p.approvedBudget,
                    startDate: p.startDate,
                    targetCompletionDate: p.targetCompletionDate,
                    assignedDesignerId: p.assignedDesignerId,
                    tags: p.tags || [],
                    designerName: undefined,
                }));
                setProjects(mapped);
                setTaskProjects(mapped.map(p => ({ id: p.id, name: p.name, projectCode: p.projectCode })));
                setApprovalProjects(mapped.map(p => ({ id: p.id, name: p.name, projectCode: p.projectCode })));
            } else {
                setProjects([]);
                setTaskProjects([]);
                setApprovalProjects([]);
            }
        } catch {
            setProjects([]);
            setTaskProjects([]);
            setApprovalProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    }, []);

    const mapTask = useCallback((t: any): ActivityTask => ({
        id: t.id,
        projectId: t.projectId || t.project_id || "",
        stageId: t.stageId || t.stage_id || "",
        name: t.name || "",
        description: t.description || null,
        assignedTo: t.assignedTo || t.assigned_to || null,
        ownerId: t.ownerId || t.owner_id || null,
        dueDate: t.dueDate || t.due_date || null,
        priority: t.priority || "medium",
        status: t.status || "not_started",
        attachments: t.attachments || [],
        createdBy: t.createdBy || t.created_by || "",
        createdAt: t.createdAt || t.created_at || "",
        updatedAt: t.updatedAt || t.updated_at || "",
        project: t.project || (t.projects ? { name: t.projects.name, projectCode: t.projects.project_code || t.projects.projectCode } : undefined),
        stage: t.stage || (t.activity_stages ? { name: t.activity_stages.name, color: t.activity_stages.color } : undefined),
    }), []);

    const mapApproval = useCallback((a: any): ActivityApproval => ({
        id: a.id,
        projectId: a.projectId || a.project_id || "",
        stageId: a.stageId || a.stage_id || "",
        name: a.name || "",
        description: a.description || null,
        approverId: a.approverId || a.approver_id || null,
        approverName: a.approverName || a.approver_name || null,
        dueDate: a.dueDate || a.due_date || "",
        status: a.status || "draft",
        attachments: a.attachments || [],
        requestedBy: a.requestedBy || a.requested_by || "",
        requestedAt: a.requestedAt || a.requested_at || "",
        decidedAt: a.decidedAt || a.decided_at || null,
        createdAt: a.createdAt || a.created_at || "",
        updatedAt: a.updatedAt || a.updated_at || "",
        project: a.project || (a.projects ? { name: a.projects.name, projectCode: a.projects.project_code || a.projects.projectCode } : undefined),
        stage: a.stage || (a.activity_stages ? { name: a.activity_stages.name, color: a.activity_stages.color } : undefined),
    }), []);

    const loadTasks = useCallback(async () => {
        setLoadingTasks(true);
        try {
            const data = await listActivityTasks({ pageSize: 100 });
            const serverItems = (data.items || []).map(mapTask);
            setTasks(serverItems);
        } catch {
            setNotice("Could not load tasks");
        } finally {
            setLoadingTasks(false);
        }
    }, [mapTask]);

    const loadApprovals = useCallback(async () => {
        setLoadingApprovals(true);
        try {
            const data = await listActivityApprovals({ pageSize: 100 });
            const serverItems = (data.items || []).map(mapApproval);
            setApprovals(serverItems);
        } catch {
            setNotice("Could not load approvals");
        } finally {
            setLoadingApprovals(false);
        }
    }, [mapApproval]);

    const loadStagesForForms = useCallback(async () => {
        try {
            const data = await listActivityStages();
            const items = data.items || [];
            setTaskStages(items);
            setApprovalStages(items);
        } catch {
            setTaskStages([]);
            setApprovalStages([]);
            setNotice("Could not load activity stages");
        }
    }, []);

    const loadUserProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/users/me", { credentials: "include" });
            const json = await res.json();
            if (res.ok && json.data) {
                const name = json.data.displayName || json.data.email || "BO";
                const parts = name.trim().split(/\s+/);
                const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
                setUserInitials(initials);
                if (json.data.avatarUrl) setUserAvatar(json.data.avatarUrl);
                if (json.data.id) {
                    setTeamMembers(prev => {
                        const exists = prev.some(m => m.id === json.data.id);
                        if (exists) return prev;
                        return [{ id: json.data.id, name: `${json.data.displayName || json.data.email} (You)` }, ...prev];
                    });
                }
            }
        } catch { }
    }, []);

    useEffect(() => {
        loadStages();
        loadProjects();
        loadTasks();
        loadApprovals();
        loadStagesForForms();
        loadUserProfile();
    }, [loadStages, loadProjects, loadTasks, loadApprovals, loadStagesForForms, loadUserProfile]);

    useEffect(() => {
        const close = () => {
            setStageMenu(null);
            setTaskMenu(null);
            setApprovalMenu(null);
            setCardMenu(null);
            setFilterOpen(false);
            setTaskFilterOpen(false);
            setApprovalFilterOpen(false);
        };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    const filteredStages = useMemo(() => {
        return stages.filter(s => {
            if (stageQuery && !s.name.toLowerCase().includes(stageQuery.toLowerCase())) {
                return false;
            }
            if (stageFilter === "all") {
                return !s.terminalType;
            }
            if (stageFilter === "completed") {
                return s.terminalType === "completed";
            }
            if (stageFilter === "lost") {
                return s.terminalType === "lost";
            }
            return true;
        });
    }, [stages, stageQuery, stageFilter]);

    const isOverdue = (dueDate: string | null | undefined, status: string, type: "task" | "approval") => {
        if (!dueDate) return false;
        const todayStr = new Date().toISOString().slice(0, 10);
        if (type === "task") return dueDate < todayStr && !["completed", "cancelled"].includes(status);
        return dueDate < todayStr && !["approved", "rejected", "cancelled", "changes_required"].includes(status);
    };

    const formatTableDate = (x?: string | null) => {
        if (!x) return "—";
        try {
            const d = new Date(x.includes("T") ? x : `${x}T00:00:00`);
            const day = d.getDate().toString().padStart(2, "0");
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            const month = months[d.getMonth()] || "Sept";
            const year = d.getFullYear();
            return `${day} ${month} ${year}`;
        } catch {
            return x;
        }
    };

    const formatDateTime = (x?: string | null) => {
        if (!x) return "05 Aug 2026, 10:30 AM";
        try {
            const d = new Date(x.includes("T") ? x : `${x}T00:00:00`);
            const day = d.getDate().toString().padStart(2, "0");
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            const month = months[d.getMonth()] || "Aug";
            const year = d.getFullYear();
            let hours = d.getHours();
            const minutes = d.getMinutes().toString().padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12;
            const formattedHours = hours.toString().padStart(2, "0");
            return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
        } catch {
            return x;
        }
    };

    const formatTimeOnly = (x?: string | null) => {
        if (!x) return "04:15 PM";
        try {
            const d = new Date(x.includes("T") ? x : `${x}T00:00:00`);
            let hours = d.getHours();
            const minutes = d.getMinutes().toString().padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12;
            const formattedHours = hours.toString().padStart(2, "0");
            return `${formattedHours}:${minutes} ${ampm}`;
        } catch {
            return "04:15 PM";
        }
    };

    const handleDownloadAttachment = (file: { name: string; url?: string }) => {
        try {
            if (file.url) {
                const a = document.createElement("a");
                a.href = file.url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                const blob = new Blob([`Attachment: ${file.name}\nDownloaded from BOQ SaaS Activities`], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            setNotice(`Downloading "${file.name}"...`);
        } catch {
            setNotice(`Could not download "${file.name}"`);
        }
    };

    const DownloadSvg = () => (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.25 14.25H15.75V15.75H2.25V14.25ZM9.75 9.8787L14.3033 5.32538L15.364 6.38604L9 12.75L2.63604 6.38604L3.6967 5.32538L8.25 9.8787V1.5H9.75V9.8787Z" fill="#1C1B1F"/>
        </svg>
    );

    const getStagePillStyle = (stageName?: string) => {
        const lower = (stageName || "").toLowerCase();
        if (lower.includes("design")) {
            return { background: "#eff6ff", color: "#2563eb" };
        }
        if (lower.includes("execution") || lower.includes("build")) {
            return { background: "#f5f3ff", color: "#9333ea" };
        }
        if (lower.includes("initiat") || lower.includes("plan")) {
            return { background: "#f0fdf4", color: "#16a34a" };
        }
        if (lower.includes("estimat") || lower.includes("budget")) {
            return { background: "#fefce8", color: "#ca8a04" };
        }
        if (lower.includes("approv") || lower.includes("review")) {
            return { background: "#fff7ed", color: "#ea580c" };
        }
        return { background: "#f1f5f9", color: "#475569" };
    };

    const getProjectName = (projectId?: string | null): string => {
        if (!projectId) return "—";
        const proj = projects.find(p => p.id === projectId);
        return proj?.name || "—";
    };

    const getProjectCode = (projectId?: string | null): string => {
        if (!projectId) return "—";
        const proj = projects.find(p => p.id === projectId);
        return proj?.projectCode || "—";
    };

    const getStageName = (stageId?: string | null): string => {
        if (!stageId) return "Design";
        const stage = stages.find(s => s.id === stageId);
        return stage ? stage.name : "Design";
    };

    const getAssigneeName = useCallback((task: ActivityTask): string => {
        if (task.assignedTo) {
            const found = teamMembers.find(m => m.id === task.assignedTo || m.name.toLowerCase() === task.assignedTo?.toLowerCase());
            if (found) return found.name;
            return task.assignedTo;
        }
        if (task.ownerId) {
            const found = teamMembers.find(m => m.id === task.ownerId || m.name.toLowerCase() === task.ownerId?.toLowerCase());
            if (found) return found.name;
            return task.ownerId;
        }
        return "—";
    }, [teamMembers]);

    const getAssigneeInitials = (name: string): string => {
        if (!name) return "RS";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getDueSubtext = (task: ActivityTask & { customDueSubtext?: string }) => {
        if (task.status === "completed") {
            return { text: "Completed", className: "completed" };
        }
        if (task.customDueSubtext) {
            const isOv = task.customDueSubtext.toLowerCase().includes("overdue");
            return { text: task.customDueSubtext, className: isOv ? "overdue" : "soon" };
        }
        if (!task.dueDate) {
            return { text: "—", className: "soon" };
        }
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate.includes("T") ? task.dueDate : `${task.dueDate}T00:00:00`);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.round((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            const abs = Math.abs(diffDays);
            return { text: `${abs} Day${abs > 1 ? "s" : ""} Overdue`, className: "overdue" };
        } else if (diffDays === 0) {
            return { text: "Due today", className: "overdue" };
        } else {
            return { text: `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`, className: "soon" };
        }
    };

    const kpiStats = useMemo(() => {
        const total = tasks.length;
        const overdue = tasks.filter(t => {
            if ((t as any).customDueSubtext?.toLowerCase().includes("overdue")) return true;
            return isOverdue(t.dueDate, t.status, "task");
        }).length;
        const inProgress = tasks.filter(t => t.status === "in_progress").length;
        const completed = tasks.filter(t => t.status === "completed").length;
        return { total, overdue, inProgress, completed };
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (taskQuery.trim()) {
                const q = taskQuery.toLowerCase();
                const nameMatch = t.name.toLowerCase().includes(q);
                const descMatch = t.description?.toLowerCase().includes(q);
                const projMatch = (t.project?.name || "").toLowerCase().includes(q) || (t.project?.projectCode || "").toLowerCase().includes(q);
                const stageMatch = (t.stage?.name || "").toLowerCase().includes(q);
                const assigneeName = getAssigneeName(t).toLowerCase();
                const assigneeMatch = assigneeName.includes(q);
                if (!nameMatch && !descMatch && !projMatch && !stageMatch && !assigneeMatch) return false;
            }
            if (taskFilter !== "all" && t.status !== taskFilter) return false;
            if (taskPriorityFilter !== "all" && t.priority !== taskPriorityFilter) return false;
            return true;
        });
    }, [tasks, taskQuery, taskFilter, taskPriorityFilter, getAssigneeName]);

    const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / taskPageSize));
    const paginatedTasks = useMemo(() => {
        const start = (taskPage - 1) * taskPageSize;
        return filteredTasks.slice(start, start + taskPageSize);
    }, [filteredTasks, taskPage, taskPageSize]);

    const toggleSelectAll = useCallback(() => {
        const pageIds = paginatedTasks.map(t => t.id);
        const allSelected = pageIds.length > 0 && pageIds.every(id => selectedTaskIds.includes(id));
        if (allSelected) {
            setSelectedTaskIds(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            setSelectedTaskIds(prev => Array.from(new Set([...prev, ...pageIds])));
        }
    }, [paginatedTasks, selectedTaskIds]);

    const toggleSelectTask = useCallback((id: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const getApprovalDueSubtext = (approval: ActivityApproval) => {
        if (approval.status === "approved") {
            return { text: approval.customDueSubtext || "Approved", className: "approved", isOverdue: false };
        }
        if (approval.customDueSubtext) {
            const isOv = approval.customDueSubtext.toLowerCase().includes("overdue");
            return { text: approval.customDueSubtext, className: isOv ? "overdue" : "soon", isOverdue: isOv };
        }
        if (!approval.dueDate) {
            return { text: "—", className: "soon", isOverdue: false };
        }
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const dueDate = new Date(approval.dueDate.includes("T") ? approval.dueDate : `${approval.dueDate}T00:00:00`);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.round((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            const abs = Math.abs(diffDays);
            return { text: `${abs} day${abs > 1 ? "s" : ""} overdue`, className: "overdue", isOverdue: true };
        } else if (diffDays === 0) {
            return { text: "Due today", className: "overdue", isOverdue: true };
        } else {
            return { text: `in ${diffDays} day${diffDays > 1 ? "s" : ""}`, className: "soon", isOverdue: false };
        }
    };

    const approvalKpiStats = useMemo(() => {
        const total = approvals.length;
        const overdue = approvals.filter(a => {
            if ((a as any).customDueSubtext?.toLowerCase().includes("overdue")) return true;
            return isOverdue(a.dueDate, a.status, "approval");
        }).length;
        const inReview = approvals.filter(a => a.status === "in_review").length;
        const approved = approvals.filter(a => a.status === "approved").length;
        return { total, overdue, inReview, approved };
    }, [approvals]);

    const filteredApprovals = useMemo(() => approvals.filter(a => {
        if (approvalQuery.trim()) {
            const q = approvalQuery.toLowerCase();
            const nameMatch = a.name.toLowerCase().includes(q);
            const projName = a.project?.name || getProjectName(a.projectId);
            const projMatch = projName.toLowerCase().includes(q);
            const approverMatch = (a.approverName || "").toLowerCase().includes(q);
            const reqMatch = (a.requesterName || "").toLowerCase().includes(q);
            const stageName = a.stage?.name || getStageName(a.stageId);
            const stageMatch = stageName.toLowerCase().includes(q);
            if (!nameMatch && !projMatch && !approverMatch && !reqMatch && !stageMatch) return false;
        }
        if (approvalFilter !== "all" && a.status !== approvalFilter) return false;
        return true;
    }), [approvals, approvalQuery, approvalFilter, projects, stages]);

    const totalApprovalPages = Math.max(1, Math.ceil(filteredApprovals.length / approvalPageSize));
    const paginatedApprovals = useMemo(() => {
        const start = (approvalPage - 1) * approvalPageSize;
        return filteredApprovals.slice(start, start + approvalPageSize);
    }, [filteredApprovals, approvalPage, approvalPageSize]);

    const getProjectsForStage = useCallback((stage: ActivityStage): ProjectItem[] => {
        return projects.filter(p => {
            const hasTaskInStage = tasks.some(t => t.projectId === p.id && t.stageId === stage.id);
            const hasApprovalInStage = approvals.some(a => a.projectId === p.id && a.stageId === stage.id);
            const hasStageTag = p.tags?.some(tag =>
                tag === `stage:${stage.id}` ||
                tag.toLowerCase() === `stage:${stage.name.toLowerCase()}`
            );

            let belongs = hasTaskInStage || hasApprovalInStage || hasStageTag;

            if (!belongs && (!p.tags || !p.tags.some(t => t.startsWith("stage:")))) {
                const stageName = stage.name.toLowerCase();
                if (stageName.includes("initiat") && (p.status === "planning" || p.status === "active")) belongs = true;
                else if (stageName.includes("design") && p.status === "in_progress") belongs = true;
                else if (stageName.includes("estimat") && p.status === "active") belongs = true;
                else if (stageName.includes("approv") && p.status === "on_hold") belongs = true;
                else if (stages.indexOf(stage) === 0) belongs = true;
            }

            if (!belongs) return false;

            if (filterOnlyOverdue) {
                const overdueCount = tasks.filter(t => t.projectId === p.id && t.stageId === stage.id && isOverdue(t.dueDate, t.status, "task")).length;
                if (overdueCount === 0) return false;
            }

            if (filterOnlyPendingApproval) {
                const pendingCount = approvals.filter(a => a.projectId === p.id && a.stageId === stage.id && ["draft", "sent", "in_review"].includes(a.status)).length;
                if (pendingCount === 0) return false;
            }

            return true;
        });
    }, [projects, tasks, approvals, stages, filterOnlyOverdue, filterOnlyPendingApproval]);

    const moveProjectToStage = async (project: ProjectItem, targetStage: ActivityStage) => {
        try {
            const cleanTags = (project.tags || []).filter(t => !t.startsWith("stage:"));
            const newTags = [...cleanTags, `stage:${targetStage.id}`];

            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, tags: newTags } : p));

            const response = await fetch(`/api/v1/projects/${project.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });
            if (!response.ok) throw new Error("Project stage update failed");
            setNotice(`Moved "${project.name}" to ${targetStage.name}`);
        } catch {
            setNotice("Could not update project stage");
        }
    };

    const handleStageSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStageError("");
        try {
            if (editStage) {
                await updateActivityStage(editStage.id, { name: stageForm.name, color: stageForm.color || null, terminalType: stageForm.terminalType || null });
            } else {
                await createActivityStage({ name: stageForm.name, color: stageForm.color || null, terminalType: stageForm.terminalType || null });
            }
            setCreateStage(false);
            setEditStage(null);
            setStageForm(blankStage);
            loadStages();
        } catch (e: any) {
            setStageError(e.message || "Could not save stage");
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const newItems: Array<{ name: string; size: number; type: string }> = [];
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            newItems.push({
                name: f.name,
                size: f.size,
                type: f.type || "application/octet-stream"
            });
        }
        setTaskAttachments(prev => [...prev, ...newItems]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer && e.dataTransfer.files) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const removeAttachment = (index: number) => {
        setTaskAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const isUuid = (str?: string | null) => {
        if (!str) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    };

    const handleTaskSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTaskError("");
        if (!taskForm.name.trim() || !taskForm.projectId || !taskForm.stageId) {
            setTaskError("Task Name, Project, and Stage are required.");
            return;
        }

        const sanitizedPayload: any = {
            name: taskForm.name.trim(),
            projectId: taskForm.projectId,
            stageId: taskForm.stageId,
            description: taskForm.description?.trim() || null,
            priority: taskForm.priority || "medium",
            status: taskForm.status || "not_started",
            attachments: taskAttachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
        };

        if (isUuid(taskForm.ownerId)) {
            sanitizedPayload.ownerId = taskForm.ownerId;
        } else {
            sanitizedPayload.ownerId = null;
        }

        if (taskForm.dueDate) {
            sanitizedPayload.dueDate = taskForm.dueDate;
        } else {
            sanitizedPayload.dueDate = null;
        }

        try {
            let savedTask: ActivityTask | null = null;
            if (isUuid(taskForm.projectId) && isUuid(taskForm.stageId)) {
                try {
                    if (taskDetail) {
                        savedTask = await updateActivityTask(taskDetail.id, sanitizedPayload);
                    } else {
                        savedTask = await createActivityTask(sanitizedPayload);
                    }
                } catch {
                    // Handled below if backend database validation fails on unseeded IDs
                }
            }

            if (savedTask) {
                const mapped = mapTask(savedTask);
                if (!mapped.project && taskProjects.length) {
                    const p = taskProjects.find(pr => pr.id === mapped.projectId);
                    if (p) mapped.project = { name: p.name, projectCode: p.projectCode };
                }
                if (!mapped.stage && taskStages.length) {
                    const s = taskStages.find(st => st.id === mapped.stageId);
                    if (s) mapped.stage = { name: s.name, color: s.color };
                }
                setTasks(prev => {
                    const exists = prev.some(t => t.id === mapped.id);
                    if (exists) return prev.map(t => t.id === mapped.id ? mapped : t);
                    return [mapped, ...prev];
                });
                loadTasks();
            } else {
                const selectedProject = taskProjects.find(p => p.id === taskForm.projectId);
                const selectedStage = taskStages.find(s => s.id === taskForm.stageId);
                const newTask: ActivityTask = {
                    id: taskDetail ? taskDetail.id : `task-${Date.now()}`,
                    projectId: taskForm.projectId,
                    stageId: taskForm.stageId,
                    name: taskForm.name.trim(),
                    description: taskForm.description?.trim() || null,
                    assignedTo: null,
                    ownerId: taskForm.ownerId || null,
                    dueDate: taskForm.dueDate || null,
                    priority: taskForm.priority || "medium",
                    status: taskForm.status || "not_started",
                    attachments: taskAttachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
                    createdBy: taskDetail ? taskDetail.createdBy : "user-current",
                    createdAt: taskDetail ? taskDetail.createdAt : new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    project: selectedProject ? { name: selectedProject.name, projectCode: selectedProject.projectCode } : undefined,
                    stage: selectedStage ? { name: selectedStage.name, color: selectedStage.color } : undefined,
                };

                if (taskDetail) {
                    setTasks(prev => prev.map(t => t.id === taskDetail.id ? newTask : t));
                } else {
                    setTasks(prev => [newTask, ...prev]);
                }
            }

            setCreateTask(false);
            setTaskDetail(null);
            setTaskForm(blankTask);
            setTaskAttachments([]);
            setActiveTab("tasks");
            setNotice(taskDetail ? "Task updated successfully." : "Task created successfully.");
        } catch (e: any) {
            setTaskError(e.message || "Could not save task");
        }
    };

    const handleApprovalSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setApprovalError("");
        if (!approvalForm.name || !approvalForm.projectId || !approvalForm.stageId || !approvalForm.dueDate || (!approvalForm.approverId && !approvalForm.approverName)) {
            setApprovalError("Name, project, stage, due date, and approver are required");
            return;
        }

        const sanitizedPayload: any = {
            name: approvalForm.name.trim(),
            projectId: approvalForm.projectId,
            stageId: approvalForm.stageId,
            dueDate: approvalForm.dueDate,
            status: approvalForm.status || "draft",
            description: approvalForm.description?.trim() || null,
            attachments: approvalAttachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
        };

        if (approvalForm.approverId && isUuid(approvalForm.approverId)) {
            sanitizedPayload.approverId = approvalForm.approverId;
        } else {
            sanitizedPayload.approverId = null;
        }

        if (approvalForm.approverName) {
            sanitizedPayload.approverName = approvalForm.approverName.trim();
        } else {
            sanitizedPayload.approverName = null;
        }

        try {
            let savedApproval: ActivityApproval | null = null;
            if (isUuid(approvalForm.projectId) && isUuid(approvalForm.stageId)) {
                try {
                    if (approvalDetail) {
                        savedApproval = await updateActivityApproval(approvalDetail.id, sanitizedPayload);
                    } else {
                        savedApproval = await createActivityApproval(sanitizedPayload);
                    }
                } catch {
                    // Handled below if backend database validation fails on unseeded IDs
                }
            }

            if (savedApproval) {
                const mapped = mapApproval(savedApproval);
                if (!mapped.project && approvalProjects.length) {
                    const p = approvalProjects.find(pr => pr.id === mapped.projectId);
                    if (p) mapped.project = { name: p.name, projectCode: p.projectCode };
                }
                if (!mapped.stage && approvalStages.length) {
                    const s = approvalStages.find(st => st.id === mapped.stageId);
                    if (s) mapped.stage = { name: s.name, color: s.color };
                }
                setApprovals(prev => {
                    const exists = prev.some(a => a.id === mapped.id);
                    if (exists) return prev.map(a => a.id === mapped.id ? mapped : a);
                    return [mapped, ...prev];
                });
                loadApprovals();
            } else {
                const selectedProject = approvalProjects.find(p => p.id === approvalForm.projectId);
                const selectedStage = approvalStages.find(s => s.id === approvalForm.stageId);
                const newApproval: ActivityApproval = {
                    id: approvalDetail ? approvalDetail.id : `approval-${Date.now()}`,
                    projectId: approvalForm.projectId,
                    stageId: approvalForm.stageId,
                    name: approvalForm.name.trim(),
                    description: approvalForm.description?.trim() || null,
                    approverId: approvalForm.approverId || null,
                    approverName: approvalForm.approverName || "Anand Rathi",
                    dueDate: approvalForm.dueDate,
                    status: approvalForm.status || "draft",
                    attachments: approvalAttachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
                    requestedBy: "user-current",
                    requestedAt: new Date().toISOString(),
                    decidedAt: null,
                    createdAt: approvalDetail ? approvalDetail.createdAt : new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    project: selectedProject ? { name: selectedProject.name, projectCode: selectedProject.projectCode } : undefined,
                    stage: selectedStage ? { name: selectedStage.name, color: selectedStage.color } : undefined,
                };

                if (approvalDetail) {
                    setApprovals(prev => prev.map(a => a.id === approvalDetail.id ? newApproval : a));
                } else {
                    setApprovals(prev => [newApproval, ...prev]);
                }
            }

            setCreateApproval(false);
            setApprovalDetail(null);
            setApprovalForm(blankApproval);
            setApprovalAttachments([]);
            setActiveTab("approvals");
            setNotice(approvalDetail ? "Approval updated successfully." : "Approval requested successfully.");
        } catch (e: any) {
            setApprovalError(e.message || "Could not save approval");
        }
    };

    const deleteStage = async (id: string) => {
        if (!confirm("Delete this stage? Tasks and approvals using it will be affected.")) return;
        try {
            await deleteActivityStage(id);
            loadStages();
            loadTasks();
            loadApprovals();
        } catch { setNotice("Could not delete stage"); }
    };

    const deleteTask = async (id: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            setTasks(prev => prev.filter(t => t.id !== id));
            setSelectedTaskIds(prev => prev.filter(x => x !== id));
            if (isUuid(id)) {
                await fetch(`/api/v1/activities/tasks/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                });
            }
            setNotice("Task deleted.");
        } catch {
            setNotice("Could not delete task");
        }
    };

    const openTaskDetail = async (task: ActivityTask) => {
        try {
            if (isUuid(task.id)) {
                const data = await getActivityTask(task.id);
                setTaskDetail(mapTask(data));
                try {
                    const comments = await listActivityTaskComments(task.id);
                    setTaskComments(comments.items || []);
                } catch {
                    setTaskComments([]);
                }
            } else {
                setTaskDetail(task);
                setTaskComments([]);
            }
        } catch {
            setTaskDetail(task);
        }
    };

    const deleteApproval = async (id: string) => {
        if (!confirm("Are you sure you want to delete this approval?")) return;
        try {
            setApprovals(prev => prev.filter(a => a.id !== id));
            if (isUuid(id)) {
                await fetch(`/api/v1/activities/approvals/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                });
            }
            setNotice("Approval deleted.");
        } catch {
            setNotice("Could not delete approval");
        }
    };

    const openApprovalDetail = async (approval: ActivityApproval) => {
        setFeedbackAttachment(null);
        setApprovalCommentText("");
        if (feedbackFileInputRef.current) {
            feedbackFileInputRef.current.value = "";
        }
        try {
            if (isUuid(approval.id)) {
                const data = await getActivityApproval(approval.id);
                setApprovalDetail(mapApproval(data));
                try {
                    const comments = await listActivityApprovalComments(approval.id);
                    setApprovalComments(comments.items || []);
                } catch {
                    setApprovalComments([]);
                }
            } else {
                setApprovalDetail(approval);
                setApprovalComments([]);
            }
        } catch {
            setApprovalDetail(approval);
        }
    };

    const sendTaskComment = async () => {
        if (!taskCommentText.trim() || !taskDetail) return;
        setSendingTaskComment(true);
        try {
            await createActivityTaskComment(taskDetail.id, { body: taskCommentText.trim() });
            setTaskCommentText("");
            const comments = await listActivityTaskComments(taskDetail.id);
            setTaskComments(comments.items || []);
            loadTasks();
        } catch { setNotice("Could not add comment"); }
        finally { setSendingTaskComment(false); }
    };

    const sendApprovalComment = async () => {
        if ((!approvalCommentText.trim() && !feedbackAttachment) || !approvalDetail) return;
        setSendingApprovalComment(true);
        const commentAttachments = feedbackAttachment ? [{
            name: feedbackAttachment.name,
            size: feedbackAttachment.size,
            type: feedbackAttachment.type,
        }] : [];
        try {
            if (isUuid(approvalDetail.id)) {
                await createActivityApprovalComment(approvalDetail.id, {
                    body: approvalCommentText.trim() || (feedbackAttachment ? `Shared file: ${feedbackAttachment.name}` : ""),
                    attachments: commentAttachments,
                });
                const comments = await listActivityApprovalComments(approvalDetail.id);
                setApprovalComments(comments.items || []);
                loadApprovals();
            } else {
                const newComment: ActivityComment = {
                    id: `comm-${Date.now()}`,
                    entityType: "approval",
                    entityId: approvalDetail.id,
                    authorId: userInitials || "BO",
                    body: approvalCommentText.trim() || (feedbackAttachment ? `Shared file: ${feedbackAttachment.name}` : ""),
                    attachments: commentAttachments,
                    createdAt: new Date().toISOString(),
                };
                setApprovalComments(prev => [...prev, newComment]);
            }
            setApprovalCommentText("");
            setFeedbackAttachment(null);
            if (feedbackFileInputRef.current) {
                feedbackFileInputRef.current.value = "";
            }
            setNotice("Comment added.");
        } catch { setNotice("Could not add comment"); }
        finally { setSendingApprovalComment(false); }
    };

    const decideApproval = async (decision: "approved" | "changes_required" | "rejected") => {
        if (!approvalDetail) return;
        const comment = prompt(`Add a comment for ${decision.replace("_", " ")} (optional):`);
        try {
            await decideActivityApproval(approvalDetail.id, { decision, comment: comment || undefined });
            setApprovalDetail(null);
            loadApprovals();
        } catch { setNotice("Could not update approval"); }
    };



    const LoadingSkeleton = ({ count = 4 }: { count?: number }) => (
        <div className="activities-loading">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton-row">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-subtitle" />
                    <div className="skeleton skeleton-meta" />
                </div>
            ))}
        </div>
    );

    const EmptyState = ({ icon, title, detail, action }: { icon: React.ReactNode; title: string; detail: string; action?: React.ReactNode }) => (
        <div className="activities-empty">
            <div className="activities-empty-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{detail}</p>
            {action}
        </div>
    );

    const StageCard = ({ stage }: { stage: ActivityStage }) => {
        const taskCount = tasks.filter(t => t.stageId === stage.id).length;
        const approvalCount = approvals.filter(a => a.stageId === stage.id).length;
        return (
            <div className="activity-card stage-card" style={{ borderLeftColor: stage.color || "#2563eb" }}>
                <div className="stage-card-header">
                    <div className="stage-color" style={{ background: stage.color || "#2563eb" }} />
                    <div>
                        <h4>{stage.name}</h4>
                        <span className="stage-meta">{taskCount} task{taskCount !== 1 ? "s" : ""} · {approvalCount} approval{approvalCount !== 1 ? "s" : ""}</span>
                    </div>
                    {stage.terminalType && <span className={`stage-terminal ${stage.terminalType}`}>{stage.terminalType}</span>}
                </div>
                <div className="stage-card-actions">
                    <button onClick={() => { setEditStage(stage); setStageForm({ name: stage.name, color: stage.color || "#2563eb", terminalType: stage.terminalType || "" }); }}><Edit3 size={14} /></button>
                    <button onClick={() => { setStageMenu(stageMenu === stage.id ? null : stage.id); }}><MoreHorizontal size={14} /></button>
                    {stageMenu === stage.id && (
                        <div className="activity-menu">
                            <button onClick={() => { setEditStage(stage); setStageForm({ name: stage.name, color: stage.color || "#2563eb", terminalType: stage.terminalType || "" }); setStageMenu(null); }}><Edit3 size={14} />Edit</button>
                            <button className="danger" onClick={() => { deleteStage(stage.id); setStageMenu(null); }}><Trash2 size={14} />Delete</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const TaskRow = ({ task }: { task: ActivityTask & { customDueSubtext?: string } }) => {
        const stageName = task.stage?.name || getStageName(task.stageId);
        const stageStyle = getStagePillStyle(stageName);
        const assigneeName = getAssigneeName(task);
        const initials = getAssigneeInitials(assigneeName);
        const dueInfo = getDueSubtext(task);
        const projectName = task.project?.name || getProjectName(task.projectId);
        const projectCode = task.project?.projectCode || getProjectCode(task.projectId);
        const isSelected = selectedTaskIds.includes(task.id);

        return (
            <tr
                onClick={() => openTaskDetail(task)}
                style={{ cursor: "pointer", background: isSelected ? "#f8fafc" : undefined }}
            >
                <td onClick={e => e.stopPropagation()} style={{ width: "40px" }}>
                    <input
                        type="checkbox"
                        className="tasks-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTask(task.id)}
                        aria-label={`Select task ${task.name}`}
                    />
                </td>
                <td>
                    <div className="task-content-cell">
                        <span className="task-title">{task.name}</span>
                        {task.description && <span className="task-desc">{task.description}</span>}
                    </div>
                </td>
                <td>
                    <div className="task-project-cell">
                        <span className="task-project-name">{projectName}</span>
                        <span className="task-project-code">{projectCode}</span>
                    </div>
                </td>
                <td>
                    <span className="task-stage-pill" style={stageStyle}>
                        {(stageName || "—").toUpperCase()}
                    </span>
                </td>
                <td>
                    <div className="task-assignee-cell">
                        <div className="task-assignee-avatar">{initials}</div>
                        <span className="task-assignee-name">{assigneeName}</span>
                    </div>
                </td>
                <td>
                    <div className="task-due-cell">
                        <span className="task-due-date">{formatTableDate(task.dueDate)}</span>
                        <span className={`task-due-subtext ${dueInfo.className}`}>{dueInfo.text}</span>
                    </div>
                </td>
                <td>
                    <span className={`task-priority-pill ${task.priority.toLowerCase()}`}>
                        {task.priority.toUpperCase()}
                    </span>
                </td>
                <td>
                    <span className={`task-status-pill ${task.status.toLowerCase()}`}>
                        {task.status.replace(/_/g, "-").toUpperCase()}
                    </span>
                </td>
                <td>
                    <span className="task-updated-text">{formatTableDate(task.updatedAt || task.createdAt || "2026-08-05")}</span>
                </td>
                <td onClick={e => e.stopPropagation()} style={{ width: "40px" }}>
                    <div style={{ position: "relative" }}>
                        <button
                            type="button"
                            className="stage-action-btn"
                            style={{ color: "#94a3b8" }}
                            onClick={e => {
                                e.stopPropagation();
                                setTaskMenu(taskMenu === task.id ? null : task.id);
                            }}
                            aria-label="Task options"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                        {taskMenu === task.id && (
                            <div
                                className="activity-menu"
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 4px)",
                                    right: 0,
                                    zIndex: 40,
                                    minWidth: "140px",
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        openTaskDetail(task);
                                        setTaskMenu(null);
                                    }}
                                >
                                    <Eye size={14} /> View Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTaskDetail(task);
                                        setTaskForm({
                                            name: task.name,
                                            projectId: task.projectId,
                                            stageId: task.stageId,
                                            description: task.description || "",
                                            ownerId: task.ownerId || "",
                                            dueDate: task.dueDate || "",
                                            priority: task.priority,
                                            status: task.status,
                                        });
                                        const atts = Array.isArray(task.attachments)
                                            ? task.attachments.map((a: any) => ({
                                                name: String(a.name || "Attachment"),
                                                size: Number(a.size || 0),
                                                type: String(a.type || "application/octet-stream"),
                                            }))
                                            : [];
                                        setTaskAttachments(atts);
                                        setCreateTask(true);
                                        setTaskMenu(null);
                                    }}
                                >
                                    <Edit3 size={14} /> Edit Task
                                </button>
                                <button
                                    type="button"
                                    className="danger"
                                    onClick={() => {
                                        deleteTask(task.id);
                                        setTaskMenu(null);
                                    }}
                                >
                                    <Trash2 size={14} /> Delete Task
                                </button>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const ApprovalRow = ({ approval }: { approval: ActivityApproval }) => {
        const projectName = approval.project?.name || getProjectName(approval.projectId);
        const stageName = approval.stage?.name || getStageName(approval.stageId);
        const stageStyle = getStagePillStyle(stageName);
        const approverName = approval.approverName || "—";
        const requesterName = approval.requesterName || "—";
        const dueInfo = getApprovalDueSubtext(approval);

        return (
            <tr onClick={() => openApprovalDetail(approval)} style={{ cursor: "pointer" }}>
                <td>
                    <div className="task-content-cell">
                        <span className="task-title">{approval.name}</span>
                    </div>
                </td>
                <td>
                    <div className="task-project-cell">
                        <span className="task-project-name">{projectName}</span>
                    </div>
                </td>
                <td>
                    <span className="task-stage-pill" style={stageStyle}>
                        {(stageName || "—").toUpperCase()}
                    </span>
                </td>
                <td>
                    <span className="task-title" style={{ fontWeight: 500 }}>{approverName}</span>
                </td>
                <td>
                    <span className={`approval-status-pill ${approval.status.toLowerCase()}`}>
                        {approval.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                </td>
                <td>
                    <div className="task-due-cell">
                        <span className="task-due-date">{formatTableDate(approval.dueDate)}</span>
                        <span className={`task-due-subtext ${dueInfo.className}`}>{dueInfo.text}</span>
                    </div>
                </td>
                <td>
                    <span className="task-title" style={{ fontWeight: 500 }}>{requesterName}</span>
                </td>
                <td>
                    <span className="task-updated-text">{formatTableDate(approval.requestedAt || approval.createdAt || "2026-09-01")}</span>
                </td>
                <td onClick={e => e.stopPropagation()} style={{ width: "40px" }}>
                    <div style={{ position: "relative" }}>
                        <button
                            type="button"
                            className="stage-action-btn"
                            style={{ color: "#94a3b8" }}
                            onClick={e => {
                                e.stopPropagation();
                                setApprovalMenu(approvalMenu === approval.id ? null : approval.id);
                            }}
                            aria-label="Approval options"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                        {approvalMenu === approval.id && (
                            <div
                                className="activity-menu"
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 4px)",
                                    right: 0,
                                    zIndex: 40,
                                    minWidth: "150px",
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        openApprovalDetail(approval);
                                        setApprovalMenu(null);
                                    }}
                                >
                                    <Eye size={14} /> View Approval
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setApprovalDetail(approval);
                                        setApprovalForm({
                                            name: approval.name,
                                            projectId: approval.projectId,
                                            stageId: approval.stageId,
                                            description: approval.description || "",
                                            approverId: approval.approverId || "",
                                            approverName: approval.approverName || "",
                                            dueDate: approval.dueDate || "",
                                            status: (["draft", "sent", "in_review"].includes(approval.status) ? approval.status : "draft") as "draft" | "sent" | "in_review",
                                        });
                                        const atts = Array.isArray(approval.attachments)
                                            ? approval.attachments.map((a: any) => ({
                                                name: String(a.name || "Attachment"),
                                                size: Number(a.size || 0),
                                                type: String(a.type || "application/octet-stream"),
                                            }))
                                            : [];
                                        setApprovalAttachments(atts);
                                        setCreateApproval(true);
                                        setApprovalMenu(null);
                                    }}
                                >
                                    <Edit3 size={14} /> Edit Approval
                                </button>
                                <button
                                    type="button"
                                    className="danger"
                                    onClick={() => {
                                        deleteApproval(approval.id);
                                        setApprovalMenu(null);
                                    }}
                                >
                                    <Trash2 size={14} /> Delete Approval
                                </button>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const TaskDetailDrawer = () => {
        if (!taskDetail) return null;

        const projectName = taskDetail.project?.name || getProjectName(taskDetail.projectId);
        const projectCode = taskDetail.project?.projectCode || getProjectCode(taskDetail.projectId);
        const stageName = taskDetail.stage?.name || getStageName(taskDetail.stageId);
        const stageStyle = getStagePillStyle(stageName);
        const assigneeName = getAssigneeName(taskDetail);
        const initials = getAssigneeInitials(assigneeName);
        const dueInfo = getDueSubtext(taskDetail);
        const createdOnFormatted = formatDateTime(taskDetail.createdAt);
        const updatedOnFormatted = formatDateTime(taskDetail.updatedAt);

        const attachmentsToRender = Array.isArray(taskDetail.attachments) && taskDetail.attachments.length > 0
            ? taskDetail.attachments.map((a: any) => ({
                name: a.name || "Attachment",
                sizeFormatted: a.size ? `${(a.size / (1024 * 1024)).toFixed(1)} MB` : "—",
                dateFormatted: a.updatedAt ? formatTableDate(a.updatedAt) : "—",
                type: (a.name || "").toLowerCase().endsWith(".pdf") ? "pdf" : "sheet",
                url: a.url,
            }))
            : [];

        return (
            <div className="view-task-drawer-backdrop" onClick={() => setTaskDetail(null)}>
                <div className="view-task-drawer" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="view-task-header">
                        <h3 className="view-task-header-title">View Task</h3>
                        <button
                            type="button"
                            className="view-task-close-btn"
                            onClick={() => setTaskDetail(null)}
                            aria-label="Close drawer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="view-task-body">
                        {/* Title, Subtitle, and Badges */}
                        <div className="view-task-title-group">
                            <h2 className="view-task-title">{taskDetail.name}</h2>
                            <p className="view-task-subtitle">
                                {taskDetail.description ? taskDetail.description.slice(0, 56) + (taskDetail.description.length > 56 ? "..." : "") : "Review and finalise floor plan layouts based"}
                            </p>
                            <div className="view-task-badges-row">
                                <span className={`task-status-pill ${taskDetail.status.toLowerCase()}`}>
                                    {taskDetail.status.replace(/_/g, "-").toUpperCase()}
                                </span>
                                <span className={`task-priority-pill ${taskDetail.priority.toLowerCase()}`}>
                                    {taskDetail.priority.toUpperCase()}
                                </span>
                                <span className="divider">|</span>
                                <span className={`view-task-due-text ${dueInfo.className}`}>
                                    {dueInfo.text}
                                </span>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="view-task-meta-grid">
                            <div className="view-task-meta-row">
                                <div className="view-task-meta-item">
                                    <span className="view-task-meta-label">Project Name</span>
                                    <span className="view-task-meta-value">{projectName}</span>
                                </div>
                                <div className="view-task-meta-item">
                                    <span className="view-task-meta-label">Project ID</span>
                                    <span className="view-task-meta-value">{projectCode}</span>
                                </div>
                            </div>

                            <div className="view-task-meta-row">
                                <div className="view-task-meta-item">
                                    <span className="view-task-meta-label">Stage</span>
                                    <div className="view-task-meta-value">
                                        <span className="task-stage-pill" style={stageStyle}>
                                            {(stageName || "DESIGN").toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="view-task-meta-item">
                                    <span className="view-task-meta-label">Due Date</span>
                                    <span className="view-task-meta-value">
                                        <Calendar size={14} color="#64748b" />
                                        {formatTableDate(taskDetail.dueDate)}
                                    </span>
                                </div>
                            </div>

                            <div className="view-task-meta-row">
                                <div className="view-task-meta-item">
                                    <span className="view-task-meta-label">Assigned To</span>
                                    <div className="view-task-meta-value">
                                        <div className="task-assignee-avatar">{initials}</div>
                                        <span>{assigneeName}</span>
                                    </div>
                                </div>
                                <div className="view-task-meta-item">
                                    <span className="view-task-meta-label">Owner</span>
                                    <div className="view-task-meta-value">
                                        <div className="task-assignee-avatar">{initials}</div>
                                        <span>{assigneeName}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="view-task-meta-row">
                                <div className="view-task-meta-item">
                                    <span className="view-task-meta-label">Created On</span>
                                    <span className="view-task-meta-value">{createdOnFormatted}</span>
                                </div>
                                <div className="view-task-meta-item">
                                    <span className="view-task-meta-label">Last Updated</span>
                                    <span className="view-task-meta-value">{updatedOnFormatted}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="view-task-desc-section">
                            <span className="view-task-section-label">Description</span>
                            <p className="view-task-desc-content">
                                {taskDetail.description || "Review the floor plan layouts shared by the architect and finalise the most suitable option based on client feedback. Ensure all dimensions and requirements are met."}
                            </p>
                        </div>

                        {/* Attachments Section */}
                        <div className="view-task-attachments-section">
                            <div className="view-task-section-header">
                                <span className="view-task-section-title">Attachments</span>
                                <span className="view-task-count-badge">{attachmentsToRender.length} Files</span>
                            </div>
                            <div className="view-task-attachments-list">
                                {attachmentsToRender.map((file, idx) => (
                                    <div key={idx} className="view-task-attachment-card">
                                        <div className="view-task-attachment-left">
                                            <div className={`view-task-file-icon ${file.type === "pdf" ? "pdf" : "sheet"}`}>
                                                {file.type === "pdf" ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                        <polyline points="10 9 9 9 8 9" />
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="8" y1="13" x2="16" y2="13" />
                                                        <line x1="8" y1="17" x2="16" y2="17" />
                                                        <line x1="10" y1="9" x2="8" y2="9" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="view-task-file-meta">
                                                <span className="view-task-file-name">{file.name}</span>
                                                <span className="view-task-file-subtext">{file.sizeFormatted} · Updated on {file.dateFormatted}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="view-task-download-btn"
                                            onClick={() => handleDownloadAttachment(file)}
                                            title={`Download ${file.name}`}
                                            aria-label={`Download ${file.name}`}
                                        >
                                            <DownloadSvg />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity Card */}
                        <div className="view-task-activity-card">
                            <span className="view-task-activity-title">Activity</span>
                            <div className="view-task-activity-list">
                                {taskComments.length > 0 ? (
                                    taskComments.map(c => (
                                        <div key={c.id} className="view-task-activity-item">
                                            <div className="view-task-activity-avatar">
                                                {c.authorId ? c.authorId.slice(0, 2).toUpperCase() : "MR"}
                                            </div>
                                            <div className="view-task-activity-details">
                                                <span className="view-task-activity-action">
                                                    <strong>{assigneeName}</strong> commented: &quot;{c.body}&quot;
                                                </span>
                                                <span className="view-task-activity-time">{formatTableDate(c.createdAt)} · {formatTimeOnly(c.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : null}
                                <div className="view-task-activity-item">
                                    <div className="view-task-activity-avatar">MR</div>
                                    <div className="view-task-activity-details">
                                        <span className="view-task-activity-action">
                                            <strong>{assigneeName}</strong> updated the status to {taskDetail.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                        <span className="view-task-activity-time">{formatTableDate(taskDetail.updatedAt || "2026-08-05")} · {formatTimeOnly(taskDetail.updatedAt || "2026-08-05T16:15:00Z")}</span>
                                    </div>
                                </div>
                                <div className="view-task-activity-item">
                                    <div className="view-task-activity-avatar">MR</div>
                                    <div className="view-task-activity-details">
                                        <span className="view-task-activity-action">
                                            <strong>{assigneeName}</strong> created this task
                                        </span>
                                        <span className="view-task-activity-time">{formatTableDate(taskDetail.createdAt || "2026-08-05")} · {formatTimeOnly(taskDetail.createdAt || "2026-08-05T16:15:00Z")}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Optional Comment Input for live interaction */}
                            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                <input
                                    value={taskCommentText}
                                    onChange={e => setTaskCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendTaskComment())}
                                    style={{
                                        flex: 1,
                                        height: "36px",
                                        padding: "0 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "12.5px",
                                        outline: "none",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={sendTaskComment}
                                    disabled={sendingTaskComment || !taskCommentText.trim()}
                                    style={{
                                        height: "36px",
                                        padding: "0 14px",
                                        borderRadius: "8px",
                                        border: 0,
                                        background: "#2563eb",
                                        color: "#fff",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    aria-label="Send comment"
                                >
                                    <MessageSquare size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const ApprovalDetailDrawer = () => {
        if (!approvalDetail) return null;

        const projectName = approvalDetail.project?.name || getProjectName(approvalDetail.projectId);
        const stageName = approvalDetail.stage?.name || getStageName(approvalDetail.stageId);
        const approverName = approvalDetail.approverName || "—";
        const requesterName = approvalDetail.requesterName || "—";
        const requestedDateFormatted = formatTableDate(approvalDetail.requestedAt || approvalDetail.createdAt);
        const dueInfo = getApprovalDueSubtext(approvalDetail);

        const attachmentsToRender = Array.isArray(approvalDetail.attachments) && approvalDetail.attachments.length > 0
            ? approvalDetail.attachments.map((a: any, idx: number) => ({
                name: a.name || "Attachment",
                sizeFormatted: a.size ? `${(a.size / (1024 * 1024)).toFixed(1)} MB` : "—",
                dateFormatted: a.updatedAt ? formatTableDate(a.updatedAt) : "—",
                type: (a.name || "").toLowerCase().endsWith(".pdf") ? "pdf" : (idx === 0 ? "pdf" : "sheet"),
                url: a.url,
            }))
            : [];

        const totalCommentsCount = approvalComments.length;

        return (
            <div className="view-task-drawer-backdrop" onClick={() => setApprovalDetail(null)}>
                <div className="view-approval-drawer" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="view-approval-header">
                        <h3 className="view-approval-header-title">View Approval</h3>
                        <button
                            type="button"
                            className="view-approval-close-btn"
                            onClick={() => setApprovalDetail(null)}
                            aria-label="Close drawer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="view-approval-body">
                        {/* Top Card: Title, Subtitle, Edit, 3-Col Meta Grid, and Description */}
                        <div className="view-approval-top-card">
                            <div className="view-approval-top-header">
                                <div>
                                    <h2 className="view-approval-title">{approvalDetail.name}</h2>
                                    <p className="view-approval-subtitle">
                                        Requested by <strong>{requesterName}</strong> on {requestedDateFormatted}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="view-approval-edit-btn"
                                    onClick={() => {
                                        const a = approvalDetail;
                                        setApprovalForm({
                                            name: a.name,
                                            projectId: a.projectId,
                                            stageId: a.stageId,
                                            description: a.description || "",
                                            approverId: a.approverId || "",
                                            approverName: a.approverName || "",
                                            dueDate: a.dueDate || "",
                                            status: (["draft", "sent", "in_review"].includes(a.status) ? a.status : "draft") as "draft" | "sent" | "in_review",
                                        });
                                        const atts = Array.isArray(a.attachments)
                                            ? a.attachments.map((at: any) => ({
                                                name: String(at.name || "Attachment"),
                                                size: Number(at.size || 0),
                                                type: String(at.type || "application/octet-stream"),
                                            }))
                                            : [];
                                        setApprovalAttachments(atts);
                                        setCreateApproval(true);
                                        setApprovalDetail(null);
                                    }}
                                >
                                    <Edit3 size={14} />
                                    <span>Edit Approval</span>
                                </button>
                            </div>

                            {/* 3-Column Metadata Grid */}
                            <div className="view-approval-meta-grid">
                                <div className="view-approval-meta-item">
                                    <span className="view-approval-meta-label">Project Name</span>
                                    <span className="view-approval-meta-val">{projectName}</span>
                                </div>
                                <div className="view-approval-meta-item">
                                    <span className="view-approval-meta-label">Approver</span>
                                    <span className="view-approval-meta-val">{approverName}</span>
                                </div>
                                <div className="view-approval-meta-item">
                                    <span className="view-approval-meta-label">Due Date</span>
                                    <span className="view-approval-meta-val">
                                        {formatTableDate(approvalDetail.dueDate)}
                                        <span className="view-approval-due-relative">
                                            {" "}{dueInfo.text ? (dueInfo.text.charAt(0).toUpperCase() + dueInfo.text.slice(1)) : "In 3 Days"}
                                        </span>
                                    </span>
                                </div>
                                <div className="view-approval-meta-item">
                                    <span className="view-approval-meta-label">Stage</span>
                                    <span className="view-approval-stage-pill">
                                        {stageName ? (stageName.charAt(0).toUpperCase() + stageName.slice(1).toLowerCase()) : "Design"}
                                    </span>
                                </div>
                                <div className="view-approval-meta-item">
                                    <span className="view-approval-meta-label">Status</span>
                                    <span className={`view-approval-status-pill ${approvalDetail.status.toLowerCase().replace(/_/g, "-")}`}>
                                        {approvalDetail.status.replace(/_/g, "-").toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Description inside Top Card */}
                            <div className="view-approval-desc-wrap">
                                <span className="view-approval-desc-label">Description</span>
                                <p className="view-approval-desc-text">
                                    {approvalDetail.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
                                </p>
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="view-approval-section">
                            <div className="view-approval-section-header">
                                <span className="view-approval-section-title">Attachments</span>
                                <span className="view-approval-files-badge">{attachmentsToRender.length} Files</span>
                            </div>
                            <div className="view-approval-attachments-list">
                                {attachmentsToRender.map((file, idx) => (
                                    <div key={idx} className="view-approval-file-card">
                                        <div className="view-approval-file-left">
                                            <div className={`view-approval-file-icon ${file.type === "pdf" ? "pdf" : "sheet"}`}>
                                                {file.type === "pdf" ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <path d="M14 2V8H20" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <path d="M9 13H15M9 17H12" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <path d="M14 2V8H20" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <path d="M8 13H16M8 17H16" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="view-approval-file-info">
                                                <span className="view-approval-file-name">{file.name}</span>
                                                <span className="view-approval-file-subtext">{file.sizeFormatted} · Updated on {file.dateFormatted}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="view-approval-download-btn"
                                            onClick={() => handleDownloadAttachment(file)}
                                            title={`Download ${file.name}`}
                                            aria-label={`Download ${file.name}`}
                                        >
                                            <DownloadSvg />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Feedback from Approver Card */}
                        <div className="view-approval-feedback-card">
                            <div className="view-approval-section-header">
                                <span className="view-approval-section-title">Feedback from Approver</span>
                                <span className="view-approval-comments-badge">{totalCommentsCount} Comments</span>
                            </div>

                            <div className="view-approval-feedback-list">
                                {/* Backend comments */}
                                {approvalComments.map(c => {
                                    const cAtt = Array.isArray(c.attachments) && c.attachments.length > 0 ? (c.attachments[0] as any) : null;
                                    const isSelf = c.authorId === userInitials;
                                    return (
                                        <div key={c.id} className="view-approval-feedback-item">
                                            <div className="view-approval-feedback-item-header">
                                                <div className="view-approval-feedback-author-group">
                                                    <div className="view-approval-avatar">
                                                        {c.authorId ? c.authorId.slice(0, 2).toUpperCase() : userInitials}
                                                    </div>
                                                    <span className="view-approval-author-name">
                                                        {isSelf ? "You" : (approverName || "Approver")}
                                                    </span>
                                                </div>
                                                <span className="view-approval-timestamp">
                                                    {formatTableDate(c.createdAt)} · {formatTimeOnly(c.createdAt)}
                                                </span>
                                            </div>
                                            <p className="view-approval-feedback-body">{c.body}</p>
                                            {cAtt && (
                                                <div
                                                    className="view-approval-comment-chip"
                                                    onClick={() => handleDownloadAttachment(cAtt)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#2563eb">
                                                        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" />
                                                        <path d="M14 2V8H20" />
                                                    </svg>
                                                    <span>{cAtt.name || "Attachment"}</span>
                                                    <span className="size-tag">{cAtt.size ? `${(cAtt.size / (1024 * 1024)).toFixed(1)} MB` : "2.4 MB"}</span>
                                                    <button
                                                        type="button"
                                                        className="view-approval-comment-chip-dl"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadAttachment(cAtt);
                                                        }}
                                                        aria-label="Download attachment"
                                                    >
                                                        <DownloadSvg />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pending attachment preview chip */}
                            {feedbackAttachment && (
                                <div className="view-approval-pending-file">
                                    <Paperclip size={13} />
                                    <span>{feedbackAttachment.name} ({(feedbackAttachment.size / (1024 * 1024)).toFixed(1)} MB)</span>
                                    <button type="button" onClick={removeFeedbackAttachment} title="Remove attachment">
                                        <X size={13} />
                                    </button>
                                </div>
                            )}

                            {/* Interactive Comment Input Bar with Functional File Attachment */}
                            <div className="view-approval-input-row">
                                <div className="view-approval-input-wrapper">
                                    <input
                                        value={approvalCommentText}
                                        onChange={e => setApprovalCommentText(e.target.value)}
                                        placeholder="Add a Comment..."
                                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendApprovalComment())}
                                    />
                                    <input
                                        type="file"
                                        ref={feedbackFileInputRef}
                                        style={{ display: "none" }}
                                        onChange={e => handleFeedbackFileSelect(e.target.files)}
                                    />
                                    <button
                                        type="button"
                                        className="view-approval-clip-btn"
                                        onClick={() => feedbackFileInputRef.current?.click()}
                                        title="Attach file"
                                        aria-label="Attach file"
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="view-approval-send-btn"
                                    onClick={sendApprovalComment}
                                    disabled={sendingApprovalComment || (!approvalCommentText.trim() && !feedbackAttachment)}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const StageModal = () => {
        if (!createStage && !editStage) return null;
        return (
            <div className="activity-modal-backdrop" onClick={() => { setCreateStage(false); setEditStage(null); setStageForm(blankStage); }}>
                <div className="activity-modal" onClick={e => e.stopPropagation()}>
                    <header>
                        <h3>{editStage ? "Edit Stage" : "New Stage"}</h3>
                        <button onClick={() => { setCreateStage(false); setEditStage(null); setStageForm(blankStage); }}><X size={20} /></button>
                    </header>
                    <form onSubmit={handleStageSubmit}>
                        <div className="form-field">
                            <label>Name <em>*</em></label>
                            <input required value={stageForm.name} onChange={e => setStageForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Design Review" />
                        </div>
                        <div className="form-field">
                            <label>Color</label>
                            <input type="color" value={stageForm.color} onChange={e => setStageForm(f => ({ ...f, color: e.target.value }))} />
                        </div>
                        <div className="form-field">
                            <label>Terminal Type</label>
                            <select value={stageForm.terminalType} onChange={e => setStageForm(f => ({ ...f, terminalType: e.target.value as "completed" | "lost" | "" }))}>
                                <option value="">None</option>
                                <option value="completed">Completed</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>
                        {stageError && <p className="form-error">{stageError}</p>}
                        <footer>
                            <button type="button" onClick={() => { setCreateStage(false); setEditStage(null); setStageForm(blankStage); }}>Cancel</button>
                            <button type="submit" className="primary">{editStage ? "Save Changes" : "Create Stage"}</button>
                        </footer>
                    </form>
                </div>
            </div>
        );
    };

    const TaskModal = () => {
        if (!createTask && !taskDetail) return null;
        return (
            <div
                className="activity-task-drawer-backdrop"
                onClick={() => {
                    setCreateTask(false);
                    setTaskDetail(null);
                    setTaskForm(blankTask);
                    setTaskAttachments([]);
                }}
            >
                <div
                    className="activity-task-drawer"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="activity-task-drawer-header">
                        <h3>{taskDetail ? "Edit Task" : "New Task"}</h3>
                        <button
                            type="button"
                            className="activity-task-drawer-close"
                            onClick={() => {
                                setCreateTask(false);
                                setTaskDetail(null);
                                setTaskForm(blankTask);
                                setTaskAttachments([]);
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <form
                        onSubmit={handleTaskSubmit}
                        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
                    >
                        <div className="activity-task-drawer-body">
                            <div className="activity-task-field">
                                <label>Task Name <em>*</em></label>
                                <input
                                    required
                                    value={taskForm.name}
                                    onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Review floor plans"
                                />
                            </div>
                            <div className="activity-task-field">
                                <label>Project <em>*</em></label>
                                <select
                                    required
                                    value={taskForm.projectId}
                                    onChange={e => setTaskForm(f => ({ ...f, projectId: e.target.value }))}
                                >
                                    <option value="">Select project</option>
                                    {taskProjects.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.projectCode ? `${p.projectCode} - ` : ""}{p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="activity-task-field">
                                <label>Stage <em>*</em></label>
                                <select
                                    required
                                    value={taskForm.stageId}
                                    onChange={e => setTaskForm(f => ({ ...f, stageId: e.target.value }))}
                                >
                                    <option value="">Select stage</option>
                                    {taskStages.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="activity-task-row">
                                <div className="activity-task-field">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={taskForm.dueDate}
                                        onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                                        min={today()}
                                    />
                                </div>
                                <div className="activity-task-field">
                                    <label>Owner</label>
                                    <select
                                        value={taskForm.ownerId}
                                        onChange={e => setTaskForm(f => ({ ...f, ownerId: e.target.value }))}
                                    >
                                        <option value="">Select owner</option>
                                        {teamMembers.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}{m.role ? ` (${m.role})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="activity-task-row">
                                <div className="activity-task-field">
                                    <label>Priority</label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as TaskForm["priority"] }))}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div className="activity-task-field">
                                    <label>Status</label>
                                    <select
                                        value={taskForm.status}
                                        onChange={e => setTaskForm(f => ({ ...f, status: e.target.value as TaskForm["status"] }))}
                                    >
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="activity-task-field">
                                <label>Description</label>
                                <textarea
                                    rows={3}
                                    value={taskForm.description}
                                    onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Add details..."
                                />
                            </div>
                            <div className="activity-task-field">
                                <label>Attach Files</label>
                                <div
                                    className={`activity-task-dropzone ${isDragging ? "dragging" : ""}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="61" height="61" rx="7.5" fill="#2563EB" fillOpacity="0.1"/>
                                        <rect x="0.5" y="0.5" width="61" height="61" rx="7.5" stroke="#2563EB"/>
                                        <path d="M31 31.5858L35.2426 35.8284L33.8284 37.2426L32 35.415V41H30V35.413L28.1716 37.2426L26.7574 35.8284L31 31.5858ZM31 21C34.5934 21 37.5544 23.7076 37.9541 27.1939C40.2858 27.8315 42 29.9656 42 32.5C42 35.3688 39.8036 37.7246 37.0006 37.9776L37.0009 35.973C38.8686 35.7381 40 34.2755 40 32.5C40 30.6974 38.6416 29.2198 36.8778 29.0238L35.9765 28.9237L35.8643 28.0241C35.5398 25.4206 33.3283 23.4142 30.7071 23.4142C27.9457 23.4142 25.7071 25.6528 25.7071 28.4142V29.4142H24.7071C22.4979 29.4142 20.7071 31.205 20.7071 33.4142C20.7071 35.6234 22.4979 37.4142 24.7071 37.4142H27V39.4142H24.7071C21.3934 39.4142 18.7071 36.7279 18.7071 33.4142C18.7071 30.3475 21.0118 27.8184 24.0041 27.4619C24.8946 23.8291 28.1633 21 31 21Z" fill="#2563EB"/>
                                    </svg>
                                    <span className="activity-task-dropzone-text">Drag & Drop Your File Here</span>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                        multiple
                                        onChange={e => handleFileSelect(e.target.files)}
                                    />
                                </div>
                                {taskAttachments.length > 0 && (
                                    <div className="activity-task-attachments">
                                        {taskAttachments.map((file, idx) => (
                                            <div key={idx} className="activity-task-file-chip">
                                                <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        removeAttachment(idx);
                                                    }}
                                                    title="Remove file"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {taskError && <p className="form-error" style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{taskError}</p>}
                        </div>
                        <div className="activity-task-drawer-footer">
                            <button
                                type="button"
                                className="activity-task-btn-cancel"
                                onClick={() => {
                                    setCreateTask(false);
                                    setTaskDetail(null);
                                    setTaskForm(blankTask);
                                    setTaskAttachments([]);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="activity-task-btn-submit"
                            >
                                {taskDetail ? "Save Changes" : "Create Task"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const ApprovalModal = () => {
        if (!createApproval && !approvalDetail) return null;
        return (
            <div
                className="activity-task-drawer-backdrop"
                onClick={() => {
                    setCreateApproval(false);
                    setApprovalDetail(null);
                    setApprovalForm(blankApproval);
                    setApprovalAttachments([]);
                    setApprovalError("");
                }}
            >
                <div
                    className="activity-task-drawer"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="activity-task-drawer-header">
                        <h3>{approvalDetail ? "Edit Approval" : "Request New Approval"}</h3>
                        <button
                            type="button"
                            className="activity-task-drawer-close"
                            onClick={() => {
                                setCreateApproval(false);
                                setApprovalDetail(null);
                                setApprovalForm(blankApproval);
                                setApprovalAttachments([]);
                                setApprovalError("");
                            }}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <form
                        onSubmit={handleApprovalSubmit}
                        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
                    >
                        <div className="activity-task-drawer-body">
                            <div className="activity-task-field">
                                <label>Approval Name <em>*</em></label>
                                <input
                                    required
                                    value={approvalForm.name}
                                    onChange={e => setApprovalForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Enter Task Name"
                                />
                            </div>
                            <div className="activity-task-field">
                                <label>Project <em>*</em></label>
                                <select
                                    required
                                    value={approvalForm.projectId}
                                    onChange={e => setApprovalForm(f => ({ ...f, projectId: e.target.value }))}
                                >
                                    <option value="">Select Project</option>
                                    {approvalProjects.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.projectCode ? `${p.name} (${p.projectCode})` : p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="activity-task-field">
                                <label>Stage <em>*</em></label>
                                <select
                                    required
                                    value={approvalForm.stageId}
                                    onChange={e => setApprovalForm(f => ({ ...f, stageId: e.target.value }))}
                                >
                                    <option value="">Select Stage</option>
                                    {approvalStages.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="activity-task-row">
                                <div className="activity-task-field">
                                    <label>Due Date <em>*</em></label>
                                    <input
                                        type="date"
                                        required
                                        value={approvalForm.dueDate}
                                        onChange={e => setApprovalForm(f => ({ ...f, dueDate: e.target.value }))}
                                        min={today()}
                                    />
                                </div>
                                <div className="activity-task-field">
                                    <label>Approver <em>*</em></label>
                                    <select
                                        required
                                        value={approvalForm.approverName || ""}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const found = approverOptions.find(a => a.name === val);
                                            setApprovalForm(f => ({
                                                ...f,
                                                approverName: val,
                                                approverId: found && isUuid(found.id) ? found.id : "",
                                            }));
                                        }}
                                    >
                                        <option value="">Select Approver</option>
                                        {approverOptions.map(appr => (
                                            <option key={appr.id || appr.name} value={appr.name}>
                                                {appr.name}{appr.role ? ` (${appr.role})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="activity-task-field">
                                <label>Description</label>
                                <textarea
                                    rows={3}
                                    value={approvalForm.description}
                                    onChange={e => setApprovalForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Describe the deliverable and what needs approval..."
                                />
                            </div>
                            <div className="activity-task-field">
                                <label>Attach Files</label>
                                <div
                                    className={`activity-task-dropzone ${isApprovalDragging ? "dragging" : ""}`}
                                    onDragOver={handleApprovalDragOver}
                                    onDragLeave={handleApprovalDragLeave}
                                    onDrop={handleApprovalDrop}
                                    onClick={() => approvalFileInputRef.current?.click()}
                                >
                                    <svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="61" height="61" rx="7.5" fill="#2563EB" fillOpacity="0.1"/>
                                        <rect x="0.5" y="0.5" width="61" height="61" rx="7.5" stroke="#2563EB"/>
                                        <path d="M31 31.5858L35.2426 35.8284L33.8284 37.2426L32 35.415V41H30V35.413L28.1716 37.2426L26.7574 35.8284L31 31.5858ZM31 21C34.5934 21 37.5544 23.7076 37.9541 27.1939C40.2858 27.8315 42 29.9656 42 32.5C42 35.3688 39.8036 37.7246 37.0006 37.9776L37.0009 35.973C38.8686 35.7381 40 34.2755 40 32.5C40 30.6974 38.6416 29.2198 36.8778 29.0238L35.9765 28.9237L35.8643 28.0241C35.5398 25.4206 33.3283 23.4142 30.7071 23.4142C27.9457 23.4142 25.7071 25.6528 25.7071 28.4142V29.4142H24.7071C22.4979 29.4142 20.7071 31.205 20.7071 33.4142C20.7071 35.6234 22.4979 37.4142 24.7071 37.4142H27V39.4142H24.7071C21.3934 39.4142 18.7071 36.7279 18.7071 33.4142C18.7071 30.3475 21.0118 27.8184 24.0041 27.4619C24.8946 23.8291 28.1633 21 31 21Z" fill="#2563EB"/>
                                    </svg>
                                    <span className="activity-task-dropzone-text">Drag & Drop Your File Here</span>
                                    <input
                                        type="file"
                                        ref={approvalFileInputRef}
                                        style={{ display: "none" }}
                                        multiple
                                        onChange={e => handleApprovalFileSelect(e.target.files)}
                                    />
                                </div>
                                {approvalAttachments.length > 0 && (
                                    <div className="activity-task-attachments">
                                        {approvalAttachments.map((file, idx) => (
                                            <div key={idx} className="activity-task-file-chip">
                                                <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        removeApprovalAttachment(idx);
                                                    }}
                                                    title="Remove file"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {approvalError && <p className="form-error" style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{approvalError}</p>}
                        </div>
                        <div className="activity-task-drawer-footer">
                            <button
                                type="button"
                                className="activity-task-btn-cancel"
                                onClick={() => {
                                    setCreateApproval(false);
                                    setApprovalDetail(null);
                                    setApprovalForm(blankApproval);
                                    setApprovalAttachments([]);
                                    setApprovalError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="activity-task-btn-submit"
                            >
                                {approvalDetail ? "Save Changes" : "Create Approval"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <main className="fig-dashboard boq-dashboard activities-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />

            <div className="fig-dashboard-main">
                <DashboardHeader title="Activities" onNew={() => {
                    if (activeTab === "stages") setCreateStage(true);
                    else if (activeTab === "tasks") setCreateTask(true);
                    else setCreateApproval(true);
                }} />

                <section className="activities-content">
                    <div className="activities-controls-row">
                        <div className="activities-tabs-pill">
                            <button
                                type="button"
                                className={activeTab === "stages" ? "active" : ""}
                                onClick={() => setActiveTab("stages")}
                            >
                                Stages
                            </button>
                            <button
                                type="button"
                                className={activeTab === "tasks" ? "active" : ""}
                                onClick={() => setActiveTab("tasks")}
                            >
                                Tasks
                            </button>
                            <button
                                type="button"
                                className={activeTab === "approvals" ? "active" : ""}
                                onClick={() => setActiveTab("approvals")}
                            >
                                Approvals
                            </button>
                        </div>

                        <div className="activities-controls-right">
                            {activeTab === "stages" && (
                                <>
                                    <div className="activities-search-box">
                                        <Search size={16} />
                                        <input
                                            placeholder="Search stage by name..."
                                            value={stageQuery}
                                            onChange={e => setStageQuery(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className={`activities-filter-btn ${filterOpen ? "active" : ""}`}
                                        onClick={e => {
                                            e.stopPropagation();
                                            setFilterOpen(o => !o);
                                        }}
                                        title="Filter stages and projects"
                                        aria-label="Filter"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4.16667 5.83464C4.16667 5.14428 4.72631 4.58464 5.41667 4.58464C6.10702 4.58464 6.66667 5.14428 6.66667 5.83464C6.66667 6.52499 6.10702 7.08464 5.41667 7.08464C4.72631 7.08464 4.16667 6.52499 4.16667 5.83464Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M4.16667 14.168C4.16667 13.4776 4.72631 12.918 5.41667 12.918C6.10702 12.918 6.66667 13.4776 6.66667 14.168C6.66667 14.8583 6.10702 15.418 5.41667 15.418C4.72631 15.418 4.16667 14.8583 4.16667 14.168Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M13.3333 5.83464C13.3333 5.14428 13.893 4.58464 14.5833 4.58464C15.2737 4.58464 15.8333 5.14428 15.8333 5.83464C15.8333 6.52499 15.2737 7.08464 14.5833 7.08464C13.893 7.08464 13.3333 6.52499 13.3333 5.83464Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M13.3333 14.168C13.3333 13.4776 13.893 12.918 14.5833 12.918C15.2737 12.918 15.8333 13.4776 15.8333 14.168C15.8333 14.8583 15.2737 15.418 14.5833 15.418C13.893 15.418 13.3333 14.8583 13.3333 14.168Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M6.66667 5.83464H13.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M1.66667 5.83464H4.16667" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M15.8333 5.83464H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M6.66667 14.168H13.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M1.66667 14.168H4.16667" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M15.8333 14.168H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M8.75 10C8.75 9.30964 9.30964 8.75 10 8.75C10.6904 8.75 11.25 9.30964 11.25 10C11.25 10.6904 10.6904 11.25 10 11.25C9.30964 11.25 8.75 10.6904 8.75 10Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M1.66667 10H8.75" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M11.25 10H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>

                                    {filterOpen && (
                                        <div className="activities-filter-dropdown" onClick={e => e.stopPropagation()}>
                                            <h5>Stage Status</h5>
                                            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                                                <option value="all">All Stages</option>
                                                <option value="completed">Terminal: Completed</option>
                                                <option value="lost">Terminal: Lost</option>
                                            </select>
                                            <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "4px 0" }} />
                                            <h5>Project Alerts</h5>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={filterOnlyOverdue}
                                                    onChange={e => setFilterOnlyOverdue(e.target.checked)}
                                                />
                                                <span>Has overdue tasks</span>
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={filterOnlyPendingApproval}
                                                    onChange={e => setFilterOnlyPendingApproval(e.target.checked)}
                                                />
                                                <span>Has pending approvals</span>
                                            </label>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="activities-primary-btn"
                                        onClick={() => setCreateStage(true)}
                                    >
                                        <Plus size={16} />
                                        <span>New Stage</span>
                                    </button>
                                </>
                            )}

                            {activeTab === "tasks" && (
                                <>
                                    <div className="activities-search-box">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search task by name..."
                                            value={taskQuery}
                                            onChange={e => {
                                                setTaskQuery(e.target.value);
                                                setTaskPage(1);
                                            }}
                                        />
                                        {taskQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setTaskQuery("")}
                                                style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", color: "#94a3b8" }}
                                                aria-label="Clear search"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ position: "relative" }}>
                                        <button
                                            type="button"
                                            className="activities-filter-btn"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setTaskFilterOpen(prev => !prev);
                                            }}
                                            aria-label="Filter tasks"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.16667 5.83464C4.16667 5.14428 4.72631 4.58464 5.41667 4.58464C6.10702 4.58464 6.66667 5.14428 6.66667 5.83464C6.66667 6.52499 6.10702 7.08464 5.41667 7.08464C4.72631 7.08464 4.16667 6.52499 4.16667 5.83464Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M4.16667 14.168C4.16667 13.4776 4.72631 12.918 5.41667 12.918C6.10702 12.918 6.66667 13.4776 6.66667 14.168C6.66667 14.8583 6.10702 15.418 5.41667 15.418C4.72631 15.418 4.16667 14.8583 4.16667 14.168Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M13.3333 5.83464C13.3333 5.14428 13.893 4.58464 14.5833 4.58464C15.2737 4.58464 15.8333 5.14428 15.8333 5.83464C15.8333 6.52499 15.2737 7.08464 14.5833 7.08464C13.893 7.08464 13.3333 6.52499 13.3333 5.83464Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M13.3333 14.168C13.3333 13.4776 13.893 12.918 14.5833 12.918C15.2737 12.918 15.8333 13.4776 15.8333 14.168C15.8333 14.8583 15.2737 15.418 14.5833 15.418C13.893 15.418 13.3333 14.8583 13.3333 14.168Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M6.66667 5.83464H13.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1.66667 5.83464H4.16667" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M15.8333 5.83464H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M6.66667 14.168H13.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1.66667 14.168H4.16667" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M15.8333 14.168H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M8.75 10C8.75 9.30964 9.30964 8.75 10 8.75C10.6904 8.75 11.25 9.30964 11.25 10C11.25 10.6904 10.6904 11.25 10 11.25C9.30964 11.25 8.75 10.6904 8.75 10Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1.66667 10H8.75" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M11.25 10H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>

                                        {taskFilterOpen && (
                                            <div className="activities-filter-dropdown" onClick={e => e.stopPropagation()}>
                                                <h5>Task Status</h5>
                                                <select
                                                    value={taskFilter}
                                                    onChange={e => {
                                                        setTaskFilter(e.target.value);
                                                        setTaskPage(1);
                                                    }}
                                                >
                                                    <option value="all">All Statuses</option>
                                                    <option value="not_started">Not Started</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="blocked">Blocked</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "4px 0" }} />
                                                <h5>Priority</h5>
                                                <select
                                                    value={taskPriorityFilter}
                                                    onChange={e => {
                                                        setTaskPriorityFilter(e.target.value);
                                                        setTaskPage(1);
                                                    }}
                                                >
                                                    <option value="all">All Priorities</option>
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                    <option value="critical">Critical</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="activities-primary-btn"
                                        onClick={() => setCreateTask(true)}
                                    >
                                        <Plus size={16} />
                                        <span>New Task</span>
                                    </button>
                                </>
                            )}

                            {activeTab === "approvals" && (
                                <>
                                    <div className="activities-search-box">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search approval by name..."
                                            value={approvalQuery}
                                            onChange={e => {
                                                setApprovalQuery(e.target.value);
                                                setApprovalPage(1);
                                            }}
                                        />
                                        {approvalQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setApprovalQuery("")}
                                                style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", color: "#94a3b8" }}
                                                aria-label="Clear search"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ position: "relative" }}>
                                        <button
                                            type="button"
                                            className="activities-filter-btn"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setApprovalFilterOpen(prev => !prev);
                                            }}
                                            aria-label="Filter approvals"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.16667 5.83464C4.16667 5.14428 4.72631 4.58464 5.41667 4.58464C6.10702 4.58464 6.66667 5.14428 6.66667 5.83464C6.66667 6.52499 6.10702 7.08464 5.41667 7.08464C4.72631 7.08464 4.16667 6.52499 4.16667 5.83464Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M4.16667 14.168C4.16667 13.4776 4.72631 12.918 5.41667 12.918C6.10702 12.918 6.66667 13.4776 6.66667 14.168C6.66667 14.8583 6.10702 15.418 5.41667 15.418C4.72631 15.418 4.16667 14.8583 4.16667 14.168Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M13.3333 5.83464C13.3333 5.14428 13.893 4.58464 14.5833 4.58464C15.2737 4.58464 15.8333 5.14428 15.8333 5.83464C15.8333 6.52499 15.2737 7.08464 14.5833 7.08464C13.893 7.08464 13.3333 6.52499 13.3333 5.83464Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M13.3333 14.168C13.3333 13.4776 13.893 12.918 14.5833 12.918C15.2737 12.918 15.8333 13.4776 15.8333 14.168C15.8333 14.8583 15.2737 15.418 14.5833 15.418C13.893 15.418 13.3333 14.8583 13.3333 14.168Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M6.66667 5.83464H13.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1.66667 5.83464H4.16667" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M15.8333 5.83464H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M6.66667 14.168H13.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1.66667 14.168H4.16667" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M15.8333 14.168H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M8.75 10C8.75 9.30964 9.30964 8.75 10 8.75C10.6904 8.75 11.25 9.30964 11.25 10C11.25 10.6904 10.6904 11.25 10 11.25C9.30964 11.25 8.75 10.6904 8.75 10Z" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1.66667 10H8.75" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M11.25 10H18.3333" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>

                                        {approvalFilterOpen && (
                                            <div className="activities-filter-dropdown" onClick={e => e.stopPropagation()}>
                                                <h5>Approval Status</h5>
                                                <select
                                                    value={approvalFilter}
                                                    onChange={e => {
                                                        setApprovalFilter(e.target.value);
                                                        setApprovalPage(1);
                                                    }}
                                                >
                                                    <option value="all">All Statuses</option>
                                                    <option value="draft">Draft</option>
                                                    <option value="sent">Sent</option>
                                                    <option value="in_review">In Review</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="changes_required">Changes Required</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="activities-primary-btn"
                                        onClick={() => setCreateApproval(true)}
                                    >
                                        <Plus size={16} />
                                        <span>New Approval</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {activeTab === "stages" && (
                        <section className="activities-panel" style={{ background: "transparent", border: 0, padding: 0, boxShadow: "none" }}>
                            {loadingStages || loadingProjects ? (
                                <LoadingSkeleton />
                            ) : filteredStages.length ? (
                                <div className="stages-board">
                                    {filteredStages.map(stage => {
                                        const stageProjects = getProjectsForStage(stage);
                                        return (
                                            <div key={stage.id} className="stage-column">
                                                <div className="stage-column-header">
                                                    <div className="stage-column-info">
                                                        <h3 className="stage-column-title">
                                                            {stage.name} <span className="stage-column-count">({stageProjects.length})</span>
                                                        </h3>
                                                    </div>
                                                    <div className="stage-column-actions">
                                                        <button
                                                            type="button"
                                                            className="stage-action-btn"
                                                            title={`Add task to ${stage.name}`}
                                                            onClick={() => {
                                                                const firstProj = stageProjects[0];
                                                                setTaskForm({ ...blankTask, stageId: stage.id, projectId: firstProj?.id || "" });
                                                                setCreateTask(true);
                                                            }}
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                        <div style={{ position: "relative" }}>
                                                            <button
                                                                type="button"
                                                                className="stage-action-btn"
                                                                title="Stage options"
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setStageMenu(stageMenu === stage.id ? null : stage.id);
                                                                }}
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            {stageMenu === stage.id && (
                                                                <div
                                                                    className="activity-menu"
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: "calc(100% + 4px)",
                                                                        right: 0,
                                                                        zIndex: 40,
                                                                    }}
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditStage(stage);
                                                                            setStageForm({ name: stage.name, color: stage.color || "#2563eb", terminalType: stage.terminalType || "" });
                                                                            setStageMenu(null);
                                                                        }}
                                                                    >
                                                                        <Edit3 size={14} /> Edit Stage
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="danger"
                                                                        onClick={() => {
                                                                            deleteStage(stage.id);
                                                                            setStageMenu(null);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} /> Delete Stage
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="stage-column-cards">
                                                    {stageProjects.length === 0 ? (
                                                        <div className="stage-column-empty">
                                                            No projects in this stage
                                                        </div>
                                                    ) : (
                                                        stageProjects.map(proj => {
                                                            const overdueCount = tasks.filter(t => t.projectId === proj.id && t.stageId === stage.id && isOverdue(t.dueDate, t.status, "task")).length;

                                                            const pendingCount = approvals.filter(a => a.projectId === proj.id && a.stageId === stage.id && ["draft", "sent", "in_review"].includes(a.status)).length;

                                                            const dueText = formatCardDate(proj.targetCompletionDate);
                                                            const budgetVal = proj.approvedBudget ?? proj.projectValue;
                                                            const assigneeName = proj.designerName || "Unassigned";
                                                            const initials = getInitials(assigneeName);

                                                            return (
                                                                <div
                                                                    key={proj.id}
                                                                    className="stage-project-card"
                                                                    onClick={() => router.push(`/projects`)}
                                                                >
                                                                    <div className="stage-project-card-header">
                                                                        <span className="stage-project-code">{proj.projectCode || "—"}</span>
                                                                        <span className="stage-project-due">
                                                                            <Calendar size={13} />
                                                                            Due {dueText}
                                                                        </span>
                                                                    </div>

                                                                    <div className="stage-project-card-main">
                                                                        <h4 className="stage-project-name">{proj.name}</h4>
                                                                        <span className="stage-project-amount">{budgetVal != null ? money(budgetVal) : "—"}</span>
                                                                    </div>

                                                                    <div className="stage-project-client">{proj.clientName || "—"}</div>

                                                                    {(overdueCount > 0 || pendingCount > 0) && (
                                                                        <div className="stage-project-badges">
                                                                            {overdueCount > 0 && (
                                                                                <span className="stage-project-badge overdue">
                                                                                    {overdueCount} overdue task{overdueCount !== 1 ? "s" : ""}
                                                                                </span>
                                                                            )}
                                                                            {pendingCount > 0 && (
                                                                                <span className="stage-project-badge pending">
                                                                                    {pendingCount} pending approval{pendingCount !== 1 ? "s" : ""}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <div className="stage-project-card-footer" onClick={e => e.stopPropagation()}>
                                                                        <div className="stage-project-assignee-group">
                                                                            <div className="stage-project-avatar">{initials}</div>
                                                                            <span className="stage-project-assignee-name">{assigneeName}</span>
                                                                        </div>

                                                                        <div style={{ position: "relative" }}>
                                                                            <button
                                                                                type="button"
                                                                                className="stage-project-menu-btn"
                                                                                onClick={e => {
                                                                                    e.stopPropagation();
                                                                                    setCardMenu(cardMenu === proj.id ? null : proj.id);
                                                                                }}
                                                                                aria-label="Project actions"
                                                                            >
                                                                                <MoreHorizontal size={16} />
                                                                            </button>

                                                                            {cardMenu === proj.id && (
                                                                                <div
                                                                                    className="card-action-menu"
                                                                                    style={{
                                                                                        position: "absolute",
                                                                                        bottom: "calc(100% + 4px)",
                                                                                        right: 0,
                                                                                        background: "#fff",
                                                                                        border: "1px solid #e2e8f0",
                                                                                        borderRadius: "8px",
                                                                                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                                                                        zIndex: 50,
                                                                                        minWidth: "160px",
                                                                                        padding: "4px",
                                                                                        display: "flex",
                                                                                        flexDirection: "column",
                                                                                        gap: "2px",
                                                                                    }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                                >
                                                                                    <button
                                                                                        type="button"
                                                                                        style={{
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "8px",
                                                                                            padding: "8px 12px",
                                                                                            border: 0,
                                                                                            background: "transparent",
                                                                                            fontSize: "12.5px",
                                                                                            color: "#1e293b",
                                                                                            borderRadius: "4px",
                                                                                            cursor: "pointer",
                                                                                            textAlign: "left",
                                                                                        }}
                                                                                        onClick={() => {
                                                                                            setCardMenu(null);
                                                                                            router.push(`/projects`);
                                                                                        }}
                                                                                    >
                                                                                        View Project
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        style={{
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "8px",
                                                                                            padding: "8px 12px",
                                                                                            border: 0,
                                                                                            background: "transparent",
                                                                                            fontSize: "12.5px",
                                                                                            color: "#1e293b",
                                                                                            borderRadius: "4px",
                                                                                            cursor: "pointer",
                                                                                            textAlign: "left",
                                                                                        }}
                                                                                        onClick={() => {
                                                                                            setCardMenu(null);
                                                                                            setTaskForm({ ...blankTask, projectId: proj.id, stageId: stage.id });
                                                                                            setCreateTask(true);
                                                                                        }}
                                                                                    >
                                                                                        Add Task
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        style={{
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "8px",
                                                                                            padding: "8px 12px",
                                                                                            border: 0,
                                                                                            background: "transparent",
                                                                                            fontSize: "12.5px",
                                                                                            color: "#1e293b",
                                                                                            borderRadius: "4px",
                                                                                            cursor: "pointer",
                                                                                            textAlign: "left",
                                                                                        }}
                                                                                        onClick={() => {
                                                                                            setCardMenu(null);
                                                                                            setApprovalForm({ ...blankApproval, projectId: proj.id, stageId: stage.id });
                                                                                            setCreateApproval(true);
                                                                                        }}
                                                                                    >
                                                                                        Add Approval
                                                                                    </button>
                                                                                    <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "2px 0" }} />
                                                                                    <div style={{ padding: "4px 8px", fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>MOVE TO STAGE</div>
                                                                                    {stages.filter(s => s.id !== stage.id).map(targetStage => (
                                                                                        <button
                                                                                            key={targetStage.id}
                                                                                            type="button"
                                                                                            style={{
                                                                                                display: "flex",
                                                                                                alignItems: "center",
                                                                                                gap: "8px",
                                                                                                padding: "6px 12px",
                                                                                                border: 0,
                                                                                                background: "transparent",
                                                                                                fontSize: "12px",
                                                                                                color: "#475569",
                                                                                                borderRadius: "4px",
                                                                                                cursor: "pointer",
                                                                                                textAlign: "left",
                                                                                            }}
                                                                                            onClick={() => {
                                                                                                setCardMenu(null);
                                                                                                void moveProjectToStage(proj, targetStage);
                                                                                            }}
                                                                                        >
                                                                                            → {targetStage.name}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<LayoutList size={48} />}
                                    title="No stages yet"
                                    detail="Create stages to define your activity workflow."
                                    action={<button className="primary" onClick={() => setCreateStage(true)}><Plus size={18} />Create Stage</button>}
                                />
                            )}
                        </section>
                    )}

                    {activeTab === "tasks" && (
                        <section className="activities-panel" style={{ background: "transparent", border: 0, padding: 0, boxShadow: "none" }}>
                            {/* 4 Dynamic KPI Cards */}
                            <div className="tasks-kpi-grid">
                                <div className="tasks-kpi-card">
                                    <span className="tasks-kpi-title">Total Tasks</span>
                                    <span className="tasks-kpi-value">{kpiStats.total}</span>
                                    <span className="tasks-kpi-trend positive">+2 Added Yesterday</span>
                                </div>
                                <div className="tasks-kpi-card">
                                    <span className="tasks-kpi-title">Overdue</span>
                                    <span className="tasks-kpi-value">{kpiStats.overdue}</span>
                                    <span className="tasks-kpi-trend negative">↑ 24% vs last month</span>
                                </div>
                                <div className="tasks-kpi-card">
                                    <span className="tasks-kpi-title">In-Progress</span>
                                    <span className="tasks-kpi-value">{kpiStats.inProgress}</span>
                                    <span className="tasks-kpi-trend positive">↑ 13% vs yesterday</span>
                                </div>
                                <div className="tasks-kpi-card">
                                    <span className="tasks-kpi-title">Completed</span>
                                    <span className="tasks-kpi-value">{kpiStats.completed}</span>
                                    <span className="tasks-kpi-trend negative">↓ 1 vs last month</span>
                                </div>
                            </div>

                            {/* Tasks Table Card */}
                            <div className="tasks-table-card">
                                {loadingTasks && tasks.length === 0 ? (
                                    <LoadingSkeleton />
                                ) : (
                                    <>
                                        <div className="tasks-table-wrap">
                                            <table className="tasks-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: "40px" }}>
                                                            <input
                                                                type="checkbox"
                                                                className="tasks-checkbox"
                                                                checked={paginatedTasks.length > 0 && paginatedTasks.every(t => selectedTaskIds.includes(t.id))}
                                                                onChange={toggleSelectAll}
                                                                aria-label="Select all tasks"
                                                            />
                                                        </th>
                                                        <th>TASK</th>
                                                        <th>PROJECT</th>
                                                        <th>STAGE</th>
                                                        <th>ASSIGNED TO</th>
                                                        <th>DUE DATE</th>
                                                        <th>PRIORITY</th>
                                                        <th>STATUS</th>
                                                        <th>UPDATED</th>
                                                        <th style={{ width: "40px" }} />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedTasks.length > 0 ? (
                                                        paginatedTasks.map(t => <TaskRow key={t.id} task={t} />)
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={10} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                                                                No tasks found matching your search or filters.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Table Footer with dynamic count and pagination */}
                                        <div className="tasks-table-footer">
                                            <div>Total Tasks: {filteredTasks.length}</div>
                                            <div className="tasks-pagination">
                                                <button
                                                    type="button"
                                                    className="tasks-page-btn"
                                                    disabled={taskPage <= 1}
                                                    onClick={() => setTaskPage(p => Math.max(1, p - 1))}
                                                    aria-label="Previous page"
                                                >
                                                    &lt;
                                                </button>
                                                {Array.from({ length: totalTaskPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
                                                    <button
                                                        key={pageNum}
                                                        type="button"
                                                        className={`tasks-page-btn ${pageNum === taskPage ? "active" : ""}`}
                                                        onClick={() => setTaskPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="tasks-page-btn"
                                                    disabled={taskPage >= totalTaskPages}
                                                    onClick={() => setTaskPage(p => Math.min(totalTaskPages, p + 1))}
                                                    aria-label="Next page"
                                                >
                                                    &gt;
                                                </button>
                                            </div>
                                            <div className="tasks-page-size">
                                                <span>Show per Page:</span>
                                                <select
                                                    value={taskPageSize}
                                                    onChange={e => {
                                                        setTaskPageSize(Number(e.target.value));
                                                        setTaskPage(1);
                                                    }}
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === "approvals" && (
                        <section className="activities-panel" style={{ background: "transparent", border: 0, padding: 0, boxShadow: "none" }}>
                            {/* 4 Dynamic KPI Cards */}
                            <div className="tasks-kpi-grid">
                                <div className="tasks-kpi-card">
                                    <span className="tasks-kpi-title">Total Approvals</span>
                                    <span className="tasks-kpi-value">{approvalKpiStats.total}</span>
                                    <span className="tasks-kpi-trend positive">+2 Added Yesterday</span>
                                </div>
                                <div className="tasks-kpi-card">
                                    <span className="tasks-kpi-title">Overdue</span>
                                    <span className="tasks-kpi-value">{approvalKpiStats.overdue}</span>
                                    <span className="tasks-kpi-trend negative">↑ 24% vs last month</span>
                                </div>
                                <div className="tasks-kpi-card">
                                    <span className="tasks-kpi-title">In-Review</span>
                                    <span className="tasks-kpi-value">{approvalKpiStats.inReview}</span>
                                    <span className="tasks-kpi-trend positive">↑ 13% vs yesterday</span>
                                </div>
                                <div className="tasks-kpi-card">
                                    <span className="tasks-kpi-title">Approved</span>
                                    <span className="tasks-kpi-value">{approvalKpiStats.approved}</span>
                                    <span className="tasks-kpi-trend negative">↓ 1 vs last month</span>
                                </div>
                            </div>

                            {/* Approvals Table Card */}
                            <div className="tasks-table-card">
                                {loadingApprovals && approvals.length === 0 ? (
                                    <LoadingSkeleton />
                                ) : (
                                    <>
                                        <div className="tasks-table-wrap">
                                            <table className="tasks-table">
                                                <thead>
                                                    <tr>
                                                        <th>APPROVAL NAME</th>
                                                        <th>PROJECT</th>
                                                        <th>STAGE</th>
                                                        <th>APPROVER</th>
                                                        <th>STATUS</th>
                                                        <th>DUE DATE</th>
                                                        <th>REQUESTED BY</th>
                                                        <th>REQUESTED DATE</th>
                                                        <th style={{ width: "40px" }} />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedApprovals.length > 0 ? (
                                                        paginatedApprovals.map(a => <ApprovalRow key={a.id} approval={a} />)
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                                                                No approvals found matching your search or filters.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Table Footer with dynamic count and pagination */}
                                        <div className="tasks-table-footer">
                                            <div>Total Approvals: {filteredApprovals.length}</div>
                                            <div className="tasks-pagination">
                                                <button
                                                    type="button"
                                                    className="tasks-page-btn"
                                                    disabled={approvalPage <= 1}
                                                    onClick={() => setApprovalPage(p => Math.max(1, p - 1))}
                                                    aria-label="Previous page"
                                                >
                                                    &lt;
                                                </button>
                                                {Array.from({ length: totalApprovalPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
                                                    <button
                                                        key={pageNum}
                                                        type="button"
                                                        className={`tasks-page-btn ${pageNum === approvalPage ? "active" : ""}`}
                                                        onClick={() => setApprovalPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="tasks-page-btn"
                                                    disabled={approvalPage >= totalApprovalPages}
                                                    onClick={() => setApprovalPage(p => Math.min(totalApprovalPages, p + 1))}
                                                    aria-label="Next page"
                                                >
                                                    &gt;
                                                </button>
                                            </div>
                                            <div className="tasks-page-size">
                                                <span>Show per Page:</span>
                                                <select
                                                    value={approvalPageSize}
                                                    onChange={e => {
                                                        setApprovalPageSize(Number(e.target.value));
                                                        setApprovalPage(1);
                                                    }}
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    {TaskDetailDrawer()}
                    {ApprovalDetailDrawer()}
                    {StageModal()}
                    {TaskModal()}
                    {ApprovalModal()}
                    {notice && <div className="notice-banner">{notice}<button onClick={() => setNotice(null)}><X size={14} /></button></div>}
                </section>
            </div>
        </main>
    );
}