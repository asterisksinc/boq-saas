"use client";

import React from "react";

interface TemplateActivityProps {
  templateId: string;
}

export default function TemplateActivity({ templateId }: TemplateActivityProps) {
  return (
    <div className="td-activity-tab-wrapper">
      <div className="td-activity-card">
        <h3 className="td-activity-title">Template Activity Feed</h3>
        <div className="td-activity-timeline">
          <div className="td-empty-state">No activity recorded for this template yet.</div>
        </div>
      </div>
    </div>
  );
}
