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
} from "lucide-react";
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
const date = (x?: string) =>
  x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(x)) : "—";
const words = (x: string) => x.replace(/_/g, " ");

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
    const r = await fetch(`/api/v1/documents?folderId=${f.id}&projectId=${encodeURIComponent(id)}&pageSize=100`, { credentials: "include" });
    const b = await r.json();
    setD((b.data?.items || []).filter((x: Doc) => x.projectId === id));
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
    const r = await fetch("/api/v1/document-folders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), parentId: folder?.id || null }),
    });
    if (!r.ok) return setError("Folder could not be created.");
    setNewFolder(false);
    setName("");
    void load();
  };

  const send = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !p) return;
    const targetFolderId = folder?.id || (folders.length > 0 ? folders[0].id : null);
    const d = new FormData();
    d.append("file", f);
    if (targetFolderId) d.append("folderId", targetFolderId);
    d.append("projectId", p.id);
    d.append("projectName", p.name);
    const r = await fetch("/api/v1/documents/upload", { method: "POST", credentials: "include", body: d });
    if (!r.ok) return setError("File could not be uploaded.");
    setUpload(false);
    if (folder) {
      void open(folder);
    } else if (targetFolderId) {
      const targetFolder = folders.find((x) => x.id === targetFolderId);
      if (targetFolder) void open(targetFolder);
    } else {
      void load();
    }
  };

  if (!p) return <div className="workspace-loading">{error || "Loading project workspace…"}</div>;

  return (
    <main className="fig-dashboard boq-dashboard workspace-ui">
      <DashboardRail current="/projects" />
      <div className="fig-dashboard-main">
        <DashboardHeader title="Projects" />
        <section className="workspace-content">
          <div className="workspace-title">
            <div>
              <button onClick={() => location.assign("/projects")} aria-label="Back to projects">
                <ArrowLeft />
              </button>
              <h2>{p.name}</h2>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", position: "relative" }}>
              <button className="primary" onClick={() => setReviewPendingOpen(true)}>
                Review Pending Actions
              </button>
              <button onClick={() => setInviteOpen(true)}>
                Send Invite to Client
              </button>
              <button onClick={() => setEditOpen(true)}>
                Edit Project
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                aria-label="More project actions"
              >
                <MoreHorizontal />
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

          <nav className="workspace-tabs">
            {tabs.map((x) => (
              <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>
                {x}
              </button>
            ))}
          </nav>

          {tab === "Overview" && <Overview p={p} b={boqs} s={stats} onNavigateTab={setTab} />}
          {tab === "Project Details" && <Details p={p} onEdit={() => setEditOpen(true)} />}
          {tab === "BOQs" && <Boqs p={p} b={boqs} />}
          {tab === "Costing" && <Costing p={p} b={boqs} />}
          {tab === "Project Workspace" && <Work p={p} b={boqs} />}
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
            />
          )}
          {tab === "Payments" && <Payments p={p} b={boqs} rows={invoices} s={stats} load={load} />}
          {tab === "Activity Log" && <Activity pId={p.id} />}
        </section>
      </div>

      {/* Modals */}
      {upload && (
        <Modal title="Upload Files" close={() => setUpload(false)}>
          <label className="upload-drop">
            <Upload />
            <b>Drop files here</b>
            <span>or click to browse your computer</span>
            <input type="file" onChange={send} />
          </label>
        </Modal>
      )}

      {newFolder && (
        <Modal title="New Folder" close={() => setNewFolder(false)}>
          <label className="modal-label">
            Folder Name *
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Projects" />
          </label>
          <footer>
            <button onClick={() => setNewFolder(false)}>Cancel</button>
            <button className="primary" onClick={create}>
              Create Folder
            </button>
          </footer>
        </Modal>
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
  onNavigateTab,
}: {
  p: Project;
  b: Boq[];
  s: { budget: number; boq: number; paid: number; due: number };
  onNavigateTab: (tab: string) => void;
}) {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/v1/projects/${p.id}/activities`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setActivities((d.data?.items || []).slice(0, 4)))
      .catch(() => {});
  }, [p.id]);

  // Dynamic next actions
  const actions: Array<{
    tag: string;
    title: string;
    desc: string;
    owner: string;
    btn: string;
    onClick: () => void;
  }> = [];

  if (b.length === 0) {
    actions.push({
      tag: "BOQ",
      title: "Create First BOQ",
      desc: "Set up an itemised bill of quantities for this project to start estimating costs and margins.",
      owner: "Module: BOQ · Owner: Estimator",
      btn: "Create BOQ",
      onClick: () => location.assign(`/boqs?projectId=${p.id}&create=true`),
    });
  } else if (b.some((x) => x.status.toUpperCase() === "DRAFT" || x.status.toUpperCase() === "PENDING")) {
    actions.push({
      tag: "BOQ",
      title: "BOQ Approval Pending",
      desc: `Review the latest BOQ revision (${b[0]?.boqNumber || "Draft"}) and submit for client sign-off.`,
      owner: "Module: BOQ · Owner: Project team",
      btn: "Open BOQ",
      onClick: () => location.assign(`/boqs?id=${b[0]?.id}&projectId=${p.id}`),
    });
  }

  if (s.due > 0) {
    actions.push({
      tag: "PAYMENTS",
      title: "Follow up on Pending Payments",
      desc: `${money(s.due)} is outstanding across project milestone invoices. Follow up with client.`,
      owner: "Module: Invoices · Owner: Finance team",
      btn: "View Payments",
      onClick: () => onNavigateTab("Payments"),
    });
  }

  if ((p.progress || 0) < 100) {
    actions.push({
      tag: "WORKSPACE",
      title: "Track Project Execution",
      desc: `Current overall progress is at ${p.progress || 0}%. Review milestone dates and open site tasks.`,
      owner: "Module: Workspace · Owner: Project Manager",
      btn: "Open Workspace",
      onClick: () => onNavigateTab("Project Workspace"),
    });
  }

  if (actions.length === 0) {
    actions.push({
      tag: "PROJECT",
      title: "Project Running Smoothly",
      desc: "All BOQs, milestones, and payments are up to date. Review project activity logs for latest updates.",
      owner: "Module: Overview · Owner: Project Team",
      btn: "View Details",
      onClick: () => onNavigateTab("Project Details"),
    });
  }

  // Health evaluations
  const budgetHealth = s.budget > 0
    ? s.boq <= s.budget
      ? { label: "Budget", val: "Within Budget", note: `${money(s.budget)} approved budget (${money(Math.max(0, s.budget - s.boq))} remaining)`, ok: true }
      : { label: "Budget", val: "Budget Exceeded", note: `${money(s.boq - s.budget)} above approved budget`, ok: false }
    : { label: "Budget", val: "Budget not set", note: "Add approved budget in project details.", ok: false };

  const boqHealth = b.length > 0
    ? b.some((x) => x.status.toUpperCase() === "APPROVED")
      ? { label: "BOQ", val: "BOQ Approved", note: `${b.filter((x) => x.status.toUpperCase() === "APPROVED").length} of ${b.length} BOQs approved.`, ok: true }
      : { label: "BOQ", val: "Approval Pending", note: `${b.length} BOQ(s) awaiting sign-off.`, ok: true }
    : { label: "BOQ", val: "No BOQ yet", note: "Create a BOQ to begin estimating.", ok: false };

  const isBehindSchedule = p.targetCompletionDate && new Date(p.targetCompletionDate) < new Date() && p.status !== "completed";
  const timelineHealth = p.targetCompletionDate
    ? isBehindSchedule
      ? { label: "Timeline", val: "Behind Schedule", note: `Target completion was ${date(p.targetCompletionDate)}`, ok: false }
      : { label: "Timeline", val: "On Schedule", note: `Target completion ${date(p.targetCompletionDate)}`, ok: true }
    : { label: "Timeline", val: "No deadline", note: "Set dates in project details.", ok: false };

  const paymentsHealth = s.due > 0
    ? { label: "Payments", val: "Pending Receivables", note: `${money(s.due)} outstanding to collect.`, ok: false }
    : s.paid > 0
    ? { label: "Payments", val: "Up to Date", note: `${money(s.paid)} collected successfully.`, ok: true }
    : { label: "Payments", val: "No Invoices", note: "Generate invoices to start billing.", ok: true };

  const procurementHealth = b.length > 0
    ? { label: "Procurement", val: "Ready for POs", note: "Materials mapped from project BOQs.", ok: true }
    : { label: "Procurement", val: "Pending BOQ", note: "Requires BOQ items for procurement.", ok: false };

  return (
    <>
      <div className="overview-top">
        <aside>
          <h4>Project Health</h4>
          {[budgetHealth, boqHealth, timelineHealth, paymentsHealth, procurementHealth].map((h) => (
            <Health key={h.label} label={h.label} value={h.val} note={h.note} ok={h.ok} />
          ))}
        </aside>
        <div className="next-actions">
          <h4>Next Actions for this Project</h4>
          {actions.map((act, i) => (
            <div className="action-card" key={i}>
              <div>
                <small>{act.tag}</small>
                <h3>{act.title}</h3>
                <p>{act.desc}</p>
                <span>{act.owner}</span>
              </div>
              <button onClick={act.onClick}>{act.btn}</button>
            </div>
          ))}
        </div>
      </div>

      <div className="overview-grid">
        <Card
          title="Project Overview"
          rows={[
            ["Project Type", p.projectType],
            ["Client", p.clientName],
            ["Area", p.areaSqft ? `${p.areaSqft.toLocaleString("en-IN")} sqft` : "—"],
            ["Location", p.location || "—"],
            ["Start Date", date(p.startDate)],
            ["Target Completion", date(p.targetCompletionDate)],
            ["Description", p.description || "No description added"],
          ]}
        />
        <Card
          title="Timeline Snapshot"
          rows={[
            ["Start Date", date(p.startDate)],
            ["Target Completion", date(p.targetCompletionDate)],
            ["Current Phase", p.currentPhase || (b.length ? "BOQ Preparation" : "Project Setup")],
            ["Overall Progress", `${p.progress || 0}%`],
            ["Rooms", String(p.rooms?.length || 0)],
          ]}
        />
        <Card
          title="Budget & Value Snapshot"
          rows={[
            ["Project Value", money(p.projectValue)],
            ["Approved Budget", money(p.approvedBudget)],
            ["Approved BOQ Value", money(s.boq)],
            ["Paid", money(s.paid)],
            ["Outstanding", money(s.due)],
          ]}
        />
        <Card
          title="BOQ Snapshot"
          rows={[
            ["Total BOQs", String(b.length)],
            ["Approved BOQs", String(b.filter((x) => x.status.toUpperCase() === "APPROVED").length)],
            ["Latest BOQ", b[0]?.boqNumber || "—"],
            ["Latest Version", b[0]?.version || "—"],
            ["Estimated Value", money(s.boq)],
          ]}
        />
        <Card
          title="Project Team"
          rows={[
            ["Project Manager", p.projectManager || "Unassigned"],
            ["Lead Designer", p.leadDesigner || "Unassigned"],
            ["Estimator", p.estimator || "Unassigned"],
            ["Client Contact", p.clientContact || p.clientEmail || "—"],
          ]}
        />
        <section className="info-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h4 style={{ margin: 0, textTransform: "uppercase", fontSize: "11px", color: "#647792" }}>Recent Activity</h4>
            <button
              onClick={() => onNavigateTab("Activity Log")}
              style={{ border: 0, background: "transparent", color: "#2563eb", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
            >
              View All →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#fff", borderRadius: "11px", padding: "12px", minHeight: "110px" }}>
            {activities.length ? (
              activities.map((a, idx) => (
                <div key={a.id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: idx < activities.length - 1 ? "1px solid #f1f5f9" : "none", paddingBottom: "6px" }}>
                  <div>
                    <b style={{ fontSize: "11px", color: "#1e293b", display: "block" }}>{a.title || a.name || a.action}</b>
                    <small style={{ fontSize: "10px", color: "#64748b" }}>{a.actor || a.assigneeId || "Team"}</small>
                  </div>
                  <small style={{ fontSize: "10px", color: "#94a3b8" }}>{date(a.createdAt || a.timestamp)}</small>
                </div>
              ))
            ) : (
              <span style={{ color: "#94a3b8", fontSize: "11px" }}>No recent activity for this project.</span>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Health({ label, value, note, ok }: { label: string; value: string; note: string; ok?: boolean }) {
  const dotColor = ok === false ? "#ef4444" : ok === true ? "#17b65b" : "#f59e0b";
  return (
    <div className="health">
      <small style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ color: dotColor, fontSize: "12px" }}>●</span> {label}
      </small>
      <b style={{ color: ok === false ? "#dc2626" : "#20a85b" }}>{value}</b>
      <span>{note}</span>
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

function Boqs({ p, b }: { p: Project; b: Boq[] }) {
  return (
    <section className="tab-panel">
      <header>
        <p>{b.length} BOQs for this project</p>
        <button className="primary" onClick={() => location.assign(`/boqs?projectId=${p.id}&create=true`)}>
          <Plus />
          New BOQ
        </button>
      </header>
      <Table heads={["BOQ ID", "VERSION", "ROOMS", "ITEMS", "ESTIMATED VALUE", "DATE", "STATUS", ""]}>
        {b.map((x) => (
          <tr key={x.id} onClick={() => location.assign(`/boqs?id=${x.id}&projectId=${p.id}`)}>
            <td>{x.boqNumber}</td>
            <td>{x.version}</td>
            <td>{x.roomCount}</td>
            <td>{x.itemCount}</td>
            <td>{money(x.grandTotal)}</td>
            <td>{date(x.updatedAt)}</td>
            <td>
              <span className="tag">{words(x.status)}</span>
            </td>
            <td>
              <MoreHorizontal />
            </td>
          </tr>
        ))}
      </Table>
      {!b.length && <div className="blank">No BOQs created for this project.</div>}
    </section>
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
      setAnalysis(resAnalysis?.summary || null);
      setItems(resItems || []);
      setLoading(false);
    });
  }, [p.id]);

  const approvedBudget = p.approvedBudget || analysis?.totalBudget || p.projectValue || 0;
  const actualCost = analysis?.actualCost || 0;
  const committedCost = analysis?.committed || 0;
  const availableBudget = approvedBudget - actualCost - committedCost;

  // Group items into categories
  const categoryGroups = useMemo(() => {
    const map = new Map<string, { count: number; totalBase: number; totalSelling: number }>();
    for (const item of items) {
      const cat = item.category || item.category_name || "General";
      const existing = map.get(cat) || { count: 0, totalBase: 0, totalSelling: 0 };
      existing.count += 1;
      existing.totalBase += Number(item.baseCost || item.base_cost || 0);
      existing.totalSelling += Number(item.sellingRate || item.selling_rate || 0);
      map.set(cat, existing);
    }
    return Array.from(map.entries()).map(([cat, data]) => ({
      name: cat,
      count: data.count,
      budget: data.totalSelling,
      actual: data.totalBase,
      committed: 0,
      variance: data.totalSelling - data.totalBase,
      status: data.totalBase <= data.totalSelling ? "Within Budget" : "Over Budget",
    }));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchSearch = !search || it.name.toLowerCase().includes(search.toLowerCase());
      const cat = it.category || it.category_name || "General";
      const matchCat = categoryFilter === "all" || cat.toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  if (loading) return <div className="blank">Loading costing data…</div>;

  return (
    <>
      <Metrics
        data={[
          ["Approved Budget", money(approvedBudget)],
          ["Actual Cost", money(actualCost)],
          ["Committed Cost", money(committedCost)],
          ["Available Budget", money(availableBudget)],
        ]}
      />

      <section className="tab-panel" style={{ marginBottom: "16px" }}>
        <header>
          <h4>Category-wise Cost Breakdown</h4>
        </header>
        {categoryGroups.length > 0 ? (
          <Table heads={["CATEGORY", "ITEMS", "ESTIMATED / BUDGET", "ACTUAL COST", "VARIANCE", "STATUS"]}>
            {categoryGroups.map((cg) => (
              <tr key={cg.name}>
                <td><b>{cg.name}</b></td>
                <td>{cg.count} items</td>
                <td>{money(cg.budget)}</td>
                <td>{money(cg.actual)}</td>
                <td style={{ color: cg.variance >= 0 ? "#15803d" : "#b91c1c", fontWeight: 600 }}>{money(cg.variance)}</td>
                <td>
                  <span className="tag" style={{ background: cg.status === "Within Budget" ? "#dcfce7" : "#fee2e2", color: cg.status === "Within Budget" ? "#15803d" : "#b91c1c" }}>
                    {cg.status}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="blank">
            No category costing lines created yet. BOQ items are automatically mapped into costing categories when BOQs are prepared.
          </div>
        )}
      </section>

      <section className="tab-panel">
        <header>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <h4 style={{ margin: 0 }}>Costing Items ({filteredItems.length})</h4>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search items…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "6px 10px",
                  fontSize: "11px",
                  borderRadius: "5px",
                  border: "1px solid #dce4ef",
                  outline: "none",
                }}
              />
              {categoryGroups.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    fontSize: "11px",
                    borderRadius: "5px",
                    border: "1px solid #dce4ef",
                    outline: "none",
                    background: "#fff",
                  }}
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
              onClick={() => location.assign(`/boqs?id=${b[0].id}&projectId=${p.id}`)}
              style={{ fontSize: "11px", padding: "6px 12px" }}
            >
              View In BOQ
            </button>
          )}
        </header>

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
          <div className="blank">
            No costing items found for this project. Costing lines are generated as items are added to the Bill of Quantities.
          </div>
        )}
      </section>
    </>
  );
}

function Work({ p, b }: { p: Project; b: Boq[] }) {
  const [stages, setStages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskFilter, setTaskFilter] = useState<"all" | "overdue" | "high">("all");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStage, setNewTaskStage] = useState("Civil & Demolition Works");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState(p.projectManager || "Site Supervisor");

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
    dateRange: `${date(s.startDate || p.startDate)} – ${date(s.endDate || p.targetCompletionDate)}`,
    status: s.status ? s.status.toUpperCase() : "PENDING",
  })) : defaultStages;

  const currentPhase = p.currentPhase || (activeStagesList.find((x) => x.status === "IN PROGRESS")?.name) || activeStagesList[0]?.name || "Project Setup";
  const nextPhase = (activeStagesList.find((x) => x.status === "PENDING")?.name) || "Handover & Snagging";

  const isTaskOverdue = (t: any) => {
    if (t.status === "completed") return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate).getTime() < new Date().getTime();
  };

  const getDaysOverdue = (t: any) => {
    if (!t.dueDate) return 0;
    const diff = Date.now() - new Date(t.dueDate).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const overdueTasks = tasks.filter(isTaskOverdue);
  const openTasks = tasks.filter((t) => t.status !== "completed");

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "overdue") return isTaskOverdue(t);
    if (taskFilter === "high") return (t.priority || "").toLowerCase() === "high";
    return true;
  });

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "open" : "completed";
    try {
      await fetch(`/api/v1/activities/tasks?id=${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      loadWorkData();
    } catch {
      // fallback local update
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)));
    }
  };

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await fetch("/api/v1/activities/tasks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: p.id,
          title: newTaskTitle.trim(),
          stage: newTaskStage,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
          assignee: newTaskAssignee.trim(),
          status: "open",
        }),
      });
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskOpen(false);
      loadWorkData();
    } catch {
      // add optimistic task
      const tempTask = {
        id: "task-" + Date.now(),
        title: newTaskTitle.trim(),
        stage: newTaskStage,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || null,
        assignee: newTaskAssignee.trim(),
        status: "open",
      };
      setTasks((prev) => [tempTask, ...prev]);
      setNewTaskTitle("");
      setNewTaskOpen(false);
    }
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "14px" }}>
        <section style={{ background: "#fff", borderRadius: "11px", padding: "14px", minHeight: "69px" }}>
          <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Current Phase</small>
          <b style={{ display: "block", marginTop: "6px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{currentPhase}</b>
        </section>
        <section style={{ background: "#fff", borderRadius: "11px", padding: "14px", minHeight: "69px" }}>
          <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Overall Progress</small>
          <b style={{ display: "block", marginTop: "6px", fontSize: "18px", fontWeight: 700, color: "#2563eb" }}>{p.progress || 0}%</b>
        </section>
        <section style={{ background: "#fff", borderRadius: "11px", padding: "14px", minHeight: "69px" }}>
          <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Next Stage</small>
          <b style={{ display: "block", marginTop: "6px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{nextPhase}</b>
        </section>
        <section style={{ background: overdueTasks.length > 0 ? "#fef2f2" : "#fff", border: overdueTasks.length > 0 ? "1px solid #fecaca" : "none", borderRadius: "11px", padding: "14px", minHeight: "69px" }}>
          <small style={{ color: overdueTasks.length > 0 ? "#b91c1c" : "#8492a5", fontSize: "10px", display: "block", fontWeight: 600 }}>Overdue Tasks</small>
          <b style={{ display: "block", marginTop: "6px", fontSize: "18px", fontWeight: 700, color: overdueTasks.length > 0 ? "#dc2626" : "#20a85b" }}>
            {overdueTasks.length} {overdueTasks.length === 1 ? "Task" : "Tasks"}
          </b>
        </section>
        <section style={{ background: openTasks.length > 0 ? "#fff" : "#f0fdf4", borderRadius: "11px", padding: "14px", minHeight: "69px" }}>
          <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Open Issues / Tasks</small>
          <b style={{ display: "block", marginTop: "6px", fontSize: "18px", fontWeight: 700, color: openTasks.length > 0 ? "#1e293b" : "#16a34a" }}>
            {openTasks.length} {openTasks.length === 1 ? "Open" : "Open"}
          </b>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {/* Stages Card */}
        <section className="tab-panel" style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "#475569" }}>STAGES</h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>{activeStagesList.length} defined stages</span>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeStagesList.map((stg) => {
              const isDone = stg.status === "COMPLETED";
              const isInProg = stg.status === "IN PROGRESS";
              const isDelayed = stg.status === "DELAYED";
              return (
                <div
                  key={stg.id || stg.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: isInProg ? "#f0f7ff" : "#f8fafc",
                    border: isInProg ? "1px solid #bfdbfe" : "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isDone ? "#dcfce7" : isInProg ? "#dbeafe" : "#e2e8f0",
                        color: isDone ? "#16a34a" : isInProg ? "#2563eb" : "#64748b",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {stg.number}
                    </span>
                    <div>
                      <b style={{ display: "block", fontSize: "12px", color: "#1e293b" }}>{stg.name}</b>
                      <small style={{ fontSize: "10px", color: "#64748b" }}>{stg.dateRange}</small>
                    </div>
                  </div>
                  <span
                    className="tag"
                    style={{
                      background: isDone ? "#dcfce7" : isInProg ? "#dbeafe" : isDelayed ? "#fee2e2" : "#f1f5f9",
                      color: isDone ? "#15803d" : isInProg ? "#1d4ed8" : isDelayed ? "#b91c1c" : "#64748b",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "4px 8px",
                    }}
                  >
                    {stg.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Open Tasks Card */}
        <section className="tab-panel" style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "#475569" }}>OPEN TASKS</h4>
              <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: "12px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 }}>
                {tasks.length}
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "5px", padding: "2px" }}>
                <button
                  type="button"
                  onClick={() => setTaskFilter("all")}
                  style={{
                    border: 0,
                    background: taskFilter === "all" ? "#fff" : "transparent",
                    color: taskFilter === "all" ? "#2563eb" : "#64748b",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter("overdue")}
                  style={{
                    border: 0,
                    background: taskFilter === "overdue" ? "#fff" : "transparent",
                    color: taskFilter === "overdue" ? "#dc2626" : "#64748b",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Overdue
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter("high")}
                  style={{
                    border: 0,
                    background: taskFilter === "high" ? "#fff" : "transparent",
                    color: taskFilter === "high" ? "#d97706" : "#64748b",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  High
                </button>
              </div>
              <button
                type="button"
                className="primary"
                onClick={() => setNewTaskOpen(true)}
                style={{ padding: "5px 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={13} /> Add Task
              </button>
            </div>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => {
                const isOverdue = isTaskOverdue(t);
                const isDone = t.status === "completed";
                const prio = (t.priority || "Medium").toUpperCase();
                const assigneeName = t.assignee || t.assigneeId || "Team";
                const initials = assigneeName.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: isOverdue ? "#fff5f5" : isDone ? "#f8fafc" : "#fff",
                      border: isOverdue ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => toggleTask(t.id, t.status)}
                        style={{
                          border: 0,
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          color: isDone ? "#16a34a" : "#94a3b8",
                        }}
                        title={isDone ? "Mark as Open" : "Mark as Completed"}
                      >
                        {isDone ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </button>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: isDone ? "#94a3b8" : "#1e293b",
                            textDecoration: isDone ? "line-through" : "none",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.title || t.name}
                        </span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "3px" }}>
                          {t.stage && (
                            <span style={{ fontSize: "9px", background: "#f1f5f9", color: "#475569", padding: "1px 5px", borderRadius: "3px" }}>
                              {t.stage}
                            </span>
                          )}
                          {isOverdue ? (
                            <span style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>
                              ⚠️ Overdue by {getDaysOverdue(t)}d
                            </span>
                          ) : t.dueDate ? (
                            <span style={{ fontSize: "10px", color: "#64748b" }}>Due {date(t.dueDate)}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "12px" }}>
                      <span
                        className="tag"
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          background: prio === "HIGH" ? "#fee2e2" : prio === "MEDIUM" ? "#fef3c7" : "#f1f5f9",
                          color: prio === "HIGH" ? "#dc2626" : prio === "MEDIUM" ? "#d97706" : "#64748b",
                        }}
                      >
                        {prio}
                      </span>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#e0e7ff",
                          color: "#3730a3",
                          fontSize: "10px",
                          fontWeight: 700,
                          display: "grid",
                          placeItems: "center",
                        }}
                        title={assigneeName}
                      >
                        {initials}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="blank" style={{ padding: "24px" }}>
                No {taskFilter !== "all" ? taskFilter : ""} tasks for this project.
              </div>
            )}
          </div>
        </section>
      </div>

      {newTaskOpen && (
        <Modal title="Add Workspace Task" close={() => setNewTaskOpen(false)}>
          <form onSubmit={handleCreateTask}>
            <label className="modal-label" style={{ marginTop: 0 }}>
              Task Title *
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Procure sanitary fixtures for master bath"
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
                  <option key={s.name} value={s.name}>
                    {s.number}. {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-label">
              Priority
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dce4ef", borderRadius: "6px", background: "#fff" }}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label className="modal-label">
              Due Date
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
            </label>
            <label className="modal-label">
              Assignee
              <input
                type="text"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                placeholder="Name of owner"
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
    </>
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
}) {
  const size = (x: number) => (x > 1048576 ? `${(x / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.ceil(x / 1024))} KB`);
  return (
    <section className="documents">
      <header>
        <h3>{folder ? `Documents › ${folder.name}` : "Documents"}</h3>
        <div className="doc-actions">
          <button className="primary" onClick={add}>
            <Plus />
            New Folder
          </button>
          <button onClick={upload} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Upload />
            Upload
          </button>
          <button className={!grid ? "active" : ""} onClick={() => setGrid(false)} title="List View">
            <LayoutList />
          </button>
          <button className={grid ? "active" : ""} onClick={() => setGrid(true)} title="Grid View">
            <Grid2X2 />
          </button>
        </div>
      </header>
      {folder && (
        <button className="folder-banner" onClick={back}>
          <img src="/assets/projects/folder-icon.svg" alt="" />
          <span>
            <b>{folder.name}</b>
            <small>
              {folder.itemCount} items | {size(folder.sizeBytes)}
            </small>
          </span>
        </button>
      )}
      {!folder ? (
        <div className={grid ? "folder-grid" : "folder-list"}>
          {folders.map((f) => (
            <button key={f.id} onClick={() => open(f)}>
              <img src="/assets/projects/folder-icon.svg" alt="" />
              <span>
                <b>{f.name}</b>
                <small>
                  {f.itemCount} items | {size(f.sizeBytes)}
                </small>
              </span>
              <small>{date(f.updatedAt)}</small>
              <MoreHorizontal />
            </button>
          ))}
          {!folders.length && <div className="blank">No folders yet. Click New Folder to organise project files.</div>}
        </div>
      ) : (
        <div className="file-list">
          {docs.map((x) => (
            <div key={x.id}>
              <FileText />
              <b>{x.name}</b>
              <small>{x.projectName || "Project document"}</small>
              <span>
                {date(x.updatedAt)} | {size(x.sizeBytes)}
              </span>
              <a href={`/api/v1/documents/${x.id}/download`}>
                <Eye />
              </a>
            </div>
          ))}
          {!docs.length && <div className="blank">No project documents in this folder yet. Click Upload to add files.</div>}
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
}: {
  p: Project;
  b: Boq[];
  rows: Invoice[];
  s: { budget: number; paid: number; due: number };
  load: () => void;
}) {
  const [modal, setModal] = useState(false);
  const [drawerInvoice, setDrawerInvoice] = useState<Invoice | null>(null);
  const [recordModalInvoice, setRecordModalInvoice] = useState<Invoice | null>(null);

  const handleOpenRecord = (inv?: Invoice) => {
    setRecordModalInvoice(inv || null);
    setModal(true);
  };

  return (
    <>
      <Metrics
        data={[
          ["Contract Value", money(s.budget)],
          ["Invoiced", money(rows.reduce((a, x) => a + x.totalAmount, 0))],
          ["Paid", money(s.paid)],
          ["Outstanding", money(s.due)],
        ]}
      />
      <section className="tab-panel">
        <header>
          <h4>Payment Schedule & Invoices</h4>
          <button className="primary" onClick={() => handleOpenRecord()}>
            <Plus />
            Record Payment
          </button>
        </header>
        <Table heads={["STAGE / MILESTONE", "INVOICE #", "TRANSACTION DATE", "DUE DATE", "AMOUNT", "PAID", "STATUS", ""]}>
          {rows.map((x) => (
            <tr key={x.id} onClick={() => setDrawerInvoice(x)}>
              <td><b>{x.milestone || "General Milestone"}</b></td>
              <td>{x.invoiceNumber}</td>
              <td>{date(x.issueDate)}</td>
              <td>{date(x.dueDate)}</td>
              <td>{money(x.totalAmount)}</td>
              <td>{money(x.totalPaid)}</td>
              <td>
                <span
                  className="tag"
                  style={{
                    background: x.status === "paid" ? "#dcfce7" : x.status === "overdue" ? "#fee2e2" : "#fef3c7",
                    color: x.status === "paid" ? "#15803d" : x.status === "overdue" ? "#b91c1c" : "#d97706",
                  }}
                >
                  {words(x.status)}
                </span>
              </td>
              <td>
                <MoreHorizontal />
              </td>
            </tr>
          ))}
        </Table>
        {!rows.length && <div className="blank">No invoices or payment records are linked to this project. Click Record Payment to add a transaction.</div>}
      </section>

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
    </>
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
  const boqRef = boqs[0]?.boqNumber || project.projectCode || "BOQ-001";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        className="payment-panel"
        style={{
          width: "min(440px, 100vw)",
          background: "#fff",
          height: "100vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close drawer" style={{ float: "right", border: 0, background: "#f1f5f9", borderRadius: "50%", padding: "6px", cursor: "pointer" }}>
          <X size={16} />
        </button>
        <small style={{ color: "#64748b", textTransform: "uppercase", fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>
          TRANSACTION RECORD
        </small>
        <h2 style={{ fontSize: "18px", margin: "6px 0 16px", color: "#0f172a" }}>
          {invoice.milestone || invoice.invoiceNumber}
        </h2>

        {/* Big Amount Card */}
        <section style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Payment Amount</span>
            <span
              className="tag"
              style={{
                background: isPaid ? "#dcfce7" : invoice.status === "overdue" ? "#fee2e2" : "#fef3c7",
                color: isPaid ? "#15803d" : invoice.status === "overdue" ? "#b91c1c" : "#d97706",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              {invoice.status.toUpperCase()}
            </span>
          </div>
          <b style={{ display: "block", fontSize: "26px", color: "#0f172a", margin: "10px 0 4px" }}>
            {money(invoice.totalAmount)}
          </b>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            {invoice.outstanding > 0 ? `${money(invoice.outstanding)} outstanding balance` : "Fully paid & reconciled"}
          </span>
        </section>

        {/* Key Details Grid */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", margin: "0 0 10px" }}>Transaction Metadata</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div>
              <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Invoice #</small>
              <b style={{ fontSize: "12px", color: "#1e293b", display: "block", marginTop: "2px" }}>{invoice.invoiceNumber}</b>
            </div>
            <div>
              <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>BOQ Reference</small>
              <b style={{ fontSize: "12px", color: "#1e293b", display: "block", marginTop: "2px" }}>{boqRef}</b>
            </div>
            <div>
              <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Payment Method</small>
              <b style={{ fontSize: "12px", color: "#1e293b", display: "block", marginTop: "2px" }}>{words(invoice.paymentMethod || "bank_transfer")}</b>
            </div>
            <div>
              <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Ref / Cheque ID</small>
              <b style={{ fontSize: "12px", color: "#1e293b", display: "block", marginTop: "2px" }}>{invoice.transactionReference || "—"}</b>
            </div>
            <div>
              <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Issue Date</small>
              <b style={{ fontSize: "12px", color: "#1e293b", display: "block", marginTop: "2px" }}>{date(invoice.issueDate)}</b>
            </div>
            <div>
              <small style={{ color: "#8492a5", fontSize: "10px", display: "block" }}>Due Date</small>
              <b style={{ fontSize: "12px", color: "#1e293b", display: "block", marginTop: "2px" }}>{date(invoice.dueDate)}</b>
            </div>
          </div>
        </div>

        {/* Timeline Stepper */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", margin: "0 0 10px" }}>Payment Timeline</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ color: "#16a34a", marginTop: "2px" }}><CheckCircle2 size={16} /></span>
              <div>
                <b style={{ display: "block", fontSize: "12px", color: "#1e293b" }}>Invoice Created & Sent</b>
                <small style={{ color: "#64748b", fontSize: "10px" }}>{date(invoice.issueDate)}</small>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ color: invoice.totalPaid > 0 ? "#16a34a" : "#f59e0b", marginTop: "2px" }}>
                {invoice.totalPaid > 0 ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </span>
              <div>
                <b style={{ display: "block", fontSize: "12px", color: "#1e293b" }}>
                  {invoice.totalPaid > 0 ? "Payment Initiated" : "Payment Due"}
                </b>
                <small style={{ color: "#64748b", fontSize: "10px" }}>Due {date(invoice.dueDate)}</small>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ color: isPaid ? "#16a34a" : "#cbd5e1", marginTop: "2px" }}>
                <CheckCircle2 size={16} />
              </span>
              <div>
                <b style={{ display: "block", fontSize: "12px", color: isPaid ? "#1e293b" : "#94a3b8" }}>
                  Reconciled & Cleared
                </b>
                <small style={{ color: "#64748b", fontSize: "10px" }}>
                  {isPaid ? (invoice.paidAt ? date(invoice.paidAt) : "Payment cleared") : "Pending full settlement"}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Attachment */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", margin: "0 0 8px" }}>Payment Receipt</h4>
          {invoice.receiptUrl ? (
            <a
              href={invoice.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#2563eb",
                fontWeight: 600,
                fontSize: "12px",
                background: "#eff6ff",
                padding: "8px 12px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              <Paperclip size={14} /> View / Download Receipt
            </a>
          ) : (
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>No receipt document attached to this invoice.</span>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", margin: "0 0 8px" }}>Notes</h4>
          <p style={{ margin: 0, fontSize: "12px", color: "#475569", background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            {invoice.notes || "No additional transaction notes recorded."}
          </p>
        </div>

        {/* Actions Footer */}
        <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
          {invoice.outstanding > 0 && (
            <button
              className="primary"
              onClick={onRecordPayment}
              style={{ flex: 1, padding: "10px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", cursor: "pointer" }}
            >
              Record Payment
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "1px solid #dce4ef",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Close
          </button>
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
    initialInvoice ? String(initialInvoice.outstanding || initialInvoice.totalAmount) : (invoices[0] ? String(invoices[0].outstanding || invoices[0].totalAmount) : "")
  );
  const [method, setMethod] = useState("bank_transfer");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidTime, setPaidTime] = useState("12:00");
  const [reference, setReference] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);
    setError("");
    try {
      const combinedDateTime = paidDate ? `${paidDate}T${paidTime || "00:00"}:00.000Z` : undefined;
      await recordPayment(invoiceId, {
        amount: Number(amount),
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
    <div className="workspace-modal-bg" onMouseDown={close}>
      <section
        className="workspace-modal"
        style={{ width: "min(680px, calc(100vw - 32px))", padding: "20px" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>Record Payment</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
              Record a new payment transaction against a project milestone or invoice.
            </p>
          </div>
          <button onClick={close} aria-label="Close modal">
            <X size={18} />
          </button>
        </header>

        {error && (
          <div style={{ color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "14px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
          {/* Column 1 */}
          <div>
            <label className="modal-label" style={{ marginTop: 0 }}>
              Payment For (Milestone)
              <input
                type="text"
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                placeholder="e.g. Advance Deposit (20%)"
              />
            </label>

            <label className="modal-label">
              Linked Invoice *
              <select
                value={invoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dce4ef", borderRadius: "6px", background: "#fff" }}
              >
                <option value="">Select Invoice</option>
                {invoices.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.invoiceNumber} — {money(x.outstanding)} due ({words(x.status)})
                  </option>
                ))}
              </select>
            </label>

            <label className="modal-label">
              Amount Received (₹) *
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                required
              />
            </label>

            <label className="modal-label">
              Payment Method *
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: "100%", marginTop: "6px", padding: "10px", border: "1px solid #dce4ef", borderRadius: "6px", background: "#fff" }}
              >
                <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                <option value="upi">UPI / QR Code</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="card">Credit / Debit Card</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          {/* Column 2 */}
          <div>
            <label className="modal-label" style={{ marginTop: 0 }}>
              Reference / Cheque / UTR ID
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UTR-98234823"
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
              <label className="modal-label" style={{ marginTop: 0 }}>
                Payment Date *
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  required
                />
              </label>

              <label className="modal-label" style={{ marginTop: 0 }}>
                Payment Time
                <input
                  type="time"
                  value={paidTime}
                  onChange={(e) => setPaidTime(e.target.value)}
                />
              </label>
            </div>

            <div className="modal-label" style={{ marginTop: "15px" }}>
              Receipt / Proof of Payment
              <div
                style={{
                  marginTop: "6px",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "6px",
                  padding: "12px",
                  background: "#f8fafc",
                  textAlign: "center",
                }}
              >
                {receiptUrl ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>📄 {receiptFileName || "Receipt Attached"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptUrl("");
                        setReceiptFileName("");
                      }}
                      style={{ border: 0, background: "transparent", color: "#dc2626", cursor: "pointer" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label style={{ cursor: "pointer", display: "block" }}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptUpload}
                      style={{ display: "none" }}
                    />
                    <span style={{ color: "#2563eb", fontSize: "11px", fontWeight: 600 }}>
                      {uploadingReceipt ? "Uploading…" : "Browse or Drop Receipt"}
                    </span>
                    <small style={{ display: "block", color: "#94a3b8", fontSize: "10px", marginTop: "2px" }}>
                      PNG, JPG, or PDF up to 10MB
                    </small>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Full-width Notes */}
          <div style={{ gridColumn: "span 2" }}>
            <label className="modal-label" style={{ marginTop: "10px" }}>
              Notes / Remarks
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Payment verified via HDFC account statement"
                rows={2}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  marginTop: "6px",
                  padding: "8px 10px",
                  border: "1px solid #dbe4ef",
                  borderRadius: "6px",
                  font: "inherit",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </label>
          </div>
        </div>

        <footer style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
          <button onClick={close} disabled={loading}>
            Cancel
          </button>
          <button className="primary" onClick={submit} disabled={loading || uploadingReceipt}>
            {loading ? "Recording…" : "Record Payment"}
          </button>
        </footer>
      </section>
    </div>
  );
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
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h4 style={{ margin: 0 }}>Project Activity Log ({acts.length})</h4>
        <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "3px", borderRadius: "6px" }}>
          {["all", "boq", "invoice", "task", "approval"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              style={{
                border: 0,
                background: filter === cat ? "#fff" : "transparent",
                color: filter === cat ? "#2563eb" : "#64748b",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {cat === "all" ? "All Activity" : cat}
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredActs.map((x, i) => {
          const cat = (x.category || x.type || "ACTIVITY").toUpperCase();
          const catColor = cat === "BOQ" ? "#2563eb" : cat === "INVOICE" ? "#16a34a" : cat === "TASK" ? "#8b5cf6" : cat === "APPROVAL" ? "#d97706" : "#64748b";
          const catBg = cat === "BOQ" ? "#eff6ff" : cat === "INVOICE" ? "#f0fdf4" : cat === "TASK" ? "#f5f3ff" : cat === "APPROVAL" ? "#fffbeb" : "#f8fafc";
          return (
            <div
              key={x.id || i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  background: catBg,
                  color: catColor,
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "9px",
                  fontWeight: 700,
                  marginTop: "2px",
                }}
              >
                {cat}
              </span>
              <div style={{ flex: 1 }}>
                <b style={{ display: "block", fontSize: "12px", color: "#1e293b" }}>{x.title || x.action || x.name || "Project Update"}</b>
                {x.description && (
                  <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b" }}>{x.description}</p>
                )}
                <small style={{ display: "block", marginTop: "4px", fontSize: "10px", color: "#94a3b8" }}>
                  {date(x.createdAt || x.timestamp)} · By {x.actor || x.userName || x.userId || "System"}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      {!filteredActs.length && <div className="blank">No activity recorded for this filter.</div>}
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
   Client Invite Modal
   ========================================================================= */
function ClientInviteModal({
  project,
  invitation,
  onClose,
  onReload,
  showToast,
  openEditProject,
}: {
  project: Project;
  invitation: ClientInvitation | null;
  onClose: () => void;
  onReload: () => void;
  showToast: (msg: string) => void;
  openEditProject: () => void;
}) {
  const [email, setEmail] = useState(project.clientEmail || "");
  const [clientName, setClientName] = useState(project.clientName || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentInv, setCurrentInv] = useState<ClientInvitation | null>(invitation);

  const isPending = currentInv && currentInv.status === "pending";

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

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/client-invite/resend`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || "Unable to resend invitation. Please try again.");
      }
      showToast(payload.data?.message || "Client invitation resent successfully.");
      if (payload.data?.invitation) {
        setCurrentInv(payload.data.invitation);
      }
      onReload();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={isPending ? "Client Invitation Pending" : "Send Invite to Client"} close={onClose}>
      {isPending ? (
        <div>
          <div style={{ marginTop: "10px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", marginBottom: "8px" }}>
              <Clock size={16} />
              <strong style={{ fontSize: "13px", color: "#1e293b" }}>An invitation has already been sent</strong>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#475569" }}>
              An invitation has already been sent to: <strong>{currentInv.email}</strong>
            </p>
            <div style={{ fontSize: "11px", color: "#64748b", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <div>Client: <strong>{currentInv.clientName || project.clientName}</strong></div>
              <div>Status: <span className="tag" style={{ background: "#fef3c7", color: "#b45309" }}>Pending</span></div>
              <div>Sent on: <strong>{date(currentInv.createdAt)}</strong></div>
              <div>Expires: <strong>{date(currentInv.expiresAt)}</strong></div>
            </div>
          </div>

          {error && <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "10px" }}>{error}</div>}

          <footer>
            <button onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="primary" onClick={handleResend} disabled={loading}>
              {loading ? "Resending..." : "Resend Invitation"}
            </button>
          </footer>
        </div>
      ) : (
        <form onSubmit={handleSend}>
          <p style={{ margin: "6px 0 14px", fontSize: "12px", color: "#64748b" }}>
            Invite the client associated with this project to access their project workspace.
          </p>

          {!project.clientEmail && !email && (
            <div
              style={{
                padding: "10px 12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                color: "#b91c1c",
                fontSize: "12px",
                marginBottom: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                <AlertCircle size={15} />
                No client email is available for this project.
              </div>
              <span>Please add the client's email below before sending an invitation.</span>
            </div>
          )}

          {error && (
            <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label className="modal-label" style={{ marginTop: 0 }}>
              Client Name
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client Name"
              />
            </label>

            <label className="modal-label" style={{ marginTop: 0 }}>
              Email *
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@email.com"
                required
                autoFocus={!project.clientEmail}
              />
            </label>

            <label className="modal-label" style={{ marginTop: 0 }}>
              Project
              <input type="text" value={project.name} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
            </label>

            <label className="modal-label" style={{ marginTop: 0 }}>
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Optional message for the client..."
                rows={3}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  marginTop: "6px",
                  padding: "10px",
                  border: "1px solid #dbe4ef",
                  borderRadius: "6px",
                  outline: "none",
                  font: "inherit",
                  fontSize: "12px",
                }}
              />
            </label>
          </div>

          <footer>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading || !email.trim()}>
              {loading ? "Sending Invite..." : "Send Invite"}
            </button>
          </footer>
        </form>
      )}
    </Modal>
  );
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
