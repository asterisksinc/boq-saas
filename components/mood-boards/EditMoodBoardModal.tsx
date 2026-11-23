"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud } from "lucide-react";
import { MoodBoard, UpdateMoodBoardInput, MoodBoardStatus } from "@/lib/mood-boards/types";
import { MOCK_PROJECTS, MOCK_CLIENTS } from "@/lib/mood-boards/mock-data";

interface EditMoodBoardModalProps {
  isOpen: boolean;
  moodBoard: MoodBoard | null;
  onClose: () => void;
  onSubmit: (id: string, input: UpdateMoodBoardInput) => void;
}

export default function EditMoodBoardModal({
  isOpen,
  moodBoard,
  onClose,
  onSubmit,
}: EditMoodBoardModalProps) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSubtitle, setClientSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<MoodBoardStatus>("DRAFT");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (moodBoard) {
      setName(moodBoard.name);
      setProjectId(moodBoard.projectId);
      setClientId(moodBoard.clientId);
      setClientSubtitle(moodBoard.clientSubtitle || "");
      setDescription(moodBoard.description || "");
      setStatus(moodBoard.status);
      setCoverPreview(moodBoard.coverImage || null);
    }
  }, [moodBoard]);

  if (!isOpen || !moodBoard) return null;

  const handleProjectChange = (selectedProjectId: string) => {
    setProjectId(selectedProjectId);
    const project = MOCK_PROJECTS.find((p) => p.id === selectedProjectId);
    if (project) {
      setClientId(project.defaultClientId);
      setClientSubtitle(project.defaultClientSubtitle || "");
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setCoverPreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const isFormValid = Boolean(name.trim() && projectId && clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const matchedProject = MOCK_PROJECTS.find((p) => p.id === projectId);
    const matchedClient = MOCK_CLIENTS.find((c) => c.id === clientId);

    const input: UpdateMoodBoardInput = {
      name: name.trim(),
      projectId,
      projectName: matchedProject?.name || moodBoard.projectName,
      clientId,
      clientName: matchedClient?.name || moodBoard.clientName,
      clientSubtitle: clientSubtitle || matchedClient?.subtitle || "",
      description: description.trim() || undefined,
      status,
      coverImage: coverPreview || undefined,
    };

    onSubmit(moodBoard.id, input);
  };

  return (
    <div
      className="mb-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-mb-title"
    >
      <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-modal-header">
          <div>
            <h2 id="edit-mb-title" className="mb-modal-title">
              Edit Mood Board
            </h2>
            <p className="mb-modal-subtitle">Update presentation details, project, or status.</p>
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

        <form onSubmit={handleSubmit}>
          <div className="mb-modal-body">
            {/* Mood Board Name */}
            <div className="mb-form-group">
              <label htmlFor="edit-mb-name" className="mb-form-label">
                Mood Board Name <span className="mb-form-req">*</span>
              </label>
              <input
                id="edit-mb-name"
                type="text"
                className="mb-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Project Selector */}
            <div className="mb-form-group">
              <label htmlFor="edit-mb-project" className="mb-form-label">
                Associated Project <span className="mb-form-req">*</span>
              </label>
              <select
                id="edit-mb-project"
                className="mb-form-select"
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                required
              >
                {MOCK_PROJECTS.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Selector */}
            <div className="mb-form-group">
              <label htmlFor="edit-mb-client" className="mb-form-label">
                Client <span className="mb-form-req">*</span>
              </label>
              <select
                id="edit-mb-client"
                className="mb-form-select"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                {MOCK_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.subtitle ? `(${c.subtitle})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="mb-form-group">
              <label htmlFor="edit-mb-status" className="mb-form-label">
                Status
              </label>
              <select
                id="edit-mb-status"
                className="mb-form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as MoodBoardStatus)}
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Description */}
            <div className="mb-form-group">
              <label htmlFor="edit-mb-desc" className="mb-form-label">
                Description
              </label>
              <textarea
                id="edit-mb-desc"
                className="mb-form-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Cover Image Upload */}
            <div className="mb-form-group">
              <label className="mb-form-label">Cover Image</label>
              {coverPreview ? (
                <div style={{ position: "relative", width: "100%", height: 160, borderRadius: 8, overflow: "hidden" }}>
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => setCoverPreview(null)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(15, 23, 42, 0.75)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: 4,
                      cursor: "pointer",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className="mb-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={28} className="mb-dropzone-icon" />
                  <span className="mb-dropzone-text">Click to choose replacement cover image</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />
                </div>
              )}
            </div>
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
              type="submit"
              className="mb-btn mb-btn-primary"
              disabled={!isFormValid}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
