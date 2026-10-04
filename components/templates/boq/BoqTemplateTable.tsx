"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Edit3,
  Copy,
  Trash2,
  Eye,
  Plus,
} from "lucide-react";
import { BoqTemplateItem } from "./BoqTemplateGrid";

interface BoqTemplateTableProps {
  items: BoqTemplateItem[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onUseTemplate: (template: BoqTemplateItem) => void;
  onEditTemplate: (template: BoqTemplateItem) => void;
  onDuplicateTemplate: (template: BoqTemplateItem) => void;
  onArchiveTemplate: (template: BoqTemplateItem) => void;
  onCreateTemplate?: () => void;
}

const fallbackImages: Record<string, string> = {
  INTERIOR: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  KITCHEN: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  ELECTRICAL: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  Flooring: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80",
  Plumbing: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  Painting: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
  Commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  Residential: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  Default: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
};

export default function BoqTemplateTable({
  items,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onUseTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onArchiveTemplate,
  onCreateTemplate,
}: BoqTemplateTableProps) {
  const router = useRouter();
  const [menuId, setMenuId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getCoverImage = (item: BoqTemplateItem) => {
    if (item.imageUrl) return item.imageUrl;
    const cat = (item.category || item.projectType || "").toUpperCase();
    if (cat.includes("KITCHEN")) return fallbackImages.KITCHEN;
    if (cat.includes("ELECTRICAL")) return fallbackImages.ELECTRICAL;
    if (cat.includes("FLOOR")) return fallbackImages.Flooring;
    if (cat.includes("PLUMB")) return fallbackImages.Plumbing;
    if (cat.includes("PAINT")) return fallbackImages.Painting;
    if (cat.includes("COMMERC")) return fallbackImages.Commercial;
    if (cat.includes("INTERIOR")) return fallbackImages.INTERIOR;
    return fallbackImages.Residential;
  };

  const getCategoryBadgeClass = (category: string) => {
    const c = category.toUpperCase();
    if (c.includes("INTERIOR")) return "boq-cat-interior";
    if (c.includes("KITCHEN")) return "boq-cat-kitchen";
    if (c.includes("ELECTRICAL")) return "boq-cat-electrical";
    if (c.includes("FLOOR")) return "boq-cat-flooring";
    if (c.includes("PLUMB")) return "boq-cat-plumbing";
    if (c.includes("PAINT")) return "boq-cat-painting";
    if (c.includes("COMMERC")) return "boq-cat-commercial";
    return "boq-cat-default";
  };

  const getMappingColor = (percent: number) => {
    if (percent >= 90) return "#10b981";
    if (percent >= 70) return "#f59e0b";
    return "#ef4444";
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return { date: "6 Aug 2026", time: "10:30 AM" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: "6 Aug 2026", time: "10:30 AM" };
    const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
    return { date, time };
  };

  const renderPaginationButtons = () => {
    const pagesToRender: number[] = [];
    const count = Math.min(5, totalPages);
    for (let i = 1; i <= count; i++) {
      pagesToRender.push(i);
    }
    return pagesToRender.map((p) => (
      <button
        key={p}
        type="button"
        className={`target-table-page-btn ${p === page ? "active" : ""}`}
        onClick={() => onPageChange(p)}
      >
        {p}
      </button>
    ));
  };

  if (loading) {
    return (
      <div className="boq-table-flex" style={{ padding: 24 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="template-card-skeleton skeleton-shimmer" style={{ height: 60, marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="boq-table-flex">
        <div className="templates-empty" style={{ padding: "48px 20px", textAlign: "center" }}>
          <h3 style={{ fontSize: 16, margin: "0 0 6px 0", color: "#0f172a" }}>No BOQ templates found</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0" }}>
            No templates match your current filters or search query.
          </p>
          {onCreateTemplate && (
            <button
              type="button"
              className="template-btn-primary"
              style={{ margin: "0 auto", display: "inline-flex" }}
              onClick={onCreateTemplate}
            >
              <Plus size={16} />
              <span>New BOQ Template</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="boq-table-flex">
      <div style={{ overflowX: "auto" }}>
        <table className="boq-data-table">
          <thead>
            <tr>
              <th>TEMPLATE NAME</th>
              <th>CATEGORY</th>
              <th>SECTIONS</th>
              <th>ITEMS</th>
              <th>COST MAPPING</th>
              <th>USED IN</th>
              <th>VERSION</th>
              <th>STATUS</th>
              <th>LAST MODIFIED</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((t) => {
              const coverImg = getCoverImage(t);
              const isMenuOpen = menuId === t.id;
              const { date, time } = formatDateTime(t.updatedAt || t.createdAt);
              const displayTags = t.tags?.filter(
                (tag) => !["active", "draft", "published", "v1.0", "v2.0", "v3.0"].includes(tag.toLowerCase())
              ).slice(0, 2) || [t.projectType || "Residential", t.category || "Interior"];

              return (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/templates/boq/${t.id}`)}
                >
                  {/* TEMPLATE NAME */}
                  <td>
                    <div className="boq-name-cell">
                      <img
                        src={coverImg}
                        alt={t.name}
                        className="boq-name-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackImages.Default;
                        }}
                      />
                      <div className="boq-name-info">
                        <b>{t.name}</b>
                        <span className="boq-code-text">{t.templateCode}</span>
                        <div className="boq-tags-row" style={{ marginTop: 2 }}>
                          {displayTags.map((tag) => (
                            <span key={tag} className="boq-tag-pill" style={{ fontSize: 10, padding: "1px 6px" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* CATEGORY */}
                  <td>
                    <span className={`boq-cat-badge ${getCategoryBadgeClass(t.category)}`}>
                      {t.category.toUpperCase()}
                    </span>
                  </td>

                  {/* SECTIONS */}
                  <td>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{t.sections}</span>
                  </td>

                  {/* ITEMS */}
                  <td>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{t.items}</span>
                  </td>

                  {/* COST MAPPING */}
                  <td>
                    <div className="boq-mapping-cell">
                      <div className="boq-mapping-bar">
                        <div
                          className="boq-mapping-fill"
                          style={{
                            width: `${t.costMapping}%`,
                            backgroundColor: getMappingColor(t.costMapping),
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155", minWidth: 38 }}>
                        {t.costMapping}%
                      </span>
                    </div>
                  </td>

                  {/* USED IN */}
                  <td>
                    <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 500 }}>
                      {t.usedIn || `${t.useCount} Templates`}
                    </span>
                  </td>

                  {/* VERSION */}
                  <td>
                    <span style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace", fontWeight: 600 }}>
                      {t.version}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td>
                    <span
                      className={`target-status-pill ${
                        t.status.toLowerCase() === "active" ? "status-active" : "status-draft"
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </td>

                  {/* LAST MODIFIED */}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
                      <span style={{ color: "#1e293b", fontWeight: 500 }}>{date}</span>
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>{time}</span>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        className="boq-card-menu-btn"
                        aria-label="More actions"
                        onClick={() => setMenuId(isMenuOpen ? null : t.id)}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className="target-card-menu-dropdown target-table-dropdown">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuId(null);
                              onUseTemplate(t);
                            }}
                          >
                            <Play size={14} /> Use Template
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuId(null);
                              router.push(`/templates/boq/${t.id}`);
                            }}
                          >
                            <Eye size={14} /> View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuId(null);
                              onEditTemplate(t);
                            }}
                          >
                            <Edit3 size={14} /> Edit Template
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuId(null);
                              onDuplicateTemplate(t);
                            }}
                          >
                            <Copy size={14} /> Duplicate
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => {
                              setMenuId(null);
                              onArchiveTemplate(t);
                            }}
                          >
                            <Trash2 size={14} /> Archive
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="target-table-pagination-row">
        <div className="target-table-total-count">
          Total BOQ Templates: {total}
        </div>

        <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
          <button
            type="button"
            className="target-table-page-btn arrow"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>

          {renderPaginationButtons()}

          <button
            type="button"
            className="target-table-page-btn arrow"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="target-table-page-size-wrap">
          <span className="target-table-page-size-label">Show per Page:</span>
          <div className="target-table-page-size-select-wrap">
            <select
              className="target-table-page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown size={14} className="target-table-select-arrow" />
          </div>
        </div>
      </div>
    </div>
  );
}
