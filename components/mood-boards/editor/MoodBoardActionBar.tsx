"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

interface MoodBoardActionBarProps {
  title?: string;
  onBack: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onCreate: () => void;
  isSaving?: boolean;
}

export default function MoodBoardActionBar({
  title = "Create Mood Board",
  onBack,
  onCancel,
  onSaveDraft,
  onCreate,
  isSaving = false,
}: MoodBoardActionBarProps) {
  return (
    <div className="mb-action-bar-frame" role="toolbar" aria-label="Editor actions">
      {/* Left side: Back vector + Title (Frame 2147225121) */}
      <div className="mb-action-bar-left">
        <button
          type="button"
          onClick={onBack}
          className="mb-action-bar-back-btn"
          aria-label="Back to mood boards"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="mb-action-bar-title">{title}</h1>
      </div>

      {/* Right side: Cancel, Save as Draft, Create Mood Board (Frame 2147225069) */}
      <div className="mb-action-bar-right">
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
        >
          Save as Draft
        </button>

        <button
          type="button"
          className="mb-action-btn-create"
          onClick={onCreate}
          disabled={isSaving}
        >
          {isSaving ? "Creating..." : "Create Mood Board"}
        </button>
      </div>
    </div>
  );
}
