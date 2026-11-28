"use client";

import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { MoodBoardCategory, MoodBoardTemplateLayout } from "@/lib/mood-boards/types";

export interface MoodBoardFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MoodBoardCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  selectedTemplate: MoodBoardTemplateLayout;
  moodboardName: string;
  projectName: string;
  renderTemplateCanvas: (category: MoodBoardCategory, isFullscreen?: boolean) => React.ReactNode;
}

export default function MoodBoardFullscreenModal({
  isOpen,
  onClose,
  categories,
  activeCategoryId,
  onSelectCategory,
  selectedTemplate,
  moodboardName,
  projectName,
  renderTemplateCanvas,
}: MoodBoardFullscreenModalProps) {
  const currentIndex = categories.findIndex((c) => c.id === activeCategoryId);
  const activeCategory =
    categories[currentIndex] || categories[0] || { id: "default", name: "General", images: [] };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        if (currentIndex > 0) onSelectCategory(categories[currentIndex - 1].id);
      }
      if (e.key === "ArrowRight") {
        if (currentIndex < categories.length - 1) onSelectCategory(categories[currentIndex + 1].id);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, currentIndex, categories, onSelectCategory]);

  if (!isOpen) return null;

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectCategory(categories[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < categories.length - 1) {
      onSelectCategory(categories[currentIndex + 1].id);
    }
  };

  return (
    <div
      className="mb-fullscreen-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen Moodboard Preview"
    >
      {/* Top Controls Bar */}
      <div className="mb-fullscreen-topbar">
        <div className="mb-fullscreen-title-area">
          <span className="mb-fullscreen-badge">Fullscreen Preview</span>
          <h2 className="mb-fullscreen-board-title">
            {activeCategory.name}
          </h2>
          <span className="mb-fullscreen-meta-sub">
            {projectName || "Project"} | {moodboardName || "Moodboard"}
          </span>
        </div>

        {/* Center Category Navigator */}
        <div className="mb-fullscreen-nav-center">
          <button
            type="button"
            className="mb-fs-nav-btn"
            disabled={currentIndex <= 0}
            onClick={handlePrev}
            title="Previous category (Arrow Left)"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="mb-fs-page-indicator">
            {activeCategory.name} ({currentIndex + 1} / {categories.length})
          </span>

          <button
            type="button"
            className="mb-fs-nav-btn"
            disabled={currentIndex >= categories.length - 1}
            onClick={handleNext}
            title="Next category (Arrow Right)"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="mb-fullscreen-close-btn"
          onClick={onClose}
          aria-label="Exit fullscreen"
          title="Exit fullscreen (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Fullscreen Canvas Container */}
      <div className="mb-fullscreen-content-viewport">
        <div className="mb-fullscreen-canvas-wrapper">
          {renderTemplateCanvas(activeCategory, true)}
        </div>
      </div>
    </div>
  );
}
