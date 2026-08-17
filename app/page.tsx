"use client";

import {
  Bell, Building2, ChevronDown, ChevronRight, CircleHelp, Clock3, Copy,
  Download, FileText, FolderKanban, Gauge, LayoutDashboard, Menu, MoreHorizontal,
  Plus, Search, Settings, Sparkles, TrendingUp, Users, X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Project = {
  id: number;
  name: string;
  client: string;
  code: string;
  status: "In progress" | "Review" | "Draft";
  value: number;
  items: number;
  updated: string;
  progress: number;
  color: string;
};

const initialProjects: Project[] = [
  { id: 1, name: "Marina Heights", client: "Shoreline Developments", code: "QX-2401", status: "In progress", value: 2845000, items: 428, updated: "12 min ago", progress: 72, color: "#5a6cf0" },
  { id: 2, name: "The Grove Residences", client: "Hearthstone Group", code: "QX-2398", status: "Review", value: 1672000, items: 316, updated: "Yesterday", progress: 91, color: "#ee8c5b" },
  { id: 3, name: "Northstar Offices", client: "Axis Commercial", code: "QX-2387", status: "In progress", value: 4218000, items: 592, updated: "2 days ago", progress: 48, color: "#32a580" },
  { id: 4, name: "Willow Health Centre", client: "Civic Health Trust", code: "QX-2374", status: "Draft", value: 986400, items: 184, updated: "4 days ago", progress: 24, color: "#9a72e8" },
];

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);

export default function Dashboard() {
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All projects");
  const [modal, setModal] = useState(false);
  const [sidebar, setSidebar] = useState(false);

  const filtered = useMemo(() => projects.filter((project) => {
    const matchesQuery = `${project.name} ${project.client} ${project.code}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All projects" || project.status === filter;
    return matchesQuery && matchesFilter;
  }), [projects, query, filter]);

  function addProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "Untitled project");
    const client = String(data.get("client") || "New client");
    setProjects((current) => [{
      id: Date.now(), name, client, code: `QX-${2400 + current.length + 1}`,
      status: "Draft", value: 0, items: 0, updated: "Just now", progress: 8, color: "#5a6cf0",
    }, ...current]);
    setModal(false);
  }

  return (
    <div className="app-shell">
      {sidebar && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebar(false)} />}
      <aside className={`sidebar ${sidebar ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><span /></span><strong>quantix</strong></div>
        <button className="workspace"><span className="workspace-avatar">AC</span><span><small>Workspace</small><b>Atelier Costing</b></span><ChevronDown size={15} /></button>
        <nav>
          <NavItem icon={<LayoutDashboard />} label="Overview" active />
          <NavItem icon={<FolderKanban />} label="Projects" count="12" />
          <NavItem icon={<FileText />} label="Templates" />
          <NavItem icon={<Building2 />} label="Cost library" />
          <p className="nav-label">MANAGE</p>
          <NavItem icon={<Users />} label="Team" />
          <NavItem icon={<Gauge />} label="Reports" />
        </nav>
        <div className="sidebar-bottom">
          <div className="trial-card"><span><Sparkles size={16} /> Pro trial</span><b>9 days left</b><div><i /></div><button>View plans</button></div>
          <NavItem icon={<CircleHelp />} label="Help centre" />
          <NavItem icon={<Settings />} label="Settings" />
          <div className="profile"><span className="avatar">DK</span><span><b>Daniel Kim</b><small>Cost Consultant</small></span><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebar(true)}><Menu /></button>
          <div className="breadcrumbs"><span>Atelier Costing</span><ChevronRight size={15} /><b>Overview</b></div>
          <div className="top-actions"><button className="icon-btn"><Search size={19} /></button><button className="icon-btn notice"><Bell size={19} /><i /></button><button className="help-btn"><CircleHelp size={17} /> Help</button></div>
        </header>

        <section className="content">
          <div className="welcome-row">
            <div><p className="eyebrow">MONDAY, 17 AUGUST</p><h1>Good morning, Daniel.</h1><p>Here’s what’s happening across your estimates.</p></div>
            <button className="primary-btn" onClick={() => setModal(true)}><Plus size={18} /> New project</button>
          </div>

          <div className="stat-grid">
            <StatCard label="ACTIVE PROJECTS" value="12" note="2 added this month" icon={<FolderKanban />} trend />
            <StatCard label="TOTAL ESTIMATED VALUE" value="£12.8m" note="Across active projects" icon={<TrendingUp />} />
            <StatCard label="ITEMS PRICED" value="1,520" note="86% of total items" icon={<FileText />} ring />
            <StatCard label="AWAITING REVIEW" value="3" note="Requires your attention" icon={<Clock3 />} alert />
          </div>

          <section className="panel projects-panel">
            <div className="panel-head">
              <div><h2>Recent projects</h2><p>Your latest Bills of Quantities</p></div>
              <button className="text-btn">View all projects <ChevronRight size={16} /></button>
            </div>
            <div className="toolbar">
              <label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects..." /></label>
              <div className="filter-tabs">{["All projects", "In progress", "Review", "Draft"].map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "selected" : ""}>{item}</button>)}</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>PROJECT</th><th>STATUS</th><th>ESTIMATED VALUE</th><th>PROGRESS</th><th>LAST UPDATED</th><th /></tr></thead>
                <tbody>{filtered.map((project) => <tr key={project.id}>
                  <td><div className="project-cell"><span className="project-icon" style={{ background: `${project.color}14`, color: project.color }}><Building2 size={20} /></span><span><b>{project.name}</b><small>{project.code} · {project.client}</small></span></div></td>
                  <td><span className={`status ${project.status.toLowerCase().replace(" ", "-")}`}><i />{project.status}</span></td>
                  <td><b>{money(project.value)}</b><small className="block">{project.items} line items</small></td>
                  <td><div className="progress-cell"><div><i style={{ width: `${project.progress}%`, background: project.color }} /></div><span>{project.progress}%</span></div></td>
                  <td><span className="muted">{project.updated}</span></td>
                  <td><button className="row-action"><MoreHorizontal size={19} /></button></td>
                </tr>)}</tbody>
              </table>
              {!filtered.length && <div className="empty-state">No projects match your search.</div>}
            </div>
          </section>

          <div className="lower-grid">
            <section className="panel activity-panel"><div className="panel-head"><div><h2>Recent activity</h2><p>Updates from your team</p></div><button className="row-action"><MoreHorizontal /></button></div>
              <Activity initials="SM" color="#e8865f" text={<><b>Sarah Mitchell</b> updated pricing in <strong>Marina Heights</strong></>} time="18 min ago" />
              <Activity initials="JL" color="#4c9a80" text={<><b>James Lee</b> submitted <strong>The Grove Residences</strong> for review</>} time="2 hours ago" />
              <Activity initials="DK" color="#6372dc" text={<><b>You</b> imported 84 items to <strong>Northstar Offices</strong></>} time="Yesterday" />
            </section>
            <section className="panel quick-panel"><div className="panel-head"><div><h2>Quick actions</h2><p>Shortcuts to keep work moving</p></div></div>
              <button onClick={() => setModal(true)}><span><Plus /></span><div><b>Create a new project</b><small>Start a BOQ from scratch</small></div><ChevronRight /></button>
              <button><span><Copy /></span><div><b>Use a template</b><small>Build from your saved formats</small></div><ChevronRight /></button>
              <button><span><Download /></span><div><b>Import a spreadsheet</b><small>Upload XLSX or CSV</small></div><ChevronRight /></button>
            </section>
          </div>
        </section>
      </main>

      {modal && <div className="modal-backdrop" onMouseDown={() => setModal(false)}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><h2>Create project</h2><p>Set up a new Bill of Quantities.</p></div><button onClick={() => setModal(false)}><X /></button></div><form onSubmit={addProject}><label>Project name<input name="name" required autoFocus placeholder="e.g. Riverside Apartments" /></label><label>Client<input name="client" required placeholder="e.g. North & Co." /></label><div className="modal-actions"><button type="button" onClick={() => setModal(false)}>Cancel</button><button className="primary-btn" type="submit">Create project</button></div></form></div></div>}
    </div>
  );
}

function NavItem({ icon, label, active, count }: { icon: React.ReactNode; label: string; active?: boolean; count?: string }) {
  return <button className={`nav-item ${active ? "active" : ""}`}><span>{icon}</span>{label}{count && <small>{count}</small>}</button>;
}

function StatCard({ label, value, note, icon, trend, ring, alert }: { label: string; value: string; note: string; icon: React.ReactNode; trend?: boolean; ring?: boolean; alert?: boolean }) {
  return <div className="stat-card"><div className={`stat-icon ${alert ? "alert" : ""}`}>{icon}</div><p>{label}</p><div className="stat-value"><b>{value}</b>{ring && <span className="mini-ring">86%</span>}</div><small className={trend ? "positive" : ""}>{trend && <span>↗ 8.4%</span>} {note}</small></div>;
}

function Activity({ initials, color, text, time }: { initials: string; color: string; text: React.ReactNode; time: string }) {
  return <div className="activity"><span className="activity-avatar" style={{ background: `${color}1c`, color }}>{initials}</span><div><p>{text}</p><small>{time}</small></div></div>;
}
