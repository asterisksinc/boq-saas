"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

export type CreationMode = "blank" | "template";

interface NewMoodBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (mode: CreationMode) => void;
}

export default function NewMoodBoardModal({
  isOpen,
  onClose,
  onContinue,
}: NewMoodBoardModalProps) {
  const [selectedMode, setSelectedMode] = useState<CreationMode>("blank");

  // Reset to "blank" whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMode("blank");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleContinue = () => {
    onContinue(selectedMode);
  };

  return (
    <div
      className="new-mb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-mb-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="new-mb-modal-container">
        {/* Header (Frame 2147225093) */}
        <div className="new-mb-header">
          <div className="new-mb-header-titles">
            <h2 id="new-mb-title" className="new-mb-title">
              New Mood Board
            </h2>
            <p className="new-mb-subtitle">
              Choose how you want to create this Mood Board
            </p>
          </div>

          <button
            type="button"
            className="new-mb-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options Frame (Frame 2147225091) */}
        <div className="new-mb-options-frame" role="radiogroup" aria-label="Creation Options">
          {/* Option 1: Blank Mood Board (Frame 2147225087) */}
          <div
            role="radio"
            aria-checked={selectedMode === "blank"}
            tabIndex={0}
            className={`new-mb-option-card ${
              selectedMode === "blank" ? "selected" : ""
            }`}
            onClick={() => setSelectedMode("blank")}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setSelectedMode("blank");
              }
            }}
          >
            <div className="new-mb-option-header">
              <span className="new-mb-option-title">Blank Mood Board</span>
              <div
                className={`new-mb-check-indicator ${
                  selectedMode === "blank" ? "active" : ""
                }`}
              >
                {selectedMode === "blank" && <Check size={12} strokeWidth={3} />}
              </div>
            </div>
            <p className="new-mb-option-desc">Start with an empty canvas.</p>
          </div>

          {/* Option 2: From Template (Frame 2147225088) */}
          <div
            role="radio"
            aria-checked={selectedMode === "template"}
            tabIndex={0}
            className={`new-mb-option-card ${
              selectedMode === "template" ? "selected" : ""
            }`}
            onClick={() => setSelectedMode("template")}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setSelectedMode("template");
              }
            }}
          >
            <div className="new-mb-option-header">
              <span className="new-mb-option-title">From Template</span>
              <div
                className={`new-mb-check-indicator ${
                  selectedMode === "template" ? "active" : ""
                }`}
              >
                {selectedMode === "template" && <Check size={12} strokeWidth={3} />}
              </div>
            </div>
            <p className="new-mb-option-desc">Use a saved moodboard template.</p>
          </div>
        </div>

        {/* Footer Actions (Frame 2147225069) */}
        <div className="new-mb-footer">
          <button
            type="button"
            className="new-mb-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="new-mb-btn-continue"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
