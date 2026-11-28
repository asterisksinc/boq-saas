"use client";

import React, { useMemo } from "react";
import { ChevronDown, FolderKanban, UserCheck } from "lucide-react";
import { MOCK_PROJECTS, MOCK_CLIENTS, MOCK_LEADS } from "@/lib/mood-boards/mock-data";

export interface MoodBoardBasicDetailsProps {
  name: string;
  projectId: string;
  clientId?: string;
  leadId?: string;
  description: string;
  onNameChange: (val: string) => void;
  onProjectChange: (val: string) => void;
  onClientChange?: (val: string) => void;
  onLeadChange?: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  errors?: {
    name?: string;
    project?: string;
    client?: string;
    lead?: string;
  };
}

export default function MoodBoardBasicDetails({
  name,
  projectId,
  clientId,
  leadId,
  description,
  onNameChange,
  onProjectChange,
  onClientChange,
  onLeadChange,
  onDescriptionChange,
  errors,
}: MoodBoardBasicDetailsProps) {
  // Resolve client options based on selected project
  const selectedProject = useMemo(() => {
    return MOCK_PROJECTS.find((p) => p.id === projectId);
  }, [projectId]);

  const clientOptions = useMemo(() => {
    if (!selectedProject) return MOCK_CLIENTS;
    // Highlight or filter default client of this project, but keep available options
    return MOCK_CLIENTS;
  }, [selectedProject]);

  return (
    <section className="basic-details-section mb-section-card" aria-labelledby="mb-basic-details-title">
      <div className="mb-section-header">
        <h2 id="mb-basic-details-title" className="mb-section-heading">
          Basic Details
        </h2>
      </div>

      <div className="basic-details-card mb-inner-white-card">
        {/* Field 1: Moodboard Name * (Full Width) */}
        <div className="mb-editor-field">
          <label htmlFor="mb-name-input" className="mb-editor-label">
            <span>Moodboard Name</span>
            <span className="mb-required-star">*</span>
          </label>
          <div className="mb-input-wrapper">
            <input
              id="mb-name-input"
              type="text"
              placeholder="Enter moodboard name"
              data-alt-placeholder="Enter Mood Board Name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={`mb-editor-input ${errors?.name ? "error" : ""}`}
            />
          </div>
          {errors?.name && <p className="mb-editor-error-msg">{errors.name}</p>}
        </div>

        {/* Field 2 Row: Project * & Client * (Two-Column Layout) */}
        <div className="two-column-row mb-two-col-row mb-editor-row">
          {/* Project Dropdown */}
          <div className="mb-editor-field flex-1">
            <label htmlFor="mb-project-select" className="mb-editor-label">
              <span>Project</span>
              <span className="mb-required-star">*</span>
            </label>
            <div className="mb-select-wrapper">
              <select
                id="mb-project-select"
                value={projectId}
                onChange={(e) => onProjectChange(e.target.value)}
                className={`mb-editor-select ${errors?.project ? "error" : ""}`}
              >
                <option value="">Select Project</option>
                {MOCK_PROJECTS.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="mb-select-chevron" />
            </div>
            {errors?.project && <p className="mb-editor-error-msg">{errors.project}</p>}
          </div>

          {/* Client Dropdown */}
          <div className="mb-editor-field flex-1">
            <label htmlFor="mb-client-select" className="mb-editor-label">
              <span>Client</span>
              <span className="mb-required-star">*</span>
            </label>
            <div className="mb-select-wrapper">
              <select
                id="mb-client-select"
                value={clientId || (selectedProject ? selectedProject.defaultClientId : "")}
                onChange={(e) => onClientChange?.(e.target.value)}
                className={`mb-editor-select ${errors?.client ? "error" : ""}`}
              >
                <option value="">Select Client</option>
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.subtitle ? `(${client.subtitle})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="mb-select-chevron" />
            </div>
            {errors?.client && <p className="mb-editor-error-msg">{errors.client}</p>}
          </div>
        </div>

        {/* Optional Lead Selector for Team Integration */}
        {onLeadChange && (
          <div className="mb-editor-field" style={{ display: "none" }}>
            <label htmlFor="mb-lead-select" className="mb-editor-label">
              <span>Lead</span>
              <span className="mb-required-star">*</span>
            </label>
            <div className="mb-select-wrapper">
              <select
                id="mb-lead-select"
                value={leadId || ""}
                onChange={(e) => onLeadChange(e.target.value)}
                className="mb-editor-select"
              >
                <option value="">Select Lead</option>
                {MOCK_LEADS.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Field 3: Description (Multiline Textarea, Full Width) */}
        <div className="mb-editor-field moodboard-description-field">
          <label htmlFor="mb-desc-input" className="mb-editor-label">
            <span>Description</span>
            <span className="mb-optional-badge">(Optional)</span>
          </label>
          <div className="moodboard-description mb-textarea-wrapper">
            <textarea
              id="mb-desc-input"
              rows={3}
              placeholder="Describe the concept, theme, or design direction."
              data-alt-placeholder="Enter description..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="mb-editor-textarea"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
