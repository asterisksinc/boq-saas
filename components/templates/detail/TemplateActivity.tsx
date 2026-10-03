"use client";

import React from "react";
import { Clock } from "lucide-react";
import { mockActivityRecords } from "@/lib/templates/mock-data";

interface TemplateActivityProps {
  templateId: string;
}

export default function TemplateActivity({ templateId }: TemplateActivityProps) {
  const activities = mockActivityRecords;

  return (
    <div className="td-activity-tab-wrapper">
      <div className="td-activity-card">
        <h3 className="td-activity-title">Template Activity Feed</h3>
        <div className="td-activity-timeline">
          {activities.map((act) => (
            <div key={act.id} className="td-activity-item">
              <div className="td-activity-dot" />
              <div className="td-activity-content">
                <div className="td-activity-header">
                  <span className="font-semibold text-slate-900 text-sm">
                    {act.action}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(act.timestamp))}
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-1">{act.description}</p>
                <span className="text-slate-400 text-[11px] mt-1 block">
                  By {act.actor}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
