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
  Edit2,
  Copy,
  Download,
  PauseCircle,
  PlayCircle,
  Archive,
  Trash2,
  RefreshCw,
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
    if (!f || !folder || !p) return;
    const d = new FormData();
    d.append("file", f);
    d.append("folderId", folder.id);
    d.append("projectId", p.id);
    d.append("projectName", p.name);
    const r = await fetch("/api/v1/documents/upload", { method: "POST", credentials: "include", body: d });
    if (!r.ok) return setError("File could not be uploaded.");
    setUpload(false);
    void open(folder);
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

          {tab === "Overview" && <Overview p={p} b={boqs} s={stats} />}
          {tab === "Project Details" && <Details p={p} onEdit={() => setEditOpen(true)} />}
          {tab === "BOQs" && <Boqs p={p} b={boqs} />}
          {tab === "Costing" && <Costing />}
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
          {tab === "Payments" && <Payments rows={invoices} s={stats} load={load} />}
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
}: {
  p: Project;
  b: Boq[];
  s: { budget: number; boq: number; paid: number; due: number };
}) {
  const latestBoq = b[0];
  const boqStatusLabel = latestBoq
    ? latestBoq.status.toUpperCase() === "APPROVED"
      ? "BOQ Approved"
      : "BOQ Approval Pending"
    : "Create your first BOQ";
  const boqDesc = latestBoq
    ? `Review the latest BOQ revision (${latestBoq.boqNumber}) and follow up with the client.`
    : "Set up an itemised bill of quantities for this project.";

  return (
    <>
      <div className="overview-top">
        <aside>
          <h4>Project Health</h4>
          <Health
            label="Budget"
            value={s.budget ? "Within Budget" : "Budget not set"}
            note={s.budget ? `${money(s.budget)} approved budget` : "Add a budget to track costs."}
          />
          <Health
            label="BOQ"
            value={b.length ? `${b.length} BOQ(s)` : "No BOQ yet"}
            note={b.length ? "Project BOQs are ready for review." : "Create a BOQ to begin estimating."}
          />
          <Health
            label="Timeline"
            value={p.targetCompletionDate ? "On Schedule" : "No deadline"}
            note={p.targetCompletionDate ? `Target completion ${date(p.targetCompletionDate)}` : "Set dates in project details."}
          />
        </aside>
        <div className="next-actions">
          <h4>Next Actions for this Project</h4>
          <div className="action-card">
            <div>
              <small>{b.length ? "BOQ" : "PROJECT"}</small>
              <h3>{boqStatusLabel}</h3>
              <p>{boqDesc}</p>
              <span>Module: BOQ · Owner: Project team</span>
            </div>
            <button
              onClick={() => {
                if (b.length > 0) {
                  location.assign(`/boqs?id=${b[0].id}&projectId=${p.id}`);
                } else {
                  location.assign(`/boqs?projectId=${p.id}&create=true`);
                }
              }}
            >
              {b.length ? "Open BOQ" : "Create BOQ"}
            </button>
          </div>
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
            ["Current Phase", b.length ? "BOQ Preparation" : "Project Setup"],
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
      </div>
    </>
  );
}

function Health({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="health">
      <small>● &nbsp;{label}</small>
      <b>{value}</b>
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
            ["Area", p.areaSqft ? `${p.areaSqft} sqft` : "—"],
            ["Description", p.description || "—"],
          ]}
        />
        <Card
          title="Location"
          rows={[
            ["Property Name", p.name],
            ["Address", p.location || "—"],
            ["Site Access Notes", "No site access notes added"],
          ]}
        />
        <Card
          title="Client"
          rows={[
            ["Client Name", p.clientName],
            ["Phone", p.clientContact || "—"],
            ["Email", p.clientEmail || "—"],
          ]}
        />
        <Card
          title="Timeline"
          rows={[
            ["Planned Start Date", date(p.startDate)],
            ["Target Completion", date(p.targetCompletionDate)],
            ["Current Phase", p.progress ? "In progress" : "Project setup"],
          ]}
        />
        <Card
          title="Commercial Information"
          rows={[
            ["Project Value", money(p.projectValue)],
            ["Approved Budget", money(p.approvedBudget)],
            ["Currency", "INR (₹)"],
          ]}
        />
        <Card
          title="Ownership & Team"
          rows={[
            ["Project Manager", "Unassigned"],
            ["Lead Designer", "Unassigned"],
            ["Estimator", "Unassigned"],
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

function Costing() {
  const [data, setData] = useState<{ totalBudget: number; actualCost: number; committed: number; forecast: number; variance: number } | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    getCostingAnalysis()
      .then((x) => setData(x.summary))
      .catch(() => setErr(true));
  }, []);
  if (err) return <div className="blank">Costing data is not available.</div>;
  if (!data) return <div className="blank">Loading costing data…</div>;
  return (
    <>
      <Metrics
        data={[
          ["Approved Budget", money(data.totalBudget)],
          ["Actual Cost", money(data.actualCost)],
          ["Committed Cost", money(data.committed)],
          ["Available Budget", money(data.totalBudget - data.actualCost - data.committed)],
        ]}
      />
      <section className="tab-panel">
        <header>
          <h4>Category-wise Cost</h4>
          <button>Export Report</button>
        </header>
        <div className="blank">Cost categories are populated from BOQ and costing items as they are added.</div>
      </section>
    </>
  );
}

function Work({ p, b }: { p: Project; b: Boq[] }) {
  const [stages, setStages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/v1/activities/stages`)
      .then((r) => r.json())
      .then((d) => setStages(d.data?.items || []))
      .catch(() => {});
    fetch(`/api/v1/activities/tasks?pageSize=100&projectId=${p.id}&status=open`)
      .then((r) => r.json())
      .then((d) => setTasks(d.data?.items || []))
      .catch(() => {});
  }, [p.id]);
  const currentPhase = stages.length > 0 ? stages[0].name : "Project Setup";
  const nextPhase = stages.length > 1 ? stages[1].name : "—";
  return (
    <>
      <Metrics
        data={[
          ["Current Phase", currentPhase],
          ["Overall Progress", `${p.progress || 0}%`],
          ["Next Milestone", nextPhase],
          ["Open Issues", String(tasks.length)],
        ]}
      />
      <div className="work-grid">
        <section className="tab-panel">
          <h4>Milestones</h4>
          {stages.length ? (
            stages.map((x, i) => (
              <div className="milestone" key={x.id || x.name}>
                <span className={i === 0 ? "done" : ""}>●</span>
                <b>{x.name}</b>
                <small>{i === 0 ? "DONE" : "UPCOMING"}</small>
              </div>
            ))
          ) : (
            <div className="blank">No milestones configured for this project.</div>
          )}
        </section>
        <section className="tab-panel">
          <h4>Open Tasks</h4>
          {tasks.length ? (
            tasks.map((t) => <div key={t.id}>{t.title || t.name}</div>)
          ) : (
            <div className="blank">No open tasks have been created for this project.</div>
          )}
        </section>
      </div>
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
          <button className={!grid ? "active" : ""} onClick={() => setGrid(false)}>
            <LayoutList />
          </button>
          <button className={grid ? "active" : ""} onClick={() => setGrid(true)}>
            <Grid2X2 />
          </button>
          {folder && <button onClick={upload}>Upload</button>}
          <button className="primary" onClick={add}>
            <Plus />
            New Folder
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
          {!docs.length && <div className="blank">No project documents in this folder yet.</div>}
        </div>
      )}
    </section>
  );
}

function Payments({ rows, s, load }: { rows: Invoice[]; s: { budget: number; paid: number; due: number }; load: () => void }) {
  const [modal, setModal] = useState(false);
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
          <h4>Payment Schedule</h4>
          <button className="primary" onClick={() => setModal(true)}>
            <Plus />
            Record Payment
          </button>
        </header>
        <Table heads={["STAGE", "TRANSACTION DATE", "DUE DATE", "AMOUNT", "PAID", "STATUS", ""]}>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.milestone || x.invoiceNumber}</td>
              <td>{date(x.issueDate)}</td>
              <td>{date(x.dueDate)}</td>
              <td>{money(x.totalAmount)}</td>
              <td>{money(x.totalPaid)}</td>
              <td>
                <span className="tag">{words(x.status)}</span>
              </td>
              <td>
                <MoreHorizontal />
              </td>
            </tr>
          ))}
        </Table>
        {!rows.length && <div className="blank">No invoices or payment records are linked to this project.</div>}
      </section>
      {modal && <RecordPaymentModal invoices={rows} close={() => setModal(false)} load={load} />}
    </>
  );
}

function RecordPaymentModal({ invoices, close, load }: { invoices: Invoice[]; close: () => void; load: () => void }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [paidAt, setPaidAt] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!invoiceId || !amount) return setError("Invoice and amount are required.");
    setLoading(true);
    setError("");
    try {
      await recordPayment(invoiceId, {
        amount: Number(amount),
        method,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
        reference,
        notes,
      });
      load();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record payment");
      setLoading(false);
    }
  };

  return (
    <Modal title="Record Payment" close={close}>
      {error && <div className="error" style={{ color: "#dc2626", fontSize: "12px", marginBottom: "8px" }}>{error}</div>}
      <div className="modal-form">
        <label className="modal-label">
          Invoice *
          <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">Select Invoice</option>
            {invoices.map((x) => (
              <option key={x.id} value={x.id}>
                {x.invoiceNumber} ({money(x.outstanding)} due)
              </option>
            ))}
          </select>
        </label>
        <label className="modal-label">
          Amount *
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="modal-label">
          Payment Method *
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="modal-label">
          Payment Date
          <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </label>
        <label className="modal-label">
          Reference
          <input value={reference} onChange={(e) => setReference(e.target.value)} />
        </label>
        <label className="modal-label">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <footer>
        <button onClick={close} disabled={loading}>
          Cancel
        </button>
        <button className="primary" onClick={submit} disabled={loading}>
          {loading ? "Saving…" : "Record Payment"}
        </button>
      </footer>
    </Modal>
  );
}

function Activity({ pId }: { pId: string }) {
  const [acts, setActs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/activities/tasks?pageSize=20&projectId=${pId}`).then((r) => r.json()),
      fetch(`/api/v1/activities/approvals?pageSize=20&projectId=${pId}`).then((r) => r.json()),
    ])
      .then(([t, a]) => {
        const items = [...(t.data?.items || []), ...(a.data?.items || [])].sort(
          (x, y) => new Date(y.updatedAt || y.createdAt).getTime() - new Date(x.updatedAt || x.createdAt).getTime()
        );
        setActs(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pId]);

  if (loading) return <div className="blank">Loading activity…</div>;

  return (
    <section className="tab-panel activity">
      <h4>Activity Log</h4>
      {acts.map((x, i) => (
        <div key={x.id || i}>
          <i /> <b>{x.title || x.name || "Task"}</b> {x.status ? `is ${x.status}` : "updated"}{" "}
          <small>
            {date(x.updatedAt || x.createdAt)} · {x.assigneeId || x.type || "Activity"}
          </small>
        </div>
      ))}
      {!acts.length && <div className="blank">No activity recorded for this project.</div>}
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

  return (
    <Modal title="Edit Project Details" close={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        <div style={{ maxHeight: "420px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", paddingRight: "4px" }}>
          <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
            Project Name *
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>

          <label className="modal-label" style={{ marginTop: 0 }}>
            Client Name *
            <input type="text" value={form.clientName} onChange={(e) => update("clientName", e.target.value)} required />
          </label>

          <label className="modal-label" style={{ marginTop: 0 }}>
            Client Contact Phone
            <input type="text" value={form.clientContact} onChange={(e) => update("clientContact", e.target.value)} placeholder="e.g. +91 98765 43210" />
          </label>

          <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
            Client Email
            <input type="email" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} placeholder="client@email.com" />
          </label>

          <label className="modal-label" style={{ marginTop: 0 }}>
            Project Type *
            <select
              value={form.projectType}
              onChange={(e) => update("projectType", e.target.value)}
              style={{
                boxSizing: "border-box",
                width: "100%",
                marginTop: "6px",
                padding: "10px",
                border: "1px solid #dbe4ef",
                borderRadius: "6px",
                outline: "none",
                background: "#fff",
              }}
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
              style={{
                boxSizing: "border-box",
                width: "100%",
                marginTop: "6px",
                padding: "10px",
                border: "1px solid #dbe4ef",
                borderRadius: "6px",
                outline: "none",
                background: "#fff",
              }}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
            Location
            <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. Mumbai" />
          </label>

          <label className="modal-label" style={{ marginTop: 0 }}>
            Area (sqft)
            <input type="number" value={form.areaSqft} onChange={(e) => update("areaSqft", e.target.value)} placeholder="e.g. 6000" />
          </label>

          <label className="modal-label" style={{ marginTop: 0 }}>
            Approved Budget (₹)
            <input type="number" value={form.approvedBudget} onChange={(e) => update("approvedBudget", e.target.value)} placeholder="e.g. 5000000" />
          </label>

          <label className="modal-label" style={{ marginTop: 0 }}>
            Start Date
            <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
          </label>

          <label className="modal-label" style={{ marginTop: 0 }}>
            Target Completion
            <input type="date" value={form.targetCompletionDate} onChange={(e) => update("targetCompletionDate", e.target.value)} />
          </label>

          <label className="modal-label" style={{ gridColumn: "span 2", marginTop: 0 }}>
            Description
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
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
          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </footer>
      </form>
    </Modal>
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
