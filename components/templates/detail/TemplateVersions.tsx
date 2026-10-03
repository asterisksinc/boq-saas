"use client";

import React, { useState, useEffect } from "react";
import { getTemplateVersions } from "@/lib/api/templates";
import { mockVersions, MockVersion } from "@/lib/templates/mock-data";

interface TemplateVersionsProps {
  templateId: string;
  currentVersion?: string | number;
  onUpdate?: () => void;
}

export default function TemplateVersions({
  templateId,
  currentVersion = "v3.2",
  onUpdate,
}: TemplateVersionsProps) {
  const [versions, setVersions] = useState<MockVersion[]>(mockVersions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getTemplateVersions(templateId)
      .then((res: any) => {
        if (mounted && res?.items && res.items.length > 0) {
          setVersions(res.items);
        }
      })
      .catch(() => {
        // Retain mock fallback
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [templateId]);

  return (
    <div className="td-versions-tab-wrapper">
      <div className="target-table-container">
        <div className="target-table-scroll">
          <table className="target-table">
            <thead>
              <tr>
                <th style={{ width: "15%" }}>VERSION</th>
                <th style={{ width: "15%" }}>STATUS</th>
                <th style={{ width: "18%" }}>PUBLISHED ON</th>
                <th style={{ width: "20%" }}>PUBLISHED BY</th>
                <th style={{ width: "32%" }}>CHANGE NOTES</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((ver) => (
                <tr key={ver.id} className="target-table-row">
                  <td>
                    <span className="font-semibold text-slate-900 text-sm">
                      {ver.version}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`td-status-pill ${
                        ver.status === "ACTIVE"
                          ? "status-pill-active"
                          : "status-pill-draft"
                      }`}
                    >
                      {ver.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-slate-600 text-xs">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(ver.publishedAt || Date.now()))}
                    </span>
                  </td>
                  <td>
                    <span className="text-slate-700 text-sm">
                      {ver.publishedBy || "Pradhyumn D"}
                    </span>
                  </td>
                  <td>
                    <span className="text-slate-600 text-xs">
                      {ver.changeNote || "Standard version release"}
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
