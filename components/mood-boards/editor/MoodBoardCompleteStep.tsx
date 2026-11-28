"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, LayoutTemplate, FolderCheck, Plus, Sparkles } from "lucide-react";
import { MoodBoard } from "@/lib/mood-boards/types";
import { LAYOUT_TEMPLATES } from "@/lib/mood-boards/templates-data";

export interface MoodBoardCompleteStepProps {
  createdMoodBoard: MoodBoard | null;
  onReset: () => void;
}

export default function MoodBoardCompleteStep({
  createdMoodBoard,
  onReset,
}: MoodBoardCompleteStepProps) {
  const templateInfo = LAYOUT_TEMPLATES.find(
    (t) => t.id === createdMoodBoard?.selectedTemplate
  );

  const totalCategories = createdMoodBoard?.categories?.length || 0;
  const totalImages =
    createdMoodBoard?.categories?.reduce(
      (sum, c) => sum + (c.images?.length || 0),
      0
    ) || createdMoodBoard?.images?.length || 0;

  return (
    <div className="mb-complete-step-container">
      <div className="mb-complete-success-card">
        {/* Celebration / Success Icon */}
        <div className="mb-complete-icon-outer">
          <div className="mb-complete-icon-inner">
            <CheckCircle2 size={42} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        <span className="mb-complete-step-badge">Step 3: Complete</span>
        <h2 className="mb-complete-title">Moodboard Created Successfully!</h2>
        <p className="mb-complete-subtitle">
          Your visual collection has been generated and is ready to share with clients, architects, and collaborators.
        </p>

        {/* Created Summary Card */}
        {createdMoodBoard && (
          <div className="mb-complete-details-box">
            <div className="mb-complete-detail-row">
              <span className="detail-label">Moodboard Name</span>
              <span className="detail-value font-semibold text-slate-900">
                {createdMoodBoard.name}
              </span>
            </div>

            <div className="mb-complete-detail-row">
              <span className="detail-label">Project</span>
              <span className="detail-value text-slate-800">
                {createdMoodBoard.projectName}
              </span>
            </div>

            <div className="mb-complete-detail-row">
              <span className="detail-label">Client</span>
              <span className="detail-value text-slate-800">
                {createdMoodBoard.clientName}
              </span>
            </div>

            <div className="mb-complete-detail-row">
              <span className="detail-label">Template Layout</span>
              <span className="detail-value flex items-center gap-1.5 text-blue-600 font-medium">
                <LayoutTemplate size={14} />
                <span>{templateInfo?.name || "Grid 4 × 4"}</span>
              </span>
            </div>

            <div className="mb-complete-detail-row">
              <span className="detail-label">Content</span>
              <span className="detail-value text-slate-700">
                {totalCategories} Categories • {totalImages} Images
              </span>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="mb-complete-actions-group">
          {createdMoodBoard && (
            <Link
              href={`/mood-boards/${createdMoodBoard.id}`}
              className="mb-complete-btn-primary"
            >
              <span>View Moodboard</span>
              <ArrowRight size={16} />
            </Link>
          )}

          <Link
            href={createdMoodBoard ? `/mood-boards?created=${createdMoodBoard.id}` : "/mood-boards"}
            className="mb-complete-btn-secondary"
          >
            <span>Back to Moodboards</span>
          </Link>

          <button
            type="button"
            className="mb-complete-btn-ghost"
            onClick={onReset}
          >
            <Plus size={15} />
            <span>Create Another Moodboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
