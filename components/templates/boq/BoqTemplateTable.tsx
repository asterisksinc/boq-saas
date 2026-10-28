"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
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

  const getCategoryClass = (category?: string) => {
    const c = (category || "").toUpperCase();
    if (c.includes("INTERIOR")) return "cat-interior";
    if (c.includes("KITCHEN")) return "cat-kitchen";
    if (c.includes("ELECTRICAL")) return "cat-electrical";
    if (c.includes("FLOOR")) return "cat-flooring";
    if (c.includes("PLUMB")) return "cat-plumbing";
    if (c.includes("PAINT")) return "cat-painting";
    if (c.includes("COMMERC")) return "cat-commercial";
    return "cat-default";
  };

  const getMappingLevel = (pct: number) => {
    if (pct >= 90) return "high";
    if (pct >= 70) return "medium";
    return "low";
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return { date: "—", time: "" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: "—", time: "" };
    const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
    return { date, time };
  };

  const getUsedIn = (item: BoqTemplateItem) => {
    if (item.usedIn) {
      const match = String(item.usedIn).match(/^(\d+)\s*(.*)$/);
      if (match) return { num: match[1], label: match[2] || "Templates" };
      return { num: String(item.usedIn), label: "Templates" };
    }
    return { num: String(item.useCount || 0), label: "Templates" };
  };

  const getTemplateCode = (item: BoqTemplateItem) => {
    if (item.templateCode) return item.templateCode;
    return "—";
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
        className={`boq-page-num-btn ${p === page ? "active" : ""}`}
        onClick={() => onPageChange(p)}
      >
        {p}
      </button>
    ));
  };

  if (loading) {
    return (
      <div className="boq-table-card">
        <div className="boq-table-scroll-wrap">
          <div className="boq-table-inner">
            <table className="boq-list-table">
              <thead>
                <tr>
                  <th className="boq-col-name">TEMPLATE NAME</th>
                  <th className="boq-col-category">CATEGORY</th>
                  <th className="boq-col-sections">SECTIONS</th>
                  <th className="boq-col-items">ITEMS</th>
                  <th className="boq-col-mapping">COST MAPPING</th>
                  <th className="boq-col-used">USED IN</th>
                  <th className="boq-col-version">VERSION</th>
                  <th className="boq-col-status">STATUS</th>
                  <th className="boq-col-modified">LAST MODIFIED</th>
                  <th className="boq-col-actions" />
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="boq-table-row-skeleton">
                    <td colSpan={10}>
                      <div className="skeleton-shimmer" style={{ height: 48, borderRadius: 4 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="boq-table-card">
        <div className="templates-empty" style={{ padding: "48px 20px", textAlign: "center", width: "100%" }}>
          <h3 style={{ fontSize: 16, margin: "0 0 6px 0", color: "#0F172A", fontFamily: "'Urbanist', sans-serif", fontWeight: 600 }}>
            No BOQ templates found
          </h3>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 16px 0", fontFamily: "'Urbanist', sans-serif" }}>
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
    <div className="boq-table-card">
      <div className="boq-table-scroll-wrap">
        <div className="boq-table-inner">
          <table className="boq-list-table">
            <thead>
              <tr>
                <th className="boq-col-name">TEMPLATE NAME</th>
                <th className="boq-col-category">CATEGORY</th>
                <th className="boq-col-sections">SECTIONS</th>
                <th className="boq-col-items">ITEMS</th>
                <th className="boq-col-mapping">COST MAPPING</th>
                <th className="boq-col-used">USED IN</th>
                <th className="boq-col-version">VERSION</th>
                <th className="boq-col-status">STATUS</th>
                <th className="boq-col-modified">LAST MODIFIED</th>
                <th className="boq-col-actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((t) => {
                const coverImg = getCoverImage(t);
                const isMenuOpen = menuId === t.id;
                const { date, time } = formatDateTime(t.updatedAt || t.createdAt);
                const displayTags = t.tags?.filter(
                  (tag) => !["active", "draft", "published", "v1.0", "v2.0", "v3.0"].includes(tag.toLowerCase())
                ).slice(0, 2);
                const used = getUsedIn(t);
                const code = getTemplateCode(t);
                const catClass = getCategoryClass(t.category);
                const mappingLevel = getMappingLevel(t.costMapping);
                const statusCls = t.status.toLowerCase() === "active"
                  ? "status-active"
                  : t.status.toLowerCase() === "archived"
                  ? "status-archived"
                  : "status-draft";

                return (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/templates/boq/${t.id}`)}
                  >
                    {/* TEMPLATE NAME: Frame 2147225071 */}
                    <td className="boq-col-name">
                      <div className="boq-cell-name-wrap">
                        <img
                          src={coverImg}
                          alt={t.name}
                          className="boq-cell-thumb"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = fallbackImages.Default;
                          }}
                        />
                        <div className="boq-cell-name-info">
                          <h4 className="boq-cell-title" title={t.name}>{t.name}</h4>
                          <span className="boq-cell-code">{code}</span>
                          <div className="boq-cell-subtags">
                            {displayTags.map((tag) => (
                              <span key={tag} className="boq-cell-subtag-pill">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY: Frame 2147225014 */}
                    <td className="boq-col-category">
                      <div className="boq-cell-category-wrap">
                        <span className={`boq-category-pill ${catClass}`}>
                          {t.category.toUpperCase()}
                        </span>
                      </div>
                    </td>

                    {/* SECTIONS */}
                    <td className="boq-col-sections">
                      <span className="boq-cell-count-text">{t.sections}</span>
                    </td>

                    {/* ITEMS */}
                    <td className="boq-col-items">
                      <span className="boq-cell-count-text">{t.items}</span>
                    </td>

                    {/* COST MAPPING: Frame 2147225258 */}
                    <td className="boq-col-mapping">
                      <div className="boq-cell-mapping-wrap">
                        <div className="boq-cell-mapping-track">
                          <div
                            className={`boq-cell-mapping-fill ${mappingLevel}`}
                            style={{
                              width: `${Math.min(100, Math.max(0, t.costMapping))}%`,
                            }}
                          />
                        </div>
                        <span className="boq-cell-mapping-pct">
                          {t.costMapping}%
                        </span>
                      </div>
                    </td>

                    {/* USED IN */}
                    <td className="boq-col-used">
                      <div className="boq-cell-used-wrap">
                        <span className="boq-cell-used-num">{used.num}</span>
                        <span className="boq-cell-used-label">{used.label}</span>
                      </div>
                    </td>

                    {/* VERSION */}
                    <td className="boq-col-version">
                      <span className="boq-cell-version-text">{t.version}</span>
                    </td>

                    {/* STATUS */}
                    <td className="boq-col-status">
                      <span className={`boq-cell-status-pill ${statusCls}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>

                    {/* LAST MODIFIED */}
                    <td className="boq-col-modified">
                      <div className="boq-cell-modified-wrap">
                        <span className="boq-cell-modified-date">{date}</span>
                        <span className="boq-cell-modified-time">{time}</span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="boq-col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="boq-cell-action-wrap">
                        <button
                          type="button"
                          className="boq-row-menu-btn"
                          aria-label="More actions"
                          onClick={() => setMenuId(isMenuOpen ? null : t.id)}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div
                            className="boq-card-menu-dropdown target-table-dropdown"
                            style={{ top: "100%", right: 0, zIndex: 50 }}
                          >
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
      </div>

      {/* Pagination Bar: Frame 2147225166 */}
      <div className="boq-pagination-bar">
        <div className="boq-pagination-total">
          Total BOQ Templates: {total}
        </div>

        <div className="boq-pagination-nav" role="navigation" aria-label="Pagination">
          <button
            type="button"
            className="boq-page-num-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {renderPaginationButtons()}

          <button
            type="button"
            className="boq-page-num-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="boq-pagination-size">
          <span className="boq-pagination-size-label">Show per Page:</span>
          <div className="boq-pagination-size-box">
            <select
              className="boq-pagination-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 10, pointerEvents: "none", color: "#64748B" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
