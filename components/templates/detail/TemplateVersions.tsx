"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  X,
  ChevronDown,
  CheckCircle2,
  Clock,
  Archive,
  AlertTriangle,
  RotateCcw,
  GitCompare,
  ArrowRight,
  ExternalLink,
  Download,
  Layers,
  FileText,
  Workflow,
  Sparkles,
  Check,
} from "lucide-react";
import {
  getTemplateVersions,
  createTemplateVersion,
  TemplateVersionRecord,
  TemplateVersionStats,
} from "@/lib/api/templates";

interface TemplateVersionsProps {
  templateId: string;
  templateName?: string;
  templateCode?: string;
  useCount?: number;
  currentVersion?: string | number;
  onUseTemplate?: (version?: TemplateVersionRecord) => void;
  onUpdate?: () => void;
}

type VersionTab = "all" | "published" | "drafts" | "archived";

export default function TemplateVersions({
  templateId,
  templateName = "Template",
  templateCode,
  useCount = 0,
  currentVersion: initialCurrentVersion = "v3.2",
  onUseTemplate,
  onUpdate,
}: TemplateVersionsProps) {
  // State
  const [versions, setVersions] = useState<TemplateVersionRecord[]>([]);
  const [stats, setStats] = useState<TemplateVersionStats>({
    totalVersions: 6,
    publishedCount: 3,
    currentVersion: String(initialCurrentVersion || "v3.2"),
    activeDraft: "v3.3",
    activeDraftUpdatedAt: "Updated 2h ago",
    projectsUsing: useCount || 42,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<VersionTab>("all");
  const [myChanges, setMyChanges] = useState(false);
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Selection (Screen 2: Version Selected Detail Side Panel)
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersionRecord | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareVersion1, setCompareVersion1] = useState<TemplateVersionRecord | null>(null);
  const [compareVersion2, setCompareVersion2] = useState<TemplateVersionRecord | null>(null);

  // Form state for New Version
  const [newVersionTitle, setNewVersionTitle] = useState("");
  const [newVersionSub, setNewVersionSub] = useState("");
  const [newVersionLabel, setNewVersionLabel] = useState("");
  const [newVersionIsDraft, setNewVersionIsDraft] = useState(true);
  const [newVersionImpact, setNewVersionImpact] = useState("HIGH");
  const [isSubmittingNewVersion, setIsSubmittingNewVersion] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 280);
    return () => clearTimeout(handler);
  }, [search]);

  // Load versions from API
  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTemplateVersions(templateId, {
        page,
        pageSize,
        search: debouncedSearch,
        status: activeTab,
        myChanges,
      });

      if (res && Array.isArray(res.items)) {
        setVersions(res.items);
        setTotal(res.total ?? res.items.length);
        if (res.stats) {
          setStats(res.stats);
        }
        // If selected version exists, refresh it from new list or keep it
        if (selectedVersion) {
          const fresh = res.items.find((v) => v.id === selectedVersion.id);
          if (fresh) setSelectedVersion(fresh);
        }
      } else {
        setVersions([]);
        setTotal(0);
      }
    } catch (err: any) {
      console.error("Failed to load template versions:", err);
      setError(err?.message || "Failed to load template revisions.");
    } finally {
      setLoading(false);
    }
  }, [templateId, page, pageSize, debouncedSearch, activeTab, myChanges]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Filtered by impact client-side if selected
  const displayVersions = useMemo(() => {
    if (!impactFilter || impactFilter === "all") return versions;
    return versions.filter((v) => v.impact?.toUpperCase() === impactFilter.toUpperCase());
  }, [versions, impactFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Handle New Version submission
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionTitle.trim()) return;

    setIsSubmittingNewVersion(true);
    try {
      await createTemplateVersion(templateId, {
        versionLabel: newVersionLabel.trim() || undefined,
        summaryTitle: newVersionTitle.trim(),
        summarySubtitle: newVersionSub.trim() || undefined,
        changeNote: newVersionTitle.trim(),
        isDraft: newVersionIsDraft,
        impact: newVersionImpact,
      });

      setIsNewVersionModalOpen(false);
      setNewVersionTitle("");
      setNewVersionSub("");
      setNewVersionLabel("");
      setNewVersionIsDraft(true);
      await fetchVersions();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert(err?.message || "Failed to create version.");
    } finally {
      setIsSubmittingNewVersion(false);
    }
  };

  // Open Compare Modal
  const handleOpenCompare = (v1?: TemplateVersionRecord, v2?: TemplateVersionRecord) => {
    const list = displayVersions;
    const first = v1 || selectedVersion || list[0] || null;
    const second = v2 || (list.length > 1 ? (list[0].id === first?.id ? list[1] : list[0]) : null);
    setCompareVersion1(first);
    setCompareVersion2(second);
    setIsCompareModalOpen(true);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "Version",
      "Status",
      "Change Summary",
      "Change Details",
      "Created By",
      "Published By",
      "Created At",
      "Published At",
      "Projects Using",
      "Changes Count",
      "Impact",
    ];

    const rows = displayVersions.map((v) => [
      `"${v.versionLabel}"`,
      `"${v.status}"`,
      `"${(v.summaryTitle || "").replace(/"/g, '""')}"`,
      `"${(v.summarySubtitle || "").replace(/"/g, '""')}"`,
      `"${(v.createdBy?.name || "").replace(/"/g, '""')}"`,
      `"${(v.publishedBy?.name || "-").replace(/"/g, '""')}"`,
      `"${new Date(v.createdAt).toLocaleDateString("en-GB")}"`,
      `"${v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("en-GB") : "-"}"`,
      v.projectsCount ?? 0,
      v.changesCount ?? 0,
      `"${v.impact || "MEDIUM"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Template_${templateCode || templateId}_Versions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status pill class
  const getStatusClass = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "published") return "published";
    if (s === "draft") return "draft";
    if (s === "superseded") return "superseded";
    return "archived";
  };

  // Impact pill class
  const getImpactClass = (impact: string) => {
    const i = (impact || "").toLowerCase();
    if (i === "high") return "high";
    if (i === "medium") return "medium";
    return "low";
  };

  return (
    <div className="td-versions-tab-wrapper">
      {/* ====================================================================
          1. HEADER & TOOLBAR (Frame 2147225198)
          ==================================================================== */}
      <div className="td-ver-header-row">
        <div className="td-ver-header-left">
          <h2 className="td-ver-title">Versions</h2>
          <p className="td-ver-subtitle">
            Manage template revisions, compare configuration changes, and control published versions.
          </p>
        </div>

        <div className="td-ver-toolbar">
          {/* Search Box (Frame 76) */}
          <div className="td-ver-search-box">
            <div className="td-ver-search-icon-box">
              <Search size={16} color="#475569" />
            </div>
            <input
              type="text"
              className="td-ver-search-input"
              placeholder="Search versions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="td-ver-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`td-ver-filter-btn ${isFilterOpen || impactFilter !== "all" ? "active" : ""}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={16} />
              <span>Filter</span>
              {impactFilter !== "all" && (
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2563EB",
                  }}
                />
              )}
            </button>

            {isFilterOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 6,
                  width: 240,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  padding: 16,
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>Filters</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImpactFilter("all");
                      setActiveTab("all");
                      setMyChanges(false);
                      setIsFilterOpen(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 12,
                      color: "#2563EB",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#64748B", marginBottom: 6 }}>
                    Change Impact
                  </label>
                  <select
                    value={impactFilter}
                    onChange={(e) => setImpactFilter(e.target.value)}
                    style={{
                      width: "100%",
                      height: 34,
                      padding: "0 8px",
                      borderRadius: 6,
                      border: "1px solid #E2E8F0",
                      fontSize: 13,
                      color: "#0F172A",
                    }}
                  >
                    <option value="all">All Impacts</option>
                    <option value="HIGH">High Impact</option>
                    <option value="MEDIUM">Medium Impact</option>
                    <option value="LOW">Low Impact</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  style={{
                    width: "100%",
                    height: 34,
                    background: "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>

          {/* New Version Button */}
          <button
            type="button"
            className="td-ver-new-btn"
            onClick={() => setIsNewVersionModalOpen(true)}
          >
            <Plus size={16} />
            <span>New Version</span>
          </button>

          {/* More Options Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="td-ver-more-btn"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>

            {isMoreMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 6,
                  width: 200,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  padding: "6px 0",
                  zIndex: 50,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    handleOpenCompare();
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 13,
                    color: "#0F172A",
                    cursor: "pointer",
                  }}
                >
                  <GitCompare size={14} color="#64748B" />
                  <span>Compare Versions</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    handleExportCsv();
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 13,
                    color: "#0F172A",
                    cursor: "pointer",
                  }}
                >
                  <Download size={14} color="#64748B" />
                  <span>Export Versions CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    fetchVersions();
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 13,
                    color: "#0F172A",
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={14} color="#64748B" />
                  <span>Refresh List</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. SUMMARY KPI CARDS (Frame 2147225138)
          ==================================================================== */}
      <div className="td-ver-kpi-row">
        {/* Card 1: Total Versions */}
        <div className="td-ver-kpi-card">
          <span className="td-ver-kpi-label">Total Versions</span>
          <span className="td-ver-kpi-val">
            {stats.totalVersions < 10 ? `0${stats.totalVersions}` : stats.totalVersions}
          </span>
          <span className="td-ver-kpi-sub">{stats.publishedCount} Published</span>
        </div>

        {/* Card 2: Current Version */}
        <div className="td-ver-kpi-card">
          <span className="td-ver-kpi-label">Current Version</span>
          <span className="td-ver-kpi-val">{stats.currentVersion || "v3.2"}</span>
          <span className="td-ver-kpi-sub">Published</span>
        </div>

        {/* Card 3: Active Draft */}
        <div className="td-ver-kpi-card">
          <span className="td-ver-kpi-label">Active Draft</span>
          <span className="td-ver-kpi-val">{stats.activeDraft || "v3.3"}</span>
          <span className="td-ver-kpi-sub">{stats.activeDraftUpdatedAt || "Updated 2h ago"}</span>
        </div>

        {/* Card 4: Projects Using */}
        <div className="td-ver-kpi-card">
          <span className="td-ver-kpi-label">Projects Usding</span>
          <span className="td-ver-kpi-val">{stats.projectsUsing || 42}</span>
          <span className="td-ver-kpi-sub">This Template</span>
        </div>
      </div>

      {/* ====================================================================
          3. FILTER TABS & MY CHANGES CHECKBOX (Frame 2147225239)
          ==================================================================== */}
      <div className="td-ver-tabs-row">
        {/* Segmented Control */}
        <div className="td-ver-segmented-control">
          <button
            type="button"
            className={`td-ver-seg-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
          >
            All Versions
          </button>
          <button
            type="button"
            className={`td-ver-seg-btn ${activeTab === "published" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("published");
              setPage(1);
            }}
          >
            Published
          </button>
          <button
            type="button"
            className={`td-ver-seg-btn ${activeTab === "drafts" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("drafts");
              setPage(1);
            }}
          >
            Drafts
          </button>
          <button
            type="button"
            className={`td-ver-seg-btn ${activeTab === "archived" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("archived");
              setPage(1);
            }}
          >
            Archived
          </button>
        </div>

        {/* Checkbox: My Changes */}
        <label className="td-ver-mychanges-label">
          <input
            type="checkbox"
            className="td-ver-checkbox"
            checked={myChanges}
            onChange={(e) => {
              setMyChanges(e.target.checked);
              setPage(1);
            }}
          />
          <span>My Changes</span>
        </label>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#FEF2F2",
            border: "1px solid #F87171",
            borderRadius: 6,
            color: "#B91C1C",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchVersions}
            style={{
              background: "#B91C1C",
              color: "#FFFFFF",
              border: "none",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ====================================================================
          4. LAYOUT ROW: TABLE (left) + SIDE PANEL (right) (Frame 2147225238)
          ==================================================================== */}
      <div className="td-ver-layout-row">
        {/* Table Column */}
        <div className="td-ver-table-col">
          <div className="td-ver-table-card">
            <div className="td-ver-table-container">
              <table className="td-ver-table">
                {/* Header (Frame 57) */}
                <thead>
                  <tr>
                    <th style={{ width: 86 }}>VERSION</th>
                    <th style={{ width: 162 }}>STATUS</th>
                    <th style={{ minWidth: 240 }}>CHANGE SUMMARY</th>
                    <th style={{ width: 150 }}>CREATED BY</th>
                    <th style={{ width: 150 }}>PUBLISHED BY</th>
                    <th style={{ width: 120 }}>CREATED</th>
                    <th style={{ width: 120 }}>PUBLISHED</th>
                    <th style={{ width: 94, textAlign: "center" }}>PROJECTS</th>
                    <th style={{ width: 110 }}>CHANGES</th>
                    <th style={{ width: 64, textAlign: "center" }}>ACTIONS</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {loading && displayVersions.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "40px 16px" }}>
                        <div style={{ color: "#64748B", fontSize: 14 }}>
                          Loading template revisions…
                        </div>
                      </td>
                    </tr>
                  ) : displayVersions.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "48px 16px" }}>
                        <div style={{ color: "#0F172A", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                          No versions found
                        </div>
                        <div style={{ color: "#64748B", fontSize: 14 }}>
                          {search
                            ? `No template versions matching "${search}"`
                            : "No version revisions available for this filter."}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayVersions.map((ver) => {
                      const isSelected = selectedVersion?.id === ver.id;
                      const createdDate = new Date(ver.createdAt);
                      const publishedDate = ver.publishedAt ? new Date(ver.publishedAt) : null;
                      const authorInitials = (ver.createdBy.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      const pubInitials = ver.publishedBy
                        ? ver.publishedBy.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : null;

                      return (
                        <tr
                          key={ver.id}
                          className={isSelected ? "selected" : ""}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedVersion(null);
                            } else {
                              setSelectedVersion(ver);
                            }
                          }}
                        >
                          {/* 1. Version */}
                          <td>
                            <span className="td-ver-cell-version">{ver.versionLabel}</span>
                          </td>

                          {/* 2. Status */}
                          <td>
                            <span className={`td-ver-pill-status ${getStatusClass(ver.status)}`}>
                              {ver.status}
                            </span>
                          </td>

                          {/* 3. Change Summary */}
                          <td>
                            <div className="td-ver-summary-col">
                              <span className="td-ver-summary-title">{ver.summaryTitle}</span>
                              <span className="td-ver-summary-sub">{ver.summarySubtitle}</span>
                            </div>
                          </td>

                          {/* 4. Created By */}
                          <td>
                            <div className="td-ver-author-wrap">
                              <div className="td-ver-author-avatar">{authorInitials}</div>
                              <span className="td-ver-author-name">{ver.createdBy.name}</span>
                            </div>
                          </td>

                          {/* 5. Published By */}
                          <td>
                            {ver.publishedBy ? (
                              <div className="td-ver-author-wrap">
                                <div className="td-ver-author-avatar">{pubInitials}</div>
                                <span className="td-ver-author-name">{ver.publishedBy.name}</span>
                              </div>
                            ) : (
                              <span style={{ color: "#0F172A", fontSize: 14 }}>-</span>
                            )}
                          </td>

                          {/* 6. Created On */}
                          <td>
                            <div className="td-ver-date-col">
                              <span className="td-ver-date-val">
                                {createdDate.toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="td-ver-time-val">
                                {createdDate.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>

                          {/* 7. Published On */}
                          <td>
                            {publishedDate ? (
                              <div className="td-ver-date-col">
                                <span className="td-ver-date-val">
                                  {publishedDate.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="td-ver-time-val">
                                  {publishedDate.toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: "#64748B", fontSize: 14 }}>-</span>
                            )}
                          </td>

                          {/* 8. Projects Using */}
                          <td style={{ textAlign: "center" }}>
                            {ver.projectsCount ? (
                              <span className="td-ver-num-val">{ver.projectsCount}</span>
                            ) : (
                              <span style={{ color: "#64748B", fontSize: 14 }}>-</span>
                            )}
                          </td>

                          {/* 9. Changes & Impact */}
                          <td>
                            <div className="td-ver-changes-wrap">
                              <span className="td-ver-num-val">{ver.changesCount || 0}</span>
                              <span className={`td-ver-pill-impact ${getImpactClass(ver.impact || "HIGH")}`}>
                                {ver.impact || "HIGH"}
                              </span>
                            </div>
                          </td>

                          {/* 10. Actions */}
                          <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="td-ver-action-btn"
                              title="Version options"
                              onClick={() => setSelectedVersion(ver)}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Row (Frame 2147225166) */}
            <div className="td-ver-pagination-row">
              <span className="td-ver-pagination-total">Total Versions: {total}</span>

              {/* Numbered Page Buttons */}
              <div className="td-ver-pagination-btns">
                <button
                  type="button"
                  className="td-ver-pagination-btn"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const hasGap = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {hasGap && <span style={{ padding: "0 4px", color: "#64748B" }}>...</span>}
                        <button
                          type="button"
                          className={`td-ver-pagination-btn ${page === p ? "active" : ""}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  className="td-ver-pagination-btn"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>

              {/* Show per Page */}
              <div className="td-ver-show-per-page">
                <span>Show per Page:</span>
                <select
                  className="td-ver-page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            5. VERSION SELECTED DETAIL SIDE PANEL (Screen 2)
            ==================================================================== */}
        {selectedVersion && (
          <aside className="td-ver-side-panel" aria-label="Version Details Side Panel">
            {/* Header */}
            <div className="td-ver-side-header">
              <div className="td-ver-side-title-wrap">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="td-ver-side-version-badge">{selectedVersion.versionLabel}</span>
                  <span className={`td-ver-pill-status ${getStatusClass(selectedVersion.status)}`}>
                    {selectedVersion.status}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#64748B" }}>
                  Template ID: {templateCode || "TEM-RES-2938"}
                </span>
              </div>

              <button
                type="button"
                className="td-ver-side-close"
                onClick={() => setSelectedVersion(null)}
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </div>

            {/* Change Summary Card */}
            <div className="td-ver-side-card">
              <span className="td-ver-side-section-title">Change Summary</span>
              <p className="td-ver-side-summary-text">{selectedVersion.summaryTitle}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: "140%" }}>
                {selectedVersion.summarySubtitle || selectedVersion.changeNote || "Standard revision updates."}
              </p>
            </div>

            {/* 2x2 Metadata Grid */}
            <div className="td-ver-side-meta-grid">
              <div className="td-ver-side-meta-item">
                <span className="td-ver-side-meta-lbl">Created By</span>
                <span className="td-ver-side-meta-val">{selectedVersion.createdBy.name}</span>
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  {new Date(selectedVersion.createdAt).toLocaleDateString("en-GB")}
                </span>
              </div>

              <div className="td-ver-side-meta-item">
                <span className="td-ver-side-meta-lbl">Published By</span>
                <span className="td-ver-side-meta-val">
                  {selectedVersion.publishedBy?.name || "Not Published"}
                </span>
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  {selectedVersion.publishedAt
                    ? new Date(selectedVersion.publishedAt).toLocaleDateString("en-GB")
                    : "Draft Mode"}
                </span>
              </div>

              <div className="td-ver-side-meta-item">
                <span className="td-ver-side-meta-lbl">Active Projects</span>
                <span className="td-ver-side-meta-val">
                  {selectedVersion.projectsCount ? `${selectedVersion.projectsCount} Projects` : "0 Projects"}
                </span>
              </div>

              <div className="td-ver-side-meta-item">
                <span className="td-ver-side-meta-lbl">Modifications</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="td-ver-side-meta-val">{selectedVersion.changesCount || 0}</span>
                  <span className={`td-ver-pill-impact ${getImpactClass(selectedVersion.impact || "HIGH")}`}>
                    {selectedVersion.impact || "HIGH"}
                  </span>
                </div>
              </div>
            </div>

            {/* Snapshot Components */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="td-ver-side-section-title">Configuration Snapshot</span>
              <div className="td-ver-side-stats-row">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Layers size={14} color="#2563EB" />
                  <span>Structure Areas</span>
                </div>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>
                  {selectedVersion.snapshot?.areasCount ?? 8} Areas
                </span>
              </div>

              <div className="td-ver-side-stats-row">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} color="#16A34A" />
                  <span>BOQ Sections</span>
                </div>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>
                  {selectedVersion.snapshot?.boqSectionsCount ?? 18} Items
                </span>
              </div>

              <div className="td-ver-side-stats-row">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Workflow size={14} color="#FAB000" />
                  <span>Workflow Stages</span>
                </div>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>
                  {selectedVersion.snapshot?.workflowStagesCount ?? 7} Stages
                </span>
              </div>

              <div className="td-ver-side-stats-row">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={14} color="#64748B" />
                  <span>Documents Template</span>
                </div>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>
                  {selectedVersion.snapshot?.documentsCount ?? 6} Docs
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="td-ver-side-actions">
              <button
                type="button"
                className="td-ver-side-btn-primary"
                onClick={() => {
                  if (onUseTemplate) {
                    onUseTemplate(selectedVersion);
                  } else {
                    alert(`Selected ${selectedVersion.versionLabel} to create project.`);
                  }
                }}
              >
                <span>Use This Version</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="td-ver-side-btn-secondary"
                onClick={() => handleOpenCompare(selectedVersion)}
              >
                <GitCompare size={15} />
                <span>Compare Revisions</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ====================================================================
          6. CREATE NEW VERSION MODAL
          ==================================================================== */}
      {isNewVersionModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setIsNewVersionModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#FFFFFF",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                  Create New Version
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                  Save a new snapshot of {templateName} ({templateCode || "TEM-RES-2938"}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateVersion} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Version Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. v3.4"
                  value={newVersionLabel}
                  onChange={(e) => setNewVersionLabel(e.target.value)}
                  style={{
                    width: "100%",
                    height: 42,
                    padding: "0 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 14,
                    color: "#0F172A",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Change Summary Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Updated BOQ commercial rates & Milestones"
                  value={newVersionTitle}
                  onChange={(e) => setNewVersionTitle(e.target.value)}
                  style={{
                    width: "100%",
                    height: 42,
                    padding: "0 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 14,
                    color: "#0F172A",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the changes made to structure, costing or workflow stages..."
                  value={newVersionSub}
                  onChange={(e) => setNewVersionSub(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 14,
                    color: "#0F172A",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Change Impact
                  </label>
                  <select
                    value={newVersionImpact}
                    onChange={(e) => setNewVersionImpact(e.target.value)}
                    style={{
                      width: "100%",
                      height: 42,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 14,
                      color: "#0F172A",
                    }}
                  >
                    <option value="HIGH">High Impact</option>
                    <option value="MEDIUM">Medium Impact</option>
                    <option value="LOW">Low Impact</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Release Status
                  </label>
                  <select
                    value={newVersionIsDraft ? "draft" : "published"}
                    onChange={(e) => setNewVersionIsDraft(e.target.value === "draft")}
                    style={{
                      width: "100%",
                      height: 42,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 14,
                      color: "#0F172A",
                    }}
                  >
                    <option value="draft">Save as Draft</option>
                    <option value="published">Publish Immediately</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  style={{
                    height: 42,
                    padding: "0 18px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewVersion}
                  style={{
                    height: 42,
                    padding: "0 22px",
                    borderRadius: 6,
                    border: "none",
                    background: "#2563EB",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {isSubmittingNewVersion ? "Saving…" : "Create Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          7. COMPARE VERSIONS MODAL
          ==================================================================== */}
      {isCompareModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setIsCompareModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 780,
              background: "#FFFFFF",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <GitCompare size={20} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                  Compare Revisions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Version 1 Picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Base Version</label>
                <select
                  value={compareVersion1?.id || ""}
                  onChange={(e) => {
                    const match = versions.find((v) => v.id === e.target.value);
                    if (match) setCompareVersion1(match);
                  }}
                  style={{
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    padding: "0 8px",
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.versionLabel} — {v.status} ({v.summaryTitle})
                    </option>
                  ))}
                </select>

                {compareVersion1 && (
                  <div
                    style={{
                      background: "#F8FAFC",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>
                        {compareVersion1.versionLabel}
                      </span>
                      <span className={`td-ver-pill-status ${getStatusClass(compareVersion1.status)}`}>
                        {compareVersion1.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>
                      {compareVersion1.summaryTitle}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B" }}>
                      {compareVersion1.summarySubtitle}
                    </span>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                      Author: {compareVersion1.createdBy.name} · {compareVersion1.changesCount} modifications
                    </div>
                  </div>
                )}
              </div>

              {/* Version 2 Picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Compare With</label>
                <select
                  value={compareVersion2?.id || ""}
                  onChange={(e) => {
                    const match = versions.find((v) => v.id === e.target.value);
                    if (match) setCompareVersion2(match);
                  }}
                  style={{
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    padding: "0 8px",
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.versionLabel} — {v.status} ({v.summaryTitle})
                    </option>
                  ))}
                </select>

                {compareVersion2 && (
                  <div
                    style={{
                      background: "#F8FAFC",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>
                        {compareVersion2.versionLabel}
                      </span>
                      <span className={`td-ver-pill-status ${getStatusClass(compareVersion2.status)}`}>
                        {compareVersion2.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>
                      {compareVersion2.summaryTitle}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B" }}>
                      {compareVersion2.summarySubtitle}
                    </span>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                      Author: {compareVersion2.createdBy.name} · {compareVersion2.changesCount} modifications
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Diff Summary */}
            {compareVersion1 && compareVersion2 && (
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 8,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 13, color: "#1E40AF" }}>
                  Delta Between {compareVersion1.versionLabel} and {compareVersion2.versionLabel}
                </span>
                <span style={{ fontSize: 13, color: "#1E3A8A" }}>
                  {Math.abs((compareVersion1.changesCount || 0) - (compareVersion2.changesCount || 0))} net modifications difference · 
                  Status transition from {compareVersion2.status} to {compareVersion1.status}.
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                style={{
                  height: 40,
                  padding: "0 20px",
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
