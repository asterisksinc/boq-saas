"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { MOCK_PROJECTS, MOCK_LEADS } from "@/lib/mood-boards/mock-data";

interface MoodBoardBasicDetailsProps {
  name: string;
  projectId: string;
  leadId: string;
  description: string;
  onNameChange: (val: string) => void;
  onProjectChange: (val: string) => void;
  onLeadChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  errors?: {
    name?: string;
    project?: string;
    lead?: string;
  };
}

export default function MoodBoardBasicDetails({
  name,
  projectId,
  leadId,
  description,
  onNameChange,
  onProjectChange,
  onLeadChange,
  onDescriptionChange,
  errors,
}: MoodBoardBasicDetailsProps) {
  return (
    <section className="mb-section-card" aria-labelledby="mb-basic-details-title">
      <h2 id="mb-basic-details-title" className="mb-section-heading">
        Basic Details
      </h2>

      <div className="mb-inner-white-card">
        {/* Field 1: Mood Board Name */}
        <div className="mb-editor-field">
          <label htmlFor="mb-name-input" className="mb-editor-label">
            <span>Mood Board Name</span>
            <span className="mb-required-star">*</span>
          </label>
          <div className="mb-input-wrapper">
            <input
              id="mb-name-input"
              type="text"
              placeholder="Enter Mood Board Name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={`mb-editor-input ${errors?.name ? "error" : ""}`}
            />
          </div>
          {errors?.name && <p className="mb-editor-error-msg">{errors.name}</p>}
        </div>

        {/* Field 2 Row: Project & Lead (Frame 2147225454) */}
        <div className="mb-editor-row">
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

          {/* Lead Dropdown */}
          <div className="mb-editor-field flex-1">
            <label htmlFor="mb-lead-select" className="mb-editor-label">
              <span>Lead</span>
              <span className="mb-required-star">*</span>
            </label>
            <div className="mb-select-wrapper">
              <select
                id="mb-lead-select"
                value={leadId}
                onChange={(e) => onLeadChange(e.target.value)}
                className={`mb-editor-select ${errors?.lead ? "error" : ""}`}
              >
                <option value="">Select Lead</option>
                {MOCK_LEADS.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} {lead.role ? `(${lead.role})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="mb-select-chevron" />
            </div>
            {errors?.lead && <p className="mb-editor-error-msg">{errors.lead}</p>}
          </div>
        </div>

        {/* Field 3: Description */}
        <div className="mb-editor-field">
          <label htmlFor="mb-desc-input" className="mb-editor-label">
            <span>Description</span>
          </label>
          <div className="mb-input-wrapper">
            <input
              id="mb-desc-input"
              type="text"
              placeholder="Enter description..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="mb-editor-input"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
