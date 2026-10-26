"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Archive,
  Loader2,
} from "lucide-react";
import ArchivedDeleteModal from "./ArchivedDeleteModal";
import type { ArchivedTemplateRecord } from "@/lib/api/templates";

interface ArchivedTemplatesViewProps {
  items: ArchivedTemplateRecord[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  view: "list" | "grid";
  hasSearchOrFilters: boolean;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onRestore: (item: ArchivedTemplateRecord) => Promise<void>;
  onDeletePermanently: (item: ArchivedTemplateRecord) => Promise<void>;
  onClearFilters: () => void;
}

export default function ArchivedTemplatesView({
  items,
  total,
  loading,
  page,
  pageSize,
  totalPages,
  view,
  hasSearchOrFilters,
  onPageChange,
  onPageSizeChange,
  onRestore,
  onDeletePermanently,
  onClearFilters,
}: ArchivedTemplatesViewProps) {
  const router = useRouter();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArchivedTemplateRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Close open action menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeMenuId && !(event.target as Element)?.closest(".archived-action-cell")) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  const handleRestoreClick = async (item: ArchivedTemplateRecord) => {
    try {
      setRestoringId(item.id);
      setActiveMenuId(null);
      await onRestore(item);
    } finally {
      setRestoringId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await onDeletePermanently(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetails = (item: ArchivedTemplateRecord) => {
    setActiveMenuId(null);
    if (item.rawType === "boq" || item.templateType.includes("BOQ")) {
      router.push(`/templates/boq/${item.id}`);
    } else {
      router.push(`/templates/${item.id}`);
    }
  };

  // Safe fallback initials for user avatar
  const getUserInitials = (name?: string) => {
    if (!name || name === "Team Member") return "TM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="archived-view-container">
      {/* ── Main Surface: Frame 2147225069 in Figma ── */}
      <div className="archived-content-card">
        {loading ? (
          <div className="archived-table-scroll">
            <div className="archived-skeleton-wrap">
              <div className="archived-table-header-row">
                <div className="archived-th-cell col-name">TEMPLATE NAME</div>
                <div className="archived-th-cell col-cat">CATEGORY</div>
                <div className="archived-th-cell col-type">TEMPLATE TYPE</div>
                <div className="archived-th-cell col-ver">VERSION</div>
                <div className="archived-th-cell col-user">ARCHIVED BY</div>
                <div className="archived-th-cell col-date">ARCHIVED ON</div>
                <div className="archived-th-cell col-used">USED IN</div>
                <div className="archived-th-cell col-act">ACTIONS</div>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="archived-row-skeleton skeleton-shimmer" />
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="archived-empty-state">
            <div className="archived-empty-icon-wrap">
              <Archive size={42} />
            </div>
            <h3 className="archived-empty-title">
              {hasSearchOrFilters ? "No matching archived templates" : "No archived templates yet"}
            </h3>
            <p className="archived-empty-subtitle">
              {hasSearchOrFilters
                ? "Try adjusting your search query or removing filters to find what you're looking for."
                : "Templates you archive will appear here with options to restore or delete them permanently."}
            </p>
            {hasSearchOrFilters && (
              <button
                type="button"
                className="archived-empty-clear-btn"
                onClick={onClearFilters}
              >
                Clear Search &amp; Filters
              </button>
            )}
          </div>
        ) : view === "list" ? (
          /* ── List / Table View matching Figma Frame 57 & Rows ── */
          <div className="archived-table-scroll">
            <div className="archived-table" role="table" aria-label="Archived Templates">
              {/* Header Row: Frame 57 */}
              <div className="archived-table-header-row" role="row">
                <div className="archived-th-cell col-name" role="columnheader">TEMPLATE NAME</div>
                <div className="archived-th-cell col-cat" role="columnheader">CATEGORY</div>
                <div className="archived-th-cell col-type" role="columnheader">TEMPLATE TYPE</div>
                <div className="archived-th-cell col-ver" role="columnheader">VERSION</div>
                <div className="archived-th-cell col-user" role="columnheader">ARCHIVED BY</div>
                <div className="archived-th-cell col-date" role="columnheader">ARCHIVED ON</div>
                <div className="archived-th-cell col-used" role="columnheader">USED IN</div>
                <div className="archived-th-cell col-act" role="columnheader">ACTIONS</div>
              </div>

              {/* Rows: Frame 59, Frame 60, etc. */}
              <div className="archived-table-body" role="rowgroup">
                {items.map((item, idx) => {
                  const isMenuOpen = activeMenuId === item.id;
                  const isBoq = item.rawType === "boq" || item.templateType.includes("BOQ");

                  return (
                    <div
                      key={item.id}
                      className={`archived-table-row ${idx % 2 === 1 ? "alt-row" : ""}`}
                      role="row"
                    >
                      {/* Cell 1: Template Name & Thumbnail (349px) */}
                      <div className="archived-td-cell col-name" role="cell">
                        <div className="archived-thumb-wrap">
                          {item.imageUrl && !item.imageUrl.includes("broken") ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="archived-thumb-img"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="archived-thumb-placeholder">
                              <Archive size={16} />
                            </div>
                          )}
                        </div>
                        <div className="archived-name-info">
                          <span
                            className="archived-item-title"
                            title={item.name}
                            onClick={() => handleViewDetails(item)}
                          >
                            {item.name}
                          </span>
                          <span className="archived-item-desc" title={item.description}>
                            {item.description || "Standard template"}
                          </span>
                        </div>
                      </div>

                      {/* Cell 2: Category & Subcategory (167px) */}
                      <div className="archived-td-cell col-cat" role="cell">
                        <div className="archived-cat-info">
                          <span className="archived-cat-primary">{item.category || "Residential"}</span>
                          <span className="archived-cat-secondary">{item.subcategory || "Interior Design"}</span>
                        </div>
                      </div>

                      {/* Cell 3: Template Type Pill (171px) */}
                      <div className="archived-td-cell col-type" role="cell">
                        <span
                          className={`archived-type-pill ${isBoq ? "type-boq" : "type-project"}`}
                        >
                          {isBoq ? "BOQ TEMPLATE" : "PROJECT TEMPLATE"}
                        </span>
                      </div>

                      {/* Cell 4: Version (99px) */}
                      <div className="archived-td-cell col-ver" role="cell">
                        <span className="archived-ver-text">{item.version || "v1.0"}</span>
                      </div>

                      {/* Cell 5: Archived By User (181px) */}
                      <div className="archived-td-cell col-user" role="cell">
                        <div className="archived-user-avatar">
                          {item.archivedByAvatarUrl ? (
                            <img
                              src={item.archivedByAvatarUrl}
                              alt={item.archivedBy}
                              className="archived-avatar-img"
                            />
                          ) : (
                            <span className="archived-avatar-initials">
                              {getUserInitials(item.archivedBy)}
                            </span>
                          )}
                        </div>
                        <div className="archived-user-info">
                          <span className="archived-user-name">{item.archivedBy || "Team Member"}</span>
                          <span className="archived-user-role">{item.archivedByRole || "Project Manager"}</span>
                        </div>
                      </div>

                      {/* Cell 6: Archived On Date (154px) */}
                      <div className="archived-td-cell col-date" role="cell">
                        <div className="archived-date-info">
                          <span className="archived-date-primary">{item.archivedOn || "Recently"}</span>
                          <span className="archived-date-secondary">{item.archivedRelative || "Recently"}</span>
                        </div>
                      </div>

                      {/* Cell 7: Used In Projects (106px) */}
                      <div className="archived-td-cell col-used" role="cell">
                        <div className="archived-used-info">
                          <span className="archived-used-count">{item.usedIn || "0"}</span>
                          <span className="archived-used-label">Projects</span>
                        </div>
                      </div>

                      {/* Cell 8: Actions (64px) */}
                      <div className="archived-td-cell col-act archived-action-cell" role="cell">
                        <button
                          type="button"
                          className="archived-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : item.id);
                          }}
                          aria-label={`Actions for ${item.name}`}
                          aria-expanded={isMenuOpen}
                        >
                          <MoreHorizontal size={20} />
                        </button>

                        {isMenuOpen && (
                          <div className="archived-action-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="archived-action-item"
                              onClick={() => handleRestoreClick(item)}
                              disabled={restoringId === item.id}
                            >
                              {restoringId === item.id ? (
                                <Loader2 size={15} className="archived-spin" />
                              ) : (
                                <RotateCcw size={15} />
                              )}
                              <span>Restore to Library</span>
                            </button>
                            <button
                              type="button"
                              className="archived-action-item"
                              onClick={() => handleViewDetails(item)}
                            >
                              <Eye size={15} />
                              <span>View Details</span>
                            </button>
                            <div className="archived-action-divider" />
                            <button
                              type="button"
                              className="archived-action-item danger"
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeleteTarget(item);
                              }}
                            >
                              <Trash2 size={15} />
                              <span>Delete Permanently</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── Grid View Mode ── */
          <div className="archived-grid">
            {items.map((item) => {
              const isBoq = item.rawType === "boq" || item.templateType.includes("BOQ");
              const isMenuOpen = activeMenuId === item.id;

              return (
                <div key={item.id} className="archived-card">
                  <div className="archived-card-media-wrap">
                    {item.imageUrl && !item.imageUrl.includes("broken") ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="archived-card-img"
                      />
                    ) : (
                      <div className="archived-card-img-placeholder">
                        <Archive size={32} />
                      </div>
                    )}
                    <span
                      className={`archived-type-pill card-badge ${isBoq ? "type-boq" : "type-project"}`}
                    >
                      {isBoq ? "BOQ TEMPLATE" : "PROJECT TEMPLATE"}
                    </span>
                  </div>

                  <div className="archived-card-body">
                    <h4
                      className="archived-card-title"
                      title={item.name}
                      onClick={() => handleViewDetails(item)}
                    >
                      {item.name}
                    </h4>
                    <p className="archived-card-desc">{item.description || "Archived template"}</p>

                    <div className="archived-card-meta-row">
                      <span className="archived-card-category">{item.category}</span>
                      <span className="archived-card-version">{item.version}</span>
                    </div>

                    <div className="archived-card-divider" />

                    <div className="archived-card-footer">
                      <div className="archived-card-user">
                        <div className="archived-user-avatar small">
                          <span className="archived-avatar-initials">
                            {getUserInitials(item.archivedBy)}
                          </span>
                        </div>
                        <div className="archived-card-user-text">
                          <span className="archived-card-user-name">{item.archivedBy}</span>
                          <span className="archived-card-date">{item.archivedRelative}</span>
                        </div>
                      </div>

                      <div className="archived-card-actions archived-action-cell">
                        <button
                          type="button"
                          className="archived-card-restore-btn"
                          onClick={() => handleRestoreClick(item)}
                          disabled={restoringId === item.id}
                          title="Restore template"
                        >
                          <RotateCcw size={14} />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          className="archived-action-btn card-more"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : item.id);
                          }}
                          aria-label="More options"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {isMenuOpen && (
                          <div className="archived-action-menu grid-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="archived-action-item"
                              onClick={() => handleViewDetails(item)}
                            >
                              <Eye size={15} />
                              <span>View Details</span>
                            </button>
                            <div className="archived-action-divider" />
                            <button
                              type="button"
                              className="archived-action-item danger"
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeleteTarget(item);
                              }}
                            >
                              <Trash2 size={15} />
                              <span>Delete Permanently</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination Footer: Frame 2147225166 in Figma ── */}
        {!loading && items.length > 0 && (
          <div className="archived-pagination-bar">
            {/* Left: Total count */}
            <div className="archived-pagination-total">
              Total Archived Templates: {total}
            </div>

            {/* Center: Page numbers */}
            <div className="archived-pagination-pages">
              <button
                type="button"
                className="archived-page-nav-btn"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isActive = p === page;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`archived-page-num-btn ${isActive ? "active" : ""}`}
                    onClick={() => onPageChange(p)}
                    aria-label={`Page ${p}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                className="archived-page-nav-btn"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Right: Show per Page dropdown */}
            <div className="archived-pagination-size-wrap">
              <label htmlFor="archived-page-size-select" className="archived-pagination-size-label">Show per Page:</label>
              <select
                id="archived-page-size-select"
                className="archived-pagination-select"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                aria-label="Items per page"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ArchivedDeleteModal
        isOpen={Boolean(deleteTarget)}
        templateName={deleteTarget?.name || ""}
        templateType={deleteTarget?.templateType || "Template"}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
