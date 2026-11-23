"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Layers, Sparkles, Check, Eye, X } from "lucide-react";
import { MoodBoardTemplate } from "@/lib/mood-boards/types";
import { MOCK_MOOD_BOARD_TEMPLATES } from "@/lib/mood-boards/mock-data";

interface MoodBoardTemplateSelectionProps {
  onSelectTemplate: (template: MoodBoardTemplate) => void;
  onSwitchToBlank: () => void;
}

export default function MoodBoardTemplateSelection({
  onSelectTemplate,
  onSwitchToBlank,
}: MoodBoardTemplateSelectionProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [previewTemplate, setPreviewTemplate] = useState<MoodBoardTemplate | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    MOCK_MOOD_BOARD_TEMPLATES.forEach((t) => set.add(t.category));
    return ["ALL", ...Array.from(set)];
  }, []);

  const filteredTemplates = useMemo(() => {
    return MOCK_MOOD_BOARD_TEMPLATES.filter((tpl) => {
      const matchesCategory =
        selectedCategory === "ALL" || tpl.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  return (
    <div className="mb-template-selection">
      {/* Top Bar / Breadcrumb */}
      <div className="mb-new-topbar">
        <Link href="/mood-boards" className="mb-back-link">
          <ArrowLeft size={16} />
          <span>Back to Mood Boards</span>
        </Link>
        <button
          type="button"
          onClick={onSwitchToBlank}
          className="mb-text-btn"
        >
          Want a clean slate? Start with a Blank Mood Board →
        </button>
      </div>

      {/* Header section */}
      <div className="mb-template-header">
        <div className="mb-template-header-badge">
          <Sparkles size={14} />
          <span>Pre-curated Styles</span>
        </div>
        <h1 className="mb-template-title">Choose a Mood Board Template</h1>
        <p className="mb-template-subtitle">
          Select a professionally curated design concept to jumpstart your interior palette, material selections, and finishes.
        </p>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="mb-template-toolbar">
        {/* Category tabs */}
        <div className="mb-template-categories" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`mb-template-cat-btn ${
                selectedCategory === cat ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "ALL" ? "All Templates" : cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="mb-template-search">
          <Search size={16} className="mb-template-search-icon" />
          <input
            type="text"
            placeholder="Search templates by style, material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-template-search-input"
          />
          {search && (
            <button
              type="button"
              className="mb-template-clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="mb-template-grid">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="mb-template-card">
            {/* Thumbnail */}
            <div className="mb-template-card-media">
              <img
                src={template.coverImage}
                alt={template.name}
                className="mb-template-card-img"
              />
              <span className="mb-template-badge">{template.category}</span>
              <span className="mb-template-image-count">
                <Layers size={13} />
                <span>{template.images.length} images</span>
              </span>
            </div>

            {/* Card Content */}
            <div className="mb-template-card-content">
              <h3 className="mb-template-card-name">{template.name}</h3>
              <p className="mb-template-card-desc">{template.description}</p>

              {/* Tags */}
              <div className="mb-template-tags">
                {template.tags.map((tag) => (
                  <span key={tag} className="mb-template-tag">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="mb-template-card-actions">
                <button
                  type="button"
                  className="mb-btn-template-preview"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye size={15} />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  className="mb-btn-template-use"
                  onClick={() => onSelectTemplate(template)}
                >
                  <Check size={15} />
                  <span>Use Template</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div
          className="new-mb-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-tpl-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewTemplate(null);
          }}
        >
          <div className="mb-template-preview-dialog">
            <div className="mb-template-preview-header">
              <div>
                <span className="mb-template-badge">
                  {previewTemplate.category}
                </span>
                <h2 id="preview-tpl-title" className="mb-template-preview-title">
                  {previewTemplate.name}
                </h2>
                <p className="mb-template-preview-desc">
                  {previewTemplate.description}
                </p>
              </div>
              <button
                type="button"
                className="new-mb-close-btn"
                onClick={() => setPreviewTemplate(null)}
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-template-preview-body">
              <h4 className="mb-template-preview-heading">
                Included Spec Sheets & Swatches ({previewTemplate.images.length})
              </h4>
              <div className="mb-template-preview-grid">
                {previewTemplate.images.map((img, idx) => (
                  <div key={img.id || idx} className="mb-template-preview-item">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="mb-template-preview-img"
                    />
                    <div className="mb-template-preview-label">{img.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-template-preview-footer">
              <button
                type="button"
                className="new-mb-btn-cancel"
                onClick={() => setPreviewTemplate(null)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="new-mb-btn-continue"
                onClick={() => {
                  const tpl = previewTemplate;
                  setPreviewTemplate(null);
                  onSelectTemplate(tpl);
                }}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
