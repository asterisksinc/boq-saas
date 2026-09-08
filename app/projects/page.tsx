"use client";

import { Check, ChevronDown, MoreHorizontal, Plus, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Project = { id: string; projectCode?: string | null; name: string; clientName: string; clientContact?: string | null; projectType: string; status: string; location?: string | null; description?: string | null; areaSqft?: number | null; projectValue?: number | null; approvedBudget?: number | null; startDate?: string | null; targetCompletionDate?: string | null; progress?: number | null };
type Form = { name: string; clientName: string; clientContact: string; projectType: string; status: string; location: string; description: string; areaSqft: string; projectValue: string; startDate: string; targetCompletionDate: string };
const blank: Form = { name: "", clientName: "", clientContact: "", projectType: "", status: "planning", location: "", description: "", areaSqft: "", projectValue: "", startDate: "", targetCompletionDate: "" };
const links = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing"];
const icons = ["dashboard-overview-active", "dashboard-projects", "dashboard-boqs", "dashboard-costs", "dashboard-workspace", "dashboard-estimates", "dashboard-purchase-orders", "dashboard-analytics", "dashboard-reports", "dashboard-integrations", "dashboard-billing"];
const message = (x: unknown, fallback: string) => (x as { error?: { message?: string }; message?: string })?.error?.message || (x as { message?: string })?.message || fallback;
const money = (n?: number | null) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const date = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${x}T00:00:00`)) : "—";
const label = (x: string) => x.replace(/_/g, " ");

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]), [loading, setLoading] = useState(true), [query, setQuery] = useState(""), [view, setView] = useState<"list" | "grid">("list"), [filter, setFilter] = useState("all"), [filterOpen, setFilterOpen] = useState(false), [menu, setMenu] = useState<string | null>(null), [create, setCreate] = useState(false), [remove, setRemove] = useState<Project | null>(null), [notice, setNotice] = useState<string | null>(null);
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
    {/* Fix 7: Sidebar with Help & Settings visible */}
    <aside className="fig-dashboard-rail">
      <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
      <nav className="fig-dashboard-menu">{links.map((path, i) => <button key={path} className={i === 1 ? "is-current" : ""} onClick={() => location.assign(path)}><img src={`/assets/dashboard/${icons[i]}.svg`} alt="" /></button>)}</nav>
      <div className="fig-dashboard-tools">
        <button type="button" aria-label="Help" onClick={() => location.assign("/help")}><img src="/assets/dashboard/dashboard-help.svg" alt="" /></button>
        <button type="button" aria-label="Settings" onClick={() => location.assign("/settings")}><img src="/assets/dashboard/dashboard-settings.svg" alt="" /></button>
      </div>
    </aside>
    <div className="fig-dashboard-main">
      {/* Fix 1: Notification bell SVG + Fix 4: Search bar matching dashboard */}
      <header className="fig-dashboard-header">
        <h1>Projects</h1>
        <div className="fig-dashboard-header-actions">
          <label className="fig-dashboard-search"><img src="/assets/dashboard/dashboard-search.svg" alt="" /><input placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} /></label>
          <button className="fig-dashboard-new" onClick={() => setCreate(true)}><Plus size={19} /><span>New</span><i /><ChevronDown size={18} /></button>
          <button className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
          <div className="fig-dashboard-avatar">PR</div>
        </div>
      </header>
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
    </div>
    {create && <Create onClose={() => setCreate(false)} onCreated={x => { setCreate(false); setNotice(x); load(); }} />}
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

function Create({ onClose, onCreated }: { onClose: () => void; onCreated: (x: string) => void }) {
  const [screen, setScreen] = useState<"choice" | "details" | "rooms" | "success">("choice"), [method, setMethod] = useState("scratch"), [form, setForm] = useState<Form>(blank), [project, setProject] = useState<Project | null>(null), [rooms, setRooms] = useState([{ name: "Master Bedroom", roomType: "Master Bedroom" }]), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const change = (key: keyof Form, value: string) => setForm(f => ({ ...f, [key]: value }));
  const submit = async (e: FormEvent) => { e.preventDefault(); setSaving(true); setError(""); const body = { ...form, clientContact: form.clientContact || null, description: form.description || null, location: form.location || undefined, areaSqft: form.areaSqft ? Number(form.areaSqft) : null, projectValue: form.projectValue ? Number(form.projectValue) : null, startDate: form.startDate || null, targetCompletionDate: form.targetCompletionDate || null }; try { const r = await fetch("/api/v1/projects", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const b = await r.json(); if (!r.ok) throw new Error(message(b, "Project could not be created.")); setProject(b.data); setScreen("rooms"); } catch (x) { setError(x instanceof Error ? x.message : "Project could not be created."); } finally { setSaving(false); } };
  const saveRooms = async () => { if (!project) return; setSaving(true); setError(""); try { for (const room of rooms.filter(r => r.name.trim())) { const r = await fetch(`/api/v1/projects/${project.id}/rooms`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: room.name.trim(), roomType: room.roomType.trim() || room.name.trim() }) }); if (!r.ok) throw new Error(message(await r.json(), "A room could not be saved.")); } setScreen("success"); } catch (x) { setError(x instanceof Error ? x.message : "Rooms could not be saved."); } finally { setSaving(false); } };
  if (screen === "choice") return <Modal title="Create New Project" subtitle="Choose how you want to start this project." onClose={onClose}><div className="start-options">{[["scratch", "From Scratch", "Set up project details manually"], ["template", "Use Template", "Start from a project template"], ["import", "Import Excel/CSV", "Import existing project data"], ["duplicate", "Duplicate Project", "Copy an existing project"]].map(([id, title, text]) => { return <button key={id as string} className={method === id ? "selected" : ""} onClick={() => setMethod(id as string)}><b>{title as string}</b><span>{text as string}</span>{method === id && <Check />}</button>; })}</div><p className="modal-help">The available API supports creating a project from scratch. Import Excel is available from the Projects page, and existing projects can be duplicated from their action menu.</p><footer><button onClick={onClose}>Cancel</button><button className="primary" onClick={() => method === "scratch" ? setScreen("details") : setError("Choose From Scratch, or use the matching action on the Projects page.")}>Continue</button></footer>{error && <p className="form-error">{error}</p>}</Modal>;
  if (screen === "details") return <Modal wide title="Create New Project" subtitle="Set up the foundational details for your new project." onClose={onClose}><Steps current={1} /><form className="project-form" onSubmit={submit}><fieldset><legend>Project details</legend><Label text="Project Name" required><input required value={form.name} onChange={e => change("name", e.target.value)} placeholder="ex. Sharma Residence" /></Label><small>Use a clear name that helps your team identify the project.</small></fieldset><fieldset><legend>Client information</legend><div className="form-grid"><Label text="Client Name" required><input required value={form.clientName} onChange={e => change("clientName", e.target.value)} placeholder="ex. John Doe" /></Label><Label text="Client Contact"><input value={form.clientContact} onChange={e => change("clientContact", e.target.value)} placeholder="ex. +91 00000 00000" /></Label><Label text="Project Type" required><select required value={form.projectType} onChange={e => change("projectType", e.target.value)}><option value="">Select project type</option><option>Residential</option><option>Commercial</option><option>Retail</option><option>Hospitality</option></select></Label><Label text="Project Status"><select value={form.status} onChange={e => change("status", e.target.value)}><option value="planning">Planning</option><option value="active">Active</option><option value="in_progress">In Progress</option><option value="on_hold">On Hold</option></select></Label></div></fieldset><fieldset><div className="form-grid"><Label text="Location"><input value={form.location} onChange={e => change("location", e.target.value)} placeholder="Enter location" /></Label><Label text="Area (sqft)"><input type="number" min="1" value={form.areaSqft} onChange={e => change("areaSqft", e.target.value)} placeholder="ex. 3,200" /></Label></div><Label text="Project Scope / Description"><textarea rows={3} value={form.description} onChange={e => change("description", e.target.value)} placeholder="Enter description" /></Label></fieldset><fieldset><legend>Project timeline</legend><div className="form-grid"><Label text="Start Date"><input type="date" value={form.startDate} onChange={e => change("startDate", e.target.value)} /></Label><Label text="Expected Completion"><input type="date" min={form.startDate || undefined} value={form.targetCompletionDate} onChange={e => change("targetCompletionDate", e.target.value)} /></Label></div></fieldset><footer><button type="button" onClick={() => setScreen("choice")}>Back</button><button type="button" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Creating…" : "Continue to Rooms"}</button></footer>{error && <p className="form-error">{error}</p>}</form></Modal>;
  if (screen === "rooms") return <Modal wide title="Set Up Project Rooms" subtitle="Add rooms to configure for this project." onClose={onClose}><Steps current={2} /><div className="rooms-editor"><div><b>{project?.name}</b><p>Rooms can be changed later from the project workspace.</p></div>{rooms.map((room, i) => <div className="room-row" key={i}><span>{String(i + 1).padStart(2, "0")}</span><input value={room.name} onChange={e => setRooms(rs => rs.map((r, x) => x === i ? { ...r, name: e.target.value } : r))} placeholder="Room name" /><input value={room.roomType} onChange={e => setRooms(rs => rs.map((r, x) => x === i ? { ...r, roomType: e.target.value } : r))} placeholder="Room type" /><button onClick={() => setRooms(rs => rs.filter((_, x) => x !== i))}><X /></button></div>)}<button className="add-room" onClick={() => setRooms(rs => [...rs, { name: "", roomType: "" }])}><Plus />Quick Add Room</button></div><footer><button onClick={() => setScreen("details")}>Back</button><button onClick={onClose}>Save as Draft</button><button className="primary" onClick={saveRooms} disabled={saving}>{saving ? "Saving…" : "Continue"}</button></footer>{error && <p className="form-error">{error}</p>}</Modal>;
  return <Modal title="Create New Project" subtitle="Your project workspace is ready." onClose={onClose}><div className="success-panel"><div className="success-check"><Check /></div><h2>Project Created Successfully!</h2><p>{project?.name} is ready for BOQ creation.</p><dl><div><dt>Client</dt><dd>{project?.clientName}</dd></div><div><dt>Type</dt><dd>{project?.projectType}</dd></div><div><dt>Rooms</dt><dd>{rooms.filter(r => r.name.trim()).length}</dd></div><div><dt>Area</dt><dd>{project?.areaSqft ? `${project.areaSqft} sqft` : "—"}</dd></div></dl></div><footer><button onClick={() => onCreated("Project created.")}>Back to Projects</button><button className="primary" onClick={() => location.assign(`/projects/${project?.id}`)}>Open Project Workspace</button></footer></Modal>;
}
function Label({ text, required, children }: { text: string; required?: boolean; children: React.ReactNode }) { return <label>{text}{required && <em>*</em>}{children}</label>; }
function Steps({ current }: { current: number }) { return <div className="wizard-steps">{["Project Details", "Room Setup", "Room Config", "Requirements", "Materials"].map((x, i) => <div className={i + 1 <= current ? "done" : ""} key={x}><span>{i + 1 < current ? <Check /> : String(i + 1).padStart(2, "0")}</span><b>{x}</b></div>)}</div>; }
function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="project-modal-backdrop" onMouseDown={onClose}><section className={`project-modal ${wide ? "wide" : ""}`} onMouseDown={e => e.stopPropagation()}><header><div><h1>{title}</h1><p>{subtitle}</p></div><button onClick={onClose}><X /></button></header>{children}</section></div>; }
