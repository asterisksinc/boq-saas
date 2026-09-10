"use client";

import { Check, ChevronDown, MoreHorizontal, Plus, X, ArrowLeft, Home, User, MapPin, Calendar, Briefcase, Search, Minus, Info, RefreshCcw } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Project = { id: string; projectCode?: string | null; name: string; clientName: string; clientContact?: string | null; projectType: string; status: string; location?: string | null; description?: string | null; areaSqft?: number | null; projectValue?: number | null; approvedBudget?: number | null; startDate?: string | null; targetCompletionDate?: string | null; progress?: number | null; imageUrl?: string | null };
type Form = { name: string; clientName: string; clientContact: string; projectType: string; status: string; location: string; description: string; areaSqft: string; projectValue: string; startDate: string; targetCompletionDate: string };
const blank: Form = { name: "", clientName: "", clientContact: "", projectType: "", status: "planning", location: "", description: "", areaSqft: "", projectValue: "", startDate: "", targetCompletionDate: "" };
import DashboardRail from "@/components/DashboardRail";
const message = (x: unknown, fallback: string) => (x as { error?: { message?: string }; message?: string })?.error?.message || (x as { message?: string })?.message || fallback;
const money = (n?: number | null) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const date = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${x}T00:00:00`)) : "—";
const label = (x: string) => x.replace(/_/g, " ");

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]), [loading, setLoading] = useState(true), [query, setQuery] = useState(""), [view, setView] = useState<"list" | "grid">("list"), [filter, setFilter] = useState("all"), [filterOpen, setFilterOpen] = useState(false), [menu, setMenu] = useState<string | null>(null), [create, setCreate] = useState(false), [createScreen, setCreateScreen] = useState<string>("choice"), [remove, setRemove] = useState<Project | null>(null), [notice, setNotice] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const load = async () => { setLoading(true); try { const p = new URLSearchParams({ pageSize: "100" }); if (query) p.set("search", query); if (filter !== "all") p.set("status", filter); const r = await fetch(`/api/v1/projects?${p}`, { credentials: "include" }); const b = await r.json(); if (!r.ok) throw new Error(message(b, "Projects could not be loaded.")); setProjects(b.data?.items || []); } catch (e) { setNotice(e instanceof Error ? e.message : "Projects could not be loaded."); } finally { setLoading(false); } };
  useEffect(() => { const id = setTimeout(load, query ? 250 : 0); return () => clearTimeout(id); }, [query, filter]);
  useEffect(() => { const close = () => { setMenu(null); setFilterOpen(false); }; document.addEventListener("click", close); return () => document.removeEventListener("click", close); }, []);
  const total = useMemo(() => projects.reduce((s, p) => s + (p.approvedBudget ?? p.projectValue ?? 0), 0), [projects]);
  const status = async (project: Project, next: string) => { const r = await fetch(`/api/v1/projects/${project.id}/status`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }); if (!r.ok) setNotice(message(await r.json(), "Project status could not be changed.")); else { setMenu(null); load(); } };
  const duplicate = async (project: Project) => { const r = await fetch(`/api/v1/projects/${project.id}/duplicate`, { method: "POST", credentials: "include" }); if (!r.ok) setNotice(message(await r.json(), "Project could not be duplicated.")); else { setMenu(null); setNotice("Project duplicated."); load(); } };
  const del = async () => { if (!remove) return; const r = await fetch(`/api/v1/projects/${remove.id}`, { method: "DELETE", credentials: "include" }); if (!r.ok) setNotice(message(await r.json(), "Project could not be deleted.")); else { setRemove(null); setNotice("Project deleted."); load(); } };
  const exportFile = async () => { const r = await fetch("/api/v1/projects/export", { credentials: "include" }); if (!r.ok) return setNotice("Export is unavailable right now."); const b = await r.blob(), u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = "projects.xlsx"; a.click(); URL.revokeObjectURL(u); };
  const exportSingleProject = async (project: Project) => { const r = await fetch("/api/v1/projects/export", { credentials: "include" }); if (!r.ok) return setNotice("Export is unavailable right now."); const b = await r.blob(), u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = `${project.name || "project"}.xlsx`; a.click(); URL.revokeObjectURL(u); };
  const importFile = async (e: ChangeEvent<HTMLInputElement>) => { const selected = e.target.files?.[0]; if (!selected) return; const data = new FormData(); data.append("file", selected); const r = await fetch("/api/v1/projects/imports?skipInvalid=true", { method: "POST", credentials: "include", body: data }); e.target.value = ""; const b = await r.json(); if (!r.ok) setNotice(message(b, "Spreadsheet could not be imported.")); else { setNotice(`${b.data?.projects?.length || 0} project(s) imported.`); load(); } };

  return <main className="fig-dashboard boq-dashboard project-ui">
    <div className="fig-dashboard-glow" />
    <DashboardRail />
    <div className="fig-dashboard-main">
      {/* Fix 1: Notification bell SVG + Fix 4: Search bar matching dashboard */}
      <header className="fig-dashboard-header">
        <h1>Projects</h1>
        <div className="fig-dashboard-header-actions">
          <label className="fig-dashboard-search"><img src="/assets/dashboard/dashboard-search.svg" alt="" /><input placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} /></label>
          <button className="fig-dashboard-new" onClick={() => { setCreateScreen("choice"); setCreate(true); }}><Plus size={19} /><span>New</span><i /><ChevronDown size={18} /></button>
          <button className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
          <div className="fig-dashboard-avatar">PR</div>
        </div>
      </header>
      {(!create || createScreen === "choice") && (
      <section className="boq-page-shell projects-content">
        <div className="projects-title">
          <div>
            <h2>All Projects</h2>
            <p>{projects.length} projects | {total >= 10000000 ? `₹${(total / 10000000).toFixed(2)}Cr` : money(total)} total estimated value</p>
          </div>
          <div className="projects-actions">
            <button onClick={() => file.current?.click()}>Import Excel</button>
            <input ref={file} type="file" accept=".xlsx,.xls,.csv" onChange={importFile} style={{ display: 'none' }} />
            <button onClick={exportFile}>Export Excel</button>
            <button className="primary" onClick={() => setCreate(true)}><Plus size={16} />New Project</button>
          </div>
        </div>
        <div className="projects-toolbar">
          <label className="projects-search"><img src="/assets/dashboard/dashboard-search.svg" alt="" style={{ width: 15, height: 15 }} /><input placeholder="Search projects or clients…" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <div className="filter-wrap">
            <button onClick={e => { e.stopPropagation(); setFilterOpen(!filterOpen); }}><img src="/assets/projects/filter-icon.svg" alt="" style={{ width: 16, height: 16 }} />Filter</button>
            {filterOpen && <div className="filter-menu" onClick={e => e.stopPropagation()}><b>Project status</b>{["all", "active", "planning", "in_progress", "on_hold", "completed"].map(x => <button key={x} onClick={() => { setFilter(x); setFilterOpen(false); }}><span>{filter === x && <Check />}</span>{x === "all" ? "All statuses" : label(x)}</button>)}</div>}
          </div>
          <div className="view-switch">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><img src="/assets/projects/view-list.svg" alt="List view" style={{ width: 20, height: 20 }} /></button>
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><img src="/assets/projects/view-grid.svg" alt="Grid view" style={{ width: 20, height: 20 }} /></button>
          </div>
        </div>
        {loading ? <div className="projects-empty">Loading projects…</div> : !projects.length ? <Empty onCreate={() => setCreate(true)} /> : view === "grid" ? <Grid projects={projects} /> : <Table projects={projects} menu={menu} setMenu={setMenu} status={status} duplicate={duplicate} remove={setRemove} exportProject={exportSingleProject} />}
      </section>
      )}
      {create && <Create screen={createScreen} setScreen={setCreateScreen} onClose={() => setCreate(false)} onCreated={x => { setCreate(false); setNotice(x); load(); }} />}
    </div>
    {remove && <Modal title="Delete Project?" subtitle="This action cannot be undone." onClose={() => setRemove(null)}><div className="delete-copy"><img src="/assets/projects/menu-delete.svg" alt="" style={{ width: 20, height: 20 }} /><p>Delete <b>{remove.name}</b>? Dependent records may prevent deletion.</p></div><footer><button onClick={() => setRemove(null)}>Cancel</button><button className="danger-button" onClick={del}>Delete Project</button></footer></Modal>}
    {notice && <div className="projects-toast">{notice}<button onClick={() => setNotice(null)}><X /></button></div>}
  </main>;
}

function Empty({ onCreate }: { onCreate: () => void }) { return <div className="projects-empty"><img src="/assets/projects/menu-open.svg" alt="" style={{ width: 40, height: 40, opacity: 0.5 }} /><h3>No projects yet</h3><p>Create your first project to start building BOQs.</p><button className="primary" onClick={onCreate}><Plus size={16} />New Project</button></div>; }

{/* Fix 6: Three dots menu with all actions using SVG icons */}
function Table({ projects, menu, setMenu, status, duplicate, remove, exportProject }: { projects: Project[]; menu: string | null; setMenu: (x: string | null) => void; status: (p: Project, x: string) => void; duplicate: (p: Project) => void; remove: (p: Project) => void; exportProject: (p: Project) => void }) {
  return <div className="projects-table-wrap"><table className="projects-table"><thead><tr><th>ID</th><th>PROJECT</th><th>TYPE</th><th>STATUS</th><th>DESIGNER</th><th>BOQS</th><th>MARGIN</th><th>PROGRESS</th><th>DUE DATE</th><th /></tr></thead><tbody>{projects.map((p, i) => <tr key={p.id} onClick={() => location.assign(`/projects/${p.id}`)}><td>{p.projectCode || `PRJ-${String(i + 1).padStart(4, "0")}`}</td><td><b>{p.name}</b><small>{p.clientName}{p.areaSqft ? ` · ${p.areaSqft.toLocaleString("en-IN")} sqft` : ""}</small></td><td>{p.projectType}</td><td><span className={`project-status ${p.status}`}>{label(p.status)}</span></td><td><span className="designer-dot">{p.clientName.slice(0, 2).toUpperCase()}</span><span className="designer-name">Unassigned</span></td><td>—</td><td>—</td><td><div className="progress"><i style={{ width: `${p.progress || 0}%` }} /><span>{p.progress || 0}%</span></div></td><td>{date(p.targetCompletionDate)}</td><td className="menu-cell"><button className="more-button" onClick={e => { e.stopPropagation(); setMenu(menu === p.id ? null : p.id); }}><MoreHorizontal /></button>{menu === p.id && <Menu project={p} status={status} duplicate={duplicate} remove={remove} exportProject={exportProject} />}</td></tr>)}</tbody></table></div>;
}

function Grid({ projects }: { projects: Project[] }) {
  return <div className="project-grid">{projects.map((p, i) =>
    <div key={p.id} className="project-card" onClick={() => location.assign(`/projects/${p.id}`)}>
      <div className="project-card-header">
        <div>
          <h3>{p.name}{p.location ? ` — ${p.location}` : ""}</h3>
          <p className="card-code">{p.projectCode || `PRJ-${String(i + 1).padStart(4, "0")}`}</p>
        </div>
        <div className="project-card-header-right">
          <span className={`project-status ${p.status}`}>{label(p.status)}</span>
          <button className="more-button" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></button>
        </div>
      </div>
      <div className="project-card-details">
        <div><span className="project-card-detail-label">Client Name</span><span className="project-card-detail-value">{p.clientName}</span></div>
        <div><span className="project-card-detail-label">Square Foot</span><span className="project-card-detail-value">{p.areaSqft ? `${p.areaSqft.toLocaleString("en-IN")} sqft` : "—"}</span></div>
        <div><span className="project-card-detail-label">Type</span><span className="project-card-detail-value">{p.projectType}</span></div>
        <div><span className="project-card-detail-label">Designer</span><span className="project-card-detail-value">{p.clientName.split(" ")[0] || "Unassigned"}</span></div>
        <div><span className="project-card-detail-label">BOQs</span><span className="project-card-detail-value">{money(p.approvedBudget ?? p.projectValue)}</span></div>
        <div><span className="project-card-detail-label">Margin</span><span className="project-card-detail-value">{"—"}</span></div>
      </div>
      <div className="project-card-footer">
        <div className="project-card-footer-left">
          <span className="project-card-detail-label">Due Date</span>
          <span className="project-card-detail-value">{date(p.targetCompletionDate)}</span>
        </div>
        <div className="project-card-footer-right">
          <span className="project-card-detail-label">Progress</span>
          <div className="card-progress">
            <div className="card-progress-bar"><i style={{ width: `${p.progress || 0}%` }} /></div>
            <span className="card-progress-pct">{p.progress || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  )}</div>;
}

function Menu({ project, status, duplicate, remove, exportProject }: { project: Project; status: (p: Project, x: string) => void; duplicate: (p: Project) => void; remove: (p: Project) => void; exportProject: (p: Project) => void }) {
  const go = (path: string) => (e: React.MouseEvent) => { e.stopPropagation(); location.assign(path); };
  const act = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  return <div className="project-menu" onClick={e => e.stopPropagation()}>
    <button onClick={go(`/projects/${project.id}`)}><img src="/assets/projects/menu-open.svg" alt="" />Open Project</button>
    <button onClick={go(`/projects/${project.id}`)}><img src="/assets/projects/menu-edit.svg" alt="" />Edit Details</button>
    <button onClick={go(`/boqs?projectId=${project.id}`)}><img src="/assets/projects/menu-create-boq.svg" alt="" />Create BOQ</button>
    <button onClick={act(() => duplicate(project))}><img src="/assets/projects/menu-duplicate.svg" alt="" />Duplicate Project</button>
    <button onClick={act(() => exportProject(project))}><img src="/assets/projects/menu-export.svg" alt="" />Export</button>
    <button onClick={act(() => status(project, "on_hold"))}><img src="/assets/projects/menu-hold.svg" alt="" />Put On Hold</button>
    <button onClick={act(() => status(project, "completed"))}><img src="/assets/projects/menu-complete.svg" alt="" />Mark Completed</button>
    <button onClick={act(() => status(project, "active"))}><img src="/assets/projects/menu-archive.svg" alt="" />Archive Project</button>
    <button className="danger" onClick={act(() => remove(project))}><img src="/assets/projects/menu-delete.svg" alt="" />Delete Project</button>
  </div>;
}

function Create({ screen, setScreen, onClose, onCreated }: { screen: string; setScreen: (s: string) => void; onClose: () => void; onCreated: (x: string) => void }) {
  const [method, setMethod] = useState("scratch"), [form, setForm] = useState<Form>(blank), [project, setProject] = useState<Project | null>(null), [rooms, setRooms] = useState([{ name: "Master Bedroom", roomType: "Master Bedroom" }]), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [addingRequirement, setAddingRequirement] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const [materialSelected, setMaterialSelected] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const change = (key: keyof Form, value: string) => setForm(f => ({ ...f, [key]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const body = { ...form, clientContact: form.clientContact || null, description: form.description || null, location: form.location || undefined, areaSqft: form.areaSqft ? Number(form.areaSqft) : null, projectValue: form.projectValue ? Number(form.projectValue) : null, startDate: form.startDate || null, targetCompletionDate: form.targetCompletionDate || null };
    try {
      const r = await fetch("/api/v1/projects", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Project could not be created."));
      const newProject = b.data;
      setProject(newProject);
      
      if (coverFile) {
        try {
          const fr = await fetch("/api/v1/document-folders", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Project Assets", parentId: null }) });
          const fb = await fr.json();
          if (fr.ok && fb.data?.id) {
            const d = new FormData();
            d.append("file", coverFile);
            d.append("folderId", fb.data.id);
            d.append("projectId", newProject.id);
            d.append("projectName", newProject.name);
            const ur = await fetch("/api/v1/documents/upload", { method: "POST", credentials: "include", body: d });
            const ub = await ur.json();
            if (ur.ok && ub.data?.id) {
              await fetch(`/api/v1/projects/${newProject.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: `/api/v1/documents/${ub.data.id}/download` }) });
            }
          }
        } catch (e) {
          console.error("Cover upload failed", e);
        }
      }
      setScreen("rooms");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Project could not be created.");
    } finally {
      setSaving(false);
    }
  };
  const saveRooms = async () => { if (!project) return; setSaving(true); setError(""); try { for (const room of rooms.filter(r => r.name.trim())) { const r = await fetch(`/api/v1/projects/${project.id}/rooms`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: room.name.trim(), roomType: room.roomType.trim() || room.name.trim() }) }); if (!r.ok) throw new Error(message(await r.json(), "A room could not be saved.")); } setScreen("roomConfig"); } catch (x) { setError(x instanceof Error ? x.message : "Rooms could not be saved."); } finally { setSaving(false); } };
  if (screen === "choice") return <Modal title="Create New Project" subtitle="Choose how you want to start this project." onClose={onClose}><div className="start-options">{[["scratch", "From Scratch", "Set up project details manually", <svg key="1" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.87531 11.7679L4.10754 13.5357L6.46456 15.8927L15.8926 6.46461L13.5356 4.10758L11.7679 5.87535L12.9464 7.05386L11.7679 8.23237L10.5894 7.05386L9.41087 8.23237L10.5894 9.41088L9.41087 10.5894L8.23233 9.41088L7.05382 10.5894L8.23233 11.7679L7.05382 12.9464L5.87531 11.7679ZM14.1249 2.33981L17.6605 5.87535C17.9859 6.20079 17.9859 6.72842 17.6605 7.05386L7.05382 17.6605C6.72838 17.9859 6.20075 17.9859 5.87531 17.6605L2.33977 14.125C2.01434 13.7995 2.01434 13.2719 2.33977 12.9464L12.9464 2.33981C13.2718 2.01438 13.7995 2.01438 14.1249 2.33981ZM11.7679 15.303L12.9464 14.1245L14.8151 15.9933H15.9936V14.8148L14.1249 12.946L15.3034 11.7675L17.4998 13.9639V17.5H13.9649L11.7679 15.303ZM4.69668 8.23185L2.33966 5.87482C2.01422 5.54939 2.01422 5.02175 2.33966 4.69631L4.69668 2.33929C5.02211 2.01386 5.54976 2.01386 5.87519 2.33929L8.23221 4.69631L7.05371 5.87482L5.28594 4.10706L4.10742 5.28557L5.87519 7.05334L4.69668 8.23185Z" fill="#0F172A"/></svg>], ["template", "Use Template", "Start from a project template", <svg key="2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.33333 17.5C2.8731 17.5 2.5 17.1269 2.5 16.6667V3.33333C2.5 2.8731 2.8731 2.5 3.33333 2.5H16.6667C17.1269 2.5 17.5 2.8731 17.5 3.33333V16.6667C17.5 17.1269 17.1269 17.5 16.6667 17.5H3.33333ZM6.66667 8.33333H4.16667V15.8333H6.66667V8.33333ZM15.8333 8.33333H8.33333V15.8333H15.8333V8.33333ZM15.8333 4.16667H4.16667V6.66667H15.8333V4.16667Z" fill="#0F172A"/></svg>], ["import", "Import Excel/CSV", "Import existing project data", <svg key="3" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.3333 3.33333C18.3333 2.8731 17.9602 2.5 17.5 2.5H2.49996C2.03973 2.5 1.66663 2.8731 1.66663 3.33333V16.6667C1.66663 17.1269 2.03973 17.5 2.49996 17.5H17.5C17.9602 17.5 18.3333 17.1269 18.3333 16.6667V3.33333ZM3.33329 12.5H6.17999C6.82296 13.9716 8.29136 15 9.99996 15C11.7085 15 13.177 13.9716 13.82 12.5H16.6666V15.8333H3.33329V12.5ZM3.33329 4.16667H16.6666V10.8333H12.5C12.5 12.2141 11.3807 13.3333 9.99996 13.3333C8.61921 13.3333 7.49996 12.2141 7.49996 10.8333H3.33329V4.16667ZM13.3333 9.16667H10.8333V11.6667H9.16663V9.16667H6.66663L9.99996 5.41667L13.3333 9.16667Z" fill="#0F172A"/></svg>], ["duplicate", "Duplicate Project", "Copy an existing project", <svg key="4" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.83317 5.00033V2.50033C5.83317 2.04009 6.20627 1.66699 6.6665 1.66699H16.6665C17.1267 1.66699 17.4998 2.04009 17.4998 2.50033V14.167C17.4998 14.6272 17.1267 15.0003 16.6665 15.0003H14.1665V17.4996C14.1665 17.9602 13.7916 18.3337 13.3275 18.3337H3.33888C2.87549 18.3337 2.5 17.9632 2.5 17.4996L2.50217 5.83438C2.50225 5.37375 2.8772 5.00033 3.34118 5.00033H5.83317ZM4.16868 6.66699L4.16682 16.667H12.4998V6.66699H4.16868ZM7.49983 5.00033H14.1665V13.3337H15.8332V3.33366H7.49983V5.00033ZM5.83333 9.16699H10.8333V10.8337H5.83333V9.16699ZM5.83333 12.5003H10.8333V14.167H5.83333V12.5003Z" fill="#0F172A"/></svg>]].map(([id, title, text, icon]) => { return <button key={id as string} className={method === id ? "selected" : ""} onClick={() => setMethod(id as string)}>{icon as React.ReactNode}<b>{title as string}</b><span>{text as string}</span>{method === id && <Check />}</button>; })}</div><footer style={{ justifyContent: 'space-between', marginTop: '16px' }}><button onClick={onClose}>Cancel</button><button className="primary" onClick={() => method === "scratch" ? setScreen("details") : setError("Choose From Scratch, or use the matching action on the Projects page.")}>Continue</button></footer>{error && <p className="form-error">{error}</p>}</Modal>;
  if (screen === "details") return (
    <div className="create-page-wrapper">
      <div className="create-page-header">
        <div className="create-page-header-left">
          <button className="back-btn" onClick={() => setScreen("choice")}><ArrowLeft size={18} /></button>
          <div>
            <h2>Create New Project</h2>
            <p>Set up the foundational details for your new residential project.</p>
          </div>
        </div>
        <div className="create-page-header-right">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onClose}>Save as Draft</button>
          <button type="submit" form="create-details-form" className="primary" disabled={saving}>{saving ? "Creating…" : "Continue to Next"}</button>
        </div>
      </div>
      <Steps current={1} />
      <form id="create-details-form" className="project-form" onSubmit={submit}>
        <fieldset><legend>Project details</legend><Label text="Project Name" required><input required value={form.name} onChange={e => change("name", e.target.value)} placeholder="ex. Sharma Residence" /></Label><small>Use a clear name that helps your team identify the project.</small></fieldset>
        <fieldset><legend>Client information</legend><div className="form-grid"><Label text="Client Name" required><input required value={form.clientName} onChange={e => change("clientName", e.target.value)} placeholder="ex. John Doe" /></Label><Label text="Client Contact"><input value={form.clientContact} onChange={e => change("clientContact", e.target.value)} placeholder="ex. +91 00000 00000" /></Label>
          <Label text="Project Type" required><select required value={form.projectType} onChange={e => change("projectType", e.target.value)}><option value="">Select project type</option><option>Residential</option><option>Commercial</option><option>Retail</option><option>Hospitality</option></select></Label>
          <Label text="Project Status">
            <div className="status-radios">
              {[{ val: "planning", label: "Planning" }, { val: "in_progress", label: "In Progress" }, { val: "on_hold", label: "On Hold" }].map(s => <button key={s.val} type="button" className={form.status === s.val ? "active" : ""} onClick={() => change("status", s.val)}><i /> {s.label}</button>)}
            </div>
          </Label>
        </div></fieldset>
        <fieldset><div className="form-grid"><Label text="Location"><input value={form.location} onChange={e => change("location", e.target.value)} placeholder="Enter location" /></Label><Label text="Area (sqft)"><input type="number" min="1" value={form.areaSqft} onChange={e => change("areaSqft", e.target.value)} placeholder="ex. 3,200" /></Label></div><Label text="Project Scope / Description"><textarea rows={3} value={form.description} onChange={e => change("description", e.target.value)} placeholder="Enter description" /></Label></fieldset>
        <fieldset><legend>Project timeline</legend><div className="form-grid"><Label text="Start Date"><input type="date" value={form.startDate} onChange={e => change("startDate", e.target.value)} /></Label><Label text="Expected Completion"><input type="date" min={form.startDate || undefined} value={form.targetCompletionDate} onChange={e => change("targetCompletionDate", e.target.value)} /></Label></div></fieldset>
        {error && <p className="form-error">{error}</p>}
      </form>
      <div className="cover-upload-section">
        <input type="file" ref={fileInputRef} onChange={e => setCoverFile(e.target.files?.[0] || null)} style={{ display: "none" }} accept="image/png, image/jpeg, image/webp" />
        <button type="button" className="cover-upload-box" onClick={() => fileInputRef.current?.click()}>
          {coverFile ? <img src={URL.createObjectURL(coverFile)} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} /> : (
            <>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.2498 13.75V16.5H21.9998V18.3333H19.2498V21.0833H17.4165V18.3333H14.6665V16.5H17.4165V13.75H19.2498ZM19.2573 2.75C19.7595 2.75 20.1665 3.15787 20.1665 3.66062V11.9167H18.3331V4.58333H3.66646V17.4157L12.8331 8.25L15.5831 11V13.5933L12.8331 10.8427L6.25788 17.4167H12.8331V19.25H2.74228C2.24018 19.25 1.83313 18.8422 1.83313 18.3394V3.66062C1.83313 3.1577 2.2505 2.75 2.74228 2.75H19.2573ZM7.33313 6.41667C8.34565 6.41667 9.16646 7.23748 9.16646 8.25C9.16646 9.26255 8.34565 10.0833 7.33313 10.0833C6.32061 10.0833 5.4998 9.26255 5.4998 8.25C5.4998 7.23748 6.32061 6.41667 7.33313 6.41667Z" fill="#0F172A"/></svg>
              <span>UPLOAD COVER</span>
            </>
          )}
        </button>
        <div className="cover-upload-info">
          <h4>Project Cover Image</h4>
          <p>Upload a high-resolution image to identify this project on the dashboard. Recommended Size: 800x600px.</p>
          <button type="button" onClick={() => fileInputRef.current?.click()}>{coverFile ? "Change Image" : "Browse"}</button>
          {coverFile && <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Selected: {coverFile.name}</div>}
        </div>
      </div>
    </div>
  );
  if (screen === "rooms") return (
    <div className="create-page-wrapper project-setup-wrapper">
      <div className="create-page-header">
        <div className="create-page-header-left">
          <button className="back-btn" onClick={() => setScreen("details")}><ArrowLeft size={18} /></button>
          <div>
            <h2>Create New Project</h2>
            <p>Set up the foundational details for your new residential project.</p>
          </div>
        </div>
        <div className="create-page-header-right">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onClose}>Save as Draft</button>
          <button type="button" onClick={saveRooms} className="primary" disabled={saving}>{saving ? "Saving…" : "Continue to Next"}</button>
        </div>
      </div>

      <div className="setup-card project-setup-card">
        <div className="card-header">PROJECT SETUP</div>
        <Steps current={2} />
      </div>

      <div className="setup-card project-details-card">
        <div className="card-header">PROJECT DETAILS</div>
        <div className="project-details-content">
          <div className="pd-item primary-pd-item">
            <div className="pd-icon"><Home size={20} /></div>
            <div>
               <b>{project?.name || form.name || "Project Name"} <span className={`project-status ${project?.status || form.status || "planning"}`}>{label(project?.status || form.status || "planning")}</span></b>
               <p>Residential Interior Project</p>
            </div>
          </div>
          <div className="pd-item">
            <label><User size={14} /> Client</label>
            <span>{project?.clientName || form.clientName || "—"}</span>
          </div>
          <div className="pd-item">
            <label><MapPin size={14} /> Location</label>
            <span>{project?.location || form.location || "—"}</span>
          </div>
          <div className="pd-item">
            <label><Briefcase size={14} /> Type</label>
            <span>{project?.projectType || form.projectType || "—"}</span>
          </div>
          <div className="pd-item">
            <label><Calendar size={14} /> Timeline</label>
            <span>{date(project?.startDate || form.startDate)} — {date(project?.targetCompletionDate || form.targetCompletionDate)}</span>
          </div>
          <button type="button" className="primary" onClick={() => setScreen("details")}>Edit Project</button>
        </div>
      </div>

      <div className="setup-card room-setup-card">
        <div className="card-header">ROOM SETUP</div>
        
        <div className="room-count-section">
          <Label text="Number of Rooms" required><span style={{display:'none'}}></span></Label>
          <div className="counter-row">
            <div className="counter">
              <button onClick={() => setRooms(rs => rs.length > 1 ? rs.slice(0, -1) : rs)}><Minus size={16} /></button>
              <input type="text" readOnly value={rooms.length} />
              <button onClick={() => setRooms(rs => [...rs, { name: "New Room", roomType: "" }])}><Plus size={16} /></button>
            </div>
            <span><b>{rooms.length}</b> rooms will be created for this project.</span>
          </div>
          <p className="room-setup-desc">Set the initial room count and create the room structure you'll configure for the BOQ. You can add or remove rooms later.</p>
        </div>

        <div className="room-list-section">
          <div className="room-list-header">
            <div>
              <label>ROOM LIST</label>
              <p>Give each room a clear name so it can be identified throughout the BOQ workflow.</p>
            </div>
            <button className="primary" onClick={() => setRooms(rs => [...rs, { name: "", roomType: "" }])}>Quick Add</button>
          </div>
          
          <div className="room-list-toolbar">
            <label className="room-search">
              <Search size={16} />
              <input placeholder="Search Rooms" />
            </label>
            <select className="room-filter">
              <option>All Category</option>
            </select>
          </div>

          <table className="room-list-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ROOM NAME</th>
                <th>ROOM TYPE</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, i) => (
                <tr key={i}>
                  <td style={{color: '#94a3b8'}}>{String(i + 1).padStart(2, "0")}</td>
                  <td>
                    <input 
                      value={room.name} 
                      onChange={e => setRooms(rs => rs.map((r, x) => x === i ? { ...r, name: e.target.value } : r))} 
                      placeholder="Room name" 
                    />
                  </td>
                  <td>
                    <select 
                      value={room.roomType} 
                      onChange={e => setRooms(rs => rs.map((r, x) => x === i ? { ...r, roomType: e.target.value } : r))}
                    >
                      <option value="" disabled>Select type</option>
                      <option value="Master Bedroom">Master Bedroom</option>
                      <option value="Bedroom">Bedroom</option>
                      <option value="Living Room">Living Room</option>
                      <option value="Dining Room">Dining Room</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Study Room">Study Room</option>
                    </select>
                  </td>
                  <td><span className="status-badge">NOT CONFIGURED</span></td>
                  <td className="actions">
                     <button onClick={() => setRooms(rs => rs.filter((_, x) => x !== i))}><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
  if (screen === "roomConfig") return (
    <div className="create-page-wrapper project-setup-wrapper">
      <div className="create-page-header">
        <div className="create-page-header-left">
          <button className="back-btn" onClick={() => setScreen("rooms")}><ArrowLeft size={18} /></button>
          <div>
            <h2>Create New Project</h2>
            <p>Set up the foundational details for your new residential project.</p>
          </div>
        </div>
        <div className="create-page-header-right">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onClose}>Save as Draft</button>
          <button type="button" onClick={() => setScreen("requirements")} className="primary">Continue to Next</button>
        </div>
      </div>

      <div className="setup-card project-setup-card">
        <div className="card-header">PROJECT SETUP</div>
        <Steps current={3} />
      </div>

      <div className="setup-stats-bar">
        <div className="stat-card">
          <small>Total Rooms</small>
          <b>{rooms.length}</b>
        </div>
        <div className="stat-card configured">
          <small>Configured</small>
          <b>{activeRoomIndex > 0 ? activeRoomIndex : 0}</b>
        </div>
        <div className="stat-card pending">
          <small>Pending</small>
          <b>{rooms.length - (activeRoomIndex > 0 ? activeRoomIndex : 0)}</b>
        </div>
      </div>

      <div className="room-config-grid">
        <div className="room-sidebar">
          <div className="room-sidebar-header">PROJECT ROOMS</div>
          <div className="room-sidebar-list">
            {rooms.map((r, i) => (
              <div key={i} className={`sidebar-room-card ${i === activeRoomIndex ? 'active' : ''}`} onClick={() => setActiveRoomIndex(i)}>
                <div className="sr-icon">{String(i + 1).padStart(2, "0")}</div>
                <div className="sr-info">
                  <b>{r.name || `Room ${i + 1}`}</b>
                  <span>Dimensions not added</span>
                </div>
                <div className="sr-badge">PENDING</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="room-detail-panel">
          <div className="rdp-header">
            <h3>{rooms[activeRoomIndex]?.name || "ROOM"} <span className="badge">CONFIGURED</span></h3>
            <div className="rdp-actions">
              <button>Edit Name</button>
              <button>Duplicate</button>
              <button><MoreHorizontal size={14} /></button>
            </div>
          </div>
          
          <div className="rdp-section">
            <h4>ROOM INFORMATION</h4>
            <div className="rdp-grid-2">
              <div className="rdp-input-group">
                <label>Room Name <em>*</em></label>
                <input 
                  value={rooms[activeRoomIndex]?.name || ""} 
                  onChange={e => setRooms(rs => rs.map((r, x) => x === activeRoomIndex ? { ...r, name: e.target.value } : r))}
                  placeholder="ex. Master Bedroom" 
                />
              </div>
              <div className="rdp-input-group">
                <label>Room Type <em>*</em></label>
                <select 
                  value={rooms[activeRoomIndex]?.roomType || ""} 
                  onChange={e => setRooms(rs => rs.map((r, x) => x === activeRoomIndex ? { ...r, roomType: e.target.value } : r))}
                >
                  <option value="" disabled>Select type</option>
                  <option value="Master Bedroom">Master Bedroom</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Dining Room">Dining Room</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Study Room">Study Room</option>
                  <option value="Guest Bedroom">Guest Bedroom</option>
                  <option value="Bathroom">Bathroom</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rdp-section">
            <h4>ROOM DIMENSIONS <select style={{width:'auto', padding:'4px 20px 4px 8px', fontSize:'10px', height:'auto'}}><option>Feet</option></select></h4>
            <p style={{fontSize:'10px', color:'#64748b', margin:'-8px 0 12px 0'}}>Give each room a clear name so it can be identified throughout the BOQ workflow.</p>
            <div className="rdp-grid-3">
              <div className="rdp-input-group">
                <label>Length <em>*</em></label>
                <div className="rdp-input-wrap"><input defaultValue="12" /><span>ft</span></div>
              </div>
              <div className="times">x</div>
              <div className="rdp-input-group">
                <label>Width <em>*</em></label>
                <div className="rdp-input-wrap"><input defaultValue="14" /><span>ft</span></div>
              </div>
              <div className="times">x</div>
              <div className="rdp-input-group">
                <label>Height <em>*</em></label>
                <div className="rdp-input-wrap"><input defaultValue="10" /><span>ft</span></div>
              </div>
            </div>
          </div>

          <div className="rdp-section">
            <h4>ROOM MEASUREMENT SUMMARY</h4>
            <div className="measurement-summary">
              <div className="ms-card">
                <span>AREA</span>
                <b>168 <small>sq.ft</small></b>
                <p>12 x 14 = 168 sq.ft</p>
              </div>
              <div className="ms-card">
                <span>VOLUME</span>
                <b>1,680 <small>cu.ft</small></b>
                <p>12 x 14 x 10 = 1,680 cu.ft</p>
              </div>
            </div>
          </div>

          <div className="rdp-section">
            <h4>Room Notes</h4>
            <div className="rdp-input-group">
              <textarea rows={3} placeholder="ex. notes" />
            </div>
          </div>

          <div className="rdp-section">
            <h4>Room References</h4>
            <div className="upload-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              UPLOAD IMAGE
            </div>
          </div>

          <div className="rdp-footer">
            <button className="btn-cancel">Cancel</button>
            <button className="btn-save" onClick={() => setScreen("requirements")}>Save Room</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (screen === "requirements") return (
    <div className="create-page-wrapper project-setup-wrapper">
      <div className="create-page-header">
        <div className="create-page-header-left">
          <button className="back-btn" onClick={() => setScreen("roomConfig")}><ArrowLeft size={18} /></button>
          <div>
            <h2>Create New Project</h2>
            <p>Set up the foundational details for your new residential project.</p>
          </div>
        </div>
        <div className="create-page-header-right">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onClose}>Save as Draft</button>
          <button type="button" onClick={() => setScreen("success")} className="primary">Continue to Next</button>
        </div>
      </div>

      <div className="setup-card project-setup-card">
        <div className="card-header">PROJECT SETUP</div>
        <Steps current={4} />
      </div>

      <div className="setup-stats-bar">
        <div className="stat-card">
          <small>Total Rooms</small>
          <b>{rooms.length}</b>
        </div>
        <div className="stat-card configured">
          <small>Configured</small>
          <b>{activeRoomIndex > 0 ? activeRoomIndex : 0}</b>
        </div>
        <div className="stat-card pending">
          <small>Pending</small>
          <b>{rooms.length - (activeRoomIndex > 0 ? activeRoomIndex : 0)}</b>
        </div>
      </div>

      <div className="room-config-grid">
        <div className="room-sidebar">
          <div className="room-sidebar-header">PROJECT ROOMS</div>
          <div className="room-sidebar-list">
            {rooms.map((r, i) => (
              <div key={i} className={`sidebar-room-card ${i === activeRoomIndex ? 'active' : ''}`} onClick={() => { setActiveRoomIndex(i); setAddingRequirement(false); setSelectedRequirement(null); }}>
                <div className="sr-icon">{String(i + 1).padStart(2, "0")}</div>
                <div className="sr-info">
                  <b>{r.name || `Room ${i + 1}`}</b>
                  <span>No requirements yet</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="room-detail-panel">
          <div className="rdp-header">
            <h3>{rooms[activeRoomIndex]?.name || "ROOM"} <span className="badge">CONFIGURED</span></h3>
            <div className="rdp-actions">
              <button>Edit Name</button>
            </div>
          </div>
          
          {!addingRequirement ? (
            <>
              <div className="empty-requirements">
                <div className="er-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                <h4>No Requirements Added</h4>
                <p>Add the furniture, storage, panels, cabinets, or other items required for this room.</p>
                <button onClick={() => setAddingRequirement(true)}><Plus size={16} /> Add Requirement</button>
              </div>

              <div className="common-requirements">
                <h5>COMMON FOR {rooms[activeRoomIndex]?.name?.toUpperCase() || "ROOM"}</h5>
                <div className="cr-chips">
                  {["Wardrobe", "Bed Back Panel", "Side Table", "TV Unit", "Study Table", "Storage Unit"].map(c => (
                    <div key={c} className="cr-chip" onClick={() => { setAddingRequirement(true); setSelectedRequirement(c); }}><Plus size={12} /> {c}</div>
                  ))}
                </div>
              </div>

              <div className="rdp-footer">
                <button className="btn-cancel">Cancel</button>
                <button className="btn-save" onClick={() => setScreen("materials")}>Save Room</button>
              </div>
            </>
          ) : (
            <>
              <div className="req-details-header">
                <div>
                  <h4>Add Requirement</h4>
                  <p>Select what needs to be built or installed in <b>{rooms[activeRoomIndex]?.name?.toUpperCase()}</b></p>
                </div>
              </div>

              <div className="req-header-info">
                <div><small>ROOM</small><b>12x14x10 ft</b></div>
                <div><small>AREA</small><b>168 sq.ft</b></div>
                <div><small>VOLUME</small><b>1680 cu.ft</b></div>
              </div>

              <div className="rdp-input-group">
                <label>Requirement Type <em>*</em></label>
                <div className="room-search" style={{marginBottom:0, border:'1px solid #dce5f0'}}>
                  <Search size={16} style={{opacity:0.5, marginLeft:'12px'}} />
                  <input placeholder="Search items.." style={{border:'none', outline:'none', boxShadow:'none'}} />
                </div>
              </div>

              <div className="req-categories">
                <div className="req-category">
                  <h6>STORAGE</h6>
                  <div className="chips">
                    {["Wardrobe", "Storage Unit", "Shoe Cabinet"].map(c => <div key={c} className={`chip ${selectedRequirement === c ? 'selected' : ''}`} onClick={() => setSelectedRequirement(c)}>{c}</div>)}
                  </div>
                </div>
                <div className="req-category">
                  <h6>FURNITURE</h6>
                  <div className="chips">
                    {["Bed Back Panel", "Study Table", "Side Table", "TV Unit", "Vanity"].map(c => <div key={c} className={`chip ${selectedRequirement === c ? 'selected' : ''}`} onClick={() => setSelectedRequirement(c)}>{c}</div>)}
                  </div>
                </div>
                <div className="req-category">
                  <h6>KITCHEN</h6>
                  <div className="chips">
                    {["Base Cabinet", "Wall Cabinet", "Tall Unit", "Pantry", "Overhead Cabinet"].map(c => <div key={c} className={`chip ${selectedRequirement === c ? 'selected' : ''}`} onClick={() => setSelectedRequirement(c)}>{c}</div>)}
                  </div>
                </div>
                <div className="req-category">
                  <h6>WALL & CEILING</h6>
                  <div className="chips">
                    {["Wall Panel", "False Ceiling", "Decorative Panel"].map(c => <div key={c} className={`chip ${selectedRequirement === c ? 'selected' : ''}`} onClick={() => setSelectedRequirement(c)}>{c}</div>)}
                  </div>
                </div>
                <div className="req-category">
                  <h6>OTHER</h6>
                  <div className="chips">
                    <div className="chip">Custom Item</div>
                  </div>
                </div>
              </div>

              {selectedRequirement && (
                <div className="req-details-section">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'16px', background:'#f8fafc', padding:'12px', borderRadius:'6px'}}>
                    <div>
                      <b style={{fontSize:'12px', color:'#1e293b'}}>{selectedRequirement}</b>
                      <span style={{display:'block', fontSize:'10px', color:'#64748b', marginTop:'2px'}}>Storage</span>
                    </div>
                    <span style={{fontSize:'10px', color:'#94a3b8'}}>Item dimensions are separate from room size</span>
                  </div>

                  <p style={{fontSize:'11px', color:'#64748b', marginBottom:'12px'}}>Item Dimensions</p>
                  <div className="rdp-grid-3" style={{marginBottom:'20px'}}>
                    <div className="rdp-input-group">
                      <label>Length <em>*</em></label>
                      <div className="rdp-input-wrap"><input defaultValue="12" /><span>ft</span></div>
                    </div>
                    <div className="times">x</div>
                    <div className="rdp-input-group">
                      <label>Breadth/Depth <em>*</em></label>
                      <div className="rdp-input-wrap"><input defaultValue="14" /><span>ft</span></div>
                    </div>
                    <div className="times">x</div>
                    <div className="rdp-input-group">
                      <label>Height <em>*</em></label>
                      <div className="rdp-input-wrap"><input defaultValue="10" /><span>ft</span></div>
                    </div>
                  </div>

                  <div className="rdp-grid-2" style={{marginBottom:'24px'}}>
                    <div className="rdp-input-group">
                      <label>Quantity <em>*</em></label>
                      <div className="quantity-input">
                        <button><Minus size={14} /></button>
                        <input defaultValue="1" />
                        <button><Plus size={14} /></button>
                      </div>
                    </div>
                    <div className="rdp-input-group">
                      <label>Unit <em>*</em></label>
                      <select><option>Unit</option></select>
                    </div>
                    <div className="rdp-input-group">
                      <label>Number of Partitions <em>*</em></label>
                      <div className="quantity-input">
                        <button><Minus size={14} /></button>
                        <input defaultValue="0" />
                        <button><Plus size={14} /></button>
                      </div>
                      <p style={{fontSize:'9px', color:'#94a3b8', margin:'4px 0 0 0'}}>Partitions will be used later to calculate material requirements.</p>
                    </div>
                  </div>

                  <div className="rdp-section">
                    <h4>Requirement Notes</h4>
                    <div className="rdp-input-group">
                      <textarea rows={3} placeholder="ex. add notes about this item..." />
                    </div>
                  </div>

                  <div className="rdp-section">
                    <h4>Reference Image</h4>
                    <div className="upload-box">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      UPLOAD IMAGE
                    </div>
                  </div>

                  <div className="rdp-footer">
                    <button className="btn-cancel" onClick={() => setAddingRequirement(false)}>Cancel</button>
                    <button className="btn-save" onClick={() => { setAddingRequirement(false); setScreen("materials"); }}>Save Requirement</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (screen === "materials") return (
    <div className="create-page-wrapper project-setup-wrapper">
      <div className="create-page-header">
        <div className="create-page-header-left">
          <button className="back-btn" onClick={() => setScreen("requirements")}><ArrowLeft size={18} /></button>
          <div>
            <h2>Create New Project</h2>
            <p>Set up the foundational details for your new residential project.</p>
          </div>
        </div>
        <div className="create-page-header-right">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onClose}>Save as Draft</button>
          <button type="button" onClick={() => setScreen("success")} className="primary">Continue to BOQ</button>
        </div>
      </div>

      <div className="setup-card project-setup-card">
        <div className="card-header">PROJECT SETUP</div>
        <Steps current={5} />
      </div>

      <div className="setup-stats-bar">
        <div className="stat-card">
          <small>Total Rooms</small>
          <b>{rooms.length}</b>
        </div>
        <div className="stat-card configured">
          <small>Configured</small>
          <b>{activeRoomIndex > 0 ? activeRoomIndex : 0}</b>
        </div>
        <div className="stat-card pending">
          <small>Pending</small>
          <b>{rooms.length - (activeRoomIndex > 0 ? activeRoomIndex : 0)}</b>
        </div>
      </div>

      <div className="room-config-grid">
        <div className="room-sidebar">
          <div className="room-sidebar-header">PROJECT ROOMS</div>
          <div className="room-sidebar-list">
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'10px', color:'#64748b', textTransform:'uppercase', marginBottom:'8px', fontWeight:600}}>MASTER BEDROOM</div>
              <div className={`sidebar-room-card active`}>
                <div className="sr-info">
                  <b style={{marginBottom:0}}>Wardrobe</b>
                  <span style={{marginTop:2}}>{materialSelected ? "12mm HDHMR Board" : "No material selected"}</span>
                </div>
                <div className="sr-badge" style={materialSelected ? {background:'#e0eafd', color:'#2865e8'} : {}}>
                  {materialSelected ? "SELECTED" : "PENDING"}
                </div>
              </div>
              <div className={`sidebar-room-card`} style={{marginTop:'8px'}}>
                <div className="sr-info">
                  <b style={{marginBottom:0}}>Bed Back Panel</b>
                  <span style={{marginTop:2}}>No material selected</span>
                </div>
                <div className="sr-badge">PENDING</div>
              </div>
              <div className={`sidebar-room-card`} style={{marginTop:'8px'}}>
                <div className="sr-info">
                  <b style={{marginBottom:0}}>TV Unit</b>
                  <span style={{marginTop:2}}>No material selected</span>
                </div>
                <div className="sr-badge">PENDING</div>
              </div>
            </div>
            
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'10px', color:'#64748b', textTransform:'uppercase', marginBottom:'8px', fontWeight:600}}>LIVING ROOM</div>
              <div className={`sidebar-room-card`}>
                <div className="sr-info">
                  <b style={{marginBottom:0}}>TV Unit</b>
                  <span style={{marginTop:2}}>No material selected</span>
                </div>
                <div className="sr-badge">PENDING</div>
              </div>
              <div className={`sidebar-room-card`} style={{marginTop:'8px'}}>
                <div className="sr-info">
                  <b style={{marginBottom:0}}>Storage Unit</b>
                  <span style={{marginTop:2}}>No material selected</span>
                </div>
                <div className="sr-badge">PENDING</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="room-detail-panel" style={{padding:'24px', background:'#f8fafc', border:'none', boxShadow:'none'}}>
          <div className="req-overview-bar">
            <div><small>Item</small><b>Wardrobe</b></div>
            <div><small>Room</small><b>Master Bedroom</b></div>
            <div><small>Category</small><b>Storage</b></div>
            <div><small>Dimensions</small><b>8 x 2 x 8 ft</b></div>
            <div><small>Quantity</small><b>1</b></div>
            <div><small>Partitions</small><b>4</b></div>
          </div>

          <div className="room-search" style={{marginBottom:0, border:'1px solid #dce5f0', background:'white'}}>
            <Search size={16} style={{opacity:0.5, marginLeft:'12px'}} />
            <input placeholder="Search materials by name, code, brand..." style={{border:'none', outline:'none', boxShadow:'none'}} />
          </div>

          <div className="material-grid">
            <div className={`material-card ${materialSelected ? 'selected' : ''}`}>
              {materialSelected && <div className="check-icon"><Check size={12} /></div>}
              <div className="mc-header">
                <div className="img"></div>
                <div>
                  <h5>12mm HDHMR Board</h5>
                  <span className="stock-badge in-stock"><i /> In Stock</span>
                </div>
              </div>
              <div className="mc-details">
                <div><small>Category</small><b>HDHMR</b></div>
                <div><small>Thickness</small><b>12mm</b></div>
                <div><small>Finish</small><b>Plain</b></div>
                <div><small>Price</small><b>₹118/Sq.ft</b></div>
              </div>
              <div className="mc-footer">
                <span><b>320 Sq.ft</b> Available</span>
                <span>Euronics</span>
              </div>
              <div className="mc-actions">
                <button className={`select-btn ${materialSelected ? 'selected' : ''}`} onClick={() => !materialSelected && setShowAssignModal(true)}>
                  {materialSelected && <Check size={14} />} {materialSelected ? 'Selected' : 'Select'}
                </button>
                <button className="icon-btn"><Info size={14} /></button>
                <button className="icon-btn"><RefreshCcw size={14} /></button>
              </div>
            </div>

            <div className="material-card">
              <div className="mc-header">
                <div className="img"></div>
                <div>
                  <h5>18mm HDHMR Board</h5>
                  <span className="stock-badge low-stock"><i /> Low Stock</span>
                </div>
              </div>
              <div className="mc-details">
                <div><small>Category</small><b>HDHMR</b></div>
                <div><small>Thickness</small><b>18mm</b></div>
                <div><small>Finish</small><b>Plain</b></div>
                <div><small>Price</small><b>₹240/Sq.ft</b></div>
              </div>
              <div className="mc-footer">
                <span><b>120 Sq.ft</b> Available</span>
                <span>Euronics</span>
              </div>
              <div className="mc-actions">
                <button className="select-btn">Select</button>
                <button className="icon-btn"><Info size={14} /></button>
                <button className="icon-btn"><RefreshCcw size={14} /></button>
              </div>
            </div>

            <div className="material-card">
              <div className="mc-header">
                <div className="img"></div>
                <div>
                  <h5>18mm HDHMR Board</h5>
                  <span className="stock-badge out-of-stock"><i /> Out of Stock</span>
                </div>
              </div>
              <div className="mc-details">
                <div><small>Category</small><b>HDHMR</b></div>
                <div><small>Thickness</small><b>18mm</b></div>
                <div><small>Finish</small><b>Plain</b></div>
                <div><small>Price</small><b>₹240/Sq.ft</b></div>
              </div>
              <div className="mc-footer">
                <span><b>0 Sq.ft</b> Available</span>
                <span>Euronics</span>
              </div>
              <div className="mc-actions">
                <button className="select-btn">Select</button>
                <button className="icon-btn"><Info size={14} /></button>
                <button className="icon-btn"><RefreshCcw size={14} /></button>
              </div>
            </div>
            
            <div className="material-card">
              <div className="mc-header">
                <div className="img"></div>
                <div>
                  <h5>Acrylic Glass Board</h5>
                  <span className="stock-badge in-stock"><i /> In Stock</span>
                </div>
              </div>
              <div className="mc-details">
                <div><small>Category</small><b>Acrylic</b></div>
                <div><small>Thickness</small><b>3mm</b></div>
                <div><small>Finish</small><b>Gloss</b></div>
                <div><small>Price</small><b>₹240/Sq.ft</b></div>
              </div>
              <div className="mc-footer">
                <span><b>320 Sq.ft</b> Available</span>
                <span>Euronics</span>
              </div>
              <div className="mc-actions">
                <button className="select-btn">Select</button>
                <button className="icon-btn"><Info size={14} /></button>
                <button className="icon-btn"><RefreshCcw size={14} /></button>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="material-modal-overlay" onMouseDown={() => setShowAssignModal(false)}>
          <div className="material-modal" onMouseDown={e => e.stopPropagation()}>
            <div className="mm-header">
              <div>
                <h3>Assign Material?</h3>
                <p>Confirm material assignment for this requirement.</p>
              </div>
              <button onClick={() => setShowAssignModal(false)}><X size={20} /></button>
            </div>
            <div className="mm-content">
              <div className="mm-table">
                <div className="mm-row"><span>Requirement</span><span>Wardrobe</span></div>
                <div className="mm-row"><span>Room</span><span>Master Bedroom</span></div>
                <div className="mm-row"><span>Material</span><span>12mm HDHMR Board</span></div>
                <div className="mm-row"><span>Thickness</span><span>12mm</span></div>
                <div className="mm-row"><span>Unit</span><span>Sq.ft</span></div>
                <div className="mm-row"><span>Unit Price</span><span>₹118 / Sq.ft</span></div>
              </div>
              <span className="mm-note">Final material quantity and cost will be calculated in Step 6.</span>
            </div>
            <div className="mm-footer">
              <button className="mm-btn-cancel" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="mm-btn-assign" onClick={() => { setMaterialSelected(true); setShowAssignModal(false); }}>Assign Material</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  return (
    <div className="create-page-wrapper">
      <div className="create-page-header">
        <div className="create-page-header-left">
          <button className="back-btn" onClick={() => onCreated("Project created.")}><ArrowLeft size={18} /></button>
          <div>
            <h2>Project Workspace Ready</h2>
            <p>Your project has been successfully initialized.</p>
          </div>
        </div>
      </div>
      <div className="success-panel"><div className="success-check"><Check /></div><h2>Project Created Successfully!</h2><p>{project?.name} is ready for BOQ creation.</p><dl><div><dt>Client</dt><dd>{project?.clientName}</dd></div><div><dt>Type</dt><dd>{project?.projectType}</dd></div><div><dt>Rooms</dt><dd>{rooms.filter(r => r.name.trim()).length}</dd></div><div><dt>Area</dt><dd>{project?.areaSqft ? `${project.areaSqft} sqft` : "—"}</dd></div></dl>
      <footer style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
        <button onClick={() => onCreated("Project created.")} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Back to Projects</button>
        <button className="primary" onClick={() => location.assign(`/projects/${project?.id}`)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #2865e8', background: '#2865e8', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Open Project Workspace</button>
      </footer>
      </div>
    </div>
  );
}
function Label({ text, required, children }: { text: string; required?: boolean; children: React.ReactNode }) { return <label>{text}{required && <em>*</em>}{children}</label>; }
function Steps({ current }: { current: number }) { return <div className="wizard-steps">{["Project Details", "Room Setup", "Room Config", "Requirements", "Materials"].map((x, i) => <div className={i + 1 <= current ? "done" : ""} key={x}><span>{i + 1 < current ? <Check /> : String(i + 1).padStart(2, "0")}</span><b>{x}</b></div>)}</div>; }
function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="project-modal-backdrop" onMouseDown={onClose}><section className={`project-modal ${wide ? "wide" : ""}`} onMouseDown={e => e.stopPropagation()}><header><div><h1>{title}</h1><p>{subtitle}</p></div><button onClick={onClose}><X /></button></header>{children}</section></div>; }
