"use client";

import React, { useRef } from "react";
import { Check, ChevronLeft, ChevronRight, LayoutTemplate } from "lucide-react";
import { MoodBoardTemplateLayout } from "@/lib/mood-boards/types";
import { LAYOUT_TEMPLATES } from "@/lib/mood-boards/templates-data";

export interface MoodBoardTemplateSelectorProps {
  selectedTemplate: MoodBoardTemplateLayout;
  onSelectTemplate: (template: MoodBoardTemplateLayout) => void;
}

export default function MoodBoardTemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: MoodBoardTemplateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -240 : 240;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const renderLayoutDiagram = (id: MoodBoardTemplateLayout) => {
    switch (id) {
      case "grid-4x4":
        return (
          <div className="mb-tpl-mini-diagram grid-4x4">
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
            <span /><span /><span /><span />
          </div>
        );
      case "collage":
        return (
          <div className="mb-tpl-mini-diagram collage">
            <span className="col-span-2 row-span-2 primary-hero" />
            <span className="small-1" />
            <span className="small-2" />
            <span className="col-span-2 small-3" />
          </div>
        );
      case "modern":
        return (
          <div className="mb-tpl-mini-diagram modern">
            <span className="wide-top" />
            <span className="half-left" />
            <span className="half-right" />
            <span className="wide-bottom" />
          </div>
        );
      case "minimal":
        return (
          <div className="mb-tpl-mini-diagram minimal">
            <span className="minimal-single" />
            <div className="minimal-line" />
          </div>
        );
      case "magazine":
        return (
          <div className="mb-tpl-mini-diagram magazine">
            <span className="mag-feature" />
            <div className="mag-stack">
              <span className="mag-sub1" />
              <span className="mag-sub2" />
            </div>
          </div>
        );
      case "split":
        return (
          <div className="mb-tpl-mini-diagram split">
            <span className="split-left" />
            <span className="split-right" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="mb-choose-template-section" aria-labelledby="mb-template-heading">
      <div className="mb-template-bar-header">
        <div className="mb-template-bar-title-wrap">
          <LayoutTemplate size={16} className="text-blue-600" />
          <h3 id="mb-template-heading" className="mb-template-bar-title">
            Choose Template
          </h3>
          <span className="mb-template-active-name">
            {LAYOUT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "Grid 4 × 4"}
          </span>
        </div>

        {/* Scroll navigation arrows */}
        <div className="mb-template-nav-arrows">
          <button
            type="button"
            className="mb-tpl-arrow-btn"
            onClick={() => scroll("left")}
            aria-label="Scroll templates left"
            title="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="mb-tpl-arrow-btn"
            onClick={() => scroll("right")}
            aria-label="Scroll templates right"
            title="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontally Arranged Template Cards */}
      <div
        ref={scrollRef}
        className="mb-template-cards-carousel"
        role="radiogroup"
        aria-label="Moodboard layout templates"
      >
        {LAYOUT_TEMPLATES.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id;

          return (
            <div
              key={tpl.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              className={`mb-template-card-option ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectTemplate(tpl.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectTemplate(tpl.id);
                }
              }}
              title={`${tpl.name}: ${tpl.description}`}
            >
              {/* Top Diagram Preview */}
              <div className="mb-tpl-diagram-frame">
                {renderLayoutDiagram(tpl.id)}

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="mb-tpl-selected-badge" aria-label="Selected">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Template Label */}
              <div className="mb-tpl-info-row">
                <span className="mb-tpl-card-title">{tpl.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
