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

export interface BoqTemplateItem {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  category: string;
  projectType: string;
  status: string;
  version: string;
  usedIn: string;
  tags: string[];
  useCount: number;
  sections: number;
  categories?: number;
  items: number;
  costMapping: number;
  indicativeBaseCost: string;
  baseCostAmount?: number;
  readiness?: number;
  imageUrl?: string | null;
  updatedAt: string;
  createdAt?: string;
}

interface BoqTemplateGridProps {
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

export default function BoqTemplateGrid({
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
}: BoqTemplateGridProps) {
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

  const getMappingColor = (percent: number) => {
    if (percent >= 90) return "#16A34A";
    if (percent >= 70) return "#D97706";
    return "#DC2626";
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
      <div className="boq-templates-grid template-cards-grid" data-testid="boq-template-grid-loading">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="boq-card-skeleton skeleton-shimmer">
            <div className="boq-skeleton-img" />
            <div className="boq-skeleton-line" style={{ width: "60%" }} />
            <div className="boq-skeleton-line" style={{ width: "40%" }} />
            <div className="boq-skeleton-line" style={{ width: "90%", marginTop: "auto" }} />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="templates-empty" style={{ padding: "48px 20px", textAlign: "center" }} data-testid="boq-template-grid-empty">
        <h3 style={{ fontSize: 16, margin: "0 0 6px 0", color: "#0F172A", fontFamily: "'Urbanist', sans-serif", fontWeight: 600 }}>
          No BOQ templates found
        </h3>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 16px 0", fontFamily: "'Urbanist', sans-serif" }}>
          No templates match your current filters or search query.
        </p>
        {onCreateTemplate && (
          <button
            type="button"
            className="template-new-btn"
            style={{ margin: "0 auto", display: "inline-flex" }}
            onClick={onCreateTemplate}
            data-testid="empty-create-boq-btn"
          >
            <Plus size={16} />
            <span>New BOQ Template</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="boq-templates-grid template-cards-grid" data-testid="boq-template-grid">
        {items.map((template) => {
          const coverImg = getCoverImage(template);
          const isMenuOpen = menuId === template.id;
          
          // Determine clean category and type tags
          const rawTags = template.tags?.filter(
            (t) => !["active", "draft", "archived", "published", "v1.0", "v2.0", "v3.0", "v3.2"].includes(t.toLowerCase())
          ) || [];
          
          const categoryTag = template.projectType || rawTags[0] || "—";
          const subCategoryTag = template.category && template.category.toLowerCase() !== categoryTag.toLowerCase()
            ? template.category
            : rawTags[1] || "";

          const statusNormalized = (template.status || "").toLowerCase();
          const statusClass = statusNormalized === "active" ? "status-active" : statusNormalized === "draft" ? "status-draft" : "status-archived";

          const mappingPercent = Math.min(100, Math.max(0, template.costMapping ?? 0));

          return (
            <div
              key={template.id}
              className="boq-template-card target-template-card"
              onClick={() => router.push(`/templates/boq/${template.id}`)}
              data-testid={`boq-card-${template.id}`}
            >
              {/* 1. Preview Image (Rectangle 78) */}
              <div className="boq-card-img-wrap target-card-img-wrap">
                <img
                  src={coverImg}
                  alt={template.name}
                  className="boq-card-img target-card-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImages.Default;
                  }}
                />
              </div>

              {/* 2. Card Body (Frame 2147225073) */}
              <div className="boq-card-body target-card-body">
                {/* Header Row: Title & Subtitle + Badges */}
                <div className="boq-card-header-row">
                  {/* Left: Title & Sections/Items */}
                  <div className="boq-card-title-group">
                    <h4 className="boq-card-title target-card-title" title={template.name}>
                      {template.name}
                    </h4>
                    <p className="boq-card-meta target-card-meta">
                      {template.sections ?? 0} Sections • {template.items ?? 0} Items
                    </p>
                  </div>

                  {/* Right: Status Pill & Category Tags */}
                  <div className="boq-card-badges-wrap">
                    <span className={`boq-status-pill target-status-pill ${statusClass}`}>
                      {template.status ? template.status.toUpperCase() : "—"}
                    </span>
                    <div className="boq-card-tags-row boq-tags-row">
                      <span className="boq-tag-pill">{categoryTag}</span>
                      {subCategoryTag && <span className="boq-tag-pill">{subCategoryTag}</span>}
                    </div>
                  </div>
                </div>

                {/* 3. Cost Mapping Progress Bar (Frame 2147225258) */}
                <div className="boq-progress-wrap boq-card-progress-row">
                  <div className="boq-progress-bar-bg boq-card-progress-track">
                    <div
                      className="boq-progress-bar-fill boq-card-progress-fill"
                      style={{
                        width: `${mappingPercent}%`,
                        backgroundColor: getMappingColor(mappingPercent),
                      }}
                    />
                  </div>
                  <span className="boq-progress-text boq-card-progress-text">
                    {mappingPercent}% Mapped
                  </span>
                </div>
              </div>

              {/* 4. Divider Line (Rectangle 40) */}
              <hr className="boq-card-divider" />

              {/* 5. Footer (Frame 2147225074) */}
              <div className="boq-card-footer target-card-footer">
                <span className="boq-card-used target-card-used">
                {template.version || "—"} • Used {template.useCount ?? 0} Times
                </span>

                <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="boq-card-menu-btn target-card-menu-btn"
                    aria-label="More options"
                    onClick={() => setMenuId(isMenuOpen ? null : template.id)}
                    data-testid={`boq-card-menu-btn-${template.id}`}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {isMenuOpen && (
                    <div className="boq-card-menu-dropdown target-card-menu-dropdown" data-testid="boq-card-menu-dropdown">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          onUseTemplate(template);
                        }}
                      >
                        <Play size={14} /> Use Template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          router.push(`/templates/boq/${template.id}`);
                        }}
                      >
                        <Eye size={14} /> View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          onEditTemplate(template);
                        }}
                      >
                        <Edit3 size={14} /> Edit Template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          onDuplicateTemplate(template);
                        }}
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          setMenuId(null);
                          onArchiveTemplate(template);
                        }}
                      >
                        <Trash2 size={14} /> Archive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="target-table-pagination-row" data-testid="boq-pagination-row">
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
    </>
  );
}
