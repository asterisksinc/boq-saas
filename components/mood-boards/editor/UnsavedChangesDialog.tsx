"use client";

import React, { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
  onSaveDraftAndLeave?: () => void;
}

export default function UnsavedChangesDialog({
  isOpen,
  onClose,
  onConfirmLeave,
  onSaveDraftAndLeave,
}: UnsavedChangesDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="new-mb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mb-unsaved-dialog">
        <div className="mb-unsaved-header">
          <div className="mb-unsaved-title-row">
            <AlertCircle size={22} className="mb-unsaved-icon" />
            <h3 id="unsaved-changes-title" className="mb-unsaved-title">
              Unsaved Changes
            </h3>
          </div>
          <button
            type="button"
            className="new-mb-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-unsaved-desc">
          You have unsaved changes in this mood board. Would you like to save your work as a draft before leaving?
        </p>

        <div className="mb-unsaved-footer">
          <button
            type="button"
            className="new-mb-btn-cancel"
            onClick={onClose}
          >
            Keep Editing
          </button>

          {onSaveDraftAndLeave && (
            <button
              type="button"
              className="mb-btn-save-draft-leave"
              onClick={onSaveDraftAndLeave}
            >
              {"Save Draft & Leave"}
            </button>
          )}

          <button
            type="button"
            className="mb-btn-discard-leave"
            onClick={onConfirmLeave}
          >
            Leave Without Saving
          </button>
        </div>
      </div>
    </div>
  );
}
