"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UploadCloud,
  X,
  Check,
  Plus,
  Star,
  Image as ImageIcon,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  CreateMoodBoardInput,
  MoodBoardImage,
  MoodBoardStatus,
  MoodBoardTemplate,
} from "@/lib/mood-boards/types";
import {
  MOCK_PROJECTS,
  MOCK_CLIENTS,
  createSampleImageSvg,
} from "@/lib/mood-boards/mock-data";
import { generateId } from "@/lib/mood-boards/helpers";
import MoodBoardStatusBadge from "./MoodBoardStatusBadge";

interface NewMoodBoardEditorProps {
  initialTemplate?: MoodBoardTemplate | null;
  onCancel: () => void;
  onSubmit: (input: CreateMoodBoardInput) => Promise<void>;
}

export default function NewMoodBoardEditor({
  initialTemplate,
  onCancel,
  onSubmit,
}: NewMoodBoardEditorProps) {
  const router = useRouter();

  // Form State
  const [name, setName] = useState(initialTemplate ? `${initialTemplate.name} Concept` : "");
  const [projectId, setProjectId] = useState(MOCK_PROJECTS[0]?.id || "");
  const [clientId, setClientId] = useState(MOCK_PROJECTS[0]?.defaultClientId || MOCK_CLIENTS[0]?.id || "");
  const [clientSubtitle, setClientSubtitle] = useState(MOCK_PROJECTS[0]?.defaultClientSubtitle || "");
  const [description, setDescription] = useState(initialTemplate?.description || "");
  const [status, setStatus] = useState<MoodBoardStatus>("DRAFT");
  const [images, setImages] = useState<MoodBoardImage[]>(initialTemplate?.images || []);
  const [coverImage, setCoverImage] = useState<string>(
    initialTemplate?.coverImage || (initialTemplate?.images?.[0]?.previewUrl ?? "")
  );

  const [touched, setTouched] = useState({
    name: false,
    project: false,
    client: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  // Update client when project changes
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setProjectId(pId);
    setTouched((prev) => ({ ...prev, project: true }));

    const selectedProj = MOCK_PROJECTS.find((p) => p.id === pId);
    if (selectedProj) {
      setClientId(selectedProj.defaultClientId);
      setClientSubtitle(selectedProj.defaultClientSubtitle || "");
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    setClientId(cId);
    setTouched((prev) => ({ ...prev, client: true }));

    const selectedCli = MOCK_CLIENTS.find((c) => c.id === cId);
    if (selectedCli) {
      setClientSubtitle(selectedCli.subtitle || "");
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      objectUrlsRef.current = [];
    };
  }, []);

  // Handle uploaded files
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: MoodBoardImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(objectUrl);

      newImages.push({
        id: `img-upload-${generateId()}`,
        name: file.name,
        previewUrl: objectUrl,
        fileType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
    });

    if (newImages.length > 0) {
      setImages((prev) => {
        const combined = [...prev, ...newImages];
        if (!coverImage) {
          setCoverImage(combined[0].previewUrl);
        }
        return combined;
      });
    }
  };

  // Add sample placeholder swatch images
  const handleAddSampleImages = () => {
    const sample1 = createSampleImageSvg(
      `${name || "Concept"} - Palette`,
      ["#1e293b", "#3b82f6", "#93c5fd"],
      "Spec Swatch"
    );
    const sample2 = createSampleImageSvg(
      `${name || "Concept"} - Materials`,
      ["#78350f", "#d97706", "#fef3c7"],
      "Wood & Brass"
    );
    const sample3 = createSampleImageSvg(
      `${name || "Concept"} - Textiles`,
      ["#064e3b", "#059669", "#a7f3d0"],
      "Textiles & Upholstery"
    );

    const generated: MoodBoardImage[] = [
      {
        id: `img-sample-${generateId()}`,
        name: "Palette-Scheme.svg",
        previewUrl: sample1,
        fileType: "image/svg+xml",
        size: 154000,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: `img-sample-${generateId()}`,
        name: "Material-Spec.svg",
        previewUrl: sample2,
        fileType: "image/svg+xml",
        size: 162000,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: `img-sample-${generateId()}`,
        name: "Textile-Swatch.svg",
        previewUrl: sample3,
        fileType: "image/svg+xml",
        size: 158000,
        uploadedAt: new Date().toISOString(),
      },
    ];

    setImages((prev) => {
      const combined = [...prev, ...generated];
      if (!coverImage && combined.length > 0) {
        setCoverImage(combined[0].previewUrl);
      }
      return combined;
    });
  };

  const handleRemoveImage = (imgId: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imgId);
      // If we removed the cover image, reset cover image to first item or blank
      const removed = prev.find((img) => img.id === imgId);
      if (removed && removed.previewUrl === coverImage) {
        setCoverImage(filtered[0]?.previewUrl || "");
      }
      return filtered;
    });
  };

  const handleSetCover = (url: string) => {
    setCoverImage(url);
  };

  const nameError = touched.name && !name.trim() ? "Mood board title is required" : "";
  const projectError = touched.project && !projectId ? "Please select a project" : "";
  const clientError = touched.client && !clientId ? "Please select a client" : "";

  const isFormValid = Boolean(name.trim() && projectId && clientId);

  const handleSubmitInternal = async (targetStatus?: MoodBoardStatus) => {
    setTouched({ name: true, project: true, client: true });
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const proj = MOCK_PROJECTS.find((p) => p.id === projectId);
      const cli = MOCK_CLIENTS.find((c) => c.id === clientId);

      await onSubmit({
        name: name.trim(),
        projectId,
        projectName: proj?.name || "Project",
        clientId,
        clientName: cli?.name || "Client",
        clientSubtitle: clientSubtitle.trim() || cli?.subtitle,
        description: description.trim(),
        status: targetStatus || status,
        coverImage: coverImage || images[0]?.previewUrl || "",
        images,
        createdBy: "Jenny Wilson",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProject = MOCK_PROJECTS.find((p) => p.id === projectId);
  const currentClient = MOCK_CLIENTS.find((c) => c.id === clientId);

  return (
    <div className="mb-new-editor">
      {/* Top Bar / Navigation */}
      <div className="mb-new-topbar">
        <button
          type="button"
          onClick={onCancel}
          className="mb-back-link"
        >
          <ArrowLeft size={16} />
          <span>Back to Mood Boards</span>
        </button>

        {initialTemplate && (
          <div className="mb-template-mode-pill">
            <Sparkles size={14} />
            <span>Using Template: <strong>{initialTemplate.name}</strong></span>
          </div>
        )}
      </div>

      {/* Editor Header */}
      <div className="mb-editor-header">
        <div>
          <h1 className="mb-editor-title">
            {initialTemplate ? `Create from ${initialTemplate.name}` : "Create New Mood Board"}
          </h1>
          <p className="mb-editor-subtitle">
            Configure your mood board details, assign it to a client project, and curate your visual materials.
          </p>
        </div>

        <div className="mb-editor-header-actions">
          <button
            type="button"
            className="mb-btn mb-btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mb-btn mb-btn-secondary"
            onClick={() => handleSubmitInternal("DRAFT")}
            disabled={isSubmitting}
          >
            Save as Draft
          </button>
          <button
            type="button"
            className="mb-btn mb-btn-primary"
            onClick={() => handleSubmitInternal()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Mood Board"}
          </button>
        </div>
      </div>

      {/* Editor Layout (Grid: Form & Canvas / Preview Sidebar) */}
      <div className="mb-editor-grid">
        {/* Left Column: Form & Images */}
        <div className="mb-editor-main">
          {/* Card 1: Basic Information */}
          <section className="mb-form-card">
            <h2 className="mb-form-card-title">1. Mood Board Details</h2>

            <div className="mb-form-group">
              <label htmlFor="mb-name-input" className="mb-label required">
                Mood Board Name
              </label>
              <input
                id="mb-name-input"
                type="text"
                placeholder="e.g. Master Living Room Material Palette"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setTouched((prev) => ({ ...prev, name: true }));
                }}
                className={`mb-input ${nameError ? "error" : ""}`}
              />
              {nameError && <p className="mb-field-error">{nameError}</p>}
            </div>

            <div className="mb-form-row">
              <div className="mb-form-group">
                <label htmlFor="mb-project-select" className="mb-label required">
                  Project
                </label>
                <select
                  id="mb-project-select"
                  value={projectId}
                  onChange={handleProjectChange}
                  className={`mb-select ${projectError ? "error" : ""}`}
                >
                  <option value="">Select Project</option>
                  {MOCK_PROJECTS.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
                {projectError && <p className="mb-field-error">{projectError}</p>}
              </div>

              <div className="mb-form-group">
                <label htmlFor="mb-client-select" className="mb-label required">
                  Client
                </label>
                <select
                  id="mb-client-select"
                  value={clientId}
                  onChange={handleClientChange}
                  className={`mb-select ${clientError ? "error" : ""}`}
                >
                  <option value="">Select Client</option>
                  {MOCK_CLIENTS.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.name} {cli.subtitle ? `(${cli.subtitle})` : ""}
                    </option>
                  ))}
                </select>
                {clientError && <p className="mb-field-error">{clientError}</p>}
              </div>
            </div>

            <div className="mb-form-row">
              <div className="mb-form-group">
                <label htmlFor="mb-client-subtitle" className="mb-label">
                  Client Subtitle / Category
                </label>
                <input
                  id="mb-client-subtitle"
                  type="text"
                  placeholder="e.g. Commercial / Residential Luxury"
                  value={clientSubtitle}
                  onChange={(e) => setClientSubtitle(e.target.value)}
                  className="mb-input"
                />
              </div>

              <div className="mb-form-group">
                <label htmlFor="mb-status-select" className="mb-label">
                  Initial Status
                </label>
                <select
                  id="mb-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MoodBoardStatus)}
                  className="mb-select"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="mb-form-group">
              <label htmlFor="mb-desc-input" className="mb-label">
                Description & Design Intent
              </label>
              <textarea
                id="mb-desc-input"
                rows={3}
                placeholder="Describe the architectural concept, color temperature, material textures, and mood goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mb-textarea"
              />
            </div>
          </section>

          {/* Card 2: Visual Assets & Images */}
          <section className="mb-form-card">
            <div className="mb-form-card-header">
              <div>
                <h2 className="mb-form-card-title">2. Visual Assets & Swatches</h2>
                <p className="mb-form-card-subtitle">
                  Upload design references, material swatches, 3D renders, and finish photos ({images.length} added).
                </p>
              </div>

              <div className="mb-form-card-header-actions">
                <button
                  type="button"
                  className="mb-text-action-btn"
                  onClick={handleAddSampleImages}
                >
                  <Sparkles size={14} />
                  <span>+ Add Sample Swatches</span>
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div
              className={`mb-editor-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <UploadCloud size={32} className="mb-dropzone-icon" />
              <p className="mb-dropzone-title">Click to upload or drag and drop images</p>
              <p className="mb-dropzone-sub">Supports PNG, JPG, WEBP, SVG up to 10MB each</p>
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
              <div className="mb-editor-images-grid">
                {images.map((img) => {
                  const isCover = coverImage === img.previewUrl;
                  return (
                    <div
                      key={img.id}
                      className={`mb-editor-img-card ${isCover ? "is-cover" : ""}`}
                    >
                      <div className="mb-editor-img-wrapper">
                        <img
                          src={img.previewUrl}
                          alt={img.name}
                          className="mb-editor-img-thumb"
                        />
                        {isCover && (
                          <div className="mb-editor-cover-badge">
                            <Star size={11} fill="#FFFFFF" />
                            <span>Cover</span>
                          </div>
                        )}
                        <button
                          type="button"
                          className="mb-editor-img-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img.id);
                          }}
                          aria-label={`Remove ${img.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="mb-editor-img-footer">
                        <span className="mb-editor-img-name" title={img.name}>
                          {img.name}
                        </span>
                        {!isCover && (
                          <button
                            type="button"
                            className="mb-btn-set-cover"
                            onClick={() => handleSetCover(img.previewUrl)}
                          >
                            Set Cover
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Live Card Preview & Info */}
        <div className="mb-editor-sidebar">
          {/* Live Card Preview */}
          <div className="mb-sidebar-card">
            <h3 className="mb-sidebar-title">Dashboard Card Preview</h3>
            <p className="mb-sidebar-desc">
              This preview shows how your new mood board will be presented across the dashboard grid.
            </p>

            <div className="mb-card mb-preview-card">
              <div className="mb-card-media">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={name || "Preview"}
                    className="mb-card-img"
                  />
                ) : (
                  <div className="mb-preview-empty-media">
                    <ImageIcon size={36} />
                    <span>No Cover Selected</span>
                  </div>
                )}
                <div className="mb-card-media-overlay" />
                <div className="mb-card-status-badge">
                  <MoodBoardStatusBadge status={status} />
                </div>
              </div>

              <div className="mb-card-body">
                <div className="mb-card-header-row">
                  <h4 className="mb-card-title">
                    {name || "Untitled Mood Board"}
                  </h4>
                </div>

                <p className="mb-card-desc">
                  {description || "No description provided yet."}
                </p>

                <div className="mb-card-meta">
                  <div className="mb-meta-item">
                    <span className="mb-meta-label">Project:</span>
                    <span className="mb-meta-value">
                      {currentProject?.name || "Not assigned"}
                    </span>
                  </div>
                  <div className="mb-meta-item">
                    <span className="mb-meta-label">Client:</span>
                    <span className="mb-meta-value">
                      {currentClient?.name || "Not assigned"}
                    </span>
                  </div>
                  <div className="mb-meta-item">
                    <span className="mb-meta-label">Assets:</span>
                    <span className="mb-meta-value">{images.length} images</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick tips */}
          <div className="mb-sidebar-card mb-tips-card">
            <div className="mb-tips-header">
              <Info size={16} />
              <h4>Designer Tips</h4>
            </div>
            <ul className="mb-tips-list">
              <li>Upload at least one primary perspective shot to serve as the cover.</li>
              <li>Include texture swatches for timber, marble, metals, and textiles.</li>
              <li>Draft boards can be edited and refined before sharing with clients.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
