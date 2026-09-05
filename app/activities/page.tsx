"use client";

import {
    Plus,
    Search,
    ChevronDown,
    ChevronRight,
    Edit3,
    Trash2,
    MoreHorizontal,
    X,
    Check,
    AlertCircle,
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

const navRoutes = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing", "/activities"];
const navIcons = [
    "dashboard-overview-active",
    "dashboard-projects",
    "dashboard-boqs",
    "dashboard-costs",
    "dashboard-workspace",
    "dashboard-estimates",
    "dashboard-purchase-orders",
    "dashboard-analytics",
    "dashboard-reports",
    "dashboard-integrations",
    "dashboard-billing",
    "dashboard-activities-active",
];

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
    dueDate: string;
    status: "draft" | "sent" | "in_review" | "approved" | "changes_required" | "rejected" | "cancelled";
    requestedAt: string | null;
    decidedAt: string | null;
    attachments: Record<string, unknown>[];
    requestedBy: string;
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
    assignedTo: string;
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

const blankStage: StageForm = { name: "", color: "#2563eb", terminalType: "" };
const blankTask: TaskForm = { name: "", projectId: "", stageId: "", description: "", assignedTo: "", ownerId: "", dueDate: "", priority: "medium", status: "not_started" };
const blankApproval: ApprovalForm = { name: "", projectId: "", stageId: "", description: "", approverId: "", approverName: "", dueDate: "", status: "draft" };

const today = () => new Date().toISOString().slice(0, 10);
const money = (n?: number | null) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const date = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${x}T00:00:00`)) : "—";
const words = (x: string) => x.replace(/_/g, " ");
const priorityColor = (p: string) => ({ low: "#22c55e", medium: "#f59e0b", high: "#ef4444", critical: "#7c3aed" }[p] || "#64748b");
const statusColor = (s: string) => ({
    not_started: "#94a3b8",
    in_progress: "#2563eb",
    blocked: "#ef4444",
    completed: "#22c55e",
    cancelled: "#64748b",
    draft: "#94a3b8",
    sent: "#3b82f6",
    in_review: "#f59e0b",
    approved: "#22c55e",
    changes_required: "#ef4444",
    rejected: "#dc2626",
}[s] || "#64748b");

export default function ActivitiesPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<ActivitySummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);

    const [stages, setStages] = useState<ActivityStage[]>([]);
    const [loadingStages, setLoadingStages] = useState(true);
    const [stageQuery, setStageQuery] = useState("");
    const [stageFilter, setStageFilter] = useState("all");
    const [stageMenu, setStageMenu] = useState<string | null>(null);
    const [createStage, setCreateStage] = useState(false);
    const [editStage, setEditStage] = useState<ActivityStage | null>(null);
    const [stageForm, setStageForm] = useState<StageForm>(blankStage);
    const [stageError, setStageError] = useState("");

    const [tasks, setTasks] = useState<ActivityTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [taskQuery, setTaskQuery] = useState("");
    const [taskFilter, setTaskFilter] = useState("all");
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

    const [approvals, setApprovals] = useState<ActivityApproval[]>([]);
    const [loadingApprovals, setLoadingApprovals] = useState(true);
    const [approvalQuery, setApprovalQuery] = useState("");
    const [approvalFilter, setApprovalFilter] = useState("all");
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

    const [activeTab, setActiveTab] = useState<"stages" | "tasks" | "approvals">("stages");
    const [notice, setNotice] = useState<string | null>(null);

    const loadSummary = useCallback(async () => {
        try {
            const data = await getActivitySummary();
            setSummary(data);
        } catch {
            setNotice("Could not load activity summary");
        } finally {
            setLoadingSummary(false);
        }
    }, []);

    const loadStages = useCallback(async () => {
        setLoadingStages(true);
        try {
            const data = await listActivityStages();
            setStages(data.items || []);
        } catch {
            setNotice("Could not load stages");
        } finally {
            setLoadingStages(false);
        }
    }, []);

    const loadTasks = useCallback(async () => {
        setLoadingTasks(true);
        try {
            const data = await listActivityTasks({ pageSize: 100 });
            setTasks(data.items || []);
        } catch {
            setNotice("Could not load tasks");
        } finally {
            setLoadingTasks(false);
        }
    }, []);

    const loadApprovals = useCallback(async () => {
        setLoadingApprovals(true);
        try {
            const data = await listActivityApprovals({ pageSize: 100 });
            setApprovals(data.items || []);
        } catch {
            setNotice("Could not load approvals");
        } finally {
            setLoadingApprovals(false);
        }
    }, []);

    const loadProjectsForForms = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/projects?pageSize=200&sortBy=updatedAt&sortOrder=desc", { credentials: "include" });
            const data = await res.json();
            if (res.ok && data.data?.items) {
                const projects = data.data.items.map((p: any) => ({ id: p.id, name: p.name, projectCode: p.projectCode }));
                setTaskProjects(projects);
                setApprovalProjects(projects);
            }
        } catch { }
    }, []);

    const loadStagesForForms = useCallback(async () => {
        try {
            const data = await listActivityStages();
            setTaskStages(data.items || []);
            setApprovalStages(data.items || []);
        } catch { }
    }, []);

    useEffect(() => {
        loadSummary();
        loadStages();
        loadTasks();
        loadApprovals();
        loadProjectsForForms();
        loadStagesForForms();
    }, [loadSummary, loadStages, loadTasks, loadApprovals, loadProjectsForForms, loadStagesForForms]);

    useEffect(() => {
        const close = () => { setStageMenu(null); setTaskMenu(null); setApprovalMenu(null); };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    const filteredStages = useMemo(() => stages.filter(s => !stageQuery || s.name.toLowerCase().includes(stageQuery.toLowerCase())), [stages, stageQuery]);
    const filteredTasks = useMemo(() => tasks.filter(t => {
        if (taskQuery && !t.name.toLowerCase().includes(taskQuery.toLowerCase()) && !t.project?.name?.toLowerCase().includes(taskQuery.toLowerCase())) return false;
        if (taskFilter !== "all" && t.status !== taskFilter) return false;
        return true;
    }), [tasks, taskQuery, taskFilter]);
    const filteredApprovals = useMemo(() => approvals.filter(a => {
        if (approvalQuery && !a.name.toLowerCase().includes(approvalQuery.toLowerCase()) && !a.project?.name?.toLowerCase().includes(approvalQuery.toLowerCase())) return false;
        if (approvalFilter !== "all" && a.status !== approvalFilter) return false;
        return true;
    }), [approvals, approvalQuery, approvalFilter]);

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

    const handleTaskSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTaskError("");
        if (!taskForm.name || !taskForm.projectId || !taskForm.stageId) {
            setTaskError("Name, project, and stage are required");
            return;
        }
        try {
            if (taskDetail) {
                await updateActivityTask(taskDetail.id, taskForm);
            } else {
                await createActivityTask(taskForm);
            }
            setCreateTask(false);
            setTaskDetail(null);
            setTaskForm(blankTask);
            loadTasks();
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
        try {
            if (approvalDetail) {
                await updateActivityApproval(approvalDetail.id, approvalForm);
            } else {
                await createActivityApproval(approvalForm);
            }
            setCreateApproval(false);
            setApprovalDetail(null);
            setApprovalForm(blankApproval);
            loadApprovals();
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

    const openTaskDetail = async (task: ActivityTask) => {
        try {
            const data = await getActivityTask(task.id);
            setTaskDetail(data);
            const comments = await listActivityTaskComments(task.id);
            setTaskComments(comments.items || []);
        } catch { setNotice("Could not load task details"); }
    };

    const openApprovalDetail = async (approval: ActivityApproval) => {
        try {
            const data = await getActivityApproval(approval.id);
            setApprovalDetail(data);
            const comments = await listActivityApprovalComments(approval.id);
            setApprovalComments(comments.items || []);
        } catch { setNotice("Could not load approval details"); }
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
        if (!approvalCommentText.trim() || !approvalDetail) return;
        setSendingApprovalComment(true);
        try {
            await createActivityApprovalComment(approvalDetail.id, { body: approvalCommentText.trim() });
            setApprovalCommentText("");
            const comments = await listActivityApprovalComments(approvalDetail.id);
            setApprovalComments(comments.items || []);
            loadApprovals();
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

    const isOverdue = (dueDate: string | null, status: string, type: "task" | "approval") => {
        if (!dueDate) return false;
        const today = new Date().toISOString().slice(0, 10);
        if (type === "task") return dueDate < today && !["completed", "cancelled"].includes(status);
        return dueDate < today && !["approved", "rejected", "cancelled", "changes_required"].includes(status);
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

    const TaskRow = ({ task }: { task: ActivityTask }) => (
        <tr onClick={() => openTaskDetail(task)} style={{ cursor: "pointer" }}>
            <td><span className="task-id">{task.project?.projectCode || task.projectId.slice(0, 8)}</span></td>
            <td>
                <b>{task.name}</b>
                <small>{task.project?.name}</small>
            </td>
            <td><span className="stage-badge" style={{ background: task.stage?.color || "#2563eb" }}>{task.stage?.name}</span></td>
            <td><span className="status-badge" style={{ background: statusColor(task.status) }}>{words(task.status)}</span></td>
            <td><span className="priority-badge" style={{ background: priorityColor(task.priority), color: "#fff" }}>{task.priority}</span></td>
            <td className={isOverdue(task.dueDate, task.status, "task") ? "overdue" : ""}>{date(task.dueDate)}</td>
            <td>
                <button onClick={e => { e.stopPropagation(); setTaskMenu(taskMenu === task.id ? null : task.id); }}><MoreHorizontal size={14} /></button>
                {taskMenu === task.id && (
                    <div className="activity-menu">
                        <button onClick={() => { openTaskDetail(task); setTaskMenu(null); }}><MessageSquare size={14} />Details</button>
                        <button onClick={() => { setTaskDetail(task); setTaskForm({ ...blankTask, name: task.name, projectId: task.projectId, stageId: task.stageId, description: task.description || "", assignedTo: task.assignedTo || "", ownerId: task.ownerId || "", dueDate: task.dueDate || "", priority: task.priority, status: task.status }); setCreateTask(true); setTaskMenu(null); }}><Edit3 size={14} />Edit</button>
                    </div>
                )}
            </td>
        </tr>
    );

    const ApprovalRow = ({ approval }: { approval: ActivityApproval }) => (
        <tr onClick={() => openApprovalDetail(approval)} style={{ cursor: "pointer" }}>
            <td><span className="task-id">{approval.project?.projectCode || approval.projectId.slice(0, 8)}</span></td>
            <td>
                <b>{approval.name}</b>
                <small>{approval.project?.name}</small>
            </td>
            <td><span className="stage-badge" style={{ background: approval.stage?.color || "#2563eb" }}>{approval.stage?.name}</span></td>
            <td><span className="status-badge" style={{ background: statusColor(approval.status) }}>{words(approval.status)}</span></td>
            <td>{approval.approverName || approval.approverId?.slice(0, 8) || "—"}</td>
            <td className={isOverdue(approval.dueDate, approval.status, "approval") ? "overdue" : ""}>{date(approval.dueDate)}</td>
            <td>
                <button onClick={e => { e.stopPropagation(); setApprovalMenu(approvalMenu === approval.id ? null : approval.id); }}><MoreHorizontal size={14} /></button>
                {approvalMenu === approval.id && (
                    <div className="activity-menu">
                        <button onClick={() => { openApprovalDetail(approval); setApprovalMenu(null); }}><MessageSquare size={14} />Details</button>
                        <button onClick={() => { setApprovalDetail(approval); setApprovalForm({ ...blankApproval, name: approval.name, projectId: approval.projectId, stageId: approval.stageId, description: approval.description || "", approverId: approval.approverId || "", approverName: approval.approverName || "", dueDate: approval.dueDate, status: (["draft", "sent", "in_review"].includes(approval.status) ? approval.status : "draft") as "draft" | "sent" | "in_review" }); setCreateApproval(true); setApprovalMenu(null); }}><Edit3 size={14} />Edit</button>
                        {["draft", "sent", "in_review"].includes(approval.status) && (
                            <>
                                <button onClick={() => { decideApproval("approved"); setApprovalMenu(null); }}><Check size={14} />Approve</button>
                                <button onClick={() => { decideApproval("changes_required"); setApprovalMenu(null); }}><Flag size={14} />Request Changes</button>
                                <button className="danger" onClick={() => { decideApproval("rejected"); setApprovalMenu(null); }}><X size={14} />Reject</button>
                            </>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );

    const TaskDetailDrawer = () => {
        if (!taskDetail) return null;
        return (
            <div className="activity-drawer-backdrop" onClick={() => setTaskDetail(null)}>
                <div className="activity-drawer" onClick={e => e.stopPropagation()}>
                    <header>
                        <div>
                            <span className="stage-badge" style={{ background: taskDetail.stage?.color || "#2563eb" }}>{taskDetail.stage?.name}</span>
                            <h3>{taskDetail.name}</h3>
                        </div>
                        <button onClick={() => setTaskDetail(null)}><X size={20} /></button>
                    </header>
                    <div className="drawer-content">
                        <section className="drawer-section">
                            <h4>Details</h4>
                            <div className="detail-grid">
                                <div><small>Project</small><b>{taskDetail.project?.name}</b></div>
                                <div><small>Status</small><span className="status-badge" style={{ background: statusColor(taskDetail.status) }}>{words(taskDetail.status)}</span></div>
                                <div><small>Priority</small><span className="priority-badge" style={{ background: priorityColor(taskDetail.priority), color: "#fff" }}>{taskDetail.priority}</span></div>
                                <div><small>Due Date</small><b className={isOverdue(taskDetail.dueDate, taskDetail.status, "task") ? "overdue" : ""}>{date(taskDetail.dueDate)}</b></div>
                                <div><small>Assigned To</small><b>{taskDetail.assignedTo?.slice(0, 8) || "Unassigned"}</b></div>
                                <div><small>Owner</small><b>{taskDetail.ownerId?.slice(0, 8) || "Unassigned"}</b></div>
                            </div>
                            {taskDetail.description && <p className="description">{taskDetail.description}</p>}
                        </section>
                        <section className="drawer-section">
                            <div className="section-header">
                                <h4>Comments</h4>
                            </div>
                            <div className="comments-list">
                                {taskComments.map(c => (
                                    <div key={c.id} className="comment">
                                        <div className="comment-header">
                                            <span className="comment-author">{c.authorId.slice(0, 8)}</span>
                                            <span className="comment-time">{date(c.createdAt)}</span>
                                        </div>
                                        <p>{c.body}</p>
                                    </div>
                                ))}
                                {!taskComments.length && <p className="no-comments">No comments yet</p>}
                            </div>
                            <div className="comment-input">
                                <input value={taskCommentText} onChange={e => setTaskCommentText(e.target.value)} placeholder="Add a comment..." onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendTaskComment())} />
                                <button onClick={sendTaskComment} disabled={sendingTaskComment || !taskCommentText.trim()}><MessageSquare size={18} /></button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        );
    };

    const ApprovalDetailDrawer = () => {
        if (!approvalDetail) return null;
        return (
            <div className="activity-drawer-backdrop" onClick={() => setApprovalDetail(null)}>
                <div className="activity-drawer" onClick={e => e.stopPropagation()}>
                    <header>
                        <div>
                            <span className="stage-badge" style={{ background: approvalDetail.stage?.color || "#2563eb" }}>{approvalDetail.stage?.name}</span>
                            <h3>{approvalDetail.name}</h3>
                        </div>
                        <button onClick={() => setApprovalDetail(null)}><X size={20} /></button>
                    </header>
                    <div className="drawer-content">
                        <section className="drawer-section">
                            <h4>Details</h4>
                            <div className="detail-grid">
                                <div><small>Project</small><b>{approvalDetail.project?.name}</b></div>
                                <div><small>Status</small><span className="status-badge" style={{ background: statusColor(approvalDetail.status) }}>{words(approvalDetail.status)}</span></div>
                                <div><small>Due Date</small><b className={isOverdue(approvalDetail.dueDate, approvalDetail.status, "approval") ? "overdue" : ""}>{date(approvalDetail.dueDate)}</b></div>
                                <div><small>Approver</small><b>{approvalDetail.approverName || approvalDetail.approverId?.slice(0, 8) || "Unassigned"}</b></div>
                                <div><small>Requested By</small><b>{approvalDetail.requestedBy?.slice(0, 8)}</b></div>
                                <div><small>Requested At</small><b>{approvalDetail.requestedAt ? date(approvalDetail.requestedAt) : "—"}</b></div>
                                <div><small>Decided At</small><b>{approvalDetail.decidedAt ? date(approvalDetail.decidedAt) : "—"}</b></div>
                            </div>
                            {approvalDetail.description && <p className="description">{approvalDetail.description}</p>}
                        </section>
                        <section className="drawer-section">
                            <div className="section-header">
                                <h4>Comments & Decisions</h4>
                            </div>
                            <div className="comments-list">
                                {approvalComments.map(c => (
                                    <div key={c.id} className="comment">
                                        <div className="comment-header">
                                            <span className="comment-author">{c.authorId.slice(0, 8)}</span>
                                            <span className="comment-time">{date(c.createdAt)}</span>
                                        </div>
                                        <p>{c.body}</p>
                                    </div>
                                ))}
                                {!approvalComments.length && <p className="no-comments">No comments yet</p>}
                            </div>
                            <div className="comment-input">
                                <input value={approvalCommentText} onChange={e => setApprovalCommentText(e.target.value)} placeholder="Add a comment or decision note..." onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendApprovalComment())} />
                                <button onClick={sendApprovalComment} disabled={sendingApprovalComment || !approvalCommentText.trim()}><MessageSquare size={18} /></button>
                            </div>
                        </section>
                        {["draft", "sent", "in_review"].includes(approvalDetail.status) && (
                            <div className="approval-actions">
                                <button onClick={() => decideApproval("approved")} className="primary"><Check size={16} />Approve</button>
                                <button onClick={() => decideApproval("changes_required")}><Flag size={16} />Request Changes</button>
                                <button className="danger" onClick={() => decideApproval("rejected")}><X size={16} />Reject</button>
                            </div>
                        )}
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
            <div className="activity-modal-backdrop" onClick={() => { setCreateTask(false); setTaskDetail(null); setTaskForm(blankTask); }}>
                <div className="activity-modal wide" onClick={e => e.stopPropagation()}>
                    <header>
                        <h3>{taskDetail ? "Edit Task" : "New Task"}</h3>
                        <button onClick={() => { setCreateTask(false); setTaskDetail(null); setTaskForm(blankTask); }}><X size={20} /></button>
                    </header>
                    <form onSubmit={handleTaskSubmit}>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Task Name <em>*</em></label>
                                <input required value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Review floor plans" />
                            </div>
                            <div className="form-field">
                                <label>Project <em>*</em></label>
                                <select required value={taskForm.projectId} onChange={e => setTaskForm(f => ({ ...f, projectId: e.target.value }))}>
                                    <option value="">Select project</option>
                                    {taskProjects.map(p => <option key={p.id} value={p.id}>{p.projectCode || p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Stage <em>*</em></label>
                                <select required value={taskForm.stageId} onChange={e => setTaskForm(f => ({ ...f, stageId: e.target.value }))}>
                                    <option value="">Select stage</option>
                                    {taskStages.map(s => <option key={s.id} value={s.id} style={{ borderLeft: `4px solid ${s.color || "#2563eb"}` }}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Priority</label>
                                <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as TaskForm["priority"] }))}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Status</label>
                                <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value as TaskForm["status"] }))}>
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Due Date</label>
                                <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} min={today()} />
                            </div>
                            <div className="form-field full-width">
                                <label>Assigned To (User ID)</label>
                                <input value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="User UUID" />
                            </div>
                            <div className="form-field full-width">
                                <label>Owner (User ID)</label>
                                <input value={taskForm.ownerId} onChange={e => setTaskForm(f => ({ ...f, ownerId: e.target.value }))} placeholder="User UUID" />
                            </div>
                            <div className="form-field full-width">
                                <label>Description</label>
                                <textarea rows={3} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details..." />
                            </div>
                        </div>
                        {taskError && <p className="form-error">{taskError}</p>}
                        <footer>
                            <button type="button" onClick={() => { setCreateTask(false); setTaskDetail(null); setTaskForm(blankTask); }}>Cancel</button>
                            <button type="submit" className="primary">{taskDetail ? "Save Changes" : "Create Task"}</button>
                        </footer>
                    </form>
                </div>
            </div>
        );
    };

    const ApprovalModal = () => {
        if (!createApproval && !approvalDetail) return null;
        return (
            <div className="activity-modal-backdrop" onClick={() => { setCreateApproval(false); setApprovalDetail(null); setApprovalForm(blankApproval); }}>
                <div className="activity-modal wide" onClick={e => e.stopPropagation()}>
                    <header>
                        <h3>{approvalDetail ? "Edit Approval" : "New Approval"}</h3>
                        <button onClick={() => { setCreateApproval(false); setApprovalDetail(null); setApprovalForm(blankApproval); }}><X size={20} /></button>
                    </header>
                    <form onSubmit={handleApprovalSubmit}>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Approval Name <em>*</em></label>
                                <input required value={approvalForm.name} onChange={e => setApprovalForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Client sign-off on design" />
                            </div>
                            <div className="form-field">
                                <label>Project <em>*</em></label>
                                <select required value={approvalForm.projectId} onChange={e => setApprovalForm(f => ({ ...f, projectId: e.target.value }))}>
                                    <option value="">Select project</option>
                                    {approvalProjects.map(p => <option key={p.id} value={p.id}>{p.projectCode || p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Stage <em>*</em></label>
                                <select required value={approvalForm.stageId} onChange={e => setApprovalForm(f => ({ ...f, stageId: e.target.value }))}>
                                    <option value="">Select stage</option>
                                    {approvalStages.map(s => <option key={s.id} value={s.id} style={{ borderLeft: `4px solid ${s.color || "#2563eb"}` }}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Status</label>
                                <select value={approvalForm.status} onChange={e => setApprovalForm(f => ({ ...f, status: e.target.value as ApprovalForm["status"] }))}>
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="in_review">In Review</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Due Date <em>*</em></label>
                                <input type="date" required value={approvalForm.dueDate} onChange={e => setApprovalForm(f => ({ ...f, dueDate: e.target.value }))} min={today()} />
                            </div>
                            <div className="form-field">
                                <label>Approver (User ID)</label>
                                <input value={approvalForm.approverId} onChange={e => setApprovalForm(f => ({ ...f, approverId: e.target.value }))} placeholder="User UUID" />
                            </div>
                            <div className="form-field">
                                <label>Approver Name</label>
                                <input value={approvalForm.approverName} onChange={e => setApprovalForm(f => ({ ...f, approverName: e.target.value }))} placeholder="e.g. John Doe" />
                            </div>
                            <div className="form-field full-width">
                                <label>Description</label>
                                <textarea rows={3} value={approvalForm.description} onChange={e => setApprovalForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details..." />
                            </div>
                        </div>
                        {approvalError && <p className="form-error">{approvalError}</p>}
                        <footer>
                            <button type="button" onClick={() => { setCreateApproval(false); setApprovalDetail(null); setApprovalForm(blankApproval); }}>Cancel</button>
                            <button type="submit" className="primary">{approvalDetail ? "Save Changes" : "Create Approval"}</button>
                        </footer>
                    </form>
                </div>
            </div>
        );
    };

    const KPICard = ({ title, value, subtitle, trend, color }: { title: string; value: string | number; subtitle: string; trend?: string; color?: string }) => (
        <div className="kpi-card">
            <div className="kpi-header">
                <span className="kpi-title">{title}</span>
                {trend && <span className={`kpi-trend ${trend.startsWith("+") ? "up" : "down"}`}>{trend}</span>}
            </div>
            <div className="kpi-value" style={{ color: color || "var(--fig-ink)" }}>{value}</div>
            <div className="kpi-subtitle">{subtitle}</div>
        </div>
    );

    return (
        <main className="fig-dashboard boq-dashboard activities-page">
            <div className="fig-dashboard-glow" />
            <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
                <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
                <nav className="fig-dashboard-menu">
                    {navRoutes.map((route, index) => (
                        <button key={route} type="button" className={index === 11 ? "is-current" : ""} aria-label={`Navigate to ${route}`} onClick={() => window.location.assign(route)}>
                            <img src={`/assets/dashboard/${navIcons[index]}.svg`} alt="" />
                        </button>
                    ))}
                </nav>
                <div className="fig-dashboard-tools">
                    <button type="button" aria-label="Help"><img src="/assets/dashboard/dashboard-help.svg" alt="" /></button>
                    <button type="button" aria-label="Settings"><img src="/assets/dashboard/dashboard-settings.svg" alt="" /></button>
                </div>
            </aside>

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Activities</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search">
                            <Search size={16} />
                            <input placeholder="Search activities…" />
                        </label>
                        <button className="fig-dashboard-new" onClick={() => {
                            if (activeTab === "stages") { setCreateStage(true); }
                            else if (activeTab === "tasks") { setCreateTask(true); }
                            else { setCreateApproval(true); }
                        }}>
                            <Plus size={17} /><span>New</span><i /><ChevronDown size={17} />
                        </button>
                        <button className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
                        <div className="fig-dashboard-avatar">AC</div>
                    </div>
                </header>

                <section className="activities-content">
                    <div className="activities-header">
                        <div>
                            <h2>{activeTab === "stages" ? "Stages" : activeTab === "tasks" ? "Tasks" : "Approvals"}</h2>
                            <p>{activeTab === "stages" ? `${stages.length} stage${stages.length !== 1 ? "s" : ""}` : activeTab === "tasks" ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""}` : `${approvals.length} approval${approvals.length !== 1 ? "s" : ""}`}</p>
                        </div>
                        <div className="activities-header-actions">
                            {activeTab === "stages" && <button className="primary" onClick={() => setCreateStage(true)}><Plus size={16} />New Stage</button>}
                            {activeTab === "tasks" && <button className="primary" onClick={() => setCreateTask(true)}><Plus size={16} />New Task</button>}
                            {activeTab === "approvals" && <button className="primary" onClick={() => setCreateApproval(true)}><Plus size={16} />New Approval</button>}
                        </div>
                    </div>

                    {!loadingSummary && summary && (
                        <div className="activities-kpis">
                            <KPICard title="Stages" value={summary.stages} subtitle="Workflow stages" color="#2563eb" />
                            <KPICard title="Total Tasks" value={summary.tasks.total} subtitle={`${summary.tasks.inProgress} in progress · ${summary.tasks.completed} completed`} color="#3b82f6" />
                            <KPICard title="Overdue Tasks" value={summary.tasks.overdue} subtitle="Past due date" color="#ef4444" />
                            <KPICard title="Total Approvals" value={summary.approvals.total} subtitle={`${summary.approvals.inReview} in review · ${summary.approvals.approved} approved`} color="#f59e0b" />
                            <KPICard title="Overdue Approvals" value={summary.approvals.overdue} subtitle="Past due date" color="#ef4444" />
                        </div>
                    )}

                    <nav className="activities-tabs">
                        <button className={activeTab === "stages" ? "active" : ""} onClick={() => setActiveTab("stages")}>
                            <LayoutList size={16} />Stages
                            <span className="tab-count">{stages.length}</span>
                        </button>
                        <button className={activeTab === "tasks" ? "active" : ""} onClick={() => setActiveTab("tasks")}>
                            <Grid2X2 size={16} />Tasks
                            <span className="tab-count">{tasks.length}</span>
                        </button>
                        <button className={activeTab === "approvals" ? "active" : ""} onClick={() => setActiveTab("approvals")}>
                            <Flag size={16} />Approvals
                            <span className="tab-count">{approvals.length}</span>
                        </button>
                    </nav>

                    {activeTab === "stages" && (
                        <section className="activities-panel">
                            <div className="panel-toolbar">
                                <label className="panel-search">
                                    <Search size={16} />
                                    <input placeholder="Search stages…" value={stageQuery} onChange={e => setStageQuery(e.target.value)} />
                                </label>
                                <div className="panel-filter">
                                    <Filter size={16} />
                                    <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                                        <option value="all">All Stages</option>
                                        <option value="completed">Terminal: Completed</option>
                                        <option value="lost">Terminal: Lost</option>
                                    </select>
                                </div>
                            </div>
                            {loadingStages ? <LoadingSkeleton /> : filteredStages.length ? (
                                <div className="stages-grid">{filteredStages.map(s => <StageCard key={s.id} stage={s} />)}</div>
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
                        <section className="activities-panel">
                            <div className="panel-toolbar">
                                <label className="panel-search">
                                    <Search size={16} />
                                    <input placeholder="Search tasks…" value={taskQuery} onChange={e => setTaskQuery(e.target.value)} />
                                </label>
                                <div className="panel-filter">
                                    <Filter size={16} />
                                    <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>
                                        <option value="all">All Statuses</option>
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            {loadingTasks ? <LoadingSkeleton /> : filteredTasks.length ? (
                                <div className="tasks-table-wrap">
                                    <table className="activities-table">
                                        <thead>
                                            <tr>
                                                <th>PROJECT</th>
                                                <th>TASK</th>
                                                <th>STAGE</th>
                                                <th>STATUS</th>
                                                <th>PRIORITY</th>
                                                <th>DUE DATE</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>{filteredTasks.map(t => <TaskRow key={t.id} task={t} />)}</tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<Grid2X2 size={48} />}
                                    title="No tasks yet"
                                    detail="Create tasks to track work across your projects."
                                    action={<button className="primary" onClick={() => setCreateTask(true)}><Plus size={18} />Create Task</button>}
                                />
                            )}
                        </section>
                    )}

                    {activeTab === "approvals" && (
                        <section className="activities-panel">
                            <div className="panel-toolbar">
                                <label className="panel-search">
                                    <Search size={16} />
                                    <input placeholder="Search approvals…" value={approvalQuery} onChange={e => setApprovalQuery(e.target.value)} />
                                </label>
                                <div className="panel-filter">
                                    <Filter size={16} />
                                    <select value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)}>
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
                            </div>
                            {loadingApprovals ? <LoadingSkeleton /> : filteredApprovals.length ? (
                                <div className="tasks-table-wrap">
                                    <table className="activities-table">
                                        <thead>
                                            <tr>
                                                <th>PROJECT</th>
                                                <th>APPROVAL</th>
                                                <th>STAGE</th>
                                                <th>STATUS</th>
                                                <th>APPROVER</th>
                                                <th>DUE DATE</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>{filteredApprovals.map(a => <ApprovalRow key={a.id} approval={a} />)}</tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<Flag size={48} />}
                                    title="No approvals yet"
                                    detail="Create approvals to manage review workflows."
                                    action={<button className="primary" onClick={() => setCreateApproval(true)}><Plus size={18} />Create Approval</button>}
                                />
                            )}
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