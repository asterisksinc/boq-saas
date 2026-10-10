"use client";

import { Check, ChevronDown, MoreHorizontal, Plus, X, ArrowLeft, Home, User, MapPin, Calendar, Briefcase, Search, Minus, Info, RefreshCcw, Edit2, Trash2, Copy } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, useCallback } from "react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";

export type Project = {
  id: string;
  projectCode?: string | null;
  name: string;
  clientName: string;
  clientContact?: string | null;
  projectType: string;
  status: string;
  location?: string | null;
  description?: string | null;
  areaSqft?: number | null;
  projectValue?: number | null;
  approvedBudget?: number | null;
  startDate?: string | null;
  targetCompletionDate?: string | null;
  progress?: number | null;
  imageUrl?: string | null;
  boqsCount?: number;
  margin?: number | null;
  estimatedValue?: number | null;
  totalCost?: number | null;
  rooms?: ProjectRoom[];
};

export type ProjectRequirement = {
  id: string;
  roomId?: string;
  name: string;
  category?: string;
  length?: number | null;
  depth?: number | null;
  breadth?: number | null;
  height?: number | null;
  unit?: string;
  quantity?: number;
  partitions?: number;
  notes?: string;
  referenceImageUrl?: string | null;
  materialId?: string | null;
  materialName?: string | null;
  materialRate?: number | null;
  materialUnit?: string | null;
  materialCategory?: string | null;
  materialStatus?: "PENDING" | "SELECTED";
};

export type ProjectRoom = {
  id?: string;
  projectId?: string;
  name: string;
  roomType: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  unit?: string;
  notes?: string | null;
  referenceImageUrl?: string | null;
  status?: string;
  isConfigured?: boolean;
  requirementsCount?: number;
  requirements?: ProjectRequirement[];
};

type Form = {
  name: string;
  clientName: string;
  clientContact: string;
  projectType: string;
  status: string;
  location: string;
  description: string;
  areaSqft: string;
  projectValue: string;
  startDate: string;
  targetCompletionDate: string;
};

const blankForm: Form = {
  name: "",
  clientName: "",
  clientContact: "",
  projectType: "Residential",
  status: "planning",
  location: "",
  description: "",
  areaSqft: "",
  projectValue: "",
  startDate: "",
  targetCompletionDate: "",
};

const message = (x: unknown, fallback: string) =>
  (x as { error?: { message?: string }; message?: string })?.error?.message ||
  (x as { message?: string })?.message ||
  fallback;

const money = (n?: number | null) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const date = (x?: string | null) =>
  x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${x}T00:00:00`)) : "—";

const label = (x: string) => x.replace(/_/g, " ");

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuState, setMenuState] = useState<{
    project: Project;
    anchorRect: { top: number; bottom: number; left: number; right: number };
  } | null>(null);
  const [create, setCreate] = useState(false);
  const [createScreen, setCreateScreen] = useState<string>("choice");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [wizardProject, setWizardProject] = useState<Project | null>(null);
  const [remove, setRemove] = useState<Project | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ totalProjects: number; totalEstimatedValue: number } | null>(null);

  const filterWrapRef = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ pageSize: "100" });
      if (query.trim()) p.set("search", query.trim());
      if (filter !== "all") p.set("status", filter);
      const r = await fetch(`/api/v1/projects?${p}`, { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Projects could not be loaded."));
      setProjects(b.data?.items || []);
      if (b.data?.summary) {
        setSummary(b.data.summary);
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Projects could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [query, filter]);

  useEffect(() => {
    const handleFocus = () => {
      load();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [load]);

  useEffect(() => {
    const id = setTimeout(() => {
      load();
    }, query ? 250 : 0);
    return () => clearTimeout(id);
  }, [load, query, filter]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get("status");
      if (s && ["active", "planning", "in_progress", "on_hold", "completed"].includes(s)) {
        setFilter(s);
      }
      const q = sp.get("search");
      if (q) setQuery(q);
      if (sp.get("create") === "true" || sp.get("new") === "true") {
        setWizardProject(null);
        setCreateScreen("choice");
        setCreate(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (filter !== "all") url.searchParams.set("status", filter);
    else url.searchParams.delete("status");
    if (query.trim()) url.searchParams.set("search", query.trim());
    else url.searchParams.delete("search");
    window.history.replaceState(null, "", url.toString());
  }, [filter, query]);

  useEffect(() => {
    const handleScrollResize = () => setMenuState(null);
    window.addEventListener("scroll", handleScrollResize, true);
    window.addEventListener("resize", handleScrollResize);
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize);
    };
  }, []);

  const toggleMenu = (p: Project, btn: HTMLElement) => {
    if (menuState?.project.id === p.id) {
      setMenuState(null);
    } else {
      const rect = btn.getBoundingClientRect();
      setMenuState({
        project: p,
        anchorRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        },
      });
    }
  };

  useEffect(() => {
    fetch("/api/v1/users/me/preferences", { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const pv = b?.data?.projectView || b?.data?.project_view;
        if (pv === "card") setView("grid");
        else if (pv === "table") setView("list");
      })
      .catch(() => {});
  }, []);

  const changeView = (nextView: "list" | "grid") => {
    setView(nextView);
    fetch("/api/v1/users/me/preferences", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectView: nextView === "grid" ? "card" : "table" }),
    }).catch(() => {});
  };

  const total = useMemo(
    () => summary?.totalEstimatedValue ?? projects.reduce((s, p) => s + (p.estimatedValue ?? p.approvedBudget ?? p.projectValue ?? 0), 0),
    [summary, projects]
  );
  const projectCount = summary?.totalProjects ?? projects.length;

  const status = async (project: Project, next: string) => {
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) {
        setNotice(message(await r.json(), "Project status could not be changed."));
      } else {
        setMenuState(null);
        setNotice(`Project status changed to ${label(next)}.`);
        load();
      }
    } catch {
      setNotice("Failed to update project status.");
    }
  };

  const archive = async (project: Project) => {
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/archive`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        setNotice(message(await r.json(), "Project could not be archived."));
      } else {
        setMenuState(null);
        setNotice("Project archived.");
        load();
      }
    } catch {
      setNotice("Failed to archive project.");
    }
  };

  const duplicate = async (project: Project) => {
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        setNotice(message(await r.json(), "Project could not be duplicated."));
      } else {
        setMenuState(null);
        setNotice("Project duplicated.");
        load();
      }
    } catch {
      setNotice("Failed to duplicate project.");
    }
  };

  const del = async () => {
    if (!remove) return;
    try {
      const r = await fetch(`/api/v1/projects/${remove.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        setNotice(message(await r.json(), "Project could not be deleted."));
      } else {
        setRemove(null);
        setNotice("Project deleted.");
        load();
      }
    } catch {
      setNotice("Failed to delete project.");
    }
  };

  const exportFile = async () => {
    try {
      const r = await fetch("/api/v1/projects/export", { credentials: "include" });
      if (!r.ok) return setNotice("Export is unavailable right now.");
      const b = await r.blob(),
        u = URL.createObjectURL(b),
        a = document.createElement("a");
      a.href = u;
      a.download = "projects.xlsx";
      a.click();
      URL.revokeObjectURL(u);
    } catch {
      setNotice("Failed to export projects.");
    }
  };

  const exportSingleProject = async (project: Project) => {
    try {
      const r = await fetch(`/api/v1/projects/export?projectId=${encodeURIComponent(project.id)}`, {
        credentials: "include",
      });
      if (!r.ok) return setNotice("Export is unavailable right now.");
      const b = await r.blob(),
        u = URL.createObjectURL(b),
        a = document.createElement("a");
      a.href = u;
      a.download = `${project.name || "project"}.xlsx`;
      a.click();
      URL.revokeObjectURL(u);
    } catch {
      setNotice("Failed to export project.");
    }
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const data = new FormData();
    data.append("file", selected);
    try {
      const r = await fetch("/api/v1/projects/imports?skipInvalid=true", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      e.target.value = "";
      const b = await r.json();
      if (!r.ok) setNotice(message(b, "Spreadsheet could not be imported."));
      else {
        setNotice(`${b.data?.projects?.length || 0} project(s) imported.`);
        load();
      }
    } catch {
      setNotice("Failed to import projects.");
    }
  };

  const openEditDetails = (p: Project) => {
    setMenuState(null);
    setEditingProject(p);
  };

  const resumeWizard = (p: Project, step = "rooms") => {
    setWizardProject(p);
    setCreateScreen(step);
    setCreate(true);
  };

  const menuWidth = 205;
  const menuHeight = 370;
  const anchor = menuState?.anchorRect;
  let menuLeft = (anchor?.right ?? 0) - menuWidth;
  if (typeof window !== "undefined") {
    if (menuLeft < 10) menuLeft = 10;
    if (menuLeft + menuWidth > window.innerWidth - 10) {
      menuLeft = window.innerWidth - menuWidth - 10;
    }
  }
  const spaceBelow = typeof window !== "undefined" ? window.innerHeight - (anchor?.bottom ?? 0) : 500;
  const opensUp = spaceBelow < menuHeight && (anchor?.top ?? 0) > menuHeight;
  const menuTop = opensUp
    ? Math.max(10, (anchor?.top ?? 0) - menuHeight - 4)
    : (anchor?.bottom ?? 0) + 4;

  return (
    <main className="fig-dashboard boq-dashboard project-ui">
      <div className="fig-dashboard-glow" />
      <DashboardRail />
      <div className="fig-dashboard-main">
        <DashboardHeader
          title="Projects"
          onNew={() => {
            setWizardProject(null);
            setCreateScreen("choice");
            setCreate(true);
          }}
        />

        {(!create || createScreen === "choice") && (
          <section className="boq-page-shell projects-content">
            <div className="projects-title">
              <div>
                <h2>All Projects</h2>
                <p>
                  {projectCount} projects | {total >= 10000000 ? `₹${(total / 10000000).toFixed(2)}Cr` : money(total)} total estimated value
                </p>
              </div>
              <div className="projects-actions">
                <button onClick={() => file.current?.click()}>Import Excel</button>
                <input ref={file} type="file" accept=".xlsx,.xls,.csv" onChange={importFile} style={{ display: "none" }} />
                <button onClick={exportFile}>Export Excel</button>
                <button
                  className="primary"
                  onClick={() => {
                    setWizardProject(null);
                    setCreateScreen("choice");
                    setCreate(true);
                  }}
                >
                  <Plus size={16} />
                  New Project
                </button>
              </div>
            </div>

            <div className="projects-toolbar">
              <label className="projects-search">
                <img src="/assets/dashboard/dashboard-search.svg" alt="" style={{ width: 15, height: 15 }} />
                <input
                  placeholder="Search projects or clients…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>

              <div className="filter-wrap" ref={filterWrapRef}>
                <button
                  type="button"
                  className={filter !== "all" ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFilterOpen((prev) => !prev);
                  }}
                >
                  <img src="/assets/projects/filter-icon.svg" alt="" style={{ width: 16, height: 16 }} />
                  Filter {filter !== "all" ? `(${label(filter)})` : ""}
                </button>
                {filterOpen && (
                  <>
                    <div
                      className="filter-menu-backdrop"
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 998,
                        background: "transparent",
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFilterOpen(false);
                      }}
                    />
                    <div
                      className="filter-menu"
                      style={{
                        position: "absolute",
                        zIndex: 1000,
                        left: 0,
                        top: 46,
                        boxShadow: "0 12px 30px rgba(30, 52, 85, 0.2)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <b>Project status</b>
                      {[
                        { key: "all", labelText: "All statuses" },
                        { key: "active", labelText: "Active" },
                        { key: "planning", labelText: "Planning" },
                        { key: "in_progress", labelText: "In Progress" },
                        { key: "on_hold", labelText: "On Hold" },
                        { key: "completed", labelText: "Completed" },
                      ].map(({ key, labelText }) => (
                        <button
                          key={key}
                          type="button"
                          className={filter === key ? "selected-option" : ""}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFilter(key);
                            setFilterOpen(false);
                          }}
                        >
                          <span style={{ width: 16, display: "inline-flex", alignItems: "center" }}>
                            {filter === key && <Check size={14} color="#2865e8" />}
                          </span>
                          {labelText}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="view-switch">
                <button
                  type="button"
                  title="List view"
                  className={view === "list" ? "active" : ""}
                  onClick={() => changeView("list")}
                >
                  <img src="/assets/projects/view-list.svg" alt="List view" width={20} height={20} />
                </button>
                <button
                  type="button"
                  title="Grid view"
                  className={view === "grid" ? "active" : ""}
                  onClick={() => changeView("grid")}
                >
                  <img src="/assets/projects/view-grid.svg" alt="Grid view" width={20} height={20} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="projects-empty">Loading projects…</div>
            ) : !projects.length ? (
              filter !== "all" || query.trim() ? (
                <div className="projects-empty">
                  <img src="/assets/projects/filter-icon.svg" alt="" style={{ width: 36, height: 36, opacity: 0.4 }} />
                  <h3>No matching projects found</h3>
                  <p>
                    {query.trim() && filter !== "all"
                      ? `No projects matching "${query}" with status "${label(filter)}".`
                      : query.trim()
                      ? `No projects matching "${query}".`
                      : `No projects found with status "${label(filter)}".`}
                  </p>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      setFilter("all");
                      setQuery("");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <Empty
                  onCreate={() => {
                    setWizardProject(null);
                    setCreateScreen("choice");
                    setCreate(true);
                  }}
                />
              )
            ) : view === "grid" ? (
              <Grid
                projects={projects}
                activeMenuId={menuState?.project.id ?? null}
                toggleMenu={toggleMenu}
              />
            ) : (
              <Table
                projects={projects}
                activeMenuId={menuState?.project.id ?? null}
                toggleMenu={toggleMenu}
              />
            )}
          </section>
        )}

        {menuState && (
          <>
            <div
              className="project-menu-backdrop"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
                background: "transparent",
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuState(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuState(null);
              }}
            />
            <div
              className="project-menu"
              style={{
                position: "fixed",
                top: `${menuTop}px`,
                left: `${menuLeft}px`,
                zIndex: 9999,
                boxShadow: "0 14px 35px rgba(27, 46, 75, 0.22)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Menu
                project={menuState.project}
                status={status}
                archive={archive}
                duplicate={duplicate}
                remove={setRemove}
                exportProject={exportSingleProject}
                openEdit={openEditDetails}
                closeMenu={() => setMenuState(null)}
              />
            </div>
          </>
        )}

        {create && (
          <Create
            initialProject={wizardProject}
            screen={createScreen}
            setScreen={setCreateScreen}
            onClose={() => {
              setCreate(false);
              setWizardProject(null);
            }}
            onCreated={(x) => {
              setCreate(false);
              setWizardProject(null);
              setNotice(x);
              load();
            }}
          />
        )}
      </div>

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={(msg) => {
            setEditingProject(null);
            setNotice(msg);
            load();
          }}
          onConfigureRooms={(p) => {
            setEditingProject(null);
            resumeWizard(p, "rooms");
          }}
        />
      )}

      {remove && (
        <Modal title="Delete Project?" subtitle="This action cannot be undone." onClose={() => setRemove(null)}>
          <div className="delete-copy">
            <img src="/assets/projects/menu-delete.svg" alt="" style={{ width: 20, height: 20 }} />
            <p>
              Delete <b>{remove.name}</b>? Dependent records may prevent deletion.
            </p>
          </div>
          <footer>
            <button onClick={() => setRemove(null)}>Cancel</button>
            <button className="danger-button" onClick={del}>
              Delete Project
            </button>
          </footer>
        </Modal>
      )}

      {notice && (
        <div className="projects-toast">
          {notice}
          <button onClick={() => setNotice(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </main>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="projects-empty">
      <img src="/assets/projects/menu-open.svg" alt="" style={{ width: 40, height: 40, opacity: 0.5 }} />
      <h3>No projects yet</h3>
      <p>Create your first project to start building BOQs.</p>
      <button className="primary" onClick={onCreate}>
        <Plus size={16} />
        New Project
      </button>
    </div>
  );
}

function Table({
  projects,
  activeMenuId,
  toggleMenu,
}: {
  projects: Project[];
  activeMenuId: string | null;
  toggleMenu: (p: Project, btn: HTMLElement) => void;
}) {
  return (
    <div className="projects-table-wrap">
      <table className="projects-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>PROJECT</th>
            <th>TYPE</th>
            <th>STATUS</th>
            <th>DESIGNER</th>
            <th>BOQS</th>
            <th>MARGIN</th>
            <th>PROGRESS</th>
            <th>DUE DATE</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => {
            return (
              <tr key={p.id} onClick={() => location.assign(`/projects/${p.id}`)}>
                <td>{p.projectCode || `PRJ-${String(i + 1).padStart(4, "0")}`}</td>
                <td>
                  <b>{p.name}</b>
                  <small>{p.clientName}{p.areaSqft ? ` · ${p.areaSqft.toLocaleString("en-IN")} sqft` : ""}</small>
                </td>
                <td>{p.projectType}</td>
                <td>
                  <span className={`project-status ${p.status}`}>{label(p.status)}</span>
                </td>
                <td>
                  <span className="designer-dot">{(p.clientName || "UN").slice(0, 2).toUpperCase()}</span>
                  <span className="designer-name">{p.clientName?.split(" ")[0] || "Unassigned"}</span>
                </td>
                <td>{p.boqsCount ?? 0}</td>
                <td>{p.margin != null ? `${p.margin}%` : "—"}</td>
                <td>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-valuenow={p.progress || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Project progress: ${p.progress || 0}%`}
                  >
                    <i style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%` }} />
                    <span>{p.progress || 0}%</span>
                  </div>
                </td>
                <td>{date(p.targetCompletionDate)}</td>
                <td className="menu-cell" onClick={(e) => e.stopPropagation()}>
                  <div className="menu-cell-inner">
                    <button
                      type="button"
                      className={`more-button ${activeMenuId === p.id ? "active" : ""}`}
                      title="More actions"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleMenu(p, e.currentTarget);
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Grid({
  projects,
  activeMenuId,
  toggleMenu,
}: {
  projects: Project[];
  activeMenuId: string | null;
  toggleMenu: (p: Project, btn: HTMLElement) => void;
}) {
  return (
    <div className="project-grid">
      {projects.map((p) => {
        return (
          <div key={p.id} className="project-card" onClick={() => location.assign(`/projects/${p.id}`)}>
            <div className="project-card-header">
              <div>
                <h3 title={`${p.name}${p.location ? ` — ${p.location}` : ""}`}>
                  {p.name}
                  {p.location ? ` — ${p.location}` : ""}
                </h3>
                <p className="card-code">{p.projectCode || "PRJ-0001"}</p>
              </div>
              <div className="project-card-header-right" onClick={(e) => e.stopPropagation()}>
                <span className={`project-status ${p.status}`}>{label(p.status)}</span>
                <button
                  type="button"
                  className={`more-button ${activeMenuId === p.id ? "active" : ""}`}
                  title="More actions"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu(p, e.currentTarget);
                  }}
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
            <div className="project-card-details">
              <div>
                <span className="project-card-detail-label">Client Name</span>
                <span className="project-card-detail-value" title={p.clientName}>{p.clientName}</span>
              </div>
              <div>
                <span className="project-card-detail-label">Square Foot</span>
                <span className="project-card-detail-value">{p.areaSqft ? `${p.areaSqft.toLocaleString("en-IN")} sqft` : "—"}</span>
              </div>
              <div>
                <span className="project-card-detail-label">Type</span>
                <span className="project-card-detail-value" title={p.projectType}>{p.projectType}</span>
              </div>
              <div>
                <span className="project-card-detail-label">Designer</span>
                <span className="project-card-detail-value" title={p.clientName?.split(" ")[0] || "Unassigned"}>{p.clientName?.split(" ")[0] || "Unassigned"}</span>
              </div>
              <div>
                <span className="project-card-detail-label">BOQs</span>
                <span className="project-card-detail-value">{p.boqsCount ?? 0}</span>
              </div>
              <div>
                <span className="project-card-detail-label">Margin</span>
                <span className="project-card-detail-value">{p.margin != null ? `${p.margin}%` : "—"}</span>
              </div>
            </div>
            <div className="project-card-footer">
              <div className="project-card-footer-left">
                <span className="project-card-detail-label">Due Date</span>
                <span className="project-card-detail-value">{date(p.targetCompletionDate)}</span>
              </div>
              <div className="project-card-footer-right">
                <span className="project-card-detail-label">Progress</span>
                <div className="card-progress">
                  <div
                    className="card-progress-bar"
                    role="progressbar"
                    aria-valuenow={p.progress || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Project progress: ${p.progress || 0}%`}
                  >
                    <i style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%` }} />
                  </div>
                  <span className="card-progress-pct">{p.progress || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Menu({
  project,
  status,
  archive,
  duplicate,
  remove,
  exportProject,
  openEdit,
  closeMenu,
}: {
  project: Project;
  status: (p: Project, x: string) => void;
  archive: (p: Project) => void;
  duplicate: (p: Project) => void;
  remove: (p: Project) => void;
  exportProject: (p: Project) => void;
  openEdit: (p: Project) => void;
  closeMenu: () => void;
}) {
  const go = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    location.assign(path);
  };

  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    fn();
  };

  return (
    <>
      <button type="button" onClick={go(`/projects/${project.id}`)}>
        <img src="/assets/projects/menu-open.svg" alt="" width={18} height={18} />
        Open Project
      </button>
      <button type="button" onClick={act(() => openEdit(project))}>
        <img src="/assets/projects/menu-edit.svg" alt="" width={18} height={18} />
        Edit Details
      </button>
      <button type="button" onClick={go(`/boqs?projectId=${project.id}`)}>
        <img src="/assets/projects/menu-create-boq.svg" alt="" width={18} height={18} />
        Create BOQ
      </button>
      <button type="button" onClick={act(() => duplicate(project))}>
        <img src="/assets/projects/menu-duplicate.svg" alt="" width={18} height={18} />
        Duplicate Project
      </button>
      <button type="button" onClick={act(() => exportProject(project))}>
        <img src="/assets/projects/menu-export.svg" alt="" width={18} height={18} />
        Export
      </button>
      <button
        type="button"
        onClick={act(() => status(project, project.status === "on_hold" ? "active" : "on_hold"))}
      >
        <img src="/assets/projects/menu-hold.svg" alt="" width={18} height={18} />
        {project.status === "on_hold" ? "Resume Project" : "Put On Hold"}
      </button>
      <button type="button" onClick={act(() => status(project, "completed"))}>
        <img src="/assets/projects/menu-complete.svg" alt="" width={18} height={18} />
        Mark Completed
      </button>
      <button type="button" onClick={act(() => archive(project))}>
        <img src="/assets/projects/menu-archive.svg" alt="" width={18} height={18} />
        Archive Project
      </button>
      <button type="button" className="danger" onClick={act(() => remove(project))}>
        <img src="/assets/projects/menu-delete.svg" alt="" width={18} height={18} />
        Delete Project
      </button>
    </>
  );
}

function EditProjectModal({
  project,
  onClose,
  onSaved,
  onConfigureRooms,
}: {
  project: Project;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onConfigureRooms: (p: Project) => void;
}) {
  const [form, setForm] = useState<Form>({
    name: project.name || "",
    clientName: project.clientName || "",
    clientContact: project.clientContact || "",
    projectType: project.projectType || "Residential",
    status: project.status || "planning",
    location: project.location || "",
    description: project.description || "",
    areaSqft: project.areaSqft ? String(project.areaSqft) : "",
    projectValue: project.projectValue ? String(project.projectValue) : "",
    startDate: project.startDate ? project.startDate.split("T")[0] : "",
    targetCompletionDate: project.targetCompletionDate ? project.targetCompletionDate.split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const change = (key: keyof Form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      clientName: form.clientName.trim(),
      clientContact: form.clientContact.trim() || null,
      projectType: form.projectType,
      status: form.status,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      projectValue: form.projectValue ? Number(form.projectValue) : null,
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
      const data = await res.json();
      if (!res.ok) throw new Error(message(data, "Failed to update project."));
      onSaved("Project details updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Project Details" subtitle="Update details or continue room configuration." onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="project-form">
        <fieldset>
          <legend>Project Details</legend>
          <Label text="Project Name" required>
            <input required value={form.name} onChange={(e) => change("name", e.target.value)} />
          </Label>
        </fieldset>

        <fieldset>
          <legend>Client Information</legend>
          <div className="form-grid">
            <Label text="Client Name" required>
              <input required value={form.clientName} onChange={(e) => change("clientName", e.target.value)} />
            </Label>
            <Label text="Client Contact">
              <input value={form.clientContact} onChange={(e) => change("clientContact", e.target.value)} />
            </Label>
            <Label text="Project Type" required>
              <select required value={form.projectType} onChange={(e) => change("projectType", e.target.value)}>
                <option>Residential</option>
                <option>Commercial</option>
                <option>Retail</option>
                <option>Hospitality</option>
              </select>
            </Label>
            <Label text="Project Status">
              <div className="status-radios">
                {[
                  { val: "planning", text: "Planning" },
                  { val: "in_progress", text: "In Progress" },
                  { val: "on_hold", text: "On Hold" },
                  { val: "completed", text: "Completed" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    className={form.status === s.val ? "active" : ""}
                    onClick={() => change("status", s.val)}
                  >
                    <i /> {s.text}
                  </button>
                ))}
              </div>
            </Label>
          </div>
        </fieldset>

        <fieldset>
          <div className="form-grid">
            <Label text="Location">
              <input value={form.location} onChange={(e) => change("location", e.target.value)} />
            </Label>
            <Label text="Area (sqft)">
              <input type="number" min="1" value={form.areaSqft} onChange={(e) => change("areaSqft", e.target.value)} />
            </Label>
          </div>
          <Label text="Project Scope / Description">
            <textarea rows={3} value={form.description} onChange={(e) => change("description", e.target.value)} />
          </Label>
        </fieldset>

        <fieldset>
          <legend>Timeline</legend>
          <div className="form-grid">
            <Label text="Start Date">
              <input type="date" value={form.startDate} onChange={(e) => change("startDate", e.target.value)} />
            </Label>
            <Label text="Target Completion">
              <input
                type="date"
                min={form.startDate || undefined}
                value={form.targetCompletionDate}
                onChange={(e) => change("targetCompletionDate", e.target.value)}
              />
            </Label>
          </div>
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <footer style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button
            type="button"
            onClick={() => onConfigureRooms(project)}
            style={{
              padding: "8px 14px",
              background: "#eff6ff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Configure Rooms in Wizard →
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}

function Create({
  initialProject,
  screen,
  setScreen,
  onClose,
  onCreated,
}: {
  initialProject?: Project | null;
  screen: string;
  setScreen: (s: string) => void;
  onClose: () => void;
  onCreated: (x: string) => void;
}) {
  const [method, setMethod] = useState("scratch");
  const [form, setForm] = useState<Form>(blankForm);
  const [project, setProject] = useState<Project | null>(initialProject || null);
  const [rooms, setRooms] = useState<ProjectRoom[]>([
    { name: "Master Bedroom", roomType: "Master Bedroom", unit: "ft" },
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [roomSearch, setRoomSearch] = useState("");
  const [roomCategoryFilter, setRoomCategoryFilter] = useState("All Category");

  const [addingRequirement, setAddingRequirement] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [activeReqMenu, setActiveReqMenu] = useState<string | null>(null);

  const [reqForm, setReqForm] = useState<{
    name: string;
    category: string;
    length: string;
    depth: string;
    height: string;
    unit: string;
    quantity: number;
    partitions: number;
    notes: string;
  }>({
    name: "Wardrobe",
    category: "Storage",
    length: "8",
    depth: "2",
    height: "8",
    unit: "Unit",
    quantity: 1,
    partitions: 4,
    notes: "",
  });

  const [activeMaterialReqId, setActiveMaterialReqId] = useState<string | null>(null);
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialsCatalog, setMaterialsCatalog] = useState<any[]>([]);
  const [selectedMaterialForAssign, setSelectedMaterialForAssign] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      setForm({
        name: initialProject.name || "",
        clientName: initialProject.clientName || "",
        clientContact: initialProject.clientContact || "",
        projectType: initialProject.projectType || "Residential",
        status: initialProject.status || "planning",
        location: initialProject.location || "",
        description: initialProject.description || "",
        areaSqft: initialProject.areaSqft ? String(initialProject.areaSqft) : "",
        projectValue: initialProject.projectValue ? String(initialProject.projectValue) : "",
        startDate: initialProject.startDate ? initialProject.startDate.split("T")[0] : "",
        targetCompletionDate: initialProject.targetCompletionDate ? initialProject.targetCompletionDate.split("T")[0] : "",
      });
      fetch(`/api/v1/projects/${initialProject.id}/rooms`, { credentials: "include" })
        .then((r) => r.json())
        .then((b) => {
          if (b.data?.items?.length) {
            setRooms(b.data.items);
          }
        })
        .catch(() => {});
    }
  }, [initialProject]);

  const loadProjectRooms = useCallback(async (projId: string) => {
    try {
      const r = await fetch(`/api/v1/projects/${projId}/rooms`, { credentials: "include" });
      const b = await r.json();
      if (r.ok && b.data?.items) {
        setRooms(b.data.items);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (project?.id && (screen === "roomConfig" || screen === "requirements" || screen === "materials")) {
      loadProjectRooms(project.id);
    }
  }, [project?.id, screen, loadProjectRooms]);

  useEffect(() => {
    if (screen === "materials") {
      fetch("/api/v1/costing/items?pageSize=50", { credentials: "include" })
        .then((r) => r.json())
        .then((b) => {
          if (b.data?.items) {
            setMaterialsCatalog(b.data.items);
          }
        })
        .catch(() => {});
    }
  }, [screen]);

  const change = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const activeRoom = useMemo(() => {
    return rooms[activeRoomIndex] || rooms[0] || { name: "Room", roomType: "Master Bedroom", unit: "ft" };
  }, [rooms, activeRoomIndex]);

  const updateActiveRoomField = (field: keyof ProjectRoom, val: any) => {
    setRooms((prev) =>
      prev.map((r, i) => (i === activeRoomIndex ? { ...r, [field]: val } : r))
    );
  };

  const configuredCount = useMemo(() => {
    return rooms.filter((r) => (Number(r.length) > 0 && Number(r.width) > 0) || r.isConfigured).length;
  }, [rooms]);

  const allRequirementsAcrossRooms = useMemo(() => {
    const list: Array<{ room: ProjectRoom; req: ProjectRequirement }> = [];
    rooms.forEach((rm) => {
      (rm.requirements || []).forEach((rq) => {
        list.push({ room: rm, req: rq });
      });
    });
    return list;
  }, [rooms]);

  useEffect(() => {
    if (screen === "materials" && !activeMaterialReqId && allRequirementsAcrossRooms.length > 0) {
      setActiveMaterialReqId(allRequirementsAcrossRooms[0].req.id);
    }
  }, [screen, activeMaterialReqId, allRequirementsAcrossRooms]);

  const activeReqForMaterial = useMemo(() => {
    if (!activeMaterialReqId) return allRequirementsAcrossRooms[0] || null;
    return allRequirementsAcrossRooms.find((x) => x.req.id === activeMaterialReqId) || allRequirementsAcrossRooms[0] || null;
  }, [activeMaterialReqId, allRequirementsAcrossRooms]);

  const availableCategories = useMemo(() => {
    const defaultTypes = [
      "All Category",
      "Master Bedroom",
      "Bedroom",
      "Living Room",
      "Dining Room",
      "Kitchen",
      "Study Room",
      "Guest Bedroom",
      "Bathroom",
      "Balcony",
    ];
    const roomTypes = rooms.map((r) => r.roomType).filter(Boolean);
    return Array.from(new Set([...defaultTypes, ...roomTypes]));
  }, [rooms]);

  const filteredRoomRows = useMemo(() => {
    return rooms
      .map((room, originalIndex) => ({ room, originalIndex }))
      .filter(({ room }) => {
        const matchesCategory =
          roomCategoryFilter === "All Category" ||
          (room.roomType && room.roomType.toLowerCase() === roomCategoryFilter.toLowerCase()) ||
          (room.name && room.name.toLowerCase().includes(roomCategoryFilter.toLowerCase()));
        const matchesSearch =
          !roomSearch.trim() ||
          room.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
          (room.roomType && room.roomType.toLowerCase().includes(roomSearch.toLowerCase()));
        return matchesCategory && matchesSearch;
      });
  }, [rooms, roomCategoryFilter, roomSearch]);

  const submitProjectDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...form,
      name: form.name.trim(),
      clientName: form.clientName.trim(),
      clientContact: form.clientContact.trim() || null,
      description: form.description.trim() || null,
      location: form.location.trim() || undefined,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      projectValue: form.projectValue ? Number(form.projectValue) : null,
      startDate: form.startDate || null,
      targetCompletionDate: form.targetCompletionDate || null,
    };

    try {
      let currentProj = project;
      if (currentProj?.id) {
        const r = await fetch(`/api/v1/projects/${currentProj.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Project could not be updated."));
        currentProj = b.data;
        setProject(currentProj);
      } else {
        const r = await fetch("/api/v1/projects", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Project could not be created."));
        currentProj = b.data;
        setProject(currentProj);
      }

      if (coverFile && currentProj?.id) {
        try {
          const fr = await fetch("/api/v1/document-folders", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Project Assets", parentId: null }),
          });
          const fb = await fr.json();
          if (fr.ok && fb.data?.id) {
            const d = new FormData();
            d.append("file", coverFile);
            d.append("folderId", fb.data.id);
            d.append("projectId", currentProj.id);
            d.append("projectName", currentProj.name);
            const ur = await fetch("/api/v1/documents/upload", {
              method: "POST",
              credentials: "include",
              body: d,
            });
            const ub = await ur.json();
            if (ur.ok && ub.data?.id) {
              await fetch(`/api/v1/projects/${currentProj.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: `/api/v1/documents/${ub.data.id}/download` }),
              });
            }
          }
        } catch (err) {
          console.error("Cover upload failed", err);
        }
      }

      setScreen("rooms");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Project could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const persistAllRoomsDraft = async () => {
    if (!project?.id) return;
    for (let i = 0; i < rooms.length; i++) {
      const rm = rooms[i];
      if (!rm.name.trim()) continue;
      try {
        if (rm.id) {
          await fetch(`/api/v1/projects/${project.id}/rooms/${rm.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: rm.name.trim(),
              roomType: rm.roomType.trim() || rm.name.trim(),
              length: rm.length ? Number(rm.length) : null,
              width: rm.width ? Number(rm.width) : null,
              height: rm.height ? Number(rm.height) : null,
              unit: rm.unit || "ft",
              notes: rm.notes || null,
            }),
          });
        } else {
          const res = await fetch(`/api/v1/projects/${project.id}/rooms`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: rm.name.trim(),
              roomType: rm.roomType.trim() || rm.name.trim(),
              length: rm.length ? Number(rm.length) : null,
              width: rm.width ? Number(rm.width) : null,
              height: rm.height ? Number(rm.height) : null,
              unit: rm.unit || "ft",
              notes: rm.notes || null,
            }),
          });
          const b = await res.json();
          if (res.ok && b.data?.id) {
            setRooms((prev) => prev.map((r, idx) => (idx === i ? { ...r, id: b.data.id } : r)));
          }
        }
      } catch {}
    }
  };

  const continueFromRoomSetup = async () => {
    if (!project) return;
    setSaving(true);
    setError("");
    try {
      const updatedRooms = [...rooms];
      for (let i = 0; i < updatedRooms.length; i++) {
        const rm = updatedRooms[i];
        if (!rm.name.trim()) continue;
        if (!rm.id) {
          const r = await fetch(`/api/v1/projects/${project.id}/rooms`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: rm.name.trim(),
              roomType: rm.roomType.trim() || rm.name.trim(),
              unit: rm.unit || "ft",
            }),
          });
          const b = await r.json();
          if (!r.ok) throw new Error(message(b, "A room could not be created."));
          updatedRooms[i] = { ...rm, id: b.data.id, isConfigured: b.data.isConfigured };
        }
      }
      setRooms(updatedRooms);
      setActiveRoomIndex(0);
      setScreen("roomConfig");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Rooms could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const saveSingleActiveRoom = async () => {
    if (!project?.id) return;
    setSaving(true);
    setError("");

    const targetRoom = activeRoom;
    const l = targetRoom.length ? Number(targetRoom.length) : null;
    const w = targetRoom.width ? Number(targetRoom.width) : null;
    const h = targetRoom.height ? Number(targetRoom.height) : null;

    try {
      if (targetRoom.id) {
        const r = await fetch(`/api/v1/projects/${project.id}/rooms/${targetRoom.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: targetRoom.name.trim() || "Room",
            roomType: targetRoom.roomType.trim() || "Master Bedroom",
            length: l,
            width: w,
            height: h,
            unit: targetRoom.unit || "ft",
            notes: targetRoom.notes || null,
          }),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Failed to save room dimensions."));
        setRooms((prev) =>
          prev.map((r, i) => (i === activeRoomIndex ? { ...r, ...b.data, isConfigured: true } : r))
        );
      } else {
        const r = await fetch(`/api/v1/projects/${project.id}/rooms`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: targetRoom.name.trim() || "Room",
            roomType: targetRoom.roomType.trim() || "Master Bedroom",
            length: l,
            width: w,
            height: h,
            unit: targetRoom.unit || "ft",
            notes: targetRoom.notes || null,
          }),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Failed to save room."));
        setRooms((prev) =>
          prev.map((r, i) => (i === activeRoomIndex ? { ...r, ...b.data, isConfigured: true } : r))
        );
      }
    } catch (x) {
      setError(x instanceof Error ? x.message : "Failed to save room.");
    } finally {
      setSaving(false);
    }
  };

  const continueFromRoomConfig = async () => {
    if (activeRoom && (!activeRoom.id || !activeRoom.isConfigured)) {
      await saveSingleActiveRoom();
    }
    setAddingRequirement(false);
    setEditingReqId(null);
    setScreen("requirements");
  };

  const saveRequirement = async () => {
    if (!project?.id || !activeRoom?.id) {
      setError("Please ensure the room is saved before adding requirements.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: reqForm.name.trim(),
      category: reqForm.category || "Storage",
      length: reqForm.length ? Number(reqForm.length) : null,
      depth: reqForm.depth ? Number(reqForm.depth) : null,
      breadth: reqForm.depth ? Number(reqForm.depth) : null,
      height: reqForm.height ? Number(reqForm.height) : null,
      unit: reqForm.unit || "Unit",
      quantity: reqForm.quantity || 1,
      partitions: reqForm.partitions || 0,
      notes: reqForm.notes || undefined,
    };

    try {
      if (editingReqId) {
        const r = await fetch(`/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements/${editingReqId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Failed to update requirement."));
        setRooms((prev) =>
          prev.map((rm, i) => {
            if (i !== activeRoomIndex) return rm;
            const updatedReqs = (rm.requirements || []).map((rq) => (rq.id === editingReqId ? b.data : rq));
            return { ...rm, requirements: updatedReqs };
          })
        );
      } else {
        const r = await fetch(`/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Failed to save requirement."));
        setRooms((prev) =>
          prev.map((rm, i) => {
            if (i !== activeRoomIndex) return rm;
            const updatedReqs = [...(rm.requirements || []), b.data];
            return { ...rm, requirements: updatedReqs, requirementsCount: updatedReqs.length };
          })
        );
      }
      setAddingRequirement(false);
      setEditingReqId(null);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Failed to save requirement.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRequirement = async (reqId: string) => {
    if (!project?.id || !activeRoom?.id) return;
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements/${reqId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) {
        setRooms((prev) =>
          prev.map((rm, i) => {
            if (i !== activeRoomIndex) return rm;
            const updatedReqs = (rm.requirements || []).filter((rq) => rq.id !== reqId);
            return { ...rm, requirements: updatedReqs, requirementsCount: updatedReqs.length };
          })
        );
      }
    } catch {}
    setActiveReqMenu(null);
  };

  const duplicateRequirement = async (reqId: string) => {
    if (!project?.id || !activeRoom?.id) return;
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements/${reqId}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const b = await r.json();
      if (r.ok && b.data) {
        setRooms((prev) =>
          prev.map((rm, i) => {
            if (i !== activeRoomIndex) return rm;
            const updatedReqs = [...(rm.requirements || []), b.data];
            return { ...rm, requirements: updatedReqs, requirementsCount: updatedReqs.length };
          })
        );
      }
    } catch {}
    setActiveReqMenu(null);
  };

  const openEditRequirement = (req: ProjectRequirement) => {
    setReqForm({
      name: req.name,
      category: req.category || "Storage",
      length: req.length ? String(req.length) : "8",
      depth: (req.depth ?? req.breadth) ? String(req.depth ?? req.breadth) : "2",
      height: req.height ? String(req.height) : "8",
      unit: req.unit || "Unit",
      quantity: req.quantity || 1,
      partitions: req.partitions || 0,
      notes: req.notes || "",
    });
    setEditingReqId(req.id);
    setAddingRequirement(true);
    setActiveReqMenu(null);
  };

  const assignMaterialToRequirement = async () => {
    if (!selectedMaterialForAssign || !activeReqForMaterial || !project?.id) return;
    const { room, req } = activeReqForMaterial;
    if (!room.id || !req.id) return;

    try {
      const r = await fetch(`/api/v1/projects/${project.id}/rooms/${room.id}/requirements/${req.id}/material`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selectedMaterialForAssign.id,
          materialName: selectedMaterialForAssign.name,
          materialRate: selectedMaterialForAssign.unitPrice || selectedMaterialForAssign.price || 118,
          materialUnit: selectedMaterialForAssign.unit || "Sq.ft",
          materialCategory: selectedMaterialForAssign.categoryName || selectedMaterialForAssign.category || "HDHMR",
        }),
      });
      const b = await r.json();
      if (r.ok && b.data) {
        setRooms((prev) =>
          prev.map((rm) => {
            if (rm.id !== room.id) return rm;
            const updatedReqs = (rm.requirements || []).map((rq) => (rq.id === req.id ? b.data : rq));
            return { ...rm, requirements: updatedReqs };
          })
        );
      }
    } catch {}
    setShowAssignModal(false);
  };

  const createBoqAndFinish = async () => {
    if (!project?.id) return;
    setSaving(true);
    try {
      await fetch("/api/v1/boqs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          method: "scratch",
          markupPercent: 15,
          taxPercent: 18,
        }),
      }).catch(() => {});
      setScreen("success");
    } finally {
      setSaving(false);
    }
  };

  const saveAsDraft = async () => {
    if (project) {
      setSaving(true);
      setError("");
      try {
        await persistAllRoomsDraft();
        onCreated("Project and rooms saved as draft.");
      } catch (x) {
        setError(x instanceof Error ? x.message : "Failed to save draft.");
      } finally {
        setSaving(false);
      }
      return;
    }

    const name = form.name.trim();
    if (!name) {
      setError("Please enter a Project Name to save as draft.");
      return;
    }

    setSaving(true);
    setError("");

    const clientName = form.clientName.trim() || "Draft Client";
    const projectType = form.projectType || "Residential";
    const statusVal = "planning";

    const body = {
      ...form,
      name,
      clientName,
      projectType,
      status: statusVal,
      clientContact: form.clientContact || null,
      description: form.description || null,
      location: form.location || undefined,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      projectValue: form.projectValue ? Number(form.projectValue) : null,
      startDate: form.startDate || null,
      targetCompletionDate: form.targetCompletionDate || null,
    };

    try {
      const r = await fetch("/api/v1/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Project could not be created."));
      onCreated("Project saved as draft.");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Project could not be saved as draft.");
    } finally {
      setSaving(false);
    }
  };

  if (screen === "choice") {
    return (
      <Modal title="Create New Project" subtitle="Choose how you want to start this project." onClose={onClose}>
        <div className="start-options">
          {[
            [
              "scratch",
              "From Scratch",
              "Set up project details manually",
              <svg key="1" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.87531 11.7679L4.10754 13.5357L6.46456 15.8927L15.8926 6.46461L13.5356 4.10758L11.7679 5.87535L12.9464 7.05386L11.7679 8.23237L10.5894 7.05386L9.41087 8.23237L10.5894 9.41088L9.41087 10.5894L8.23233 9.41088L7.05382 10.5894L8.23233 11.7679L7.05382 12.9464L5.87531 11.7679ZM14.1249 2.33981L17.6605 5.87535C17.9859 6.20079 17.9859 6.72842 17.6605 7.05386L7.05382 17.6605C6.72838 17.9859 6.20075 17.9859 5.87531 17.6605L2.33977 14.125C2.01434 13.7995 2.01434 13.2719 2.33977 12.9464L12.9464 2.33981C13.2718 2.01438 13.7995 2.01438 14.1249 2.33981ZM11.7679 15.303L12.9464 14.1245L14.8151 15.9933H15.9936V14.8148L14.1249 12.946L15.3034 11.7675L17.4998 13.9639V17.5H13.9649L11.7679 15.303ZM4.69668 8.23185L2.33966 5.87482C2.01422 5.54939 2.01422 5.02175 2.33966 4.69631L4.69668 2.33929C5.02211 2.01386 5.54976 2.01386 5.87519 2.33929L8.23221 4.69631L7.05371 5.87482L5.28594 4.10706L4.10742 5.28557L5.87519 7.05334L4.69668 8.23185Z"
                  fill="#0F172A"
                />
              </svg>,
            ],
            [
              "template",
              "Use Template",
              "Start from a project template",
              <svg key="2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.33333 17.5C2.8731 17.5 2.5 17.1269 2.5 16.6667V3.33333C2.5 2.8731 2.8731 2.5 3.33333 2.5H16.6667C17.1269 2.5 17.5 2.8731 17.5 3.33333V16.6667C17.5 17.1269 17.1269 17.5 16.6667 17.5H3.33333ZM6.66667 8.33333H4.16667V15.8333H6.66667V8.33333ZM15.8333 8.33333H8.33333V15.8333H15.8333V8.33333ZM15.8333 4.16667H4.16667V6.66667H15.8333V4.16667Z"
                  fill="#0F172A"
                />
              </svg>,
            ],
            [
              "import",
              "Import Excel/CSV",
              "Import existing project data",
              <svg key="3" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18.3333 3.33333C18.3333 2.8731 17.9602 2.5 17.5 2.5H2.49996C2.03973 2.5 1.66663 2.8731 1.66663 3.33333V16.6667C1.66663 17.1269 2.03973 17.5 2.49996 17.5H17.5C17.9602 17.5 18.3333 17.1269 18.3333 16.6667V3.33333ZM3.33329 12.5H6.17999C6.82296 13.9716 8.29136 15 9.99996 15C11.7085 15 13.177 13.9716 13.82 12.5H16.6666V15.8333H3.33329V12.5ZM3.33329 4.16667H16.6666V10.8333H12.5C12.5 12.2141 11.3807 13.3333 9.99996 13.3333C8.61921 13.3333 7.49996 12.2141 7.49996 10.8333H3.33329V4.16667ZM13.3333 9.16667H10.8333V11.6667H9.16663V9.16667H6.66663L9.99996 5.41667L13.3333 9.16667Z"
                  fill="#0F172A"
                />
              </svg>,
            ],
            [
              "duplicate",
              "Duplicate Project",
              "Copy an existing project",
              <svg key="4" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.83317 5.00033V2.50033C5.83317 2.04009 6.20627 1.66699 6.6665 1.66699H16.6665C17.1267 1.66699 17.4998 2.04009 17.4998 2.50033V14.167C17.4998 14.6272 17.1267 15.0003 16.6665 15.0003H14.1665V17.4996C14.1665 17.9602 13.7916 18.3337 13.3275 18.3337H3.33888C2.87549 18.3337 2.5 17.9632 2.5 17.4996L2.50217 5.83438C2.50225 5.37375 2.8772 5.00033 3.34118 5.00033H5.83317ZM4.16868 6.66699L4.16682 16.667H12.4998V6.66699H4.16868ZM7.49983 5.00033H14.1665V13.3337H15.8332V3.33366H7.49983V5.00033ZM5.83333 9.16699H10.8333V10.8337H5.83333V9.16699ZM5.83333 12.5003H10.8333V14.167H5.83333V12.5003Z"
                  fill="#0F172A"
                />
              </svg>,
            ],
          ].map(([id, title, text, icon]) => (
            <button
              key={id as string}
              type="button"
              className={method === id ? "selected" : ""}
              onClick={() => setMethod(id as string)}
            >
              {icon as React.ReactNode}
              <b>{title as string}</b>
              <span>{text as string}</span>
              {method === id && <Check size={14} />}
            </button>
          ))}
        </div>
        <footer style={{ justifyContent: "space-between", marginTop: "16px" }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            onClick={() =>
              method === "scratch" ? setScreen("details") : setError("Choose From Scratch to start.")
            }
          >
            Continue
          </button>
        </footer>
        {error && <p className="form-error">{error}</p>}
      </Modal>
    );
  }

  if (screen === "details") {
    return (
      <div className="create-page-wrapper">
        <div className="create-page-header">
          <div className="create-page-header-left">
            <button className="back-btn" onClick={() => setScreen("choice")}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>Create New Project</h2>
              <p>Set up the foundational details for your new residential project.</p>
            </div>
          </div>
          <div className="create-page-header-right">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" onClick={saveAsDraft} disabled={saving}>
              {saving ? "Saving…" : "Save as Draft"}
            </button>
            <button type="submit" form="create-details-form" className="primary" disabled={saving}>
              {saving ? "Creating…" : "Continue to Next"}
            </button>
          </div>
        </div>

        <Steps current={1} />

        <form id="create-details-form" className="project-form" onSubmit={submitProjectDetails}>
          <fieldset>
            <legend>Project details</legend>
            <Label text="Project Name" required>
              <input
                required
                value={form.name}
                onChange={(e) => change("name", e.target.value)}
                placeholder="ex. Sharma Residence"
              />
            </Label>
            <small>Use a clear name that helps your team identify the project.</small>
          </fieldset>

          <fieldset>
            <legend>Client information</legend>
            <div className="form-grid">
              <Label text="Client Name" required>
                <input
                  required
                  value={form.clientName}
                  onChange={(e) => change("clientName", e.target.value)}
                  placeholder="ex. John Doe"
                />
              </Label>
              <Label text="Client Contact">
                <input
                  value={form.clientContact}
                  onChange={(e) => change("clientContact", e.target.value)}
                  placeholder="ex. +91 00000 00000"
                />
              </Label>
              <Label text="Project Type" required>
                <select required value={form.projectType} onChange={(e) => change("projectType", e.target.value)}>
                  <option value="">Select project type</option>
                  <option>Residential</option>
                  <option>Commercial</option>
                  <option>Retail</option>
                  <option>Hospitality</option>
                </select>
              </Label>
              <Label text="Project Status">
                <div className="status-radios">
                  {[
                    { val: "planning", label: "Planning" },
                    { val: "in_progress", label: "In Progress" },
                    { val: "on_hold", label: "On Hold" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      className={form.status === s.val ? "active" : ""}
                      onClick={() => change("status", s.val)}
                    >
                      <i /> {s.label}
                    </button>
                  ))}
                </div>
              </Label>
            </div>
          </fieldset>

          <fieldset>
            <div className="form-grid">
              <Label text="Location">
                <input value={form.location} onChange={(e) => change("location", e.target.value)} placeholder="Enter location" />
              </Label>
              <Label text="Area (sqft)">
                <input
                  type="number"
                  min="1"
                  value={form.areaSqft}
                  onChange={(e) => change("areaSqft", e.target.value)}
                  placeholder="ex. 3,200"
                />
              </Label>
            </div>
            <Label text="Project Scope / Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => change("description", e.target.value)}
                placeholder="Enter description"
              />
            </Label>
          </fieldset>

          <fieldset>
            <legend>Project timeline</legend>
            <div className="form-grid">
              <Label text="Start Date">
                <input type="date" value={form.startDate} onChange={(e) => change("startDate", e.target.value)} />
              </Label>
              <Label text="Expected Completion">
                <input
                  type="date"
                  min={form.startDate || undefined}
                  value={form.targetCompletionDate}
                  onChange={(e) => change("targetCompletionDate", e.target.value)}
                />
              </Label>
            </div>
          </fieldset>
          {error && <p className="form-error">{error}</p>}
        </form>

        <div className="cover-upload-section">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
            accept="image/png, image/jpeg, image/webp"
          />
          <button type="button" className="cover-upload-box" onClick={() => fileInputRef.current?.click()}>
            {coverFile ? (
              <img
                src={URL.createObjectURL(coverFile)}
                alt="Cover"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }}
              />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19.2498 13.75V16.5H21.9998V18.3333H19.2498V21.0833H17.4165V18.3333H14.6665V16.5H17.4165V13.75H19.2498ZM19.2573 2.75C19.7595 2.75 20.1665 3.15787 20.1665 3.66062V11.9167H18.3331V4.58333H3.66646V17.4157L12.8331 8.25L15.5831 11V13.5933L12.8331 10.8427L6.25788 17.4167H12.8331V19.25H2.74228C2.24018 19.25 1.83313 18.8422 1.83313 18.3394V3.66062C1.83313 3.1577 2.2505 2.75 2.74228 2.75H19.2573ZM7.33313 6.41667C8.34565 6.41667 9.16646 7.23748 9.16646 8.25C9.16646 9.26255 8.34565 10.0833 7.33313 10.0833C6.32061 10.0833 5.4998 9.26255 5.4998 8.25C5.4998 7.23748 6.32061 6.41667 7.33313 6.41667Z"
                    fill="#0F172A"
                  />
                </svg>
                <span>UPLOAD COVER</span>
              </>
            )}
          </button>
          <div className="cover-upload-info">
            <h4>Project Cover Image</h4>
            <p>Upload a high-resolution image to identify this project on the dashboard. Recommended Size: 800x600px.</p>
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              {coverFile ? "Change Image" : "Browse"}
            </button>
            {coverFile && (
              <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                Selected: {coverFile.name}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "rooms") {
    return (
      <div className="create-page-wrapper project-setup-wrapper">
        <div className="create-page-header">
          <div className="create-page-header-left">
            <button className="back-btn" onClick={() => setScreen("details")}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>Create New Project</h2>
              <p>Set up the foundational details for your new residential project.</p>
            </div>
          </div>
          <div className="create-page-header-right">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" onClick={saveAsDraft} disabled={saving}>
              {saving ? "Saving…" : "Save as Draft"}
            </button>
            <button type="button" onClick={continueFromRoomSetup} className="primary" disabled={saving}>
              {saving ? "Saving…" : "Continue to Next"}
            </button>
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
              <div className="pd-icon">
                <Home size={20} />
              </div>
              <div>
                <b>
                  {project?.name || form.name || "Project Name"}{" "}
                  <span className={`project-status ${project?.status || form.status || "planning"}`}>
                    {label(project?.status || form.status || "planning")}
                  </span>
                </b>
                <p>Residential Interior Project</p>
              </div>
            </div>
            <div className="pd-item">
              <label>
                <User size={14} /> Client
              </label>
              <span>{project?.clientName || form.clientName || "—"}</span>
            </div>
            <div className="pd-item">
              <label>
                <MapPin size={14} /> Location
              </label>
              <span>{project?.location || form.location || "—"}</span>
            </div>
            <div className="pd-item">
              <label>
                <Briefcase size={14} /> Type
              </label>
              <span>{project?.projectType || form.projectType || "—"}</span>
            </div>
            <div className="pd-item">
              <label>
                <Calendar size={14} /> Timeline
              </label>
              <span>
                {date(project?.startDate || form.startDate)} — {date(project?.targetCompletionDate || form.targetCompletionDate)}
              </span>
            </div>
            <button type="button" className="primary" onClick={() => setScreen("details")}>
              Edit Project
            </button>
          </div>
        </div>

        <div className="setup-card room-setup-card">
          <div className="card-header">ROOM SETUP</div>

          <div className="room-count-section">
            <Label text="Number of Rooms" required>
              <span style={{ display: "none" }} />
            </Label>
            <div className="counter-row">
              <div className="counter">
                <button
                  type="button"
                  onClick={() => setRooms((rs) => (rs.length > 1 ? rs.slice(0, -1) : rs))}
                >
                  <Minus size={16} />
                </button>
                <input type="text" readOnly value={rooms.length} />
                <button
                  type="button"
                  onClick={() =>
                    setRooms((rs) => [
                      ...rs,
                      { name: `Room ${rs.length + 1}`, roomType: "Bedroom", unit: "ft" },
                    ])
                  }
                >
                  <Plus size={16} />
                </button>
              </div>
              <span>
                <b>{rooms.length}</b> rooms will be created for this project.
              </span>
            </div>
            <p className="room-setup-desc">
              Set the initial room count and create the room structure you will configure for the BOQ. You can add or
              remove rooms later.
            </p>
          </div>

          <div className="room-list-section">
            <div className="room-list-header">
              <div>
                <label>ROOM LIST</label>
                <p>Give each room a clear name so it can be identified throughout the BOQ workflow.</p>
              </div>
              <button
                type="button"
                className="primary"
                onClick={() =>
                  setRooms((rs) => [...rs, { name: "", roomType: "Master Bedroom", unit: "ft" }])
                }
              >
                Quick Add
              </button>
            </div>

            <div className="room-list-toolbar">
              <label className="room-search">
                <Search size={16} />
                <input
                  placeholder="Search Rooms"
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                />
              </label>
              <select
                className="room-filter"
                value={roomCategoryFilter}
                onChange={(e) => setRoomCategoryFilter(e.target.value)}
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <table className="room-list-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ROOM NAME</th>
                  <th>ROOM TYPE</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRoomRows.map(({ room, originalIndex }) => (
                  <tr key={originalIndex}>
                    <td style={{ color: "#94a3b8" }}>{String(originalIndex + 1).padStart(2, "0")}</td>
                    <td>
                      <input
                        value={room.name}
                        onChange={(e) =>
                          setRooms((rs) =>
                            rs.map((r, x) => (x === originalIndex ? { ...r, name: e.target.value } : r))
                          )
                        }
                        placeholder="Room name"
                      />
                    </td>
                    <td>
                      <select
                        value={room.roomType || ""}
                        onChange={(e) =>
                          setRooms((rs) =>
                            rs.map((r, x) => (x === originalIndex ? { ...r, roomType: e.target.value } : r))
                          )
                        }
                      >
                        <option value="" disabled>
                          Select type
                        </option>
                        <option value="Master Bedroom">Master Bedroom</option>
                        <option value="Bedroom">Bedroom</option>
                        <option value="Living Room">Living Room</option>
                        <option value="Dining Room">Dining Room</option>
                        <option value="Kitchen">Kitchen</option>
                        <option value="Study Room">Study Room</option>
                        <option value="Guest Bedroom">Guest Bedroom</option>
                        <option value="Bathroom">Bathroom</option>
                        <option value="Balcony">Balcony</option>
                      </select>
                    </td>
                    <td>
                      <span className="status-badge">
                        {room.isConfigured || (room.length && room.width)
                          ? "CONFIGURED"
                          : room.requirements?.length
                          ? `${room.requirements.length} ITEMS`
                          : "NOT CONFIGURED"}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        type="button"
                        onClick={() => setRooms((rs) => rs.filter((_, x) => x !== originalIndex))}
                      >
                        <Trash2 size={15} style={{ color: "#94a3b8" }} />
                      </button>
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
  }

  if (screen === "roomConfig") {
    const l = Number(activeRoom.length) || 0;
    const w = Number(activeRoom.width) || 0;
    const h = Number(activeRoom.height) || 0;
    const area = l * w;
    const volume = l * w * h;
    const unitLabel = activeRoom.unit === "m" ? "m" : "ft";
    const areaUnitLabel = activeRoom.unit === "m" ? "sq.m" : "sq.ft";
    const volUnitLabel = activeRoom.unit === "m" ? "cu.m" : "cu.ft";

    return (
      <div className="create-page-wrapper project-setup-wrapper">
        <div className="create-page-header">
          <div className="create-page-header-left">
            <button className="back-btn" onClick={() => setScreen("rooms")}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>Create New Project</h2>
              <p>Set up the foundational details for your new residential project.</p>
            </div>
          </div>
          <div className="create-page-header-right">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" onClick={saveAsDraft} disabled={saving}>
              {saving ? "Saving…" : "Save as Draft"}
            </button>
            <button type="button" onClick={continueFromRoomConfig} className="primary" disabled={saving}>
              Continue to Next
            </button>
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
            <b>{configuredCount}</b>
          </div>
          <div className="stat-card pending">
            <small>Pending</small>
            <b>{Math.max(0, rooms.length - configuredCount)}</b>
          </div>
        </div>

        <div className="room-config-grid">
          <div className="room-sidebar">
            <div className="room-sidebar-header">PROJECT ROOMS</div>
            <div className="room-sidebar-list">
              {rooms.map((r, i) => {
                const isConf = (Number(r.length) > 0 && Number(r.width) > 0) || r.isConfigured;
                return (
                  <div
                    key={i}
                    className={`sidebar-room-card ${i === activeRoomIndex ? "active" : ""}`}
                    onClick={() => setActiveRoomIndex(i)}
                  >
                    <div className="sr-icon">{String(i + 1).padStart(2, "0")}</div>
                    <div className="sr-info">
                      <b>{r.name || `Room ${i + 1}`}</b>
                      <span>
                        {isConf
                          ? `${r.length} x ${r.width} x ${r.height || 0} ${r.unit || "ft"}`
                          : "Dimensions not added"}
                      </span>
                    </div>
                    <div
                      className="sr-badge"
                      style={
                        isConf
                          ? { background: "#dcfce7", color: "#16a34a" }
                          : { background: "#fffbeb", color: "#f59e0b" }
                      }
                    >
                      {isConf ? "CONFIGURED" : "PENDING"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="room-detail-panel">
            <div className="rdp-header">
              <h3>
                {activeRoom.name || "ROOM"}{" "}
                <span
                  className="badge"
                  style={
                    activeRoom.isConfigured || (l > 0 && w > 0)
                      ? { background: "#dcfce7", color: "#16a34a" }
                      : { background: "#fef3c7", color: "#d97706" }
                  }
                >
                  {activeRoom.isConfigured || (l > 0 && w > 0) ? "CONFIGURED" : "PENDING"}
                </span>
              </h3>
              <div className="rdp-actions">
                <button
                  type="button"
                  onClick={() => {
                    const nextName = prompt("Enter new room name:", activeRoom.name);
                    if (nextName?.trim()) updateActiveRoomField("name", nextName.trim());
                  }}
                >
                  Edit Name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cloned: ProjectRoom = {
                      name: `${activeRoom.name} (Copy)`,
                      roomType: activeRoom.roomType,
                      length: activeRoom.length,
                      width: activeRoom.width,
                      height: activeRoom.height,
                      unit: activeRoom.unit,
                      notes: activeRoom.notes,
                    };
                    setRooms((prev) => [...prev, cloned]);
                  }}
                >
                  Duplicate
                </button>
              </div>
            </div>

            <div className="rdp-section">
              <h4>ROOM INFORMATION</h4>
              <div className="rdp-grid-2">
                <div className="rdp-input-group">
                  <label>
                    Room Name <em>*</em>
                  </label>
                  <input
                    value={activeRoom.name}
                    onChange={(e) => updateActiveRoomField("name", e.target.value)}
                    placeholder="ex. Master Bedroom"
                  />
                </div>
                <div className="rdp-input-group">
                  <label>
                    Room Type <em>*</em>
                  </label>
                  <select
                    value={activeRoom.roomType}
                    onChange={(e) => updateActiveRoomField("roomType", e.target.value)}
                  >
                    <option value="" disabled>
                      Select type
                    </option>
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
              <h4>
                ROOM DIMENSIONS{" "}
                <select
                  value={activeRoom.unit || "ft"}
                  onChange={(e) => updateActiveRoomField("unit", e.target.value)}
                  style={{ width: "auto", padding: "4px 20px 4px 8px", fontSize: "10px", height: "auto" }}
                >
                  <option value="ft">Feet (ft)</option>
                  <option value="m">Meters (m)</option>
                </select>
              </h4>
              <p style={{ fontSize: "10px", color: "#64748b", margin: "-8px 0 12px 0" }}>
                Enter the room measurements. The Area and Volume update in real time.
              </p>
              <div className="rdp-grid-3">
                <div className="rdp-input-group">
                  <label>
                    Length <em>*</em>
                  </label>
                  <div className="rdp-input-wrap">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={activeRoom.length ?? ""}
                      onChange={(e) => updateActiveRoomField("length", e.target.value ? Number(e.target.value) : null)}
                      placeholder="0"
                    />
                    <span>{unitLabel}</span>
                  </div>
                </div>
                <div className="times">x</div>
                <div className="rdp-input-group">
                  <label>
                    Width <em>*</em>
                  </label>
                  <div className="rdp-input-wrap">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={activeRoom.width ?? ""}
                      onChange={(e) => updateActiveRoomField("width", e.target.value ? Number(e.target.value) : null)}
                      placeholder="0"
                    />
                    <span>{unitLabel}</span>
                  </div>
                </div>
                <div className="times">x</div>
                <div className="rdp-input-group">
                  <label>
                    Height <em>*</em>
                  </label>
                  <div className="rdp-input-wrap">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={activeRoom.height ?? ""}
                      onChange={(e) => updateActiveRoomField("height", e.target.value ? Number(e.target.value) : null)}
                      placeholder="0"
                    />
                    <span>{unitLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rdp-section">
              <h4>ROOM MEASUREMENT SUMMARY</h4>
              <div className="measurement-summary">
                <div className="ms-card">
                  <span>AREA</span>
                  <b>
                    {area.toLocaleString()} <small>{areaUnitLabel}</small>
                  </b>
                  <p>
                    {l} x {w} = {area} {areaUnitLabel}
                  </p>
                </div>
                <div className="ms-card">
                  <span>VOLUME</span>
                  <b>
                    {volume.toLocaleString()} <small>{volUnitLabel}</small>
                  </b>
                  <p>
                    {l} x {w} x {h} = {volume} {volUnitLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="rdp-section">
              <h4>Room Notes</h4>
              <div className="rdp-input-group">
                <textarea
                  rows={3}
                  value={activeRoom.notes || ""}
                  onChange={(e) => updateActiveRoomField("notes", e.target.value)}
                  placeholder="ex. notes about this room..."
                />
              </div>
            </div>

            <div className="rdp-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setScreen("rooms")}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={saveSingleActiveRoom}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Room"}
              </button>
            </div>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  if (screen === "requirements") {
    const l = Number(activeRoom.length) || 0;
    const w = Number(activeRoom.width) || 0;
    const h = Number(activeRoom.height) || 0;
    const area = l * w;
    const volume = l * w * h;
    const unitLabel = activeRoom.unit === "m" ? "m" : "ft";
    const areaUnitLabel = activeRoom.unit === "m" ? "sq.m" : "sq.ft";
    const volUnitLabel = activeRoom.unit === "m" ? "cu.m" : "cu.ft";

    const currentRoomReqs = activeRoom.requirements || [];

    return (
      <div className="create-page-wrapper project-setup-wrapper">
        <div className="create-page-header">
          <div className="create-page-header-left">
            <button className="back-btn" onClick={() => setScreen("roomConfig")}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>Create New Project</h2>
              <p>Set up the foundational details for your new residential project.</p>
            </div>
          </div>
          <div className="create-page-header-right">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" onClick={saveAsDraft} disabled={saving}>
              {saving ? "Saving…" : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingRequirement(false);
                setScreen("materials");
              }}
              className="primary"
            >
              Continue to Next
            </button>
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
            <b>{configuredCount}</b>
          </div>
          <div className="stat-card pending">
            <small>Pending</small>
            <b>{Math.max(0, rooms.length - configuredCount)}</b>
          </div>
        </div>

        <div className="room-config-grid">
          <div className="room-sidebar">
            <div className="room-sidebar-header">PROJECT ROOMS</div>
            <div className="room-sidebar-list">
              {rooms.map((r, i) => {
                const reqCount = r.requirements?.length || 0;
                return (
                  <div
                    key={i}
                    className={`sidebar-room-card ${i === activeRoomIndex ? "active" : ""}`}
                    onClick={() => {
                      setActiveRoomIndex(i);
                      setAddingRequirement(false);
                      setEditingReqId(null);
                    }}
                  >
                    <div className="sr-icon">{String(i + 1).padStart(2, "0")}</div>
                    <div className="sr-info">
                      <b>{r.name || `Room ${i + 1}`}</b>
                      <span style={{ color: reqCount > 0 ? "#16a34a" : "#94a3b8" }}>
                        {reqCount > 0 ? `✓ ${reqCount} items added` : "No requirements yet"}
                      </span>
                    </div>
                    {reqCount > 0 && <span className="sr-count-badge">{reqCount}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="room-detail-panel">
            <div className="rdp-header">
              <h3>
                {activeRoom.name?.toUpperCase() || "ROOM"}{" "}
                <span className="badge" style={{ background: "#dcfce7", color: "#16a34a" }}>
                  CONFIGURED
                </span>
              </h3>
              <div className="rdp-actions">
                <button
                  type="button"
                  onClick={() => {
                    const nextName = prompt("Enter new room name:", activeRoom.name);
                    if (nextName?.trim()) updateActiveRoomField("name", nextName.trim());
                  }}
                >
                  Edit Name
                </button>
              </div>
            </div>

            {!addingRequirement ? (
              <>
                <div className="req-overview-top">
                  <h3>Requirement</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setReqForm({
                        name: "Wardrobe",
                        category: "Storage",
                        length: "8",
                        depth: "2",
                        height: "8",
                        unit: "Unit",
                        quantity: 1,
                        partitions: 4,
                        notes: "",
                      });
                      setEditingReqId(null);
                      setAddingRequirement(true);
                    }}
                  >
                    <Plus size={16} /> Add Requirement
                  </button>
                </div>

                {!currentRoomReqs.length ? (
                  <>
                    <div className="empty-requirements">
                      <div className="er-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <h4>No Requirements Added</h4>
                      <p>Add the furniture, storage, panels, cabinets, or other items required for this room.</p>
                      <button type="button" onClick={() => setAddingRequirement(true)}>
                        <Plus size={16} /> Add Requirement
                      </button>
                    </div>

                    <div className="common-requirements">
                      <h5>COMMON FOR {activeRoom.name?.toUpperCase() || "ROOM"}</h5>
                      <div className="cr-chips">
                        {["Wardrobe", "Bed Back Panel", "Side Table", "TV Unit", "Study Table", "Storage Unit"].map((c) => (
                          <div
                            key={c}
                            className="cr-chip"
                            onClick={() => {
                              setReqForm({
                                name: c,
                                category: c === "Wardrobe" || c === "Storage Unit" ? "Storage" : "Furniture",
                                length: "6",
                                depth: "2",
                                height: "7",
                                unit: "Unit",
                                quantity: 1,
                                partitions: 2,
                                notes: "",
                              });
                              setEditingReqId(null);
                              setAddingRequirement(true);
                            }}
                          >
                            <Plus size={12} /> {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="req-list">
                    {currentRoomReqs.map((rq) => {
                      const isPending = !rq.materialId && rq.materialStatus !== "SELECTED";
                      return (
                        <div key={rq.id} className="requirement-item-card">
                          <div className="ric-header">
                            <div className="ric-title">
                              <h4>{rq.name}</h4>
                              <span>{rq.category || "General"}</span>
                            </div>
                            <div className="ric-header-right">
                              <span className={`material-pill ${isPending ? "pending" : "selected"}`}>
                                {isPending ? "MATERIAL PENDING" : "MATERIAL SELECTED"}
                              </span>
                              <button
                                type="button"
                                className="more-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveReqMenu(activeReqMenu === rq.id ? null : rq.id);
                                }}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              {activeReqMenu === rq.id && (
                                <div className="requirement-menu" onClick={(e) => e.stopPropagation()}>
                                  <button type="button" onClick={() => openEditRequirement(rq)}>
                                    <Edit2 size={13} /> Edit Requirement
                                  </button>
                                  <button type="button" onClick={() => duplicateRequirement(rq.id)}>
                                    <Copy size={13} /> Duplicate Requirement
                                  </button>
                                  <button type="button" className="danger" onClick={() => deleteRequirement(rq.id)}>
                                    <Trash2 size={13} /> Delete Requirement
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ric-specs">
                            <div>
                              <small>Dimensions</small>
                              <b>
                                {rq.length || 0} x {rq.depth ?? rq.breadth ?? 0} x {rq.height || 0} {rq.unit || "ft"}
                              </b>
                            </div>
                            <div>
                              <small>Quantity</small>
                              <b>
                                {rq.quantity || 1} {rq.unit || "Unit"}
                              </b>
                            </div>
                            <div>
                              <small>Partitions</small>
                              <b>{rq.partitions || 0}</b>
                            </div>
                          </div>

                          <div className="ric-footer">
                            <span>Material</span>
                            <b>{rq.materialName || "Not Selected"}</b>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="req-details-header">
                  <div>
                    <h4>{editingReqId ? "Edit Requirement" : "Add Requirement"}</h4>
                    <p>
                      Select what needs to be built or installed in <b>{activeRoom.name?.toUpperCase()}</b>
                    </p>
                  </div>
                </div>

                <div className="req-header-info">
                  <div>
                    <small>ROOM</small>
                    <b>
                      {l}x{w}x{h} {unitLabel}
                    </b>
                  </div>
                  <div>
                    <small>AREA</small>
                    <b>
                      {area} {areaUnitLabel}
                    </b>
                  </div>
                  <div>
                    <small>VOLUME</small>
                    <b>
                      {volume} {volUnitLabel}
                    </b>
                  </div>
                </div>

                <div className="rdp-input-group">
                  <label>
                    Requirement Type <em>*</em>
                  </label>
                  <div className="room-search" style={{ marginBottom: 0, border: "1px solid #dce5f0" }}>
                    <Search size={16} style={{ opacity: 0.5, marginLeft: "12px" }} />
                    <input
                      placeholder="Search items.."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      style={{ border: "none", outline: "none", boxShadow: "none" }}
                    />
                  </div>
                </div>

                <div className="req-categories">
                  <div className="req-category">
                    <h6>STORAGE</h6>
                    <div className="chips">
                      {["Wardrobe", "Storage Unit", "Shoe Cabinet"]
                        .filter((c) => !itemSearchQuery || c.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                        .map((c) => (
                          <div
                            key={c}
                            className={`chip ${reqForm.name === c ? "selected" : ""}`}
                            onClick={() => {
                              setReqForm((f) => ({ ...f, name: c, category: "Storage" }));
                            }}
                          >
                            {c}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="req-category">
                    <h6>FURNITURE</h6>
                    <div className="chips">
                      {["Bed Back Panel", "Study Table", "Side Table", "TV Unit", "Vanity"]
                        .filter((c) => !itemSearchQuery || c.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                        .map((c) => (
                          <div
                            key={c}
                            className={`chip ${reqForm.name === c ? "selected" : ""}`}
                            onClick={() => {
                              setReqForm((f) => ({ ...f, name: c, category: "Furniture" }));
                            }}
                          >
                            {c}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="req-category">
                    <h6>KITCHEN</h6>
                    <div className="chips">
                      {["Base Cabinet", "Wall Cabinet", "Tall Unit", "Pantry", "Overhead Cabinet"]
                        .filter((c) => !itemSearchQuery || c.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                        .map((c) => (
                          <div
                            key={c}
                            className={`chip ${reqForm.name === c ? "selected" : ""}`}
                            onClick={() => {
                              setReqForm((f) => ({ ...f, name: c, category: "Kitchen" }));
                            }}
                          >
                            {c}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="req-category">
                    <h6>WALL & CEILING</h6>
                    <div className="chips">
                      {["Wall Panel", "False Ceiling", "Decorative Panel"]
                        .filter((c) => !itemSearchQuery || c.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                        .map((c) => (
                          <div
                            key={c}
                            className={`chip ${reqForm.name === c ? "selected" : ""}`}
                            onClick={() => {
                              setReqForm((f) => ({ ...f, name: c, category: "Wall & Ceiling" }));
                            }}
                          >
                            {c}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="req-category">
                    <h6>OTHER</h6>
                    <div className="chips">
                      <div
                        className={`chip ${reqForm.name === "Custom Item" ? "selected" : ""}`}
                        onClick={() => {
                          const n = prompt("Enter custom requirement name:", "Custom Item") || "Custom Item";
                          setReqForm((f) => ({ ...f, name: n, category: "Other" }));
                        }}
                      >
                        Custom Item
                      </div>
                    </div>
                  </div>
                </div>

                <div className="req-details-section">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginBottom: "16px",
                      background: "#f8fafc",
                      padding: "12px",
                      borderRadius: "6px",
                    }}
                  >
                    <div>
                      <b style={{ fontSize: "12px", color: "#1e293b" }}>{reqForm.name}</b>
                      <span style={{ display: "block", fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                        {reqForm.category}
                      </span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      Item dimensions are separate from room size
                    </span>
                  </div>

                  <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "12px" }}>Item Dimensions</p>
                  <div className="rdp-grid-3" style={{ marginBottom: "20px" }}>
                    <div className="rdp-input-group">
                      <label>
                        Length <em>*</em>
                      </label>
                      <div className="rdp-input-wrap">
                        <input
                          type="number"
                          step="any"
                          value={reqForm.length}
                          onChange={(e) => setReqForm((f) => ({ ...f, length: e.target.value }))}
                        />
                        <span>ft</span>
                      </div>
                    </div>
                    <div className="times">x</div>
                    <div className="rdp-input-group">
                      <label>
                        Breadth/Depth <em>*</em>
                      </label>
                      <div className="rdp-input-wrap">
                        <input
                          type="number"
                          step="any"
                          value={reqForm.depth}
                          onChange={(e) => setReqForm((f) => ({ ...f, depth: e.target.value }))}
                        />
                        <span>ft</span>
                      </div>
                    </div>
                    <div className="times">x</div>
                    <div className="rdp-input-group">
                      <label>
                        Height <em>*</em>
                      </label>
                      <div className="rdp-input-wrap">
                        <input
                          type="number"
                          step="any"
                          value={reqForm.height}
                          onChange={(e) => setReqForm((f) => ({ ...f, height: e.target.value }))}
                        />
                        <span>ft</span>
                      </div>
                    </div>
                  </div>

                  <div className="rdp-grid-2" style={{ marginBottom: "24px" }}>
                    <div className="rdp-input-group">
                      <label>
                        Quantity <em>*</em>
                      </label>
                      <div className="quantity-input">
                        <button
                          type="button"
                          onClick={() => setReqForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={reqForm.quantity}
                          onChange={(e) =>
                            setReqForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value) || 1) }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setReqForm((f) => ({ ...f, quantity: f.quantity + 1 }))}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="rdp-input-group">
                      <label>
                        Unit <em>*</em>
                      </label>
                      <select
                        value={reqForm.unit}
                        onChange={(e) => setReqForm((f) => ({ ...f, unit: e.target.value }))}
                      >
                        <option value="Unit">Unit</option>
                        <option value="Nos">Nos</option>
                        <option value="Sets">Sets</option>
                        <option value="ft">ft</option>
                        <option value="sq.ft">sq.ft</option>
                      </select>
                    </div>

                    <div className="rdp-input-group">
                      <label>
                        Number of Partitions <em>*</em>
                      </label>
                      <div className="quantity-input">
                        <button
                          type="button"
                          onClick={() => setReqForm((f) => ({ ...f, partitions: Math.max(0, f.partitions - 1) }))}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={reqForm.partitions}
                          onChange={(e) =>
                            setReqForm((f) => ({ ...f, partitions: Math.max(0, Number(e.target.value) || 0) }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setReqForm((f) => ({ ...f, partitions: f.partitions + 1 }))}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p style={{ fontSize: "9px", color: "#94a3b8", margin: "4px 0 0 0" }}>
                        Partitions will be used later to calculate material requirements.
                      </p>
                    </div>
                  </div>

                  <div className="rdp-section">
                    <h4>Requirement Notes</h4>
                    <div className="rdp-input-group">
                      <textarea
                        rows={3}
                        value={reqForm.notes}
                        onChange={(e) => setReqForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="ex. add notes about this item..."
                      />
                    </div>
                  </div>

                  <div className="rdp-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setAddingRequirement(false);
                        setEditingReqId(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="button" className="btn-save" onClick={saveRequirement} disabled={saving}>
                      {saving ? "Saving…" : "Save Requirement"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  if (screen === "materials") {
    const curItem = activeReqForMaterial?.req;
    const curRoom = activeReqForMaterial?.room;

    const filteredMaterials = (materialsCatalog.length
      ? materialsCatalog
      : [
          {
            id: "mat-hdhmr-12",
            name: "12mm HDHMR Board",
            categoryName: "HDHMR",
            thickness: "12mm",
            finish: "Plain",
            unitPrice: 118,
            unit: "Sq.ft",
            stock: 320,
            brand: "Euronics",
            status: "in-stock",
          },
          {
            id: "mat-hdhmr-18",
            name: "18mm HDHMR Board",
            categoryName: "HDHMR",
            thickness: "18mm",
            finish: "Plain",
            unitPrice: 240,
            unit: "Sq.ft",
            stock: 120,
            brand: "Euronics",
            status: "low-stock",
          },
          {
            id: "mat-acrylic-3",
            name: "Acrylic Glass Board",
            categoryName: "Acrylic",
            thickness: "3mm",
            finish: "Gloss",
            unitPrice: 240,
            unit: "Sq.ft",
            stock: 320,
            brand: "Euronics",
            status: "in-stock",
          },
        ]
    ).filter((m) => {
      const q = materialSearch.toLowerCase();
      return (
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.categoryName?.toLowerCase().includes(q) ||
        m.brand?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="create-page-wrapper project-setup-wrapper">
        <div className="create-page-header">
          <div className="create-page-header-left">
            <button className="back-btn" onClick={() => setScreen("requirements")}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>Create New Project</h2>
              <p>Set up the foundational details for your new residential project.</p>
            </div>
          </div>
          <div className="create-page-header-right">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" onClick={saveAsDraft} disabled={saving}>
              {saving ? "Saving…" : "Save as Draft"}
            </button>
            <button type="button" onClick={createBoqAndFinish} className="primary" disabled={saving}>
              {saving ? "Creating BOQ…" : "Continue to BOQ"}
            </button>
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
            <b>{configuredCount}</b>
          </div>
          <div className="stat-card pending">
            <small>Pending</small>
            <b>{Math.max(0, rooms.length - configuredCount)}</b>
          </div>
        </div>

        <div className="room-config-grid">
          <div className="room-sidebar">
            <div className="room-sidebar-header">PROJECT REQUIREMENTS</div>
            <div className="room-sidebar-list">
              {rooms.map((rm, i) => (
                <div key={i} style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    {rm.name || `Room ${i + 1}`}
                  </div>
                  {(rm.requirements || []).length === 0 ? (
                    <div style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic", padding: "4px 8px" }}>
                      No items in this room
                    </div>
                  ) : (
                    (rm.requirements || []).map((rq) => {
                      const isSelected = rq.materialId || rq.materialStatus === "SELECTED";
                      const isActive = activeMaterialReqId === rq.id;
                      return (
                        <div
                          key={rq.id}
                          className={`sidebar-room-card ${isActive ? "active" : ""}`}
                          onClick={() => setActiveMaterialReqId(rq.id)}
                          style={{ marginBottom: "8px" }}
                        >
                          <div className="sr-info">
                            <b style={{ marginBottom: 0 }}>{rq.name}</b>
                            <span style={{ marginTop: 2 }}>{rq.materialName || "No material selected"}</span>
                          </div>
                          <div
                            className="sr-badge"
                            style={isSelected ? { background: "#e0eafd", color: "#2865e8" } : {}}
                          >
                            {isSelected ? "SELECTED" : "PENDING"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="room-detail-panel" style={{ padding: "24px", background: "#f8fafc", border: "none", boxShadow: "none" }}>
            {curItem && curRoom ? (
              <div className="req-overview-bar">
                <div>
                  <small>Item</small>
                  <b>{curItem.name}</b>
                </div>
                <div>
                  <small>Room</small>
                  <b>{curRoom.name}</b>
                </div>
                <div>
                  <small>Category</small>
                  <b>{curItem.category || "General"}</b>
                </div>
                <div>
                  <small>Dimensions</small>
                  <b>
                    {curItem.length || 0} x {curItem.depth ?? curItem.breadth ?? 0} x {curItem.height || 0} {curItem.unit || "ft"}
                  </b>
                </div>
                <div>
                  <small>Quantity</small>
                  <b>
                    {curItem.quantity || 1} {curItem.unit || "Unit"}
                  </b>
                </div>
                <div>
                  <small>Partitions</small>
                  <b>{curItem.partitions || 0}</b>
                </div>
              </div>
            ) : null}

            <div className="room-search" style={{ marginBottom: 0, border: "1px solid #dce5f0", background: "white" }}>
              <Search size={16} style={{ opacity: 0.5, marginLeft: "12px" }} />
              <input
                placeholder="Search materials by name, code, brand..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                style={{ border: "none", outline: "none", boxShadow: "none" }}
              />
            </div>

            <div className="material-grid">
              {filteredMaterials.map((mat) => {
                const isAssigned = curItem?.materialId === mat.id || curItem?.materialName === mat.name;
                return (
                  <div key={mat.id} className={`material-card ${isAssigned ? "selected" : ""}`}>
                    {isAssigned && (
                      <div className="check-icon">
                        <Check size={12} />
                      </div>
                    )}
                    <div className="mc-header">
                      <div className="img" />
                      <div>
                        <h5>{mat.name}</h5>
                        <span className="stock-badge in-stock">
                          <i /> In Stock
                        </span>
                      </div>
                    </div>
                    <div className="mc-details">
                      <div>
                        <small>Category</small>
                        <b>{mat.categoryName || mat.category || "Board"}</b>
                      </div>
                      <div>
                        <small>Thickness</small>
                        <b>{mat.thickness || "12mm"}</b>
                      </div>
                      <div>
                        <small>Finish</small>
                        <b>{mat.finish || "Plain"}</b>
                      </div>
                      <div>
                        <small>Price</small>
                        <b>₹{mat.unitPrice || mat.price || 118}/{mat.unit || "Sq.ft"}</b>
                      </div>
                    </div>
                    <div className="mc-footer">
                      <span>
                        <b>{mat.stock || 320} {mat.unit || "Sq.ft"}</b> Available
                      </span>
                      <span>{mat.brand || mat.supplierName || "Euronics"}</span>
                    </div>
                    <div className="mc-actions">
                      <button
                        type="button"
                        className={`select-btn ${isAssigned ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedMaterialForAssign(mat);
                          setShowAssignModal(true);
                        }}
                      >
                        {isAssigned && <Check size={14} />} {isAssigned ? "Selected" : "Select"}
                      </button>
                      <button type="button" className="icon-btn">
                        <Info size={14} />
                      </button>
                      <button type="button" className="icon-btn">
                        <RefreshCcw size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {showAssignModal && selectedMaterialForAssign && curItem && curRoom && (
          <div className="material-modal-overlay" onMouseDown={() => setShowAssignModal(false)}>
            <div className="material-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="mm-header">
                <div>
                  <h3>Assign Material?</h3>
                  <p>Confirm material assignment for this requirement.</p>
                </div>
                <button type="button" onClick={() => setShowAssignModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="mm-content">
                <div className="mm-table">
                  <div className="mm-row">
                    <span>Requirement</span>
                    <span>{curItem.name}</span>
                  </div>
                  <div className="mm-row">
                    <span>Room</span>
                    <span>{curRoom.name}</span>
                  </div>
                  <div className="mm-row">
                    <span>Material</span>
                    <span>{selectedMaterialForAssign.name}</span>
                  </div>
                  <div className="mm-row">
                    <span>Thickness</span>
                    <span>{selectedMaterialForAssign.thickness || "12mm"}</span>
                  </div>
                  <div className="mm-row">
                    <span>Unit</span>
                    <span>{selectedMaterialForAssign.unit || "Sq.ft"}</span>
                  </div>
                  <div className="mm-row">
                    <span>Unit Price</span>
                    <span>₹{selectedMaterialForAssign.unitPrice || selectedMaterialForAssign.price || 118} / {selectedMaterialForAssign.unit || "Sq.ft"}</span>
                  </div>
                </div>
                <span className="mm-note">Final material quantity and cost will be calculated in Step 6 / BOQ.</span>
              </div>
              <div className="mm-footer">
                <button type="button" className="mm-btn-cancel" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="button" className="mm-btn-assign" onClick={assignMaterialToRequirement}>
                  Assign Material
                </button>
              </div>
            </div>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="create-page-wrapper">
      <div className="create-page-header">
        <div className="create-page-header-left">
          <button className="back-btn" onClick={() => onCreated("Project setup completed.")}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2>Project Workspace Ready</h2>
            <p>Your project and rooms have been successfully initialized.</p>
          </div>
        </div>
      </div>
      <div className="success-panel">
        <div className="success-check">
          <Check />
        </div>
        <h2>Project Configured Successfully!</h2>
        <p>{project?.name} is ready for BOQ creation and review.</p>
        <dl>
          <div>
            <dt>Client</dt>
            <dd>{project?.clientName}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{project?.projectType}</dd>
          </div>
          <div>
            <dt>Configured Rooms</dt>
            <dd>{rooms.filter((r) => r.name.trim()).length}</dd>
          </div>
          <div>
            <dt>Total Requirements</dt>
            <dd>{allRequirementsAcrossRooms.length}</dd>
          </div>
        </dl>
        <footer style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            onClick={() => onCreated("Project created.")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Back to Projects
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => location.assign(`/projects/${project?.id}`)}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #2865e8",
              background: "#2865e8",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Open Project Workspace
          </button>
        </footer>
      </div>
    </div>
  );
}

function Label({ text, required, children }: { text: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label>
      {text}
      {required && <em>*</em>}
      {children}
    </label>
  );
}

function Steps({ current }: { current: number }) {
  return (
    <div className="wizard-steps">
      {[
        { name: "Project Details", step: 1 },
        { name: "Room Setup", step: 2 },
        { name: "Room Dimensions", step: 3 },
        { name: "Requirements", step: 4 },
        { name: "Material Assignment", step: 5 },
      ].map((s) => (
        <div className={s.step <= current ? "done" : ""} key={s.name}>
          <span>{s.step < current ? <Check size={13} /> : String(s.step).padStart(2, "0")}</span>
          <b>{s.name}</b>
        </div>
      ))}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="project-modal-backdrop" onMouseDown={onClose}>
      <section className={`project-modal ${wide ? "wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <button onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
