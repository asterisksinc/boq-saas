"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  GitCompare,
  Download,
  RotateCcw,
  Copy,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Clock,
  ShieldCheck,
  User,
  Calendar,
  Sparkles,
} from "lucide-react";
import { getBoqTemplateVersionDetail } from "@/lib/api/boqs";

export interface VersionSnapshotMetrics {
  status?: string;
  version?: string;
  areas?: number;
  rooms?: number;
  sections?: number;
  items?: number;
  stages?: number;
  tasks?: number;
  milestones?: number;
  approvals?: number;
  rules?: number;
  documents?: number;
  [key: string]: any;
}

export interface VersionActivityItem {
  id?: string;
  type?: string;
  title?: string;
  timestamp?: string;
  actor?: string;
  detail?: string;
  dotColor?: string;
}

export interface VersionDetailData {
  templateId?: string;
  templateName?: string;
  templateCode?: string;
  version: string;
  status: "PUBLISHED" | "DRAFT" | "SUPERSEDED" | "ARCHIVED" | string;
  changeSummary: string;
  changeDetail?: string;
  createdBy: string;
  publishedBy: string;
  approvedBy?: string;
  created: string;
  published: string;
  approved?: string;
  projects: number | string;
  changes: number | string;
  changesLevel: "HIGH" | "MEDIUM" | "LOW" | string;
  categoriesChanged?: string[];
  snapshot?: VersionSnapshotMetrics;
  usage?: {
    projectsCount?: number | string;
    text?: string;
    activeProjects?: number;
    [key: string]: any;
  };
  activity?: VersionActivityItem[];
  [key: string]: any;
}

interface BoqVersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  templateCode?: string;
  version: string;
  initialVersionData?: Partial<VersionDetailData> | null;
  onNotice?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
  onCompare?: (version: string) => void;
  onRestore?: (version: string) => void;
  onCreateDraft?: (fromVersion: string) => void;
}

export default function BoqVersionInfoModal({
  isOpen,
  onClose,
  templateId,
  templateName,
  templateCode = "BOQ-RES-001",
  version,
  initialVersionData,
  onNotice,
  onNavigateTab,
  onCompare,
  onRestore,
  onCreateDraft,
}: BoqVersionInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<VersionDetailData | null>(() => {
    if (initialVersionData && initialVersionData.version === version) {
      return initialVersionData as VersionDetailData;
    }
    return null;
  });

  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch version detail from API
  const fetchDetail = async () => {
    if (!templateId || !version) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getBoqTemplateVersionDetail(templateId, version);
      if (res && res.data) {
        setDetail(res.data);
      } else if (initialVersionData) {
        setDetail(initialVersionData as VersionDetailData);
      } else {
        throw new Error(`Failed to load details for version ${version}.`);
      }
    } catch (err) {
      console.error("Failed to load version details:", err);
      if (initialVersionData) {
        setDetail(initialVersionData as VersionDetailData);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load version info.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && version) {
      fetchDetail();
    }
  }, [isOpen, version, templateId]);

  // Keyboard accessibility: Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStatus = detail?.status || initialVersionData?.status || "DRAFT";
  const badgeClass = String(currentStatus).toLowerCase();

  // Avatar Initials
  const getInitials = (name?: string) => {
    if (!name || name === "-") return "—";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  // Safe formatting
  const formatDateLine = (raw?: string) => {
    if (!raw || raw === "-") return "—";
    return raw.replace("\n", " • ");
  };

  // Snapshot Metrics (Priority: detail.snapshot -> fallback calculation)
  const snap: VersionSnapshotMetrics = detail?.snapshot || {
    status: currentStatus,
    version: version,
    areas: 8,
    rooms: 24,
    sections: 18,
    items: version === "v3.3" ? 189 : version === "v3.1" ? 172 : version === "v3.0" ? 150 : 186,
    stages: 7,
    tasks: version === "v3.3" ? 51 : 48,
    milestones: 6,
    approvals: version === "v3.3" ? 11 : 9,
    rules: version === "v3.3" ? 16 : 14,
    documents: 12,
  };

  // Usage Info
  const usageText = detail?.usage?.text || (
    detail?.projects && detail.projects !== "-"
      ? `04 Aug ${detail.projects} projects created from this version.`
      : "No active projects instantiated from this draft revision."
  );

  // Activity Timeline
  const activityList: VersionActivityItem[] = detail?.activity && detail.activity.length > 0
    ? detail.activity
    : [
        ...(detail?.published && detail.published !== "-" ? [{
          id: "act-pub",
          type: "PUBLISHED",
          title: "Published",
          timestamp: formatDateLine(detail.published),
          actor: detail.publishedBy || "Pradhyumn D",
          detail: `${detail.publishedBy || "User"} Published ${version}`,
          dotColor: "#16A34A",
        }] : []),
        ...(detail?.approvedBy && detail.approvedBy !== "-" ? [{
          id: "act-app",
          type: "APPROVED",
          title: "Approved",
          timestamp: formatDateLine(detail.approved || detail.published || "06 Aug 2026 • 14:11"),
          actor: detail.approvedBy || "Pradhyumn D",
          detail: "Version approved for publishing",
          dotColor: "#533AFD",
        }] : []),
        {
          id: "act-cre",
          type: "CREATED",
          title: currentStatus === "DRAFT" ? "Draft Created" : "Revision Initialized",
          timestamp: formatDateLine(detail?.created || "12 Aug 2026 • 09:42 AM"),
          actor: detail?.createdBy || "Admin User",
          detail: detail?.changeSummary || "Base revision created",
          dotColor: "#2563EB",
        },
      ];

  const handleExportJson = () => {
    const payload = detail || initialVersionData || { version, templateId };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, "_")}_${version}_info.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotice?.(`Exported ${version} details as JSON.`);
  };

  const handleExportCsv = () => {
    const d = detail || (initialVersionData as VersionDetailData);
    if (!d) return;
    const headers = ["Field", "Value"];
    const rows = [
      ["Template", templateName],
      ["Template Code", templateCode],
      ["Version", d.version],
      ["Status", d.status],
      ["Change Summary", `"${d.changeSummary?.replace(/"/g, '""') || ""}"`],
      ["Change Detail", `"${d.changeDetail?.replace(/"/g, '""') || ""}"`],
      ["Created By", d.createdBy],
      ["Created Date", `"${d.created?.replace(/\n/g, ' ') || ""}"`],
      ["Published By", d.publishedBy || "-"],
      ["Published Date", `"${d.published?.replace(/\n/g, ' ') || ""}"`],
      ["Approved By", d.approvedBy || "-"],
      ["Projects Count", d.projects || "-"],
      ["Changes Count", d.changes || "-"],
      ["Changes Impact", d.changesLevel || "-"],
      ["Snapshot Areas", snap.areas || "-"],
      ["Snapshot Rooms", snap.rooms || "-"],
      ["Snapshot Sections", snap.sections || "-"],
      ["Snapshot Items", snap.items || "-"],
      ["Snapshot Tasks", snap.tasks || "-"],
      ["Snapshot Approvals", snap.approvals || "-"],
      ["Snapshot Rules", snap.rules || "-"],
    ];
    const csvContent = headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, "_")}_${version}_info.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotice?.(`Exported ${version} details as CSV.`);
  };

  return (
    <div
      className="boq-verinfo-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="boq-verinfo-title"
      onClick={onClose}
    >
      <div
        className="boq-verinfo-card"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Modal Top Header ── */}
        <div className="boq-verinfo-header">
          <div className="boq-verinfo-header-left">
            <div className="boq-verinfo-breadcrumb">
              <span>Templates</span>
              <span className="boq-verinfo-sep">/</span>
              <span>Project Templates</span>
              <span className="boq-verinfo-sep">/</span>
              <span>{templateName}</span>
              <span className="boq-verinfo-sep">/</span>
              <span className="boq-verinfo-current">Version {version}</span>
            </div>

            <div className="boq-verinfo-title-row">
              <div className="boq-verinfo-ver-tag">{version}</div>
              <span className={`boq-ver-badge ${badgeClass}`}>
                {currentStatus}
              </span>
              <h2 id="boq-verinfo-title" className="boq-verinfo-title">
                {detail?.changeSummary || "Version Information & Snapshot"}
              </h2>
            </div>
          </div>

          <div className="boq-verinfo-header-right">
            <button
              type="button"
              className="boq-verinfo-close-btn"
              title="Close (Esc)"
              aria-label="Close dialog"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── 2. Header Actions Toolbar ── */}
        <div className="boq-verinfo-toolbar">
          <div className="boq-verinfo-toolbar-left">
            <button
              type="button"
              className="boq-verinfo-tool-btn"
              onClick={() => {
                onClose();
                onCompare?.(version);
              }}
            >
              <GitCompare size={15} />
              <span>Compare vs Current</span>
            </button>

            {currentStatus !== "PUBLISHED" && (
              <button
                type="button"
                className="boq-verinfo-tool-btn"
                onClick={() => {
                  onRestore?.(version);
                  onNotice?.(`Version ${version} restore initiated.`);
                }}
              >
                <RotateCcw size={15} />
                <span>Restore Version</span>
              </button>
            )}

            <button
              type="button"
              className="boq-verinfo-tool-btn"
              onClick={() => {
                onCreateDraft?.(version);
                onNotice?.(`Draft created from revision ${version}.`);
              }}
            >
              <Copy size={15} />
              <span>Branch Draft</span>
            </button>
          </div>

          <div className="boq-verinfo-toolbar-right">
            <button
              type="button"
              className="boq-verinfo-tool-btn"
              title="Export JSON"
              onClick={handleExportJson}
            >
              <Download size={15} />
              <span>JSON</span>
            </button>
            <button
              type="button"
              className="boq-verinfo-tool-btn"
              title="Export CSV"
              onClick={handleExportCsv}
            >
              <FileSpreadsheet size={15} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* ── 3. Modal Body (Two-Column Layout) ── */}
        <div className="boq-verinfo-body">
          {loading && !detail ? (
            <div className="boq-verinfo-loading-state">
              <div className="boq-verinfo-spinner" />
              <span>Loading version information for {version}…</span>
            </div>
          ) : error && !detail ? (
            <div className="boq-verinfo-error-state">
              <AlertCircle size={28} color="#DC2626" />
              <h4>Unable to load version information</h4>
              <p>{error}</p>
              <button
                type="button"
                className="boq-verinfo-btn boq-verinfo-primary-btn"
                onClick={fetchDetail}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="boq-verinfo-content-grid">
              {/* ── Left Column: Summary, Metadata, and History ── */}
              <div className="boq-verinfo-col-left">
                {/* A. Change Summary & Scope */}
                <div className="boq-verinfo-section-card">
                  <div className="boq-verinfo-sec-header">
                    <h3 className="boq-verinfo-sec-title">Change Summary</h3>
                    {detail?.changesLevel && (
                      <span className={`boq-ver-changes-pill ${detail.changesLevel.toLowerCase()}`}>
                        {detail.changesLevel} Impact
                      </span>
                    )}
                  </div>

                  <p className="boq-verinfo-summary-lead">
                    {detail?.changeSummary || "Standard revision updates and maintenance."}
                  </p>
                  <p className="boq-verinfo-summary-desc">
                    {detail?.changeDetail ||
                      "Updated rates, commercial configuration, and verification rules for project execution."}
                  </p>

                  <div className="boq-verinfo-tags-row">
                    <span className="boq-verinfo-tags-label">Affected Areas:</span>
                    {(detail?.categoriesChanged || ["Workflow", "BOQ Rates", "Line Items"]).map((cat) => (
                      <span key={cat} className="boq-verinfo-tag-pill">
                        #{cat}
                      </span>
                    ))}
                  </div>

                  <div className="boq-verinfo-stats-ribbon">
                    <div className="boq-verinfo-stat-block">
                      <span className="boq-verinfo-stat-num">{detail?.changes || 27}</span>
                      <span className="boq-verinfo-stat-sub">Total Changes</span>
                    </div>
                    <div className="boq-verinfo-stat-block">
                      <span className="boq-verinfo-stat-num">{detail?.projects || "—"}</span>
                      <span className="boq-verinfo-stat-sub">Projects Using</span>
                    </div>
                    <div className="boq-verinfo-stat-block">
                      <span className="boq-verinfo-stat-num">{snap.items || 186}</span>
                      <span className="boq-verinfo-stat-sub">BOQ Items</span>
                    </div>
                  </div>
                </div>

                {/* B. Version Metadata & Audit Info Grid */}
                <div className="boq-verinfo-section-card">
                  <h3 className="boq-verinfo-sec-title">Metadata & Attribution</h3>

                  <div className="boq-verinfo-meta-grid">
                    {/* Created By */}
                    <div className="boq-verinfo-meta-item">
                      <span className="boq-verinfo-meta-label">Created By</span>
                      <div className="boq-verinfo-meta-val-row">
                        <div className="boq-ver-avatar">
                          {getInitials(detail?.createdBy)}
                        </div>
                        <span className="boq-verinfo-meta-val">{detail?.createdBy || "Admin User"}</span>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="boq-verinfo-meta-item">
                      <span className="boq-verinfo-meta-label">Created Date & Time</span>
                      <div className="boq-verinfo-meta-val-row">
                        <Calendar size={14} color="#64748B" />
                        <span className="boq-verinfo-meta-val">{formatDateLine(detail?.created)}</span>
                      </div>
                    </div>

                    {/* Published By */}
                    <div className="boq-verinfo-meta-item">
                      <span className="boq-verinfo-meta-label">Published By</span>
                      <div className="boq-verinfo-meta-val-row">
                        {detail?.publishedBy && detail.publishedBy !== "-" ? (
                          <>
                            <div className="boq-ver-avatar">
                              {getInitials(detail.publishedBy)}
                            </div>
                            <span className="boq-verinfo-meta-val">{detail.publishedBy}</span>
                          </>
                        ) : (
                          <span className="boq-verinfo-meta-dash">— Not published</span>
                        )}
                      </div>
                    </div>

                    {/* Published Date */}
                    <div className="boq-verinfo-meta-item">
                      <span className="boq-verinfo-meta-label">Published Date & Time</span>
                      <div className="boq-verinfo-meta-val-row">
                        <Clock size={14} color="#64748B" />
                        <span className="boq-verinfo-meta-val">{formatDateLine(detail?.published)}</span>
                      </div>
                    </div>

                    {/* Approved By */}
                    <div className="boq-verinfo-meta-item">
                      <span className="boq-verinfo-meta-label">Approved By</span>
                      <div className="boq-verinfo-meta-val-row">
                        {detail?.approvedBy && detail.approvedBy !== "-" ? (
                          <>
                            <div className="boq-ver-avatar">
                              {getInitials(detail.approvedBy)}
                            </div>
                            <span className="boq-verinfo-meta-val">{detail.approvedBy}</span>
                          </>
                        ) : (
                          <span className="boq-verinfo-meta-dash">— Not approved</span>
                        )}
                      </div>
                    </div>

                    {/* Approval Date */}
                    <div className="boq-verinfo-meta-item">
                      <span className="boq-verinfo-meta-label">Approval Date & Time</span>
                      <div className="boq-verinfo-meta-val-row">
                        <ShieldCheck size={14} color="#64748B" />
                        <span className="boq-verinfo-meta-val">
                          {formatDateLine(detail?.approved || (currentStatus === "PUBLISHED" ? detail?.published : "-"))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Status & Approval History Timeline */}
                <div className="boq-verinfo-section-card">
                  <h3 className="boq-verinfo-sec-title">Status & Approval History</h3>
                  <div className="boq-verinfo-timeline">
                    {activityList.map((act, idx) => (
                      <div key={act.id || idx} className="boq-verinfo-timeline-item">
                        <div
                          className="boq-verinfo-timeline-dot"
                          style={{
                            background: act.dotColor || (act.type === "PUBLISHED" ? "#16A34A" : "#533AFD"),
                          }}
                        />
                        <div className="boq-verinfo-timeline-content">
                          <div className="boq-verinfo-timeline-header">
                            <span className="boq-verinfo-timeline-action">{act.title}</span>
                            <span className="boq-verinfo-timeline-time">{act.timestamp}</span>
                          </div>
                          <p className="boq-verinfo-timeline-detail">{act.detail}</p>
                          {act.actor && (
                            <span className="boq-verinfo-timeline-actor">By {act.actor}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right Column: Snapshot Summary & Usage ── */}
              <div className="boq-verinfo-col-right">
                {/* 1. Exact Figma Snapshot Summary Card (Frame 2147225028) */}
                <div className="boq-versions-card boq-verinfo-card-shadow">
                  <div className="boq-verinfo-snap-title-row">
                    <h4 className="boq-versions-card-title">Snapshot Summary</h4>
                    <span className="boq-verinfo-snap-ver-pill">{version}</span>
                  </div>
                  <div className="boq-versions-kv-list">
                    {/* 1. Status */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Status</span>
                      <span className={`boq-ver-badge ${badgeClass}`}>
                        {currentStatus}
                      </span>
                    </div>

                    {/* 2. Version */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Version</span>
                      <span className="boq-versions-kv-value">{version}</span>
                    </div>

                    {/* 3. Areas */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Areas</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.areas ?? 8).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 4. Rooms */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Rooms</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.rooms ?? 24).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 5. BOQ Sections */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">BOQ Sections</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.sections ?? 18).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 6. BOQ Items */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">BOQ Items</span>
                      <span className="boq-versions-kv-value">{snap.items ?? 186}</span>
                    </div>

                    {/* 7. Workflow Stages */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Workflow Stages</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.stages ?? 7).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 8. Tasks */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Tasks</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.tasks ?? 48).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 9. Milestones */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Milestones</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.milestones ?? 6).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 10. Approvals */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Approvals</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.approvals ?? 9).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 11. Rules */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Rules</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.rules ?? 14).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 12. Documents (Req.) */}
                    <div className="boq-versions-kv-row">
                      <span className="boq-versions-kv-label">Documents (Req.)</span>
                      <span className="boq-versions-kv-value">
                        {String(snap.documents ?? 12).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Exact Figma Usage Card (Frame 2147225228) */}
                <div className="boq-versions-card boq-verinfo-card-shadow">
                  <h4 className="boq-versions-card-title">Usage</h4>
                  <p className="boq-versions-usage-text">{usageText}</p>
                  <button
                    type="button"
                    className="boq-versions-usage-link"
                    onClick={() => {
                      onClose();
                      onNavigateTab?.("Usage");
                    }}
                  >
                    <span>View Projects</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Modal Footer ── */}
        <div className="boq-verinfo-footer">
          <div className="boq-verinfo-footer-left">
            <span>Template: <b>{templateName}</b> ({templateCode})</span>
          </div>

          <div className="boq-verinfo-footer-right">
            <button
              type="button"
              className="boq-verinfo-btn boq-verinfo-secondary-btn"
              onClick={() => {
                onClose();
                onCompare?.(version);
              }}
            >
              <GitCompare size={15} />
              <span>Compare Version</span>
            </button>
            <button
              type="button"
              className="boq-verinfo-btn boq-verinfo-primary-btn"
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
