"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  Upload,
  Download,
  MoreVertical,
  MoreHorizontal,
  X,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  GitBranch,
  FileText,
  Layers,
  Settings,
  Clock,
  User,
  ShieldCheck,
  CheckSquare,
  Share2,
  Copy,
} from "lucide-react";
import { getBoqTemplateActivity } from "@/lib/api/boqs";
import type {
  TemplateActivityRecord,
  TemplateActivityResponse,
  TemplateActivityChangeItem,
} from "@/lib/api/templates";

export interface BoqTemplateActivityProps {
  template: Record<string, any>;
  onRefresh?: () => Promise<void> | void;
  onNotice?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenVersion?: (version: string) => void;
}

export default function BoqTemplateActivity({
  template,
  onRefresh,
  onNotice,
  onNavigateTab,
  onOpenVersion,
}: BoqTemplateActivityProps) {
  const templateId = template?.id || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<TemplateActivityResponse | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [dateRange, setDateRange] = useState("all");

  // Selection for Side Panel (Screen 2)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Dropdown states
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Activity Data
  const fetchData = useCallback(async () => {
    if (!templateId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getBoqTemplateActivity(templateId, {
        search: debouncedSearch,
        category,
        sort,
        dateRange,
      });
      setActivityData(res);
    } catch (err: any) {
      console.error("Failed to load BOQ template activity:", err);
      setError(err?.message || "Failed to load activity feed.");
    } finally {
      setLoading(false);
    }
  }, [templateId, debouncedSearch, category, sort, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Export CSV
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const q = new URLSearchParams({ export: "csv" });
      if (debouncedSearch) q.set("search", debouncedSearch);
      if (category !== "all") q.set("category", category);
      if (sort) q.set("sort", sort);
      if (dateRange !== "all") q.set("dateRange", dateRange);

      const url = `/api/v1/boq-templates/${templateId}/activity?${q.toString()}`;
      window.open(url, "_blank");
      if (onNotice) onNotice("Exported activity log to CSV.");
    } catch (e) {
      console.error("Export failed:", e);
      if (onNotice) onNotice("Failed to export activity log.");
    } finally {
      setExporting(false);
    }
  };

  // Find currently selected activity item
  const selectedActivity = useMemo(() => {
    if (!selectedActivityId || !activityData?.items) return null;
    return activityData.items.find((item) => item.id === selectedActivityId) || null;
  }, [selectedActivityId, activityData]);

  // Render Change Icon in Side Panel
  const renderChangeIcon = (iconName: string) => {
    switch (iconName) {
      case "payment_card":
        return <CreditCard size={14} />;
      case "arrow_split":
        return <GitBranch size={14} />;
      case "docs":
        return <FileText size={14} />;
      case "settings":
        return <Settings size={14} />;
      case "data_table":
      default:
        return <Layers size={14} />;
    }
  };

  // Handle Navigation to Version
  const handleVersionClick = (verLabel: string) => {
    if (onOpenVersion) {
      onOpenVersion(verLabel);
    } else if (onNavigateTab) {
      onNavigateTab("Versions");
    }
  };

  const stats = activityData?.stats || {
    totalEvents: 284,
    changesThisWeek: 18,
    contributors: 7,
    publishedChanges: 4,
  };

  return (
    <div className="boq-act-container" data-testid="boq-template-activity-container">
      {/* 1. Header & Toolbar (Figma Frame 2147225198 & 76) */}
      <div className="boq-act-header-row" data-testid="boq-template-activity-header">
        <div className="boq-act-header-left">
          <h2 className="boq-act-title">Activity</h2>
          <p className="boq-act-subtitle">
            Track changes actions, approvals, publishing events, and usage activity associated with this template.
          </p>
        </div>

        <div className="boq-act-toolbar" data-testid="boq-template-activity-toolbar">
          {/* Frosted Search Box */}
          <div className="boq-act-search-box">
            <div className="boq-act-search-icon-box">
              <Search size={16} />
            </div>
            <input
              type="text"
              className="boq-act-search-input"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search activity"
              data-testid="boq-activity-search-input"
            />
            {search && (
              <button
                type="button"
                className="boq-act-close-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{ width: 20, height: 20 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`boq-act-toolbar-btn ${category !== "all" ? "active" : ""}`}
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowDateDropdown(false);
                setShowSortDropdown(false);
              }}
              data-testid="boq-activity-filter-btn"
            >
              <Filter size={16} />
              <span>Filter</span>
            </button>
            {showFilterDropdown && (
              <div className="boq-act-dropdown-menu" data-testid="boq-filter-dropdown-menu">
                {["all", "changes", "publishing", "usage", "access", "system"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`boq-act-dropdown-item ${category === cat ? "active" : ""}`}
                    onClick={() => {
                      setCategory(cat);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>{cat}</span>
                    {category === cat && <CheckCircle2 size={14} color="#2563EB" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`boq-act-toolbar-btn ${dateRange !== "all" ? "active" : ""}`}
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowFilterDropdown(false);
                setShowSortDropdown(false);
              }}
              data-testid="boq-activity-date-btn"
            >
              <Calendar size={16} />
              <span>{dateRange === "all" ? "Date" : dateRange.toUpperCase()}</span>
            </button>
            {showDateDropdown && (
              <div className="boq-act-dropdown-menu" data-testid="boq-date-dropdown-menu">
                {[
                  { id: "all", label: "All Dates" },
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "7d", label: "Last 7 Days" },
                  { id: "30d", label: "Last 30 Days" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`boq-act-dropdown-item ${dateRange === item.id ? "active" : ""}`}
                    onClick={() => {
                      setDateRange(item.id);
                      setShowDateDropdown(false);
                    }}
                  >
                    <span>{item.label}</span>
                    {dateRange === item.id && <CheckCircle2 size={14} color="#2563EB" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            className="boq-act-toolbar-btn"
            onClick={handleExportCsv}
            disabled={exporting}
            data-testid="boq-activity-export-btn"
          >
            <Download size={16} />
            <span>{exporting ? "Exporting..." : "Export"}</span>
          </button>

          {/* More Options Button */}
          <button
            type="button"
            className="boq-act-toolbar-btn boq-act-icon-btn"
            aria-label="More options"
            onClick={() => {
              // Quick reset all filters
              setSearch("");
              setCategory("all");
              setDateRange("all");
              setSort("newest");
              if (onNotice) onNotice("Filters reset.");
            }}
            title="Reset filters"
            data-testid="boq-activity-more-btn"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards (Figma Frame 2147225138) */}
      <div className="boq-act-kpi-grid" data-testid="boq-activity-kpi-grid">
        {/* Card 1: Total Events */}
        <div className="boq-act-kpi-card" data-testid="kpi-total-events">
          <div className="boq-act-kpi-label">Total Events</div>
          <div className="boq-act-kpi-value-row">
            <span className="boq-act-kpi-value">{stats.totalEvents}</span>
            <span className="boq-act-kpi-subtext">All Time</span>
          </div>
        </div>

        {/* Card 2: Changes This Week */}
        <div className="boq-act-kpi-card" data-testid="kpi-changes-week">
          <div className="boq-act-kpi-label">Changes This Week</div>
          <div className="boq-act-kpi-value-row">
            <span className="boq-act-kpi-value">{stats.changesThisWeek}</span>
            <span className="boq-act-kpi-subtext">Last 7 Days</span>
          </div>
        </div>

        {/* Card 3: Contributors */}
        <div className="boq-act-kpi-card" data-testid="kpi-contributors">
          <div className="boq-act-kpi-label">Contributors</div>
          <div className="boq-act-kpi-value-row">
            <span className="boq-act-kpi-value">{stats.contributors}</span>
            <span className="boq-act-kpi-subtext">Unique Users</span>
          </div>
        </div>

        {/* Card 4: Published Changes */}
        <div className="boq-act-kpi-card" data-testid="kpi-published-changes">
          <div className="boq-act-kpi-label">Published Changes</div>
          <div className="boq-act-kpi-value-row">
            <span className="boq-act-kpi-value">{stats.publishedChanges}</span>
            <span className="boq-act-kpi-subtext">Last 30 Days</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs Segmented Control & Sort Dropdown (Figma Frame 2147225241) */}
      <div className="boq-act-tabs-row" data-testid="boq-activity-tabs-row">
        {/* Segmented Control */}
        <div className="boq-act-segmented-control" data-testid="boq-activity-segmented-control">
          {[
            { id: "all", label: "All" },
            { id: "changes", label: "Changes" },
            { id: "publishing", label: "Publishing" },
            { id: "usage", label: "Usage" },
            { id: "access", label: "Access" },
            { id: "system", label: "System" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`boq-act-seg-btn ${category === tab.id ? "active" : ""}`}
              onClick={() => setCategory(tab.id)}
              data-testid={`boq-activity-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="boq-act-sort-btn"
            onClick={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowDateDropdown(false);
              setShowFilterDropdown(false);
            }}
            data-testid="boq-activity-sort-btn"
          >
            <span>Sort: {sort === "newest" ? "Newest First" : "Oldest First"}</span>
            <ChevronDown size={16} />
          </button>
          {showSortDropdown && (
            <div className="boq-act-dropdown-menu" data-testid="boq-sort-dropdown-menu">
              <button
                type="button"
                className={`boq-act-dropdown-item ${sort === "newest" ? "active" : ""}`}
                onClick={() => {
                  setSort("newest");
                  setShowSortDropdown(false);
                }}
              >
                <span>Newest First</span>
                {sort === "newest" && <CheckCircle2 size={14} color="#2563EB" />}
              </button>
              <button
                type="button"
                className={`boq-act-dropdown-item ${sort === "oldest" ? "active" : ""}`}
                onClick={() => {
                  setSort("oldest");
                  setShowSortDropdown(false);
                }}
              >
                <span>Oldest First</span>
                {sort === "oldest" && <CheckCircle2 size={14} color="#2563EB" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Split Layout: Timeline Container + Side Panel */}
      <div className="boq-act-content-row" data-testid="boq-activity-content-row">
        {/* Timeline Container (Left column) */}
        <div
          className="boq-act-timeline-container"
          style={{ width: selectedActivity ? "calc(100% - 330px)" : "100%" }}
          data-testid="boq-activity-timeline-container"
        >
          {loading && <div className="boq-act-loading">Loading template activity...</div>}

          {error && <div className="boq-act-empty">{error}</div>}

          {!loading && (!activityData?.groups || activityData.groups.length === 0) && (
            <div className="boq-act-empty">No activity records match your current filter.</div>
          )}

          {!loading &&
            activityData?.groups?.map((group) => (
              <div
                key={group.label}
                className="boq-act-group-section"
                data-testid={`boq-activity-group-${group.label.toLowerCase()}`}
              >
                {/* Date Divider Header (Component 5 / Frame 57) */}
                <div className="boq-act-group-header">{group.label}</div>

                {/* Timeline Event Rows */}
                <div className="boq-act-group-list">
                  {group.items.map((item) => {
                    const isSelected = selectedActivityId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`boq-act-item-row ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedActivityId(isSelected ? null : item.id)}
                        data-testid={`boq-activity-item-${item.id}`}
                      >
                        {/* 1. Time */}
                        <div className="boq-act-col-time">{item.timeLabel}</div>

                        {/* 2. Track & Indicator Dot */}
                        <div className="boq-act-col-track">
                          <div className={`boq-act-track-dot ${item.markerColor}`} />
                        </div>

                        {/* 3. Actor Info */}
                        <div className="boq-act-col-actor">
                          <div className="boq-act-actor-avatar">
                            {item.actor.avatar ? (
                              <img src={item.actor.avatar} alt={item.actor.name} />
                            ) : (
                              <span>{item.actor.initials}</span>
                            )}
                          </div>
                          <div className="boq-act-actor-info">
                            <span className="boq-act-actor-name" title={item.actor.name}>
                              {item.actor.name}
                            </span>
                            <span className="boq-act-actor-role" title={item.actor.role}>
                              {item.actor.role}
                            </span>
                          </div>
                        </div>

                        {/* 4. Event Content */}
                        <div className="boq-act-col-content">
                          <div className="boq-act-event-title">{item.title}</div>
                          {item.description && (
                            <div className="boq-act-event-desc">{item.description}</div>
                          )}

                          {/* Costing Diff Box */}
                          {item.diff && (
                            <div className="boq-act-diff-box">
                              {item.diff.rateSource && (
                                <div className="boq-act-diff-line">{item.diff.rateSource}</div>
                              )}
                              {item.diff.rateValue && (
                                <div className="boq-act-diff-val">{item.diff.rateValue}</div>
                              )}
                            </div>
                          )}

                          {/* Context Action Link */}
                          {item.actionLink && (
                            <button
                              type="button"
                              className="boq-act-event-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.actionLink.label.includes("Version")) {
                                  const verMatch = item.scopeBadges?.find((b) => b.label.startsWith("v"))?.label || template?.version || "v3.4";
                                  handleVersionClick(verMatch);
                                } else if (item.actionLink.label.includes("Change")) {
                                  if (onNavigateTab) onNavigateTab("Costing");
                                } else if (onNotice) {
                                  onNotice(item.actionLink.label);
                                }
                              }}
                            >
                              <span>{item.actionLink.label}</span>
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>

                        {/* 5. Scope Badges */}
                        <div className="boq-act-col-badges">
                          {item.scopeBadges?.map((badge, bIdx) => (
                            <span
                              key={bIdx}
                              className={badge.type === "category" ? "boq-act-scope-pill" : "boq-act-sub-pill"}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>

                        {/* 6. More Options */}
                        <div className="boq-act-col-action">
                          <button
                            type="button"
                            className="boq-act-more-btn"
                            aria-label="Activity item options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivityId(item.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* 5. Screen 2: Activity Details Side Panel (Figma Frame 2147225086) */}
        {selectedActivity && (
          <aside className="boq-act-side-panel" data-testid="boq-activity-side-panel">
            {/* Panel Header */}
            <div className="boq-act-panel-header">
              <div className="boq-act-panel-title-group">
                <span className="boq-act-panel-label">Activity Details</span>
                <span className={`boq-act-status-pill ${selectedActivity.statusPillType}`}>
                  {selectedActivity.statusPill}
                </span>
              </div>
              <button
                type="button"
                className="boq-act-close-btn"
                aria-label="Close activity details"
                onClick={() => setSelectedActivityId(null)}
                data-testid="boq-close-side-panel-btn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Actor Card */}
            <div className="boq-act-actor-card">
              <div className="boq-act-actor-avatar" style={{ width: 36, height: 36 }}>
                {selectedActivity.actor.avatar ? (
                  <img src={selectedActivity.actor.avatar} alt={selectedActivity.actor.name} />
                ) : (
                  <span>{selectedActivity.actor.initials}</span>
                )}
              </div>
              <div className="boq-act-actor-meta">
                <span className="boq-act-actor-name" style={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedActivity.actor.name}
                </span>
                <span className="boq-act-actor-role">{selectedActivity.actor.role}</span>
                <span className="boq-act-actor-time">
                  {new Date(selectedActivity.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  • {selectedActivity.timeLabel} IST
                </span>
              </div>
            </div>

            {/* Action Transition Columns */}
            <div className="boq-act-transition-grid" data-testid="boq-activity-transition-grid">
              <div className="boq-act-transition-col">
                <span className="boq-act-trans-label">Action</span>
                <span className="boq-act-trans-val" title={selectedActivity.details.action}>
                  {selectedActivity.details.action}
                </span>
              </div>
              <div className="boq-act-transition-col">
                <span className="boq-act-trans-label">Previous</span>
                <span className="boq-act-trans-val" title={selectedActivity.details.previous}>
                  {selectedActivity.details.previous}
                </span>
              </div>
              <div className="boq-act-transition-col">
                <span className="boq-act-trans-label">New</span>
                <span className="boq-act-trans-val" title={selectedActivity.details.newVal}>
                  {selectedActivity.details.newVal}
                </span>
              </div>
            </div>

            {/* Changes Included Inner Card (Frame 2147225027) */}
            {selectedActivity.details.changesIncluded &&
              selectedActivity.details.changesIncluded.length > 0 && (
                <div className="boq-act-changes-card" data-testid="boq-activity-changes-card">
                  <div className="boq-act-changes-card-title">Changes Included</div>
                  <div className="boq-act-changes-list">
                    {selectedActivity.details.changesIncluded.map(
                      (ch: TemplateActivityChangeItem, idx: number) => (
                        <div key={idx} className="boq-act-changes-item">
                          <div className="boq-act-change-icon-wrap">
                            {renderChangeIcon(ch.icon)}
                          </div>
                          <span>
                            {ch.count} {ch.label}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Reason Block */}
            {selectedActivity.details.reason && (
              <div className="boq-act-info-block">
                <div className="boq-act-info-header">Reason</div>
                <div className="boq-act-info-text">{selectedActivity.details.reason}</div>
              </div>
            )}

            {/* Version Block */}
            <div className="boq-act-info-block">
              <div className="boq-act-info-header">Version</div>
              <div className="boq-act-version-row">
                <span className="boq-act-version-tag">{selectedActivity.details.versionLabel}</span>
                <button
                  type="button"
                  className="boq-act-version-link"
                  onClick={() => handleVersionClick(selectedActivity.details.versionLabel)}
                >
                  View Version
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
