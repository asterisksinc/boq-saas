"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud, Image as ImageIcon } from "lucide-react";
import { CreateMoodBoardInput, MoodBoardStatus } from "@/lib/mood-boards/types";
import { MOCK_PROJECTS, MOCK_CLIENTS, createSampleImageSvg } from "@/lib/mood-boards/mock-data";

interface CreateMoodBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateMoodBoardInput) => void;
}

export default function CreateMoodBoardModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateMoodBoardModalProps) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSubtitle, setClientSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<MoodBoardStatus>("DRAFT");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    project: false,
    client: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escape key handler
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

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setName("");
      setProjectId("");
      setClientId("");
      setClientSubtitle("");
      setDescription("");
      setStatus("DRAFT");
      setCoverPreview(null);
      setTouched({ name: false, project: false, client: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // When project changes, auto-populate associated client
  const handleProjectChange = (selectedProjectId: string) => {
    setProjectId(selectedProjectId);
    setTouched((prev) => ({ ...prev, project: true }));

    const project = MOCK_PROJECTS.find((p) => p.id === selectedProjectId);
    if (project) {
      setClientId(project.defaultClientId);
      setClientSubtitle(project.defaultClientSubtitle || "");
      setTouched((prev) => ({ ...prev, client: true }));
    }
  };

  const handleClientChange = (selectedClientId: string) => {
    setClientId(selectedClientId);
    setTouched((prev) => ({ ...prev, client: true }));

    const client = MOCK_CLIENTS.find((c) => c.id === selectedClientId);
    if (client && client.subtitle) {
      setClientSubtitle(client.subtitle);
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

  // Validation
  const nameError = touched.name && !name.trim() ? "Mood board name is required" : "";
  const projectError = touched.project && !projectId ? "Project is required" : "";
  const clientError = touched.client && !clientId ? "Client is required" : "";
  const isFormValid = Boolean(name.trim() && projectId && clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, project: true, client: true });
    if (!isFormValid) return;

    const matchedProject = MOCK_PROJECTS.find((p) => p.id === projectId);
    const matchedClient = MOCK_CLIENTS.find((c) => c.id === clientId);

    const input: CreateMoodBoardInput = {
      name: name.trim(),
      projectId,
      projectName: matchedProject?.name || "Untitled Project",
      clientId,
      clientName: matchedClient?.name || "General Client",
      clientSubtitle: clientSubtitle || matchedClient?.subtitle || "",
      description: description.trim() || undefined,
      status,
      coverImage:
        coverPreview ||
        createSampleImageSvg(
          name.trim(),
          ["#1e293b", "#334155", "#475569"],
          matchedProject?.name || "Project Concept"
        ),
      createdBy: "Jenny Wilson",
    };

    onSubmit(input);
  };

  return (
    <div
      className="mb-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-mb-title"
    >
      <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-modal-header">
          <div>
            <h2 id="create-mb-title" className="mb-modal-title">
              New Mood Board
            </h2>
            <p className="mb-modal-subtitle">
              Create a new design presentation workspace for your project concepts.
            </p>
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-modal-body">
            {/* Mood Board Name */}
            <div className="mb-form-group">
              <label htmlFor="create-mb-name" className="mb-form-label">
                Mood Board Name <span className="mb-form-req">*</span>
              </label>
              <input
                id="create-mb-name"
                type="text"
                className={`mb-form-input ${nameError ? "has-error" : ""}`}
                placeholder="e.g. Modern Minimalist Living"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                autoFocus
              />
              {nameError && <span className="mb-form-error">{nameError}</span>}
            </div>

            {/* Project Selector */}
            <div className="mb-form-group">
              <label htmlFor="create-mb-project" className="mb-form-label">
                Associated Project <span className="mb-form-req">*</span>
              </label>
              <select
                id="create-mb-project"
                className={`mb-form-select ${projectError ? "has-error" : ""}`}
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, project: true }))}
              >
                <option value="">Select a project...</option>
                {MOCK_PROJECTS.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
              {projectError && <span className="mb-form-error">{projectError}</span>}
            </div>

            {/* Client Selector */}
            <div className="mb-form-group">
              <label htmlFor="create-mb-client" className="mb-form-label">
                Client <span className="mb-form-req">*</span>
              </label>
              <select
                id="create-mb-client"
                className={`mb-form-select ${clientError ? "has-error" : ""}`}
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, client: true }))}
              >
                <option value="">Select a client...</option>
                {MOCK_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.subtitle ? `(${c.subtitle})` : ""}
                  </option>
                ))}
              </select>
              {clientError && <span className="mb-form-error">{clientError}</span>}
            </div>

            {/* Initial Status */}
            <div className="mb-form-group">
              <label htmlFor="create-mb-status" className="mb-form-label">
                Status
              </label>
              <select
                id="create-mb-status"
                className="mb-form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as MoodBoardStatus)}
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Description */}
            <div className="mb-form-group">
              <label htmlFor="create-mb-desc" className="mb-form-label">
                Description (Optional)
              </label>
              <textarea
                id="create-mb-desc"
                className="mb-form-textarea"
                rows={3}
                placeholder="Brief summary of themes, color palettes, or client requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Cover Image Upload (Optional) */}
            <div className="mb-form-group">
              <label className="mb-form-label">Cover Image (Optional)</label>
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
                  className={`mb-dropzone ${isDragging ? "is-dragging" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                >
                  <UploadCloud size={28} className="mb-dropzone-icon" />
                  <span className="mb-dropzone-text">Click or drag & drop cover image</span>
                  <span className="mb-dropzone-hint">PNG, JPG, or WEBP up to 5MB</span>
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
              Create Mood Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
