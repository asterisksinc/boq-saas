"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { MoodBoard } from "@/lib/mood-boards/types";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  moodBoard: MoodBoard | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export default function DeleteConfirmDialog({
  isOpen,
  moodBoard,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
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

  if (!isOpen || !moodBoard) return null;

  return (
    <div
      className="mb-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-mb-title"
    >
      <div
        className="mb-modal-card"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#FEF2F2",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h2 id="delete-mb-title" className="mb-modal-title">
              Delete Mood Board
            </h2>
          </div>
          <button
            type="button"
            className="mb-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-modal-body">
          <p style={{ margin: 0, fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>
            Are you sure you want to permanently delete{" "}
            <strong style={{ color: "#0F172A" }}>{moodBoard.name}</strong>?
            This will remove all associated concept images and cannot be undone.
          </p>
        </div>

        <div className="mb-modal-footer">
          <button
            type="button"
            className="mb-btn mb-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mb-btn mb-btn-danger"
            onClick={() => onConfirm(moodBoard.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
