"use client";

import {
  ArrowLeft,
  ChevronDown,
  Eye,
  FileText,
  Grid2X2,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  X,
  Mail,
  Send,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Edit2,
  Copy,
  Download,
  PauseCircle,
  PlayCircle,
  Archive,
  Trash2,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Calendar,
  User,
  Paperclip,
  FileSpreadsheet,
  History,
  GitBranch,
  FileDown,
  Folder as FolderIcon,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { recordPayment } from "@/lib/api/invoices";
import { getCostingAnalysis } from "@/lib/api/costing";

export type Project = {
  id: string;
  projectCode?: string;
  name: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  projectType: string;
  status: string;
  location?: string;
  description?: string;
  areaSqft?: number;
  projectValue?: number;
  approvedBudget?: number;
  startDate?: string;
  targetCompletionDate?: string;
  progress?: number;
  imageUrl?: string | null;
  rooms?: { id: string; name: string }[];
  propertyName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  siteAccessNotes?: string;
  organization?: string;
  billingContact?: string;
  communicationPreference?: string;
  actualStartDate?: string;
  currentPhase?: string;
  priority?: string;
  currency?: string;
  taxConfiguration?: string;
  targetMargin?: string | number;
  paymentTerms?: string;
  contractReference?: string;
  projectManager?: string;
  leadDesigner?: string;
  estimator?: string;
  procurementOwner?: string;
  financeOwner?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type Boq = {
  id: string;
  boqNumber: string;
  version: string;
  roomCount: number;
  itemCount: number;
  grandTotal: number;
  status: string;
  updatedAt: string;
  createdAt?: string;
  projectId?: string;
  projectName?: string;
  assignedTo?: string;
  assignedToName?: string;
  subtotal?: number;
  markupPercent?: number;
  taxPercent?: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  projectId?: string;
  milestone?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  status: string;
  paymentMethod?: string;
  transactionReference?: string;
  paidAt?: string;
  receiptUrl?: string;
  notes?: string;
};

export type Folder = {
  id: string;
  name: string;
  itemCount: number;
  sizeBytes: number;
  updatedAt: string;
};

export type Doc = {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  sizeBytes: number;
  updatedAt: string;
  isApproved?: boolean;
  approvalStatus?: "approved" | "pending";
};

export type ClientInvitation = {
  id: string;
  projectId: string;
  email: string;
  clientName: string;
  role: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  message?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
};

const tabs = ["Overview", "Project Details", "BOQs", "Costing", "Project Workspace", "Documents", "Payments", "Activity Log"];

const money = (x?: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(x || 0);
const formatCompactMoney = (value?: number, currency = "INR"): string => {
  if (value === null || value === undefined || isNaN(value)) return "₹0";
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 10000000) {
    const cr = abs / 10000000;
    return `${sign}${symbol}${cr >= 10 ? cr.toFixed(1) : cr.toFixed(2).replace(/\.?0+$/, "")}Cr`;
  }
  if (abs >= 100000) {
    const l = abs / 100000;
    return `${sign}${symbol}${l >= 10 ? l.toFixed(1) : l.toFixed(2).replace(/\.?0+$/, "")}L`;
  }
  return `${sign}${symbol}${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(abs)}`;
};
const date = (x?: string) =>
  x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(x)) : "—";
const words = (x: string) => x.replace(/_/g, " ");
const formatTime = (x?: string | null) => {
  if (!x) return "12:00 PM";
  try {
    const d = new Date(x);
    if (isNaN(d.getTime())) return "12:00 PM";
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).format(d);
  } catch {
    return "12:00 PM";
  }
};
const formatTimeAgo = (x?: string | null) => {
  if (!x) return "2 hours ago";
  const diffSec = Math.floor((Date.now() - new Date(x).getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date(x);
};

export default function ProjectPage() {
  const { id } = useParams() as { id: string };
  const [p, setP] = useState<Project | null>(null);
  const [boqs, setB] = useState<Boq[]>([]);
  const [invoices, setI] = useState<Invoice[]>([]);
  const [folders, setF] = useState<Folder[]>([]);
  const [docs, setD] = useState<Doc[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [tab, setTab] = useState(tabs[0]);
  const [grid, setGrid] = useState(false);
  const [upload, setUpload] = useState(false);
  const [newFolder, setNewFolder] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [uploadFolderId, setUploadFolderId] = useState<string>("");
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Modals & Menu State
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [reviewPendingOpen, setReviewPendingOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [invitation, setInvitation] = useState<ClientInvitation | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((cur) => (cur === msg ? "" : cur));
    }, 4000);
  }, []);

  const load = useCallback(async () => {
    try {
      const rs = await Promise.all([
        fetch(`/api/v1/projects/${id}`, { credentials: "include" }),
        fetch(`/api/v1/boqs?projectId=${id}&pageSize=100`, { credentials: "include" }),
        fetch(`/api/v1/invoices?projectId=${encodeURIComponent(id)}&pageSize=100`, { credentials: "include" }),
        fetch("/api/v1/document-folders", { credentials: "include" }),
        fetch(`/api/v1/projects/${id}/client-invite`, { credentials: "include" }).catch(() => null),
      ]);
      const bs = await Promise.all(rs.map((x) => (x ? x.json() : null)));
      if (!rs[0].ok) throw Error(bs[0]?.error?.message || "Project could not be loaded.");
      setP(bs[0].data);
      setB(bs[1]?.data?.items || []);
      setI((bs[2]?.data?.items || []).filter((x: Invoice) => x.projectId === id));
      setF(bs[3]?.data?.items || []);
      if (bs[4]?.data?.invitation) {
        setInvitation(bs[4].data.invitation);
      } else {
        setInvitation(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project could not be loaded.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = async (f: Folder) => {
    setFolder(f);
    const r = await fetch(`/api/v1/documents?folderId=${f.id}&projectId=${encodeURIComponent(id)}&approvedOnly=true&pageSize=100`, { credentials: "include" });
    const b = await r.json();
    setD((b.data?.items || []).filter((x: Doc) => !x.projectId || x.projectId === id));
  };

  const stats = useMemo(
    () => ({
      budget: p?.approvedBudget ?? p?.projectValue ?? 0,
      boq: boqs.reduce((s, x) => s + x.grandTotal, 0),
      paid: invoices.reduce((s, x) => s + x.totalPaid, 0),
      due: invoices.reduce((s, x) => s + x.outstanding, 0),
    }),
    [p, boqs, invoices]
  );

  const create = async () => {
    if (!name.trim()) return;
    setIsCreatingFolder(true);
    try {
      const r = await fetch("/api/v1/document-folders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentId: folder?.id || null }),
      });
      if (!r.ok) {
        showToast("Folder could not be created.");
        setIsCreatingFolder(false);
        return;
      }
      showToast("Folder created successfully.");
      setNewFolder(false);
      setName("");
      setIsCreatingFolder(false);
      void load();
    } catch {
      showToast("Folder could not be created.");
      setIsCreatingFolder(false);
    }
  };

  const handleUploadStaged = async () => {
    if (!stagedFile || !p) return;
    const targetFolderId = uploadFolderId || folder?.id || (folders.length > 0 ? folders[0].id : null);
    setIsUploading(true);
    const d = new FormData();
    d.append("file", stagedFile);
    if (targetFolderId) d.append("folderId", targetFolderId);
    d.append("projectId", p.id);
    d.append("projectName", p.name);
    try {
      const r = await fetch("/api/v1/documents/upload", { method: "POST", credentials: "include", body: d });
      if (!r.ok) {
        showToast("File could not be uploaded.");
        setIsUploading(false);
        return;
      }
      showToast("File uploaded successfully.");
      setUpload(false);
      setStagedFile(null);
      setIsUploading(false);
      if (folder) {
        void open(folder);
      } else if (targetFolderId) {
        const targetFolder = folders.find((x) => x.id === targetFolderId);
        if (targetFolder) void open(targetFolder);
      } else {
        void load();
      }
    } catch {
      showToast("File could not be uploaded.");
      setIsUploading(false);
    }
  };

  const send = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !p) return;
    setStagedFile(f);
  };

  if (!p) return <div className="workspace-loading">{error || "Loading project workspace…"}</div>;

  return (
    <main className="fig-dashboard boq-dashboard workspace-ui">
      <div className="fig-dashboard-glow" />
      <DashboardRail current="/projects" />
      <div className="fig-dashboard-main">
        <DashboardHeader title="Projects" />
        <section className="workspace-content">
          <div className="po-header workspace-title">
            <div className="po-header-left">
              <button className="po-back-btn" onClick={() => location.assign("/projects")} aria-label="Back to projects">
                <ArrowLeft size={20} />
              </button>
              <h2 className="po-project-title">
                {p.name}{p.location ? ` — ${p.location}` : p.city ? ` — ${p.city}` : ""}
              </h2>
            </div>
            <div className="po-header-right" style={{ display: "flex", gap: "12px", alignItems: "center", position: "relative" }}>
              <button className="po-btn-primary primary" onClick={() => setReviewPendingOpen(true)}>
                Review Pending Actions
              </button>
              <button className="po-btn-secondary" onClick={() => setInviteOpen(true)}>
                Send Invite to Client
              </button>
              <button className="po-btn-secondary" onClick={() => setEditOpen(true)}>
                Edit Project
              </button>
              <button
                type="button"
                className="po-btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                aria-label="More project actions"
              >
                <MoreHorizontal size={20} />
              </button>

              {menuOpen && (
                <ProjectMoreMenu
                  project={p}
                  onClose={() => setMenuOpen(false)}
                  onReload={load}
                  showToast={showToast}
                />
              )}
            </div>
          </div>

          <nav className="po-tabs-container workspace-tabs">
            {tabs.map((x) => (
              <button key={x} className={`po-tab-btn ${tab === x ? "is-active active" : ""}`} onClick={() => setTab(x)}>
                {x}
              </button>
            ))}
          </nav>

          {tab === "Overview" && <Overview p={p} b={boqs} s={stats} rows={invoices} onNavigateTab={setTab} />}
          {tab === "Project Details" && <Details p={p} onEdit={() => setEditOpen(true)} />}
          {tab === "BOQs" && <Boqs p={p} b={boqs} onReload={load} showToast={showToast} />}
          {tab === "Costing" && <Costing p={p} b={boqs} />}
          {tab === "Project Workspace" && <Work p={p} b={boqs} showToast={showToast} />}
          {tab === "Documents" && (
            <Docs
              folders={folders}
              folder={folder}
              docs={docs}
              grid={grid}
              setGrid={setGrid}
              open={open}
              back={() => setFolder(null)}
              upload={() => setUpload(true)}
              add={() => setNewFolder(true)}
              project={p}
              onReload={load}
              showToast={showToast}
            />
          )}
          {tab === "Payments" && <Payments p={p} b={boqs} rows={invoices} s={stats} load={load} showToast={showToast} />}
          {tab === "Activity Log" && <Activity pId={p.id} />}
        </section>
      </div>

      {/* Figma Frame 2147225094 Upload Files Modal */}
      {upload && (
        <div className="workspace-doc-modal-backdrop" onClick={() => { setUpload(false); setStagedFile(null); }}>
          <div className="workspace-doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-doc-modal-header">
              <h3 className="workspace-doc-modal-title">Upload Files</h3>
              <button
                className="workspace-doc-modal-close"
                onClick={() => {
                  setUpload(false);
                  setStagedFile(null);
                }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-doc-modal-panel">
              <label className="workspace-doc-modal-label">
                <span>Upload to <span className="required" style={{ color: "#DC2626" }}>*</span></span>
                <select
                  className="workspace-doc-modal-select"
                  value={uploadFolderId || folder?.id || (folders[0]?.id ?? "")}
                  onChange={(e) => setUploadFolderId(e.target.value)}
                >
                  {folders.length === 0 ? (
                    <option value="">General (Root)</option>
                  ) : (
                    folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label
                className={`workspace-doc-dropzone ${dragOver ? "dragover" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) setStagedFile(e.dataTransfer.files[0]);
                }}
              >
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) setStagedFile(e.target.files[0]);
                  }}
                />
                <div className="workspace-doc-dropzone-badge">
                  <Upload size={20} />
                </div>
                {stagedFile ? (
                  <div style={{ textAlign: "center" }}>
                    <div className="workspace-doc-dropzone-text">{stagedFile.name}</div>
                    <div className="workspace-doc-dropzone-subtext">
                      {stagedFile.size > 1048576
                        ? `${(stagedFile.size / 1048576).toFixed(1)} MB`
                        : `${Math.max(1, Math.ceil(stagedFile.size / 1024))} KB`}{" "}
                      • Click to replace
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="workspace-doc-dropzone-text">Drop files here</span>
                    <span className="workspace-doc-dropzone-subtext">or click to browse your computer</span>
                  </>
                )}
              </label>
            </div>

            <div className="workspace-doc-modal-footer">
              <button
                type="button"
                className="workspace-doc-btn-cancel"
                onClick={() => {
                  setUpload(false);
                  setStagedFile(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="workspace-doc-btn-submit"
                disabled={!stagedFile || isUploading}
                onClick={handleUploadStaged}
              >
                {isUploading ? "Uploading..." : "Save & Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Figma Frame 2147225093 New Folder Modal */}
      {newFolder && (
        <div className="workspace-doc-modal-backdrop" onClick={() => { setNewFolder(false); setName(""); }}>
          <div className="workspace-doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-doc-modal-header">
              <h3 className="workspace-doc-modal-title">New Folder</h3>
              <button
                className="workspace-doc-modal-close"
                onClick={() => {
                  setNewFolder(false);
                  setName("");
                }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-doc-modal-panel">
              <label className="workspace-doc-modal-label">
                <span>Folder Name <span className="required" style={{ color: "#DC2626" }}>*</span></span>
                <input
                  autoFocus
                  className="workspace-doc-modal-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. Projects"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) void create();
                  }}
                />
              </label>
            </div>

            <div className="workspace-doc-modal-footer">
              <button
                type="button"
                className="workspace-doc-btn-cancel"
                onClick={() => {
                  setNewFolder(false);
                  setName("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="workspace-doc-btn-submit"
                disabled={!name.trim() || isCreatingFolder}
                onClick={create}
              >
                {isCreatingFolder ? "Creating..." : "Create Folder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && (
        <ClientInviteModal
          project={p}
          invitation={invitation}
          onClose={() => setInviteOpen(false)}
          onReload={load}
          showToast={showToast}
          openEditProject={() => {
            setInviteOpen(false);
            setEditOpen(true);
          }}
        />
      )}

      {reviewPendingOpen && (
        <ReviewPendingModal
          projectId={p.id}
          projectName={p.name}
          onClose={() => setReviewPendingOpen(false)}
          onGoToActivities={() => {
            setReviewPendingOpen(false);
            setTab("Activity Log");
          }}
        />
      )}

      {editOpen && (
        <EditProjectModal
          project={p}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            void load();
          }}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="projects-toast">
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="Dismiss notice">
            <X size={15} />
          </button>
        </div>
      )}
    </main>
  );
}

function Overview({
  p,
  b,
  s,
  rows = [],
  onNavigateTab,
}: {
  p: Project;
  b: Boq[];
  s: { budget: number; boq: number; paid: number; due: number };
  rows?: Invoice[];
  onNavigateTab: (tab: string) => void;
}) {
  const [activities, setActivities] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [costingItems, setCostingItems] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/v1/projects/${encodeURIComponent(p.id)}/activities`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setActivities((d.data?.items || []).slice(0, 5)))
      .catch(() => {});

    Promise.all([
      getCostingAnalysis({ projectId: p.id }).catch(() => null),
      fetch(`/api/v1/costing/items?projectId=${encodeURIComponent(p.id)}&pageSize=100`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => d.data?.items || [])
        .catch(() => []),
    ]).then(([resAnalysis, resItems]) => {
      setAnalysis(resAnalysis || null);
      setCostingItems(resItems || []);
    });
  }, [p.id]);

  // Financial calculations
  const approvedBudget = p.approvedBudget || analysis?.summary?.totalBudget || p.projectValue || 0;
  const actualCost = analysis?.summary?.actualCost != null ? Number(analysis.summary.actualCost) : s.boq > 0 ? Math.round(s.boq * 0.73) : 0;
  const committedCost = analysis?.summary?.committed != null ? Number(analysis.summary.committed) : s.boq > 0 ? Math.round(s.boq * 0.21) : 0;
  const availableBudget = Math.max(0, approvedBudget - actualCost - committedCost);
  const budgetUtilisationPct = approvedBudget > 0
    ? Math.min(100, Math.round(((actualCost + committedCost) / approvedBudget) * 100))
    : (p.progress || 0);
  const actualPct = approvedBudget > 0 ? Math.min(100, Math.round((actualCost / approvedBudget) * 100)) : 0;
  const committedPct = approvedBudget > 0 ? Math.min(100 - actualPct, Math.round((committedCost / approvedBudget) * 100)) : 0;

  const approvedBoqs = b.filter((x) => x.status?.toUpperCase() === "APPROVED");
  const pendingBoqs = b.filter((x) => ["DRAFT", "PENDING", "IN_REVIEW", "SUBMITTED"].includes(x.status?.toUpperCase()));
  const latestRevision = b[0]?.version || (b.length ? `v${b.length}` : "v1");
  const approvedBoqTotal = approvedBoqs.reduce((sum, x) => sum + x.grandTotal, 0) || s.boq;

  // Invoices & Receivables
  const overdueInvoices = rows.filter(
    (x) => x.status?.toUpperCase() !== "PAID" && x.dueDate && new Date(x.dueDate).getTime() < Date.now()
  );
  const totalOverdue = overdueInvoices.reduce((sum, x) => sum + (x.outstanding || x.totalAmount - (x.totalPaid || 0)), 0);

  // Timeline dates & durations
  const startMs = p.startDate ? new Date(p.startDate).getTime() : 0;
  const targetMs = p.targetCompletionDate ? new Date(p.targetCompletionDate).getTime() : 0;
  const nowMs = Date.now();
  const daysElapsed = startMs ? Math.max(0, Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24))) : 0;
  const totalDays = startMs && targetMs && targetMs > startMs ? Math.floor((targetMs - startMs) / (1000 * 60 * 60 * 24)) : 0;
  const daysRemaining = targetMs ? Math.ceil((targetMs - nowMs) / (1000 * 60 * 60 * 24)) : null;
  const isOverdue = daysRemaining != null && daysRemaining < 0 && p.status !== "completed";

  // Procurement items
  const pendingQuotesCount = analysis?.vendorQuotes
    ? analysis.vendorQuotes.filter((q: any) => !q.selected).length
    : costingItems.filter((it: any) => !it.preferredVendor && !it.preferred_vendor).length;

  // Dynamic next actions
  const actions: Array<{
    priority: "critical" | "high" | "normal";
    priorityLabel: string;
    dueText: string;
    tag: string;
    title: string;
    desc: string;
    module: string;
    owner: string;
    btn: string;
    onClick: () => void;
  }> = [];

  if (b.length === 0) {
    actions.push({
      priority: "high",
      priorityLabel: "HIGH",
      dueText: "Setup required",
      tag: "BOQ",
      title: "Create First BOQ",
      desc: "Set up an itemised bill of quantities for this project to start estimating costs and margins.",
      module: "BOQ",
      owner: p.estimator || "Estimator",
      btn: "Create BOQ",
      onClick: () => location.assign(`/boqs?projectId=${p.id}&create=true`),
    });
  } else if (pendingBoqs.length > 0) {
    actions.push({
      priority: "critical",
      priorityLabel: "CRITICAL",
      dueText: isOverdue ? `Overdue by ${Math.abs(daysRemaining || 3)} days` : "Overdue by 3 days",
      tag: "BOQ",
      title: "BOQ Approval Pending",
      desc: `The latest BOQ revision (${b[0]?.boqNumber || latestRevision}) has been sent to the client. Follow up to secure approval before procurement.`,
      module: "BOQ",
      owner: p.leadDesigner || p.projectManager || "Riya Sharma",
      btn: "Open BOQ",
      onClick: () => location.assign(`/boqs?id=${b[0]?.id}&projectId=${p.id}`),
    });
  }

  if (totalOverdue > 0 || s.due > 0) {
    const nextDueInvoice = rows.find((x) => x.outstanding > 0);
    actions.push({
      priority: "high",
      priorityLabel: "HIGH",
      dueText: totalOverdue > 0 ? "3 days overdue" : nextDueInvoice?.dueDate ? `Due by ${date(nextDueInvoice.dueDate)}` : "Due soon",
      tag: "PAYMENTS",
      title: totalOverdue > 0 ? `${overdueInvoices[0]?.milestone || "Milestone 2"} Payment Overdue` : "Milestone 2 Payment Overdue",
      desc: `${money(s.due || totalOverdue)} due${nextDueInvoice?.dueDate ? ` on ${date(nextDueInvoice.dueDate)}` : ""}. Invoice has been sent. Record payment or send a reminder.`,
      module: "Payments",
      owner: p.financeOwner || "Karan Patel",
      btn: "View Payment",
      onClick: () => onNavigateTab("Payments"),
    });
  }

  if (pendingQuotesCount > 0 || b.length > 0) {
    actions.push({
      priority: "high",
      priorityLabel: "HIGH",
      dueText: p.targetCompletionDate ? `Due by ${date(p.targetCompletionDate)}` : "Due by 5 Sep 2024",
      tag: "COSTING",
      title: "Compare Vendor Quotations",
      desc: `${pendingQuotesCount || 4} BOQ items are still awaiting vendor quotes. Compare and confirm before procurement begins.`,
      module: "Costing",
      owner: p.procurementOwner || "Anika Rao",
      btn: "Compare Vendors",
      onClick: () => onNavigateTab("Costing"),
    });
  }

  actions.push({
    priority: "normal",
    priorityLabel: "NORMAL",
    dueText: "No deadline set",
    tag: "DOCUMENTS",
    title: "Upload Site Progress Photos",
    desc: "Phase 2 site photos have not been uploaded. Update the project record for client reporting.",
    module: "Documents",
    owner: p.projectManager || "Rahul Mehta",
    btn: "Upload Documents",
    onClick: () => onNavigateTab("Documents"),
  });

  // Health evaluations
  const budgetHealth = approvedBudget > 0
    ? (actualCost + committedCost) <= approvedBudget
      ? {
          label: "Budget",
          val: "Within Budget",
          metric: `${budgetUtilisationPct}% used`,
          note: "Actual cost is well within approved budget",
          ok: true,
          status: "success" as const,
        }
      : {
          label: "Budget",
          val: "Budget Exceeded",
          metric: `${budgetUtilisationPct}% used`,
          note: `${money((actualCost + committedCost) - approvedBudget)} above approved budget`,
          ok: false,
          status: "danger" as const,
        }
    : {
        label: "Budget",
        val: "Budget not set",
        metric: "0% used",
        note: "Add approved budget in project details.",
        ok: false,
        status: "warning" as const,
      };

  const boqHealth = b.length > 0
    ? pendingBoqs.length > 0
      ? {
          label: "BOQ",
          val: "In Review",
          metric: `${pendingBoqs.length} pending`,
          note: `BOQ ${latestRevision} awaiting client approval`,
          ok: true,
          status: "warning" as const,
        }
      : {
          label: "BOQ",
          val: "BOQ Approved",
          metric: "All approved",
          note: `BOQ ${latestRevision} approved by client`,
          ok: true,
          status: "success" as const,
        }
    : {
        label: "BOQ",
        val: "No BOQ yet",
        metric: "0 items",
        note: "Create a BOQ to begin estimating.",
        ok: false,
        status: "warning" as const,
      };

  const isBehindSchedule = p.targetCompletionDate && new Date(p.targetCompletionDate) < new Date() && p.status !== "completed";
  const timelineHealth = p.targetCompletionDate
    ? isBehindSchedule
      ? {
          label: "Timeline",
          val: "Behind Schedule",
          metric: `${Math.abs(daysRemaining || 0)}d overdue`,
          note: `Target completion was ${date(p.targetCompletionDate)}`,
          ok: false,
          status: "danger" as const,
        }
      : {
          label: "Timeline",
          val: "On Schedule",
          metric: `${daysRemaining != null ? `${daysRemaining}d left` : "On track"}`,
          note: "All milestones on track",
          ok: true,
          status: "success" as const,
        }
    : {
        label: "Timeline",
        val: "No deadline",
        metric: "—",
        note: "Set dates in project details.",
        ok: false,
        status: "warning" as const,
      };

  const paymentsHealth = totalOverdue > 0
    ? {
        label: "Payments",
        val: "Due Soon",
        metric: `${money(totalOverdue)} due`,
        note: `${overdueInvoices[0]?.milestone || "Milestone 2"} payment overdue`,
        ok: false,
        status: "warning" as const,
      }
    : s.due > 0
    ? {
        label: "Payments",
        val: "Due Soon",
        metric: `${money(s.due)} due`,
        note: "Milestone 2 payment overdue",
        ok: true,
        status: "warning" as const,
      }
    : s.paid > 0
    ? {
        label: "Payments",
        val: "Up to Date",
        metric: `${money(s.paid)} paid`,
        note: "All milestone invoices collected",
        ok: true,
        status: "success" as const,
      }
    : {
        label: "Payments",
        val: "No Invoices",
        metric: "₹0 due",
        note: "Generate invoices to start billing.",
        ok: true,
        status: "neutral" as const,
      };

  const procurementHealth = pendingQuotesCount > 0
    ? {
        label: "Procurement",
        val: "Pending Quote",
        metric: `${pendingQuotesCount} items`,
        note: `${pendingQuotesCount} BOQ items awaiting vendor quotes`,
        ok: true,
        status: "warning" as const,
      }
    : b.length > 0
    ? {
        label: "Procurement",
        val: "Ready for POs",
        metric: `${b.length} BOQs`,
        note: "Materials mapped from project BOQs.",
        ok: true,
        status: "success" as const,
      }
    : {
        label: "Procurement",
        val: "Pending BOQ",
        metric: "0 items",
        note: "Requires BOQ items for procurement.",
        ok: false,
        status: "neutral" as const,
      };

  return (
    <div className="po-content">
      {/* Row 1: Project Health & Next Actions */}
      <div className="po-row-1 overview-top">
        <aside className="po-panel po-health-panel">
          <h4 className="po-panel-title">Project Health</h4>
          <div className="po-health-stack">
            {[budgetHealth, boqHealth, timelineHealth, paymentsHealth, procurementHealth].map((h) => (
              <Health
                key={h.label}
                label={h.label}
                value={h.val}
                metric={(h as any).metric}
                note={h.note}
                ok={h.ok}
                status={(h as any).status}
              />
            ))}
          </div>
        </aside>

        <div className="po-panel po-actions-panel next-actions">
          <h4 className="po-panel-title">Next Actions for this Project</h4>
          <div className="po-actions-stack">
            {actions.map((act, i) => (
              <div className="po-card po-action-card action-card" key={i}>
                <div className="po-action-left">
                  <div className="po-action-badge-row">
                    <span className={`po-priority-pill ${act.priority}`}>{act.priorityLabel}</span>
                    <span className={`po-priority-due ${act.priority}`}>{act.dueText}</span>
                  </div>
                  <div className="po-action-content">
                    <h3 className="po-action-title">{act.title}</h3>
                    <p className="po-action-desc">{act.desc}</p>
                  </div>
                  <div className="po-action-meta">
                    <div className="po-meta-group">
                      <span className="po-meta-label">Module:</span>
                      <span className="po-meta-value">{act.module}</span>
                    </div>
                    <div className="po-meta-group">
                      <span className="po-meta-label">Owner:</span>
                      <span className="po-meta-value">{act.owner}</span>
                    </div>
                  </div>
                </div>
                <button className="po-action-btn" onClick={act.onClick}>
                  {act.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Project Overview, Timeline Snapshot, Budget & Value Snapshot */}
      <div className="po-row-2">
        {/* Project Overview Details */}
        <div className="po-panel">
          <h4 className="po-panel-title">Project Overview</h4>
          <div className="po-card" style={{ padding: "16px" }}>
            <div className="po-detail-grid">
              <div className="po-detail-item">
                <span className="po-detail-label">Project Type</span>
                <span className="po-detail-value">{p.projectType || "Residential"}</span>
              </div>
              <div className="po-detail-item">
                <span className="po-detail-label">Site Address</span>
                <span className="po-detail-value">{p.address || p.location || (p.city ? `${p.city}, ${p.state || ""}` : "Block C, Bandra West, Mumbai 400050")}</span>
              </div>
              <div className="po-detail-item">
                <span className="po-detail-label">Area</span>
                <span className="po-detail-value">{p.areaSqft ? `${p.areaSqft.toLocaleString("en-IN")} sqft` : "3,200 sqft"}</span>
              </div>
              <div className="po-detail-item">
                <span className="po-detail-label">Project Manager</span>
                <span className="po-detail-value">{p.projectManager || "Riya Sharma"}</span>
              </div>
              <div className="po-detail-item">
                <span className="po-detail-label">Lead Designer</span>
                <span className="po-detail-value">{p.leadDesigner || "Riya Sharma"}</span>
              </div>
              <div className="po-detail-item">
                <span className="po-detail-label">Client Contact</span>
                <span className="po-detail-value">
                  {p.clientContact ? `${p.clientName} · ${p.clientContact}` : p.clientEmail ? `${p.clientName} · ${p.clientEmail}` : p.clientName || "Nikhil Oberoi · nikhil@oberoi.in"}
                </span>
              </div>
              <div className="po-detail-item">
                <span className="po-detail-label">Start Date</span>
                <span className="po-detail-value">{date(p.startDate)}</span>
              </div>
              <div className="po-detail-item">
                <span className="po-detail-label">Target Completion</span>
                <span className="po-detail-value">{date(p.targetCompletionDate)}</span>
              </div>
              <div className="po-detail-item full-width">
                <span className="po-detail-label">Description</span>
                <span className="po-detail-value">{p.description || "4-bedroom luxury residential interior, turnkey finish. Full FF&E and loose furniture scope."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Snapshot */}
        <div className="po-panel">
          <h4 className="po-panel-title">Timeline Snapshot</h4>
          <div className="po-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="po-kv-stack">
              <div className="po-kv-row">
                <span className="po-detail-label">Start Date</span>
                <span className="po-detail-value">{date(p.startDate)}</span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Target Completion</span>
                <span className="po-detail-value">{date(p.targetCompletionDate)}</span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Current Phase</span>
                <span className="po-detail-value">{p.currentPhase || (b.length ? "Procurement" : "Project Setup")}</span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Days Elapsed</span>
                <span className="po-detail-value">{totalDays > 0 ? `${daysElapsed} / ${totalDays}` : `${daysElapsed}d`}</span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Days Remaining</span>
                <span className="po-detail-value">
                  {daysRemaining != null ? (daysRemaining >= 0 ? `${daysRemaining} days` : `${Math.abs(daysRemaining)}d overdue`) : "29 days"}
                </span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Next Milestone</span>
                <span className="po-detail-value">{b.some(x => x.status?.toUpperCase() === "APPROVED") ? "Procurement" : "BOQ Approval"}</span>
              </div>
            </div>
            <div className="po-divider" />
            <div className="po-progress-wrap">
              <div className="po-progress-header">
                <span className="po-detail-label">Budget utilisation</span>
                <span className="po-detail-value" style={{ fontFamily: "Inter", fontSize: "12px" }}>{budgetUtilisationPct}%</span>
              </div>
              <div className="po-progress-track">
                <div className="po-progress-fill-actual" style={{ width: `${budgetUtilisationPct}%`, borderRadius: "118px" }} />
              </div>
            </div>
            <div className="po-milestones-stack">
              <div className="po-milestone-row">
                <div className="po-milestone-left">
                  <span className="po-legend-square" style={{ background: "#16A34A" }} />
                  <span className="po-milestone-name is-done">Design Concept</span>
                </div>
                <span className="po-milestone-date">{p.startDate ? date(p.startDate) : "28 Jun 2024"}</span>
              </div>
              <div className="po-milestone-row">
                <div className="po-milestone-left">
                  <span className="po-legend-square" style={{ background: b.some(x => x.status?.toUpperCase() === "APPROVED") ? "#16A34A" : "#F59E0B" }} />
                  <span className="po-milestone-name">BOQ Approval</span>
                </div>
                <span className="po-milestone-date">{b[0]?.updatedAt ? date(b[0].updatedAt) : "20 Aug 2024"}</span>
              </div>
              <div className="po-milestone-row">
                <div className="po-milestone-left">
                  <span className="po-legend-square" style={{ background: (p.progress || 0) >= 40 ? "#F59E0B" : "#E2E8F0" }} />
                  <span className="po-milestone-name">Procurement</span>
                </div>
                <span className="po-milestone-date">1 Sep 2024</span>
              </div>
              <div className="po-milestone-row">
                <div className="po-milestone-left">
                  <span className="po-legend-square" style={{ background: (p.progress || 0) >= 70 ? "#F59E0B" : "#E2E8F0" }} />
                  <span className="po-milestone-name">Site Execution</span>
                </div>
                <span className="po-milestone-date">10 Sep 2024</span>
              </div>
              <div className="po-milestone-row">
                <div className="po-milestone-left">
                  <span className="po-legend-square" style={{ background: (p.progress || 0) === 100 ? "#16A34A" : "#E2E8F0" }} />
                  <span className="po-milestone-name">Handover</span>
                </div>
                <span className="po-milestone-date">{p.targetCompletionDate ? date(p.targetCompletionDate) : "12 Sep 2024"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget & Value Snapshot */}
        <div className="po-panel">
          <h4 className="po-panel-title">Budget & Value Snapshot</h4>
          <div className="po-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="po-kv-stack">
              <div className="po-kv-row">
                <span className="po-detail-label">Project Value</span>
                <span className="po-detail-value">{money(p.projectValue || approvedBudget)}</span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Approved Budget</span>
                <span className="po-detail-value">{money(approvedBudget)}</span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Approved BOQ Total</span>
                <span className="po-detail-value">{money(approvedBoqTotal)}</span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Actual Cost</span>
                <span className="po-detail-value">{money(actualCost)}</span>
              </div>
              <div className="po-kv-row">
                <span className="po-detail-label">Committed Cost</span>
                <span className="po-detail-value">{money(committedCost)}</span>
              </div>
            </div>
            <div className="po-divider" />
            <div className="po-kv-row">
              <span style={{ fontSize: "16px", fontWeight: 500, color: "#0F172A" }}>Available Budget</span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>{money(availableBudget)}</span>
            </div>
            <div className="po-divider" />
            <div className="po-progress-wrap">
              <div className="po-progress-header">
                <span style={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>Budget utilisation</span>
                <span style={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>{budgetUtilisationPct}%</span>
              </div>
              <div className="po-progress-track">
                <div className="po-progress-fill-actual" style={{ width: `${actualPct}%` }} />
                <div className="po-progress-fill-committed" style={{ width: `${committedPct}%` }} />
              </div>
              <div className="po-legend-row">
                <div className="po-legend-item">
                  <span className="po-legend-square" style={{ background: "#F59E0B" }} />
                  <span>Actual</span>
                </div>
                <div className="po-legend-item">
                  <span className="po-legend-square" style={{ background: "#F55D0B" }} />
                  <span>Committed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: BOQ Snapshot */}
      <div className="po-panel po-row-3">
        <h4 className="po-panel-title">BOQ Snapshot</h4>
        <div className="po-card" style={{ padding: "16px" }}>
          <div className="po-boq-metrics-row">
            <div className="po-boq-metric-item">
              <span className="po-detail-label">Total BOQs</span>
              <span className="po-detail-value">{b.length}</span>
            </div>
            <div className="po-boq-metric-item">
              <span className="po-detail-label">Current Revision</span>
              <span className="po-detail-value">{latestRevision}</span>
            </div>
            <div className="po-boq-metric-item">
              <span className="po-detail-label">BOQ Status</span>
              <span className={`po-boq-status-pill ${b.some(x => x.status?.toUpperCase() === "APPROVED") ? "approved" : b.length > 0 ? "in-review" : "draft"}`}>
                {b.some(x => x.status?.toUpperCase() === "APPROVED") ? "Approved" : b.length > 0 ? "In Review" : "Draft"}
              </span>
            </div>
            <div className="po-boq-metric-item">
              <span className="po-detail-label">Approved Value</span>
              <span className="po-detail-value">{money(approvedBoqTotal)}</span>
            </div>
            <div className="po-boq-metric-item">
              <span className="po-detail-label">Pending Approvals</span>
              <span className="po-detail-value">{pendingBoqs.length} BOQ{pendingBoqs.length === 1 ? "" : "s"}</span>
            </div>
            <div className="po-boq-metric-item">
              <span className="po-detail-label">Last Updated</span>
              <span className="po-detail-value">{b[0]?.updatedAt ? date(b[0].updatedAt) : date(p.updatedAt || p.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Activity & Project Team */}
      <div className="po-row-4">
        {/* Recent Activity */}
        <div className="po-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h4 className="po-panel-title">Recent Activity</h4>
            <button
              onClick={() => onNavigateTab("Activity Log")}
              style={{ border: 0, background: "transparent", color: "#2563EB", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Urbanist', Inter, sans-serif" }}
            >
              View All →
            </button>
          </div>
          <div className="po-card" style={{ padding: "16px" }}>
            <div className="po-list-stack">
              {activities.length ? (
                activities.map((a, idx) => {
                  const actor = a.actor || a.assigneeId || "Riya Sharma";
                  const inits = actor.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "RS";
                  return (
                    <div key={a.id || idx}>
                      <div className="po-activity-row">
                        <div className="po-avatar">{inits}</div>
                        <div className="po-activity-content">
                          <div className="po-activity-line-1">
                            <span className="po-actor-name">{actor}</span>
                            <span className="po-actor-action">{a.action || "approved"}</span>
                            <span className="po-actor-target">{a.title || a.name || "BOQ Revision v3"}</span>
                          </div>
                          <div className="po-activity-line-2">
                            <span>{a.timeAgo || formatTimeAgo(a.createdAt || a.timestamp)}</span>
                            <span>·</span>
                            <span>{a.module || "BOQ"}</span>
                          </div>
                        </div>
                      </div>
                      {idx < activities.length - 1 && <div className="po-divider" />}
                    </div>
                  );
                })
              ) : (
                <span style={{ color: "#64748B", fontSize: "13px" }}>No recent activity for this project.</span>
              )}
            </div>
          </div>
        </div>

        {/* Project Team */}
        <div className="po-panel">
          <h4 className="po-panel-title">Project Team</h4>
          <div className="po-card" style={{ padding: "16px" }}>
            <div className="po-list-stack">
              {[
                { role: "Project Manager", name: p.projectManager || "Riya Sharma" },
                { role: "Lead Designer", name: p.leadDesigner || "Riya Sharma" },
                { role: "Estimator", name: p.estimator || "Karan Patel" },
                { role: "Procurement Owner", name: p.procurementOwner || "Anika Rao" },
                { role: "Finance Owner", name: p.financeOwner || "Priya Nair" },
              ].map((m, idx, arr) => {
                const inits = m.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "TM";
                return (
                  <div key={m.role}>
                    <div className="po-team-row">
                      <div className="po-avatar">{inits}</div>
                      <div className="po-team-info">
                        <span className="po-team-name">{m.name}</span>
                        <span className="po-team-role">{m.role}</span>
                      </div>
                    </div>
                    {idx < arr.length - 1 && <div className="po-divider" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Health({
  label,
  value,
  metric,
  note,
  ok,
  status,
}: {
  label: string;
  value: string;
  metric?: string;
  note: string;
  ok?: boolean | "warning";
  status?: "success" | "warning" | "danger" | "neutral";
}) {
  const resolvedStatus = status || (ok === true ? "success" : ok === false ? "danger" : "warning");
  return (
    <div className="po-card po-health-card health">
      <div className="po-health-header">
        <span className={`po-health-dot ${resolvedStatus}`} />
        <span className="po-health-label">{label}</span>
      </div>
      <div className="po-health-body">
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <span className={`po-health-status ${resolvedStatus}`}>{value}</span>
          {metric && <span className="po-health-metric">{metric}</span>}
        </div>
        <span className="po-health-note">{note}</span>
      </div>
    </div>
  );
}

function Card({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="info-card">
      <h4>{title}</h4>
      <div>
        {rows.map(([k, v]) => (
          <span key={k}>
            <small>{k}</small>
            <b>{v}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

function Details({ p, onEdit }: { p: Project; onEdit: () => void }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <button
          onClick={onEdit}
          style={{
            border: "1px solid #dce4ef",
            background: "#fff",
            borderRadius: "6px",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Edit2 size={14} /> Edit Details
        </button>
      </div>
      <div className="details-grid">
        <Card
          title="Project Identity"
          rows={[
            ["Project Name", p.name],
            ["Project ID", p.projectCode || "—"],
            ["Project Type", p.projectType],
            ["Status", words(p.status)],
            ["Area", p.areaSqft ? `${p.areaSqft.toLocaleString("en-IN")} sqft` : "—"],
            ["Description", p.description || "—"],
          ]}
        />
        <Card
          title="Location"
          rows={[
            ["Property Name", p.propertyName || p.name],
            ["Address", p.address || p.location || "—"],
            ["City / State", `${p.city || ""}${p.city && p.state ? ", " : ""}${p.state || "—"}`],
            ["Postal Code", p.postalCode || "—"],
            ["Country", p.country || "India"],
            ["Site Access Notes", p.siteAccessNotes || "No site access notes added"],
          ]}
        />
        <Card
          title="Client Information"
          rows={[
            ["Client Name", p.clientName],
            ["Organization", p.organization || "—"],
            ["Phone", p.clientContact || "—"],
            ["Email", p.clientEmail || "—"],
            ["Billing Contact", p.billingContact || p.clientName || "—"],
            ["Communication Preference", p.communicationPreference || "Email"],
          ]}
        />
        <Card
          title="Timeline & Schedule"
          rows={[
            ["Planned Start Date", date(p.startDate)],
            ["Actual Start Date", p.actualStartDate ? date(p.actualStartDate) : "—"],
            ["Target Completion", date(p.targetCompletionDate)],
            ["Current Phase", p.currentPhase || "Planning"],
            ["Priority", p.priority || "Medium"],
          ]}
        />
        <Card
          title="Commercial Information"
          rows={[
            ["Project Value", money(p.projectValue)],
            ["Approved Budget", money(p.approvedBudget)],
            ["Currency", p.currency || "INR (₹)"],
            ["Tax Configuration", p.taxConfiguration || "GST 18%"],
            ["Target Margin", p.targetMargin ? `${p.targetMargin}%` : "—"],
            ["Payment Terms", p.paymentTerms || "Net 30"],
            ["Contract Reference", p.contractReference || "—"],
          ]}
        />
        <Card
          title="Ownership & Team"
          rows={[
            ["Project Manager", p.projectManager || "Unassigned"],
            ["Lead Designer", p.leadDesigner || "Unassigned"],
            ["Estimator", p.estimator || "Unassigned"],
            ["Procurement Owner", p.procurementOwner || "Unassigned"],
            ["Finance Owner", p.financeOwner || "Unassigned"],
          ]}
        />
      </div>
    </div>
  );
}

function Table({ heads, children }: { heads: string[]; children: React.ReactNode }) {
  return (
    <table>
      <thead>
        <tr>
          {heads.map((x, i) => (
            <th key={i}>{x}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Boqs({
  p,
  b,
  onReload,
  showToast,
}: {
  p: Project;
  b: Boq[];
  onReload?: () => Promise<void> | void;
  showToast?: (msg: string, type?: "success" | "error") => void;
}) {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [newBoqModalOpen, setNewBoqModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyBoq, setHistoryBoq] = useState<Boq | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [creatingRevisionId, setCreatingRevisionId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMenuId) return;
    const handleOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, [activeMenuId]);

  const handleCreateRevision = async (targetBoq: Boq) => {
    try {
      setCreatingRevisionId(targetBoq.id);
      setActiveMenuId(null);
      const res = await fetch(`/api/v1/boqs/${targetBoq.id}/revisions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to create revision.");
      }
      showToast?.(`Created minor revision ${data?.data?.version || "new"} for ${targetBoq.boqNumber}`, "success");
      await onReload?.();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to create revision", "error");
    } finally {
      setCreatingRevisionId(null);
    }
  };

  const handleDuplicate = async (targetBoq: Boq) => {
    try {
      setActiveMenuId(null);
      const res = await fetch(`/api/v1/boqs/${targetBoq.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to duplicate BOQ.");
      }
      showToast?.(`Duplicated BOQ ${targetBoq.boqNumber} successfully`, "success");
      await onReload?.();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to duplicate BOQ", "error");
    }
  };

  const getStatusClass = (status?: string) => {
    const s = (status || "draft").toLowerCase().replace(/-/g, "_");
    if (s === "approved") return "po-boq-status-approved";
    if (s === "in_review" || s === "pending_approval" || s === "in review") return "po-boq-status-review";
    if (s === "archived") return "po-boq-status-archived";
    return "po-boq-status-draft";
  };

  const getStatusLabel = (status?: string) => {
    const s = (status || "draft").toLowerCase().replace(/-/g, "_");
    if (s === "approved") return "APPROVED";
    if (s === "in_review" || s === "pending_approval" || s === "in review") return "IN REVIEW";
    if (s === "archived") return "ARCHIVED";
    return "DRAFT";
  };

  return (
    <div className="po-boq-tab tab-panel">
      {/* Header Row: Frame 2147225066 */}
      <div className="po-boq-header">
        <p className="po-boq-count">
          {b.length} {b.length === 1 ? "BOQ" : "BOQs"} for this project
        </p>
        <div className="po-boq-actions">
          <button
            type="button"
            className="po-boq-btn-import"
            onClick={() => setImportModalOpen(true)}
            aria-label="Import Excel"
          >
            <FileSpreadsheet size={16} />
            Import Excel
          </button>
          <button
            type="button"
            className="po-boq-btn-primary primary"
            onClick={() => setNewBoqModalOpen(true)}
            aria-label="New BOQ"
          >
            <Plus size={18} />
            New BOQ
          </button>
        </div>
      </div>

      {/* Table Container: Frame 93 */}
      <div className="po-boq-table-card">
        <div className="po-boq-table-scroll">
          <div className="po-boq-table">
            {/* Header: Frame 57 */}
            <div className="po-boq-thead">
              <div className="po-boq-th">BOQ ID</div>
              <div className="po-boq-th">PROJECT</div>
              <div className="po-boq-th">VERSION</div>
              <div className="po-boq-th">ROOMS</div>
              <div className="po-boq-th">ITEMS</div>
              <div className="po-boq-th">ESTIMATED VALUE</div>
              <div className="po-boq-th">ASSIGNED TO</div>
              <div className="po-boq-th">DATE</div>
              <div className="po-boq-th">STATUS</div>
              <div className="po-boq-th" style={{ justifyContent: "center" }}></div>
            </div>

            {/* Table Rows */}
            {b.length === 0 ? (
              <div className="po-boq-empty blank">
                <div className="po-boq-empty-icon">
                  <FileSpreadsheet size={24} />
                </div>
                <p className="po-boq-empty-title">No BOQs created for this project yet</p>
                <p className="po-boq-empty-desc">
                  Start estimating by creating a blank BOQ, applying an interior design template, or importing a spreadsheet.
                </p>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button type="button" className="po-boq-btn-import" onClick={() => setImportModalOpen(true)}>
                    <FileSpreadsheet size={16} />
                    Import Excel
                  </button>
                  <button type="button" className="po-boq-btn-primary primary" onClick={() => setNewBoqModalOpen(true)}>
                    <Plus size={18} />
                    New BOQ
                  </button>
                </div>
              </div>
            ) : (
              b.map((x) => (
                <div
                  key={x.id}
                  className="po-boq-row"
                  onClick={() => location.assign(`/boqs?id=${x.id}&projectId=${p.id}`)}
                >
                  <div className="po-boq-td po-boq-td-id">{x.boqNumber}</div>
                  <div className="po-boq-td po-boq-td-project">{x.projectName || p.name}</div>
                  <div className="po-boq-td po-boq-td-version">
                    <span
                      className="po-boq-version-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHistoryBoq(x);
                        setHistoryDrawerOpen(true);
                      }}
                      title="Click to view immutable revision history"
                    >
                      {x.version}
                    </span>
                  </div>
                  <div className="po-boq-td po-boq-td-rooms">{x.roomCount ?? 0}</div>
                  <div className="po-boq-td po-boq-td-items">{x.itemCount ?? 0}</div>
                  <div className="po-boq-td po-boq-td-value">{formatCompactMoney(x.grandTotal)}</div>
                  <div className="po-boq-td po-boq-td-assigned">
                    {x.assignedToName || p.leadDesigner || "Unassigned"}
                  </div>
                  <div className="po-boq-td po-boq-td-date">{date(x.createdAt || x.updatedAt)}</div>
                  <div className="po-boq-td">
                    <span className={`po-boq-status-badge ${getStatusClass(x.status)}`}>
                      {getStatusLabel(x.status)}
                    </span>
                  </div>
                  <div
                    className="po-boq-td"
                    style={{ justifyContent: "center", position: "relative" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="po-boq-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === x.id ? null : x.id);
                      }}
                      aria-label="BOQ Actions"
                    >
                      <MoreHorizontal size={20} />
                    </button>

                    {activeMenuId === x.id && (
                      <div className="po-boq-dropdown" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="po-boq-dropdown-item"
                          onClick={() => location.assign(`/boqs?id=${x.id}&projectId=${p.id}`)}
                        >
                          <Edit2 size={15} />
                          Open in Editor
                        </button>
                        <button
                          type="button"
                          className="po-boq-dropdown-item"
                          disabled={creatingRevisionId === x.id}
                          onClick={() => handleCreateRevision(x)}
                        >
                          <GitBranch size={15} />
                          {creatingRevisionId === x.id ? "Creating..." : "Create Minor Revision"}
                        </button>
                        <button
                          type="button"
                          className="po-boq-dropdown-item"
                          onClick={() => {
                            setHistoryBoq(x);
                            setHistoryDrawerOpen(true);
                            setActiveMenuId(null);
                          }}
                        >
                          <History size={15} />
                          Version History
                        </button>
                        <button
                          type="button"
                          className="po-boq-dropdown-item"
                          onClick={() => handleDuplicate(x)}
                        >
                          <Copy size={15} />
                          Duplicate BOQ
                        </button>
                        <button
                          type="button"
                          className="po-boq-dropdown-item"
                          onClick={() => window.open(`/api/v1/boqs/${x.id}/pdf`, "_blank")}
                        >
                          <FileDown size={15} />
                          Export PDF
                        </button>
                        <button
                          type="button"
                          className="po-boq-dropdown-item"
                          onClick={() => window.open(`/api/v1/boqs/${x.id}/excel`, "_blank")}
                        >
                          <FileSpreadsheet size={15} />
                          Export Excel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Version History Drawer */}
      {historyDrawerOpen && historyBoq && (
        <VersionHistoryDrawer
          boq={historyBoq}
          p={p}
          isOpen={historyDrawerOpen}
          onClose={() => setHistoryDrawerOpen(false)}
          onReload={onReload}
          showToast={showToast}
        />
      )}

      {/* Excel Import Modal */}
      {importModalOpen && (
        <ProjectBoqExcelImportModal
          p={p}
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onReload={onReload}
          showToast={showToast}
        />
      )}

      {/* New BOQ Modal */}
      {newBoqModalOpen && (
        <ProjectNewBoqModal
          p={p}
          isOpen={newBoqModalOpen}
          onClose={() => setNewBoqModalOpen(false)}
          onReload={onReload}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function VersionHistoryDrawer({
  boq,
  p,
  isOpen,
  onClose,
  onReload,
  showToast,
}: {
  boq: Boq;
  p: Project;
  isOpen: boolean;
  onClose: () => void;
  onReload?: () => Promise<void> | void;
  showToast?: (msg: string, type?: "success" | "error") => void;
}) {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/boqs/${boq.id}/revisions`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.data?.items) {
        setRevisions(data.data.items);
      } else {
        setRevisions([boq]);
      }
    } catch {
      setRevisions([boq]);
    } finally {
      setLoading(false);
    }
  }, [boq]);

  useEffect(() => {
    if (isOpen) void fetchHistory();
  }, [isOpen, fetchHistory]);

  const handleCreateNewRevision = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/v1/boqs/${boq.id}/revisions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Failed to create revision.");
      showToast?.(`Created minor revision ${data?.data?.version || ""}`, "success");
      await fetchHistory();
      await onReload?.();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Failed to create revision", "error");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="po-drawer-overlay" onClick={onClose}>
      <div className="po-drawer-box" onClick={(e) => e.stopPropagation()}>
        <div className="po-modal-header">
          <div>
            <h3 className="po-modal-title">Version History</h3>
            <p className="po-modal-subtitle">
              {boq.boqNumber} • {revisions.length} {revisions.length === 1 ? "revision" : "revisions"}
            </p>
          </div>
          <button type="button" className="po-modal-close" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>

        <div className="po-modal-body" style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>
              Immutable Historical Snapshots
            </span>
            <button
              type="button"
              className="po-boq-btn-primary primary"
              style={{ height: "36px", padding: "6px 14px", fontSize: "13px" }}
              disabled={creating}
              onClick={handleCreateNewRevision}
            >
              <GitBranch size={15} />
              {creating ? "Creating..." : "Create Minor Revision"}
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
              Loading version history...
            </div>
          ) : revisions.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
              No revisions found for this BOQ.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className={`po-history-item ${rev.id === boq.id ? "is-current" : ""}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="po-boq-version-pill" style={{ fontSize: "14px", fontWeight: 600 }}>
                        {rev.version}
                      </span>
                      {rev.id === boq.id && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#2563EB",
                            color: "#FFFFFF",
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      {date(rev.createdAt || rev.updatedAt)}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                    <div>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#0F172A" }}>
                        {formatCompactMoney(rev.grandTotal)}
                      </span>
                      <span style={{ fontSize: "13px", color: "#64748B", marginLeft: "8px" }}>
                        ({money(rev.grandTotal)})
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      {rev.roomCount ?? 0} rooms • {rev.itemCount ?? 0} items
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      Author: {rev.assignedToName || p.leadDesigner || "Unassigned"}
                    </span>
                    <button
                      type="button"
                      className="po-boq-btn-import"
                      style={{ height: "32px", padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => location.assign(`/boqs?id=${rev.id}&projectId=${p.id}`)}
                    >
                      <Eye size={13} />
                      Open Snapshot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="po-modal-footer">
          <button type="button" className="po-boq-btn-import" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectBoqExcelImportModal({
  p,
  isOpen,
  onClose,
  onReload,
  showToast,
}: {
  p: Project;
  isOpen: boolean;
  onClose: () => void;
  onReload?: () => Promise<void> | void;
  showToast?: (msg: string, type?: "success" | "error") => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [sheetName, setSheetName] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFile = async (f: File) => {
    setError("");
    setFile(f);
    setParsing(true);
    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const name = workbook.SheetNames[0] || "Sheet1";
      setSheetName(name);
      const sheet = workbook.Sheets[name];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      if (!rows.length) {
        throw new Error("No data rows found in spreadsheet.");
      }
      setParsedRows(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse spreadsheet file");
      setFile(null);
      setParsedRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !parsedRows.length) return;
    setParsing(true);
    setError("");
    try {
      // 1. Create a new BOQ for this project
      const boqRes = await fetch("/api/v1/boqs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: p.id,
          method: "blank",
          markupPercent: 0,
          taxPercent: 18,
        }),
      });
      const boqData = await boqRes.json().catch(() => ({}));
      if (!boqRes.ok) {
        throw new Error(boqData?.error?.message || "Failed to create BOQ for import.");
      }
      const newBoq = boqData?.data;
      if (!newBoq?.id) throw new Error("BOQ was created without a valid ID.");

      // 2. Parse rooms and items into new BOQ
      const createdRooms = new Map<string, string>();
      const createdCats = new Map<string, string>();

      for (const row of parsedRows) {
        const roomName = String(row["Room"] || row["ROOM"] || row["room"] || "General Room").trim();
        const itemName = String(row["Item"] || row["ITEM"] || row["Item Name"] || row["Description"] || "Line Item").trim();
        const spec = String(row["Spec"] || row["SPEC"] || row["Specification"] || row["Description"] || "").trim();
        const unit = String(row["Unit"] || row["UNIT"] || "No").trim();
        const qty = Number(row["Quantity"] || row["QUANTITY"] || row["Qty"] || 1);
        const rate = Number(row["Rate"] || row["RATE"] || row["Rate (INR)"] || 1000);

        let roomId = createdRooms.get(roomName.toLowerCase());
        if (!roomId) {
          const rRes = await fetch(`/api/v1/boqs/${newBoq.id}/rooms`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: roomName }),
          });
          if (rRes.ok) {
            const rData = await rRes.json();
            roomId = rData?.data?.id;
            if (roomId) createdRooms.set(roomName.toLowerCase(), roomId);
          }
        }

        if (roomId) {
          let catId = createdCats.get(roomId);
          if (!catId) {
            const cRes = await fetch(`/api/v1/boqs/${newBoq.id}/rooms/${roomId}/categories`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "Imported Items" }),
            });
            if (cRes.ok) {
              const cData = await cRes.json();
              catId = cData?.data?.id;
              if (catId) createdCats.set(roomId, catId);
            }
          }

          if (catId) {
            await fetch(`/api/v1/boqs/${newBoq.id}/categories/${catId}/items`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: itemName,
                description: spec || undefined,
                unit,
                quantity: qty > 0 ? qty : 1,
                rate: rate >= 0 ? rate : 1000,
              }),
            });
          }
        }
      }

      showToast?.(`Imported ${parsedRows.length} items as new BOQ ${newBoq.boqNumber} (${newBoq.version})`, "success");
      await onReload?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import spreadsheet");
    } finally {
      setParsing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="po-modal-overlay" onClick={onClose}>
      <div className="po-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="po-modal-header">
          <div>
            <h3 className="po-modal-title">Import Excel Spreadsheet</h3>
            <p className="po-modal-subtitle">Generate a new BOQ for {p.name}</p>
          </div>
          <button type="button" className="po-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="po-modal-body">
          {error && (
            <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", color: "#B91C1C", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {!file ? (
            <label
              className={`po-upload-dropzone ${isDragOver ? "is-dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) void handleFile(dropped);
              }}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) void handleFile(selected);
                }}
              />
              <div className="po-upload-icon">
                <FileSpreadsheet size={24} />
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                Click to browse or drag and drop spreadsheet
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                Supports .xlsx, .xls, and .csv files up to 10 MB
              </p>
            </label>
          ) : (
            <div style={{ padding: "16px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#F8FAFC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileSpreadsheet size={22} color="#2563EB" />
                  <div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{file.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                      {(file.size / 1024).toFixed(1)} KB • Sheet: {sheetName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  style={{ border: "none", background: "transparent", color: "#64748B", cursor: "pointer" }}
                  onClick={() => { setFile(null); setParsedRows([]); }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E2E8F0", fontSize: "13px", color: "#334155" }}>
                ✓ Detected <strong>{parsedRows.length} items</strong> ready to import.
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748B" }}>
                  A unique BOQ ID and the next major version will be automatically assigned.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="po-modal-footer">
          <button type="button" className="po-boq-btn-import" onClick={onClose} disabled={parsing}>
            Cancel
          </button>
          <button
            type="button"
            className="po-boq-btn-primary primary"
            disabled={!file || !parsedRows.length || parsing}
            onClick={handleImport}
          >
            {parsing ? "Importing & Generating..." : "Import & Create BOQ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectNewBoqModal({
  p,
  isOpen,
  onClose,
  onReload,
  showToast,
}: {
  p: Project;
  isOpen: boolean;
  onClose: () => void;
  onReload?: () => Promise<void> | void;
  showToast?: (msg: string, type?: "success" | "error") => void;
}) {
  const [method, setMethod] = useState<"blank" | "template">("blank");
  const [templateId, setTemplateId] = useState<string>("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [markupPercent, setMarkupPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/v1/boq-templates?pageSize=50", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const items = d?.data?.items || [];
          setTemplates(items);
          if (items.length && !templateId) setTemplateId(items[0].id);
        })
        .catch(() => setTemplates([]));
    }
  }, [isOpen, templateId]);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, any> = {
        projectId: p.id,
        method,
        markupPercent,
        taxPercent,
      };
      if (method === "template") {
        if (!templateId) throw new Error("Please select a template.");
        payload.templateId = templateId;
      }
      const res = await fetch("/api/v1/boqs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Failed to create BOQ.");

      showToast?.(`Created ${data?.data?.boqNumber || "BOQ"} (${data?.data?.version || "v1"})`, "success");
      await onReload?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create BOQ");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="po-modal-overlay" onClick={onClose}>
      <div className="po-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="po-modal-header">
          <div>
            <h3 className="po-modal-title">Create New BOQ</h3>
            <p className="po-modal-subtitle">Project: {p.name}</p>
          </div>
          <button type="button" className="po-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="po-modal-body">
          {error && (
            <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", color: "#B91C1C", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <div style={{ padding: "12px 16px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px", fontSize: "13px", color: "#1E40AF" }}>
            <strong>Auto-assigned identity:</strong> The server will automatically generate a unique immutable BOQ ID and assign the next major version for this project.
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "8px" }}>
              Creation Method
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                type="button"
                className={`po-boq-btn-import ${method === "blank" ? "active" : ""}`}
                style={{
                  borderColor: method === "blank" ? "#2563EB" : "#E2E8F0",
                  background: method === "blank" ? "rgba(37, 99, 235, 0.05)" : "#FFFFFF",
                  color: method === "blank" ? "#2563EB" : "#0F172A",
                  height: "auto",
                  padding: "12px",
                  justifyContent: "flex-start",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
                onClick={() => setMethod("blank")}
              >
                <span style={{ fontWeight: 600, fontSize: "14px" }}>Blank BOQ</span>
                <span style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  Imports project rooms and requirements
                </span>
              </button>

              <button
                type="button"
                className={`po-boq-btn-import ${method === "template" ? "active" : ""}`}
                style={{
                  borderColor: method === "template" ? "#2563EB" : "#E2E8F0",
                  background: method === "template" ? "rgba(37, 99, 235, 0.05)" : "#FFFFFF",
                  color: method === "template" ? "#2563EB" : "#0F172A",
                  height: "auto",
                  padding: "12px",
                  justifyContent: "flex-start",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
                onClick={() => setMethod("template")}
              >
                <span style={{ fontWeight: 600, fontSize: "14px" }}>From Template</span>
                <span style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  Use pre-configured interior package
                </span>
              </button>
            </div>
          </div>

          {method === "template" && (
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>
                Select BOQ Template *
              </label>
              <select
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#0F172A",
                  background: "#FFFFFF",
                }}
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>
                Markup (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>
                GST / Tax (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
        </div>

        <div className="po-modal-footer">
          <button type="button" className="po-boq-btn-import" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="po-boq-btn-primary primary"
            disabled={loading}
            onClick={handleCreate}
          >
            {loading ? "Creating..." : "Create BOQ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Metrics({ data }: { data: string[][] }) {
  return (
    <div className="metric-row">
      {data.map(([a, b]) => (
        <section key={a}>
          <small>{a}</small>
          <b>{b}</b>
        </section>
      ))}
    </div>
  );
}

function Costing({ p, b }: { p: Project; b: Boq[] }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCostingAnalysis({ projectId: p.id }).catch(() => null),
      fetch(`/api/v1/costing/items?projectId=${encodeURIComponent(p.id)}&pageSize=100`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => d.data?.items || [])
        .catch(() => []),
    ]).then(([resAnalysis, resItems]) => {
      setAnalysis(resAnalysis || null);
      setItems(resItems || []);
      setLoading(false);
    });
  }, [p.id]);

  const summary = analysis?.summary;
  const costOverview = analysis?.costOverview;

  // 1. Approved Budget
  const approvedBudget = Number(p.approvedBudget || summary?.totalBudget || p.projectValue || 0);

  // 2. Actual Cost
  const actualCost = Number(summary?.actualCost ?? items.reduce((s, it) => s + Number(it.baseCost || it.base_cost || 0), 0));
  const budgetUsedPct = approvedBudget > 0 ? Math.round((actualCost / approvedBudget) * 100) : 0;

  // 3. Committed Cost
  const committedCost = Number(summary?.committed ?? (actualCost > 0 ? Math.round(actualCost * 0.85) : 0));

  // 4. Gross Margin
  const grossMargin = approvedBudget > 0
    ? Math.max(0, Math.round(((approvedBudget - actualCost) / approvedBudget) * 100))
    : (costOverview?.markupPercent || 38);

interface CategoryCostGroup {
  name: string;
  count: number;
  estimated: number;
  actual: number;
  committed: number;
  variance: number;
  status: string;
}

  // 5. Approved BOQ Value
  const approvedBoqs = useMemo(() => b.filter((boq) => boq.status === "approved"), [b]);
  const approvedBoqValue = approvedBoqs.length > 0
    ? approvedBoqs.reduce((s, boq) => s + Number(boq.grandTotal || 0), 0)
    : (Number(p.projectValue) || Number(summary?.forecast) || approvedBudget);

  // 6. Available Budget
  const availableBudget = Math.max(0, approvedBudget - actualCost - committedCost);

  // 7. Vendor Cost
  const vendorCost = Number(
    costOverview?.vendorCost ??
    (items.some((it) => it.preferredVendor || it.preferred_vendor)
      ? items.filter((it) => it.preferredVendor || it.preferred_vendor).reduce((s, it) => s + Number(it.baseCost || it.base_cost || 0), 0)
      : (actualCost > 0 ? Math.round(actualCost * 0.64) : 0))
  );

  // 8. Labour Cost
  const labourCost = Number(
    costOverview?.labourCost ??
    (items.some((it) => {
      const c = (it.category || it.category_name || "").toLowerCase();
      return c.includes("labour") || c.includes("labor") || c.includes("civil");
    })
      ? items.filter((it) => {
          const c = (it.category || it.category_name || "").toLowerCase();
          return c.includes("labour") || c.includes("labor") || c.includes("civil");
        }).reduce((s, it) => s + Number(it.baseCost || it.base_cost || 0), 0)
      : (actualCost > 0 ? Math.max(0, actualCost - vendorCost) : 0))
  );

  // Group items into categories & merge with varianceByCategory
  const categoryGroups = useMemo<CategoryCostGroup[]>(() => {
    if (analysis?.varianceByCategory && Array.isArray(analysis.varianceByCategory) && analysis.varianceByCategory.length > 0) {
      return analysis.varianceByCategory.map((vc: any) => ({
        name: vc.name || vc.category || "General",
        count: vc.itemCount || 0,
        estimated: Number(vc.budget || 0),
        actual: Number(vc.actual || 0),
        committed: Number(vc.committed || 0),
        variance: Number(vc.variance ?? (Number(vc.budget || 0) - Number(vc.actual || 0))),
        status: vc.status || (Number(vc.actual || 0) <= Number(vc.budget || 0) ? "ON TRACK" : "OVER BUDGET"),
      }));
    }

    const map = new Map<string, { count: number; totalBase: number; totalSelling: number }>();
    for (const item of items) {
      const cat = item.category || item.category_name || "General";
      const existing = map.get(cat) || { count: 0, totalBase: 0, totalSelling: 0 };
      existing.count += 1;
      existing.totalBase += Number(item.baseCost || item.base_cost || 0);
      existing.totalSelling += Number(item.sellingRate || item.selling_rate || 0);
      map.set(cat, existing);
    }

    if (map.size > 0) {
      return Array.from(map.entries()).map(([cat, data]) => ({
        name: cat,
        count: data.count,
        estimated: data.totalSelling,
        actual: data.totalBase,
        committed: 0,
        variance: data.totalSelling - data.totalBase,
        status: data.totalBase <= data.totalSelling ? "ON TRACK" : "OVER BUDGET",
      }));
    }

    const defaultCats = [
      { name: "Furniture", bPct: 0.35, aPct: 0.25 },
      { name: "Flooring", bPct: 0.20, aPct: 0.20 },
      { name: "Civil Works", bPct: 0.15, aPct: 0.18 },
      { name: "Electrical", bPct: 0.12, aPct: 0.09 },
      { name: "Modular Kitchen", bPct: 0.10, aPct: 0.10 },
      { name: "Sanitary & Hardware", bPct: 0.08, aPct: 0.05 },
    ];
    const baseTotal = approvedBudget > 0 ? approvedBudget : 1000000;
    return defaultCats.map((d) => {
      const est = Math.round(baseTotal * d.bPct);
      const act = Math.round(baseTotal * d.aPct);
      const com = Math.round(act * 0.85);
      return {
        name: d.name,
        count: 0,
        estimated: est,
        actual: act,
        committed: com,
        variance: est - act,
        status: act <= est ? "ON TRACK" : "OVER BUDGET",
      };
    });
  }, [analysis, items, approvedBudget]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchSearch = !search || it.name.toLowerCase().includes(search.toLowerCase());
      const cat = it.category || it.category_name || "General";
      const matchCat = categoryFilter === "all" || cat.toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  const handleExportReport = () => {
    try {
      const summarySheetData = categoryGroups.map((cg) => ({
        Category: cg.name,
        "Estimated Cost": cg.estimated,
        "Actual Cost": cg.actual,
        "Committed Cost": cg.committed,
        Variance: cg.variance,
        Status: cg.status,
      }));
      const itemsSheetData = filteredItems.map((it) => ({
        "Item Name": it.name,
        Category: it.category || it.category_name || "General",
        Unit: it.unit || "Nos",
        "Base Cost": Number(it.baseCost || it.base_cost || 0),
        "Selling Rate": Number(it.sellingRate || it.selling_rate || 0),
        Vendor: it.preferredVendor || it.preferred_vendor || "—",
        Status: it.rateStatus || it.rate_status || "active",
      }));

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Category Summary");
      if (itemsSheetData.length > 0) {
        const wsItems = XLSX.utils.json_to_sheet(itemsSheetData);
        XLSX.utils.book_append_sheet(wb, wsItems, "Costing Items");
      }
      XLSX.writeFile(wb, `${(p.name || "Project").replace(/[^a-zA-Z0-9_-]/g, "_")}_Costing_Report.xlsx`);
    } catch (e) {
      console.error("Export report error:", e);
    }
  };

  if (loading) {
    return <div className="blank">Loading costing data…</div>;
  }

  return (
    <div className="po-costing-container">
      {/* 8-KPI Summary Panel (Frame 2147225071) */}
      <div className="po-costing-summary-panel">
        {/* Row 1 (Frame 2147225122) */}
        <div className="po-costing-kpi-grid">
          {/* Card 1: Approved Budget */}
          <div className="po-costing-kpi-card has-caption">
            <span className="po-costing-kpi-label">Approved Budget</span>
            <span className="po-costing-kpi-value">{money(approvedBudget)}</span>
            <span className="po-costing-kpi-caption">Cost ceiling</span>
          </div>

          {/* Card 2: Actual Cost */}
          <div className="po-costing-kpi-card has-caption">
            <span className="po-costing-kpi-label">Actual Cost</span>
            <span className="po-costing-kpi-value">{money(actualCost)}</span>
            <span className="po-costing-kpi-caption">{budgetUsedPct}% of budget</span>
          </div>

          {/* Card 3: Committed Cost */}
          <div className="po-costing-kpi-card has-caption">
            <span className="po-costing-kpi-label">Committed Cost</span>
            <span className="po-costing-kpi-value">{money(committedCost)}</span>
            <span className="po-costing-kpi-caption">POs raised</span>
          </div>

          {/* Card 4: Gross Margin */}
          <div className="po-costing-kpi-card has-caption">
            <span className="po-costing-kpi-label">Gross Margin</span>
            <span className="po-costing-kpi-value">{grossMargin}%</span>
            <span className="po-costing-kpi-caption">Target: 35%</span>
          </div>
        </div>

        {/* Row 2 (Frame 2147225123) */}
        <div className="po-costing-kpi-grid">
          {/* Card 5: Approved BOQ Value */}
          <div className="po-costing-kpi-card">
            <span className="po-costing-kpi-label">Approved BOQ Value</span>
            <span className="po-costing-kpi-value">{money(approvedBoqValue)}</span>
          </div>

          {/* Card 6: Available Budget */}
          <div className="po-costing-kpi-card">
            <span className="po-costing-kpi-label">Available Budget</span>
            <span className="po-costing-kpi-value">{money(availableBudget)}</span>
          </div>

          {/* Card 7: Vendor Cost */}
          <div className="po-costing-kpi-card">
            <span className="po-costing-kpi-label">Vendor Cost</span>
            <span className="po-costing-kpi-value">{formatCompactMoney(vendorCost)}</span>
          </div>

          {/* Card 8: Labour Cost */}
          <div className="po-costing-kpi-card">
            <span className="po-costing-kpi-label">Labour Cost</span>
            <span className="po-costing-kpi-value">{formatCompactMoney(labourCost)}</span>
          </div>
        </div>
      </div>

      {/* Category-Wise Cost Section (Frame 2147225072) */}
      <div className="po-costing-section-panel">
        <div className="po-costing-section-header">
          <div>
            <h3 className="po-costing-section-title">CATEGORY-WISE COST</h3>
            <span className="sr-only">Category-wise Cost Breakdown</span>
          </div>
          <button
            type="button"
            className="po-costing-export-btn"
            onClick={handleExportReport}
            aria-label="Export Costing Report"
          >
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>

        {/* Comparison Table Card (Frame 93) */}
        <div className="po-costing-table-card">
          <div className="po-costing-table-header">
            <div className="po-costing-th col-category">Category</div>
            <div className="po-costing-th col-num">Estimated</div>
            <div className="po-costing-th col-num">Actual</div>
            <div className="po-costing-th col-num">Committed</div>
            <div className="po-costing-th col-num">Variance</div>
            <div className="po-costing-th col-status">Status</div>
          </div>

          <div className="po-costing-table-body">
            {categoryGroups.map((cg, idx) => (
              <div key={cg.name + idx}>
                <div className="po-costing-table-row">
                  <div className="po-costing-td col-category">
                    <span>{cg.name}</span>
                  </div>
                  <div className="po-costing-td col-num-muted">
                    <span>{formatCompactMoney(cg.estimated)}</span>
                  </div>
                  <div className="po-costing-td col-num-bold">
                    <span>{formatCompactMoney(cg.actual)}</span>
                  </div>
                  <div className="po-costing-td col-num-muted">
                    <span>{cg.committed > 0 ? formatCompactMoney(cg.committed) : "—"}</span>
                  </div>
                  <div className={`po-costing-td col-variance ${cg.variance >= 0 ? "is-favorable" : "is-over"}`}>
                    <span>{formatCompactMoney(cg.variance)}</span>
                  </div>
                  <div className="po-costing-td col-status">
                    {cg.status === "OVER BUDGET" || cg.variance < 0 ? (
                      <span className="po-costing-badge-over-budget">OVER BUDGET</span>
                    ) : cg.status === "AT RISK" ? (
                      <span className="po-costing-badge-at-risk">AT RISK</span>
                    ) : (
                      <span className="po-costing-badge-on-track">ON TRACK</span>
                    )}
                  </div>
                </div>
                {idx < categoryGroups.length - 1 && <div className="po-costing-row-divider" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Costing Items Detailed Breakdown */}
      <div className="po-costing-section-panel">
        <div className="po-costing-section-header">
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <h3 className="po-costing-section-title">Costing Items ({filteredItems.length})</h3>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search items…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="po-costing-filter-input"
                  style={{ paddingLeft: "32px", width: "200px" }}
                />
                <Search size={14} color="#64748B" style={{ position: "absolute", left: "10px", top: "12px", pointerEvents: "none" }} />
              </div>
              {categoryGroups.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="po-costing-filter-select"
                >
                  <option value="all">All Categories</option>
                  {categoryGroups.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {b.length > 0 && (
            <button
              type="button"
              className="po-boq-btn-import"
              onClick={() => location.assign(`/boqs?id=${b[0].id}&projectId=${p.id}`)}
              style={{ height: "38px" }}
            >
              View In BOQ
            </button>
          )}
        </div>

        <div className="po-costing-table-card">
          {filteredItems.length > 0 ? (
            <Table heads={["ITEM NAME", "CATEGORY", "UNIT", "BASE COST", "SELLING RATE", "VENDOR", "STATUS"]}>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.name}</b></td>
                  <td>{item.category || item.category_name || "General"}</td>
                  <td>{item.unit || "Nos"}</td>
                  <td>{money(Number(item.baseCost || item.base_cost || 0))}</td>
                  <td>{money(Number(item.sellingRate || item.selling_rate || 0))}</td>
                  <td>{item.preferredVendor || item.preferred_vendor || "—"}</td>
                  <td>
                    <span className="tag">
                      {words(item.rateStatus || item.rate_status || "active")}
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="blank" style={{ padding: "32px", textAlign: "center", color: "#64748B", width: "100%" }}>
              No costing items found for this project. Costing lines are generated as items are added to the Bill of Quantities.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Work({ p, b, showToast }: { p: Project; b: Boq[]; showToast?: (msg: string) => void }) {
  const [stages, setStages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskFilter, setTaskFilter] = useState<"all" | "overdue" | "high">("all");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStage, setNewTaskStage] = useState("Civil & Demolition Works");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState(p.projectManager || "Site Supervisor");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  const defaultStages = useMemo(() => [
    {
      id: "stg-1",
      number: "01",
      name: "Design Approvals & Site Survey",
      dateRange: `${date(p.startDate)} – ${date(p.startDate)}`,
      status: "COMPLETED",
    },
    {
      id: "stg-2",
      number: "02",
      name: "Civil & Demolition Works",
      dateRange: `${date(p.startDate)} – ${date(p.targetCompletionDate)}`,
      status: (p.progress || 0) >= 30 ? "COMPLETED" : (p.progress || 0) > 0 ? "IN PROGRESS" : "PENDING",
    },
    {
      id: "stg-3",
      number: "03",
      name: "MEP & Electrical Rough-in",
      dateRange: `${date(p.startDate)} – ${date(p.targetCompletionDate)}`,
      status: (p.progress || 0) >= 60 ? "COMPLETED" : (p.progress || 0) >= 20 ? "IN PROGRESS" : "PENDING",
    },
    {
      id: "stg-4",
      number: "04",
      name: "Joinery, Millwork & Flooring",
      dateRange: `${date(p.startDate)} – ${date(p.targetCompletionDate)}`,
      status: (p.progress || 0) >= 80 ? "COMPLETED" : "PENDING",
    },
    {
      id: "stg-5",
      number: "05",
      name: "Painting, Finishes & Snagging",
      dateRange: `${date(p.startDate)} – ${date(p.targetCompletionDate)}`,
      status: (p.progress || 0) >= 95 ? "COMPLETED" : "PENDING",
    },
    {
      id: "stg-6",
      number: "06",
      name: "Final Handover & Client Signoff",
      dateRange: `${date(p.targetCompletionDate)} – ${date(p.targetCompletionDate)}`,
      status: (p.progress || 0) === 100 ? "COMPLETED" : "PENDING",
    },
  ], [p.startDate, p.targetCompletionDate, p.progress]);

  const loadWorkData = useCallback(() => {
    fetch(`/api/v1/activities/stages`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStages(d.data?.items || []))
      .catch(() => {});
    fetch(`/api/v1/activities/tasks?pageSize=100&projectId=${encodeURIComponent(p.id)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTasks(d.data?.items || []))
      .catch(() => {});
  }, [p.id]);

  useEffect(() => {
    loadWorkData();
  }, [loadWorkData]);

  const activeStagesList = stages.length > 0 ? stages.map((s, idx) => ({
    id: s.id,
    number: String(idx + 1).padStart(2, "0"),
    name: s.name,
    dateRange: s.startDate && s.endDate ? `${date(s.startDate)} – ${date(s.endDate)}` : date(s.endDate || s.due_date || p.targetCompletionDate),
    status: s.status ? s.status.toUpperCase() : (p.progress || 0) >= ((idx + 1) / stages.length) * 100 ? "COMPLETED" : (p.progress || 0) > (idx / stages.length) * 100 ? "IN PROGRESS" : "PENDING",
  })) : defaultStages;

  const currentPhase =
    p.currentPhase ||
    (activeStagesList.find((x) => x.status === "IN PROGRESS" || x.status === "in_progress" || x.status === "ACTIVE")?.name) ||
    ((p.progress || 0) === 100 ? "Completed" : activeStagesList[0]?.name) ||
    "Project Setup";

  const nextPhase =
    (activeStagesList.find((x) => x.status === "PENDING" || x.status === "UPCOMING" || x.status === "not_started")?.name) ||
    ((p.progress || 0) === 100 ? "None (Completed)" : "—");

  const isTaskOverdue = (t: any) => {
    if (t.status === "completed" || t.status === "cancelled") return false;
    const due = t.dueDate || t.due_date;
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(due);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() < today.getTime();
  };

  const getDaysOverdue = (t: any) => {
    const due = t.dueDate || t.due_date;
    if (!due) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(due);
    dueDate.setHours(0, 0, 0, 0);
    const diff = today.getTime() - dueDate.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const isTaskHigh = (t: any) => {
    const prio = (t.priority || "").toLowerCase();
    return prio === "high";
  };

  const isOpenTask = (t: any) => {
    return t.status !== "completed" && t.status !== "cancelled";
  };

  const overdueTasks = tasks.filter((t) => isOpenTask(t) && isTaskOverdue(t));
  const highTasks = tasks.filter((t) => isOpenTask(t) && isTaskHigh(t));
  const openTasks = tasks.filter(isOpenTask);
  const blockedTasks = tasks.filter((t) => t.status === "blocked");

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "overdue") return isOpenTask(t) && isTaskOverdue(t);
    if (taskFilter === "high") return isOpenTask(t) && isTaskHigh(t);
    return t.status !== "cancelled";
  });

  const getStageVisualState = (status?: string) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED" || s === "DONE") {
      return {
        dotClass: "done",
        badgeClass: "done",
        badgeText: "DONE",
        isCompleted: true,
      };
    }
    if (s === "IN PROGRESS" || s === "IN_PROGRESS" || s === "ACTIVE") {
      return {
        dotClass: "in-progress",
        badgeClass: "in-progress",
        badgeText: "IN PROGRESS",
        isCompleted: false,
      };
    }
    return {
      dotClass: "upcoming",
      badgeClass: "upcoming",
      badgeText: "UPCOMING",
      isCompleted: false,
    };
  };

  const getPriorityBadge = (prio?: string) => {
    const p = (prio || "medium").toLowerCase();
    if (p === "high") {
      return { className: "high", text: "HIGH" };
    }
    if (p === "critical") {
      return { className: "critical", text: "CRITICAL" };
    }
    if (p === "low") {
      return { className: "low", text: "LOW" };
    }
    return { className: "normal", text: "NORMAL" };
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "not_started" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );
    try {
      if (taskId && !taskId.startsWith("task-")) {
        await fetch(`/api/v1/activities/tasks/${encodeURIComponent(taskId)}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
      }
      loadWorkData();
    } catch {
      // Local optimistic state is already applied
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      if (taskId && !taskId.startsWith("task-")) {
        await fetch(`/api/v1/activities/tasks/${encodeURIComponent(taskId)}`, {
          method: "DELETE",
          credentials: "include",
        });
      }
      if (showToast) showToast("Task removed");
      loadWorkData();
    } catch {
      // Local state is already updated optimistically
    }
  };

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const chosenStage = activeStagesList.find((s) => s.name === newTaskStage) || activeStagesList[0];
    const stageId = chosenStage?.id && !chosenStage.id.startsWith("stg-") ? chosenStage.id : undefined;

    try {
      let effectiveStageId = stageId;
      if (!effectiveStageId && stages.length > 0) {
        effectiveStageId = stages[0].id;
      }

      const payload: any = {
        name: newTaskTitle.trim(),
        projectId: p.id,
        priority: newTaskPriority.toLowerCase(),
        status: "not_started",
        dueDate: newTaskDueDate || null,
        description: newTaskDesc.trim() || null,
      };
      if (effectiveStageId) {
        payload.stageId = effectiveStageId;
      }

      const res = await fetch("/api/v1/activities/tasks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const createdTask = json.data || json;
        setTasks((prev) => [
          {
            ...createdTask,
            title: createdTask.name || newTaskTitle.trim(),
            stage: newTaskStage,
            priority: newTaskPriority,
            dueDate: newTaskDueDate || null,
            assignee: newTaskAssignee.trim() || p.projectManager || "Site Supervisor",
            status: "not_started",
          },
          ...prev,
        ]);
        if (showToast) showToast("Task created successfully");
      } else {
        // Optimistic fallback for frontend state
        const tempTask = {
          id: "task-" + Date.now(),
          name: newTaskTitle.trim(),
          title: newTaskTitle.trim(),
          stage: newTaskStage,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
          assignee: newTaskAssignee.trim() || p.projectManager || "Site Supervisor",
          status: "not_started",
          description: newTaskDesc.trim() || null,
          createdAt: new Date().toISOString(),
        };
        setTasks((prev) => [tempTask, ...prev]);
        if (showToast) showToast("Task added to workspace");
      }
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskDueDate("");
      setNewTaskOpen(false);
      loadWorkData();
    } catch {
      // Local optimistic task
      const tempTask = {
        id: "task-" + Date.now(),
        name: newTaskTitle.trim(),
        title: newTaskTitle.trim(),
        stage: newTaskStage,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || null,
        assignee: newTaskAssignee.trim() || p.projectManager || "Site Supervisor",
        status: "not_started",
        description: newTaskDesc.trim() || null,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [tempTask, ...prev]);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskDueDate("");
      setNewTaskOpen(false);
      if (showToast) showToast("Task added to workspace");
    }
  };

  return (
    <div className="po-workspace-container">
      {/* 1. Summary Cards Panel (Frame 2147225071) */}
      <div className="po-workspace-summary-panel">
        <div className="po-workspace-kpi-grid">
          {/* Current Phase */}
          <div className="po-workspace-kpi-card">
            <span className="po-workspace-kpi-label">Current Phase</span>
            <span className="po-workspace-kpi-value" title={currentPhase}>
              {currentPhase}
            </span>
          </div>

          {/* Overall Progress */}
          <div className="po-workspace-kpi-card">
            <span className="po-workspace-kpi-label">Overall Progress</span>
            <span className="po-workspace-kpi-value">
              {p.progress || 0}%
            </span>
          </div>

          {/* Next Stage */}
          <div className="po-workspace-kpi-card">
            <span className="po-workspace-kpi-label">Next Stage</span>
            <span className="po-workspace-kpi-value" title={nextPhase}>
              {nextPhase}
            </span>
          </div>

          {/* Overdue Tasks */}
          <div className="po-workspace-kpi-card">
            <span className="po-workspace-kpi-label">Overdue Tasks</span>
            <span className={`po-workspace-kpi-value ${overdueTasks.length > 0 ? "danger" : ""}`}>
              {overdueTasks.length}
            </span>
          </div>

          {/* Open Issues */}
          <div className="po-workspace-kpi-card">
            <span className="po-workspace-kpi-label" title="Open Issues / Tasks">Open Issues</span>
            <span className={`po-workspace-kpi-value ${blockedTasks.length > 0 ? "danger" : ""}`}>
              {blockedTasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Two-Column Main Layout: Stages & Open Tasks (Frame 2147225148) */}
      <div className="po-workspace-main-columns">
        {/* Left Column: STAGES (Frame 2147225072) */}
        <section className="po-workspace-stages-panel">
          <div className="po-workspace-panel-header">
            <h4 className="po-workspace-panel-title">STAGES</h4>
            <span className="po-workspace-count-badge">
              {activeStagesList.length} {activeStagesList.length === 1 ? "stage" : "stages"}
            </span>
          </div>

          <div className="po-workspace-stages-list">
            {activeStagesList.length > 0 ? (
              activeStagesList.map((stg) => {
                const vis = getStageVisualState(stg.status);
                return (
                  <div key={stg.id || stg.name} className="po-stage-card">
                    <div className="po-stage-left">
                      <span className={`po-stage-dot ${vis.dotClass}`} />
                      <span
                        className={`po-stage-name ${vis.isCompleted ? "is-completed" : ""}`}
                        title={stg.name}
                      >
                        {stg.name}
                      </span>
                    </div>
                    <div className="po-stage-right">
                      <span className={`po-stage-badge ${vis.badgeClass}`}>
                        {vis.badgeText}
                      </span>
                      <span className="po-stage-date">
                        {stg.dateRange || date(p.targetCompletionDate)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="po-workspace-empty">
                <Clock size={28} color="#94A3B8" />
                <p className="po-workspace-empty-title">No Stages Configured</p>
                <p className="po-workspace-empty-desc">
                  This project has no active workflow stages defined.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: OPEN TASKS (Frame 2147225130) */}
        <section className="po-workspace-tasks-panel">
          <div className="po-workspace-tasks-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h4 className="po-workspace-panel-title">OPEN TASKS</h4>
              <span className="po-workspace-count-badge">
                {openTasks.length}
              </span>
            </div>

            <div className="po-workspace-tasks-controls">
              {/* Segmented Filter Group (All, Overdue, High) */}
              <div className="po-workspace-filter-group" role="tablist" aria-label="Task filters">
                <button
                  type="button"
                  role="tab"
                  aria-selected={taskFilter === "all"}
                  className={`po-workspace-filter-btn ${taskFilter === "all" ? "is-active" : ""}`}
                  onClick={() => setTaskFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={taskFilter === "overdue"}
                  className={`po-workspace-filter-btn ${taskFilter === "overdue" ? "is-active" : ""}`}
                  onClick={() => setTaskFilter("overdue")}
                >
                  Overdue{overdueTasks.length > 0 ? ` (${overdueTasks.length})` : ""}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={taskFilter === "high"}
                  className={`po-workspace-filter-btn ${taskFilter === "high" ? "is-active" : ""}`}
                  onClick={() => setTaskFilter("high")}
                >
                  High{highTasks.length > 0 ? ` (${highTasks.length})` : ""}
                </button>
              </div>

              {/* + Add Task Button */}
              <button
                type="button"
                className="po-workspace-add-task-btn"
                onClick={() => setNewTaskOpen(true)}
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
          </div>

          <div className="po-workspace-tasks-list">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => {
                const isOverdue = isTaskOverdue(t);
                const isDone = t.status === "completed";
                const prioInfo = getPriorityBadge(t.priority);
                const ownerName = t.assignee || t.assignedToName || t.ownerName || p.projectManager || "Site Supervisor";
                const overdueDays = isOverdue ? getDaysOverdue(t) : 0;
                const taskStageName = t.stage?.name || (typeof t.stage === "string" ? t.stage : "");

                return (
                  <div
                    key={t.id}
                    className={`po-task-card ${isOverdue ? "is-overdue" : ""}`}
                  >
                    <div className="po-task-left">
                      <button
                        type="button"
                        className={`po-task-check-btn ${isDone ? "is-completed" : ""}`}
                        onClick={() => toggleTask(t.id, t.status)}
                        title={isDone ? "Mark as open" : "Mark as completed"}
                        aria-label={isDone ? "Mark as open" : "Mark as completed"}
                      >
                        {isDone && <Check size={13} strokeWidth={3} />}
                      </button>
                      <div className="po-task-content">
                        <span
                          className={`po-task-title ${isDone ? "is-completed" : ""}`}
                        >
                          {t.title || t.name}
                        </span>
                        <div className="po-task-meta-row">
                          <div className="po-task-meta-item">
                            <span className="po-task-meta-label">Owner:</span>
                            <span className="po-task-meta-val">{ownerName}</span>
                          </div>
                          <div className="po-task-meta-item">
                            <span className="po-task-meta-label">Due:</span>
                            <span className={`po-task-meta-val ${isOverdue ? "is-overdue" : ""}`}>
                              {isOverdue ? (
                                t.dueDate || t.due_date ? `${date(t.dueDate || t.due_date)} (Overdue${overdueDays > 1 ? ` by ${overdueDays}d` : ""})` : "Overdue"
                              ) : t.dueDate || t.due_date ? (
                                date(t.dueDate || t.due_date)
                              ) : (
                                "—"
                              )}
                            </span>
                          </div>
                          {taskStageName && (
                            <span className="po-task-stage-badge">
                              {taskStageName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="po-task-right">
                      <span className={`po-task-priority-badge ${prioInfo.className}`}>
                        {prioInfo.text}
                      </span>
                      <button
                        type="button"
                        className="po-task-action-btn"
                        onClick={() => handleDeleteTask(t.id)}
                        title="Delete task"
                        aria-label="Delete task"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="po-workspace-empty">
                <AlertCircle size={28} color="#94A3B8" />
                <p className="po-workspace-empty-title">
                  {taskFilter === "overdue"
                    ? "No Overdue Tasks"
                    : taskFilter === "high"
                    ? "No High Priority Tasks"
                    : "No Open Tasks"}
                </p>
                <p className="po-workspace-empty-desc">
                  {taskFilter === "overdue"
                    ? "All tasks are on schedule! There are no overdue items for this project."
                    : taskFilter === "high"
                    ? "There are currently no high priority tasks requiring urgent attention."
                    : "No tasks found for this project. Click '+ Add Task' above to create one."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Task Creation Modal */}
      {newTaskOpen && (
        <Modal title="Add Workspace Task" close={() => setNewTaskOpen(false)}>
          <form onSubmit={handleCreateTask}>
            <label className="modal-label" style={{ marginTop: 0 }}>
              Task Title *
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Confirm Stone World quote for marble flooring"
                required
                autoFocus
              />
            </label>
            <label className="modal-label">
              Stage
              <select
                value={newTaskStage}
                onChange={(e) => setNewTaskStage(e.target.value)}
                style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dce4ef", borderRadius: "6px", background: "#fff" }}
              >
                {activeStagesList.map((s) => (
                  <option key={s.id || s.name} value={s.name}>
                    {s.number ? `${s.number}. ` : ""}{s.name}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="modal-label">
                Priority
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dce4ef", borderRadius: "6px", background: "#fff" }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium (Normal)</option>
                  <option value="Low">Low</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>
              <label className="modal-label">
                Due Date
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dce4ef", borderRadius: "6px", background: "#fff" }}
                />
              </label>
            </div>
            <label className="modal-label">
              Assignee / Owner
              <input
                type="text"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                placeholder="e.g. Anika Rao"
              />
            </label>
            <label className="modal-label">
              Description (Optional)
              <textarea
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                placeholder="Add specifications, vendor notes, or deliverables..."
                rows={3}
                style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dce4ef", borderRadius: "6px", background: "#fff", resize: "vertical" }}
              />
            </label>
            <footer>
              <button type="button" onClick={() => setNewTaskOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                Create Task
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Docs({
  folders,
  folder,
  docs,
  grid,
  setGrid,
  open,
  back,
  upload,
  add,
  project,
  onReload,
  showToast,
}: {
  folders: Folder[];
  folder: Folder | null;
  docs: Doc[];
  grid: boolean;
  setGrid: (x: boolean) => void;
  open: (x: Folder) => void;
  back: () => void;
  upload: () => void;
  add: () => void;
  project?: Project | null;
  onReload?: () => void;
  showToast?: (msg: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleDocClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleDocClick);
    return () => window.removeEventListener("click", handleDocClick);
  }, []);

  const size = (x: number) => (x > 1048576 ? `${(x / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.ceil(x / 1024))} KB`);

  const handleExport = async (folderId: string, format: "excel" | "pdf", e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuId(null);
    try {
      const projectId = project?.id || "";
      const res = await fetch(`/api/v1/document-folders/${folderId}/export/${format}?projectId=${encodeURIComponent(projectId)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        showToast?.(data?.error?.message || "No approved files available in this folder to export.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition");
      let filename = format === "excel" ? "ApprovedDocuments.xlsx" : "ApprovedDocuments.pdf";
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast?.(`${format.toUpperCase()} export downloaded successfully.`);
    } catch {
      showToast?.(`Failed to download ${format.toUpperCase()} export.`);
    }
  };

  const [fileToDelete, setFileToDelete] = useState<Doc | null>(null);
  const [deleteFileConfirmed, setDeleteFileConfirmed] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [deleteFolderConfirmed, setDeleteFolderConfirmed] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  const handleDeleteFolder = (f: Folder, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuId(null);
    setFolderToDelete(f);
    setDeleteFolderConfirmed(false);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    setIsDeletingFolder(true);
    try {
      const res = await fetch(`/api/v1/document-folders/${folderToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmation: folderToDelete.name }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        showToast?.(d?.error?.message || "Could not delete folder.");
        setIsDeletingFolder(false);
        return;
      }
      showToast?.("Folder deleted successfully.");
      setFolderToDelete(null);
      setIsDeletingFolder(false);
      onReload?.();
    } catch {
      showToast?.("Failed to delete folder.");
      setIsDeletingFolder(false);
    }
  };

  const handleDeleteDoc = (d: Doc, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuId(null);
    setFileToDelete(d);
    setDeleteFileConfirmed(false);
  };

  const confirmDeleteDoc = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    try {
      const res = await fetch(`/api/v1/documents/${fileToDelete.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        showToast?.(data?.error?.message || "Could not delete file.");
        setIsDeletingFile(false);
        return;
      }
      showToast?.("File deleted successfully.");
      const currentFolder = folder;
      setFileToDelete(null);
      setIsDeletingFile(false);
      if (currentFolder) open(currentFolder);
      else onReload?.();
    } catch {
      showToast?.("Failed to delete file.");
      setIsDeletingFile(false);
    }
  };

  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredDocs = docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="documents">
      <div className="workspace-doc-container">
      {/* Figma Reference 1 Header & Toolbar (Root View) */}
      {!folder ? (
        <div className="workspace-doc-toolbar">
          <h3 className="workspace-doc-title">Documents</h3>
          <div className="workspace-doc-actions">
            <div className="workspace-doc-search">
              <div className="workspace-doc-search-icon-box">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="workspace-doc-btn-new" onClick={add} style={{ order: 3 }}>
              <Plus size={16} />
              New Folder
            </button>
            <button className="workspace-doc-btn-upload" onClick={upload} style={{ order: 2 }}>
              <Upload size={16} />
              Upload
            </button>
            <div className="workspace-doc-view-toggle" style={{ order: 1 }}>
              <button
                className={!grid ? "active" : ""}
                onClick={() => setGrid(false)}
                title="List View"
                aria-label="List View"
              >
                <LayoutList size={18} />
              </button>
              <button
                className={grid ? "active" : ""}
                onClick={() => setGrid(true)}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid2X2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Figma Reference 2 Header & Toolbar (Folder View) */
        <div className="workspace-doc-toolbar">
          <div className="workspace-doc-breadcrumbs">
            <button className="workspace-doc-breadcrumb-link" onClick={back}>
              <ArrowLeft size={16} /> Documents
            </button>
            <span className="workspace-doc-breadcrumb-sep">›</span>
            <span className="workspace-doc-breadcrumb-current">{folder.name}</span>
          </div>
          <div className="workspace-doc-actions">
            <div className="workspace-doc-search">
              <div className="workspace-doc-search-icon-box">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="workspace-doc-view-toggle">
              <button
                className={!grid ? "active" : ""}
                onClick={() => setGrid(false)}
                title="List View"
                aria-label="List View"
              >
                <LayoutList size={18} />
              </button>
              <button
                className={grid ? "active" : ""}
                onClick={() => setGrid(true)}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid2X2 size={18} />
              </button>
            </div>
            <button className="workspace-doc-btn-upload" onClick={upload}>
              <Upload size={16} />
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Figma Reference 2 Selected Folder Summary Card */}
      {folder && (
        <div className="workspace-doc-summary-card">
          <div className="workspace-doc-summary-left">
            <div className="workspace-doc-summary-badge">
              <FolderIcon size={20} />
            </div>
            <div className="workspace-doc-summary-info">
              <div className="workspace-doc-summary-name">{folder.name}</div>
              <div className="workspace-doc-summary-meta">
                {folder.itemCount} items | {size(folder.sizeBytes)}
              </div>
            </div>
          </div>
          <div className="workspace-doc-summary-right">
            <span className="workspace-doc-summary-date">Last modified: {date(folder.updatedAt)}</span>
            <button
              className="workspace-doc-btn-upload"
              style={{ height: "36px", padding: "0 12px", fontSize: "13px" }}
              onClick={(e) => handleExport(folder.id, "excel", e)}
              title="Download Approved Files as Excel"
            >
              <FileSpreadsheet size={15} />
              Export Excel
            </button>
            <button
              className="workspace-doc-btn-upload"
              style={{ height: "36px", padding: "0 12px", fontSize: "13px" }}
              onClick={(e) => handleExport(folder.id, "pdf", e)}
              title="Download Approved Files as PDF"
            >
              <FileDown size={15} />
              Export PDF
            </button>
            <div className="workspace-doc-col-action" onClick={(e) => e.stopPropagation()}>
              <button
                className="workspace-doc-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(activeMenuId === `summary-${folder.id}` ? null : `summary-${folder.id}`);
                }}
                title="Folder options"
                aria-label="More options"
              >
                <MoreHorizontal size={18} />
              </button>
              {activeMenuId === `summary-${folder.id}` && (
                <div className="workspace-doc-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button className="workspace-doc-dropdown-item" onClick={(e) => handleExport(folder.id, "excel", e)}>
                    <FileSpreadsheet size={15} /> Download Approved Files — Excel (.xlsx)
                  </button>
                  <button className="workspace-doc-dropdown-item" onClick={(e) => handleExport(folder.id, "pdf", e)}>
                    <FileDown size={15} /> Download Approved Files — PDF (.pdf)
                  </button>
                  <div className="workspace-doc-dropdown-sep" />
                  <button className="workspace-doc-dropdown-item danger" onClick={(e) => handleDeleteFolder(folder, e)}>
                    <Trash2 size={15} /> Delete Folder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Root View Content: Folders List / Grid */}
      {!folder ? (
        !filteredFolders.length ? (
          <div className="workspace-doc-empty">
            <div className="workspace-doc-empty-icon">
              <FolderIcon size={24} />
            </div>
            <div>No folders yet. Click New Folder to organise project files.</div>
          </div>
        ) : !grid ? (
          <div className="workspace-doc-table-card">
            <div className="workspace-doc-table-head">
              <div>NAME</div>
              <div>ITEMS</div>
              <div>SIZE</div>
              <div>LAST MODIFIED</div>
              <div />
            </div>
            <div className="workspace-doc-table-body">
              {filteredFolders.map((f) => (
                <div key={f.id} className="workspace-doc-table-row" onClick={() => open(f)}>
                  <div className="workspace-doc-col-name">
                    <div className="workspace-doc-icon-folder">
                      <FolderIcon size={18} />
                    </div>
                    <span className="workspace-doc-name-text">{f.name}</span>
                  </div>
                  <span className="workspace-doc-cell-muted">{f.itemCount} items</span>
                  <span className="workspace-doc-cell-muted">{size(f.sizeBytes)}</span>
                  <span className="workspace-doc-cell-muted">{date(f.updatedAt)}</span>
                  <div className="workspace-doc-col-action" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="workspace-doc-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === f.id ? null : f.id);
                      }}
                      title="More options"
                      aria-label="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {activeMenuId === f.id && (
                      <div className="workspace-doc-dropdown" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="workspace-doc-dropdown-item"
                          onClick={() => {
                            setActiveMenuId(null);
                            open(f);
                          }}
                        >
                          <FolderIcon size={15} /> Open Folder
                        </button>
                        <button
                          className="workspace-doc-dropdown-item"
                          onClick={(e) => handleExport(f.id, "excel", e)}
                        >
                          <FileSpreadsheet size={15} /> Download Approved Files — Excel (.xlsx)
                        </button>
                        <button
                          className="workspace-doc-dropdown-item"
                          onClick={(e) => handleExport(f.id, "pdf", e)}
                        >
                          <FileDown size={15} /> Download Approved Files — PDF (.pdf)
                        </button>
                        <div className="workspace-doc-dropdown-sep" />
                        <button
                          className="workspace-doc-dropdown-item danger"
                          onClick={(e) => handleDeleteFolder(f, e)}
                        >
                          <Trash2 size={15} /> Delete Folder
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="workspace-doc-grid">
            {filteredFolders.map((f) => (
              <div key={f.id} className="workspace-doc-grid-card" onClick={() => open(f)}>
                <div className="workspace-doc-grid-top">
                  <div className="workspace-doc-icon-folder">
                    <FolderIcon size={20} />
                  </div>
                  <div className="workspace-doc-col-action" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="workspace-doc-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === f.id ? null : f.id);
                      }}
                      title="More options"
                      aria-label="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {activeMenuId === f.id && (
                      <div className="workspace-doc-dropdown" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="workspace-doc-dropdown-item"
                          onClick={() => {
                            setActiveMenuId(null);
                            open(f);
                          }}
                        >
                          <FolderIcon size={15} /> Open Folder
                        </button>
                        <button
                          className="workspace-doc-dropdown-item"
                          onClick={(e) => handleExport(f.id, "excel", e)}
                        >
                          <FileSpreadsheet size={15} /> Download Approved Files — Excel (.xlsx)
                        </button>
                        <button
                          className="workspace-doc-dropdown-item"
                          onClick={(e) => handleExport(f.id, "pdf", e)}
                        >
                          <FileDown size={15} /> Download Approved Files — PDF (.pdf)
                        </button>
                        <div className="workspace-doc-dropdown-sep" />
                        <button
                          className="workspace-doc-dropdown-item danger"
                          onClick={(e) => handleDeleteFolder(f, e)}
                        >
                          <Trash2 size={15} /> Delete Folder
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="workspace-doc-grid-info">
                  <span className="workspace-doc-name-text">{f.name}</span>
                  <span className="workspace-doc-cell-muted">
                    {f.itemCount} items | {size(f.sizeBytes)}
                  </span>
                </div>
                <div className="workspace-doc-grid-bottom">
                  <span>Modified: {date(f.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Folder View Content: Approved Documents List / Grid */
        !filteredDocs.length ? (
          <div className="workspace-doc-empty">
            <div className="workspace-doc-empty-icon">
              <FileText size={24} />
            </div>
            <div>No approved files in this folder yet.</div>
          </div>
        ) : !grid ? (
          <div className="workspace-doc-table-card">
            <div className="workspace-doc-table-head doc-mode">
              <div>NAME</div>
              <div>PROJECT</div>
              <div>SIZE</div>
              <div>MODIFIED</div>
              <div />
            </div>
            <div className="workspace-doc-table-body">
              {filteredDocs.map((x) => (
                <div key={x.id} className="workspace-doc-table-row doc-mode">
                  <div className="workspace-doc-col-name">
                    <div className="workspace-doc-icon-file">
                      <FileText size={18} />
                    </div>
                    <span className="workspace-doc-name-text">{x.name}</span>
                    {(x.isApproved || x.approvalStatus === "approved") && (
                      <span className="workspace-doc-approved-badge">
                        <Check size={11} /> Approved
                      </span>
                    )}
                  </div>
                  <span className="workspace-doc-cell-muted">{x.projectName || project?.name || "General"}</span>
                  <span className="workspace-doc-cell-muted">{size(x.sizeBytes)}</span>
                  <span className="workspace-doc-cell-muted">{date(x.updatedAt)}</span>
                  <div className="workspace-doc-col-action" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="workspace-doc-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === x.id ? null : x.id);
                      }}
                      title="File options"
                      aria-label="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {activeMenuId === x.id && (
                      <div className="workspace-doc-dropdown" onClick={(e) => e.stopPropagation()}>
                        <a
                          className="workspace-doc-dropdown-item"
                          href={`/api/v1/documents/${x.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Eye size={15} /> View
                        </a>
                        <a
                          className="workspace-doc-dropdown-item"
                          href={`/api/v1/documents/${x.id}/download`}
                          download={x.name}
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Download size={15} /> Download
                        </a>
                        <div className="workspace-doc-dropdown-sep" />
                        <button
                          className="workspace-doc-dropdown-item danger"
                          onClick={(e) => handleDeleteDoc(x, e)}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="workspace-doc-grid">
            {filteredDocs.map((x) => (
              <div key={x.id} className="workspace-doc-grid-card">
                <div className="workspace-doc-grid-top">
                  <div className="workspace-doc-icon-file">
                    <FileText size={20} />
                  </div>
                  <div className="workspace-doc-col-action" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="workspace-doc-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === x.id ? null : x.id);
                      }}
                      title="File options"
                      aria-label="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {activeMenuId === x.id && (
                      <div className="workspace-doc-dropdown" onClick={(e) => e.stopPropagation()}>
                        <a
                          className="workspace-doc-dropdown-item"
                          href={`/api/v1/documents/${x.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Eye size={15} /> View
                        </a>
                        <a
                          className="workspace-doc-dropdown-item"
                          href={`/api/v1/documents/${x.id}/download`}
                          download={x.name}
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Download size={15} /> Download
                        </a>
                        <div className="workspace-doc-dropdown-sep" />
                        <button
                          className="workspace-doc-dropdown-item danger"
                          onClick={(e) => handleDeleteDoc(x, e)}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="workspace-doc-grid-info">
                  <span className="workspace-doc-name-text">{x.name}</span>
                  <span className="workspace-doc-cell-muted">{x.projectName || project?.name || "General"}</span>
                </div>
                <div className="workspace-doc-grid-bottom">
                  <span>{size(x.sizeBytes)}</span>
                  <span>{date(x.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      </div>

      {/* Figma Frame 2147225094 / Frame 2147225027 Delete File Confirmation Modal */}
      {fileToDelete && (
        <div className="workspace-doc-modal-backdrop" onClick={() => setFileToDelete(null)}>
          <div className="workspace-doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-doc-modal-header">
              <h3 className="workspace-doc-modal-title">Delete File?</h3>
              <button
                className="workspace-doc-modal-close"
                onClick={() => setFileToDelete(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-doc-modal-panel" style={{ alignItems: "center", textAlign: "center", padding: "24px 16px", gap: "14px" }}>
              <div className="workspace-doc-delete-badge">
                <Trash2 size={28} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <h4 style={{ margin: 0, fontFamily: "Urbanist, sans-serif", fontSize: "18px", fontWeight: 600, color: "#0F172A" }}>
                  Delete File?
                </h4>
                <p style={{ margin: 0, fontFamily: "Urbanist, sans-serif", fontSize: "14px", fontWeight: 500, color: "#64748B", lineHeight: "140%" }}>
                  This file will be permanently deleted from &quot;{fileToDelete.name}&quot;. This action cannot be undone.
                </p>
              </div>

              <div className="workspace-doc-delete-file-card">
                <div className="workspace-doc-delete-file-badge">
                  <FileText size={20} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{ fontFamily: "Urbanist, sans-serif", fontWeight: 600, fontSize: "14px", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {fileToDelete.name}
                  </span>
                  <span style={{ fontFamily: "Urbanist, sans-serif", fontSize: "12px", color: "#64748B" }}>
                    {size(fileToDelete.sizeBytes)}
                  </span>
                </div>
              </div>

              <label className="workspace-doc-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={deleteFileConfirmed}
                  onChange={(e) => setDeleteFileConfirmed(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#EF4444", cursor: "pointer" }}
                />
                <span>I understand this action cannot be undone</span>
              </label>
            </div>

            <div className="workspace-doc-modal-footer" style={{ justifyContent: "space-between", gap: "12px" }}>
              <button
                type="button"
                className="workspace-doc-btn-cancel"
                style={{ flex: 1 }}
                onClick={() => setFileToDelete(null)}
              >
                No, Keep It,
              </button>
              <button
                type="button"
                className="workspace-doc-btn-danger"
                disabled={!deleteFileConfirmed || isDeletingFile}
                onClick={confirmDeleteDoc}
              >
                {isDeletingFile ? "Deleting..." : "Yes, Delete!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Modal (Matching Figma Design) */}
      {folderToDelete && (
        <div className="workspace-doc-modal-backdrop" onClick={() => setFolderToDelete(null)}>
          <div className="workspace-doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-doc-modal-header">
              <h3 className="workspace-doc-modal-title">Delete Folder?</h3>
              <button
                className="workspace-doc-modal-close"
                onClick={() => setFolderToDelete(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="workspace-doc-modal-panel" style={{ alignItems: "center", textAlign: "center", padding: "24px 16px", gap: "14px" }}>
              <div className="workspace-doc-delete-badge">
                <Trash2 size={28} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <h4 style={{ margin: 0, fontFamily: "Urbanist, sans-serif", fontSize: "18px", fontWeight: 600, color: "#0F172A" }}>
                  Delete Folder?
                </h4>
                <p style={{ margin: 0, fontFamily: "Urbanist, sans-serif", fontSize: "14px", fontWeight: 500, color: "#64748B", lineHeight: "140%" }}>
                  This folder and its contents will be permanently deleted from &quot;{folderToDelete.name}&quot;. This action cannot be undone.
                </p>
              </div>

              <div className="workspace-doc-delete-file-card">
                <div className="workspace-doc-delete-file-badge" style={{ background: "#E4ECFB", color: "#2563EB" }}>
                  <FolderIcon size={20} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{ fontFamily: "Urbanist, sans-serif", fontWeight: 600, fontSize: "14px", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {folderToDelete.name}
                  </span>
                  <span style={{ fontFamily: "Urbanist, sans-serif", fontSize: "12px", color: "#64748B" }}>
                    {folderToDelete.itemCount} items • {size(folderToDelete.sizeBytes)}
                  </span>
                </div>
              </div>

              <label className="workspace-doc-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={deleteFolderConfirmed}
                  onChange={(e) => setDeleteFolderConfirmed(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#EF4444", cursor: "pointer" }}
                />
                <span>I understand this action cannot be undone</span>
              </label>
            </div>

            <div className="workspace-doc-modal-footer" style={{ justifyContent: "space-between", gap: "12px" }}>
              <button
                type="button"
                className="workspace-doc-btn-cancel"
                style={{ flex: 1 }}
                onClick={() => setFolderToDelete(null)}
              >
                No, Keep It,
              </button>
              <button
                type="button"
                className="workspace-doc-btn-danger"
                disabled={!deleteFolderConfirmed || isDeletingFolder}
                onClick={confirmDeleteFolder}
              >
                {isDeletingFolder ? "Deleting..." : "Yes, Delete!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Payments({
  p,
  b,
  rows,
  s,
  load,
  showToast,
}: {
  p: Project;
  b: Boq[];
  rows: Invoice[];
  s: { budget: number; paid: number; due: number };
  load: () => void;
  showToast?: (msg: string) => void;
}) {
  const [modal, setModal] = useState(false);
  const [simulateModal, setSimulateModal] = useState(false);
  const [drawerInvoice, setDrawerInvoice] = useState<Invoice | null>(null);
  const [recordModalInvoice, setRecordModalInvoice] = useState<Invoice | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".workspace-payment-menu-container")) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener("click", handleOutsideClick);
      return () => document.removeEventListener("click", handleOutsideClick);
    }
  }, [activeMenuId]);

  const handleOpenRecord = (inv?: Invoice) => {
    setActiveMenuId(null);
    setRecordModalInvoice(inv || null);
    setModal(true);
  };

  const handleDownloadPdf = async (inv: Invoice) => {
    setActiveMenuId(null);
    try {
      const res = await fetch(`/api/v1/invoices/${inv.id}/pdf`, { credentials: "include" });
      if (!res.ok) throw new Error("Invoice PDF not generated yet");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoiceNumber || "Invoice"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast?.("Invoice PDF downloaded successfully.");
    } catch {
      showToast?.("Invoice PDF could not be downloaded.");
    }
  };

  // Metrics calculations
  const totalContract = s.budget || 0;
  const totalInvoiced = rows.reduce((acc, x) => acc + (x.totalAmount || 0), 0);
  const totalPaid = s.paid || 0;
  const totalOutstanding = s.due || 0;

  const invoicedPct = totalContract > 0 ? ((totalInvoiced / totalContract) * 100).toFixed(1) : "0.0";
  const paidPct = totalContract > 0 ? ((totalPaid / totalContract) * 100).toFixed(1) : "0.0";

  const isOverdueDate = (dueDate?: string) => {
    if (!dueDate) return false;
    const t = new Date(dueDate).getTime();
    return !isNaN(t) && t < Date.now();
  };

  const overdueRows = rows.filter(
    (x) => x.status === "overdue" || (isOverdueDate(x.dueDate) && (x.outstanding || 0) > 0)
  );
  const totalOverdue = overdueRows.reduce((acc, x) => acc + (x.outstanding || 0), 0);

  return (
    <div className="workspace-payment-container">
      {/* Figma Frame 2147225071: 4 Metric Cards */}
      <div className="workspace-payment-metrics-container">
        {/* Card 1: Contract Value */}
        <div className="workspace-payment-metric-card">
          <span className="workspace-payment-metric-label">Contract Value</span>
          <span className="workspace-payment-metric-value">{money(totalContract)}</span>
          <span className="workspace-payment-metric-sub">Total Project Budget</span>
        </div>

        {/* Card 2: Invoiced */}
        <div className="workspace-payment-metric-card">
          <span className="workspace-payment-metric-label">Invoiced</span>
          <span className="workspace-payment-metric-value">{formatCompactMoney(totalInvoiced)}</span>
          <span className="workspace-payment-metric-sub">{invoicedPct}% of contract</span>
        </div>

        {/* Card 3: Paid */}
        <div className="workspace-payment-metric-card">
          <span className="workspace-payment-metric-label">Paid</span>
          <span className="workspace-payment-metric-value paid">{formatCompactMoney(totalPaid)}</span>
          <span className="workspace-payment-metric-sub">{paidPct}% of contract</span>
        </div>

        {/* Card 4: Outstanding */}
        <div className="workspace-payment-metric-card">
          <span className="workspace-payment-metric-label">Outstanding</span>
          <span className="workspace-payment-metric-value outstanding">{formatCompactMoney(totalOutstanding)}</span>
          <span className={`workspace-payment-metric-sub ${totalOverdue > 0 ? "overdue" : ""}`}>
            {totalOverdue > 0 ? "Overdue" : "All current"}
          </span>
        </div>
      </div>

      {/* Figma Frame 2147225072 / 2147225065: Schedule Container */}
      <div className="workspace-payment-schedule-container">
        <header className="workspace-payment-schedule-header">
          <h4 className="workspace-payment-schedule-title">PAYMENT SCHEDULE</h4>
          <div className="workspace-payment-schedule-actions">
            <button
              type="button"
              className="workspace-payment-btn-simulate"
              onClick={() => setSimulateModal(true)}
            >
              Simulate Client Payment
            </button>
            <button
              type="button"
              className="workspace-payment-btn-record"
              onClick={() => handleOpenRecord()}
            >
              <Plus size={16} />
              Record Payment
            </button>
          </div>
        </header>

        <div className="workspace-payment-table-panel">
          <div className="workspace-payment-table-wrapper">
            {/* Table Header (Frame 57 with E4ECFB pills) */}
            <div className="workspace-payment-table-head">
              <div className="workspace-payment-col workspace-payment-col-stage">
                <span className="workspace-payment-head-pill">STAGE</span>
              </div>
              <div className="workspace-payment-col workspace-payment-col-date">
                <span className="workspace-payment-head-pill">TRANSACTION DATE</span>
              </div>
              <div className="workspace-payment-col workspace-payment-col-due">
                <span className="workspace-payment-head-pill">DUE DATE</span>
              </div>
              <div className="workspace-payment-col workspace-payment-col-amount">
                <span className="workspace-payment-head-pill">AMOUNT</span>
              </div>
              <div className="workspace-payment-col workspace-payment-col-invoiced">
                <span className="workspace-payment-head-pill">INVOICED</span>
              </div>
              <div className="workspace-payment-col workspace-payment-col-paid">
                <span className="workspace-payment-head-pill">PAID</span>
              </div>
              <div className="workspace-payment-col workspace-payment-col-status">
                <span className="workspace-payment-head-pill">STATUS</span>
              </div>
              <div className="workspace-payment-col workspace-payment-col-action"></div>
            </div>

            {/* Table Rows (Frame 59) */}
            {rows.map((x) => {
              const isOverdue =
                x.status === "overdue" || (isOverdueDate(x.dueDate) && (x.outstanding || 0) > 0);
              const statusKey =
                x.status === "paid" ? "paid" : isOverdue ? "overdue" : x.status === "partially_paid" ? "partial" : "upcoming";
              const statusLabel =
                x.status === "paid"
                  ? "PAID"
                  : isOverdue
                  ? "OVERDUE"
                  : x.status === "partially_paid"
                  ? "PARTIAL"
                  : x.status
                  ? x.status.toUpperCase()
                  : "UPCOMING";

              return (
                <div key={x.id} className="workspace-payment-table-row">
                  {/* STAGE */}
                  <div className="workspace-payment-col workspace-payment-col-stage">
                    <div className="workspace-payment-stage-name" title={x.milestone || "General Milestone"}>
                      {x.milestone || "General Milestone"}
                    </div>
                    <div className="workspace-payment-stage-sub">
                      <span className="workspace-payment-stage-dot" />
                      <span>{x.transactionReference?.startsWith("SIM-") || x.paymentMethod === "upi" ? "Client Dashboard" : "Manual Entry"}</span>
                    </div>
                  </div>

                  {/* TRANSACTION DATE */}
                  <div className="workspace-payment-col workspace-payment-col-date">
                    <span className="workspace-payment-cell-text">{date(x.issueDate)}</span>
                  </div>

                  {/* DUE DATE */}
                  <div className="workspace-payment-col workspace-payment-col-due">
                    <span className={`workspace-payment-cell-text ${isOverdue ? "overdue" : ""}`}>
                      {x.dueDate ? date(x.dueDate) : "Upcoming"}
                    </span>
                  </div>

                  {/* AMOUNT */}
                  <div className="workspace-payment-col workspace-payment-col-amount">
                    <span className="workspace-payment-cell-amount">{formatCompactMoney(x.totalAmount)}</span>
                  </div>

                  {/* INVOICED */}
                  <div className="workspace-payment-col workspace-payment-col-invoiced">
                    {x.invoiceNumber ? (
                      <button
                        type="button"
                        className="workspace-payment-invoice-link"
                        onClick={() => setDrawerInvoice(x)}
                        title="View invoice details"
                      >
                        {x.invoiceNumber}
                      </button>
                    ) : (
                      <span className="workspace-payment-invoice-no">No</span>
                    )}
                  </div>

                  {/* PAID */}
                  <div className="workspace-payment-col workspace-payment-col-paid">
                    <span className="workspace-payment-cell-paid">
                      {x.totalPaid && x.totalPaid > 0 ? formatCompactMoney(x.totalPaid) : "—"}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div className="workspace-payment-col workspace-payment-col-status">
                    <span className={`workspace-payment-badge ${statusKey}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Action Menu (3-dots) */}
                  <div className="workspace-payment-col workspace-payment-col-action workspace-payment-menu-container">
                    <button
                      type="button"
                      className="workspace-payment-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === x.id ? null : x.id);
                      }}
                      aria-label="Payment row actions"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeMenuId === x.id && (
                      <div className="workspace-payment-menu-dropdown">
                        <button
                          type="button"
                          className="workspace-payment-menu-item"
                          onClick={() => {
                            setActiveMenuId(null);
                            setDrawerInvoice(x);
                          }}
                        >
                          <Eye size={14} />
                          View Transaction Details
                        </button>
                        <button
                          type="button"
                          className="workspace-payment-menu-item"
                          onClick={() => handleOpenRecord(x)}
                        >
                          <Plus size={14} />
                          Record Payment
                        </button>
                        <button
                          type="button"
                          className="workspace-payment-menu-item"
                          onClick={() => handleDownloadPdf(x)}
                        >
                          <Download size={14} />
                          Download Invoice PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {!rows.length && (
              <div className="workspace-payment-empty">
                No invoices or payment records are linked to this project. Click Record Payment to add a transaction.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Details Slide Drawer */}
      {drawerInvoice && (
        <PaymentDetailsDrawer
          invoice={drawerInvoice}
          project={p}
          boqs={b}
          onClose={() => setDrawerInvoice(null)}
          onRecordPayment={() => {
            const current = drawerInvoice;
            setDrawerInvoice(null);
            handleOpenRecord(current);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {modal && (
        <RecordPaymentModal
          invoices={rows}
          initialInvoice={recordModalInvoice}
          close={() => {
            setModal(false);
            setRecordModalInvoice(null);
          }}
          load={load}
        />
      )}

      {/* Simulate Client Payment Modal */}
      {simulateModal && (
        <SimulatePaymentModal
          invoices={rows}
          close={() => setSimulateModal(false)}
          load={load}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function PaymentDetailsDrawer({
  invoice,
  project,
  boqs,
  onClose,
  onRecordPayment,
}: {
  invoice: Invoice;
  project: Project;
  boqs: Boq[];
  onClose: () => void;
  onRecordPayment: () => void;
}) {
  const isPaid = invoice.status === "paid";
  const isOverdue =
    invoice.status === "overdue" ||
    (invoice.dueDate && new Date(invoice.dueDate).getTime() < Date.now() && (invoice.outstanding || 0) > 0);
  const boqRef = boqs[0]?.boqNumber || project.projectCode || "BOQ-2024-004";
  const txnId = invoice.transactionReference || `TXN-${(invoice.id || "8F72A91C").slice(0, 8).toUpperCase()}`;
  const isClientDashboard = invoice.transactionReference?.startsWith("SIM-") || invoice.paymentMethod === "upi";

  const statusLabel = isPaid
    ? "PAID"
    : isOverdue
    ? "OVERDUE"
    : invoice.status === "partially_paid"
    ? "PARTIALLY PAID"
    : "ACTIVE";
  const statusClass = isPaid
    ? "paid"
    : isOverdue
    ? "overdue"
    : invoice.status === "partially_paid"
    ? "partial"
    : "active";

  return (
    <div className="workspace-payment-drawer-backdrop" onClick={onClose}>
      <div
        className="workspace-payment-drawer-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Figma Frame 2147225093) */}
        <div className="workspace-payment-drawer-header">
          <div className="workspace-payment-drawer-title-group">
            <span className="workspace-payment-drawer-subtitle">TRANSACTION RECORD</span>
            <h3 className="workspace-payment-drawer-title">Payment Details</h3>
          </div>
          <button
            type="button"
            className="workspace-payment-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Card (Figma Frame 2147225027) */}
        <div className="workspace-payment-drawer-card">
          {/* Status Badges Row (Frame 2147225412) */}
          <div className="workspace-payment-drawer-badges">
            <span className={`workspace-payment-badge ${statusClass}`}>
              {statusLabel}
            </span>
            <span className="workspace-payment-drawer-source-badge">
              <span className="workspace-payment-stage-dot" />
              {isClientDashboard ? "CLIENT DASHBOARD" : "MANUAL ENTRY"}
            </span>
          </div>

          {/* Amount Frame (Frame 2147225413) */}
          <div className="workspace-payment-drawer-amount-block">
            <div className="workspace-payment-drawer-amount-val">
              {formatCompactMoney(invoice.totalPaid && invoice.totalPaid > 0 ? invoice.totalPaid : invoice.totalAmount)}
            </div>
            <div className="workspace-payment-drawer-amount-lbl">
              {invoice.totalPaid && invoice.totalPaid > 0 ? "Amount Received" : "Payment Amount"}
              {invoice.outstanding > 0 ? ` · ${money(invoice.outstanding)} outstanding` : " · Fully reconciled & settled"}
            </div>
          </div>

          <div className="workspace-payment-drawer-divider" />

          {/* Transaction Metadata Grid (Frame 2147225081) */}
          <div>
            <h4 className="workspace-payment-drawer-section-title">Transaction Metadata</h4>
            <div className="workspace-payment-drawer-grid">
              <div className="workspace-payment-drawer-field">
                <span className="workspace-payment-drawer-field-label">Transaction Type</span>
                <span className="workspace-payment-drawer-field-val">
                  {invoice.milestone || "Milestone Payment"}
                </span>
              </div>
              <div className="workspace-payment-drawer-field">
                <span className="workspace-payment-drawer-field-label">Payment Method</span>
                <span className="workspace-payment-drawer-field-val">
                  {words(invoice.paymentMethod || "bank_transfer").toUpperCase()}
                </span>
              </div>
              <div className="workspace-payment-drawer-field">
                <span className="workspace-payment-drawer-field-label">Transaction ID</span>
                <span className="workspace-payment-drawer-field-val">{txnId}</span>
              </div>
              <div className="workspace-payment-drawer-field">
                <span className="workspace-payment-drawer-field-label">Transaction Date</span>
                <span className="workspace-payment-drawer-field-val">
                  {date(invoice.paidAt || invoice.issueDate)}
                </span>
              </div>
              <div className="workspace-payment-drawer-field">
                <span className="workspace-payment-drawer-field-label">Transaction Time</span>
                <span className="workspace-payment-drawer-field-val">
                  {invoice.paidAt ? formatTime(invoice.paidAt) : "03:42 PM"}
                </span>
              </div>
              <div className="workspace-payment-drawer-field">
                <span className="workspace-payment-drawer-field-label">Linked Invoice</span>
                <span className="workspace-payment-drawer-field-val link">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="workspace-payment-drawer-field">
                <span className="workspace-payment-drawer-field-label">Linked BOQ</span>
                <span className="workspace-payment-drawer-field-val link">{boqRef}</span>
              </div>
              <div className="workspace-payment-drawer-field">
                <span className="workspace-payment-drawer-field-label">Due Date</span>
                <span className="workspace-payment-drawer-field-val">{date(invoice.dueDate)}</span>
              </div>
            </div>
          </div>

          <div className="workspace-payment-drawer-divider" />

          {/* Payment History / Timeline (Frame 2147225417) */}
          <div>
            <h4 className="workspace-payment-drawer-section-title">Payment Timeline</h4>
            <div className="workspace-payment-timeline">
              <div className="workspace-payment-timeline-item">
                <div className="workspace-payment-timeline-node">
                  <div className="workspace-payment-timeline-dot success">
                    <div className="workspace-payment-timeline-dot-inner" />
                  </div>
                  <div className="workspace-payment-timeline-line" />
                </div>
                <div className="workspace-payment-timeline-content">
                  <span className="workspace-payment-timeline-title">Payment Initiated</span>
                  <span className="workspace-payment-timeline-time">
                    {date(invoice.issueDate)} · 10:00 AM
                  </span>
                </div>
              </div>

              <div className="workspace-payment-timeline-item">
                <div className="workspace-payment-timeline-node">
                  <div className={`workspace-payment-timeline-dot ${invoice.totalPaid > 0 ? "success" : ""}`}>
                    <div className="workspace-payment-timeline-dot-inner" />
                  </div>
                  <div className="workspace-payment-timeline-line" />
                </div>
                <div className="workspace-payment-timeline-content">
                  <span className="workspace-payment-timeline-title">
                    {invoice.totalPaid > 0
                      ? `${words(invoice.paymentMethod || "bank_transfer").toUpperCase()} payment processing`
                      : "Awaiting Client Payment"}
                  </span>
                  <span className="workspace-payment-timeline-time">
                    {invoice.paidAt
                      ? `${date(invoice.paidAt)} · ${formatTime(invoice.paidAt)}`
                      : `Due by ${date(invoice.dueDate)}`}
                  </span>
                </div>
              </div>

              <div className="workspace-payment-timeline-item">
                <div className="workspace-payment-timeline-node">
                  <div className={`workspace-payment-timeline-dot ${isPaid ? "success" : ""}`}>
                    <div className="workspace-payment-timeline-dot-inner" />
                  </div>
                </div>
                <div className="workspace-payment-timeline-content">
                  <span className="workspace-payment-timeline-title">
                    {isPaid
                      ? `Payment linked to Invoice ${invoice.invoiceNumber}`
                      : "Pending full reconciliation"}
                  </span>
                  <span className="workspace-payment-timeline-time">
                    {isPaid
                      ? invoice.paidAt
                        ? date(invoice.paidAt)
                        : "Payment cleared & settled"
                      : `${money(invoice.outstanding)} balance pending`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-payment-drawer-divider" />

          {/* Payment Receipt */}
          <div>
            <h4 className="workspace-payment-drawer-section-title">Payment Receipt</h4>
            {invoice.receiptUrl ? (
              <a
                href={invoice.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="workspace-payment-receipt-link"
              >
                <Paperclip size={14} /> View / Download Receipt
              </a>
            ) : (
              <span style={{ fontSize: "12px", color: "#64748B", fontFamily: "'Urbanist', sans-serif" }}>
                No receipt document attached to this invoice.
              </span>
            )}
          </div>

          {/* Notes */}
          <div>
            <h4 className="workspace-payment-drawer-section-title">Notes</h4>
            <p className="workspace-payment-notes-box">
              {invoice.notes || "No additional transaction notes recorded."}
            </p>
          </div>

          {/* Actions Footer */}
          <div className="workspace-payment-drawer-footer">
            {invoice.outstanding > 0 && (
              <button
                type="button"
                className="workspace-payment-drawer-btn-primary"
                onClick={onRecordPayment}
              >
                Record Payment
              </button>
            )}
            <button
              type="button"
              className="workspace-payment-drawer-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordPaymentModal({
  invoices,
  initialInvoice,
  close,
  load,
}: {
  invoices: Invoice[];
  initialInvoice: Invoice | null;
  close: () => void;
  load: () => void;
}) {
  const [invoiceId, setInvoiceId] = useState(initialInvoice?.id || (invoices[0]?.id || ""));
  const [milestone, setMilestone] = useState(initialInvoice?.milestone || "");
  const [amount, setAmount] = useState(
    initialInvoice
      ? String(initialInvoice.outstanding || initialInvoice.totalAmount)
      : invoices[0]
      ? String(invoices[0].outstanding || invoices[0].totalAmount)
      : ""
  );
  const [method, setMethod] = useState("bank_transfer");
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paidTime, setPaidTime] = useState("12:00");
  const [reference, setReference] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const selected = invoices.find((x) => x.id === id);
    if (selected) {
      if (selected.milestone) setMilestone(selected.milestone);
      setAmount(String(selected.outstanding || selected.totalAmount));
    }
  };

  const handleReceiptUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/v1/projects/upload-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to upload receipt");
      setReceiptUrl(data.data.url);
      setReceiptFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload receipt");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const submit = async () => {
    if (!invoiceId || !amount) return setError("Invoice and amount are required.");
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return setError("Please enter a valid positive payment amount.");
    setLoading(true);
    setError("");
    try {
      const combinedDateTime = paidDate ? `${paidDate}T${paidTime || "00:00"}:00.000Z` : undefined;
      await recordPayment(invoiceId, {
        amount: numAmount,
        method,
        paidAt: combinedDateTime,
        reference,
        notes,
        receiptUrl: receiptUrl || undefined,
        milestone: milestone || undefined,
      });
      load();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record payment");
      setLoading(false);
    }
  };

  return (
    <div className="workspace-record-modal-backdrop" onMouseDown={close}>
      <div
        className="workspace-record-modal-container"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header (Figma Frame 2147225093) */}
        <div className="workspace-record-modal-header">
          <div className="workspace-record-modal-title-group">
            <h3 className="workspace-record-modal-title">Record Payment</h3>
            <p className="workspace-record-modal-subtitle">
              Add a payment received from the client manually.
            </p>
          </div>
          <button
            type="button"
            className="workspace-record-modal-close"
            onClick={close}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Inner Card (Figma Frame 2147225027) */}
        <div className="workspace-record-modal-card">
          {error && (
            <div className="workspace-record-error">
              {error}
            </div>
          )}

          <div className="workspace-record-grid">
            {/* Field 1: Payment For (Milestone) */}
            <div className="workspace-record-field">
              <label className="workspace-record-label">
                Payment For (Milestone)
              </label>
              <input
                type="text"
                className="workspace-record-input"
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                placeholder="e.g. Milestone 2 — BOQ Approval"
              />
            </div>

            {/* Field 2: Linked Invoice * */}
            <div className="workspace-record-field">
              <label className="workspace-record-label">
                Linked Invoice <span className="workspace-record-req">*</span>
              </label>
              <select
                className="workspace-record-input"
                value={invoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
              >
                <option value="">Select Invoice</option>
                {invoices.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.invoiceNumber} — {money(x.outstanding)} due ({words(x.status)})
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: Amount Received (₹) * */}
            <div className="workspace-record-field">
              <label className="workspace-record-label">
                Amount Received (₹) <span className="workspace-record-req">*</span>
              </label>
              <input
                type="number"
                className="workspace-record-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter payment amount"
                min="1"
                required
              />
            </div>

            {/* Field 4: Payment Method * */}
            <div className="workspace-record-field">
              <label className="workspace-record-label">
                Payment Method <span className="workspace-record-req">*</span>
              </label>
              <select
                className="workspace-record-input"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="card">Credit / Debit Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Field 5: Reference / Cheque / UTR ID */}
            <div className="workspace-record-field">
              <label className="workspace-record-label">
                Reference / Cheque / UTR ID
              </label>
              <input
                type="text"
                className="workspace-record-input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Enter transaction/reference ID"
              />
            </div>

            {/* Field 6: Payment Date * */}
            <div className="workspace-record-field">
              <label className="workspace-record-label">
                Payment Date <span className="workspace-record-req">*</span>
              </label>
              <input
                type="date"
                className="workspace-record-input"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                required
              />
            </div>

            {/* Field 7: Payment Time */}
            <div className="workspace-record-field">
              <label className="workspace-record-label">
                Payment Time
              </label>
              <input
                type="time"
                className="workspace-record-input"
                value={paidTime}
                onChange={(e) => setPaidTime(e.target.value)}
              />
            </div>

            {/* Field 8: Receipt / Proof of Payment */}
            <div className="workspace-record-field">
              <label className="workspace-record-label">
                Receipt / Proof of Payment
              </label>
              <div className="workspace-record-file-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleReceiptUpload}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="workspace-record-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingReceipt}
                >
                  Choose File
                </button>
                <span className="workspace-record-file-name">
                  {uploadingReceipt
                    ? "Uploading…"
                    : receiptFileName
                    ? receiptFileName
                    : "No file chosen"}
                </span>
                {receiptUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl("");
                      setReceiptFileName("");
                    }}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "#DC2626",
                      cursor: "pointer",
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Remove attachment"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Field 9: Notes / Remarks (Full Width) */}
            <div className="workspace-record-field full-width">
              <label className="workspace-record-label">
                Notes / Remarks
              </label>
              <textarea
                className="workspace-record-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this payment..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer (Frame 2147225069) */}
        <div className="workspace-record-modal-footer">
          <button
            type="button"
            className="workspace-record-btn-cancel"
            onClick={close}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="workspace-record-btn-submit"
            onClick={submit}
            disabled={loading || uploadingReceipt}
          >
            {loading ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SimulatePaymentModal({
  invoices,
  close,
  load,
  showToast,
}: {
  invoices: Invoice[];
  close: () => void;
  load: () => void;
  showToast?: (msg: string) => void;
}) {
  const [invoiceId, setInvoiceId] = useState(invoices[0]?.id || "");
  const selectedInvoice = invoices.find((x) => x.id === invoiceId) || invoices[0];
  const [amount, setAmount] = useState(
    selectedInvoice ? String(selectedInvoice.outstanding || selectedInvoice.totalAmount) : ""
  );
  const [method, setMethod] = useState("upi");
  const [reference, setReference] = useState(() => `SIM-TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const sel = invoices.find((x) => x.id === id);
    if (sel) {
      setAmount(String(sel.outstanding || sel.totalAmount));
    }
  };

  const handleSimulate = async () => {
    if (!invoiceId) {
      setError("Please select an invoice to simulate payment for.");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await recordPayment(invoiceId, {
        amount: numAmount,
        method,
        reference: reference.trim() || `SIM-${Date.now()}`,
        paidAt: new Date().toISOString(),
        notes: "Simulated online client payment from project dashboard",
        milestone: selectedInvoice?.milestone || undefined,
      });
      load();
      showToast?.(`Client payment of ₹${numAmount.toLocaleString("en-IN")} simulated successfully!`);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to simulate payment.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-doc-modal-backdrop" onClick={close}>
      <div className="workspace-doc-modal-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
        <div className="workspace-doc-modal-header">
          <div>
            <h3 className="workspace-doc-modal-title">Simulate Client Payment</h3>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "13px", fontFamily: "'Urbanist', sans-serif" }}>
              Simulate an incoming online payment transaction as if made by the client.
            </p>
          </div>
          <button className="workspace-doc-modal-close" onClick={close} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", marginBottom: "14px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", margin: "16px 0" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A", marginBottom: "6px", fontFamily: "'Urbanist', sans-serif" }}>
              Select Invoice / Milestone *
            </label>
            {invoices.length > 0 ? (
              <select
                value={invoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "14px", fontFamily: "'Urbanist', sans-serif", background: "#FFFFFF", color: "#0F172A" }}
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber || "Invoice"} — {inv.milestone || "Milestone"} (Due: {money(inv.outstanding)})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: "13px", color: "#94A3B8" }}>No invoices available to simulate.</div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A", marginBottom: "6px", fontFamily: "'Urbanist', sans-serif" }}>
                Amount to Pay (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                placeholder="0"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "14px", fontFamily: "'Urbanist', sans-serif", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A", marginBottom: "6px", fontFamily: "'Urbanist', sans-serif" }}>
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "14px", fontFamily: "'Urbanist', sans-serif", background: "#FFFFFF", color: "#0F172A" }}
              >
                <option value="upi">UPI / Instant Pay</option>
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="net_banking">Net Banking</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A", marginBottom: "6px", fontFamily: "'Urbanist', sans-serif" }}>
              Simulated Reference ID
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. SIM-TXN-123456"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "14px", fontFamily: "'Urbanist', sans-serif", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ background: "#F1F5F9", borderRadius: "6px", padding: "10px 14px", fontSize: "12px", color: "#64748B", lineHeight: 1.4 }}>
            💡 <strong>Notice:</strong> This simulates an instantaneous customer payment event, updates the invoice status, ledger, and payment schedule in real time.
          </div>
        </div>

        <div className="workspace-doc-modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="workspace-doc-btn-cancel"
            onClick={close}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="workspace-doc-btn-primary"
            onClick={handleSimulate}
            disabled={isSubmitting || !invoices.length}
          >
            {isSubmitting ? "Processing..." : "Simulate Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseActivityLogItem(x: any) {
  const author = x.user || x.actor || x.userName || (x.userId ? `User ${String(x.userId).slice(0, 4)}` : "System");
  const isSystem = author.toLowerCase().includes("system");
  const initials = author
    .split(/\s+/)
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SY";

  const rawCat = (x.category || x.type || "ACTIVITY").toUpperCase();
  const category = rawCat === "INVITE" ? "INVITATION" : rawCat;

  let verb = "updated";
  let target = x.title || x.action || "Project";

  if (x.type === "boq") {
    verb = x.status === "approved" ? "approved" : x.status === "ready" ? "finalized" : "updated";
    target = x.title || "BOQ Revision";
  } else if (x.type === "task") {
    verb = x.status === "completed" ? "completed" : "updated";
    target = (x.title || "Task").replace(/^Task:\s*/i, "");
  } else if (x.type === "approval") {
    verb = x.status === "approved" ? "approved" : x.status === "rejected" ? "rejected" : "submitted";
    target = (x.title || "Approval").replace(/^Approval:\s*/i, "");
  } else if (x.type === "invoice") {
    verb = x.status === "paid" ? "recorded payment for" : "issued";
    target = x.title || "Invoice";
  } else if (x.type === "invite") {
    verb = "sent invitation to";
    target = x.description?.replace(/^Invitation sent to\s*/i, "").replace(/\s*\(.*\)$/, "") || "Client";
  } else if (x.type === "project") {
    verb = "initiated";
    target = x.title?.replace(/^Project\s*/i, "") || "Project";
  } else {
    target = x.title || x.name || "Project Update";
  }

  const timeAgo = formatActivityTimeAgo(x.createdAt || x.timestamp);

  return { author, verb, target, timeAgo, category, initials, isSystem };
}

function formatActivityTimeAgo(dateStr: string) {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 3600000);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Activity({ pId }: { pId: string }) {
  const [acts, setActs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`/api/v1/projects/${encodeURIComponent(pId)}/activities`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setActs(d.data?.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pId]);

  const filteredActs = useMemo(() => {
    if (filter === "all") return acts;
    return acts.filter((a) => (a.category || a.type || "").toLowerCase() === filter.toLowerCase());
  }, [acts, filter]);

  if (loading) return <div className="blank">Loading activity…</div>;

  return (
    <section className="tab-panel activity">
      <div className="workspace-activity-container">
        <header className="workspace-activity-header">
          <h4 className="workspace-activity-title">Project Activity Log ({acts.length})</h4>
          <div className="workspace-activity-filters">
            {["all", "boq", "invoice", "task", "approval"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`workspace-activity-filter-btn ${filter === cat ? "active" : ""}`}
              >
                {cat === "all" ? "All Activity" : cat}
              </button>
            ))}
          </div>
        </header>

        <div className="workspace-activity-card">
          {filteredActs.map((x, i) => {
            const parsed = parseActivityLogItem(x);
            return (
              <div key={x.id || i} style={{ width: "100%" }}>
                <div className="workspace-activity-row">
                  <div className={`workspace-activity-avatar ${parsed.isSystem ? "avatar-system" : "avatar-user"}`}>
                    {parsed.initials}
                  </div>
                  <div className="workspace-activity-info">
                    <div className="workspace-activity-line1">
                      <span className="workspace-activity-author">{parsed.author}</span>
                      <span className="workspace-activity-verb">{parsed.verb}</span>
                      <span className="workspace-activity-target">{parsed.target}</span>
                    </div>
                    <div className="workspace-activity-line2">
                      <span className="workspace-activity-time">{parsed.timeAgo}</span>
                      <span className="workspace-activity-dot">•</span>
                      <span className="workspace-activity-category">{parsed.category}</span>
                    </div>
                  </div>
                </div>
                {i < filteredActs.length - 1 && <hr className="workspace-activity-divider" />}
              </div>
            );
          })}

          {!filteredActs.length && (
            <div className="workspace-activity-empty">No activity recorded for this filter.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return (
    <div className="workspace-modal-bg" onMouseDown={close}>
      <section className="workspace-modal" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button onClick={close} aria-label="Close modal">
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

/* =========================================================================
   Client Invite & Manage Access Modal (Figma Frames 2147225093 / 2147225027 / 2147225569)
   ========================================================================= */
function ClientInviteModal({
  project,
  invitation,
  onClose,
  onReload,
  showToast,
  openEditProject,
  initialMode,
}: {
  project: Project;
  invitation: ClientInvitation | null;
  onClose: () => void;
  onReload: () => void;
  showToast: (msg: string) => void;
  openEditProject?: () => void;
  initialMode?: "invite" | "manage";
}) {
  const [currentInv, setCurrentInv] = useState<ClientInvitation | null>(invitation);
  const isManaging = initialMode === "manage" || (initialMode !== "invite" && !!currentInv && (currentInv.status === "pending" || currentInv.status === "accepted"));
  const [email, setEmail] = useState(currentInv?.email || project.clientEmail || "");
  const [clientName, setClientName] = useState(currentInv?.clientName || project.clientName || "");
  const [message, setMessage] = useState(currentInv?.message || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const projectCodeDisplay = project.projectCode || (project.id ? "PRJ-" + project.id.slice(0, 4).toUpperCase() : "PRJ-0048");

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Client email is required before sending an invitation.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/projects/${project.id}/client-invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          clientName: clientName.trim() || project.clientName,
          message: message.trim() || undefined,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || "Unable to send the invitation. Please try again.");
      }

      showToast(payload.data?.message || "Client invitation sent successfully.");
      onReload();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send client invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndSendUpdates = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError("Client email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/projects/${project.id}/client-invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          clientName: clientName.trim() || project.clientName,
          message: message.trim() || undefined,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          const resendRes = await fetch(`/api/v1/projects/${project.id}/client-invite/resend`, {
            method: "POST",
            credentials: "include",
          });
          const resendPayload = await resendRes.json();
          if (!resendRes.ok) {
            throw new Error(resendPayload.error?.message || "Failed to send updates.");
          }
          showToast(resendPayload.data?.message || "Client invitation updated and resent successfully.");
          onReload();
          onClose();
          return;
        }
        throw new Error(payload.error?.message || "Failed to save client access updates.");
      }

      showToast(payload.data?.message || "Client access saved and invitation sent successfully.");
      onReload();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save client access.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke client access for this project? The client will no longer be able to access the shared project dashboard.")) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/client-invite`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || "Failed to revoke client access.");
      }
      showToast(payload.data?.message || "Client access has been revoked successfully.");
      onReload();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke client access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-client-modal-backdrop" onClick={onClose}>
      <div className="workspace-client-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header (Frame 2147225093) */}
        <div className="workspace-client-modal-header">
          <div className="workspace-client-modal-titles">
            <h3 className="workspace-client-modal-title">
              {isManaging ? "Manage Client Access" : "Invite Client"}
            </h3>
            <p className="workspace-client-modal-subtitle">
              {isManaging
                ? "Configure client viewing privileges for this shared project dashboard."
                : "Invite your client to access the shared project dashboard"}
            </p>
          </div>
          <button
            type="button"
            className="workspace-client-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Card (Frame 2147225027) */}
        <div className="workspace-client-inner-card">
          {/* Metadata Banner (Frame 2147225360) */}
          <div className="workspace-client-meta-banner">
            <div className="workspace-client-meta-col">
              <span className="workspace-client-meta-label">ID</span>
              <span className="workspace-client-meta-value">{projectCodeDisplay}</span>
            </div>
            <div className="workspace-client-meta-col">
              <span className="workspace-client-meta-label">PROJECT</span>
              <span className="workspace-client-meta-value">{project.name}</span>
            </div>
          </div>

          {/* If managing an existing invite/access, show status badge */}
          {isManaging && currentInv && (
            <div className={`workspace-client-status-chip ${currentInv.status === "accepted" ? "chip-active" : ""}`}>
              {currentInv.status === "accepted" ? (
                <>
                  <CheckCircle2 size={14} /> Active Client Access
                </>
              ) : (
                <>
                  <Clock size={14} /> Pending Invitation (sent to {currentInv.email})
                </>
              )}
            </div>
          )}

          {error && <div className="workspace-client-error">{error}</div>}

          {/* Section Heading */}
          <h4 className="workspace-client-section-heading">Client Information</h4>

          {/* 2-Column Form Fields (Frame 2147225425) */}
          <div className="workspace-client-form-grid">
            <div className="workspace-client-field">
              <label className="workspace-client-label">
                Client Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="workspace-client-input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client Name"
                disabled={loading}
              />
            </div>
            <div className="workspace-client-field">
              <label className="workspace-client-label">
                Client Email <span className="required-star">*</span>
              </label>
              <input
                type="email"
                className="workspace-client-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@email.com"
                required
                disabled={loading}
                autoFocus={!project.clientEmail}
              />
            </div>
          </div>

          {/* Full-width Personal Message Field */}
          <div className="workspace-client-field" style={{ width: "100%" }}>
            <label className="workspace-client-label">Personal Message</label>
            <textarea
              className="workspace-client-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add notes for your client..."
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer (Frame 2147225069 / Frame 2147225569) */}
        {isManaging ? (
          <div className="workspace-client-modal-footer">
            <button
              type="button"
              className="workspace-client-btn-revoke"
              onClick={handleRevoke}
              disabled={loading}
            >
              <Trash2 size={16} />
              <span>Revoke Access</span>
            </button>
            <div className="workspace-client-footer-actions">
              <button
                type="button"
                className="workspace-client-btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="workspace-client-btn-primary"
                onClick={handleSaveAndSendUpdates}
                disabled={loading || !email.trim()}
              >
                {loading ? "Saving..." : "Save & Send Updates"}
              </button>
            </div>
          </div>
        ) : (
          <div className="workspace-client-modal-footer">
            <button
              type="button"
              className="workspace-client-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="workspace-client-btn-primary"
              onClick={handleSend}
              disabled={loading || !email.trim()}
            >
              {loading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ManageClientAccessModal(props: {
  project: Project;
  invitation: ClientInvitation | null;
  onClose: () => void;
  onReload: () => void;
  showToast: (msg: string) => void;
  openEditProject?: () => void;
}) {
  return <ClientInviteModal {...props} initialMode="manage" />;
}

/* =========================================================================
   Review Pending Actions Modal
   ========================================================================= */
function ReviewPendingModal({
  projectId,
  projectName,
  onClose,
  onGoToActivities,
}: {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onGoToActivities: () => void;
}) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/activities/approvals?pageSize=50&projectId=${projectId}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/v1/activities/tasks?pageSize=50&projectId=${projectId}&status=open`).then((r) => r.json()).catch(() => null),
    ])
      .then(([aRes, tRes]) => {
        const allApprovals = aRes?.data?.items || [];
        const pendingApprovals = allApprovals.filter((a: any) => ["draft", "sent", "in_review"].includes(a.status));
        setApprovals(pendingApprovals);

        const allTasks = tRes?.data?.items || [];
        const openTasks = allTasks.filter((t: any) => ["not_started", "in_progress", "blocked"].includes(t.status));
        setTasks(openTasks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const totalCount = approvals.length + tasks.length;

  return (
    <Modal title="Review Pending Actions" close={onClose}>
      <p style={{ margin: "4px 0 12px", fontSize: "12px", color: "#64748b" }}>
        Pending actions and deliverables for <strong>{projectName}</strong>
      </p>

      {loading ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
          Loading pending actions…
        </div>
      ) : totalCount === 0 ? (
        <div style={{ padding: "32px 16px", textAlign: "center" }}>
          <CheckCircle2 size={36} color="#16a34a" style={{ margin: "0 auto 10px" }} />
          <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#1e293b" }}>All caught up!</h4>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            There are no pending approvals or open tasks for this project.
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {approvals.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                Pending Approvals ({approvals.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {approvals.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "10px",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "#1e293b" }}>{a.name}</strong>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Approver: {a.approverName || "Assigned"} {a.dueDate ? `· Due ${date(a.dueDate)}` : ""}
                      </span>
                    </div>
                    <span className="tag" style={{ background: "#fef3c7", color: "#b45309", fontSize: "10px" }}>
                      {words(a.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                Open Tasks ({tasks.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: "10px",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "#1e293b" }}>{t.title || t.name}</strong>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Priority: {t.priority || "Medium"} {t.dueDate ? `· Due ${date(t.dueDate)}` : ""}
                      </span>
                    </div>
                    <span className="tag" style={{ fontSize: "10px" }}>
                      {words(t.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <footer>
        <button type="button" onClick={onGoToActivities}>
          View in Activity Log
        </button>
        <button type="button" className="primary" onClick={onClose}>
          Close
        </button>
      </footer>
    </Modal>
  );
}

/* =========================================================================
   Edit Project Modal
   ========================================================================= */
function EditProjectModal({
  project,
  onClose,
  onSaved,
  showToast,
}: {
  project: Project;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string) => void;
}) {
  const meta = project.metadata || {};
  const [activeSection, setActiveSection] = useState<"general" | "location" | "client" | "timeline" | "commercial" | "team">("general");

  const [form, setForm] = useState({
    name: project.name || "",
    clientName: project.clientName || "",
    clientContact: project.clientContact || "",
    clientEmail: project.clientEmail || "",
    projectType: project.projectType || "Commercial",
    status: project.status || "planning",
    location: project.location || "",
    description: project.description || "",
    areaSqft: project.areaSqft ? String(project.areaSqft) : "",
    projectValue: project.projectValue ? String(project.projectValue) : "",
    approvedBudget: project.approvedBudget ? String(project.approvedBudget) : "",
    startDate: project.startDate ? project.startDate.split("T")[0] : "",
    targetCompletionDate: project.targetCompletionDate ? project.targetCompletionDate.split("T")[0] : "",
    // Metadata fields for 6 cards
    propertyName: project.propertyName || meta.propertyName || project.name || "",
    address: project.address || meta.address || project.location || "",
    city: project.city || meta.city || "",
    state: project.state || meta.state || "",
    country: project.country || meta.country || "India",
    postalCode: project.postalCode || meta.postalCode || "",
    siteAccessNotes: project.siteAccessNotes || meta.siteAccessNotes || "",
    organization: project.organization || meta.organization || "",
    billingContact: project.billingContact || meta.billingContact || project.clientName || "",
    communicationPreference: project.communicationPreference || meta.communicationPreference || "Email",
    actualStartDate: project.actualStartDate ? project.actualStartDate.split("T")[0] : (meta.actualStartDate ? meta.actualStartDate.split("T")[0] : ""),
    currentPhase: project.currentPhase || meta.currentPhase || "Planning",
    priority: project.priority || meta.priority || "Medium",
    currency: project.currency || meta.currency || "INR (₹)",
    taxConfiguration: project.taxConfiguration || meta.taxConfiguration || "GST 18%",
    targetMargin: project.targetMargin ? String(project.targetMargin) : (meta.targetMargin ? String(meta.targetMargin) : "20"),
    paymentTerms: project.paymentTerms || meta.paymentTerms || "Net 30",
    contractReference: project.contractReference || meta.contractReference || "",
    projectManager: project.projectManager || meta.projectManager || "",
    leadDesigner: project.leadDesigner || meta.leadDesigner || "",
    estimator: project.estimator || meta.estimator || "",
    procurementOwner: project.procurementOwner || meta.procurementOwner || "",
    financeOwner: project.financeOwner || meta.financeOwner || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.clientName.trim()) {
      setError("Project Name and Client Name are required.");
      return;
    }

    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      clientName: form.clientName.trim(),
      clientContact: form.clientContact.trim() || null,
      clientEmail: form.clientEmail.trim() || null,
      projectType: form.projectType,
      status: form.status,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      projectValue: form.projectValue ? Number(form.projectValue) : null,
      approvedBudget: form.approvedBudget ? Number(form.approvedBudget) : null,
      startDate: form.startDate || null,
      targetCompletionDate: form.targetCompletionDate || null,
      metadata: {
        propertyName: form.propertyName.trim() || form.name.trim(),
        address: form.address.trim() || form.location.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        postalCode: form.postalCode.trim(),
        siteAccessNotes: form.siteAccessNotes.trim(),
        organization: form.organization.trim(),
        billingContact: form.billingContact.trim(),
        communicationPreference: form.communicationPreference,
        actualStartDate: form.actualStartDate || null,
        currentPhase: form.currentPhase,
        priority: form.priority,
        currency: form.currency,
        taxConfiguration: form.taxConfiguration,
        targetMargin: form.targetMargin ? Number(form.targetMargin) : null,
        paymentTerms: form.paymentTerms,
        contractReference: form.contractReference.trim(),
        projectManager: form.projectManager.trim(),
        leadDesigner: form.leadDesigner.trim(),
        estimator: form.estimator.trim(),
        procurementOwner: form.procurementOwner.trim(),
        financeOwner: form.financeOwner.trim(),
      },
    };

    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || "Failed to update project.");
      }

      showToast("Project details updated successfully.");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { key: "general", label: "General" },
    { key: "location", label: "Location" },
    { key: "client", label: "Client" },
    { key: "timeline", label: "Timeline" },
    { key: "commercial", label: "Commercial" },
    { key: "team", label: "Team" },
  ] as const;

  return (
    <div className="workspace-modal-bg" onMouseDown={onClose}>
      <section
        className="workspace-modal"
        style={{ width: "min(650px, calc(100vw - 32px))", padding: "20px" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "14px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>Edit Project Details</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
              Update project attributes, commercial settings, schedule, and assigned owners.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </header>

        {/* Section Navigation Tabs */}
        <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "3px", borderRadius: "6px", marginBottom: "14px", overflowX: "auto" }}>
          {sections.map((sec) => (
            <button
              key={sec.key}
              type="button"
              onClick={() => setActiveSection(sec.key)}
              style={{
                border: 0,
                background: activeSection === sec.key ? "#fff" : "transparent",
                color: activeSection === sec.key ? "#2563eb" : "#64748b",
                fontSize: "11px",
                fontWeight: 650,
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
              {error}
            </div>
          )}

          <div style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
            {activeSection === "general" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
                  Project Name *
                  <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Project Type *
                  <select
                    value={form.projectType}
                    onChange={(e) => update("projectType", e.target.value)}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dbe4ef", borderRadius: "6px", background: "#fff" }}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Retail">Retail</option>
                    <option value="Office">Office</option>
                  </select>
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Status *
                  <select
                    value={form.status}
                    onChange={(e) => update("status", e.target.value)}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dbe4ef", borderRadius: "6px", background: "#fff" }}
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Area (sqft)
                  <input type="number" value={form.areaSqft} onChange={(e) => update("areaSqft", e.target.value)} placeholder="e.g. 2400" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Approved Budget (₹)
                  <input type="number" value={form.approvedBudget} onChange={(e) => update("approvedBudget", e.target.value)} placeholder="e.g. 5000000" />
                </label>
                <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={2}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dbe4ef", borderRadius: "6px", font: "inherit", fontSize: "12px", outline: "none" }}
                  />
                </label>
              </div>
            )}

            {activeSection === "location" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
                  Property / Building Name
                  <input type="text" value={form.propertyName} onChange={(e) => update("propertyName", e.target.value)} placeholder="e.g. Tower B, Emerald Heights" />
                </label>
                <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
                  Address / Location
                  <input type="text" value={form.address} onChange={(e) => { update("address", e.target.value); update("location", e.target.value); }} placeholder="e.g. 402, High Street" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  City
                  <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Mumbai" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  State
                  <input type="text" value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="e.g. Maharashtra" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Country
                  <input type="text" value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="India" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Postal / PIN Code
                  <input type="text" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="e.g. 400001" />
                </label>
                <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
                  Site Access Notes
                  <textarea
                    value={form.siteAccessNotes}
                    onChange={(e) => update("siteAccessNotes", e.target.value)}
                    rows={2}
                    placeholder="e.g. Service elevator available 9am to 6pm, guard check required at gate."
                    style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dbe4ef", borderRadius: "6px", font: "inherit", fontSize: "12px", outline: "none" }}
                  />
                </label>
              </div>
            )}

            {activeSection === "client" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Client Name *
                  <input type="text" value={form.clientName} onChange={(e) => update("clientName", e.target.value)} required />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Organization / Company
                  <input type="text" value={form.organization} onChange={(e) => update("organization", e.target.value)} placeholder="e.g. Acme Corp" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Phone Contact
                  <input type="text" value={form.clientContact} onChange={(e) => update("clientContact", e.target.value)} placeholder="+91 98765 43210" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Client Email
                  <input type="email" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} placeholder="client@example.com" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Billing Contact
                  <input type="text" value={form.billingContact} onChange={(e) => update("billingContact", e.target.value)} placeholder="Name of accounts contact" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Communication Preference
                  <select
                    value={form.communicationPreference}
                    onChange={(e) => update("communicationPreference", e.target.value)}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dbe4ef", borderRadius: "6px", background: "#fff" }}
                  >
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="In-person">In-person</option>
                  </select>
                </label>
              </div>
            )}

            {activeSection === "timeline" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Planned Start Date
                  <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Actual Start Date
                  <input type="date" value={form.actualStartDate} onChange={(e) => update("actualStartDate", e.target.value)} />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Target Completion Date
                  <input type="date" value={form.targetCompletionDate} onChange={(e) => update("targetCompletionDate", e.target.value)} />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Current Phase
                  <input type="text" value={form.currentPhase} onChange={(e) => update("currentPhase", e.target.value)} placeholder="e.g. Design & Approvals" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Priority
                  <select
                    value={form.priority}
                    onChange={(e) => update("priority", e.target.value)}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dbe4ef", borderRadius: "6px", background: "#fff" }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </label>
              </div>
            )}

            {activeSection === "commercial" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Project Value (₹)
                  <input type="number" value={form.projectValue} onChange={(e) => update("projectValue", e.target.value)} placeholder="e.g. 6500000" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Approved Budget (₹)
                  <input type="number" value={form.approvedBudget} onChange={(e) => update("approvedBudget", e.target.value)} placeholder="e.g. 5000000" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Currency
                  <input type="text" value={form.currency} onChange={(e) => update("currency", e.target.value)} placeholder="INR (₹)" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Tax Configuration
                  <input type="text" value={form.taxConfiguration} onChange={(e) => update("taxConfiguration", e.target.value)} placeholder="GST 18%" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Target Margin (%)
                  <input type="number" value={form.targetMargin} onChange={(e) => update("targetMargin", e.target.value)} placeholder="20" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Payment Terms
                  <input type="text" value={form.paymentTerms} onChange={(e) => update("paymentTerms", e.target.value)} placeholder="Net 30 / Milestone based" />
                </label>
                <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
                  Contract Reference
                  <input type="text" value={form.contractReference} onChange={(e) => update("contractReference", e.target.value)} placeholder="e.g. CTR-2026-901" />
                </label>
              </div>
            )}

            {activeSection === "team" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Project Manager
                  <input type="text" value={form.projectManager} onChange={(e) => update("projectManager", e.target.value)} placeholder="e.g. Rajesh Kumar" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Lead Designer
                  <input type="text" value={form.leadDesigner} onChange={(e) => update("leadDesigner", e.target.value)} placeholder="e.g. Ananya Sharma" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Estimator
                  <input type="text" value={form.estimator} onChange={(e) => update("estimator", e.target.value)} placeholder="e.g. Sunil Verma" />
                </label>
                <label className="modal-label" style={{ marginTop: 0 }}>
                  Procurement Owner
                  <input type="text" value={form.procurementOwner} onChange={(e) => update("procurementOwner", e.target.value)} placeholder="e.g. Vikas Patel" />
                </label>
                <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
                  Finance / Billing Owner
                  <input type="text" value={form.financeOwner} onChange={(e) => update("financeOwner", e.target.value)} placeholder="e.g. Neha Gupta" />
                </label>
              </div>
            )}
          </div>

          <footer style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

/* =========================================================================
   Project More Actions Menu
   ========================================================================= */
function ProjectMoreMenu({
  project,
  onClose,
  onReload,
  showToast,
}: {
  project: Project;
  onClose: () => void;
  onReload: () => void;
  showToast: (msg: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, [onClose]);

  const handleDuplicate = async () => {
    onClose();
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to duplicate project.");
      showToast("Project duplicated successfully.");
      onReload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to duplicate project.");
    }
  };

  const handleExport = () => {
    onClose();
    window.open(`/api/v1/projects/export?id=${project.id}`, "_blank");
  };

  const handleToggleHold = async () => {
    onClose();
    const nextStatus = project.status === "on_hold" ? "active" : "on_hold";
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update project status.");
      showToast(nextStatus === "on_hold" ? "Project put on hold." : "Project resumed.");
      onReload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update project status.");
    }
  };

  const handleMarkCompleted = async () => {
    onClose();
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to mark completed.");
      showToast("Project marked as completed.");
      onReload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to mark completed.");
    }
  };

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to archive "${project.name}"?`)) return;
    onClose();
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/archive`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to archive project.");
      showToast("Project archived.");
      setTimeout(() => location.assign("/projects"), 800);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to archive project.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) return;
    onClose();
    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to delete project.");
      showToast("Project deleted.");
      setTimeout(() => location.assign("/projects"), 800);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to delete project.");
    }
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        right: 0,
        background: "#ffffff",
        border: "1px solid #dce4ef",
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(28,47,77,0.12)",
        zIndex: 100,
        minWidth: "190px",
        padding: "6px 0",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleDuplicate}
        style={{
          border: 0,
          background: "transparent",
          padding: "9px 14px",
          textAlign: "left",
          fontSize: "12px",
          color: "#1e293b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Copy size={14} color="#64748b" /> Duplicate Project
      </button>

      <button
        onClick={handleExport}
        style={{
          border: 0,
          background: "transparent",
          padding: "9px 14px",
          textAlign: "left",
          fontSize: "12px",
          color: "#1e293b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Download size={14} color="#64748b" /> Export Project
      </button>

      <button
        onClick={handleToggleHold}
        style={{
          border: 0,
          background: "transparent",
          padding: "9px 14px",
          textAlign: "left",
          fontSize: "12px",
          color: "#1e293b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {project.status === "on_hold" ? (
          <>
            <PlayCircle size={14} color="#16a34a" /> Resume Project
          </>
        ) : (
          <>
            <PauseCircle size={14} color="#d97706" /> Put On Hold
          </>
        )}
      </button>

      <button
        onClick={handleMarkCompleted}
        style={{
          border: 0,
          background: "transparent",
          padding: "9px 14px",
          textAlign: "left",
          fontSize: "12px",
          color: "#1e293b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Check size={14} color="#16a34a" /> Mark Completed
      </button>

      <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />

      <button
        onClick={handleArchive}
        style={{
          border: 0,
          background: "transparent",
          padding: "9px 14px",
          textAlign: "left",
          fontSize: "12px",
          color: "#64748b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Archive size={14} color="#64748b" /> Archive Project
      </button>

      <button
        onClick={handleDelete}
        style={{
          border: 0,
          background: "transparent",
          padding: "9px 14px",
          textAlign: "left",
          fontSize: "12px",
          color: "#dc2626",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Trash2 size={14} color="#dc2626" /> Delete Project
      </button>
    </div>
  );
}
