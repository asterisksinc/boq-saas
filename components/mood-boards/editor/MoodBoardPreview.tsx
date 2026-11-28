"use client";

import React, { useState, useMemo } from "react";
import {
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutTemplate,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import {
  MoodBoardCategory,
  MoodBoardImage,
  MoodBoardTemplateLayout,
} from "@/lib/mood-boards/types";
import MoodBoardTemplateSelector from "./MoodBoardTemplateSelector";
import MoodBoardFullscreenModal from "./MoodBoardFullscreenModal";

export interface MoodBoardPreviewProps {
  name: string;
  projectName: string;
  leadName?: string;
  clientName?: string;
  description?: string;
  categories: MoodBoardCategory[];
  activeCategory: MoodBoardCategory;
  selectedTemplate: MoodBoardTemplateLayout;
  onSelectTemplate: (template: MoodBoardTemplateLayout) => void;
  onSelectCategory: (categoryId: string) => void;
  coverImage?: string;
  onSetCoverImage?: (url: string) => void;
  onChangeTemplate?: () => void;
}

export default function MoodBoardPreview({
  name,
  projectName,
  leadName,
  clientName,
  description,
  categories,
  activeCategory,
  selectedTemplate = "grid-4x4",
  onSelectTemplate,
  onSelectCategory,
  onChangeTemplate,
}: MoodBoardPreviewProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const currentIndex = categories.findIndex((c) => c.id === activeCategory.id);
  const totalCategories = categories.length;
  const prevCategory = currentIndex > 0 ? categories[currentIndex - 1] : null;
  const nextCategory =
    currentIndex < totalCategories - 1 ? categories[currentIndex + 1] : null;

  const currentImages = activeCategory.images || [];

  // Helper to render the layout variations
  const renderTemplateCanvas = (cat: MoodBoardCategory, isFullscreen = false) => {
    const images = cat.images || [];

    if (images.length === 0) {
      return (
        <div className="mb-canvas-empty-state">
          <div className="mb-canvas-empty-icon-wrap">
            <ImageIcon size={38} className="text-slate-400" />
          </div>
          <h4 className="mb-canvas-empty-title">
            No images in {cat.name} yet
          </h4>
          <p className="mb-canvas-empty-sub">
            Upload images in the left panel to see this {selectedTemplate.toUpperCase()} layout come to life.
          </p>
        </div>
      );
    }

    switch (selectedTemplate) {
      case "grid-4x4":
        return (
          <div className={`preview-image-grid mb-layout-canvas layout-grid-4x4 ${isFullscreen ? "is-fullscreen" : ""}`}>
            {images.map((img, idx) => (
              <div key={img.id || idx} className="mb-canvas-card card-grid-4x4">
                <div className="mb-canvas-img-box">
                  <img
                    src={img.previewUrl}
                    alt={img.title || img.name}
                    className="mb-canvas-img"
                    loading="lazy"
                  />
                </div>
                <div className="mb-canvas-card-footer">
                  <span className="mb-canvas-img-title">{img.title || img.name}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case "collage":
        return (
          <div className={`mb-layout-canvas layout-collage ${isFullscreen ? "is-fullscreen" : ""}`}>
            {images.map((img, idx) => {
              // Asymmetric sizing
              const isHero = idx === 0;
              const isTall = idx === 1;
              const isWide = idx === 3;
              let cardClass = "card-collage-standard";
              if (isHero) cardClass = "card-collage-hero";
              else if (isTall) cardClass = "card-collage-tall";
              else if (isWide) cardClass = "card-collage-wide";

              return (
                <div key={img.id || idx} className={`mb-canvas-card ${cardClass}`}>
                  <div className="mb-canvas-img-box">
                    <img
                      src={img.previewUrl}
                      alt={img.title || img.name}
                      className="mb-canvas-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="mb-canvas-card-footer">
                    <span className="mb-canvas-img-title">{img.title || img.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "modern":
        return (
          <div className={`mb-layout-canvas layout-modern ${isFullscreen ? "is-fullscreen" : ""}`}>
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={`mb-canvas-card card-modern ${
                  idx % 3 === 0 ? "span-two" : ""
                }`}
              >
                <div className="mb-canvas-img-box">
                  <img
                    src={img.previewUrl}
                    alt={img.title || img.name}
                    className="mb-canvas-img"
                    loading="lazy"
                  />
                </div>
                <div className="mb-canvas-card-footer modern-footer">
                  <span className="mb-canvas-img-index">0{idx + 1}</span>
                  <span className="mb-canvas-img-title">{img.title || img.name}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case "minimal":
        return (
          <div className={`mb-layout-canvas layout-minimal ${isFullscreen ? "is-fullscreen" : ""}`}>
            {images.map((img, idx) => (
              <div key={img.id || idx} className="mb-canvas-card card-minimal">
                <div className="mb-canvas-img-box minimal-box">
                  <img
                    src={img.previewUrl}
                    alt={img.title || img.name}
                    className="mb-canvas-img"
                    loading="lazy"
                  />
                </div>
                <div className="mb-canvas-card-footer minimal-footer">
                  <span className="mb-canvas-img-title">{img.title || img.name}</span>
                  <span className="mb-canvas-minimal-dot">•</span>
                  <span className="mb-canvas-minimal-cat">{cat.name}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case "magazine":
        return (
          <div className={`mb-layout-canvas layout-magazine ${isFullscreen ? "is-fullscreen" : ""}`}>
            {/* Left Primary Hero Section */}
            {images.length > 0 && (
              <div className="mb-mag-hero-column">
                <div className="mb-canvas-card card-mag-hero">
                  <div className="mb-canvas-img-box mag-hero-box">
                    <img
                      src={images[0].previewUrl}
                      alt={images[0].title || images[0].name}
                      className="mb-canvas-img"
                      loading="lazy"
                    />
                    <div className="mb-mag-hero-badge">Featured Concept</div>
                  </div>
                  <div className="mb-canvas-card-footer mag-hero-footer">
                    <h5 className="mb-mag-title">{images[0].title || images[0].name}</h5>
                    <p className="mb-mag-sub">{cat.name} Signature Study</p>
                  </div>
                </div>
              </div>
            )}

            {/* Right Supporting Images Grid */}
            {images.length > 1 && (
              <div className="mb-mag-support-column">
                {images.slice(1).map((img, idx) => (
                  <div key={img.id || idx} className="mb-canvas-card card-mag-support">
                    <div className="mb-canvas-img-box mag-support-box">
                      <img
                        src={img.previewUrl}
                        alt={img.title || img.name}
                        className="mb-canvas-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="mb-canvas-card-footer">
                      <span className="mb-canvas-img-title">{img.title || img.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "split":
        return (
          <div className={`mb-layout-canvas layout-split ${isFullscreen ? "is-fullscreen" : ""}`}>
            <div className="mb-split-col mb-split-col-left">
              {images
                .filter((_, i) => i % 2 === 0)
                .map((img, idx) => (
                  <div key={img.id || idx} className="mb-canvas-card card-split">
                    <div className="mb-canvas-img-box">
                      <img
                        src={img.previewUrl}
                        alt={img.title || img.name}
                        className="mb-canvas-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="mb-canvas-card-footer">
                      <span className="mb-canvas-img-title">{img.title || img.name}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mb-split-divider-line" />

            <div className="mb-split-col mb-split-col-right">
              {images
                .filter((_, i) => i % 2 === 1)
                .map((img, idx) => (
                  <div key={img.id || idx} className="mb-canvas-card card-split">
                    <div className="mb-canvas-img-box">
                      <img
                        src={img.previewUrl}
                        alt={img.title || img.name}
                        className="mb-canvas-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="mb-canvas-card-footer">
                      <span className="mb-canvas-img-title">{img.title || img.name}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="moodboard-preview-panel mb-preview-panel" aria-labelledby="mb-template-heading">
      {/* Choose Template Section */}
      <MoodBoardTemplateSelector
        selectedTemplate={selectedTemplate}
        onSelectTemplate={onSelectTemplate}
      />

      {/* Main Preview White Canvas Container */}
      <div className="moodboard-preview-canvas mb-preview-inner-card mb-preview-canvas-card">
        {/* Preview Title Row: Category title left (— Category Name), Project | Moodboard name right */}
        <div className="preview-title-row mb-preview-canvas-header">
          <div className="mb-preview-header-meta">
            <div className="mb-preview-category-tag-row">
              <span className="mb-active-cat-dash">—</span>
              <span className="mb-active-cat-name">{activeCategory.name}</span>
            </div>
          </div>

          <div className="mb-preview-header-actions-group">
            <div className="mb-preview-sub-breadcrumb">
              <span className="mb-preview-proj-name">{projectName || "Select Project"}</span>
              <span className="mb-preview-sep">|</span>
              <span className="mb-preview-board-name">
                {name.trim() || "Untitled Moodboard"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Canvas Viewport */}
        <div className="mb-canvas-viewport">
          {renderTemplateCanvas(activeCategory, false)}
        </div>

        {/* Category Preview Navigation Bar with Fullscreen on the right */}
        <nav
          className="mb-preview-category-pagination"
          aria-label="Category Preview Navigation"
        >
          <div className="mb-preview-nav-controls">
            <button
              type="button"
              className="mb-page-nav-btn prev"
              disabled={currentIndex <= 0}
              onClick={() => prevCategory && onSelectCategory(prevCategory.id)}
              title={prevCategory ? `Previous: ${prevCategory.name}` : "No previous category"}
            >
              <ChevronLeft size={16} />
              <span className="mb-nav-btn-label">{prevCategory ? prevCategory.name : "Previous"}</span>
            </button>

            <div className="mb-pagination-counter-group">
              <span className="mb-pagination-current-label">{activeCategory.name}</span>
              <span className="mb-pagination-fraction">
                {currentIndex + 1} / {totalCategories}
              </span>
            </div>

            <button
              type="button"
              className="mb-page-nav-btn next"
              disabled={currentIndex >= totalCategories - 1}
              onClick={() => nextCategory && onSelectCategory(nextCategory.id)}
              title={nextCategory ? `Next: ${nextCategory.name}` : "No next category"}
            >
              <span className="mb-nav-btn-label">{nextCategory ? nextCategory.name : "Next"}</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className="mb-btn-fullscreen"
            onClick={() => setIsFullscreenOpen(true)}
            title="View in full-screen overlay"
          >
            <Maximize2 size={15} />
            <span>Fullscreen</span>
          </button>
        </nav>
      </div>

      {/* Fullscreen Modal Overlay */}
      <MoodBoardFullscreenModal
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        categories={categories}
        activeCategoryId={activeCategory.id}
        onSelectCategory={onSelectCategory}
        selectedTemplate={selectedTemplate}
        moodboardName={name}
        projectName={projectName}
        renderTemplateCanvas={renderTemplateCanvas}
      />
    </section>
  );
}
