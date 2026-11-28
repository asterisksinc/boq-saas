"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  Plus,
  MoreHorizontal,
  Copy,
  Archive,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  User,
  X,
  Download,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { MoodBoard, MoodBoardImage, UpdateMoodBoardInput } from "@/lib/mood-boards/types";
import { moodBoardRepository } from "@/lib/mood-boards/repository";
import { downloadMoodBoardPdf } from "@/lib/mood-boards/export-service";
import MoodBoardStatusBadge from "./MoodBoardStatusBadge";
import MoodBoardImageGrid from "./MoodBoardImageGrid";
import MoodBoardImageUploader from "./MoodBoardImageUploader";
import EditMoodBoardModal from "./EditMoodBoardModal";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import "@/app/mood-boards/mood-boards.css";

interface MoodBoardDetailProps {
  id: string;
  rail: React.ReactNode;
}

export default function MoodBoardDetail({ id, rail }: MoodBoardDetailProps) {
  const router = useRouter();
  const [moodBoard, setMoodBoard] = useState<MoodBoard | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [previewImage, setPreviewImage] = useState<MoodBoardImage | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 3500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await moodBoardRepository.getById(id);
      setMoodBoard(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load mood board.", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateMenuPosition = useCallback(() => {
    const rect = menuButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuWidth = 190;
    const menuHeight = 154;
    const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
    const below = rect.bottom + 6;
    const top = below + menuHeight <= window.innerHeight - 8
      ? below
      : Math.max(8, rect.top - menuHeight - 6);
    setMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", calculateMenuPosition);
    window.addEventListener("scroll", calculateMenuPosition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", calculateMenuPosition);
      window.removeEventListener("scroll", calculateMenuPosition, true);
    };
  }, [isMenuOpen, calculateMenuPosition]);

  // Handle Edit Submit
  const handleEditSubmit = async (boardId: string, input: UpdateMoodBoardInput) => {
    try {
      const updated = await moodBoardRepository.update(boardId, input);
      setMoodBoard(updated);
      setIsEditOpen(false);
      showToast(`Mood Board "${updated.name}" updated successfully.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to update mood board.", "error");
    }
  };

  // Handle Duplicate
  const handleDuplicate = async () => {
    if (!moodBoard) return;
    try {
      const duplicated = await moodBoardRepository.duplicate(moodBoard.id);
      showToast(`Mood Board duplicated as "${duplicated.name}".`);
      router.push(`/mood-boards/${duplicated.id}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to duplicate mood board.", "error");
    }
  };

  // Handle Archive / Restore
  const handleArchive = async () => {
    if (!moodBoard) return;
    try {
      const newStatus = moodBoard.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED";
      const updated = await moodBoardRepository.update(moodBoard.id, { status: newStatus });
      setMoodBoard(updated);
      showToast(
        newStatus === "ARCHIVED"
          ? `Mood Board "${moodBoard.name}" archived.`
          : `Mood Board "${moodBoard.name}" restored.`
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to update status.", "error");
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!moodBoard) return;
    try {
      await moodBoardRepository.delete(moodBoard.id);
      showToast(`Mood Board "${moodBoard.name}" deleted.`);
      router.push("/mood-boards");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete mood board.", "error");
    }
  };

  // Handle Adding Images
  const handleAddImages = async (newImages: MoodBoardImage[]) => {
    if (!moodBoard) return;
    try {
      const combined = [...(moodBoard.images || []), ...newImages];
      // If no cover is set, use the first image as cover
      const cover = moodBoard.coverImage || (combined.length > 0 ? combined[0].previewUrl : undefined);
      const updated = await moodBoardRepository.update(moodBoard.id, {
        images: combined,
        coverImage: cover,
      });
      setMoodBoard(updated);
      showToast(`Added ${newImages.length} ${newImages.length === 1 ? "image" : "images"} to mood board.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to add images.", "error");
    }
  };

  // Handle Setting Cover Image
  const handleSetCover = async (imageUrl: string) => {
    if (!moodBoard) return;
    try {
      const updatedImages = (moodBoard.images || []).map((img) => ({
        ...img,
        isCover: img.previewUrl === imageUrl,
      }));
      const updated = await moodBoardRepository.update(moodBoard.id, {
        coverImage: imageUrl,
        images: updatedImages,
      });
      setMoodBoard(updated);
      showToast("Cover image updated.");
    } catch (err) {
      console.error(err);
      showToast("Failed to set cover image.", "error");
    }
  };

  // Handle Removing Image
  const handleRemoveImage = async (imageId: string) => {
    if (!moodBoard) return;
    try {
      const filtered = (moodBoard.images || []).filter((img) => img.id !== imageId);
      const wasCover = moodBoard.coverImage === moodBoard.images?.find((i) => i.id === imageId)?.previewUrl;
      const nextCover = wasCover
        ? (filtered.length > 0 ? filtered[0].previewUrl : undefined)
        : moodBoard.coverImage;

      const updated = await moodBoardRepository.update(moodBoard.id, {
        images: filtered,
        coverImage: nextCover,
      });
      setMoodBoard(updated);
      showToast("Image removed from mood board.");
    } catch (err) {
      console.error(err);
      showToast("Failed to remove image.", "error");
    }
  };

  if (loading) {
    return (
      <main className="fig-dashboard mood-boards-page">
        <div className="fig-dashboard-glow mood-boards-bg-glow" />
        {rail}
        <div className="fig-dashboard-main">
          <DashboardHeader title="Mood Board" />
          <div style={{ padding: 60, textAlign: "center", color: "#64748B" }}>
            Loading mood board workspace...
          </div>
        </div>
      </main>
    );
  }

  if (!moodBoard) {
    return (
      <main className="fig-dashboard mood-boards-page">
        <div className="fig-dashboard-glow mood-boards-bg-glow" />
        {rail}
        <div className="fig-dashboard-main">
          <DashboardHeader title="Mood Board" />
          <div style={{ padding: 60, textAlign: "center" }}>
            <h2 style={{ fontSize: 20, color: "#0F172A", marginBottom: 8 }}>
              Mood Board Not Found
            </h2>
            <p style={{ color: "#64748B", marginBottom: 20 }}>
              The requested mood board may have been deleted or the URL is invalid.
            </p>
            <Link href="/mood-boards" className="mb-btn mb-btn-primary">
              <ArrowLeft size={16} />
              <span>Back to Mood Boards</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="fig-dashboard mood-boards-page">
      <div className="fig-dashboard-glow mood-boards-bg-glow" />
      {rail}

      <div className="fig-dashboard-main">
        {/* Global Dashboard Header */}
        <DashboardHeader title="Mood Board" onNew={() => setIsUploadOpen(true)} />

        <div className="mood-boards-container">
          {/* Header Card */}
          <section className="mb-detail-header-card" aria-label="Mood Board Details">
            <div>
              <Link href="/mood-boards" className="mb-back-link">
                <ArrowLeft size={15} />
                <span>Back to Mood Boards</span>
              </Link>
            </div>

            <div className="mb-detail-meta-row">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="mb-detail-title-group">
                  <h1 className="mb-detail-title">{moodBoard.name}</h1>
                  <MoodBoardStatusBadge status={moodBoard.status} />
                </div>

                <div className="mb-detail-submeta">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Briefcase size={14} color="#64748B" />
                    <span>Project: <strong>{moodBoard.projectName}</strong></span>
                  </span>
                  <span>•</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <User size={14} color="#64748B" />
                    <span>
                      Client: <strong>{moodBoard.clientName}</strong>
                      {moodBoard.clientSubtitle ? ` (${moodBoard.clientSubtitle})` : ""}
                    </span>
                  </span>
                  <span>•</span>
                  <span>Created by: <strong>{moodBoard.createdBy}</strong></span>
                </div>
              </div>

              {/* Actions on right */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="mb-btn mb-btn-secondary"
                  onClick={async () => {
                    try {
                      await downloadMoodBoardPdf(moodBoard);
                      showToast(`Downloaded "${moodBoard.name}" PDF.`);
                    } catch {
                      showToast("Failed to download mood board PDF.", "error");
                    }
                  }}
                  aria-label="Download Mood Board PDF"
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  className="mb-btn mb-btn-secondary"
                  onClick={() => setIsEditOpen(true)}
                  aria-label="Edit Mood Board Details"
                >
                  <Edit3 size={16} />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  className="mb-btn mb-btn-primary"
                  onClick={() => setIsUploadOpen(true)}
                  aria-label="Add Images"
                >
                  <Plus size={16} />
                  <span>Add Images</span>
                </button>

                {/* More dropdown */}
                <div className="mb-actions-wrap">
                  <button
                    type="button"
                    ref={menuButtonRef}
                    className="mb-btn mb-btn-secondary"
                    style={{ width: 46, padding: 0 }}
                    onClick={() => {
                      if (!isMenuOpen) calculateMenuPosition();
                      setIsMenuOpen((prev) => !prev);
                    }}
                    aria-label="More options"
                    aria-expanded={isMenuOpen}
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {isMenuOpen && typeof document !== "undefined" && createPortal(
                    <div
                      ref={menuRef}
                      className="mb-dropdown-menu mb-dropdown-menu-fixed"
                      role="menu"
                      style={menuPosition}
                    >
                      <button
                        type="button"
                        className="mb-dropdown-item"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleDuplicate();
                        }}
                      >
                        <Copy size={15} />
                        <span>Duplicate</span>
                      </button>

                      <button
                        type="button"
                        className="mb-dropdown-item"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleArchive();
                        }}
                      >
                        <Archive size={15} />
                        <span>{moodBoard.status === "ARCHIVED" ? "Unarchive" : "Archive"}</span>
                      </button>

                      <button
                        type="button"
                        className="mb-dropdown-item danger"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 size={15} />
                        <span>Delete</span>
                      </button>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            </div>

            {moodBoard.description && (
              <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
                {moodBoard.description}
              </p>
            )}
          </section>

          {/* Image Workspace Area */}
          <section className="mood-board-table-surface" aria-label="Image Workspace">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 16,
                borderBottom: "1px solid #EBEBEB",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ImageIcon size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0F172A" }}>
                  Workspace Images
                </h3>
                <span
                  style={{
                    background: "#EFF6FF",
                    color: "#2563EB",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 9999,
                  }}
                >
                  {moodBoard.images ? moodBoard.images.length : 0}
                </span>
              </div>

              <button
                type="button"
                className="mb-btn mb-btn-primary"
                style={{ height: 38, padding: "0 14px", fontSize: 13 }}
                onClick={() => setIsUploadOpen(true)}
              >
                <Plus size={15} />
                <span>Add Images</span>
              </button>
            </div>

            <MoodBoardImageGrid
              images={moodBoard.images || []}
              coverImage={moodBoard.coverImage}
              onSetCover={handleSetCover}
              onRemoveImage={handleRemoveImage}
              onPreviewImage={(img) => setPreviewImage(img)}
            />
          </section>
        </div>
      </div>

      {/* Edit Details Modal */}
      <EditMoodBoardModal
        isOpen={isEditOpen}
        moodBoard={moodBoard}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Add Images Modal */}
      <MoodBoardImageUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddImages={handleAddImages}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        moodBoard={moodBoard}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="mb-lightbox-overlay"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="mb-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mb-lightbox-close"
              onClick={() => setPreviewImage(null)}
              aria-label="Close preview"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage.previewUrl}
              alt={previewImage.name}
              className="mb-lightbox-img"
            />
            <span className="mb-lightbox-caption">{previewImage.name}</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="mb-toast" role="status" aria-live="polite">
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="mb-toast-success-icon" />
          ) : (
            <AlertCircle size={18} className="mb-toast-error-icon" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}
