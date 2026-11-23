"use client";

import React, { useState } from "react";
import { X, Check, Download, Loader2, AlertCircle } from "lucide-react";
import { MoodBoard } from "@/lib/mood-boards/types";
import { downloadMoodBoardPdf } from "@/lib/mood-boards/export-service";

export interface MoodBoardSuccessModalProps {
  isOpen: boolean;
  moodBoard: MoodBoard | null;
  onClose: () => void;
  onDownload?: (moodBoard: MoodBoard) => Promise<void> | void;
}

export default function MoodBoardSuccessModal({
  isOpen,
  moodBoard,
  onClose,
  onDownload,
}: MoodBoardSuccessModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !moodBoard) {
    return null;
  }

  // Calculate dynamic metadata
  const categoriesCount = moodBoard.categories ? moodBoard.categories.length : 0;
  
  // Calculate total images across all categories or root images
  const categoryImagesCount = (moodBoard.categories || []).reduce(
    (acc, cat) => acc + (cat.images ? cat.images.length : (cat.imageCount || 0)),
    0
  );
  const rootImagesCount = moodBoard.images ? moodBoard.images.length : 0;
  const totalImagesCount = Math.max(categoryImagesCount, rootImagesCount);

  // Field values with graceful fallbacks
  const clientName = moodBoard.clientName || "General Client";
  const boqReference = moodBoard.boqReference || "BOQ-0029";
  const projectName = moodBoard.projectName || "Project";

  const handleDownloadClick = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      if (onDownload) {
        await onDownload(moodBoard);
      } else {
        await downloadMoodBoardPdf(moodBoard);
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to download moodboard:", err);
      setDownloadError("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="mb-success-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mb-success-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="mb-success-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Figma Spec Frame 2147225093) */}
        <header className="mb-success-modal-header">
          <div className="mb-success-header-titles">
            <h2 id="mb-success-modal-title" className="mb-success-modal-title">
              Create New Mood Board
            </h2>
            <p className="mb-success-modal-subtitle">
              Choose how you want to start this project.
            </p>
          </div>

          <button
            type="button"
            className="mb-success-close-btn"
            onClick={onClose}
            aria-label="Close success dialog"
          >
            <X size={20} />
          </button>
        </header>

        {/* Success Confirmation Card (Figma Spec Frame 2147225027) */}
        <div className="mb-success-confirm-card">
          {/* Green Success Icon (Figma Spec Frame 2147225039 & 2147225038) */}
          <div className="mb-success-circle-outer" aria-hidden="true">
            <div className="mb-success-circle-inner">
              <Check size={28} className="mb-success-check-svg" strokeWidth={2.5} />
            </div>
          </div>

          {/* Heading & Subtitle (Figma Spec Frame 2147225034) */}
          <div className="mb-success-headings">
            <h3 className="mb-success-heading">
              Mood Board Created Successfully!
            </h3>
            <p className="mb-success-message">
              Your moodboard is ready
            </p>
          </div>

          {/* Information Card (Figma Spec Frame 2147225027 nested) */}
          <div className="mb-success-info-card" aria-label="Mood Board Details">
            {/* Row 1: Client Name & BOQ (Frame 2147225098) */}
            <div className="mb-info-row">
              <div className="mb-info-cell">
                <div className="mb-info-label-wrap">
                  <Check size={16} className="mb-info-check" strokeWidth={2.5} />
                  <span className="mb-info-label">Client Name</span>
                </div>
                <span className="mb-info-value" title={clientName}>
                  {clientName}
                </span>
              </div>

              <div className="mb-info-vert-sep" aria-hidden="true" />

              <div className="mb-info-cell">
                <div className="mb-info-label-wrap">
                  <Check size={16} className="mb-info-check" strokeWidth={2.5} />
                  <span className="mb-info-label">BOQ</span>
                </div>
                <span className="mb-info-value" title={boqReference}>
                  {boqReference}
                </span>
              </div>
            </div>

            <div className="mb-info-horiz-sep" aria-hidden="true" />

            {/* Row 2: Project & Categories (Frame 2147225099) */}
            <div className="mb-info-row">
              <div className="mb-info-cell">
                <div className="mb-info-label-wrap">
                  <Check size={16} className="mb-info-check" strokeWidth={2.5} />
                  <span className="mb-info-label">Project</span>
                </div>
                <span className="mb-info-value" title={projectName}>
                  {projectName}
                </span>
              </div>

              <div className="mb-info-vert-sep" aria-hidden="true" />

              <div className="mb-info-cell">
                <div className="mb-info-label-wrap">
                  <Check size={16} className="mb-info-check" strokeWidth={2.5} />
                  <span className="mb-info-label">Categories</span>
                </div>
                <span className="mb-info-value">
                  {categoriesCount}
                </span>
              </div>
            </div>

            <div className="mb-info-horiz-sep" aria-hidden="true" />

            {/* Row 3: Images */}
            <div className="mb-info-row">
              <div className="mb-info-cell mb-info-cell-full">
                <div className="mb-info-label-wrap">
                  <Check size={16} className="mb-info-check" strokeWidth={2.5} />
                  <span className="mb-info-label">Images</span>
                </div>
                <span className="mb-info-value">
                  {totalImagesCount}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback states if any */}
          {downloadError && (
            <div className="mb-success-error-alert" role="alert">
              <AlertCircle size={15} />
              <span>{downloadError}</span>
            </div>
          )}
          {downloadSuccess && (
            <div className="mb-success-toast-alert" role="status">
              <Check size={15} />
              <span>Moodboard PDF downloaded successfully!</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions (Figma Spec Frame 2147225069) */}
        <footer className="mb-success-footer">
          <button
            type="button"
            className="mb-btn-success-back"
            onClick={onClose}
          >
            Back
          </button>

          <button
            type="button"
            className="mb-btn-success-download"
            onClick={handleDownloadClick}
            disabled={isDownloading}
            aria-busy={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Preparing PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Moodboard</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
