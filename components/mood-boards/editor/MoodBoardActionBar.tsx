"use client";

import React from "react";
import { ArrowLeft, Check, ChevronRight, Save, Sparkles } from "lucide-react";

export interface MoodBoardActionBarProps {
  title?: string;
  subtitle?: string;
  currentStep?: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  onBack: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onContinueToReview?: () => void;
  onCreate: () => void;
  isSaving?: boolean;
  canProceedToReview?: boolean;
}

export default function MoodBoardActionBar({
  title = "Create Moodboard",
  subtitle = "Add categories, upload images, and organize your design inspiration.",
  currentStep = 1,
  onStepClick,
  onBack,
  onCancel,
  onSaveDraft,
  onContinueToReview,
  onCreate,
  isSaving = false,
  canProceedToReview = true,
}: MoodBoardActionBarProps) {
  const steps: { number: 1 | 2 | 3; label: string }[] = [
    { number: 1, label: "Add Content" },
    { number: 2, label: "Review" },
    { number: 3, label: "Complete" },
  ];

  return (
    <header className="moodboard-header mb-action-bar-frame" role="toolbar" aria-label="Moodboard editor toolbar">
      {/* Top Left: Back Navigation, Title & Subtitle */}
      <div className="mb-action-bar-left">
        <h2 className="mb-page-section-title">Moodboards</h2>
        <div className="mb-page-navigation-row">
          <button
            type="button"
            onClick={onBack}
            className="mb-action-bar-back-btn mb-back-nav-btn"
            aria-label="Back to mood boards"
            title="Back to Moodboards"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>
        <div className="mb-header-title-wrap">
          <h1 className="mb-action-bar-title">{title}</h1>
          <p className="mb-action-bar-sub">{subtitle}</p>
        </div>
      </div>

      <div className="mb-action-bar-top-right">
        {/* Three-Step Progress Indicator */}
        <nav className="mb-workflow-stepper" aria-label="Moodboard Creation Progress">
          <ol className="mb-steps-list">
            {steps.map((st, index) => {
              const isCurrent = currentStep === st.number;
              const isCompleted = currentStep > st.number;
              const isPending = currentStep < st.number;

              return (
                <li
                  key={st.number}
                  className={`mb-step-item ${isCurrent ? "is-active" : ""} ${
                    isCompleted ? "is-completed" : ""
                  } ${isPending ? "is-pending" : ""}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <button
                    type="button"
                    className="mb-step-btn"
                    disabled={isSaving || (isPending && !canProceedToReview)}
                    onClick={() => onStepClick?.(st.number)}
                    title={`Go to Step ${st.number}: ${st.label}`}
                  >
                    <span className="mb-step-indicator">
                      {isCompleted ? <Check size={13} strokeWidth={3} /> : st.number}
                    </span>
                    <span className="mb-step-label">{st.label}</span>
                  </button>

                  {index < steps.length - 1 && (
                    <div
                      className={`mb-step-connector ${isCompleted ? "completed" : ""}`}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Header workflow actions */}
        <div className="mb-action-bar-right">
        {currentStep === 1 && (
          <>
            <button
              type="button"
              className="mb-action-btn-cancel"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="mb-action-btn-draft"
              onClick={onSaveDraft}
              disabled={isSaving}
              title="Save working progress locally"
            >
              <Save size={15} />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              className="mb-action-btn-create"
              onClick={onContinueToReview || onCreate}
              disabled={isSaving}
            >
              <span>Continue to Review</span>
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {currentStep === 2 && (
          <>
            <button
              type="button"
              className="mb-action-btn-cancel"
              onClick={() => onStepClick?.(1)}
              disabled={isSaving}
            >
              ← Back to Edit
            </button>

            <button
              type="button"
              className="mb-action-btn-draft"
              onClick={onSaveDraft}
              disabled={isSaving}
            >
              <Save size={15} />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              className="mb-action-btn-create"
              onClick={onCreate}
              disabled={isSaving}
            >
              {isSaving ? "Creating..." : "Create Mood Board"}
            </button>
          </>
        )}

        {currentStep === 3 && (
          <button
            type="button"
            className="mb-action-btn-cancel"
            onClick={onBack}
          >
            ← Back to Moodboards
          </button>
        )}
        </div>
      </div>
    </header>
  );
}
