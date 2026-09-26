"use client";

import { ArrowLeft, ChevronDown, ChevronRight, Copy, Edit3, Play, Plus, Search, X, MoreHorizontal, Download, Upload, FileText, CheckCircle2, AlertTriangle, TrendingUp, Users, Calendar, Filter, Share2, Layers, Check, ExternalLink, RefreshCw, Eye, Trash2, ArrowUpRight } from "lucide-react";
import React, { useEffect, useState, useCallback, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardRail from "@/components/DashboardRail";
import { getTemplate, getTemplateSection, updateTemplateSection, getTemplateVersions, getTemplateUsage } from "@/lib/api/templates";

type Template = {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  businessType: string;
  projectType: string;
  team: string;
  region: string;
  visibility: string;
  imageUrl: string | null;
  tags: string[];
  status: string;
  version: string;
  useCount: number;
  lastUsedAt: string | null;
  publishedAt: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  composition: {
    rooms: number;
    boqSections: number;
    items: number;
    stages: number;
    tasks: number;
    milestones: number;
    approvals: number;
    rules: number;
    documents: number;
  };
  structure: {
    areas: Area[];
  };
  costingBoq: {
    sections: any[];
  };
  workflow: any;
  documents: any;
};

type Area = {
  id: string;
  name: string;
  type: string;
  dimensions: string;
  code?: string;
  description?: string;
  includedByDefault?: boolean;
  allowRename?: boolean;
  requiredArea?: boolean;
  sections: Section[];
};

type Section = {
  id: string;
  name: string;
  items: Item[];
};

type Item = {
  id: string;
  name: string;
  code: string;
  type: string;
  unit: string;
  baseCost: number;
  sellingRate: number;
};

const tabs = ["Overview", "Structure", "Costing & BOQ", "Workflow", "Documents", "Useage", "Versions", "Activity"];

const date = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(x)) : "—";
const money = (x?: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(x || 0);

export default function TemplateDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [useModal, setUseModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTemplate(id);
      setTemplate(res as unknown as Template);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const duplicate = async () => {
    try {
      const res = await fetch(`/api/v1/project-templates/${id}/duplicate`, { method: "POST", credentials: "include" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message || "Failed to duplicate template");
      router.push(`/templates`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const edit = () => {
    router.push(`/templates/new?edit=${id}`);
  };

  if (loading) return <div className="workspace-loading">Loading template details...</div>;
  if (error || !template) return <div className="workspace-loading">{error || "Template not found"}</div>;

  const statusColor = template.status === "ACTIVE" ? "green" : template.status === "NEEDS_REVIEW" ? "orange" : "gray";

  return (
    <main className="fig-dashboard boq-dashboard template-detail">
      <div className="fig-dashboard-glow" />
      <DashboardRail current="/templates" />
      <div className="fig-dashboard-main">
        <header className="fig-dashboard-header">
          <h1>Templates</h1>
          <div className="fig-dashboard-header-actions">
            <label className="fig-dashboard-search">
              <Search size={16} />
              <input placeholder="Search..." />
            </label>
            <button className="fig-dashboard-new">
              <Plus size={17} />
              <span>New</span>
              <ChevronDown size={17} />
            </button>
            <button className="fig-dashboard-bell" aria-label="Notifications">
              <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
            </button>
            <div className="fig-dashboard-avatar">BO</div>
          </div>
        </header>
        
        <section className="boq-page-shell">
          <button className="template-detail-back" onClick={() => router.push("/templates")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)", marginBottom: "20px" }}>
            <ArrowLeft size={16} />
            ← Project Templates
          </button>
          
          <div className="template-info-card" style={{ display: "flex", gap: "24px", background: "white", padding: "24px", borderRadius: "12px", border: "1px solid var(--fig-border)", marginBottom: "24px" }}>
            <div className="template-info-image" style={{ width: "120px", height: "120px", borderRadius: "8px", background: "var(--fig-bg)", overflow: "hidden", flexShrink: 0 }}>
              {template.imageUrl ? <img src={template.imageUrl} alt={template.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>No Image</div>}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "24px", color: "var(--fig-text)" }}>{template.name}</h2>
                <span className="tag" style={{ background: `var(--fig-${statusColor}-light, #f0f0f0)`, color: `var(--fig-${statusColor}, #333)`, padding: "4px 8px", borderRadius: "100px", fontSize: "12px", fontWeight: 600 }}>{template.status}</span>
                {template.tags?.map(t => <span key={t} style={{ background: "var(--fig-bg)", border: "1px solid var(--fig-border)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>{t}</span>)}
              </div>
              <div className="template-info-meta" style={{ display: "flex", gap: "16px", color: "var(--fig-text-secondary)", fontSize: "14px", marginBottom: "12px" }}>
                <span>ID: {template.templateCode}</span>
                <span>Type: {template.businessType}</span>
                <span>Project Type: Project Template</span>
              </div>
              <p style={{ margin: 0, color: "var(--fig-text)", fontSize: "14px" }}>{template.description || "No description provided."}</p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <button onClick={duplicate} style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid var(--fig-border)", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}><Copy size={16} /> Copy</button>
              <button onClick={edit} style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid var(--fig-border)", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}><Edit3 size={16} /> Edit</button>
              <button onClick={() => setUseModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--fig-blue)", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}><Play size={16} /> Use Template</button>
            </div>
          </div>
          
          <nav className="template-detail-tabs" style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--fig-border)", marginBottom: "24px" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ background: "none", border: "none", padding: "12px 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer", borderBottom: activeTab === t ? "2px solid var(--fig-blue)" : "2px solid transparent", color: activeTab === t ? "var(--fig-blue)" : "var(--fig-text-secondary)" }}>
                {t}
              </button>
            ))}
          </nav>
          
          {activeTab === "Overview" && <OverviewTab template={template} />}
          {activeTab === "Structure" && <StructureTab template={template} onUpdate={load} />}
          {activeTab === "Costing & BOQ" && <CostingBoqTab template={template} onUpdate={load} />}
          {activeTab === "Workflow" && <WorkflowTab template={template} onUpdate={load} />}
          {activeTab === "Documents" && <DocumentsTab template={template} onUpdate={load} />}
          {(activeTab === "Useage" || activeTab === "Usage") && <UsageTab template={template} />}
          {activeTab === "Versions" && <VersionsTab template={template} onUpdate={load} />}
          {activeTab === "Activity" && <ActivityTab template={template} />}
        </section>
      </div>

      {useModal && <UseTemplateModal template={template} close={() => setUseModal(false)} />}
    </main>
  );
}

function OverviewTab({ template }: { template: Template }) {
  return (
    <div className="template-overview-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="template-summary-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        
        <div className="template-summary-section" style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 600 }}>Template Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <MetaItem label="Business Type" value={template.businessType} />
            <MetaItem label="Team" value={template.team} />
            <MetaItem label="Visibility" value={template.visibility?.charAt(0).toUpperCase() + template.visibility?.slice(1)} />
            <MetaItem label="Region" value={template.region} />
            <MetaItem label="Created On" value={date(template.createdAt)} />
            <MetaItem label="Last Updated" value={date(template.updatedAt)} />
            <MetaItem label="Tags" value={template.tags?.join(", ")} />
            <MetaItem label="Last Viewed" value={date(template.updatedAt)} />
          </div>
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--fig-border)" }}>
            <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "8px" }}>Description</span>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--fig-text)" }}>{template.description || "—"}</p>
          </div>
        </div>

        <div className="template-composition-section" style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 600 }}>Template Composition</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <CompItem label="Rooms" value={template.composition?.rooms || 0} />
            <CompItem label="BOQ Sections" value={template.composition?.boqSections || 0} />
            <CompItem label="Items" value={template.composition?.items || 0} />
            <CompItem label="Milestones" value={template.composition?.milestones || 0} />
            <CompItem label="Documents" value={template.composition?.documents || 0} />
            <CompItem label="Approval Stages" value={template.composition?.approvals || 0} />
            <CompItem label="Categories" value={0} />
            <CompItem label="Payment Stages" value={0} />
            <CompItem label="Teams Using" value={0} />
          </div>
        </div>
      </div>

      <div className="template-bottom-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
        
        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 600 }}>Included Project Structure</h3>
          <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--fig-border)", paddingBottom: "8px", marginBottom: "16px", fontSize: "12px", fontWeight: 600, color: "var(--fig-text-secondary)" }}>
            <span style={{ flex: 1 }}>ROOMS ({template.structure?.areas?.length || 0})</span>
            <span>BOQ SECTIONS</span>
            <span>ITEMS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {template.structure?.areas?.slice(0, 3).map((a, i) => (
              <div key={i} style={{ display: "flex", gap: "16px", fontSize: "14px", alignItems: "center" }}>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
                <span style={{ width: "80px", textAlign: "right" }}>{a.sections?.length || 0}</span>
                <span style={{ width: "40px", textAlign: "right" }}>{a.sections?.reduce((acc, s) => acc + (s.items?.length || 0), 0) || 0}</span>
              </div>
            ))}
            {(!template.structure?.areas || template.structure.areas.length === 0) && (
              <div style={{ fontSize: "14px", color: "var(--fig-text-secondary)", textAlign: "center", padding: "12px 0" }}>No rooms defined</div>
            )}
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 600 }}>Status & Governance</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Status</span>
              <span className="tag" style={{ background: "#f0f0f0", padding: "4px 8px", borderRadius: "100px", fontSize: "12px", fontWeight: 600 }}>{template.status}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Version</span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{template.version || "v1.0"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Published On</span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{date(template.publishedAt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Published by</span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{template.updatedBy?.split("-")[0] || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Next Review</span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>—</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Last Updated</span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{date(template.updatedAt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Template Health</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: template.status === "ACTIVE" ? "green" : "orange" }}>{template.status === "ACTIVE" ? "HEALTHY" : "NEEDS SETUP"}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 600 }}>Usage Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Total Uses</span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{template.useCount || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Projects Created</span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{template.useCount || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Last Used</span>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{date(template.lastUsedAt)}</span>
            </div>
            <div style={{ marginTop: "auto", paddingTop: "20px" }}>
              <button style={{ background: "none", border: "none", color: "var(--fig-blue)", fontSize: "14px", fontWeight: 500, cursor: "pointer", padding: 0 }}>View Usage Analytics →</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--fig-text)", fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

function CompItem({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--fig-border)" }}>
      <span style={{ fontSize: "14px", color: "var(--fig-text-secondary)" }}>{label}</span>
      <span style={{ fontSize: "14px", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StructureTab({ template, onUpdate }: { template: Template; onUpdate: () => void }) {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(template.structure?.areas?.[0]?.id || null);
  const [areasExpanded, setAreasExpanded] = useState(true);

  const selectedArea = template.structure?.areas?.find(a => a.id === selectedAreaId) || null;

  return (
    <div className="template-structure-layout" style={{ display: "flex", gap: "24px", height: "600px" }}>
      
      <div className="template-structure-sidebar" style={{ width: "260px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--fig-border)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--fig-bg)", padding: "8px", borderRadius: "6px" }}>
            <Search size={14} color="var(--fig-text-secondary)" />
            <input placeholder="Search structure" style={{ background: "transparent", border: "none", outline: "none", fontSize: "13px", width: "100%" }} />
          </label>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          
          <div style={{ marginBottom: "8px" }}>
            <button onClick={() => setAreasExpanded(!areasExpanded)} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: "none", border: "none", padding: "8px 16px", cursor: "pointer", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--fig-text-secondary)" }}>
              {areasExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Areas ({template.structure?.areas?.length || 0})
            </button>
            {areasExpanded && (
              <div className="template-area-tree" style={{ padding: "4px 0" }}>
                {template.structure?.areas?.map(a => (
                  <button key={a.id} onClick={() => setSelectedAreaId(a.id)} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: selectedAreaId === a.id ? "var(--fig-blue-light, #e6f0fd)" : "none", border: "none", padding: "8px 16px 8px 36px", cursor: "pointer", textAlign: "left", fontSize: "13px", color: selectedAreaId === a.id ? "var(--fig-blue)" : "var(--fig-text)", fontWeight: selectedAreaId === a.id ? 600 : 400 }}>
                    {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "8px" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: "none", border: "none", padding: "8px 16px", cursor: "pointer", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--fig-text-secondary)" }}>
              <ChevronRight size={14} />
              Workflow (0)
            </button>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: "none", border: "none", padding: "8px 16px", cursor: "pointer", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--fig-text-secondary)" }}>
              <ChevronRight size={14} />
              Documents (0)
            </button>
          </div>

        </div>
        <div style={{ padding: "16px", borderTop: "1px solid var(--fig-border)" }}>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", background: "white", border: "1px dashed var(--fig-border)", padding: "8px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <Plus size={14} /> Add Structure
          </button>
        </div>
      </div>

      <div className="template-structure-content" style={{ flex: 1, background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600 }}>{selectedArea?.name || "Select an area"}</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--fig-text-secondary)" }}>{selectedArea?.sections?.length || 0} BOQ Sections</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {selectedArea?.sections?.map(section => (
            <div key={section.id} className="template-boq-section" style={{ border: "1px solid var(--fig-border)", borderRadius: "8px", marginBottom: "16px", overflow: "hidden" }}>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "var(--fig-bg)", border: "none", padding: "12px 16px", cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ChevronDown size={16} color="var(--fig-text-secondary)" />
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{section.name}</span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--fig-text-secondary)" }}>{section.items?.length || 0} items</span>
              </button>
              <div style={{ padding: "0" }}>
                <table className="template-boq-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead style={{ borderBottom: "1px solid var(--fig-border)" }}>
                    <tr>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>ITEM</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>TYPE</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>UNIT</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: "var(--fig-text-secondary)" }}>BASE COST (₹)</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: "var(--fig-text-secondary)" }}>SELLING RATE (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items?.map(item => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 500 }}>{item.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{item.code}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--fig-text-secondary)" }}>{item.type}</td>
                        <td style={{ padding: "12px 16px", color: "var(--fig-text-secondary)" }}>{item.unit}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>{money(item.baseCost)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>{money(item.sellingRate)}</td>
                      </tr>
                    ))}
                    {(!section.items || section.items.length === 0) && (
                      <tr>
                        <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--fig-text-secondary)" }}>No items in this section</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {(!selectedArea?.sections || selectedArea.sections.length === 0) && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--fig-text-secondary)" }}>No BOQ sections found in this area.</div>
          )}
        </div>
      </div>

      <div className="template-structure-inspector" style={{ width: "300px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--fig-border)" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Inspector</h3>
        </div>
        
        {selectedArea ? <InspectorForm area={selectedArea} templateId={template.id} onUpdate={onUpdate} /> : <div style={{ padding: "24px", textAlign: "center", color: "var(--fig-text-secondary)", fontSize: "13px" }}>Select an area to view properties</div>}
      </div>

    </div>
  );
}

function InspectorForm({ area, templateId, onUpdate }: { area: Area; templateId: string; onUpdate: () => void }) {
  const [formData, setFormData] = useState({
    name: area.name || "",
    type: area.type || "",
    dimensions: area.dimensions || "",
    code: area.code || "",
    description: area.description || "",
    includedByDefault: area.includedByDefault !== false,
    allowRename: area.allowRename !== false,
    requiredArea: area.requiredArea === true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      name: area.name || "",
      type: area.type || "",
      dimensions: area.dimensions || "",
      code: area.code || "",
      description: area.description || "",
      includedByDefault: area.includedByDefault !== false,
      allowRename: area.allowRename !== false,
      requiredArea: area.requiredArea === true
    });
  }, [area]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      await updateTemplateSection(templateId, "structure", { areaId: area.id, ...formData });
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="template-inspector-form" style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
        Name
        <input name="name" value={formData.name} onChange={handleChange} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
        Area Type
        <select name="type" value={formData.type} onChange={handleChange} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
          <option value="Interior">Interior</option>
          <option value="Exterior">Exterior</option>
          <option value="Common">Common</option>
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
        Area Dimensions
        <select name="dimensions" value={formData.dimensions} onChange={handleChange} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
          <option value="L x W x H">L x W x H</option>
          <option value="Area Only">Area Only</option>
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
        Code (Optional)
        <input name="code" value={formData.code} onChange={handleChange} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
        Description
        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", resize: "vertical" }} />
      </label>

      <div style={{ margin: "8px 0", borderTop: "1px solid var(--fig-border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <input type="checkbox" name="includedByDefault" checked={formData.includedByDefault} onChange={handleChange} />
          Included by Default
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <input type="checkbox" name="allowRename" checked={formData.allowRename} onChange={handleChange} />
          Allow Rename in Project
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <input type="checkbox" name="requiredArea" checked={formData.requiredArea} onChange={handleChange} />
          Required Area
        </label>
      </div>

      <div style={{ marginTop: "auto", paddingTop: "16px" }}>
        <button onClick={save} disabled={saving} style={{ width: "100%", background: "var(--fig-blue)", color: "white", border: "none", padding: "10px", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function CostingBoqTab({ template, onUpdate }: { template: Template; onUpdate?: () => void }) {
  const [costingBoq, setCostingBoq] = useState<any>(template.costingBoq || {});
  const areas = template.structure?.areas || [];

  useEffect(() => {
    getTemplateSection(template.id, "costing-boq")
      .then(body => {
        if (body?.data) {
          setCostingBoq(body.data);
        }
      })
      .catch(() => {});
  }, [template.id]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [areasExpanded, setAreasExpanded] = useState<Record<string, boolean>>({});

  const toggleArea = (areaId: string) => {
    setAreasExpanded(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  let selectedSection: any = null;
  if (areas.length > 0) {
    for (const area of areas) {
      const section = area.sections?.find((s: any) => s.id === selectedSectionId);
      if (section) {
        selectedSection = section;
        break;
      }
    }
  } else if (costingBoq.sections) {
    selectedSection = costingBoq.sections.find((s: any) => s.id === selectedSectionId);
  }

  useEffect(() => {
    if (!selectedSectionId) {
      if (areas.length > 0 && areas[0].sections?.length > 0) {
        setSelectedSectionId(areas[0].sections[0].id);
      } else if (costingBoq.sections?.length > 0) {
        setSelectedSectionId(costingBoq.sections[0].id);
      }
    }
  }, [areas, costingBoq, selectedSectionId]);

  return (
    <div className="costing-boq-layout">
      <div className="costing-boq-sidebar">
        <div style={{ padding: "16px", borderBottom: "1px solid var(--fig-border)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: "var(--fig-text-secondary)" }}>BOQ STRUCTURE</h3>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--fig-bg)", padding: "8px", borderRadius: "6px" }}>
            <Search size={14} color="var(--fig-text-secondary)" />
            <input placeholder="Search BOQ structure" style={{ background: "transparent", border: "none", outline: "none", fontSize: "13px", width: "100%" }} />
          </label>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {areas.length > 0 ? (
            areas.map(area => (
              <div key={area.id} style={{ marginBottom: "4px" }}>
                <button onClick={() => toggleArea(area.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: "8px 16px", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "var(--fig-text)" }}>
                    {areasExpanded[area.id] ? <ChevronDown size={14} color="var(--fig-text-secondary)" /> : <ChevronRight size={14} color="var(--fig-text-secondary)" />}
                    {area.name}
                  </div>
                  <span style={{ background: "var(--fig-bg)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", color: "var(--fig-text-secondary)" }}>
                    {area.sections?.reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0) || 0}
                  </span>
                </button>
                {areasExpanded[area.id] && area.sections?.map((section: any) => (
                  <button 
                    key={section.id} 
                    onClick={() => setSelectedSectionId(section.id)}
                    style={{ 
                      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", 
                      background: selectedSectionId === section.id ? "var(--fig-blue-light, #e6f0fd)" : "none", 
                      border: "none", padding: "8px 16px 8px 36px", cursor: "pointer", textAlign: "left" 
                    }}
                  >
                    <span style={{ fontSize: "13px", color: selectedSectionId === section.id ? "var(--fig-blue)" : "var(--fig-text)", fontWeight: selectedSectionId === section.id ? 600 : 400 }}>
                      {section.name}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{section.items?.length || 0}</span>
                  </button>
                ))}
              </div>
            ))
          ) : costingBoq.sections?.length > 0 ? (
            costingBoq.sections.map((section: any) => (
              <button 
                key={section.id} 
                onClick={() => setSelectedSectionId(section.id)}
                style={{ 
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", 
                  background: selectedSectionId === section.id ? "var(--fig-blue-light, #e6f0fd)" : "none", 
                  border: "none", padding: "8px 16px", cursor: "pointer", textAlign: "left" 
                }}
              >
                <span style={{ fontSize: "13px", color: selectedSectionId === section.id ? "var(--fig-blue)" : "var(--fig-text)", fontWeight: selectedSectionId === section.id ? 600 : 400 }}>
                  {section.name}
                </span>
                <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{section.items?.length || 0}</span>
              </button>
            ))
          ) : (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--fig-text-secondary)", fontSize: "13px" }}>No structure defined</div>
          )}
        </div>
        
        <div style={{ padding: "16px", borderTop: "1px solid var(--fig-border)" }}>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", background: "white", border: "1px dashed var(--fig-border)", padding: "8px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <Plus size={14} /> Add BOQ Structure
          </button>
        </div>
      </div>

      <div className="costing-boq-content">
        {selectedSection ? (
          <>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600 }}>{selectedSection.name}</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--fig-text-secondary)" }}>
                  {areas.find(a => a.sections?.some((s: any) => s.id === selectedSection.id))?.name || "Template"} - BOQ Section
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ textAlign: "right", marginRight: "16px" }}>
                  <div style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>{selectedSection.items?.length || 0} Items</div>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>
                    {money(selectedSection.items?.reduce((acc: number, item: any) => acc + (item.amount || item.qty * item.rate || 0), 0))}
                  </div>
                </div>
                <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>Edit Section</button>
                <button style={{ padding: "8px 16px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>+ Add Item</button>
                <button style={{ padding: "8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer" }}><MoreHorizontal size={16} /></button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table className="costing-boq-table">
                <thead style={{ background: "var(--fig-bg)", position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>ITEM</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>UNIT</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>QTY</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>RATE (₹)</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>WASTE (%)</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>TAX (%)</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>AMOUNT (₹)</th>
                    <th style={{ padding: "12px 24px", textAlign: "center", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>RATE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSection.items?.map((item: any, idx: number) => {
                    const statusColor = item.rateStatus === "MAPPED" ? "green" : item.rateStatus === "OUTDATED" ? "orange" : "red";
                    return (
                      <tr key={item.id || idx} style={{ borderBottom: "1px solid var(--fig-border)" }}>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 500, marginBottom: "4px" }}>{item.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)" }}>{item.description || "No description"}</div>
                        </td>
                        <td style={{ padding: "16px", color: "var(--fig-text-secondary)" }}>{item.unit || "-"}</td>
                        <td style={{ padding: "16px", textAlign: "right", fontWeight: 500 }}>{item.qty || 0}</td>
                        <td style={{ padding: "16px", textAlign: "right" }}>{money(item.rate)}</td>
                        <td style={{ padding: "16px", textAlign: "right", color: "var(--fig-text-secondary)" }}>{item.wastePercent || 0}%</td>
                        <td style={{ padding: "16px", textAlign: "right", color: "var(--fig-text-secondary)" }}>{item.taxPercent || 0}%</td>
                        <td style={{ padding: "16px", textAlign: "right", fontWeight: 600 }}>{money(item.amount || ((item.qty||0)*(item.rate||0)))}</td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <span className="rate-status-badge" style={{ background: `var(--fig-${statusColor}-light, #f0f0f0)`, color: `var(--fig-${statusColor}, #333)` }}>
                            {item.rateStatus || "MISSING"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(!selectedSection.items || selectedSection.items.length === 0) && (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--fig-text-secondary)" }}>No items in this section</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--fig-bg)" }}>
              <div style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>
                TOTAL ({selectedSection.items?.length || 0} ITEMS)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "13px" }}>Show per Page: <strong>50</strong> <ChevronDown size={12} /></span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>1</button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--fig-text-secondary)" }}>
            Select a section to view BOQ items
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowTab({ template, onUpdate }: { template: Template; onUpdate: () => void }) {
  const [subTab, setSubTab] = useState("Stages");
  const subTabs = ["Stages", "Tasks", "Milestones", "Approvals", "Rules"];
  
  const [workflow, setWorkflow] = useState<any>(template.workflow || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getTemplateSection(template.id, "workflow")
      .then(body => {
        if (body?.data) {
          setWorkflow(body.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [template.id]);

  const saveWorkflow = async (updatedWorkflow: any) => {
    try {
      await updateTemplateSection(template.id, "workflow", { data: updatedWorkflow });
      setWorkflow(updatedWorkflow);
      onUpdate();
    } catch {}
  };

  const stages = workflow.stages || [];
  const tasks = workflow.tasks || [];
  const milestones = workflow.milestones || [];

  
  const [selectedStageId, setSelectedStageId] = useState<string | null>(stages.length > 0 ? stages[0].id : null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  const selectedStage = stages.find((s: any) => s.id === selectedStageId);
  const selectedMilestone = milestones.find((m: any) => m.id === selectedMilestoneId);

  const approvals = workflow.approvals || [];
  const rules = workflow.rules || [];
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [ruleFilter, setRuleFilter] = useState('all');
  const [showCreateRule, setShowCreateRule] = useState(false);

  return (
    <div className="workflow-tab-container">
      <div className="workflow-header">
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 600 }}>Workflow</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--fig-text-secondary)" }}>Manage project execution phases, tasks, and milestones</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid var(--fig-border)", padding: "8px 12px", borderRadius: "6px" }}>
            <Search size={14} color="var(--fig-text-secondary)" />
            <input placeholder="Search workflow..." style={{ border: "none", outline: "none", fontSize: "13px" }} />
          </label>
          <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>Filter</button>
          <button style={{ padding: "8px 16px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> Add <ChevronDown size={14} />
          </button>
        </div>
      </div>
      
      <div className="workflow-subtabs">
        {subTabs.map(t => (
          <button 
            key={t} 
            onClick={() => setSubTab(t)}
            style={{ 
              background: "none", border: "none", padding: "0 0 12px 0", fontSize: "14px", fontWeight: 500, cursor: "pointer", 
              borderBottom: subTab === t ? "2px solid var(--fig-blue)" : "2px solid transparent", 
              color: subTab === t ? "var(--fig-blue)" : "var(--fig-text-secondary)" 
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "Stages" && (
        <div>
          <div className="workflow-stat-grid">
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Stages</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{stages.length}</span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Tasks</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{tasks.length}</span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Milestones</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{milestones.length}</span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Approvals</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{workflow.approvals?.length || 0}</span>
            </div>
          </div>
          
          <div className="workflow-stages-layout">
            <div className="workflow-outline">
              <div style={{ padding: "16px", borderBottom: "1px solid var(--fig-border)" }}>
                <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--fig-text-secondary)" }}>WORKFLOW OUTLINE</h3>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
                {stages.map((stage: any) => (
                  <button 
                    key={stage.id} 
                    onClick={() => setSelectedStageId(stage.id)}
                    style={{ 
                      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", 
                      background: selectedStageId === stage.id ? "var(--fig-blue-light, #e6f0fd)" : "none", 
                      border: "none", padding: "12px 16px", cursor: "pointer", textAlign: "left",
                      borderLeft: selectedStageId === stage.id ? "3px solid var(--fig-blue)" : "3px solid transparent"
                    }}
                  >
                    <span style={{ fontSize: "13px", color: selectedStageId === stage.id ? "var(--fig-blue)" : "var(--fig-text)", fontWeight: selectedStageId === stage.id ? 600 : 400 }}>
                      {stage.name}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{stage.tasks?.length || 0} tasks</span>
                  </button>
                ))}
              </div>
              <div style={{ padding: "16px", borderTop: "1px solid var(--fig-border)" }}>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", background: "white", border: "1px dashed var(--fig-border)", padding: "8px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                  <Plus size={14} /> Add Stage
                </button>
              </div>
            </div>

            <div className="workflow-stage-content">
              {selectedStage ? (
                <>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>{selectedStage.name}</h2>
                      <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--fig-text-secondary)" }}>
                        <span>{selectedStage.tasks?.length || 0} Tasks</span>
                        <span>0 Milestones</span>
                        <span>0 Approvals</span>
                      </div>
                    </div>
                    <span className="tag" style={{ background: selectedStage.status === "ACTIVE" ? "#e6f6ee" : "#f0f0f0", color: selectedStage.status === "ACTIVE" ? "#00a95c" : "#666", padding: "4px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                      {selectedStage.status || "DRAFT"}
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <table className="workflow-tasks-table" style={{ border: "none" }}>
                      <thead style={{ background: "var(--fig-bg)", position: "sticky", top: 0 }}>
                        <tr>
                          <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)", width: "40px" }}>#</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>TASK NAME</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>OWNER/ASSIGNEE</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>DURATION</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>DEPENDENCY</th>
                          <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", borderBottom: "1px solid var(--fig-border)" }}>APPROVAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStage.tasks?.map((task: any, idx: number) => (
                          <tr key={task.id || idx} style={{ borderBottom: "1px solid var(--fig-border)" }}>
                            <td style={{ padding: "16px 24px", color: "var(--fig-text-secondary)" }}>{idx + 1}</td>
                            <td style={{ padding: "16px", fontWeight: 500 }}>{task.name}</td>
                            <td style={{ padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--fig-blue-light)", color: "var(--fig-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 600 }}>
                                  {(task.assignee || "U").charAt(0).toUpperCase()}
                                </div>
                                <span>{task.assignee || "Unassigned"}</span>
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>{task.duration || "-"}</td>
                            <td style={{ padding: "16px", color: "var(--fig-text-secondary)" }}>{task.dependency || "None"}</td>
                            <td style={{ padding: "16px 24px", color: "var(--fig-text-secondary)" }}>None</td>
                          </tr>
                        ))}
                        {(!selectedStage.tasks || selectedStage.tasks.length === 0) && (
                          <tr>
                            <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--fig-text-secondary)" }}>No tasks in this stage</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--fig-text-secondary)" }}>Select a stage</div>
              )}
            </div>

            {selectedStage && (
              <div className="workflow-stage-inspector">
                <div style={{ padding: "16px", borderBottom: "1px solid var(--fig-border)" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>STAGE DETAILS</h3>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                    Stage Name
                    <input defaultValue={selectedStage.name} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                    Stage Code
                    <input defaultValue={selectedStage.code || ""} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                    Description
                    <textarea defaultValue={selectedStage.description || ""} rows={3} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", resize: "vertical" }} />
                  </label>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                      Stage Status
                      <select defaultValue={selectedStage.status} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="DRAFT">Draft</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                      Stage Owner
                      <select defaultValue={selectedStage.owner} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                        <option value="">Select...</option>
                        <option value="PM">Project Manager</option>
                      </select>
                    </label>
                  </div>
                  
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                    Expected Duration
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input defaultValue={selectedStage.duration || ""} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", flex: 1 }} />
                      <select defaultValue={selectedStage.durationUnit || "Business Days"} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", width: "120px" }}>
                        <option>Business Days</option>
                        <option>Calendar Days</option>
                      </select>
                    </div>
                  </label>

                  <div style={{ marginTop: "8px", paddingTop: "16px", borderTop: "1px solid var(--fig-border)", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                      Entry Condition
                      <input defaultValue={selectedStage.entryCondition || ""} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                      Exit Condition
                      <input defaultValue={selectedStage.exitCondition || ""} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
                    </label>
                  </div>
                </div>
                <div style={{ padding: "16px", borderTop: "1px solid var(--fig-border)", display: "flex", gap: "12px" }}>
                  <button style={{ flex: 1, padding: "8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Save Draft</button>
                  <button onClick={() => saveWorkflow(workflow)} style={{ flex: 1, padding: "8px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Save Changes</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "Tasks" && (
        <div>
          <div className="workflow-stat-grid">
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Total Tasks</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{tasks.length}</span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Critical Tasks</span>
              <span style={{ fontSize: "24px", fontWeight: 600, color: "var(--fig-red, #d94343)" }}>
                {tasks.filter((t: any) => t.criticality === "CRITICAL" || t.criticality === "HIGH").length}
              </span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Avg. Duration</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>—</span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Completion Rule</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>—</span>
            </div>
          </div>

          <table className="workflow-tasks-table">
            <thead style={{ background: "var(--fig-bg)", borderBottom: "1px solid var(--fig-border)" }}>
              <tr>
                <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>#</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>TASK NAME</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>STAGE</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>ASSIGNEE</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>DURATION</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>DEPENDENCY</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>CRITICALITY</th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: any, idx: number) => {
                const critColor = task.criticality === "CRITICAL" ? "#d94343" : task.criticality === "HIGH" ? "#f43f5e" : task.criticality === "MEDIUM" ? "#f59e0b" : "#64748b";
                return (
                  <tr key={task.id || idx} style={{ borderBottom: "1px solid var(--fig-border)" }}>
                    <td style={{ padding: "16px 24px", color: "var(--fig-text-secondary)" }}>{idx + 1}</td>
                    <td style={{ padding: "16px", fontWeight: 500 }}>{task.name}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ background: "var(--fig-bg)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px" }}>{task.stage || "No Stage"}</span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--fig-blue-light)", color: "var(--fig-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 600 }}>
                          {(task.assignee || "U").charAt(0).toUpperCase()}
                        </div>
                        <span>{task.assignee || "Unassigned"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>{task.duration || "-"}</td>
                    <td style={{ padding: "16px", color: "var(--fig-text-secondary)" }}>{task.dependency || "None"}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ color: critColor, fontWeight: 500, fontSize: "12px" }}>{task.criticality || "LOW"}</span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span className="tag" style={{ background: task.status === "ACTIVE" ? "#e6f6ee" : "#f0f0f0", color: task.status === "ACTIVE" ? "#00a95c" : "#666", padding: "4px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                        {task.status || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--fig-text-secondary)" }}>No tasks defined</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <button style={{ padding: "8px 16px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>
      )}

      {subTab === "Milestones" && (
        <div>
          <div className="workflow-stat-grid">
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Milestones</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{milestones.length}</span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Linked Tasks</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{milestones.reduce((acc: number, m: any) => acc + (m.tasks?.length || 0), 0)}</span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Deliverables</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{milestones.reduce((acc: number, m: any) => acc + (m.deliverables?.length || 0), 0)}</span>
            </div>
            <div className="workflow-stat-card">
              <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Approval Gates</span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>{milestones.reduce((acc: number, m: any) => acc + (m.approvals?.length || 0), 0)}</span>
            </div>
          </div>

          <div className="milestone-grid">
            {milestones.map((milestone: any) => (
              <div 
                key={milestone.id} 
                className={`milestone-card ${selectedMilestoneId === milestone.id ? "selected" : ""}`}
                onClick={() => setSelectedMilestoneId(milestone.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: milestone.configured ? "#00a95c" : "#f59e0b" }}></div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{milestone.name}</h3>
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><MoreHorizontal size={16} /></button>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--fig-text-secondary)", minHeight: "36px" }}>{milestone.description || "No description"}</p>
                <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--fig-text-secondary)" }}>
                  <span>{milestone.tasks?.length || 0} Tasks</span>
                  <span>{milestone.deliverables?.length || 0} Deliverables</span>
                </div>
                <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{milestone.duration || "-"}</span>
                  <span className="tag" style={{ background: milestone.configured ? "#e6f6ee" : "#fffbeb", color: milestone.configured ? "#00a95c" : "#b45309", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 600 }}>
                    {milestone.configured ? "CONFIGURED" : "NEEDS SETUP"}
                  </span>
                </div>
              </div>
            ))}
            {milestones.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "var(--fig-text-secondary)", background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px" }}>
                No milestones defined
              </div>
            )}
          </div>

          {selectedMilestone && (
            <div className="milestone-details-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--fig-border)", paddingBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>{selectedMilestone.name}</h3>
                  <span className="tag" style={{ background: selectedMilestone.configured ? "#e6f6ee" : "#fffbeb", color: selectedMilestone.configured ? "#00a95c" : "#b45309", padding: "4px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                    {selectedMilestone.configured ? "CONFIGURED" : "NEEDS SETUP"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>Duplicate</button>
                  <button style={{ padding: "8px 16px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>Edit Milestone</button>
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>Milestone Code</span>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{selectedMilestone.code || "-"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>Category</span>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{selectedMilestone.category || "-"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>Owner/Role</span>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{selectedMilestone.ownerRole || "-"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>Duration</span>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{selectedMilestone.duration || "-"} {selectedMilestone.durationUnit}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>Description</span>
                    <p style={{ margin: 0, fontSize: "14px" }}>{selectedMilestone.description || "-"}</p>
                  </div>
                  
                  <div style={{ borderTop: "1px solid var(--fig-border)", paddingTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>Start Rule</span>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{selectedMilestone.startRule || "-"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>Completion Rule</span>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{selectedMilestone.completionRule || "-"}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ background: "var(--fig-bg)", padding: "16px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600 }}>LINKED ITEMS</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ color: "var(--fig-text-secondary)" }}>Tasks</span>
                      <div>
                        <span style={{ fontWeight: 600, marginRight: "8px" }}>{selectedMilestone.tasks?.length || 0}</span>
                        <a href="#" style={{ color: "var(--fig-blue)" }}>View</a>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ color: "var(--fig-text-secondary)" }}>Deliverables</span>
                      <div>
                        <span style={{ fontWeight: 600, marginRight: "8px" }}>{selectedMilestone.deliverables?.length || 0}</span>
                        <a href="#" style={{ color: "var(--fig-blue)" }}>View</a>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ color: "var(--fig-text-secondary)" }}>Approvals</span>
                      <div>
                        <span style={{ fontWeight: 600, marginRight: "8px" }}>{selectedMilestone.approvals?.length || 0}</span>
                        <a href="#" style={{ color: "var(--fig-blue)" }}>View</a>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ color: "var(--fig-text-secondary)" }}>Dependencies</span>
                      <div>
                        <span style={{ fontWeight: 600, marginRight: "8px" }}>{selectedMilestone.dependencies?.length || 0}</span>
                        <a href="#" style={{ color: "var(--fig-blue)" }}>View</a>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: "24px", borderTop: "1px solid var(--fig-border)", paddingTop: "16px" }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--fig-text-secondary)" }}>NEXT MILESTONE</h4>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>—</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "Approvals" && (
        <ApprovalsContent 
          approvals={approvals}
          selectedApprovalId={selectedApprovalId}
          setSelectedApprovalId={setSelectedApprovalId}
        />
      )}
      
      {subTab === "Rules" && (
        <RulesContent 
          rules={rules}
          selectedRuleId={selectedRuleId}
          setSelectedRuleId={setSelectedRuleId}
          ruleFilter={ruleFilter}
          setRuleFilter={setRuleFilter}
          setShowCreateRule={setShowCreateRule}
        />
      )}
      
      {showCreateRule && (
        <CreateRuleModal 
          close={() => setShowCreateRule(false)} 
          onSave={async (newRule: any) => {
            try {
              const updatedWorkflow = { ...workflow, rules: [...rules, newRule] };
              await updateTemplateSection(template.id, "workflow", { data: updatedWorkflow });
              onUpdate();
            } catch { /* silently refresh */ onUpdate(); }
            setShowCreateRule(false);
          }}
        />
      )}
    </div>
  );
}

function ApprovalsContent({ approvals, selectedApprovalId, setSelectedApprovalId }: any) {
  const selectedApproval = approvals.find((a: any) => a.id === selectedApprovalId);
  const activeCount = approvals.filter((a: any) => a.status === 'ACTIVE').length;
  const draftCount = approvals.filter((a: any) => a.status === 'DRAFT').length;
  const needsAttentionCount = approvals.filter((a: any) => a.status === 'NEEDS_ATTENTION').length;

  return (
    <div>
      <div className="workflow-stat-grid">
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Approval Flows</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>{approvals.length}</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>All Configured</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Active</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>{activeCount}</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Ready to Use</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Draft</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>{draftCount}</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>In Progress</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Needs Attention</span>
          <span style={{ fontSize: "24px", fontWeight: 600, color: "var(--fig-red, #d94343)" }}>{needsAttentionCount}</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Config Issues</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
        <div style={{ flex: selectedApproval ? "2" : "1", transition: "all 0.2s" }}>
          <table className="workflow-tasks-table">
            <thead style={{ background: "var(--fig-bg)", borderBottom: "1px solid var(--fig-border)" }}>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>#</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>FLOW NAME</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>TRIGGER</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>STAGES</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>APPROVERS</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>SLA</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>STATUS</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>LAST UPDATED</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}></th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval: any, idx: number) => (
                <tr key={approval.id} 
                    onClick={() => setSelectedApprovalId(approval.id)}
                    style={{ borderBottom: "1px solid var(--fig-border)", cursor: "pointer", background: selectedApprovalId === approval.id ? "var(--fig-blue-light)" : "transparent" }}>
                  <td style={{ padding: "16px", color: "var(--fig-text-secondary)" }}>{idx + 1}</td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 500 }}>{approval.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{approval.code}</div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 500 }}>{approval.trigger}</div>
                    <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{approval.triggerSubtitle}</div>
                  </td>
                  <td style={{ padding: "16px" }}>{approval.stages || 0}</td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {approval.approvers?.map((ap: any, i: number) => (
                        <div key={i} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--fig-blue)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 600 }} title={ap.name}>
                          {(ap.name || "U").charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>{approval.sla} {approval.slaUnit}</td>
                  <td style={{ padding: "16px" }}>
                    <span className="tag" style={{ background: approval.status === "ACTIVE" ? "#e6f6ee" : "#fffbeb", color: approval.status === "ACTIVE" ? "#00a95c" : "#b45309", padding: "4px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                      {approval.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px", fontSize: "12px", color: "var(--fig-text-secondary)" }}>
                    <div>{date(approval.updatedAt)}</div>
                    <div>by {approval.updatedBy || "Admin"}</div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <MoreHorizontal size={16} color="var(--fig-text-secondary)" />
                  </td>
                </tr>
              ))}
              {approvals.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--fig-text-secondary)" }}>No approval flows defined</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--fig-bg)", marginTop: "24px", borderRadius: "8px" }}>
            <div style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>
              Total Approvals: {approvals.length || "NA"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "13px" }}>Show per Page: <strong>10</strong> <ChevronDown size={12} /></span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>1</button>
              </div>
            </div>
          </div>

          {selectedApproval && (
            <div style={{ marginTop: "24px", padding: "24px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: "var(--fig-text-secondary)", textTransform: "uppercase" }}>Approval Flow Preview</h4>
              <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: "16px" }}>
                <div style={{ minWidth: "150px", padding: "16px", background: "var(--fig-bg)", borderRadius: "8px", border: "1px solid var(--fig-border)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>TRIGGER</div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedApproval.trigger}</div>
                  <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{selectedApproval.triggerSubtitle}</div>
                </div>
                
                {selectedApproval.approvers?.map((ap: any, i: number) => (
                  <React.Fragment key={i}>
                    <div style={{ margin: "0 12px", color: "var(--fig-text-secondary)" }}><ChevronRight size={20} /></div>
                    <div style={{ minWidth: "150px", padding: "16px", background: "white", borderRadius: "8px", border: "1px solid var(--fig-blue)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-blue)", marginBottom: "4px" }}>APPROVER {String(i+1).padStart(2, '0')}</div>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{ap.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{ap.role}</div>
                    </div>
                  </React.Fragment>
                ))}

                <div style={{ margin: "0 12px", color: "var(--fig-text-secondary)" }}><ChevronRight size={20} /></div>
                <div style={{ minWidth: "150px", padding: "16px", background: "#e6f6ee", borderRadius: "8px", border: "1px solid #00a95c" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#00a95c", marginBottom: "4px" }}>OUTCOME</div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>Approved</div>
                  <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Workflow Continues</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedApproval && (
          <div style={{ flex: "1", minWidth: "300px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600, textTransform: "uppercase" }}>{selectedApproval.name}</h3>
                <span style={{ fontSize: "12px", color: "var(--fig-text-secondary)" }}>{selectedApproval.code}</span>
              </div>
              <button onClick={() => setSelectedApprovalId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>
              <p style={{ margin: "0 0 24px", fontSize: "13px", color: "var(--fig-text-secondary)" }}>
                {selectedApproval.description || "No description provided."}
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>STATUS</div>
                  <span className="tag" style={{ background: selectedApproval.status === "ACTIVE" ? "#e6f6ee" : "#fffbeb", color: selectedApproval.status === "ACTIVE" ? "#00a95c" : "#b45309", padding: "2px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                    {selectedApproval.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>TRIGGER</div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedApproval.trigger}</div>
                  <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{selectedApproval.triggerSubtitle}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>APPROVAL MODE</div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedApproval.mode || "Sequential"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>STAGES</div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedApproval.stages || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>SLA</div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedApproval.sla} {selectedApproval.slaUnit || "Business Days"}</div>
                </div>
                <div style={{ borderTop: "1px solid var(--fig-border)", paddingTop: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>CREATED BY</div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedApproval.createdBy || "Admin"}</div>
                  <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{selectedApproval.createdAt ? date(selectedApproval.createdAt) : "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>LAST UPDATED</div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedApproval.updatedBy || "Admin"}</div>
                  <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{selectedApproval.updatedAt ? date(selectedApproval.updatedAt) : "-"}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "16px", borderTop: "1px solid var(--fig-border)", textAlign: "center" }}>
              <a href="#" style={{ color: "var(--fig-blue)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>View Flow Details</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RulesContent({ rules, selectedRuleId, setSelectedRuleId, ruleFilter, setRuleFilter, setShowCreateRule }: any) {
  const [activeRuleTab, setActiveRuleTab] = useState("Overview");
  const selectedRule = rules.find((r: any) => r.id === selectedRuleId);
  const activeCount = rules.filter((r: any) => r.status === 'ACTIVE').length;
  const draftCount = rules.filter((r: any) => r.status === 'DRAFT').length;
  const approvalTriggerCount = rules.filter((r: any) => (r.category === 'Approvals' || r.action?.includes('Approval'))).length;

  const categories = ["All Rules", "Project", "Tasks", "Milestones", "Approvals", "Costing", "Documents", "Clients"];

  const filteredRules = rules.filter((r: any) => {
    if (!ruleFilter || ruleFilter.toLowerCase() === "all rules" || ruleFilter.toLowerCase() === "all") return true;
    return (r.category || "").toLowerCase() === ruleFilter.toLowerCase();
  });

  return (
    <div>
      <div className="workflow-stat-grid">
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Total Rules</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>{rules.length}</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>All Configured</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Active</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>{activeCount}</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Running</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Approval Triggers</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>{approvalTriggerCount}</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Require Authorization</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Draft</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>{draftCount}</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>In Progress</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", overflowX: "auto", margin: "24px 0", paddingBottom: "8px" }}>
        {categories.map(cat => {
          const isActive = (ruleFilter || "all rules").toLowerCase() === cat.toLowerCase();
          const count = cat === "All Rules" ? rules.length : rules.filter((r: any) => (r.category || "").toLowerCase() === cat.toLowerCase()).length;
          return (
            <button key={cat} onClick={() => setRuleFilter(cat.toLowerCase())} style={{ 
              padding: "6px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
              background: isActive ? "var(--fig-blue)" : "white",
              color: isActive ? "white" : "var(--fig-text)",
              border: isActive ? "1px solid var(--fig-blue)" : "1px solid var(--fig-border)"
            }}>
              {cat} <span style={{ opacity: 0.8, marginLeft: "4px", fontSize: "12px" }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ flex: selectedRule ? "2" : "1", transition: "all 0.2s" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <button onClick={() => setShowCreateRule(true)} style={{ padding: "8px 16px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={16} /> Add Rule
            </button>
          </div>
          <table className="workflow-tasks-table">
            <thead style={{ background: "var(--fig-bg)", borderBottom: "1px solid var(--fig-border)" }}>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>#</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>RULE NAME</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>TRIGGER</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>ACTION</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>STATUS</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>PRIORITY</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>EXECUTED</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}>LAST UPDATED</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule: any, idx: number) => {
                const priorityColor = rule.priority === "CRITICAL" ? "#d94343" : rule.priority === "HIGH" ? "#f43f5e" : rule.priority === "MEDIUM" ? "#f59e0b" : "#64748b";
                return (
                  <tr key={rule.id} 
                      onClick={() => setSelectedRuleId(rule.id)}
                      style={{ borderBottom: "1px solid var(--fig-border)", cursor: "pointer", background: selectedRuleId === rule.id ? "var(--fig-blue-light)" : "transparent" }}>
                    <td style={{ padding: "16px", color: "var(--fig-text-secondary)" }}>{idx + 1}</td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 500 }}>{rule.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{rule.code || "RUL-" + String(idx+1).padStart(3, '0')}</div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 500 }}>{rule.trigger}</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{rule.triggerSubtitle || "Immediately"}</div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 500 }}>{rule.action}</div>
                      {(rule.actionCount > 1 || !rule.actionCount) && <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>+ {rule.actionCount ? rule.actionCount - 1 : 1} more actions</div>}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span className="tag" style={{ background: rule.status === "ACTIVE" ? "#e6f6ee" : "#f1f5f9", color: rule.status === "ACTIVE" ? "#00a95c" : "#475569", padding: "4px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                        {rule.statusLabel || rule.status || "Active"}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ color: priorityColor, fontWeight: 500, fontSize: "12px", border: `1px solid ${priorityColor}`, padding: "2px 6px", borderRadius: "4px" }}>
                        {rule.priority || "MEDIUM"}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>{rule.executed ?? 0}</td>
                    <td style={{ padding: "16px", fontSize: "12px", color: "var(--fig-text-secondary)" }}>
                      {rule.updatedAt ? date(rule.updatedAt) : "12 Aug 2026"}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <MoreHorizontal size={16} color="var(--fig-text-secondary)" />
                    </td>
                  </tr>
                );
              })}
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--fig-text-secondary)" }}>No rules found in this category</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--fig-bg)", marginTop: "24px", borderRadius: "8px" }}>
            <div style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>
              Total Rules: {filteredRules.length}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "13px" }}>Show per Page: <strong>10</strong> <ChevronDown size={12} /></span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>1</button>
              </div>
            </div>
          </div>
        </div>

        {selectedRule && (
          <div style={{ flex: "1", minWidth: "320px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, textTransform: "uppercase" }}>{selectedRule.name}</h3>
                <span style={{ fontSize: "12px", color: "var(--fig-text-secondary)" }}>{selectedRule.code || "RUL-001"} · {selectedRule.category || "Project"} · v2.1</span>
              </div>
              <button onClick={() => setSelectedRuleId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><X size={18} /></button>
            </div>
            
            <div style={{ display: "flex", borderBottom: "1px solid var(--fig-border)" }}>
              {["Overview", "Conditions", "Actions"].map(tab => (
                <button key={tab} onClick={() => setActiveRuleTab(tab)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderBottom: activeRuleTab === tab ? "2px solid var(--fig-blue)" : "2px solid transparent", color: activeRuleTab === tab ? "var(--fig-blue)" : "var(--fig-text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--fig-text-secondary)", lineHeight: "1.5" }}>
                {selectedRule.description || "Automatically require approval or trigger notifications when threshold conditions are satisfied."}
              </p>
              
              {activeRuleTab === "Overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>STATUS</div>
                    <span className="tag" style={{ background: selectedRule.status === "ACTIVE" ? "#e6f6ee" : "#fffbeb", color: selectedRule.status === "ACTIVE" ? "#00a95c" : "#b45309", padding: "2px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                      {selectedRule.status || "ACTIVE"}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>CONDITIONS</div>
                    <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedRule.conditionsSummary || "Estimated Project Value > ₹10,00,000"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>TRIGGER</div>
                    <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedRule.trigger}</div>
                    <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{selectedRule.triggerSubtitle || "Immediately"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>APPROVAL FLOW</div>
                    <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedRule.approvalFlow || "Finance Approval (v2.2)"}</div>
                    <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{selectedRule.approvalSteps || "2"} Approval Steps</div>
                  </div>
                  
                  <div style={{ borderTop: "1px solid var(--fig-border)", paddingTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>PRIORITY</div>
                      <div style={{ fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: selectedRule.priority === "CRITICAL" ? "#d94343" : selectedRule.priority === "HIGH" ? "#f43f5e" : "#f59e0b" }} />
                        {selectedRule.priority || "Critical"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>EXECUTED</div>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedRule.executed ?? 12} Times</div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--fig-border)", paddingTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>CREATED BY</div>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{selectedRule.createdBy || "Admin User"}</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{selectedRule.createdAt ? date(selectedRule.createdAt) : "04 Aug 2026"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--fig-text-secondary)", marginBottom: "4px" }}>LAST UPDATED</div>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>by {selectedRule.updatedBy || "Admin User"}</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{selectedRule.updatedAt ? date(selectedRule.updatedAt) : "12 Aug 2026"}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeRuleTab === "Conditions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)", fontWeight: 600 }}>EVALUATION LOGIC</div>
                  <div style={{ background: "var(--fig-bg)", padding: "12px", borderRadius: "6px", fontSize: "13px", lineHeight: "1.6" }}>
                    <div style={{ color: "var(--fig-blue)", fontWeight: 600, marginBottom: "4px" }}>IF (Group 1)</div>
                    <div style={{ paddingLeft: "8px", borderLeft: "2px solid var(--fig-blue)" }}>
                      <div>• Estimated Project Value &gt; ₹10,00,000</div>
                      <div>• Project Type = Residential</div>
                    </div>
                    <div style={{ color: "#d97706", fontWeight: 600, margin: "8px 0 4px" }}>OR (Group 2)</div>
                    <div style={{ paddingLeft: "8px", borderLeft: "2px solid #d97706" }}>
                      <div>• Client Type = Enterprise</div>
                      <div>• Project Region = Hyderabad</div>
                    </div>
                  </div>
                </div>
              )}

              {activeRuleTab === "Actions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)", fontWeight: 600 }}>TRIGGERED ACTIONS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--fig-bg)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>1. Request Approval</span>
                      <span className="tag" style={{ background: "#eff6ff", color: "var(--fig-blue)", fontSize: "11px", padding: "2px 6px" }}>Approval</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--fig-bg)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>2. Send Notification</span>
                      <span className="tag" style={{ background: "#f5f3ff", color: "#7c3aed", fontSize: "11px", padding: "2px 6px" }}>Notification</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--fig-bg)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>3. Create Task</span>
                      <span className="tag" style={{ background: "#ecfdf5", color: "#059669", fontSize: "11px", padding: "2px 6px" }}>Task</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--fig-bg)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>4. Change Project Status</span>
                      <span className="tag" style={{ background: "#fffbeb", color: "#d97706", fontSize: "11px", padding: "2px 6px" }}>Status</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: "16px", borderTop: "1px solid var(--fig-border)", textAlign: "center" }}>
              <button style={{ width: "100%", padding: "8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", color: "var(--fig-blue)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                View Rule Flow
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateRuleModal({ close, onSave }: any) {
  const [formData, setFormData] = useState({
    name: "High Value Project Approval",
    code: "RUL-0021",
    description: "Require Finance approval for projects whose estimated project value exceeds the defined commercial threshold.",
    category: "Commercial",
    priority: "Critical",
    status: "Draft",
    effectiveFrom: "2026-08-18",
    effectiveUntil: "",
    owner: "Admin User",
    allowOverride: true,
    triggerEvent: "Project Created",
    evaluateTime: "Immediately",
    runFrequency: "Once per event",
    conditionsLogic: "ALL",
    conditions: [
      { field: "Estimated Project Value", operator: "is greater than", value: "₹ 10,00,000" },
      { field: "Project Type", operator: "equals", value: "Residential" }
    ],
    nestedGroupLogic: "ALL",
    nestedConditions: [
      { field: "Client Type", operator: "equals", value: "Enterprise" },
      { field: "Project Region", operator: "equals", value: "Hyderabad" }
    ],
    actions: [
      { id: "1", title: "Request Approval", subtitle: "High Value Project Approval", badge: "Approval", color: "#2563eb" },
      { id: "2", title: "Send Notification", subtitle: "Project Manager", badge: "Notification", color: "#7c3aed" },
      { id: "3", title: "Create Task", subtitle: "Commercial Review Task", badge: "Task", color: "#059669" },
      { id: "4", title: "Change Project Status", subtitle: "Awaiting Approval", badge: "Status", color: "#d97706" }
    ]
  });

  const steps = ["Basics", "Trigger", "Conditions", "Actions", "Approval", "Exceptions", "Review"];

  const saveWithStatus = (stat: "ACTIVE" | "DRAFT") => {
    const newRule = {
      id: "RUL-" + Math.random().toString(36).substr(2, 9),
      code: formData.code || "RUL-" + Math.floor(1000 + Math.random() * 9000),
      name: formData.name || "Untitled Rule",
      description: formData.description,
      trigger: formData.triggerEvent,
      triggerSubtitle: formData.evaluateTime || "Immediately",
      action: formData.actions[0]?.title || "Request Approval",
      actionCount: formData.actions.length,
      status: stat,
      statusLabel: stat === "ACTIVE" ? "Active" : "Draft",
      priority: formData.priority?.toUpperCase() || "CRITICAL",
      category: formData.category,
      executed: 0,
      updatedAt: new Date().toISOString(),
      conditionsSummary: "(Estimated Project Value > ₹10,00,000 AND Project Type = Residential) OR (Client Type = Enterprise AND Project Region = Hyderabad)"
    };
    onSave(newRule);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ background: "white", width: "95%", maxWidth: "1150px", height: "92%", maxHeight: "880px", borderRadius: "12px", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        
        {/* Top Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>
              Template Library &gt; Premium 3BHK Residential &gt; Workflow &gt; Rules &gt; <strong style={{ color: "var(--fig-blue)" }}>New Rule</strong>
            </div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Create New Rule</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--fig-text-secondary)" }}>Define when this rule should run, the conditions to evaluate, and the actions to perform.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button onClick={() => saveWithStatus("DRAFT")} style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>Save Draft</button>
            <button onClick={() => alert("Simulation running: Rule evaluation test successful with 0 errors.")} style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Play size={14} /> Test Rule</button>
            <button onClick={() => saveWithStatus("ACTIVE")} style={{ padding: "8px 18px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>Save &amp; Activate</button>
            <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)", marginLeft: "6px" }}><X size={20} /></button>
          </div>
        </div>

        {/* Stepper Bar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", background: "#f8fafc", overflowX: "auto" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px", opacity: i === 0 ? 1 : 0.65 }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: i === 0 ? "var(--fig-blue)" : "white", color: i === 0 ? "white" : "var(--fig-text-secondary)", border: i === 0 ? "none" : "1px solid var(--fig-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: "13px", fontWeight: i === 0 ? 600 : 500, color: i === 0 ? "var(--fig-blue)" : "var(--fig-text)" }}>{s}</span>
              {i < steps.length - 1 && <div style={{ width: "30px", height: "1px", background: "var(--fig-border)", margin: "0 4px" }} />}
            </div>
          ))}
        </div>

        {/* 2-Column Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          
          {/* Left Column: Scrollable Sections 1, 2, 3, 4 */}
          <div style={{ flex: 2, padding: "28px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* 1. BASICS */}
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px", color: "var(--fig-text)", textTransform: "uppercase" }}>1. Basics</h3>
              <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
                <label style={{ flex: 2, display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Rule Name *
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: "9px 12px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
                </label>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Rule ID
                  <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} style={{ padding: "9px 12px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", background: "var(--fig-bg)", color: "var(--fig-text-secondary)" }} />
                  <span style={{ fontSize: "10px", color: "var(--fig-text-secondary)" }}>Auto-generated</span>
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500, marginBottom: "14px" }}>
                Description *
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} style={{ padding: "9px 12px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", resize: "vertical" }} />
                <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)", textAlign: "right" }}>{formData.description.length}/300</span>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Category *
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                    <option>Commercial</option>
                    <option>Residential</option>
                    <option>Approvals</option>
                    <option>Project</option>
                    <option>Costing</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Priority *
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Status *
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                    <option>Draft</option>
                    <option>Active</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Effective From
                  <input type="date" value={formData.effectiveFrom} onChange={e => setFormData({...formData, effectiveFrom: e.target.value})} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Effective Until (optional)
                  <input type="date" value={formData.effectiveUntil} onChange={e => setFormData({...formData, effectiveUntil: e.target.value})} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Owner *
                  <select value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                    <option>Admin User</option>
                    <option>Lead Designer</option>
                    <option>Project Manager</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--fig-bg)", borderRadius: "8px", border: "1px solid var(--fig-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>Allow project-level override</span>
                  <input type="checkbox" checked={formData.allowOverride} onChange={e => setFormData({...formData, allowOverride: e.target.checked})} />
                  <span style={{ fontSize: "12px", color: formData.allowOverride ? "var(--fig-blue)" : "var(--fig-text-secondary)", fontWeight: 600 }}>{formData.allowOverride ? "Yes" : "No"}</span>
                </div>
                <button style={{ background: "white", border: "1px solid var(--fig-border)", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Configure Overrides</button>
              </div>
            </div>

            {/* 2. TRIGGER */}
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px", color: "var(--fig-text)", textTransform: "uppercase" }}>2. Trigger</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Trigger Event *
                  <select value={formData.triggerEvent} onChange={e => setFormData({...formData, triggerEvent: e.target.value})} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                    <option>Project Created</option>
                    <option>Margin Changed</option>
                    <option>Milestone Completed</option>
                    <option>Document Signed</option>
                    <option>Budget Changed</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                  Evaluate *
                  <select value={formData.evaluateTime} onChange={e => setFormData({...formData, evaluateTime: e.target.value})} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                    <option>Immediately</option>
                    <option>After Delay</option>
                    <option>Scheduled Daily</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", gap: "24px", padding: "16px", background: "var(--fig-bg)", borderRadius: "8px", border: "1px solid var(--fig-border)" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Run Frequency *</span>
                  {["Once per event", "Once per project", "Every time conditions are met"].map(opt => (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                      <input type="radio" name="runFreq" checked={formData.runFrequency === opt} onChange={() => setFormData({...formData, runFrequency: opt})} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                <div style={{ flex: 1, borderLeft: "1px solid var(--fig-border)", paddingLeft: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--fig-blue)", marginBottom: "4px" }}>About this trigger</div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--fig-text-secondary)", lineHeight: "1.5" }}>
                    This rule will evaluate immediately when a new project is created from this template. System will evaluate the conditions using project data at creation.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. CONDITIONS */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px", color: "var(--fig-text)", textTransform: "uppercase" }}>3. Conditions</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setFormData({ ...formData, conditions: [...formData.conditions, { field: "Margin %", operator: "is less than", value: "15%" }] })} style={{ padding: "6px 12px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Plus size={12} /> Add Condition
                  </button>
                  <button style={{ padding: "6px 12px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Plus size={12} /> Add Condition Group
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <select value={formData.conditionsLogic} onChange={e => setFormData({...formData, conditionsLogic: e.target.value})} style={{ padding: "6px 10px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "white" }}>
                  <option>ALL</option>
                  <option>ANY</option>
                </select>
                <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>of the following conditions must be true:</span>
              </div>

              {/* Conditions Group 1 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "var(--fig-bg)", padding: "14px", borderRadius: "8px", border: "1px solid var(--fig-border)", marginBottom: "12px" }}>
                {formData.conditions.map((cond, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <select value={cond.field} onChange={(e) => {
                      const newC = [...formData.conditions]; newC[i].field = e.target.value; setFormData({...formData, conditions: newC});
                    }} style={{ flex: 1.5, padding: "8px 10px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", background: "white" }}>
                      <option>Estimated Project Value</option>
                      <option>Project Type</option>
                      <option>Margin %</option>
                      <option>Client Type</option>
                    </select>
                    <select value={cond.operator} onChange={(e) => {
                      const newC = [...formData.conditions]; newC[i].operator = e.target.value; setFormData({...formData, conditions: newC});
                    }} style={{ flex: 1.2, padding: "8px 10px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", background: "white" }}>
                      <option>is greater than</option>
                      <option>equals</option>
                      <option>is less than</option>
                      <option>contains</option>
                    </select>
                    <input value={cond.value} onChange={(e) => {
                      const newC = [...formData.conditions]; newC[i].value = e.target.value; setFormData({...formData, conditions: newC});
                    }} style={{ flex: 1.5, padding: "8px 10px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", background: "white" }} />
                    <button onClick={() => setFormData({...formData, conditions: formData.conditions.filter((_, idx) => idx !== i)})} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><X size={16} /></button>
                  </div>
                ))}
              </div>

              {/* Nested Group OR */}
              <div style={{ margin: "12px 0 8px", paddingLeft: "16px", borderLeft: "2px dashed var(--fig-border)" }}>
                <span className="tag" style={{ background: "#fef3c7", color: "#d97706", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", marginBottom: "8px", display: "inline-block" }}>OR</span>
                <div style={{ background: "var(--fig-bg)", padding: "14px", borderRadius: "8px", border: "1px solid var(--fig-border)", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)", marginBottom: "4px" }}>ALL of the following conditions must be true:</div>
                  {formData.nestedConditions.map((cond, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <select value={cond.field} onChange={(e) => {
                        const newC = [...formData.nestedConditions]; newC[i].field = e.target.value; setFormData({...formData, nestedConditions: newC});
                      }} style={{ flex: 1.5, padding: "8px 10px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", background: "white" }}>
                        <option>Client Type</option>
                        <option>Project Region</option>
                      </select>
                      <select value={cond.operator} onChange={(e) => {
                        const newC = [...formData.nestedConditions]; newC[i].operator = e.target.value; setFormData({...formData, nestedConditions: newC});
                      }} style={{ flex: 1.2, padding: "8px 10px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", background: "white" }}>
                        <option>equals</option>
                        <option>contains</option>
                      </select>
                      <input value={cond.value} onChange={(e) => {
                        const newC = [...formData.nestedConditions]; newC[i].value = e.target.value; setFormData({...formData, nestedConditions: newC});
                      }} style={{ flex: 1.5, padding: "8px 10px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", background: "white" }} />
                      <button onClick={() => setFormData({...formData, nestedConditions: formData.nestedConditions.filter((_, idx) => idx !== i)})} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condition Summary */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", marginTop: "12px" }}>
                <div style={{ fontSize: "12px", color: "#166534", lineHeight: "1.5" }}>
                  <strong>Condition Summary:</strong> (Estimated Project Value &gt; ₹10,00,000 AND Project Type = Residential) OR (Client Type = Enterprise AND Project Region = Hyderabad)
                </div>
                <button onClick={() => setFormData({...formData, conditions: [], nestedConditions: []})} style={{ background: "none", border: "none", color: "#166534", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginLeft: "12px" }}>Clear All</button>
              </div>
            </div>

            {/* 4. ACTIONS */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px", color: "var(--fig-text)", textTransform: "uppercase" }}>4. Actions <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--fig-text-secondary)" }}>(In execution order)</span></h3>
                <button onClick={() => setFormData({...formData, actions: [...formData.actions, { id: String(Date.now()), title: "Send Email", subtitle: "Client Support", badge: "Notification", color: "#7c3aed" }]})} style={{ padding: "6px 12px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Plus size={12} /> Add Action
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {formData.actions.map((act, i) => (
                  <div key={act.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--fig-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600 }}>{i + 1}</span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>{act.title}</div>
                        <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)" }}>{act.subtitle}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span className="tag" style={{ background: `${act.color}15`, color: act.color, fontSize: "11px", padding: "2px 8px", borderRadius: "100px", fontWeight: 600 }}>
                        {act.badge}
                      </span>
                      <button onClick={() => setFormData({...formData, actions: formData.actions.filter((_, idx) => idx !== i)})} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "12px", paddingTop: "20px", borderTop: "1px solid var(--fig-border)" }}>
              <button onClick={() => saveWithStatus("ACTIVE")} style={{ padding: "10px 24px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>Continue</button>
              <button onClick={close} style={{ padding: "10px 20px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>Cancel</button>
            </div>

          </div>

          {/* Right Column: Live Rule Preview + Details + Tips */}
          <div style={{ flex: 1, borderLeft: "1px solid var(--fig-border)", background: "#f8fafc", padding: "24px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" }}>
            
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "var(--fig-text-secondary)", textTransform: "uppercase" }}>LIVE RULE PREVIEW</h4>
              <p style={{ margin: "0 0 12px", fontSize: "11px", color: "var(--fig-text-secondary)" }}>This is how your rule reads in plain language.</p>
              
              <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--fig-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#16a34a", fontSize: "11px", marginBottom: "4px" }}>WHEN</div>
                  <div style={{ fontSize: "13px", color: "var(--fig-text)" }}>{formData.triggerEvent}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--fig-blue)", fontSize: "11px", marginBottom: "4px" }}>IF</div>
                  <div style={{ fontSize: "12px", color: "var(--fig-text)", lineHeight: "1.5" }}>
                    (Estimated Project Value &gt; ₹10,00,000 AND Project Type = Residential) OR (Client Type = Enterprise AND Project Region = Hyderabad)
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#dc2626", fontSize: "11px", marginBottom: "4px" }}>THEN</div>
                  <div style={{ fontSize: "12px", color: "var(--fig-text)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {formData.actions.map((act, i) => (
                      <div key={i}>• {act.title}: {act.subtitle}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "var(--fig-text-secondary)", textTransform: "uppercase" }}>RULE DETAILS</h4>
              <div style={{ background: "white", padding: "14px", borderRadius: "8px", border: "1px solid var(--fig-border)", display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fig-text-secondary)" }}>Category</span> <span style={{ fontWeight: 600 }}>{formData.category}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fig-text-secondary)" }}>Priority</span> <span style={{ fontWeight: 600, color: "#dc2626" }}>• {formData.priority}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fig-text-secondary)" }}>Status</span> <span className="tag" style={{ background: "#f1f5f9", color: "#475569", padding: "1px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>{formData.status}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fig-text-secondary)" }}>Run Frequency</span> <span style={{ fontWeight: 500 }}>{formData.runFrequency}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fig-text-secondary)" }}>Override</span> <span style={{ fontWeight: 500 }}>Allowed</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fig-text-secondary)" }}>Created By</span> <span style={{ fontWeight: 500 }}>Admin User</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fig-text-secondary)" }}>Created On</span> <span style={{ fontWeight: 500 }}>18 Aug 2026</span></div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "var(--fig-text-secondary)", textTransform: "uppercase" }}>DEPENDENCIES (0)</h4>
              <div style={{ background: "white", padding: "14px", borderRadius: "8px", border: "1px solid var(--fig-border)", fontSize: "12px", color: "var(--fig-text-secondary)", lineHeight: "1.5" }}>
                No dependencies added yet. Dependencies will appear here once approval flows, tasks or milestones are selected in actions.
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "var(--fig-text-secondary)", textTransform: "uppercase" }}>TIPS</h4>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--fig-text-secondary)", lineHeight: "1.6" }}>
                <li>Use groups to combine conditions with AND / OR logic.</li>
                <li>Actions are executed in the order you define.</li>
                <li>You can simulate this rule using the Test Rule button.</li>
                <li>Active rules apply to all new projects created from this template.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

function UseTemplateModal({ template, close }: { template: Template; close: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    location: "",
    startDate: "",
    targetCompletionDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectName || !form.clientName) return setError("Project Name and Client Name are required.");
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/v1/project-templates/${template.id}/use`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create project from template.");
      router.push(`/projects/${body.data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="template-use-modal workspace-modal-bg" onMouseDown={close}>
      <section className="workspace-modal" onMouseDown={e => e.stopPropagation()} style={{ width: "500px", maxWidth: "90vw" }}>
        <header>
          <h3>Use Template: {template.name}</h3>
          <button type="button" onClick={close}><X /></button>
        </header>
        <form onSubmit={submit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && <div style={{ background: "#fee", color: "red", padding: "10px", borderRadius: "6px", fontSize: "13px" }}>{error}</div>}
          
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
            Project Name *
            <input name="projectName" value={form.projectName} onChange={handleChange} required style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
            Client Name *
            <input name="clientName" value={form.clientName} onChange={handleChange} required style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
            Location
            <input name="location" value={form.location} onChange={handleChange} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px" }} />
          </label>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
              Start Date
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
              Target Completion
              <input type="date" name="targetCompletionDate" value={form.targetCompletionDate} onChange={handleChange} style={{ padding: "8px", border: "1px solid var(--fig-border)", borderRadius: "6px" }} />
            </label>
          </div>

          <footer style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button type="button" onClick={close} style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: "8px 16px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "default" : "pointer", fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

/* =========================================================================
   DOCUMENTS TAB
   ========================================================================= */
function DocumentsTab({ template, onUpdate }: { template: Template; onUpdate: () => void }) {
  const [documents, setDocuments] = useState<any[]>(() => {
    if (Array.isArray((template as any).documents) && (template as any).documents.length > 0) {
      return (template as any).documents;
    }
    return [
      { id: "1", name: "BOQ v7 Final — Kohinoor L4.pdf", category: "BOQ", size: "2.4 MB", date: "2024-08-05" },
      { id: "2", name: "Floor Plan — Level 4.dwg", category: "Drawing", size: "18.7 MB", date: "2024-08-02" },
      { id: "3", name: "Material Cost Matrix Aug 2024.xlsx", category: "Costing", size: "890 KB", date: "2024-07-28" },
      { id: "4", name: "Client Proposal FINAL.pdf", category: "Proposal", size: "1.8 MB", date: "2024-07-22" },
      { id: "5", name: "Vendor Quotes — Stone World.xlsx", category: "Vendor", size: "420 KB", date: "2024-08-01" },
      { id: "6", name: "Site Progress Photos — Aug.jpg", category: "Site", size: "24 MB", date: "2024-08-01" }
    ];
  });

  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    getTemplateSection(template.id, "documents")
      .then(body => {
        const docs = (body as Record<string, unknown>).documents;
        if (docs && Array.isArray(docs) && docs.length > 0) {
          setDocuments(docs as typeof documents);
        }
      })
      .catch(() => {});
  }, [template.id]);

  const filtered = documents.filter(d => 
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.category?.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "boq": return { bg: "#eff6ff", color: "#2563eb" };
      case "drawing": return { bg: "#f5f3ff", color: "#7c3aed" };
      case "costing": return { bg: "#fffbeb", color: "#d97706" };
      case "proposal": return { bg: "#fdf4ff", color: "#c026d3" };
      case "vendor": return { bg: "#ecfeff", color: "#0891b2" };
      case "site": return { bg: "#ecfdf5", color: "#059669" };
      default: return { bg: "#f1f5f9", color: "#475569" };
    }
  };

  const handleDelete = async (docId: string) => {
    const updated = documents.filter(d => d.id !== docId);
    setDocuments(updated);
    try {
      await updateTemplateSection(template.id, "documents", { documents: updated });
      onUpdate();
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 600 }}>Documents</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--fig-text-secondary)" }}>{documents.length} Documents in this template</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid var(--fig-border)", padding: "8px 12px", borderRadius: "6px" }}>
            <Search size={14} color="var(--fig-text-secondary)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." style={{ border: "none", outline: "none", fontSize: "13px" }} />
          </label>
          <button style={{ padding: "8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer" }}><Edit3 size={15} /></button>
          <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Filter size={14} /> Filter</button>
          <button onClick={() => setShowUpload(true)} style={{ padding: "8px 12px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}><Plus size={16} /></button>
          <button onClick={() => setShowUpload(true)} style={{ padding: "8px 16px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Upload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", overflow: "hidden" }}>
        <table className="workflow-tasks-table" style={{ border: "none" }}>
          <thead style={{ background: "var(--fig-bg)", borderBottom: "1px solid var(--fig-border)" }}>
            <tr>
              <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>NAME</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>CATEGORY</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>SIZE</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>DATE</th>
              <th style={{ padding: "14px 16px", textAlign: "right", width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => {
              const c = getCategoryColor(doc.category);
              return (
                <tr key={doc.id} style={{ borderBottom: "1px solid var(--fig-border)" }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText size={18} color="var(--fig-text-secondary)" />
                      <span style={{ fontWeight: 500, fontSize: "13px" }}>{doc.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span className="tag" style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                      {doc.category}
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "var(--fig-text-secondary)", fontSize: "13px" }}>{doc.size}</td>
                  <td style={{ padding: "16px", color: "var(--fig-text-secondary)", fontSize: "13px" }}>{date(doc.date)}</td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button onClick={() => handleDelete(doc.id)} title="Delete document" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}>
                        <Trash2 size={15} />
                      </button>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}>
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "var(--fig-text-secondary)" }}>No documents found</td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--fig-bg)" }}>
          <div style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>
            Total Documents: 30
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px" }}>Show per Page: <strong>10</strong> <ChevronDown size={12} /></span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>&lt;</button>
              <button style={{ padding: "4px 8px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "4px" }}>1</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>2</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>3</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>4</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>5</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>&gt;</button>
            </div>
          </div>
        </div>
      </div>

      {showUpload && (
        <UploadDocumentModal 
          close={() => setShowUpload(false)}
          onUpload={async (newDoc) => {
            const updated = [newDoc, ...documents];
            setDocuments(updated);
            try {
              await updateTemplateSection(template.id, "documents", { documents: updated });
              onUpdate();
            } catch {}
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}

function UploadDocumentModal({ close, onUpload }: { close: () => void; onUpload: (doc: any) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("BOQ");
  const [size, setSize] = useState("2.4 MB");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onUpload({
      id: "doc-" + Math.random().toString(36).substr(2, 9),
      name,
      category,
      size,
      date: new Date().toISOString()
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ background: "white", width: "460px", maxWidth: "90vw", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--fig-border)", paddingBottom: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Upload Template Document</h3>
          <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
            Document Name *
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Master Flooring Plan.pdf" style={{ padding: "9px 12px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
              Category
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: "9px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }}>
                <option>BOQ</option>
                <option>Drawing</option>
                <option>Costing</option>
                <option>Proposal</option>
                <option>Vendor</option>
                <option>Site</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
              File Size
              <input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 2.4 MB" style={{ padding: "9px 12px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px" }} />
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button type="button" onClick={close} style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 18px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>Upload</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   USEAGE TAB
   ========================================================================= */
function UsageTab({ template }: { template: Template }) {
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState("Last 90 Days");
  const [usageData, setUsageData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/project-templates/${template.id}/usage`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(body => {
        if (body?.data?.items && Array.isArray(body.data.items) && body.data.items.length > 0) {
          setUsageData(body.data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [template.id]);

  const projects = usageData.length > 0 ? usageData : [
    { id: "1", name: "Sharma Residence", trigger: "Sharma Group", owner: "A. Mehta", createdOn: "18 Aug 2026 11:23 AM", version: "v3.2", status: "ACTIVE", progress: 64, updated: "18 Aug 2026" },
    { id: "2", name: "Kapoor Villa", trigger: "Kapoor Group", owner: "R. Singh", createdOn: "11 Aug 2026 08:45 AM", version: "v3.2", status: "ACTIVE", progress: 38, updated: "16 Aug 2026" },
    { id: "3", name: "Mehta Residence", trigger: "Mehta Group", owner: "A. Kumar", createdOn: "03 Aug 2026 02:34 PM", version: "v3.1", status: "COMPLETED", progress: 100, updated: "10 Aug 2026" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 600 }}>Useage</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--fig-text-secondary)" }}>Define the operational process inherited by projects created from this template.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid var(--fig-border)", padding: "8px 12px", borderRadius: "6px" }}>
            <Search size={14} color="var(--fig-text-secondary)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ border: "none", outline: "none", fontSize: "13px" }} />
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid var(--fig-border)", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 500 }}>
            <Calendar size={14} color="var(--fig-text-secondary)" /> {timeframe} <ChevronDown size={14} />
          </div>
          <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Filter size={14} /> Filter</button>
          <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Download size={14} /> Export <ChevronDown size={14} /></button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="workflow-stat-grid">
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Projects Created</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>06</span>
          <span style={{ fontSize: "11px", color: "#16a34a", display: "flex", alignItems: "center", gap: "2px" }}><TrendingUp size={12} /> 18% vs Last 90 Days</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Active Projects</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>31</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>74% of Total Usage</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Completed Projects</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>08</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>19% of Total Usage</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Versions Used</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>03</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Latest: v3.2</span>
        </div>
      </div>

      {/* Health & Reusability 3-Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "16px" }}>
        {/* Template Usage Health */}
        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Template Usage Health</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--fig-blue)", background: "var(--fig-blue-light)", padding: "2px 8px", borderRadius: "4px" }}>91/100</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a" }}><CheckCircle2 size={15} /> <span style={{ color: "var(--fig-text)", fontWeight: 500 }}>Strong Adoption</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a" }}><CheckCircle2 size={15} /> <span style={{ color: "var(--fig-text)", fontWeight: 500 }}>Latest Version widely Adapted</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a" }}><CheckCircle2 size={15} /> <span style={{ color: "var(--fig-text)", fontWeight: 500 }}>Low modification</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b" }}><AlertTriangle size={15} /> <span style={{ color: "var(--fig-text)", fontWeight: 500 }}>3 Projects still using older version</span></div>
          </div>
        </div>

        {/* Post-Creation Modification */}
        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>Post-Creation Modification</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} /> Used as-is</span>
                <span style={{ fontWeight: 600 }}>29 (69%)</span>
              </div>
              <div style={{ height: "6px", background: "var(--fig-bg)", borderRadius: "100px", overflow: "hidden" }}>
                <div style={{ width: "69%", height: "100%", background: "#16a34a" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} /> Minor Modifications</span>
                <span style={{ fontWeight: 600 }}>9 (21%)</span>
              </div>
              <div style={{ height: "6px", background: "var(--fig-bg)", borderRadius: "100px", overflow: "hidden" }}>
                <div style={{ width: "21%", height: "100%", background: "#f59e0b" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} /> Major Modifications</span>
                <span style={{ fontWeight: 600 }}>4 (10%)</span>
              </div>
              <div style={{ height: "6px", background: "var(--fig-bg)", borderRadius: "100px", overflow: "hidden" }}>
                <div style={{ width: "10%", height: "100%", background: "#ef4444" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Reusability Score */}
        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ position: "relative", width: "76px", height: "76px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="76" height="76" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3.8" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16a34a" strokeDasharray="89, 100" strokeWidth="3.8" strokeLinecap="round" />
            </svg>
            <span style={{ position: "absolute", fontSize: "13px", fontWeight: 700 }}>89%</span>
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>High Reusability</div>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--fig-text-secondary)", lineHeight: "1.4" }}>29 of 33 eligible projects required no major changes.</p>
          </div>
        </div>
      </div>

      {/* Trends & Version Breakdown 3-Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "16px" }}>
        {/* Usage Trend Bar Chart */}
        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Template Usage Trend</span>
            <div style={{ display: "flex", gap: "10px", fontSize: "10px", color: "var(--fig-text-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><span style={{ width: "6px", height: "6px", background: "#2563eb" }} /> Projects Created</span>
              <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><span style={{ width: "6px", height: "6px", background: "#16a34a" }} /> Active</span>
              <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><span style={{ width: "6px", height: "6px", background: "#f59e0b" }} /> Completed</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", height: "110px", gap: "6px", padding: "0 10px", borderBottom: "1px solid var(--fig-border)" }}>
            {[
              { h1: 30, h2: 45, h3: 15, label: "25 Apr" },
              { h1: 45, h2: 60, h3: 20, label: "10 May" },
              { h1: 20, h2: 40, h3: 10, label: "25 May" },
              { h1: 35, h2: 50, h3: 25, label: "9 Jun" },
              { h1: 40, h2: 55, h3: 30, label: "24 Jun" },
              { h1: 50, h2: 70, h3: 35, label: "8 Aug" },
            ].map((col, idx) => (
              <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                  <div style={{ width: "12px", height: `${col.h1}px`, background: "#2563eb", borderRadius: "2px" }} />
                  <div style={{ width: "12px", height: `${col.h2}px`, background: "#16a34a", borderRadius: "2px" }} />
                  <div style={{ width: "12px", height: `${col.h3}px`, background: "#f59e0b", borderRadius: "2px" }} />
                </div>
                <span style={{ fontSize: "9px", color: "var(--fig-text-secondary)", marginTop: "4px" }}>{col.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Version Adaptation Donut */}
        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Version Adaptation</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="100" height="100" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#16a34a" strokeWidth="5" strokeDasharray="74 100" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#2563eb" strokeWidth="5" strokeDasharray="21 100" strokeDashoffset="-74" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="5" strokeDasharray="5 100" strokeDashoffset="-95" />
              </svg>
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: 700 }}>42</div>
                <div style={{ fontSize: "9px", color: "var(--fig-text-secondary)" }}>Projects</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", background: "#16a34a" }} /> Active: <strong>31 (74%)</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", background: "#2563eb" }} /> Completed: <strong>8 (21%)</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", background: "#f59e0b" }} /> On-Hold: <strong>2 (05%)</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", background: "#ef4444" }} /> Cancelled: <strong>1 (02%)</strong></div>
            </div>
          </div>
        </div>

        {/* Version Adaptation Breakdown */}
        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>Version Adaptation</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span>v3.2 (Latest)</span>
                  <span style={{ fontWeight: 600 }}>28 (67%)</span>
                </div>
                <div style={{ height: "4px", background: "var(--fig-bg)", borderRadius: "4px" }}><div style={{ width: "67%", height: "100%", background: "var(--fig-blue)" }} /></div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span>v3.1</span>
                  <span style={{ fontWeight: 600 }}>9 (21%)</span>
                </div>
                <div style={{ height: "4px", background: "var(--fig-bg)", borderRadius: "4px" }}><div style={{ width: "21%", height: "100%", background: "var(--fig-blue)" }} /></div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span>v3.0</span>
                  <span style={{ fontWeight: 600 }}>4 (10%)</span>
                </div>
                <div style={{ height: "4px", background: "var(--fig-bg)", borderRadius: "4px" }}><div style={{ width: "10%", height: "100%", background: "var(--fig-blue)" }} /></div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span>v2.5</span>
                  <span style={{ fontWeight: 600 }}>1 (2%)</span>
                </div>
                <div style={{ height: "4px", background: "var(--fig-bg)", borderRadius: "4px" }}><div style={{ width: "2%", height: "100%", background: "var(--fig-blue)" }} /></div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "6px", marginTop: "10px", fontSize: "11px" }}>
            <span style={{ color: "#b45309" }}>⚠️ 14 Active projects on older versions</span>
            <a href="#" style={{ color: "var(--fig-blue)", fontWeight: 600, textDecoration: "none" }}>View</a>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", overflow: "hidden" }}>
        <table className="workflow-tasks-table" style={{ border: "none" }}>
          <thead style={{ background: "var(--fig-bg)", borderBottom: "1px solid var(--fig-border)" }}>
            <tr>
              <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>PROJECT</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>TRIGGER</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>OWNER</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>CREATED ON</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>TEMPLATE VERSION</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>STATUS</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>PROGRESS</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>LAST UPDATED</th>
              <th style={{ padding: "14px 16px", textAlign: "right", width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.id} style={{ borderBottom: "1px solid var(--fig-border)" }}>
                <td style={{ padding: "16px 20px", fontWeight: 600, fontSize: "13px" }}>{proj.name}</td>
                <td style={{ padding: "16px", color: "var(--fig-text-secondary)", fontSize: "13px" }}>{proj.trigger}</td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600 }}>
                      {proj.owner.charAt(0)}
                    </div>
                    <span style={{ fontSize: "13px" }}>{proj.owner}</span>
                  </div>
                </td>
                <td style={{ padding: "16px", color: "var(--fig-text-secondary)", fontSize: "12px" }}>{proj.createdOn}</td>
                <td style={{ padding: "16px" }}>
                  <span className="tag" style={{ background: "#eff6ff", color: "var(--fig-blue)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                    {proj.version}
                  </span>
                </td>
                <td style={{ padding: "16px" }}>
                  <span className="tag" style={{ background: proj.status === "ACTIVE" ? "#e6f6ee" : "#eff6ff", color: proj.status === "ACTIVE" ? "#00a95c" : "var(--fig-blue)", padding: "3px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                    {proj.status}
                  </span>
                </td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "100px", height: "6px", background: "var(--fig-bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${proj.progress}%`, height: "100%", background: "#16a34a" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--fig-text-secondary)", minWidth: "30px" }}>{proj.progress}%</span>
                  </div>
                </td>
                <td style={{ padding: "16px", color: "var(--fig-text-secondary)", fontSize: "12px" }}>{proj.updated}</td>
                <td style={{ padding: "16px", textAlign: "right" }}>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}>
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--fig-bg)" }}>
          <div style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Total Projects: 30</div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px" }}>Show per Page: <strong>10</strong> <ChevronDown size={12} /></span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>&lt;</button>
              <button style={{ padding: "4px 8px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "4px" }}>1</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>2</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>3</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>4</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>5</button>
              <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   VERSIONS TAB & VERSION SELECTED DETAIL
   ========================================================================= */
function VersionsTab({ template, onUpdate }: { template: Template; onUpdate: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState("All Versions");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>("v3.2");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [search, setSearch] = useState("");

  const [versionsData, setVersionsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultVersions = [
    { id: "v3.3", version: "v3.3", status: "DRAFT", summary: "Updated workflow & approvals", details: "Added 3 tasks and 2 approval rules", createdBy: "Pradhyumn D", publishedBy: "-", created: "12 Aug 2026 09:42 AM", published: "-", projects: "-", changesCount: 23, changesSeverity: "HIGH" },
    { id: "v3.2", version: "v3.2", status: "PUBLISHED", summary: "Updated BOQ Rates", details: "Updated rates & commercial defaults", createdBy: "Admin User", publishedBy: "Pradhyumn D", created: "02 Aug 2026 10:21 AM", published: "06 Aug 2026 02:32 PM", projects: 18, changesCount: 27, changesSeverity: "HIGH" },
    { id: "v3.1", version: "v3.1", status: "SUPERSEDED", summary: "Added milestone workflow", details: "Added milestones & task dependencies", createdBy: "Diptish Gohane", publishedBy: "Pradhyumn D", created: "22 Jul 2026 04:42 PM", published: "28 Jul 2026 11:05 AM", projects: 14, changesCount: 16, changesSeverity: "MEDIUM" },
    { id: "v3.0", version: "v3.0", status: "ARCHIVED", summary: "Major template restructure", details: "Restructured areas & sections", createdBy: "Pradhyumn D", publishedBy: "Pradhyumn D", created: "08 Jul 2026 09:30 AM", published: "14 Jul 2026 03:10 PM", projects: 10, changesCount: 41, changesSeverity: "HIGH" },
    { id: "v2.5", version: "v2.5", status: "ARCHIVED", summary: "Initial workflow configuration", details: "Initial stages, tasks & approvals", createdBy: "Admin User", publishedBy: "Pradhyumn D", created: "26 Jun 2026 02:11 PM", published: "30 Jun 2026 10:22 AM", projects: 6, changesCount: 19, changesSeverity: "MEDIUM" },
    { id: "v2.0", version: "v2.0", status: "ARCHIVED", summary: "Initial template release", details: "Base template with core structure", createdBy: "Admin User", publishedBy: "Pradhyumn D", created: "15 Jun 2026 11:08 AM", published: "20 Jun 2026 05:45 PM", projects: 4, changesCount: 32, changesSeverity: "HIGH" }
  ];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/project-templates/${template.id}/versions`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(body => {
        if (body?.data?.items && Array.isArray(body.data.items) && body.data.items.length > 0) {
          setVersionsData(body.data.items);
        } else {
          setVersionsData(defaultVersions);
        }
      })
      .catch(() => setVersionsData(defaultVersions))
      .finally(() => setLoading(false));
  }, [template.id]);

  const selectedVersion = versionsData.find(v => v.id === selectedVersionId) || defaultVersions.find(v => v.id === selectedVersionId);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PUBLISHED": return { bg: "#e6f6ee", color: "#00a95c" };
      case "DRAFT": return { bg: "#eff6ff", color: "var(--fig-blue)" };
      case "SUPERSEDED": return { bg: "#fffbeb", color: "#b45309" };
      case "ARCHIVED": return { bg: "#f1f5f9", color: "#64748b" };
      default: return { bg: "#f1f5f9", color: "#64748b" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 600 }}>Versions</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--fig-text-secondary)" }}>Manage template revisions, compare configuration changes, and control published versions.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid var(--fig-border)", padding: "8px 12px", borderRadius: "6px" }}>
            <Search size={14} color="var(--fig-text-secondary)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search versions..." style={{ border: "none", outline: "none", fontSize: "13px" }} />
          </label>
          <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Filter size={14} /> Filter</button>
          <button onClick={() => setShowPublishModal(true)} style={{ padding: "8px 18px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> New Version
          </button>
          <button style={{ padding: "8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer" }}><MoreHorizontal size={16} /></button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="workflow-stat-grid">
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Total Versions</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>06</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>3 Published</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Current Version</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>v3.2</span>
          <span style={{ fontSize: "11px", color: "#16a34a" }}>Published</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Active Draft</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>v3.3</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Updated 2h ago</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Projects Usding</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>42</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>This Template</span>
        </div>
      </div>

      {/* Sub-tab Pills */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", background: "var(--fig-bg)", padding: "4px", borderRadius: "8px", border: "1px solid var(--fig-border)" }}>
          {["All Versions", "Published", "Drafts", "Archived"].map(tab => (
            <button key={tab} onClick={() => setActiveSubTab(tab)} style={{
              padding: "6px 16px", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              background: activeSubTab === tab ? "white" : "transparent",
              color: activeSubTab === tab ? "var(--fig-blue)" : "var(--fig-text-secondary)",
              boxShadow: activeSubTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
            }}>
              {tab}
            </button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "var(--fig-text-secondary)" }}>
          <input type="checkbox" /> My Changes
        </label>
      </div>

      {/* Main Table + Detail Panel */}
      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ flex: selectedVersion ? 2 : 1, transition: "all 0.2s" }}>
          <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", overflow: "hidden" }}>
            <table className="workflow-tasks-table" style={{ border: "none" }}>
              <thead style={{ background: "var(--fig-bg)", borderBottom: "1px solid var(--fig-border)" }}>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>VERSION</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>STATUS</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>CHANGE SUMMARY</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>CREATED BY</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>PUBLISHED BY</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>CREATED</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>PUBLISHED</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>PROJECTS</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 500, color: "var(--fig-text-secondary)", fontSize: "12px" }}>CHANGES</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {(versionsData.length > 0 ? versionsData : defaultVersions).map((ver) => {
                  const sb = getStatusBadge(ver.status);
                  const isSelected = selectedVersionId === ver.id;
                  return (
                    <tr key={ver.id} onClick={() => setSelectedVersionId(ver.id)} style={{ borderBottom: "1px solid var(--fig-border)", cursor: "pointer", background: isSelected ? "var(--fig-blue-light)" : "transparent" }}>
                      <td style={{ padding: "16px", fontWeight: 600, fontSize: "13px" }}>{ver.version}</td>
                      <td style={{ padding: "16px" }}>
                        <span className="tag" style={{ background: sb.bg, color: sb.color, padding: "3px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600 }}>
                          {ver.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: 500, fontSize: "13px" }}>{ver.summary}</div>
                        <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{ver.details}</div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                          <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#e2e8f0", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>{ver.createdBy.charAt(0)}</span>
                          {ver.createdBy}
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "var(--fig-text-secondary)" }}>{ver.publishedBy}</td>
                      <td style={{ padding: "16px", fontSize: "11px", color: "var(--fig-text-secondary)" }}>{ver.created}</td>
                      <td style={{ padding: "16px", fontSize: "11px", color: "var(--fig-text-secondary)" }}>{ver.published}</td>
                      <td style={{ padding: "16px", fontSize: "13px" }}>{ver.projects}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: ver.changesSeverity === "HIGH" ? "#dc2626" : "#d97706" }}>
                          {ver.changesCount} <span style={{ background: ver.changesSeverity === "HIGH" ? "#fee2e2" : "#fef3c7", padding: "1px 5px", borderRadius: "3px" }}>{ver.changesSeverity}</span>
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <MoreHorizontal size={16} color="var(--fig-text-secondary)" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--fig-bg)" }}>
              <div style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Total Versions: 30</div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "13px" }}>Show per Page: <strong>10</strong> <ChevronDown size={12} /></span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>&lt;</button>
                  <button style={{ padding: "4px 8px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "4px" }}>1</button>
                  <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>2</button>
                  <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>3</button>
                  <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>4</button>
                  <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>5</button>
                  <button style={{ padding: "4px 8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "4px" }}>&gt;</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Version Detail (Inspector) */}
        {selectedVersion && (
          <div style={{ flex: 1, minWidth: "320px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--fig-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, textTransform: "uppercase" }}>ABOUT CURRENT VERSION</h3>
                <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Published on 06 Aug 26 · 02:32 PM</div>
                <div style={{ fontSize: "12px", color: "var(--fig-text)", marginTop: "4px" }}>Updated BOQ rates and commercial defaults.</div>
              </div>
              <button onClick={() => setSelectedVersionId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><X size={16} /></button>
            </div>

            <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600 }}>Snapshot Summary</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Status</span>
                    <span className="tag" style={{ background: "#e6f6ee", color: "#00a95c", padding: "1px 6px", borderRadius: "100px", fontSize: "10px", fontWeight: 700 }}>PUBLISHED</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Version</span>
                    <span style={{ fontWeight: 600 }}>v3.2</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Areas</span>
                    <span style={{ fontWeight: 600 }}>08</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Rooms</span>
                    <span style={{ fontWeight: 600 }}>24</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>BOQ Sections</span>
                    <span style={{ fontWeight: 600 }}>18</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>BOQ Items</span>
                    <span style={{ fontWeight: 600 }}>186</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Workflow Stages</span>
                    <span style={{ fontWeight: 600 }}>07</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Tasks</span>
                    <span style={{ fontWeight: 600 }}>48</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Milestones</span>
                    <span style={{ fontWeight: 600 }}>06</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Approvals</span>
                    <span style={{ fontWeight: 600 }}>09</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Rules</span>
                    <span style={{ fontWeight: 600 }}>14</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--fig-bg)", borderRadius: "4px" }}>
                    <span style={{ color: "var(--fig-text-secondary)" }}>Documents (Req.)</span>
                    <span style={{ fontWeight: 600 }}>12</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--fig-border)", paddingTop: "16px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600 }}>Usage</h4>
                <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)" }}>04 Aug 18 projects created from this version.</div>
                <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--fig-blue)", fontWeight: 600, marginTop: "6px", textDecoration: "none" }}>
                  View Projects →
                </a>
              </div>

              <div style={{ borderTop: "1px solid var(--fig-border)", paddingTop: "16px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600 }}>Last Activity</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", marginTop: "4px" }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Published</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>06 Aug 2026 · 14:32</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Pradhyumn Published v3.2</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--fig-blue)", marginTop: "4px" }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Approved</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>06 Aug 2026 · 14:11</div>
                      <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Version approved for publishing</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "16px", borderTop: "1px solid var(--fig-border)", textAlign: "center" }}>
              <button style={{ width: "100%", padding: "9px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", color: "var(--fig-blue)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                View Version Details
              </button>
            </div>
          </div>
        )}
      </div>

      {showPublishModal && (
        <PublishVersionModal 
          templateId={template.id}
          close={() => setShowPublishModal(false)}
          onPublished={() => {
            onUpdate();
            setShowPublishModal(false);
          }}
        />
      )}
    </div>
  );
}

function PublishVersionModal({ templateId, close, onPublished }: { templateId: string; close: () => void; onPublished: () => void }) {
  const [changeNote, setChangeNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/v1/project-templates/${templateId}/publish`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeNote })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to publish version");
      onPublished();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ background: "white", width: "460px", maxWidth: "90vw", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--fig-border)", paddingBottom: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Publish New Template Version</h3>
          <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}><X size={18} /></button>
        </div>
        {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "8px 12px", borderRadius: "6px", fontSize: "12px" }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
            Change Summary / Release Note *
            <textarea value={changeNote} onChange={e => setChangeNote(e.target.value)} required rows={3} placeholder="e.g. Updated BOQ Rates and commercial defaults for Q3" style={{ padding: "9px 12px", border: "1px solid var(--fig-border)", borderRadius: "6px", fontSize: "13px", resize: "vertical" }} />
          </label>
          <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)", lineHeight: "1.4" }}>
            Publishing will increment the version, snapshot the full template state, and make it available for all new projects.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button type="button" onClick={close} style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: "8px 18px", background: "var(--fig-blue)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Publishing..." : "Publish Version"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   ACTIVITY TAB
   ========================================================================= */
function ActivityTab({ template }: { template: Template }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const activities = [
    {
      id: "1",
      time: "14:42",
      dotColor: "#16a34a",
      user: "Pradhyumn Dhandi",
      userRole: "Creative Director",
      action: "Published Version 3.4",
      description: "Premium 3BHK Residential is not using Version 3.4 on the active published template.",
      linkText: "View Version",
      category: "Versions",
      categoryBadge: "v3.4",
      group: "TODAY",
      type: "publishing"
    },
    {
      id: "2",
      time: "12:18",
      dotColor: "#f59e0b",
      user: "Diptish Gohane",
      userRole: "Costing Manager",
      action: "updated Full Height Wardrobe",
      description: "Costing & BOQ → Master Bedroom → Furniture",
      diffText: "Rate Source: Template Snapshot → Current Costing Library",
      diffRates: "₹2,850 / Sq.Ft → ₹2,975 / Sq.Ft",
      linkText: "View Change",
      category: "Costing & BOQ",
      categoryBadge: "FUR-001",
      group: "TODAY",
      type: "changes"
    },
    {
      id: "3",
      time: "11:04",
      dotColor: "#2563eb",
      user: "Dhruv",
      userRole: "Workflow Specialist",
      action: "added Workflow Task",
      description: "Client Material Approval",
      subDesc: "Workflow → Tasks",
      linkText: "View Version",
      category: "Workflow",
      categoryBadge: "Stage: Procurement",
      group: "TODAY",
      type: "changes"
    },
    {
      id: "4",
      time: "09:32",
      dotColor: "#2563eb",
      user: "System",
      userRole: "Automated Event",
      action: "Costing Library Synchronisation Completed",
      description: "14 Costing items were updated",
      subDesc: "3 items require review",
      linkText: "View Version",
      category: "System",
      categoryBadge: "",
      group: "TODAY",
      type: "system"
    }
  ];

  const filtered = activities.filter(a => {
    if (filter !== "All" && a.type?.toLowerCase() !== filter.toLowerCase()) return false;
    if (search && !a.action.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 600 }}>Activity</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--fig-text-secondary)" }}>Track changes actions, approvals, publishing events, and usage activity associated with this template.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid var(--fig-border)", padding: "8px 12px", borderRadius: "6px" }}>
            <Search size={14} color="var(--fig-text-secondary)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activity..." style={{ border: "none", outline: "none", fontSize: "13px" }} />
          </label>
          <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Filter size={14} /> Filter</button>
          <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={14} /> Date</button>
          <button style={{ padding: "8px 16px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Download size={14} /> Export</button>
          <button style={{ padding: "8px", background: "white", border: "1px solid var(--fig-border)", borderRadius: "6px", cursor: "pointer" }}><MoreHorizontal size={16} /></button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="workflow-stat-grid">
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Total Events</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>284</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>All Time</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Changes This Week</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>18</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Last 7 Days</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Contributors</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>7</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Unique Users</span>
        </div>
        <div className="workflow-stat-card">
          <span style={{ fontSize: "13px", color: "var(--fig-text-secondary)" }}>Published Changes</span>
          <span style={{ fontSize: "24px", fontWeight: 600 }}>4</span>
          <span style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>Last 30 Days</span>
        </div>
      </div>

      {/* Filter Tabs & Sorting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", background: "var(--fig-bg)", padding: "4px", borderRadius: "8px", border: "1px solid var(--fig-border)" }}>
          {["All", "Changes", "Publishing", "Usage", "Access", "System"].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={{
              padding: "6px 16px", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              background: filter === tab ? "white" : "transparent",
              color: filter === tab ? "var(--fig-blue)" : "var(--fig-text-secondary)",
              boxShadow: filter === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
            }}>
              {tab}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--fig-text-secondary)" }}>
          Sort: <strong>Newest First</strong> <ChevronDown size={14} />
        </div>
      </div>

      {/* Timeline Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* TODAY header */}
        <div style={{ background: "#eef2f6", padding: "8px 16px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, color: "var(--fig-text-secondary)", letterSpacing: "0.5px" }}>
          TODAY
        </div>

        {/* Timeline Items */}
        <div style={{ background: "white", border: "1px solid var(--fig-border)", borderRadius: "8px", padding: "8px 20px" }}>
          {filtered.map((item, idx) => (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "20px 0", borderBottom: idx < filtered.length - 1 ? "1px solid var(--fig-border)" : "none" }}>
              <div style={{ minWidth: "44px", fontSize: "12px", color: "var(--fig-text-secondary)", paddingTop: "2px" }}>{item.time}</div>
              <div style={{ marginTop: "6px", width: "8px", height: "8px", borderRadius: "50%", background: item.dotColor, flexShrink: 0 }} />
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "180px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600 }}>
                  {item.user.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.user}</div>
                  <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)" }}>{item.userRole}</div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.action}</div>
                <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)", marginTop: "2px" }}>{item.description}</div>
                {item.subDesc && <div style={{ fontSize: "12px", color: "var(--fig-text-secondary)" }}>{item.subDesc}</div>}
                {item.diffText && (
                  <div style={{ fontSize: "11px", color: "var(--fig-text-secondary)", marginTop: "4px" }}>
                    {item.diffText} · <span style={{ fontWeight: 600, color: "#16a34a" }}>{item.diffRates}</span>
                  </div>
                )}
                {item.linkText && (
                  <a href="#" style={{ fontSize: "12px", color: "var(--fig-blue)", fontWeight: 600, marginTop: "6px", display: "inline-block", textDecoration: "none" }}>
                    {item.linkText}
                  </a>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {item.category && (
                  <div style={{ textAlign: "right", fontSize: "11px" }}>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><Layers size={13} /> {item.category}</div>
                    {item.categoryBadge && <div style={{ color: "var(--fig-text-secondary)" }}>{item.categoryBadge}</div>}
                  </div>
                )}
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fig-text-secondary)" }}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* YESTERDAY header */}
        <div style={{ background: "#eef2f6", padding: "8px 16px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, color: "var(--fig-text-secondary)", letterSpacing: "0.5px" }}>
          YESTERDAY
        </div>
      </div>
    </div>
  );
}

