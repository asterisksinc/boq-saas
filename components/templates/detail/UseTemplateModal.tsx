"use client";

import React, { useState } from "react";
import { X, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjectTemplate } from "@/lib/api/templates";

interface UseTemplateModalProps {
  template: {
    id: string;
    name: string;
  };
  onClose: () => void;
}

export default function UseTemplateModal({
  template,
  onClose,
}: UseTemplateModalProps) {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: Record<string, unknown> = {
        projectName: projectName.trim(),
        clientName: clientName.trim(),
      };
      if (location.trim()) payload.location = location.trim();
      if (startDate) payload.startDate = startDate;
      if (targetCompletionDate) payload.targetCompletionDate = targetCompletionDate;

      const res = await useProjectTemplate(template.id, payload);
      const createdProject = res as any;

      onClose();
      if (createdProject?.projectId) {
        router.push(`/projects/${createdProject.projectId}`);
      } else {
        router.push("/projects");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project from template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div
        className="new-template-modal-card"
        style={{ width: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ntm-header">
          <div className="ntm-title-row">
            <div>
              <h2 className="ntm-title">Use Template</h2>
              <span className="ntm-subtitle">
                Create a new project using &ldquo;{template.name}&rdquo;
              </span>
            </div>
            <button
              type="button"
              className="ntm-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="ntm-body">
          {error && <div className="error-banner">{error}</div>}

          <div className="ntm-field">
            <label className="ntm-label">
              Project Name <span className="ntm-req">*</span>
            </label>
            <input
              type="text"
              className="ntm-input"
              placeholder="e.g. Skyline Residence 14B"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <div className="ntm-field">
            <label className="ntm-label">
              Client Name <span className="ntm-req">*</span>
            </label>
            <input
              type="text"
              className="ntm-input"
              placeholder="e.g. Vikram Malhotra"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

          <div className="ntm-field">
            <label className="ntm-label">Project Location</label>
            <input
              type="text"
              className="ntm-input"
              placeholder="e.g. Bandra West, Mumbai"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="ntm-field">
              <label className="ntm-label">Start Date</label>
              <input
                type="date"
                className="ntm-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="ntm-field">
              <label className="ntm-label">Target Completion</label>
              <input
                type="date"
                className="ntm-input"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
              />
            </div>
          </div>

          <div className="ntm-footer">
            <button
              type="button"
              className="ntm-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ntm-btn-next"
              disabled={loading}
            >
              <Play size={14} />
              <span>{loading ? "Creating..." : "Create Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
