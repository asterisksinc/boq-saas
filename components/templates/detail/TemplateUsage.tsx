"use client";

import React, { useState, useEffect } from "react";
import { getTemplateUsage } from "@/lib/api/templates";

type UsageRecord = {
  id: string;
  projectName?: string;
  clientName?: string;
  location?: string;
  usedAt?: string | null;
};

interface TemplateUsageProps {
  templateId: string;
  useCount?: number;
  lastUsedAt?: string | null;
}

export default function TemplateUsage({
  templateId,
  useCount = 42,
  lastUsedAt,
}: TemplateUsageProps) {
  const [usageData, setUsageData] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getTemplateUsage(templateId)
      .then((res: any) => {
        if (mounted && Array.isArray(res?.items)) {
          setUsageData(res.items);
        }
      })
      .catch(() => {
        if (mounted) setUsageData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [templateId]);

  const projectsCreated = usageData.length;

  return (
    <div className="td-usage-tab-wrapper">
      {/* 3 Metric Summary Cards */}
      <div className="td-wf-kpi-grid" style={{ marginBottom: 24 }}>
        <div className="td-wf-kpi-card">
          <span className="label">Total Uses</span>
          <span className="val">{useCount}</span>
          <span className="sub">Across all workspaces</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Projects Created</span>
          <span className="val">{projectsCreated}</span>
          <span className="sub">Active live projects</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Last Used</span>
          <span className="val" style={{ fontSize: 20 }}>
            {lastUsedAt
              ? new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(lastUsedAt))
              : "—"}
          </span>
          <span className="sub">Recent deployment</span>
        </div>
      </div>

      <div className="target-table-container">
        <div className="target-table-scroll">
          <table className="target-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>PROJECT NAME</th>
                <th style={{ width: "25%" }}>CLIENT</th>
                <th style={{ width: "20%" }}>LOCATION</th>
                <th style={{ width: "20%" }}>DATE USED</th>
              </tr>
            </thead>
            <tbody>
              {usageData.map((rec) => (
                <tr key={rec.id} className="target-table-row">
                  <td>
                    <span className="font-semibold text-slate-900 text-sm">
                      {rec.projectName || "Unnamed project"}
                    </span>
                  </td>
                  <td>
                    <span className="text-slate-600 text-sm">{rec.clientName || "—"}</span>
                  </td>
                  <td>
                    <span className="text-slate-500 text-sm">{rec.location || "—"}</span>
                  </td>
                  <td>
                    <span className="text-slate-500 text-xs">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(rec.usedAt || Date.now()))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
