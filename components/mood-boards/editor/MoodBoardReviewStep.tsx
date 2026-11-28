"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Folder,
  Layers,
  ArrowLeft,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";
import {
  MoodBoardCategory,
  MoodBoardImage,
  MoodBoardTemplateLayout,
} from "@/lib/mood-boards/types";
import { LAYOUT_TEMPLATES } from "@/lib/mood-boards/templates-data";

export interface MoodBoardReviewStepProps {
  name: string;
  projectName: string;
  clientName: string;
  description: string;
  selectedTemplate: MoodBoardTemplateLayout;
  categories: MoodBoardCategory[];
  onBackToEdit: () => void;
  onSaveDraft: () => void;
  onCreate: () => void;
  isSaving: boolean;
}

export default function MoodBoardReviewStep({
  name,
  projectName,
  clientName,
  description,
  selectedTemplate,
  categories,
  onBackToEdit,
  onSaveDraft,
  onCreate,
  isSaving,
}: MoodBoardReviewStepProps) {
  const [activeTabCatId, setActiveTabCatId] = useState<string>(
    categories[0]?.id || ""
  );

  const activeCategory =
    categories.find((c) => c.id === activeTabCatId) || categories[0];

  const totalImages = categories.reduce(
    (sum, c) => sum + (c.images?.length || 0),
    0
  );

  const templateInfo = LAYOUT_TEMPLATES.find((t) => t.id === selectedTemplate);

  // Check if any image is missing a title
  const untitledImagesCount = categories.reduce((sum, c) => {
    const untitledInCat = (c.images || []).filter(
      (img) => !img.title || !img.title.trim()
    ).length;
    return sum + untitledInCat;
  }, 0);

  return (
    <div className="mb-review-step-container">
      {/* Review Summary Banner */}
      <div className="mb-review-summary-banner">
        <div className="mb-review-summary-main">
          <div className="mb-review-badge-row">
            <span className="mb-review-step-tag">Step 2: Review</span>
            <span className="mb-review-template-pill">
              <LayoutTemplate size={13} />
              <span>{templateInfo?.name || "Grid 4 × 4"}</span>
            </span>
          </div>

          <h2 className="mb-review-board-title">{name || "Untitled Moodboard"}</h2>
          {description && <p className="mb-review-desc-text">{description}</p>}

          <div className="mb-review-meta-chips">
            <div className="mb-review-chip">
              <span className="chip-label">Project:</span>
              <span className="chip-val">{projectName || "None selected"}</span>
            </div>
            <div className="mb-review-chip">
              <span className="chip-label">Client:</span>
              <span className="chip-val">{clientName || "None selected"}</span>
            </div>
            <div className="mb-review-chip">
              <span className="chip-label">Categories:</span>
              <span className="chip-val">{categories.length}</span>
            </div>
            <div className="mb-review-chip">
              <span className="chip-label">Total Images:</span>
              <span className="chip-val">{totalImages}</span>
            </div>
          </div>
        </div>

        {/* Validation Status Pill */}
        <div className="mb-review-status-card">
          {untitledImagesCount === 0 && totalImages > 0 ? (
            <div className="mb-validation-good">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <div>
                <p className="validation-title">Ready for Final Creation</p>
                <p className="validation-sub">
                  All {totalImages} images have descriptive titles.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-validation-warn">
              <AlertCircle size={20} className="text-amber-500" />
              <div>
                <p className="validation-title">
                  {totalImages === 0
                    ? "No images uploaded yet"
                    : `${untitledImagesCount} image(s) missing titles`}
                </p>
                <p className="validation-sub">
                  You can still go back and refine titles or add more visuals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div className="mb-review-category-tabs-row" role="tablist">
        {categories.map((cat) => {
          const isTabActive = cat.id === activeCategory?.id;
          const imgCount = cat.images?.length || 0;

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isTabActive}
              className={`mb-review-cat-tab ${isTabActive ? "is-active" : ""}`}
              onClick={() => setActiveTabCatId(cat.id)}
            >
              <Folder size={15} />
              <span>{cat.name}</span>
              <span className="tab-count-pill">{imgCount}</span>
            </button>
          );
        })}
      </div>

      {/* Review Canvas for Active Tab */}
      <div className="mb-review-canvas-wrapper">
        <div className="mb-review-canvas-header">
          <div>
            <h3 className="mb-review-active-cat-title">{activeCategory?.name}</h3>
            <p className="mb-review-active-cat-sub">
              Rendered using the <strong>{templateInfo?.name}</strong> layout.
            </p>
          </div>
          <button
            type="button"
            className="mb-review-edit-cat-btn"
            onClick={onBackToEdit}
          >
            Edit Content
          </button>
        </div>

        {activeCategory && activeCategory.images && activeCategory.images.length > 0 ? (
          <div className="mb-review-images-grid">
            {activeCategory.images.map((img, idx) => (
              <div key={img.id || idx} className="mb-review-image-card">
                <div className="mb-review-img-box">
                  <img
                    src={img.previewUrl}
                    alt={img.title || img.name}
                    className="mb-review-img"
                  />
                </div>
                <div className="mb-review-img-footer">
                  <span className="mb-review-img-title">
                    {img.title || img.name || "Untitled Image"}
                  </span>
                  <span className="mb-review-img-num">0{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-review-empty-cat">
            <p>No images uploaded in this category.</p>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="mb-review-bottom-actions">
        <button
          type="button"
          className="mb-review-btn-secondary"
          onClick={onBackToEdit}
          disabled={isSaving}
        >
          <ArrowLeft size={16} />
          <span>Back to Add Content</span>
        </button>

        <div className="mb-review-bottom-right">
          <button
            type="button"
            className="mb-review-btn-draft"
            onClick={onSaveDraft}
            disabled={isSaving}
          >
            Save as Draft
          </button>

          <button
            type="button"
            className="mb-review-btn-create"
            onClick={onCreate}
            disabled={isSaving}
          >
            {isSaving ? "Creating..." : "Create Moodboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
